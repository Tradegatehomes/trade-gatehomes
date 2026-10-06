DROP POLICY IF EXISTS "staff property select scope" ON public.properties;
CREATE POLICY "staff property select scope"
ON public.properties AS RESTRICTIVE
FOR SELECT TO authenticated
USING (
  NOT public.is_staff(auth.uid())
  OR (
    (
      public.has_permission(auth.uid(), 'view_dashboard')
      OR public.has_permission(auth.uid(), 'manage_bookings')
      OR public.has_permission(auth.uid(), 'manage_properties')
      OR public.has_permission(auth.uid(), 'manage_availability')
      OR public.has_permission(auth.uid(), 'manage_pricing')
      OR public.has_permission(auth.uid(), 'manage_reviews')
      OR public.has_permission(auth.uid(), 'manage_amenities')
    )
    AND public.has_property_access(auth.uid(), id)
  )
);