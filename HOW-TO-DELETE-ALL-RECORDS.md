# How to Delete All Records from Eagle Travel ERP

**Date:** July 24, 2026  
**Purpose:** Complete database cleanup - removes all trips, payments, invoices, customers, vehicles, drivers, and expenses

---

## ⚠️ CRITICAL WARNING

**This action is PERMANENT and CANNOT be undone!**

- ❌ All trips will be deleted
- ❌ All payments will be deleted
- ❌ All invoices will be deleted
- ❌ All customers will be deleted
- ❌ All vehicles will be deleted
- ❌ All drivers will be deleted
- ❌ All expenses will be deleted
- ❌ All notifications will be deleted
- ✅ Settings and employees will be preserved

**Make sure you have a backup if you need this data later!**

---

## METHOD 1: Delete from Supabase (Recommended)

This method deletes records from the database permanently.

### Step 1: Open Supabase Dashboard
1. Go to your Supabase project: https://supabase.com/dashboard
2. Log in to your account
3. Select your Eagle Travel ERP project

### Step 2: Open SQL Editor
1. Click on **SQL Editor** in the left sidebar
2. Click **New Query**

### Step 3: Run the Deletion Script
1. Open the file `delete-all-records.sql` in your project folder
2. Copy the entire SQL script
3. Paste it into the Supabase SQL Editor
4. Click **Run** button
5. Wait for confirmation message

### Step 4: Clear Browser Cache (Optional)
1. Open your Eagle Travel ERP website
2. Press `Ctrl + Shift + Delete` (Windows) or `Cmd + Shift + Delete` (Mac)
3. Select "Cached images and files" and "Cookies and site data"
4. Click "Clear data"
5. Refresh the page (`F5` or `Ctrl + R`)

---

## METHOD 2: Delete from Browser Only

This method only clears data from your browser's local storage. Data in Supabase will remain.

### Step 1: Open Browser Developer Tools
1. Open your Eagle Travel ERP website
2. Press `F12` or right-click → "Inspect"
3. Go to the **Console** tab

### Step 2: Run Deletion Command
Copy and paste this command in the console:

```javascript
// Clear localStorage
localStorage.clear();

// Confirm
console.log('✅ Local storage cleared! Refresh the page.');

// Refresh the page
location.reload();
```

### Step 3: Verify
After the page refreshes, you should see an empty system with no records.

---

## METHOD 3: Complete Reset (Browser + Database)

To completely reset the entire system:

### Step 1: Delete from Supabase (Method 1)
Follow METHOD 1 above to delete all database records

### Step 2: Clear Browser Storage (Method 2)
Follow METHOD 2 above to clear local storage

### Step 3: Verify
1. Refresh your Eagle Travel ERP website
2. You should see:
   - ✅ No trips
   - ✅ No customers
   - ✅ No payments
   - ✅ No invoices
   - ✅ Settings preserved
   - ✅ Clean dashboard

---

## WHAT GETS DELETED vs PRESERVED

### ❌ DELETED (All Records):
- **Trips:** All trip records, stops, timeline events
- **Payments:** All payment ledger entries
- **Invoices:** All generated invoices
- **Customers:** All customer records, documents, reviews
- **Vehicles:** All vehicle records, maintenance history
- **Drivers:** All driver records, documents, ratings, attendance
- **Expenses:** All expense records
- **Leads:** All lead records and timeline
- **Notifications:** All system notifications

### ✅ PRESERVED (Settings):
- **Company Settings:** Name, GST, address, contact info
- **Employees:** User accounts (optional - can be deleted if needed)
- **System Configuration:** Default rates, GST rate, currency
- **Database Schema:** Tables and structure remain intact

---

## TO ALSO DELETE EMPLOYEES

If you want to delete employees too:

### In Supabase SQL Editor:
Open `delete-all-records.sql` and **uncomment** this line:
```sql
-- DELETE FROM employees;
```

Change it to:
```sql
DELETE FROM employees;
```

Then run the script again.

---

## VERIFICATION CHECKLIST

After deletion, verify the following:

### In Eagle Travel ERP Website:
- [ ] Dashboard shows 0 trips
- [ ] Customers page is empty
- [ ] Drivers page is empty
- [ ] Vehicles page is empty
- [ ] Payments page is empty
- [ ] Invoices page is empty
- [ ] Expenses page is empty

### In Supabase Dashboard:
- [ ] Go to Table Editor
- [ ] Check each table (trips, customers, drivers, etc.)
- [ ] All tables should show 0 rows (or only settings/employees)

---

## FREQUENTLY ASKED QUESTIONS

### Q: Can I recover data after deletion?
**A:** No, deletion is permanent. You must have a backup to restore data.

### Q: How do I backup data before deletion?
**A:** 
1. In Supabase Dashboard → SQL Editor
2. Run: `SELECT * FROM trips;` (or any table)
3. Click "Download CSV"
4. Repeat for all tables you want to backup

### Q: Will this affect my website login?
**A:** No, if you preserve employees. Your login will continue working.

### Q: Can I delete specific trips only?
**A:** Yes, use the website's Delete button for individual trips. This script deletes ALL records.

### Q: What if I only want to delete payments?
**A:** Modify the SQL script to only include:
```sql
DELETE FROM payments;
```

### Q: Does this delete the database structure?
**A:** No, only the records (data) are deleted. The tables and schema remain intact.

---

## ALTERNATIVE: Selective Deletion

If you only want to delete certain types of records:

### Delete Only Trips:
```sql
DELETE FROM trip_timeline;
DELETE FROM trip_stops;
DELETE FROM trips;
```

### Delete Only Payments:
```sql
DELETE FROM payments;
```

### Delete Only Customers:
```sql
DELETE FROM customer_reviews;
DELETE FROM customer_documents;
DELETE FROM customers;
```

### Delete Only Drivers:
```sql
DELETE FROM driver_attendance;
DELETE FROM driver_ratings;
DELETE FROM driver_documents;
DELETE FROM drivers;
```

---

## SUPPORT

If you encounter any issues:
1. Check browser console for errors (F12 → Console tab)
2. Check Supabase logs (Dashboard → Logs)
3. Verify your Supabase connection in `.env.local`

---

## FILES IN THIS PROJECT

- **delete-all-records.sql** - SQL script to run in Supabase
- **HOW-TO-DELETE-ALL-RECORDS.md** - This guide (you are here)

---

**Ready to delete?** Follow METHOD 1 above to permanently remove all records from your database.

**Changed your mind?** Close this file and your data remains safe.
