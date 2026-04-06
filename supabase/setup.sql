-- ============================================================
-- InstaBackend AI — One-Time Supabase Setup
-- Run this ONCE in your Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================

-- 1. Workspaces metadata table
CREATE TABLE IF NOT EXISTS workspaces (
  id           SERIAL PRIMARY KEY,
  workspace_id TEXT UNIQUE NOT NULL,
  business_name TEXT NOT NULL,
  business_description TEXT,
  blueprint    JSONB NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 2. exec_sql helper — lets the server create tables dynamically
-- SECURITY: This is callable only with the service_role key (server-side only)
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

-- 3. Restrict exec_sql so only the service role can call it
REVOKE ALL ON FUNCTION exec_sql(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION exec_sql(text) FROM anon;
REVOKE ALL ON FUNCTION exec_sql(text) FROM authenticated;
GRANT EXECUTE ON FUNCTION exec_sql(text) TO service_role;

-- Done! Your Supabase project is ready for InstaBackend AI.
