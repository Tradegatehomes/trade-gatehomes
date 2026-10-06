-- Allow Super Admins to add staff/admin users by email without a service-role key.
-- New emails receive a Supabase magic-link invitation; existing users are promoted immediately.

CREATE TABLE IF NOT EXISTS public.admin_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  role public.app_role NOT NULL CHECK (role::text IN ('super_admin', 'property_manager', 'staff')),
  invited_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  UNIQUE (email)
);

ALTER TABLE public.admin_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "super admins can view admin invites" ON public.admin_invites;
CREATE POLICY "super admins can view admin invites"
ON public.admin_invites
FOR SELECT TO authenticated
USING (public.is_super_admin(auth.uid()));

REVOKE ALL ON TABLE public.admin_invites FROM anon;
REVOKE ALL ON TABLE public.admin_invites FROM authenticated;
GRANT SELECT ON TABLE public.admin_invites TO authenticated;

CREATE OR REPLACE FUNCTION public.invite_admin_by_email(
  p_email text,
  p_role public.app_role DEFAULT 'staff'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_email text := lower(trim(p_email));
  v_user_id uuid;
  v_role_id uuid;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only a Super Admin can add admin users.';
  END IF;

  IF v_email IS NULL OR v_email = '' OR position('@' in v_email) < 2 THEN
    RAISE EXCEPTION 'Enter a valid email address.';
  END IF;

  IF p_role::text NOT IN ('super_admin', 'property_manager', 'staff') THEN
    RAISE EXCEPTION 'That role cannot be invited to the admin area.';
  END IF;

  SELECT p.id
  INTO v_user_id
  FROM public.profiles p
  WHERE lower(p.email) = v_email
  LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    DELETE FROM public.user_roles WHERE user_id = v_user_id;

    INSERT INTO public.user_roles(user_id, role)
    VALUES (v_user_id, p_role)
    RETURNING id INTO v_role_id;

    DELETE FROM public.admin_invites WHERE email = v_email;

    RETURN jsonb_build_object(
      'status', 'assigned',
      'email', v_email,
      'user_id', v_user_id,
      'role', p_role::text
    );
  END IF;

  INSERT INTO public.admin_invites(email, role, invited_by, created_at, expires_at, accepted_at)
  VALUES (v_email, p_role, auth.uid(), now(), now() + interval '7 days', NULL)
  ON CONFLICT (email) DO UPDATE
  SET role = EXCLUDED.role,
      invited_by = EXCLUDED.invited_by,
      created_at = now(),
      expires_at = now() + interval '7 days',
      accepted_at = NULL;

  RETURN jsonb_build_object(
    'status', 'pending',
    'email', v_email,
    'role', p_role::text
  );
END;
$$;

REVOKE ALL ON FUNCTION public.invite_admin_by_email(text, public.app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.invite_admin_by_email(text, public.app_role) FROM anon;
GRANT EXECUTE ON FUNCTION public.invite_admin_by_email(text, public.app_role) TO authenticated;

CREATE OR REPLACE FUNCTION public.apply_pending_admin_invite()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_invite public.admin_invites%ROWTYPE;
BEGIN
  IF NEW.email IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT *
  INTO v_invite
  FROM public.admin_invites
  WHERE email = lower(NEW.email)
    AND accepted_at IS NULL
    AND expires_at > now()
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  DELETE FROM public.user_roles WHERE user_id = NEW.id;
  INSERT INTO public.user_roles(user_id, role)
  VALUES (NEW.id, v_invite.role);

  INSERT INTO public.profiles(id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name')
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email;

  UPDATE public.admin_invites
  SET accepted_at = now()
  WHERE id = v_invite.id;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.apply_pending_admin_invite() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.apply_pending_admin_invite() FROM anon;
REVOKE ALL ON FUNCTION public.apply_pending_admin_invite() FROM authenticated;

DROP TRIGGER IF EXISTS on_auth_user_apply_admin_invite ON auth.users;
CREATE TRIGGER on_auth_user_apply_admin_invite
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.apply_pending_admin_invite();
