-- Add webcam_url column to vehicles table for IP webcam streaming
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS webcam_url TEXT;

-- Add webcam_enabled flag
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS webcam_enabled BOOLEAN DEFAULT false;

-- Add last_snapshot column for storing latest snapshot URL
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS last_snapshot TEXT;

-- Add last_snapshot_at timestamp
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS last_snapshot_at TIMESTAMPTZ;

-- Create snapshots table for storing historical snapshots
CREATE TABLE IF NOT EXISTS vehicle_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    snapshot_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_snapshots_vehicle_id ON vehicle_snapshots(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_created_at ON vehicle_snapshots(created_at DESC);
