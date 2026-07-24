# Project Files Guide

Quick reference for all files in Eagle Travel ERP project.

---

## 📁 Root Directory Files

### 📘 Documentation (8 files)

| File | Purpose | When to Read |
|------|---------|--------------|
| **README.md** | Main setup & usage guide | First time setup |
| **QUICK-START.md** | 10-minute quick setup | Getting started fast |
| **PROJECT-STATUS.md** | Complete project status | Review features & progress |
| **DEPLOYMENT-GUIDE.md** | Production deployment | Going live |
| **DATABASE-FOREIGN-KEY-FIX.md** | Foreign key fixes | Payment/invoice errors |
| **FIX-SCHEMA-MISMATCH-ERROR.md** | Schema troubleshooting | "Column not found" errors |
| **HOW-TO-DELETE-ALL-RECORDS.md** | Data cleanup guide | Reset/clear data |
| **CLEANUP-SUMMARY.md** | Cleanup documentation | Review what was removed |

### 🗄️ Database Scripts (4 files)

| File | Purpose | When to Run |
|------|---------|-------------|
| **supabase-schema.sql** | Create all tables | ⭐ First time setup (REQUIRED) |
| **fix-schema-missing-columns.sql** | Add missing columns | ⭐ After schema OR when errors (REQUIRED) |
| **delete-all-records.sql** | Clear all data | Testing/reset only |
| **disable-rls.sql** | Disable security | Development only (optional) |

### ⚙️ Configuration (7 files)

| File | Purpose | Edit? |
|------|---------|-------|
| **package.json** | Dependencies & scripts | ❌ No |
| **tsconfig.json** | TypeScript config | ❌ No |
| **vite.config.ts** | Build config | ❌ No |
| **.env.local** | Supabase credentials | ✅ Yes (add your keys) |
| **.env.example** | Template for credentials | ❌ No (reference only) |
| **.gitignore** | Git ignore rules | ❌ No |
| **index.html** | HTML entry point | ❌ No |

---

## 📂 Source Code Structure

### Components (16 files)
Located in `src/components/`

| Component | Purpose |
|-----------|---------|
| **DashboardView.tsx** | Main dashboard with metrics |
| **TripsView.tsx** | Trip booking & management |
| **CustomersView.tsx** | Customer profiles & management |
| **DriversView.tsx** | Driver profiles & management |
| **VehiclesView.tsx** | Fleet vehicle management |
| **PaymentsView.tsx** | Payment ledger & receivables |
| **InvoicesView.tsx** | Invoice generation |
| **ExpensesView.tsx** | Expense tracking |
| **ReportsView.tsx** | Business reports |
| **AnalyticsView.tsx** | Analytics dashboard |
| **CalendarView.tsx** | Trip scheduling calendar |
| **SettingsView.tsx** | Settings & configuration |
| **DatabaseTest.tsx** | Database connection test |
| **SupabaseMigration.tsx** | Data migration UI |
| **DateRangePicker.tsx** | Date selection component |
| **Toast.tsx** | Notification system |

### Services (2 files)
Located in `src/services/`

| Service | Purpose |
|---------|---------|
| **database.ts** | Supabase CRUD operations |
| **migrateData.ts** | Data migration utilities |

### Data Management (2 files)
Located in `src/data/`

| File | Purpose |
|------|---------|
| **stateManager.ts** | State management & localStorage |
| **seedData.ts** | Demo data & initial values |

### Utilities (1 file)
Located in `src/utils/`

| File | Purpose |
|------|---------|
| **csvExport.ts** | CSV export functionality |

### Core Files (4 files)
Located in `src/`

| File | Purpose |
|------|---------|
| **types.ts** | TypeScript type definitions |
| **App.tsx** | Main application component |
| **main.tsx** | Application entry point |
| **index.css** | Global styles & Tailwind |

### Library Integration (1 file)
Located in `src/lib/`

| File | Purpose |
|------|---------|
| **supabaseClient.ts** | Supabase client configuration |

---

## 🎯 File Usage Scenarios

### New Developer Setup
1. Read: **README.md**
2. Read: **QUICK-START.md**
3. Run: **supabase-schema.sql**
4. Run: **fix-schema-missing-columns.sql**
5. Edit: **.env.local** (add credentials)
6. Run: `npm install && npm run dev`

### Deployment to Production
1. Read: **DEPLOYMENT-GUIDE.md**
2. Review: **PROJECT-STATUS.md**
3. Run: Database scripts in Supabase
4. Configure: Production .env variables
5. Run: `npm run build`
6. Deploy: dist/ folder to hosting

