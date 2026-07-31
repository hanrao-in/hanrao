
-- Locations table (villages, cities, districts)
CREATE TABLE public.locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('village', 'city', 'district')),
  parent_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  state TEXT NOT NULL DEFAULT 'Telangana',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.locations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.locations TO authenticated;
GRANT ALL ON public.locations TO service_role;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Locations are viewable by everyone" ON public.locations FOR SELECT TO anon, authenticated USING (true);
CREATE INDEX idx_locations_name ON public.locations USING gin (to_tsvector('simple', name));

-- Projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  district TEXT NOT NULL DEFAULT '',
  village TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  state TEXT NOT NULL DEFAULT 'Telangana',
  thumbnail_url TEXT NOT NULL DEFAULT '',
  gallery_urls TEXT[] NOT NULL DEFAULT '{}',
  map_lat NUMERIC,
  map_lng NUMERIC,
  map_embed_url TEXT,
  brochure_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'upcoming', 'sold_out')),
  approval_types TEXT[] NOT NULL DEFAULT '{}',
  amenities TEXT[] NOT NULL DEFAULT '{}',
  nearby JSONB NOT NULL DEFAULT '{}'::jsonb,
  featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.projects TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Projects are viewable by everyone" ON public.projects FOR SELECT TO anon, authenticated USING (true);
CREATE INDEX idx_projects_slug ON public.projects(slug);
CREATE INDEX idx_projects_status ON public.projects(status);

-- Plots table
CREATE TABLE public.plots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  plot_number TEXT NOT NULL,
  area_sqyd NUMERIC NOT NULL,
  price_per_sqyd NUMERIC NOT NULL,
  facing TEXT NOT NULL DEFAULT 'East',
  plot_type TEXT NOT NULL DEFAULT 'open' CHECK (plot_type IN ('open', 'villa', 'commercial', 'farm')),
  availability TEXT NOT NULL DEFAULT 'available' CHECK (availability IN ('available', 'reserved', 'sold')),
  latitude NUMERIC,
  longitude NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.plots TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plots TO authenticated;
GRANT ALL ON public.plots TO service_role;
ALTER TABLE public.plots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Plots are viewable by everyone" ON public.plots FOR SELECT TO anon, authenticated USING (true);
CREATE INDEX idx_plots_project ON public.plots(project_id);

-- Enquiries table (leads)
CREATE TABLE public.enquiries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  phone TEXT NOT NULL CHECK (char_length(phone) BETWEEN 6 AND 20),
  email TEXT CHECK (email IS NULL OR char_length(email) <= 255),
  message TEXT CHECK (message IS NULL OR char_length(message) <= 2000),
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.enquiries TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.enquiries TO authenticated;
GRANT ALL ON public.enquiries TO service_role;
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit enquiries" ON public.enquiries FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Site visits table
CREATE TABLE public.site_visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  phone TEXT NOT NULL CHECK (char_length(phone) BETWEEN 6 AND 20),
  email TEXT CHECK (email IS NULL OR char_length(email) <= 255),
  preferred_date DATE NOT NULL,
  preferred_time TEXT NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  message TEXT CHECK (message IS NULL OR char_length(message) <= 2000),
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.site_visits TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_visits TO authenticated;
GRANT ALL ON public.site_visits TO service_role;
ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can book site visits" ON public.site_visits FOR INSERT TO anon, authenticated WITH CHECK (true);
