-- Eagle Travel ERP - Supabase Database Schema
-- Run this script in Supabase SQL Editor to create all tables

-- ============================================
-- 1. SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  logo_url TEXT,
  gst_number VARCHAR(50),
  address TEXT,
  email VARCHAR(255),
  phone VARCHAR(50),
  whatsapp VARCHAR(50),
  currency_symbol VARCHAR(10) DEFAULT '₹',
  default_gst_rate INTEGER DEFAULT 5,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 2. EMPLOYEES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS employees (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  role VARCHAR(50) NOT NULL,
  salary DECIMAL(10, 2),
  joining_date DATE,
  status VARCHAR(20) DEFAULT 'Active',
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 3. CUSTOMERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS customers (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(255),
  gst_number VARCHAR(50),
  address TEXT,
  favorite_routes TEXT[],
  notes TEXT,
  vehicle VARCHAR(255),
  vehicle_provider VARCHAR(255),
  assigned_rate_engage DECIMAL(10, 2),
  per_km_rate DECIMAL(10, 2),
  driver_bata DECIMAL(10, 2),
  pickup_location VARCHAR(255),
  pickup_time VARCHAR(50),
  visiting_places TEXT,
  advance_amount DECIMAL(10, 2),
  profit_per_km DECIMAL(10, 2),
  profit_bata DECIMAL(10, 2),
  profit_engage DECIMAL(10, 2),
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_email ON customers(email);

-- ============================================
-- 4. CUSTOMER DOCUMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS customer_documents (
  id VARCHAR(50) PRIMARY KEY,
  customer_id VARCHAR(50) REFERENCES customers(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50),
  file_url TEXT,
  uploaded_at TIMESTAMP,
  size VARCHAR(50)
);

CREATE INDEX idx_customer_docs_customer_id ON customer_documents(customer_id);

-- ============================================
-- 5. CUSTOMER REVIEWS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS customer_reviews (
  id VARCHAR(50) PRIMARY KEY,
  customer_id VARCHAR(50) REFERENCES customers(id) ON DELETE CASCADE,
  trip_number VARCHAR(50),
  rating DECIMAL(2, 1),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reviews_customer_id ON customer_reviews(customer_id);

-- ============================================
-- 6. DRIVERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS drivers (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  photo_url TEXT,
  license_number VARCHAR(100) UNIQUE NOT NULL,
  aadhar_number VARCHAR(50),
  pan_number VARCHAR(50),
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(255),
  address TEXT,
  salary DECIMAL(10, 2),
  emergency_contact_name VARCHAR(255),
  emergency_contact_phone VARCHAR(50),
  is_available BOOLEAN DEFAULT true,
  assigned_trip_id VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_drivers_available ON drivers(is_available);

-- ============================================
-- 7. DRIVER DOCUMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS driver_documents (
  id VARCHAR(50) PRIMARY KEY,
  driver_id VARCHAR(50) REFERENCES drivers(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50),
  file_url TEXT,
  uploaded_at TIMESTAMP,
  size VARCHAR(50)
);

-- ============================================
-- 8. DRIVER RATINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS driver_ratings (
  id SERIAL PRIMARY KEY,
  driver_id VARCHAR(50) REFERENCES drivers(id) ON DELETE CASCADE,
  rating DECIMAL(2, 1) NOT NULL,
  trip_id VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 9. DRIVER ATTENDANCE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS driver_attendance (
  id SERIAL PRIMARY KEY,
  driver_id VARCHAR(50) REFERENCES drivers(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status VARCHAR(20) NOT NULL,
  UNIQUE(driver_id, date)
);

CREATE INDEX idx_attendance_date ON driver_attendance(date);

-- ============================================
-- 10. VEHICLES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS vehicles (
  id VARCHAR(50) PRIMARY KEY,
  vehicle_number VARCHAR(50) UNIQUE NOT NULL,
  category VARCHAR(50) NOT NULL,
  brand VARCHAR(100),
  model VARCHAR(100),
  fuel_type VARCHAR(50),
  seats INTEGER,
  insurance_expiry DATE,
  fitness_expiry DATE,
  permit_expiry DATE,
  pollution_expiry DATE,
  rc_number VARCHAR(100),
  last_service_date DATE,
  is_available BOOLEAN DEFAULT true,
  current_driver_id VARCHAR(50),
  current_trip_id VARCHAR(50),
  owner_name VARCHAR(255),
  ownership_type VARCHAR(50),
  acquisition_price DECIMAL(12, 2),
  attached_date DATE,
  board VARCHAR(100),
  engage DECIMAL(10, 2),
  per_km_ac_below_350 DECIMAL(10, 2),
  per_km_ac_above_350 DECIMAL(10, 2),
  per_km_non_ac_below_350 DECIMAL(10, 2),
  per_km_non_ac_above_350 DECIMAL(10, 2),
  driver_bata DECIMAL(10, 2),
  agency_base_rate DECIMAL(10, 2),
  agency_rate_per_km DECIMAL(10, 2),
  agency_driver_allowance DECIMAL(10, 2),
  agency_min_km_per_day DECIMAL(10, 2),
  agency_night_halt DECIMAL(10, 2),
  agency_extra_hour_charge DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vehicles_available ON vehicles(is_available);
CREATE INDEX idx_vehicles_number ON vehicles(vehicle_number);

-- ============================================
-- 11. VEHICLE MAINTENANCE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS vehicle_maintenance (
  id VARCHAR(50) PRIMARY KEY,
  vehicle_id VARCHAR(50) REFERENCES vehicles(id) ON DELETE CASCADE,
  type VARCHAR(255) NOT NULL,
  cost DECIMAL(10, 2),
  date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_maintenance_vehicle_id ON vehicle_maintenance(vehicle_id);
CREATE INDEX idx_maintenance_date ON vehicle_maintenance(date);

-- ============================================
-- 12. TRIPS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS trips (
  id VARCHAR(50) PRIMARY KEY,
  customer_id VARCHAR(50) REFERENCES customers(id),
  customer_name VARCHAR(255) NOT NULL,
  vehicle_id VARCHAR(50) REFERENCES vehicles(id),
  vehicle_number VARCHAR(50),
  vehicle_model VARCHAR(255),
  driver_id VARCHAR(50) REFERENCES drivers(id),
  driver_name VARCHAR(255),
  driver_phone VARCHAR(50),
  pickup VARCHAR(255) NOT NULL,
  drop_location VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  pickup_time VARCHAR(50),
  closing_time VARCHAR(50),
  passengers INTEGER,
  tour_package VARCHAR(255),
  hotel VARCHAR(255),
  guide_name VARCHAR(255),
  status VARCHAR(50) NOT NULL,
  notes TEXT,
  base_fare DECIMAL(10, 2),
  gst_amount DECIMAL(10, 2),
  total_fare DECIMAL(10, 2),
  payment_status VARCHAR(50),
  advance_paid DECIMAL(10, 2),
  total_km DECIMAL(10, 2),
  total_bata DECIMAL(10, 2),
  toll_charges DECIMAL(10, 2),
  profit_per_km DECIMAL(10, 2),
  profit_bata DECIMAL(10, 2),
  profit_engage DECIMAL(10, 2),
  calculated_profit DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_trips_customer_id ON trips(customer_id);
CREATE INDEX idx_trips_vehicle_id ON trips(vehicle_id);
CREATE INDEX idx_trips_driver_id ON trips(driver_id);
CREATE INDEX idx_trips_status ON trips(status);
CREATE INDEX idx_trips_dates ON trips(start_date, end_date);

-- ============================================
-- 13. TRIP STOPS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS trip_stops (
  id VARCHAR(50) PRIMARY KEY,
  trip_id VARCHAR(50) REFERENCES trips(id) ON DELETE CASCADE,
  location VARCHAR(255) NOT NULL,
  arrival_time VARCHAR(50),
  stop_order INTEGER
);

CREATE INDEX idx_stops_trip_id ON trip_stops(trip_id);

-- ============================================
-- 14. TRIP TIMELINE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS trip_timeline (
  id VARCHAR(50) PRIMARY KEY,
  trip_id VARCHAR(50) REFERENCES trips(id) ON DELETE CASCADE,
  status VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  location VARCHAR(255)
);

CREATE INDEX idx_timeline_trip_id ON trip_timeline(trip_id);

-- ============================================
-- 15. LEADS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS leads (
  id VARCHAR(50) PRIMARY KEY,
  customer_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(255),
  pickup VARCHAR(255),
  destination VARCHAR(255),
  journey_date DATE,
  vehicle_type VARCHAR(100),
  budget DECIMAL(10, 2),
  notes TEXT,
  lead_source VARCHAR(100),
  status VARCHAR(50) NOT NULL,
  next_follow_up_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_phone ON leads(phone);

-- ============================================
-- 16. LEAD TIMELINE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS lead_timeline (
  id VARCHAR(50) PRIMARY KEY,
  lead_id VARCHAR(50) REFERENCES leads(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  author VARCHAR(255),
  message TEXT NOT NULL
);

CREATE INDEX idx_lead_timeline_lead_id ON lead_timeline(lead_id);

-- ============================================
-- 17. INVOICES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS invoices (
  id VARCHAR(50) PRIMARY KEY,
  trip_id VARCHAR(50) REFERENCES trips(id),
  trip_number VARCHAR(50) NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255),
  customer_phone VARCHAR(50),
  customer_address TEXT,
  customer_gst VARCHAR(50),
  company_name VARCHAR(255),
  company_logo TEXT,
  company_gst VARCHAR(50),
  company_address TEXT,
  company_email VARCHAR(255),
  company_phone VARCHAR(50),
  subtotal DECIMAL(10, 2),
  gst_rate INTEGER,
  gst_amount DECIMAL(10, 2),
  total_amount DECIMAL(10, 2),
  advance_amount DECIMAL(10, 2),
  balance_due DECIMAL(10, 2),
  payment_status VARCHAR(50),
  pdf_url TEXT,
  qr_code_data TEXT,
  due_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_invoices_trip_id ON invoices(trip_id);
CREATE INDEX idx_invoices_status ON invoices(payment_status);
CREATE INDEX idx_invoices_customer ON invoices(customer_name);

-- ============================================
-- 18. PAYMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(50) PRIMARY KEY,
  invoice_id VARCHAR(50) REFERENCES invoices(id),
  trip_number VARCHAR(50) NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(50),
  transaction_id VARCHAR(100),
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_payments_date ON payments(date);

-- ============================================
-- 19. EXPENSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS expenses (
  id VARCHAR(50) PRIMARY KEY,
  category VARCHAR(100) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  date DATE NOT NULL,
  paid_to VARCHAR(255),
  payment_method VARCHAR(50),
  receipt_url TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_expenses_category ON expenses(category);

-- ============================================
-- 20. NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_timestamp ON notifications(timestamp);

-- ============================================
-- CREATE UPDATED_AT TRIGGER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON drivers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON trips FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ENABLE ROW LEVEL SECURITY (Optional for production)
-- ============================================
-- Uncomment these when you add authentication
-- ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$ 
BEGIN 
  RAISE NOTICE '✅ Eagle Travel ERP Database Schema created successfully!';
  RAISE NOTICE '📊 Created 20 tables with indexes and triggers';
  RAISE NOTICE '🚀 Ready to migrate data from localStorage';
END $$;
