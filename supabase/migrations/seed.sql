-- HanRao Prime Portal — Database Seed Script
-- Populates mock projects, plots, default roles, settings, and locations for developer setup.

-- ── 1. SEED LOCATIONS ───────────────────────────────────────────────────────
insert into public.locations (id, name, type, state, parent_id)
values
  ('telangana', 'Telangana', 'district', 'Telangana', null),
  ('hyderabad', 'Hyderabad', 'city', 'Telangana','telangana'),
  ('yadadri', 'Yadadri Bhuvanagiri', 'district', 'Telangana', 'telangana'),
  ('yadagirigutta', 'Yadagirigutta', 'village', 'Telangana', 'yadadri'),
  ('rangareddy', 'Ranga Reddy', 'district', 'Telangana', 'telangana'),
  ('shadnagar', 'Shadnagar', 'city', 'Telangana', 'rangareddy')
on conflict (id) do update set name = excluded.name;

-- ── 2. SEED DEFAULT SETTINGS ───────────────────────────────────────────────
insert into public.settings (key, value)
values
  ('site_title', 'HanRao Realty — Premium Plots & Lands'),
  ('contact_phone', '+91 83415 05195'),
  ('contact_email', 'hanraoadmin@gmail.com'),
  ('office_address', 'Flat No. 102, Prime Heights, Madhapur, Hyderabad, Telangana - 500081')
on conflict (key) do update set value = excluded.value;

-- ── 3. SEED ROLES & PERMISSIONS ──────────────────────────────────────────────
insert into public.roles (id, name, description)
values
  ('7b3c29da-ef8a-4c91-a1e7-8b0dfca89111', 'admin', 'Administrator with full system access')
on conflict (name) do nothing;

insert into public.permissions (id, name, description)
values
  ('a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6', 'manage_projects', 'Ability to create, update and delete projects'),
  ('b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', 'manage_plots', 'Ability to create, update and delete plots'),
  ('c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f', 'manage_customers', 'Ability to create, update and delete customer records'),
  ('d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a', 'manage_bookings', 'Ability to create, update and delete booking records')
on conflict (name) do nothing;

