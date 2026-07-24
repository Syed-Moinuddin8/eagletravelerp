# Fix Schema Mismatch Error - SOLUTION ✅

**Error:** `Failed to save data to database: Could not find the 'passengers' column of 'customers' in the schema cache`

**Cause:** Your Supabase database schema is missing several columns that exist in the application code.

---

## 🎯 QUICK FIX (5 Minutes)

### Step 1: Open Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Log in to your account
3. Select your Eagle Travel ERP project

### Step 2: Open SQL Editor
1. Click **SQL Editor** in the left sidebar
2. Click **New Query**

### Step 3: Run the Migration Script
1. Open the file `fix-schema-missing-columns.sql` in your project folder
2. Copy the ENTIRE SQL script
3. Paste it into the Supabase SQL Editor
4. Click **Run** button (or press Ctrl+Enter)
5. Wait for the success message

### Step 4: Verify Success
You should see output like:
```
✅ Schema migration completed successfully!

📋 CUSTOMERS TABLE:
  ✅ Added passengers column (INTEGER)
  ✅ Added booking_status column (VARCHAR)

📋 TRIPS TABLE:
  ✅ Added per_km_rate column
  ✅ Added driver_bata_rate column
  ✅ Added km_cost column
  ✅ Added bata_cost column

📋 PAYMENTS TABLE:
  ✅ invoice_id is now nullable

🎉 Your database schema is now synchronized!
```

### Step 5: Test Your Application
1. Refresh your Eagle Travel ERP website
2. Try saving data (customer, trip, payment)
3. Error should be gone! ✅

---

## 🔍 WHAT WAS THE PROBLEM?

### Missing Columns in Database:

**CUSTOMERS Table:**
- ❌ `passengers` - Number of passengers for a booking
- ❌ `booking_status` - Status of customer booking

**TRIPS Table:**
- ❌ `per_km_rate` - Rate per KM used for this specific trip
- ❌ `driver_bata_rate` - Bata rate per day used for this trip
- ❌ `km_cost` - Calculated KM cost stored at completion
- ❌ `bata_cost` - Calculated bata cost stored at completion

**PAYMENTS Table:**
- ❌ `invoice_id` was NOT NULL (should allow null for payments without invoices)

### Why This Happened:
- The application code was updated to support new features (trip calculation storage, passenger tracking)
- The database schema was not updated to match
- When saving data, Supabase couldn't find these columns → ERROR

---

## 📋 WHAT THE MIGRATION SCRIPT DOES

### 1. Updates CUSTOMERS Table
```sql
ALTER TABLE customers ADD COLUMN IF NOT EXISTS passengers INTEGER;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS booking_status VARCHAR(50);
```

**Purpose:** Allows storing passenger count and booking status for customers

### 2. Updates TRIPS Table
```sql
ALTER TABLE trips ADD COLUMN IF NOT EXISTS per_km_rate DECIMAL(10, 2);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS driver_bata_rate DECIMAL(10, 2);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS km_cost DECIMAL(10, 2);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS bata_cost DECIMAL(10, 2);
```

**Purpose:** Stores the exact rates and calculated costs used for each trip at completion time

### 3. Updates PAYMENTS Table
```sql
ALTER TABLE payments ALTER COLUMN invoice_id DROP NOT NULL;
```

**Purpose:** Allows creating payments without requiring an invoice (payment ledger flexibility)

### 4. Adds Performance Indexes
```sql
CREATE INDEX IF NOT EXISTS idx_customers_passengers ON customers(passengers);
CREATE INDEX IF NOT EXISTS idx_trips_per_km_rate ON trips(per_km_rate);
-- ... and more
```

**Purpose:** Improves query performance for filtering and sorting

---

## ✅ VERIFICATION CHECKLIST

After running the migration, verify everything works:

### Test 1: Save a Customer
- [ ] Go to Customers page
- [ ] Add or edit a customer
- [ ] Click Save
- [ ] Should save without errors ✅

### Test 2: Complete a Trip
- [ ] Go to Trips page
- [ ] Complete a trip
- [ ] Record payment
- [ ] Should save without errors ✅

### Test 3: Record a Payment
- [ ] Go to Payments page
- [ ] Click "Log Payment Receipt"
- [ ] Record a payment
- [ ] Should save without errors ✅

### Test 4: Check Payment Ledger
- [ ] Go to Payments page
- [ ] Check "Collectable Receivables" section
- [ ] Outstanding balance should display correctly ✅

---

## 🚨 TROUBLESHOOTING

### Error: "relation 'customers' does not exist"
**Problem:** Database tables not created yet  
**Solution:** Run the full schema creation first: `supabase-schema.sql`

### Error: "column already exists"
**Problem:** Column was already added manually  
**Solution:** The script uses `IF NOT EXISTS` so it's safe to run. Just ignore the notice.

### Error: "permission denied"
**Problem:** You don't have database admin access  
**Solution:** Log in with the Supabase project owner account

### Error still persists after migration
**Solution:**
1. Hard refresh your website: `Ctrl + Shift + R`
2. Clear browser cache
3. Check Supabase connection in `.env.local`
4. Verify migration ran successfully in Supabase SQL Editor → History

---

## 📊 IMPACT ON EXISTING DATA

**Good News:** This migration is **NON-DESTRUCTIVE**

- ✅ All existing data is preserved
- ✅ New columns are added with NULL values
- ✅ Existing columns are unchanged
- ✅ No data loss
- ✅ Safe to run multiple times

**Backward Compatible:**
- Old trips without stored calculations will still work
- System falls back to recalculation when fields are NULL
- Existing customers without passenger count will show as empty

---

## 🔄 RELATED FIXES

This migration also includes fixes from previous tasks:

1. **Task 3:** Trip Individual Calculations Storage
   - Adds `per_km_rate`, `driver_bata_rate`, `km_cost`, `bata_cost` to trips

2. **Task 6:** Database Foreign Key Constraint Fix
   - Makes `payments.invoice_id` nullable

3. **Customer Enhancement:** Passenger Tracking
   - Adds `passengers` and `booking_status` to customers

---

## 📄 FILES IN THIS FIX

1. **fix-schema-missing-columns.sql** - Complete migration script (RUN THIS!)
2. **FIX-SCHEMA-MISMATCH-ERROR.md** - This guide (you are here)
3. **fix-customers-add-passengers-column.sql** - Partial fix (not needed if you run the complete script)

---

## 🎉 AFTER MIGRATION

Once the migration is complete:

✅ Database schema matches application code  
✅ No more "column not found" errors  
✅ All features working correctly  
✅ Trip calculations stored properly  
✅ Payment ledger working  
✅ Customer data saves correctly

---

## 🚀 NEXT STEPS

1. **Run the migration** (5 minutes)
2. **Test your application** (5 minutes)
3. **Continue using the system** with no errors!

---

**Ready to fix?** Go to Supabase → SQL Editor → Run `fix-schema-missing-columns.sql`

**Still stuck?** Check the troubleshooting section above or review the error message in browser console (F12).
