-- Migration: 20260803_004_create_health_functions.sql
-- Description: System metrics and storage cleanup RPC procedures.

CREATE OR REPLACE FUNCTION public.get_system_health()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  project_count int;
  customer_count int;
  booking_count int;
  enquiry_count int;
BEGIN
  SELECT count(*) INTO project_count FROM public.projects WHERE deleted_at IS NULL;
  SELECT count(*) INTO customer_count FROM public.customers WHERE deleted_at IS NULL;
  SELECT count(*) INTO booking_count FROM public.bookings WHERE deleted_at IS NULL;
  SELECT count(*) INTO enquiry_count FROM public.enquiries WHERE deleted_at IS NULL;

  RETURN json_build_object(
    'status', 'healthy',
    'timestamp', now(),
    'projects', project_count,
    'customers', customer_count,
    'bookings', booking_count,
    'enquiries', enquiry_count
  );
END;
$$;
