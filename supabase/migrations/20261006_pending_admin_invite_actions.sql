-- Allow Super Admins to cancel pending admin invitations.
CREATE OR REPLACE FUNCTION public.cancel_admin_invite(p_invite_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Super Admin access required';
  END IF;

  DELETE FROM public.admin_invites
  WHERE id = p_invite_id
    AND accepted_at IS NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_admin_invite(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cancel_admin_invite(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.cancel_admin_invite(uuid) TO authenticated;
