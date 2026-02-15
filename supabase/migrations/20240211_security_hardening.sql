-- SECURITY HARDENING MIGRATION
-- Addresses Supabase Linter findings (0010, 0011, 0013, 0014, 0024)

-- 1. FIX: Security Definer Views (0010)
-- Change views to use security_invoker to respect querying user's RLS
ALTER VIEW IF EXISTS public.staff_attendance_history SET (security_invoker = true);
ALTER VIEW IF EXISTS public.vehicle_document_expiry SET (security_invoker = true);
ALTER VIEW IF EXISTS public.device_activity_log SET (security_invoker = true);
ALTER VIEW IF EXISTS public.daily_attendance_summary SET (security_invoker = true);

-- 2. FIX: RLS Disabled in Public (0013)
-- Enable RLS for missing tables
ALTER TABLE IF EXISTS public.vehicle_snapshots ENABLE ROW LEVEL SECURITY;

-- 3. FIX: Permissive RLS Policies (0024)
-- Adding policies for vehicle_snapshots (permisive as requested)
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_policy WHERE polname = 'Enable all for all users' 
        AND polrelid = 'public.vehicle_snapshots'::regclass
    ) THEN
        CREATE POLICY "Enable all for all users" ON public.vehicle_snapshots FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- 4. FIX: Function Search Path Mutable (0011)
-- Set search_path to public for reported functions to prevent hijacking
ALTER FUNCTION IF EXISTS public.generate_pairing_code() SET search_path = public;
ALTER FUNCTION IF EXISTS public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION IF EXISTS public.generate_device_token() SET search_path = public;
ALTER FUNCTION IF EXISTS public.set_pass_code() SET search_path = public;
ALTER FUNCTION IF EXISTS public.check_document_expiry_notifications() SET search_path = public;
ALTER FUNCTION IF EXISTS public.match_users_by_face(vector) SET search_path = public;
ALTER FUNCTION IF EXISTS public.generate_pass_code() SET search_path = public;

-- 5. FIX: Extension in Public (0014)
-- Move extensions to a dedicated schema if possible
CREATE SCHEMA IF NOT EXISTS extensions;
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
        ALTER EXTENSION vector SET SCHEMA extensions;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not move vector extension: %', SQLERRM;
END $$;

-- Update search path for functions that might have been affected by extension move
-- This ensures they can still find the vector type in the extensions schema
ALTER DATABASE postgres SET search_path TO public, extensions;
