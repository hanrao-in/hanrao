
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Admin manage policies for existing tables
CREATE POLICY "Admins manage projects insert" ON public.projects FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage projects update" ON public.projects FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage projects delete" ON public.projects FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage plots insert" ON public.plots FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage plots update" ON public.plots FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage plots delete" ON public.plots FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage locations insert" ON public.locations FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage locations update" ON public.locations FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage locations delete" ON public.locations FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Enquiries: extend + admin management
ALTER TABLE public.enquiries
  ADD COLUMN IF NOT EXISTS budget text,
  ADD COLUMN IF NOT EXISTS interested_plot_id uuid REFERENCES public.plots(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS lead_status text NOT NULL DEFAULT 'new';

CREATE POLICY "Admins view enquiries" ON public.enquiries FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update enquiries" ON public.enquiries FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete enquiries" ON public.enquiries FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Site visits: admin management
CREATE POLICY "Admins view site_visits" ON public.site_visits FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update site_visits" ON public.site_visits FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete site_visits" ON public.site_visits FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Storage policies for admin uploads (buckets created via API)
CREATE POLICY "Public read project assets" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id IN ('project-images', 'project-brochures'));
CREATE POLICY "Admins upload project assets" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('project-images', 'project-brochures') AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update project assets" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id IN ('project-images', 'project-brochures') AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete project assets" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id IN ('project-images', 'project-brochures') AND public.has_role(auth.uid(), 'admin'));
