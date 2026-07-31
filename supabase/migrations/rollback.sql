-- HanRao Prime Portal — PostgreSQL Supabase Schema Rollback
-- Drops all tables, enums, triggers and functions created in migration.sql

-- ── 1. DROP STORAGE POLICIES ───────────────────────────────────────────────
drop policy if exists "Allow public read for projects storage" on storage.objects;
drop policy if exists "Allow admins upload for projects storage" on storage.objects;
drop policy if exists "Allow public read for plots storage" on storage.objects;
drop policy if exists "Allow admins upload for plots storage" on storage.objects;
drop policy if exists "Allow public read for avatars storage" on storage.objects;
drop policy if exists "Allow users upload for avatars storage" on storage.objects;
drop policy if exists "Allow admins access for documents storage" on storage.objects;

-- ── 2. DROP STORAGE BUCKETS ────────────────────────────────────────────────
delete from storage.buckets where id in ('projects', 'plots', 'avatars', 'documents');

-- ── 3. DROP TABLES ──────────────────────────────────────────────────────────
drop table if exists public.rate_limits cascade;
drop table if exists public.audit_logs cascade;
drop table if exists public.notifications cascade;
drop table if exists public.site_visits cascade;
drop table if exists public.bookings cascade;
drop table if exists public.customers cascade;
drop table if exists public.enquiries cascade;
drop table if exists public.plots cascade;
drop table if exists public.projects cascade;
drop table if exists public.media cascade;
drop table if exists public.settings cascade;
drop table if exists public.role_permissions cascade;
drop table if exists public.permissions cascade;
drop table if exists public.roles cascade;
drop table if exists public.user_roles cascade;
drop table if exists public.profiles cascade;
drop table if exists public.locations cascade;

-- ── 4. DROP FUNCTIONS, TRIGGERS & ENUMS ─────────────────────────────────────
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop function if exists public.has_role(public.app_role, uuid);
drop function if exists public.has_role(public.app_role);
drop type if exists public.app_role;
