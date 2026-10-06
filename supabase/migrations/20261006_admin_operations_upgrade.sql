-- Admin operations hardening and workflow upgrades.

-- 1) Explicit permission rows override role defaults (including allowed=false).
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_super_admin(_user_id)
    OR COALESCE(
      (
        SELECT up.allowed
        FROM public.user_permissions up
        WHERE up.user_id = _user_id
          AND up.permission = _permission
        LIMIT 1
      ),
      (
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = _user_id AND role::text = 'property_manager'
        )
        AND _permission IN (
          'view_dashboard',
          'manage_bookings',
          'manage_properties',
          'manage_availability',
          'manage_pricing',
          'manage_reviews',
          'manage_amenities'
        )
      )
      OR (
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = _user_id AND role::text = 'staff'
        )
        AND _permission = 'view_dashboard'
      ),
      false
    );
$$;

-- 2) Audit log for important admin-side changes.
CREATE TABLE IF NOT EXISTS public.admin_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "super admins can read activity log" ON public.admin_activity_log;
CREATE POLICY "super admins can read activity log"
ON public.admin_activity_log
FOR SELECT TO authenticated
USING (public.is_super_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.log_admin_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  row_data jsonb;
  row_id text;
  prop_id uuid;
BEGIN
  row_data := CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END;
  row_id := COALESCE(row_data->>'id', row_data->>'user_id', row_data->>'email');
  prop_id := NULLIF(row_data->>'property_id','')::uuid;

  IF prop_id IS NULL AND TG_TABLE_NAME = 'bookings' THEN
    prop_id := NULLIF(row_data->>'property_id','')::uuid;
  END IF;

  INSERT INTO public.admin_activity_log(actor_id, action, entity_type, entity_id, property_id, details)
  VALUES (
    auth.uid(),
    lower(TG_OP),
    TG_TABLE_NAME,
    row_id,
    prop_id,
    jsonb_build_object(
      'old', CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN to_jsonb(OLD) ELSE NULL END,
      'new', CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN to_jsonb(NEW) ELSE NULL END
    )
  );

  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'bookings','properties','blocked_dates','pricing_rules','discount_codes',
    'reviews','user_roles','user_permissions','user_property_assignments','admin_invites'
  ]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS audit_%I ON public.%I', tbl, tbl);
    EXECUTE format(
      'CREATE TRIGGER audit_%I AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.log_admin_activity()',
      tbl, tbl
    );
  END LOOP;
END $$;

-- 3) In-app admin notifications.
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
  review_id uuid REFERENCES public.reviews(id) ON DELETE CASCADE,
  read_by uuid[] NOT NULL DEFAULT '{}'::uuid[],
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff can read scoped admin notifications" ON public.admin_notifications;
CREATE POLICY "staff can read scoped admin notifications"
ON public.admin_notifications
FOR SELECT TO authenticated
USING (
  public.is_staff(auth.uid())
  AND (
    property_id IS NULL
    OR public.has_property_access(auth.uid(), property_id)
    OR public.is_super_admin(auth.uid())
  )
);

DROP POLICY IF EXISTS "staff can mark notifications read" ON public.admin_notifications;
CREATE POLICY "staff can mark notifications read"
ON public.admin_notifications
FOR UPDATE TO authenticated
USING (
  public.is_staff(auth.uid())
  AND (
    property_id IS NULL
    OR public.has_property_access(auth.uid(), property_id)
    OR public.is_super_admin(auth.uid())
  )
)
WITH CHECK (
  public.is_staff(auth.uid())
  AND (
    property_id IS NULL
    OR public.has_property_access(auth.uid(), property_id)
    OR public.is_super_admin(auth.uid())
  )
);

