
DROP POLICY IF EXISTS "Anyone can submit enquiries" ON public.enquiries;
CREATE POLICY "Anyone can submit enquiries" ON public.enquiries
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    char_length(trim(name)) > 0
    AND char_length(trim(phone)) >= 6
    AND status = 'new'
  );

DROP POLICY IF EXISTS "Anyone can book site visits" ON public.site_visits;
CREATE POLICY "Anyone can book site visits" ON public.site_visits
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    char_length(trim(name)) > 0
    AND char_length(trim(phone)) >= 6
    AND preferred_date >= CURRENT_DATE
    AND status = 'pending'
  );
