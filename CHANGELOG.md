# Eagle Travel ERP - Changelog

## [Latest Update] - 2026-07-26

### 🎯 Recent Updates

#### Dashboard Recent Activity Sorting Fix
**Issue**: Recent Dispatch Activity section was not showing trips in proper descending order (most recent first).

**Fix**:
- Replaced simple `.reverse()` with proper `.sort()` method
- Now sorts by trip ID in descending order (most recent trips appear first)
- Ensures consistent ordering regardless of how trips are stored

**Files Modified**:
- `src/components/DashboardView.tsx`

---

### 🐛 Critical Bug Fixes

#### 1. Engage Amount Not Included in Trip Cost
**Issue**: When completing a trip, the Rate Engage (Base) amount was not being added to the total trip cost calculation.

**Fix**:
- Added `engageAmount` from customer's `assignedRateEngage` to trip completion calculation
- Updated formula: `totalFare = engageAmount + kmCost + bataCost + tollCost`
- Updated trip timeline message to show engage amount
- Added engage amount display in Payment Ledger breakdown

**Files Modified**:
- `src/components/TripsView.tsx`
- `src/components/PaymentsView.tsx`

**Example**:
```
Before: Per KM (₹1,677) + Bata (₹400) = ₹2,077
After:  Engage (₹1,000) + Per KM (₹1,677) + Bata (₹400) = ₹3,077 ✅
```

---

#### 2. Payment Ledger Showing Upcoming Trips
**Issue**: Payment Ledger was displaying trips with "Upcoming" status and calculating outstanding amounts before trips were completed.

**Fix**:
- Modified `totalOutstanding` calculation to only count trips with status = "Completed"
- Updated `outstandingTrips` filter to exclude Upcoming and Running trips
- Changed Trip Financial Ledger table to use filtered `outstandingTrips` array

**Files Modified**:
- `src/components/PaymentsView.tsx`

**Impact**:
- Outstanding Receivables now only counts completed trips
- Trip Financial Ledger only shows completed trips with unpaid balances
- Collectable Receivables section properly filtered

---

#### 3. Operator Settings Persistence
**Issue**: Operator details in Settings → Operator section were resetting to demo values after server restart.

**Fix**:
- Added `avatarUrl` field to `Employee` interface
- Fixed session loading to use `avatarUrl` (camelCase) instead of `avatar_url` (snake_case)
- Updated default employee creation to include all required fields

**Files Modified**:
- `src/types.ts`
- `src/services/database.ts`

---

#### 4. Console TypeError with toLocaleString
**Issue**: Console error "TypeError: Cannot read properties of null (reading 'toLocaleString')" in PaymentsView.

**Fix**:
- Changed null checks from `!== undefined` to `!= null` (catches both null and undefined)
- Added `Number()` wrapper to ensure values are valid numbers before calling `.toLocaleString()`
- Applied to: `kmCost`, `bataCost`, `tollCharges`, `calculatedSubtotal`, `engageAmount`

**Files Modified**:
- `src/components/PaymentsView.tsx`

---

### 🧹 Project Cleanup

#### Removed Redundant Documentation (14 files):
- `CLEANUP-COMPLETE-REPORT.md`
- `CLEANUP-SUMMARY.md`
- `DATABASE-FOREIGN-KEY-FIX.md`
- `DEPLOYMENT-GUIDE.md`
- `DEPLOYMENT-QUICK-START.md`
- `ENGAGE-AMOUNT-FIX.md`
- `GITHUB-VERCEL-COMPLETE.md`
- `HOW-TO-DELETE-ALL-RECORDS.md`
- `OPERATOR-SESSION-FIX.md`
- `OPERATOR-SETTINGS-PERSISTENCE-FIX.md`
- `PAYMENT-LEDGER-UPCOMING-TRIPS-FIX.md`
- `PROJECT-FILES-GUIDE.md`
- `PROJECT-STATUS.md`
- `SETTINGS-PERSISTENCE-FIX.md`

#### Removed Temporary SQL Scripts (2 files):
- `delete-all-records.sql`
- `disable-rls.sql`

#### Removed Unused Code (1 file):
- `src/testRunner.ts`

#### Kept Essential Documentation:
- `README.md` - Main project documentation
- `QUICK-START.md` - Getting started guide
- `VERCEL-DEPLOYMENT-GUIDE.md` - Deployment instructions
- `ENVIRONMENT-VARIABLES-GUIDE.md` - Configuration guide
- `FIX-SCHEMA-MISMATCH-ERROR.md` - Important troubleshooting guide
- `fix-schema-missing-columns.sql` - Required database migration
- `supabase-schema.sql` - Essential database schema

---

### 📊 Statistics

**Code Changes**:
- 30 files changed
- 903 insertions(+)
- 4,318 deletions(-)

**Net Reduction**: 3,415 lines of code/documentation removed

---

### ✅ Testing Checklist

All features have been tested and verified:
- [x] Engage amount correctly added to trip cost
- [x] Payment Ledger only shows completed trips
- [x] Operator settings persist after restart
- [x] No console errors
- [x] Outstanding receivables calculated correctly
- [x] Trip cost breakdown displays properly
- [x] All essential documentation retained

---

### 🚀 Deployment

**GitHub Repository**: https://github.com/Syed-Moinuddin8/eagletravelerp

**Commit**: 9f4bac3

**Status**: ✅ All changes pushed to GitHub and ready for Vercel auto-deployment

---

### 📝 Notes for Users

1. **Database Migration Required**: If you haven't already, run `fix-schema-missing-columns.sql` in Supabase SQL Editor to add missing columns.

2. **Testing Engage Amount**: Create a new trip for a customer with an engage amount set, complete the trip, and verify the total includes the engage amount.

3. **Payment Ledger**: Only completed trips will appear in the Payment Ledger. Upcoming and running trips are excluded.

4. **Operator Settings**: Changes to operator details in Settings will now persist across server restarts.

---

**Date**: July 26, 2026  
**Version**: Production-ready  
**Maintainer**: Eagle Travel ERP Team
