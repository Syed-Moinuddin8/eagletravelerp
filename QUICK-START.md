# Eagle Travel ERP - Quick Start Guide

Get your ERP system up and running in 10 minutes!

---

## 🚀 Prerequisites

- Node.js 16+ installed
- Supabase account (free tier works)
- Code editor (VS Code recommended)

---

## ⚡ Quick Setup (4 Steps)

### Step 1: Install Dependencies (2 min)
```bash
cd eagle-travels-erp
npm install
```

### Step 2: Configure Supabase (3 min)
1. Go to https://supabase.com/dashboard
2. Create a new project (or use existing)
3. Get your project URL and anon key from Project Settings → API
4. Create `.env.local` file:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 3: Setup Database (3 min)
1. In Supabase Dashboard → SQL Editor
2. Run this script: `supabase-schema.sql` (copy & paste, then click Run)
3. Run this script: `fix-schema-missing-columns.sql` (copy & paste, then click Run)
4. (Optional) Run `disable-rls.sql` for development

### Step 4: Start Application (1 min)
```bash
npm run dev
```

Open http://localhost:3000

**Done! Your ERP is running!** 🎉

---

## 📋 First Time Usage

### 1. Check Dashboard
- View system metrics
- Verify data loads

### 2. Add a Customer
- Go to Customers
- Click "Add New Customer"
- Fill details and save

### 3. Add a Driver
- Go to Drivers
- Click "Add Driver"
- Fill details and save

### 4. Add a Vehicle
- Go to Vehicles
- Click "Add Vehicle"
- Fill details and save

### 5. Book a Trip
- Go to Trips
- Click "Book New Trip"
- Select customer, driver, vehicle
- Fill trip details and save

### 6. Complete a Trip
- Open the trip
- Click "Complete Trip"
- Enter KMs, days, toll charges
- Record payment
- Confirm completion

### 7. View Payments
- Go to Payments → Payment Ledger
- Check outstanding balances
- Record additional payments

---

## 🔧 Common Commands

### Development
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
```

### Database
- Create tables: Run `supabase-schema.sql` in Supabase
- Fix schema: Run `fix-schema-missing-columns.sql` in Supabase
- Clear data: Run `delete-all-records.sql` in Supabase

---

## 🆘 Troubleshooting

### "Could not find column" error
**Fix:** Run `fix-schema-missing-columns.sql` in Supabase SQL Editor

### Data not saving
**Fix:** Check `.env.local` has correct Supabase credentials

### Build fails
**Fix:** Delete `node_modules` and run `npm install` again

### Page blank/white screen
**Fix:** Check browser console (F12) for errors

---

## 📚 Learn More

- **README.md** - Complete setup guide
- **PROJECT-STATUS.md** - All features and status
- **DEPLOYMENT-GUIDE.md** - Deploy to production
- **FIX-SCHEMA-MISMATCH-ERROR.md** - Schema troubleshooting
- **HOW-TO-DELETE-ALL-RECORDS.md** - Data management

---

## ✅ Verification Checklist

After setup, verify these work:
- [ ] Dashboard loads with metrics
- [ ] Can add/edit customers
- [ ] Can add/edit drivers
- [ ] Can add/edit vehicles
- [ ] Can book a trip
- [ ] Can complete a trip
- [ ] Can record payments
- [ ] Can generate invoices
- [ ] Can export data

If all checked, you're ready to use the system! ✅

---

## 🎯 Next Steps

1. **Customize Settings**
   - Go to Settings → Office
   - Update company name, logo, GST
   - Configure default rates

2. **Add Your Data**
   - Import existing customers
   - Add your fleet vehicles
   - Register drivers

3. **Start Operations**
   - Book real trips
   - Record actual payments
   - Generate invoices
   - Track expenses

---

## 📞 Need Help?

- Check documentation files in project root
- Review browser console for errors (F12)
- Verify Supabase connection is working
- Ensure all database migrations are run

---

**Happy traveling!** 🚗✈️
