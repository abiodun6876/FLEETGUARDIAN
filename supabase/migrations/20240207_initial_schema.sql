-- FLEETGUARDIAN INITIAL SCHEMA

-- 1. VEHICLES TABLE
CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plate_number TEXT UNIQUE NOT NULL,
    driver_name TEXT,
    device_id TEXT UNIQUE, -- can be a unique phone ID
    status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'moving', 'stopped', 'sos')),
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. LOCATIONS TABLE
CREATE TABLE IF NOT EXISTS public.locations (
    id BIGSERIAL PRIMARY KEY,
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    speed DOUBLE PRECISION DEFAULT 0,
    heading DOUBLE PRECISION DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CREATE INDEX ON locations(vehicle_id, created_at DESC);

-- 3. MEDIA TABLE
CREATE TABLE IF NOT EXISTS public.media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('image', 'audio', 'video')),
    url TEXT NOT NULL,
    trigger_type TEXT DEFAULT 'manual' CHECK (trigger_type IN ('manual', 'event', 'geofence', 'sos')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    meta JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS POLICIES (Simplified for now - can be expanded)
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read (for dashboard)
CREATE POLICY "Enable read access for authenticated users" ON public.vehicles FOR SELECT USING (true);
CREATE POLICY "Enable read access for authenticated users" ON public.locations FOR SELECT USING (true);
CREATE POLICY "Enable read access for authenticated users" ON public.media FOR SELECT USING (true);
CREATE POLICY "Enable read access for authenticated users" ON public.events FOR SELECT USING (true);

-- Allow authenticated users (devices) to insert their own data
CREATE POLICY "Enable insert for authenticated users" ON public.locations FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable insert for authenticated users" ON public.media FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable insert for authenticated users" ON public.events FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for vehicles status" ON public.vehicles FOR UPDATE USING (true);
-- 5. ENABLE REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.locations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
