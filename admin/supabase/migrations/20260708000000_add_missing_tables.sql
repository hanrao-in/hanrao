-- ============================================================
-- HanRao Realty — Full Schema Migration
-- Adds: customers, bookings, notifications
-- Fixes: missing policies, triggers for auto-customer creation
-- ============================================================

-- -------------------------------------------------------
-- CUSTOMERS TABLE
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customers (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  phone         text NOT NULL,
  email         text,
  address       text,
  source        text NOT NULL DEFAULT 'website',
  status        text NOT NULL DEFAULT 'lead',
  notes         text,
  enquiry_id    uuid REFERENCES public.enquiries(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view customers" ON public.customers FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert customers" ON public.customers FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update customers" ON public.customers FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete customers" ON public.customers FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Service role can also insert (for trigger-based auto-creation)
GRANT ALL ON public.customers TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;

-- -------------------------------------------------------
-- BOOKINGS TABLE
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bookings (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name    text NOT NULL,
  customer_phone   text NOT NULL,
  customer_email   text,
  project_id       uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  project_name     text,
  plot_id          uuid REFERENCES public.plots(id) ON DELETE SET NULL,
  plot_number      text,
  total_amount     numeric NOT NULL DEFAULT 0,
  paid_amount      numeric NOT NULL DEFAULT 0,
  status           text NOT NULL DEFAULT 'advance',
  booking_date     date NOT NULL DEFAULT CURRENT_DATE,
  notes            text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view bookings" ON public.bookings FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert bookings" ON public.bookings FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update bookings" ON public.bookings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete bookings" ON public.bookings FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

GRANT ALL ON public.bookings TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;

-- -------------------------------------------------------
-- NOTIFICATIONS TABLE
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  message     text NOT NULL,
  type        text NOT NULL DEFAULT 'info',
  read        boolean NOT NULL DEFAULT false,
  entity_type text,
  entity_id   uuid,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view notifications" ON public.notifications FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update notifications" ON public.notifications FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete notifications" ON public.notifications FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

GRANT ALL ON public.notifications TO service_role;
GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;

-- -------------------------------------------------------
-- TRIGGER: Auto-create customer + notification on new enquiry
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_enquiry()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Only create customer if phone doesn't already exist
  IF NOT EXISTS (SELECT 1 FROM public.customers WHERE phone = NEW.phone) THEN
    INSERT INTO public.customers (name, phone, email, source, status, enquiry_id)
    VALUES (NEW.name, NEW.phone, NEW.email, 'website', 'lead', NEW.id);
  END IF;

  -- Create notification
  INSERT INTO public.notifications (title, message, type, entity_type, entity_id)
  VALUES (
    'New Enquiry',
    NEW.name || ' enquired' || CASE WHEN NEW.project_id IS NOT NULL THEN ' about a project' ELSE '' END || '.',
    'info',
    'enquiry',
    NEW.id
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_new_enquiry ON public.enquiries;
CREATE TRIGGER on_new_enquiry
  AFTER INSERT ON public.enquiries
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_enquiry();

-- -------------------------------------------------------
-- TRIGGER: Create notification on new site visit
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_site_visit()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (title, message, type, entity_type, entity_id)
  VALUES (
    'Site Visit Requested',
    NEW.name || ' requested a site visit on ' || NEW.preferred_date || '.',
    'info',
    'site_visit',
    NEW.id
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_new_site_visit ON public.site_visits;
CREATE TRIGGER on_new_site_visit
  AFTER INSERT ON public.site_visits
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_site_visit();

-- -------------------------------------------------------
-- TRIGGER: Create notification on new booking
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_booking()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (title, message, type, entity_type, entity_id)
  VALUES (
    'New Booking',
    NEW.customer_name || ' booked' || CASE WHEN NEW.plot_number IS NOT NULL THEN ' plot ' || NEW.plot_number ELSE '' END || '.',
    'success',
    'booking',
    NEW.id
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_new_booking ON public.bookings;
CREATE TRIGGER on_new_booking
  AFTER INSERT ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_booking();

-- -------------------------------------------------------
-- Enable realtime on enquiries, site_visits, bookings, notifications
-- -------------------------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE public.enquiries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.site_visits;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.customers;
