-- HanRao Prime Portal — PostgreSQL Supabase Schema Migration
-- Fresh Installation Schema

-- Enable UUID extension (commented out as Supabase enables this by default to prevent permissions/extension errors)
-- create extension if not exists "uuid-ossp";

-- ── 1. ENUMS & TYPES ────────────────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type app_role as enum ('admin');
  end if;
end$$;

-- ── 2. TABLES ───────────────────────────────────────────────────────────────

-- Locations Table (district, city, village hierarchy)
create table if not exists public.locations (
  id text primary key,
  name text not null,
  type text not null check (type in ('village', 'city', 'district')),
  state text not null default 'Telangana',
  parent_id text references public.locations(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Profiles Table (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- User Roles Table (RBAC mapping)
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

-- Roles Table
create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now()
);

-- Permissions Table
create table if not exists public.permissions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now()
);

-- Role Permissions Table
create table if not exists public.role_permissions (
  role_id uuid references public.roles(id) on delete cascade,
  permission_id uuid references public.permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

-- Settings Table (application configurations)
create table if not exists public.settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

-- Media Catalog Table (tracks CDN assets in Storage buckets)
create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  url text not null unique,
  bucket text not null,
  file_path text not null,
  size_bytes bigint,
  content_type text,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Projects Table
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  district text not null,
  village text not null default '',
  city text not null default '',
  state text not null default 'Telangana',
  thumbnail_url text not null default '',
  gallery_urls text[] not null default '{}',
  map_lat numeric,
  map_lng numeric,
  map_embed_url text,
  brochure_url text,
  video_url text,
  video_urls text[] not null default '{}',
  status text not null default 'active' check (status in ('active', 'upcoming', 'sold_out')),
  approval_types text[] not null default '{}',
  amenities text[] not null default '{}',
  nearby jsonb not null default '{}'::jsonb,
  featured boolean not null default false,
  location_id text references public.locations(id) on delete set null,
  rera_number text,
  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Plots Table
create table if not exists public.plots (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  plot_number text not null,
  area_sqyd numeric not null,
  price_per_sqyd numeric not null,
  facing text not null default 'East',
  plot_type text not null default 'open' check (plot_type in ('open', 'villa', 'commercial', 'farm')),
  availability text not null default 'available' check (availability in ('available', 'reserved', 'sold')),
  latitude numeric,
  longitude numeric,
  images text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (project_id, plot_number)
);

-- Enquiries Table
create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text,
  message text,
  project_id uuid references public.projects(id) on delete set null,
  project_name text, -- Denormalized for dashboard search fallback
  budget text,
  lead_status text not null default 'new' check (lead_status in ('new', 'contacted', 'interested', 'visited', 'converted', 'lost')),
  status text not null default 'open',
  notes text,
  interested_plot_id uuid references public.plots(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Customers Table
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null unique,
  email text,
  address text,
  source text not null default 'website' check (source in ('website', 'referral', 'walk-in', 'social')),
  status text not null default 'lead' check (status in ('lead', 'prospect', 'customer', 'inactive')),
  notes text,
  enquiry_id uuid references public.enquiries(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Bookings Table
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  project_id uuid references public.projects(id) on delete set null,
  project_name text,
  plot_id uuid references public.plots(id) on delete set null,
  plot_number text,
  total_amount numeric not null,
  paid_amount numeric not null default 0,
  status text not null default 'advance' check (status in ('advance', 'partial', 'completed', 'cancelled')),
  booking_date timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now()
);

-- Site Visits Table
create table if not exists public.site_visits (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text,
  preferred_date date not null,
  preferred_time text not null,
  message text,
  project_id uuid references public.projects(id) on delete set null,
  project_name text,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'completed', 'cancelled')),
  checked boolean not null default false,
  created_at timestamptz not null default now()
);

-- Notifications Table
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  type text not null default 'info' check (type in ('info', 'success', 'warning', 'error')),
  read boolean not null default false,
  entity_type text,
  entity_id uuid,
  created_at timestamptz not null default now()
);

-- Audit/Activity Logs Table
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  email text,
  ip_address text,
  action text not null,
  details jsonb,
  created_at timestamptz not null default now()
);

-- Rate Limit Cache Table (IP-based block records)
create table if not exists public.rate_limits (
  ip_address text primary key,
  attempts integer not null default 1,
  reset_at timestamptz not null
);

