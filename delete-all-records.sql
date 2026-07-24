-- ============================================
-- DELETE ALL RECORDS FROM EAGLE TRAVEL ERP
-- ============================================
-- WARNING: This will permanently delete ALL data
-- Run this script in Supabase SQL Editor to clear all records
-- ============================================

-- Disable foreign key checks temporarily to allow deletion
SET session_replication_role = 'replica';

-- Delete all notifications
DELETE FROM notifications;

-- Delete all expenses
DELETE FROM expenses;

-- Delete all payments
DELETE FROM payments;

-- Delete all invoices
DELETE FROM invoices;

-- Delete lead timeline events
DELETE FROM lead_timeline;

-- Delete all leads
DELETE FROM leads;

-- Delete trip timeline events
DELETE FROM trip_timeline;

-- Delete trip stops
DELETE FROM trip_stops;

-- Delete all trips
DELETE FROM trips;

-- Delete vehicle maintenance history
DELETE FROM vehicle_maintenance;

-- Delete all vehicles
DELETE FROM vehicles;

-- Delete driver attendance records
DELETE FROM driver_attendance;

-- Delete driver ratings
DELETE FROM driver_ratings;

-- Delete driver documents
DELETE FROM driver_documents;

-- Delete all drivers
DELETE FROM drivers;

-- Delete customer reviews
DELETE FROM customer_reviews;

-- Delete customer documents
DELETE FROM customer_documents;

-- Delete all customers
DELETE FROM customers;

-- Delete all employees (except keep one admin if needed)
-- Uncomment the next line to delete all employees
-- DELETE FROM employees;

-- Re-enable foreign key checks
SET session_replication_role = 'origin';

-- Display confirmation
DO $$ 
BEGIN 
  RAISE NOTICE '✅ All records have been deleted from the database';
  RAISE NOTICE '📊 Tables cleared: notifications, expenses, payments, invoices, leads, trips, vehicles, drivers, customers';
  RAISE NOTICE '⚠️  Settings and employees were preserved';
  RAISE NOTICE '💡 To delete employees too, uncomment the DELETE FROM employees line';
END $$;
