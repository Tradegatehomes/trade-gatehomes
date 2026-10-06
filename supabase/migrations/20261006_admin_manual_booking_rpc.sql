CREATE OR REPLACE FUNCTION public.admin_create_booking(
  p_property_id uuid,
  p_check_in date,
  p_check_out date,
  p_guests integer,
  p_guest_name text,
  p_guest_email text,
  p_guest_phone text,
  p_notes text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY INVOKER
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
    NULL,
    false,
    p_guest_name,
    p_guest_email,
    p_guest_phone,
    p_notes
  );

  UPDATE public.bookings
  SET status = 'confirmed',
      notes = concat_ws(E'\n', nullif(notes,''), 'Created manually by admin.')
  WHERE reference = booking_ref;

  RETURN booking_ref;
END;
$$;