-- ── 3. INDEXES ─────────────────────────────────────────────────────────────
create index if not exists idx_projects_slug on public.projects(slug);
create index if not exists idx_projects_featured on public.projects(featured) where featured = true;
create index if not exists idx_plots_project_id on public.plots(project_id);
create index if not exists idx_plots_availability on public.plots(availability);
create index if not exists idx_customers_phone on public.customers(phone);
create index if not exists idx_bookings_created on public.bookings(created_at desc);
create index if not exists idx_enquiries_created on public.enquiries(created_at desc);
create index if not exists idx_site_visits_created on public.site_visits(created_at desc);
create index if not exists idx_notifications_unread on public.notifications(read) where read = false;
create index if not exists idx_audit_logs_created on public.audit_logs(created_at desc);

-- ── 4. RBAC PROCEDURES & TRIGGERS ──────────────────────────────────────────

-- Helper function to check if current user is an admin (overloaded for both signatures)
create or replace function public.has_role(_role public.app_role, _user_id uuid)
returns boolean security definer as $$
begin
  return exists (
    select 1 
    from public.user_roles 
    where user_id = _user_id 
      and role = _role
  );
end;
$$ language plpgsql;

create or replace function public.has_role(_role public.app_role)
returns boolean security definer as $$
begin
  return public.has_role(_role, auth.uid());
end;
$$ language plpgsql;

-- Trigger to automatically create a profile record when a new user registers in auth.users
create or replace function public.handle_new_user()
returns trigger security definer as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url);
  return new;
end;
$$ language plpgsql;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── 5. ROW LEVEL SECURITY (RLS) POLICIES ───────────────────────────────────

-- Enable RLS
alter table public.locations enable row level security;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.settings enable row level security;
alter table public.media enable row level security;
alter table public.projects enable row level security;
alter table public.plots enable row level security;
alter table public.enquiries enable row level security;
alter table public.customers enable row level security;
alter table public.bookings enable row level security;
alter table public.site_visits enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;
alter table public.rate_limits enable row level security;

-- Drop existing policies if any to avoid errors on duplicate names
drop policy if exists "Allow public read access to locations" on public.locations;
drop policy if exists "Allow admins full access to locations" on public.locations;
drop policy if exists "Allow public read access to projects" on public.projects;
drop policy if exists "Allow admins full access to projects" on public.projects;
drop policy if exists "Allow public read access to plots" on public.plots;
drop policy if exists "Allow admins full access to plots" on public.plots;
drop policy if exists "Allow users to read their own profiles" on public.profiles;
drop policy if exists "Allow users to update their own profiles" on public.profiles;
drop policy if exists "Allow admins full access to profiles" on public.profiles;
drop policy if exists "Allow admins full access to user_roles" on public.user_roles;
drop policy if exists "Allow admins full access to roles" on public.roles;
drop policy if exists "Allow admins full access to permissions" on public.permissions;
drop policy if exists "Allow admins full access to role_permissions" on public.role_permissions;
drop policy if exists "Allow public read access to settings" on public.settings;
drop policy if exists "Allow admins full access to settings" on public.settings;
drop policy if exists "Allow public read access to media links" on public.media;
drop policy if exists "Allow admins full access to media catalog" on public.media;
drop policy if exists "Allow public to submit enquiries" on public.enquiries;
drop policy if exists "Allow admins full access to enquiries" on public.enquiries;
drop policy if exists "Allow public to request site visits" on public.site_visits;
drop policy if exists "Allow admins full access to site visits" on public.site_visits;
drop policy if exists "Admin only access to customers" on public.customers;
drop policy if exists "Admin only access to bookings" on public.bookings;
drop policy if exists "Admin only access to notifications" on public.notifications;
drop policy if exists "Admin only access to audit_logs" on public.audit_logs;
drop policy if exists "Allow admins full access to rate limits" on public.rate_limits;

-- Define Policies
create policy "Allow public read access to locations" on public.locations for select using (true);
create policy "Allow admins full access to locations" on public.locations for all using (public.has_role('admin'));

create policy "Allow public read access to projects" on public.projects for select using (true);
create policy "Allow admins full access to projects" on public.projects for all using (public.has_role('admin'));

create policy "Allow public read access to plots" on public.plots for select using (true);
create policy "Allow admins full access to plots" on public.plots for all using (public.has_role('admin'));

create policy "Allow users to read their own profiles" on public.profiles for select using (auth.uid() = id);
create policy "Allow users to update their own profiles" on public.profiles for update using (auth.uid() = id);
create policy "Allow admins full access to profiles" on public.profiles for all using (public.has_role('admin'));

create policy "Allow admins full access to user_roles" on public.user_roles for all using (public.has_role('admin'));
create policy "Allow admins full access to roles" on public.roles for all using (public.has_role('admin'));
create policy "Allow admins full access to permissions" on public.permissions for all using (public.has_role('admin'));
create policy "Allow admins full access to role_permissions" on public.role_permissions for all using (public.has_role('admin'));