### Troubleshooting Schema Errors
1. Read: **FIX-SCHEMA-MISMATCH-ERROR.md**
2. Run: **fix-schema-missing-columns.sql** in Supabase
3. Refresh browser (Ctrl + Shift + R)
4. Test: Try saving data again

### Clearing Test Data
1. Read: **HOW-TO-DELETE-ALL-RECORDS.md**
2. Option A: Use in-app button (Settings → System)
3. Option B: Run **delete-all-records.sql** in Supabase
4. Verify: All data cleared, settings preserved

### Understanding Payment Issues
1. Read: **DATABASE-FOREIGN-KEY-FIX.md**
2. Understand: invoice_id nullable requirement
3. Run: **fix-schema-missing-columns.sql** (includes this fix)
4. Test: Record payment without invoice

---

## 📊 File Categories

### Must Read (3 files)
1. README.md - Essential setup guide
2. QUICK-START.md - Fast track to running system
3. PROJECT-STATUS.md - Know what's included

### Must Run (2 files)
1. supabase-schema.sql - Creates database
2. fix-schema-missing-columns.sql - Fixes schema

### Reference Documentation (5 files)
- DEPLOYMENT-GUIDE.md
- DATABASE-FOREIGN-KEY-FIX.md
- FIX-SCHEMA-MISMATCH-ERROR.md
- HOW-TO-DELETE-ALL-RECORDS.md
- CLEANUP-SUMMARY.md

### Optional Utilities (2 files)
- delete-all-records.sql (data cleanup)
- disable-rls.sql (development only)

---

## 🔍 Finding What You Need

### "How do I set up the project?"
→ **README.md** or **QUICK-START.md**

### "What features are included?"
→ **PROJECT-STATUS.md**

### "How do I deploy to production?"
→ **DEPLOYMENT-GUIDE.md**

### "I'm getting a column not found error"
→ **FIX-SCHEMA-MISMATCH-ERROR.md**

### "How do I clear all test data?"
→ **HOW-TO-DELETE-ALL-RECORDS.md**

### "Payment recording is failing"
→ **DATABASE-FOREIGN-KEY-FIX.md**

### "What files were removed in cleanup?"
→ **CLEANUP-SUMMARY.md**

---

## ✅ Essential Files Checklist

### For Development
- [ ] README.md (read)
- [ ] .env.local (create & configure)
- [ ] supabase-schema.sql (run in Supabase)
- [ ] fix-schema-missing-columns.sql (run in Supabase)
- [ ] package.json (don't modify)
- [ ] src/ directory (your code here)

### For Production
- [ ] DEPLOYMENT-GUIDE.md (follow steps)
- [ ] PROJECT-STATUS.md (verify completion)
- [ ] Production .env (configure)
- [ ] dist/ folder (build output)

### For Troubleshooting
- [ ] FIX-SCHEMA-MISMATCH-ERROR.md
- [ ] DATABASE-FOREIGN-KEY-FIX.md
- [ ] Browser console (F12)
- [ ] Supabase logs

---

## 📝 File Modification Rules

### ✅ Files You Can/Should Edit
- `.env.local` - Add your Supabase credentials
- `src/**/*.tsx` - Edit components as needed
- `src/**/*.ts` - Edit services/utilities as needed

### ⚠️ Files You Shouldn't Edit (Unless You Know What You're Doing)
- `package.json` - Only edit to add new dependencies
- `tsconfig.json` - TypeScript config
- `vite.config.ts` - Build config
- `index.html` - HTML template

### ❌ Files You Should NEVER Edit
- `node_modules/` - Generated dependencies
- `dist/` - Build output (regenerated)
- `.env.example` - Template only

### 📖 Files That Are Read-Only Documentation
- All .md files
- All .sql files (run them, don't edit)

---

## 🎯 Quick Reference

**Total Files in Root:** 19  
**Documentation:** 8 files  
**SQL Scripts:** 4 files  
**Configuration:** 7 files  

**Source Code:** ~25 files in src/  
**Components:** 16 files  
**Services:** 2 files  
**Utilities:** 3 files  
**Core:** 4 files  

**Total Project Size:** ~1.42 MB (built)  
**Lines of Code:** ~15,000 (estimated)

---

## 📌 Summary

This project has been cleaned and organized for clarity:

✅ **Minimal documentation** - Only essential files  
✅ **Consolidated guides** - No redundancy  
✅ **Clear naming** - Purpose obvious from filename  
✅ **Logical structure** - Easy to navigate  
✅ **Production-ready** - Clean, professional  

**Everything you need, nothing you don't!** ✨