-- Map Admin Role to Permissions
insert into public.role_permissions (role_id, permission_id)
values
  ('7b3c29da-ef8a-4c91-a1e7-8b0dfca89111', 'a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6'),
  ('7b3c29da-ef8a-4c91-a1e7-8b0dfca89111', 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e'),
  ('7b3c29da-ef8a-4c91-a1e7-8b0dfca89111', 'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f'),
  ('7b3c29da-ef8a-4c91-a1e7-8b0dfca89111', 'd4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a')
on conflict do nothing;

-- ── 4. SEED SAMPLE PROJECTS ─────────────────────────────────────────────────
insert into public.projects (id, slug, name, description, district, village, city, state, thumbnail_url, gallery_urls, map_lat, map_lng, map_embed_url, brochure_url, status, approval_types, amenities, nearby, featured, location_id, rera_number)
values
  (
    'a7b311fa-c48f-4318-8f83-3c9215ef8211',
    'hanrao-prime-meadows',
    'HanRao Prime Meadows',
    'A luxurious gated community plot development located in Hyderabad. Features fully-developed layouts with underground utilities, concrete roads, overhead tanks, and round-the-clock security. Perfect investment opportunity with high appreciation potential.',
    'Hyderabad',
    'Madhapur',
    'Hyderabad',
    'Telangana',
    'https://images.unsplash.com/photo-1524431544435-beffbcb255ff?auto=format&fit=crop&w=800&q=80',
    array[
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80'
    ],
    17.4483,
    78.3741,
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3806.82424912345!2d78.3741!3d17.4483!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb93dc!2sMadhapur!5e0!3m2!1sen!2sin!4v1680000000000',
    'https://example.com/brochures/prime-meadows.pdf',
    'active',
    array['HMDA', 'RERA'],
    array['Water Connection', 'Electricity', 'Security 24/7', 'Blacktop Roads', 'Gated Community', 'Clubhouse'],
    '{"schools": [{"name": "Global Indian School", "distance": "2.5 km"}], "hospitals": [{"name": "Medicover Hospitals", "distance": "3.2 km"}], "highway_km": 1.2, "airport_km": 32.0}'::jsonb,
    true,
    'hyderabad',
    'P02400001234'
  ),
  (
    'b25c34fd-0ef8-4c9c-b17b-2da07a7e1122',
    'hanrao-royal-orchid',
    'HanRao Royal Orchid',
    'Experience serene living at Royal Orchid in Yadagirigutta. Situated near the holy temple town, this project offers scenic views, lush green surroundings, and high investment return prospect. Perfect for vacation homes or long-term land investment.',
    'Yadadri Bhuvanagiri',
    'Yadagirigutta',
    'Yadadri Bhuvanagiri',
    'Telangana',
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80',
    array[
      'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=800&q=80'
    ],
    17.5286,
    78.9482,
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15217.151740925232!2d78.9482!3d17.5286!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb7fc!2sYadagirigutta!5e0!3m2!1sen!2sin!4v1680000000001',
    null,
    'active',
    array['DTCP'],
    array['Water Connection', 'Electricity', 'Security 24/7', 'Parks & Play Area', 'Avenue Plantation'],
    '{"schools": [{"name": "ZPHS Yadagirigutta", "distance": "1.0 km"}], "hospitals": [{"name": "Government Hospital", "distance": "1.5 km"}], "highway_km": 0.5, "airport_km": 65.0}'::jsonb,
    true,
    'yadagirigutta',
    null
  ),
  (
    'c7d91a9b-7ef8-43b6-981c-8e4d2bf8d123',
    'hanrao-elite-enclave',
    'HanRao Elite Enclave',
    'Premium plot layout in Shadnagar on the Hyderabad-Bangalore Highway (NH-44). Rapidly growing industrial zone with excellent connectivity. Fully approved and loaded with modern amenities, including a swimming pool, jogging track, and children''s park.',
    'Ranga Reddy',
    'Shadnagar',
    'Shadnagar',
    'Telangana',
    'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80',
    array[]::text[],
    17.0683,
    78.2045,
    null,
    'https://example.com/brochures/elite-enclave.pdf',
    'upcoming',
    array['HMDA', 'RERA'],
    array['Water Connection', 'Electricity', 'Security 24/7', 'Clubhouse', 'Swimming Pool', 'Jogging Track'],
    '{"schools": [{"name": "Delhi Public School Shadnagar", "distance": "4.0 km"}], "hospitals": [{"name": "Narayana Hospital", "distance": "3.5 km"}], "highway_km": 1.0, "airport_km": 40.0}'::jsonb,
    false,
    'shadnagar',
    'P02400005678'
  )
on conflict (id) do update set 
  name = excluded.name, 
  slug = excluded.slug, 
  description = excluded.description;

-- ── 5. SEED SAMPLE PLOTS ────────────────────────────────────────────────────
insert into public.plots (id, project_id, plot_number, area_sqyd, price_per_sqyd, facing, plot_type, availability, images)
values
  -- Plots for Prime Meadows
  (gen_random_uuid(), 'a7b311fa-c48f-4318-8f83-3c9215ef8211', '101', 240, 25000, 'East', 'open', 'available', '{}'),
  (gen_random_uuid(), 'a7b311fa-c48f-4318-8f83-3c9215ef8211', '102', 300, 26000, 'West', 'villa', 'available', '{}'),
  (gen_random_uuid(), 'a7b311fa-c48f-4318-8f83-3c9215ef8211', '103', 250, 25000, 'North', 'open', 'reserved', '{}'),
  (gen_random_uuid(), 'a7b311fa-c48f-4318-8f83-3c9215ef8211', '104', 350, 27000, 'East', 'commercial', 'sold', '{}'),
  
  -- Plots for Royal Orchid
  (gen_random_uuid(), 'b25c34fd-0ef8-4c9c-b17b-2da07a7e1122', 'A-1', 200, 12000, 'East', 'open', 'available', '{}'),
  (gen_random_uuid(), 'b25c34fd-0ef8-4c9c-b17b-2da07a7e1122', 'A-2', 200, 12000, 'East', 'open', 'available', '{}'),
  (gen_random_uuid(), 'b25c34fd-0ef8-4c9c-b17b-2da07a7e1122', 'B-5', 240, 13000, 'South', 'farm', 'available', '{}'),
  (gen_random_uuid(), 'b25c34fd-0ef8-4c9c-b17b-2da07a7e1122', 'C-12', 400, 15000, 'North-East', 'farm', 'reserved', '{}')
on conflict do nothing;