create policy "Allow public read access to settings" on public.settings for select using (true);
create policy "Allow admins full access to settings" on public.settings for all using (public.has_role('admin'));

create policy "Allow public read access to media links" on public.media for select using (true);
create policy "Allow admins full access to media catalog" on public.media for all using (public.has_role('admin'));

create policy "Allow public to submit enquiries" on public.enquiries for insert with check (true);
create policy "Allow admins full access to enquiries" on public.enquiries for all using (public.has_role('admin'));

create policy "Allow public to request site visits" on public.site_visits for insert with check (true);
create policy "Allow admins full access to site visits" on public.site_visits for all using (public.has_role('admin'));

create policy "Admin only access to customers" on public.customers for all using (public.has_role('admin'));
create policy "Admin only access to bookings" on public.bookings for all using (public.has_role('admin'));
create policy "Admin only access to notifications" on public.notifications for all using (public.has_role('admin'));
create policy "Admin only access to audit_logs" on public.audit_logs for all using (public.has_role('admin'));
create policy "Allow admins full access to rate limits" on public.rate_limits for all using (public.has_role('admin'));

-- ── 6. STORAGE BUCKETS & STORAGE POLICIES ──────────────────────────────────

-- Auto-provision storage buckets
insert into storage.buckets (id, name, public)
values 
  ('projects', 'projects', true),
  ('plots', 'plots', true),
  ('avatars', 'avatars', true),
  ('documents', 'documents', true),
  ('videos', 'videos', true)
on conflict (id) do nothing;

-- storage.objects policy drop / creation
drop policy if exists "Allow public read for projects storage" on storage.objects;
drop policy if exists "Allow admins upload for projects storage" on storage.objects;
drop policy if exists "Allow public read for plots storage" on storage.objects;
drop policy if exists "Allow admins upload for plots storage" on storage.objects;
drop policy if exists "Allow public read for avatars storage" on storage.objects;
drop policy if exists "Allow users upload for avatars storage" on storage.objects;
drop policy if exists "Allow public read for documents storage" on storage.objects;
drop policy if exists "Allow admins access for documents storage" on storage.objects;
drop policy if exists "Allow public read for videos storage" on storage.objects;
drop policy if exists "Allow admins upload for videos storage" on storage.objects;

create policy "Allow public read for projects storage" on storage.objects for select using (bucket_id = 'projects');
create policy "Allow admins upload for projects storage" on storage.objects for all using (bucket_id = 'projects' and public.has_role('admin'));

create policy "Allow public read for plots storage" on storage.objects for select using (bucket_id = 'plots');
create policy "Allow admins upload for plots storage" on storage.objects for all using (bucket_id = 'plots' and public.has_role('admin'));

create policy "Allow public read for avatars storage" on storage.objects for select using (bucket_id = 'avatars');
create policy "Allow users upload for avatars storage" on storage.objects for all using (bucket_id = 'avatars' and (auth.uid() is not null));

create policy "Allow public read for documents storage" on storage.objects for select using (bucket_id = 'documents');
create policy "Allow admins access for documents storage" on storage.objects for all using (bucket_id = 'documents' and public.has_role('admin'));

create policy "Allow public read for videos storage" on storage.objects for select using (bucket_id = 'videos');
create policy "Allow admins upload for videos storage" on storage.objects for all using (bucket_id = 'videos' and public.has_role('admin'));

-- ── 7. TRIGRAM INDEX & SEARCH RPC FUNCTION ───────────────────────────────
create extension if not exists pg_trgm;

create index if not exists idx_projects_trgm on public.projects using gin ((name || ' ' || slug || ' ' || village || ' ' || city || ' ' || district || ' ' || state) gin_trgm_ops);
create index if not exists idx_projects_deleted on public.projects(deleted_at) where deleted_at is null;

create or replace function public.search_projects_v2(search_term text, max_limit int default 20)
returns setof public.projects language sql stable as $$
  select *
  from public.projects
  where deleted_at is null
    and (
      search_term is null 
      or search_term = ''
      or name ilike '%' || search_term || '%'
      or slug ilike '%' || search_term || '%'
      or village ilike '%' || search_term || '%'
      or city ilike '%' || search_term || '%'
      or district ilike '%' || search_term || '%'
      or state ilike '%' || search_term || '%'
      or exists (
        select 1 from unnest(approval_types) a where a ilike '%' || search_term || '%'
      )
      or exists (
        select 1 from unnest(amenities) am where am ilike '%' || search_term || '%'
      )
    )
  order by 
    case when name ilike search_term || '%' then 0 else 1 end,
    created_at desc
  limit max_limit;
$$;

