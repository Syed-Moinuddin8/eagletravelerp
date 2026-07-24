# Eagle Travel ERP

A comprehensive Enterprise Resource Planning (ERP) system for travel and transport companies, built with React, TypeScript, and Supabase.

## 🚀 Features

### Core Modules
- **Dashboard** - Real-time metrics and analytics
- **Trips Management** - Complete trip lifecycle management
- **Customer Management** - Customer profiles, documents, and reviews
- **Driver Management** - Driver profiles, documents, ratings, and attendance
- **Vehicle Management** - Fleet management with maintenance tracking
- **Payment Ledger** - Financial tracking and reconciliation
- **Invoicing** - Automated invoice generation with GST
- **Expenses** - Expense tracking and categorization
- **Reports** - Comprehensive business reports
- **Calendar** - Trip scheduling and planning

### Key Features
- **Real-time Database Sync** - Supabase integration with local fallback
- **Payment Tracking** - Track payments, outstanding balances, and receivables
- **Trip Calculations** - Automatic profit calculations with stored rates
- **Invoice Generation** - GST-compliant invoice generation
- **Document Management** - Upload and manage customer/driver documents
- **Analytics** - Revenue, profit, and expense analytics
- **Export/Import** - Backup and restore database functionality

## 📋 Requirements

- Node.js 16+ and npm
- Supabase account (free tier works)
- Modern web browser

## 🛠️ Installation

### 1. Clone and Install
```bash
cd eagle-travels-erp
npm install
```

### 2. Configure Supabase
Create a `.env.local` file:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Set Up Database
1. Go to your Supabase Dashboard → SQL Editor
2. Run `supabase-schema.sql` to create all tables
3. Run `fix-schema-missing-columns.sql` to add required columns
4. (Optional) Run `disable-rls.sql` if not using Row Level Security

### 4. Start Development Server
```bash
npm run dev
```

Open http://localhost:3000

### 5. Build for Production
```bash
npm run build
```

## 📁 Project Structure

```
eagle-travels-erp/
├── src/
│   ├── components/          # React components
│   │   ├── DashboardView.tsx
│   │   ├── TripsView.tsx
│   │   ├── CustomersView.tsx
│   │   ├── PaymentsView.tsx
│   │   ├── InvoicesView.tsx
│   │   ├── DriversView.tsx
│   │   ├── VehiclesView.tsx
│   │   ├── ExpensesView.tsx
│   │   ├── ReportsView.tsx
│   │   ├── SettingsView.tsx
│   │   └── ...
│   ├── services/            # Business logic
│   │   ├── database.ts      # Supabase integration
│   │   └── migrateData.ts   # Data migration
│   ├── utils/               # Utilities
│   │   └── csvExport.ts
│   ├── data/                # State management
│   │   ├── stateManager.ts
│   │   └── seedData.ts
│   ├── lib/                 # External integrations
│   │   └── supabaseClient.ts
│   ├── types.ts             # TypeScript types
│   ├── App.tsx              # Main app component
│   └── main.tsx             # App entry point
├── supabase-schema.sql      # Database schema
├── fix-schema-missing-columns.sql  # Schema updates
├── delete-all-records.sql   # Database cleanup
├── disable-rls.sql          # Disable Row Level Security
└── package.json
```

## 🗄️ Database Setup

### Required Tables
The system uses 20 Supabase tables:
- settings, employees, customers, drivers, vehicles
- trips, leads, invoices, payments, expenses
- notifications, and related junction tables

### Initial Setup
1. Run `supabase-schema.sql` - Creates all tables
2. Run `fix-schema-missing-columns.sql` - Adds required columns
3. (Optional) Run `disable-rls.sql` - For development

## 💳 Payment Ledger System

### Features
- **Outstanding Balance Tracking** - Real-time calculation from trips + payments
- **Trip Financial Ledger** - Complete payment history per trip
- **Collectable Receivables** - Outstanding customer balances
- **Edit Balance** - Quick balance adjustments
- **Payment Recording** - Multiple payment methods support
- **Invoice Integration** - Optional invoice linkage

### How It Works
```
Trip Completion → Store Calculation Details → Payment Record → Outstanding Balance
                                          ↓
                                    Invoice (Optional)
```

## 🔧 Common Tasks

### Delete All Records
1. Go to Settings → System Tab → Dangerous Actions Area
2. Click "Delete All Records (Keep Settings)"
3. Confirm twice
4. All data cleared, settings preserved

### Backup & Restore
1. Settings → System → "Export Backup (.json)"
2. Save file locally
3. To restore: "Select & Upload Backup"

### Add New Trip
1. Trips → "Book New Trip"
2. Fill trip details
3. Assign driver and vehicle
4. Save

### Complete Trip & Record Payment
1. Open trip → "Complete Trip"
2. Enter actual KMs, days, toll charges
3. System calculates fare
4. Record payment collected
5. Confirm completion

### View Outstanding Balances
1. Go to Payments → Payment Ledger
2. Check "Collectable Receivables" panel
3. Click "Edit Balance" to adjust
4. Click "Details" to see payment breakdown

## 📊 Key Metrics

The dashboard shows:
- Total Revenue
- Total Profit
- Outstanding Receivables
- Active Trips
- Fleet Utilization
- Driver Availability

## 🔐 Security Notes

### For Development
- RLS (Row Level Security) can be disabled: `disable-rls.sql`
- Use `.env.local` for credentials (never commit!)

### For Production
- Enable RLS in Supabase
- Set up proper authentication
- Use environment variables
- Enable HTTPS

## 🐛 Troubleshooting

### "Could not find column" error
**Solution:** Run `fix-schema-missing-columns.sql` in Supabase SQL Editor

### Data not saving
1. Check Supabase connection in `.env.local`
2. Verify credentials are correct
3. Check browser console for errors
4. Ensure schema migrations are run

### Outstanding balance not updating
1. Hard refresh: Ctrl + Shift + R
2. Clear browser cache
3. Check if payments are recorded
4. Verify trip completion status

## 📚 Documentation

- **DEPLOYMENT-GUIDE.md** - Production deployment instructions
- **DATABASE-FOREIGN-KEY-FIX.md** - Database constraint fixes
- **FIX-SCHEMA-MISMATCH-ERROR.md** - Schema error troubleshooting
- **HOW-TO-DELETE-ALL-RECORDS.md** - Data cleanup guide
- **PROJECT-DOCUMENTATION.md** - Detailed feature documentation
- **FINAL-PROJECT-STATUS.md** - Project completion status

## 🤝 Contributing

This is a private project. For modifications:
1. Test locally first
2. Backup database before major changes
3. Run `npm run build` to verify
4. Update documentation if needed

## 📝 License

Proprietary - Eagle Travel Private Limited

## 🆘 Support

For issues or questions:
1. Check documentation files
2. Review browser console errors
3. Verify Supabase configuration
4. Check database schema is up to date

---

**Version:** 1.0.0  
**Last Updated:** July 2026  
**Built with:** React, TypeScript, Vite, Supabase, Tailwind CSS
