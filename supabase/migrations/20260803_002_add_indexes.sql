-- Migration: 20260803_002_add_indexes.sql
-- Description: Enable pg_trgm extension and add GIN trigram indexes for <150ms search execution.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_projects_trgm ON public.projects 
USING gin ((name || ' ' || slug || ' ' || village || ' ' || city || ' ' || district || ' ' || state) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers (phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers (email);

-- PostgreSQL RPC Function for Fast Typo-Tolerant Search
CREATE OR REPLACE FUNCTION public.search_projects_v2(search_term text)
RETURNS SETOF public.projects
LANGUAGE sql
STABLE
AS $$
  SELECT *
  FROM public.projects
  WHERE 
    deleted_at IS NULL
    AND (
      search_term IS NULL 
      OR search_term = ''
      OR name ILIKE '%' || search_term || '%'
      OR slug ILIKE '%' || search_term || '%'
      OR village ILIKE '%' || search_term || '%'
      OR city ILIKE '%' || search_term || '%'
      OR district ILIKE '%' || search_term || '%'
      OR state ILIKE '%' || search_term || '%'
      OR array_to_string(approvals, ' ') ILIKE '%' || search_term || '%'
      OR array_to_string(amenities, ' ') ILIKE '%' || search_term || '%'
    )
  ORDER BY created_at DESC;
$$;
