-- Add rides table to track logistics/delivery sessions
CREATE TABLE IF NOT EXISTS public.rides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
    pickup_location TEXT NOT NULL,
    pickup_lat DECIMAL(10, 8),
    pickup_lng DECIMAL(11, 8),
    dropoff_location TEXT NOT NULL,
    dropoff_lat DECIMAL(10, 8),
    dropoff_lng DECIMAL(11, 8),
    items TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    estimated_time INTEGER, -- minutes
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'ongoing', 'completed', 'cancelled')),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_rides_vehicle_id ON public.rides(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_rides_status ON public.rides(status);

-- Enable RLS
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;

-- Policies for RLS
CREATE POLICY "Enable read access for all" ON public.rides FOR SELECT USING (true);
CREATE POLICY "Enable insert for all" ON public.rides FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all" ON public.rides FOR UPDATE USING (true);

-- Add to Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.rides;
