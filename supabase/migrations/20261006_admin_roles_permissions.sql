-- Role and permission management for TradeGate admin
-- Super admins can assign roles, granular permissions and property scope.

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'staff';

CREATE TABLE IF NOT EXISTS public.user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission text NOT NULL CHECK (permission IN (
    'view_dashboard',
    'manage_bookings',
    'manage_properties',
    'manage_availability',
    'manage_pricing',
    'manage_payments',
    'manage_discounts',
    'manage_reviews',
    'manage_amenities',
    'manage_users'
  )),
  allowed boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, permission)
);

CREATE TABLE IF NOT EXISTS public.user_property_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, property_id)
);

ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_property_assignments ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text = 'super_admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text IN ('super_admin', 'property_manager', 'staff')
  );
$$;

CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_super_admin(_user_id)
    OR EXISTS (
      SELECT 1
      FROM public.user_permissions
      WHERE user_id = _user_id
        AND permission = _permission
        AND allowed = true
    )
    OR (
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
    );
$$;

CREATE OR REPLACE FUNCTION public.has_property_access(_user_id uuid, _property_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_super_admin(_user_id)
    OR EXISTS (
      SELECT 1
      FROM public.user_property_assignments
      WHERE user_id = _user_id
        AND property_id = _property_id
    );
$$;

GRANT EXECUTE ON FUNCTION public.is_super_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_permission(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_property_access(uuid, uuid) TO authenticated;

DROP POLICY IF EXISTS "super admins can view all profiles" ON public.profiles;
CREATE POLICY "super admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid() OR public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "users can read own role or super admins all roles" ON public.user_roles;
CREATE POLICY "users can read own role or super admins all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "super admins can insert roles" ON public.user_roles;
CREATE POLICY "super admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "super admins can update roles" ON public.user_roles;
CREATE POLICY "super admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "super admins can delete roles" ON public.user_roles;
CREATE POLICY "super admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "users can read own permissions or super admins all permissions" ON public.user_permissions;
CREATE POLICY "users can read own permissions or super admins all permissions"
ON public.user_permissions
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "super admins can manage permissions" ON public.user_permissions;
CREATE POLICY "super admins can manage permissions"
ON public.user_permissions
FOR ALL
TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "users can read own assignments or super admins all assignments" ON public.user_property_assignments;
CREATE POLICY "users can read own assignments or super admins all assignments"
ON public.user_property_assignments
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "super admins can manage property assignments" ON public.user_property_assignments;
CREATE POLICY "super admins can manage property assignments"
ON public.user_property_assignments
FOR ALL
TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.prevent_last_super_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.role::text = 'super_admin'
     AND (TG_OP = 'DELETE' OR NEW.role::text <> 'super_admin') THEN
    IF (SELECT count(*) FROM public.user_roles WHERE role::text = 'super_admin') <= 1 THEN
      RAISE EXCEPTION 'The last super admin cannot be removed.';
    END IF;
  END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

DROP TRIGGER IF EXISTS protect_last_super_admin ON public.user_roles;
CREATE TRIGGER protect_last_super_admin
BEFORE DELETE OR UPDATE OF role ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_last_super_admin();

-- Granular restrictions layered on top of existing permissive RLS policies.
-- Guests are unaffected; staff members must hold the relevant permission and property assignment.

DROP POLICY IF EXISTS "staff property select scope" ON public.properties;
CREATE POLICY "staff property select scope"
ON public.properties AS RESTRICTIVE
FOR SELECT TO authenticated
USING (
  NOT public.is_staff(auth.uid())
  OR (
    (public.has_permission(auth.uid(), 'view_dashboard') OR public.has_permission(auth.uid(), 'manage_properties'))
    AND public.has_property_access(auth.uid(), id)
  )
);

DROP POLICY IF EXISTS "staff property update scope" ON public.properties;
CREATE POLICY "staff property update scope"
ON public.properties AS RESTRICTIVE
FOR UPDATE TO authenticated
USING (
  NOT public.is_staff(auth.uid())
  OR (public.has_permission(auth.uid(), 'manage_properties') AND public.has_property_access(auth.uid(), id))
)
WITH CHECK (
  NOT public.is_staff(auth.uid())
  OR (public.has_permission(auth.uid(), 'manage_properties') AND public.has_property_access(auth.uid(), id))
);

DROP POLICY IF EXISTS "staff property insert scope" ON public.properties;
CREATE POLICY "staff property insert scope"
ON public.properties AS RESTRICTIVE
FOR INSERT TO authenticated
WITH CHECK (NOT public.is_staff(auth.uid()) OR public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "staff property delete scope" ON public.properties;
CREATE POLICY "staff property delete scope"
ON public.properties AS RESTRICTIVE
FOR DELETE TO authenticated
USING (
  NOT public.is_staff(auth.uid())
  OR (public.has_permission(auth.uid(), 'manage_properties') AND public.has_property_access(auth.uid(), id))
);

DROP POLICY IF EXISTS "staff booking select scope" ON public.bookings;
CREATE POLICY "staff booking select scope"
ON public.bookings AS RESTRICTIVE
FOR SELECT TO authenticated
USING (
  NOT public.is_staff(auth.uid())
  OR (
    (public.has_permission(auth.uid(), 'view_dashboard') OR public.has_permission(auth.uid(), 'manage_bookings'))
    AND public.has_property_access(auth.uid(), property_id)
  )
);

DROP POLICY IF EXISTS "staff booking modify scope" ON public.bookings;
CREATE POLICY "staff booking modify scope"
ON public.bookings AS RESTRICTIVE
FOR UPDATE TO authenticated
USING (
  NOT public.is_staff(auth.uid())
  OR (public.has_permission(auth.uid(), 'manage_bookings') AND public.has_property_access(auth.uid(), property_id))
)
WITH CHECK (
  NOT public.is_staff(auth.uid())
  OR (public.has_permission(auth.uid(), 'manage_bookings') AND public.has_property_access(auth.uid(), property_id))
);

DROP POLICY IF EXISTS "staff blocked dates scope" ON public.blocked_dates;
CREATE POLICY "staff blocked dates scope"
ON public.blocked_dates AS RESTRICTIVE
FOR ALL TO authenticated
USING (
  NOT public.is_staff(auth.uid())
  OR (public.has_permission(auth.uid(), 'manage_availability') AND public.has_property_access(auth.uid(), property_id))
)
WITH CHECK (
  NOT public.is_staff(auth.uid())
  OR (public.has_permission(auth.uid(), 'manage_availability') AND public.has_property_access(auth.uid(), property_id))
);

DROP POLICY IF EXISTS "staff pricing scope" ON public.pricing_rules;
CREATE POLICY "staff pricing scope"
ON public.pricing_rules AS RESTRICTIVE
FOR ALL TO authenticated
USING (
  NOT public.is_staff(auth.uid())
  OR (public.has_permission(auth.uid(), 'manage_pricing') AND public.has_property_access(auth.uid(), property_id))
)
WITH CHECK (
  NOT public.is_staff(auth.uid())
  OR (public.has_permission(auth.uid(), 'manage_pricing') AND public.has_property_access(auth.uid(), property_id))
);

DROP POLICY IF EXISTS "staff property images scope" ON public.property_images;
CREATE POLICY "staff property images scope"
ON public.property_images AS RESTRICTIVE
FOR ALL TO authenticated
USING (
  NOT public.is_staff(auth.uid())
  OR (public.has_permission(auth.uid(), 'manage_properties') AND public.has_property_access(auth.uid(), property_id))
)
WITH CHECK (
  NOT public.is_staff(auth.uid())
  OR (public.has_permission(auth.uid(), 'manage_properties') AND public.has_property_access(auth.uid(), property_id))
);

DROP POLICY IF EXISTS "staff property amenities scope" ON public.property_amenities;
CREATE POLICY "staff property amenities scope"
ON public.property_amenities AS RESTRICTIVE
FOR ALL TO authenticated
USING (
  NOT public.is_staff(auth.uid())
  OR (public.has_permission(auth.uid(), 'manage_amenities') AND public.has_property_access(auth.uid(), property_id))
)
WITH CHECK (
  NOT public.is_staff(auth.uid())
  OR (public.has_permission(auth.uid(), 'manage_amenities') AND public.has_property_access(auth.uid(), property_id))
);

DROP POLICY IF EXISTS "staff reviews scope" ON public.reviews;
CREATE POLICY "staff reviews scope"
ON public.reviews AS RESTRICTIVE
FOR ALL TO authenticated
USING (
  NOT public.is_staff(auth.uid())
  OR (public.has_permission(auth.uid(), 'manage_reviews') AND public.has_property_access(auth.uid(), property_id))
)
WITH CHECK (
  NOT public.is_staff(auth.uid())
  OR (public.has_permission(auth.uid(), 'manage_reviews') AND public.has_property_access(auth.uid(), property_id))
);

DROP POLICY IF EXISTS "staff payments scope" ON public.payments;
CREATE POLICY "staff payments scope"
ON public.payments AS RESTRICTIVE
FOR ALL TO authenticated
USING (
  NOT public.is_staff(auth.uid())
  OR (
    public.has_permission(auth.uid(), 'manage_payments')
    AND EXISTS (
      SELECT 1
      FROM public.bookings b
      WHERE b.id = booking_id
        AND public.has_property_access(auth.uid(), b.property_id)
    )
  )
)
WITH CHECK (
  NOT public.is_staff(auth.uid())
  OR (
    public.has_permission(auth.uid(), 'manage_payments')
    AND EXISTS (
      SELECT 1
      FROM public.bookings b
      WHERE b.id = booking_id
        AND public.has_property_access(auth.uid(), b.property_id)
    )
  )
);

DROP POLICY IF EXISTS "staff discounts scope" ON public.discount_codes;
CREATE POLICY "staff discounts scope"
ON public.discount_codes AS RESTRICTIVE
FOR ALL TO authenticated
USING (NOT public.is_staff(auth.uid()) OR public.has_permission(auth.uid(), 'manage_discounts'))
WITH CHECK (NOT public.is_staff(auth.uid()) OR public.has_permission(auth.uid(), 'manage_discounts'));

DROP POLICY IF EXISTS "staff amenities scope" ON public.amenities;
CREATE POLICY "staff amenities scope"
ON public.amenities AS RESTRICTIVE
FOR ALL TO authenticated
USING (NOT public.is_staff(auth.uid()) OR public.has_permission(auth.uid(), 'manage_amenities'))
WITH CHECK (NOT public.is_staff(auth.uid()) OR public.has_permission(auth.uid(), 'manage_amenities'));
