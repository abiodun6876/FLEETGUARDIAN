-- Add payment_status column to rides table
ALTER TABLE rides ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'partial'));

-- Add payment_method column
ALTER TABLE rides ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (payment_method IN ('cash', 'transfer', 'card', 'wallet'));

-- Add delivery_proof column for photo URLs
ALTER TABLE rides ADD COLUMN IF NOT EXISTS delivery_proof TEXT;

-- Add customer_phone column
ALTER TABLE rides ADD COLUMN IF NOT EXISTS customer_phone TEXT;

-- Add delivery_notes column
ALTER TABLE rides ADD COLUMN IF NOT EXISTS delivery_notes TEXT;

-- Add driver_rating column (1-5 stars)
ALTER TABLE rides ADD COLUMN IF NOT EXISTS driver_rating INTEGER CHECK (driver_rating >= 1 AND driver_rating <= 5);

-- Create index for faster queries on payment status
CREATE INDEX IF NOT EXISTS idx_rides_payment_status ON rides(payment_status);

-- Create index for faster queries on date ranges
CREATE INDEX IF NOT EXISTS idx_rides_created_at ON rides(created_at);