CREATE OR REPLACE FUNCTION public.create_admin_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  prop_name text;
BEGIN
  IF TG_TABLE_NAME = 'bookings' AND TG_OP = 'INSERT' THEN
    SELECT name INTO prop_name FROM public.properties WHERE id = NEW.property_id;
    INSERT INTO public.admin_notifications(type,title,body,property_id,booking_id)
    VALUES (
      'booking',
      'New booking request',
      NEW.guest_name || ' requested ' || COALESCE(prop_name,'a property') || ' for ' || NEW.check_in || ' to ' || NEW.check_out || '.',
      NEW.property_id,
      NEW.id
    );
  ELSIF TG_TABLE_NAME = 'bookings' AND TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    SELECT name INTO prop_name FROM public.properties WHERE id = NEW.property_id;
    INSERT INTO public.admin_notifications(type,title,body,property_id,booking_id)
    VALUES (
      'booking_status',
      'Booking status changed',
      NEW.reference || ' at ' || COALESCE(prop_name,'property') || ' is now ' || replace(NEW.status::text,'_',' ') || '.',
      NEW.property_id,
      NEW.id
    );
  ELSIF TG_TABLE_NAME = 'reviews' AND TG_OP = 'INSERT' THEN
    SELECT name INTO prop_name FROM public.properties WHERE id = NEW.property_id;
    INSERT INTO public.admin_notifications(type,title,body,property_id,review_id)
    VALUES (
      'review',
      'New guest review',
      NEW.guest_name || ' left a ' || NEW.rating || '/5 review for ' || COALESCE(prop_name,'a property') || '.',
      NEW.property_id,
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_admin_booking_insert ON public.bookings;
CREATE TRIGGER notify_admin_booking_insert
AFTER INSERT ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.create_admin_notification();

DROP TRIGGER IF EXISTS notify_admin_booking_status ON public.bookings;
CREATE TRIGGER notify_admin_booking_status
AFTER UPDATE OF status ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.create_admin_notification();

DROP TRIGGER IF EXISTS notify_admin_review_insert ON public.reviews;
CREATE TRIGGER notify_admin_review_insert
AFTER INSERT ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.create_admin_notification();

-- 4) Manual admin booking creation reuses the canonical booking engine.
CREATE OR REPLACE FUNCTION public.admin_create_booking(
  p_property_id uuid,
  p_check_in date,
  p_check_out date,
  p_guests integer,
  p_guest_name text,
  p_guest_email text,
  p_guest_phone text,
  p_notes text DEFAULT NULL,
  p_discount_code text DEFAULT NULL,
  p_pay_deposit boolean DEFAULT false
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  property_slug text;
  booking_ref text;
BEGIN
  IF auth.uid() IS NULL
     OR NOT public.has_permission(auth.uid(), 'manage_bookings')
     OR NOT public.has_property_access(auth.uid(), p_property_id) THEN
    RAISE EXCEPTION 'You do not have access to create bookings for this property.';
  END IF;

  SELECT slug INTO property_slug
  FROM public.properties
  WHERE id = p_property_id
  LIMIT 1;

  IF property_slug IS NULL THEN
    RAISE EXCEPTION 'Property not found.';
  END IF;

  booking_ref := public.create_booking_request(
    property_slug,
    p_check_in,
    p_check_out,
    p_guests,
    p_discount_code,
    p_pay_deposit,
    p_guest_name,
    p_guest_email,
    p_guest_phone,
    p_notes
  );

  UPDATE public.bookings
  SET user_id = NULL,
      status = 'confirmed',
      notes = concat_ws(E'\n', nullif(notes,''), 'Created manually by admin.')
  WHERE reference = booking_ref;

  RETURN booking_ref;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_create_booking(uuid,date,date,integer,text,text,text,text,text,boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_create_booking(uuid,date,date,integer,text,text,text,text,text,boolean) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_create_booking(uuid,date,date,integer,text,text,text,text,text,boolean) TO authenticated;

-- Existing properties keep today's contact details; future listings should store contacts explicitly.
UPDATE public.properties
SET phone = COALESCE(phone, '+2347058860184'),
    whatsapp = COALESCE(whatsapp, '+2347058860184'),
    email = COALESCE(email, 'tradegateconcept@gmail.com')
WHERE phone IS NULL OR whatsapp IS NULL OR email IS NULL;
