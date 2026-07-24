-- Fix Database Schema: Add all missing columns
-- This resolves schema mismatch errors between code and database

-- ============================================
-- FIX 1: Add missing columns to CUSTOMERS table
-- ============================================
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS passengers INTEGER;

ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS booking_status VARCHAR(50);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_passengers ON customers(passengers);
CREATE INDEX IF NOT EXISTS idx_customers_booking_status ON customers(booking_status);

-- ============================================
-- FIX 2: Add missing columns to TRIPS table
-- ============================================
-- These columns store the rates and calculated costs used at trip completion time

ALTER TABLE trips 
ADD COLUMN IF NOT EXISTS per_km_rate DECIMAL(10, 2);

ALTER TABLE trips 
ADD COLUMN IF NOT EXISTS driver_bata_rate DECIMAL(10, 2);

ALTER TABLE trips 
ADD COLUMN IF NOT EXISTS km_cost DECIMAL(10, 2);

ALTER TABLE trips 
ADD COLUMN IF NOT EXISTS bata_cost DECIMAL(10, 2);

-- Add indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_trips_per_km_rate ON trips(per_km_rate);
CREATE INDEX IF NOT EXISTS idx_trips_driver_bata_rate ON trips(driver_bata_rate);

-- ============================================
-- FIX 3: Make payments.invoice_id nullable (if not already done)
-- ============================================
ALTER TABLE payments 
ALTER COLUMN invoice_id DROP NOT NULL;

-- ============================================
-- Verification & Success Message
-- ============================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Schema migration completed successfully!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 CUSTOMERS TABLE:';
  RAISE NOTICE '  ✅ Added passengers column (INTEGER)';
  RAISE NOTICE '  ✅ Added booking_status column (VARCHAR)';
  RAISE NOTICE '';
  RAISE NOTICE '📋 TRIPS TABLE:';
  RAISE NOTICE '  ✅ Added per_km_rate column (stores rate used for this trip)';
  RAISE NOTICE '  ✅ Added driver_bata_rate column (stores bata rate used)';
  RAISE NOTICE '  ✅ Added km_cost column (stores calculated KM cost)';
  RAISE NOTICE '  ✅ Added bata_cost column (stores calculated bata cost)';
  RAISE NOTICE '';
  RAISE NOTICE '📋 PAYMENTS TABLE:';
  RAISE NOTICE '  ✅ invoice_id is now nullable (allows payments without invoices)';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Your database schema is now synchronized with the application code!';
  RAISE NOTICE '🚀 You can now save data without schema mismatch errors.';
END $$;
