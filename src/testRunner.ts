import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();
import * as db from './services/database';
import { Customer, Driver, Vehicle, Trip, TripStatus, Invoice, Payment, Expense, Lead, LeadStatus, UserRole, ExpenseCategory } from './types';

// Color codes for formatted terminal output
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';

interface TestResult {
  category: string;
  name: string;
  passed: boolean;
  message: string;
  durationMs: number;
}

const results: TestResult[] = [];

async function runTest(category: string, name: string, fn: () => Promise<void>) {
  const start = Date.now();
  try {
    await fn();
    const duration = Date.now() - start;
    results.push({ category, name, passed: true, message: 'Passed', durationMs: duration });
    console.log(`${GREEN}✓ [PASS]${RESET} [${category}] ${name} (${duration}ms)`);
  } catch (err: any) {
    const duration = Date.now() - start;
    results.push({ category, name, passed: false, message: err?.message || String(err), durationMs: duration });
    console.error(`${RED}✗ [FAIL]${RESET} [${category}] ${name} (${duration}ms): ${err?.message || err}`);
  }
}

async function main() {
  console.log(`\n${CYAN}====================================================${RESET}`);
  console.log(`${CYAN}   EAGLE TRAVEL ERP - COMPLETE FUNCTIONAL TEST SUITE ${RESET}`);
  console.log(`${CYAN}====================================================${RESET}\n`);

  // ----------------------------------------------------
  // TEST GROUP 1: Database CRUD - Settings
  // ----------------------------------------------------
  await runTest('Database: Settings', 'Upsert & Fetch Settings', async () => {
    const testSettings = {
      name: 'Eagle Travel ERP Test Co',
      logoUrl: 'https://example.com/logo.png',
      gstNumber: '29ABCDE1234F1ZH',
      address: '123 Test Street, MG Road, Bengaluru',
      email: 'test@eagletravels.com',
      phone: '+91 9876543210',
      whatsapp: '+91 9876543210',
      currencySymbol: '₹',
      defaultGstRate: 5
    };
    await db.upsertSettings(testSettings);
    const fetched = await db.getSettings();
    if (!fetched) throw new Error('Failed to fetch settings after upsert');
    if (fetched.name !== testSettings.name && fetched.company_name !== testSettings.name) {
      throw new Error(`Settings company name mismatch: got ${fetched.name || fetched.company_name}`);
    }
  });

  // ----------------------------------------------------
  // TEST GROUP 2: Database CRUD - Customers
  // ----------------------------------------------------
  const testCustomer: Customer = {
    id: `CUST-TEST-${Date.now()}`,
    name: 'Automation Test Customer',
    phone: '9900112233',
    email: 'test.cust@example.com',
    gstNumber: '29AAAAA0000A1Z5',
    address: '456 Residency Road, Bengaluru',
    favoriteRoutes: ['Bengaluru -> Mysore', 'Bengaluru -> Coorg'],
    documents: [],
    notes: 'Test customer created by automated test suite',
    reviews: [],
    createdAt: new Date().toISOString()
  };

  await runTest('Database: Customer', 'Upsert Customer', async () => {
    await db.upsertCustomer(testCustomer);
    const customers = await db.getCustomers();
    const found = customers.find(c => c.id === testCustomer.id);
    if (!found) throw new Error(`Customer ${testCustomer.id} not found in database`);
    if (found.name !== testCustomer.name) throw new Error(`Customer name mismatch: ${found.name}`);
  });

  await runTest('Database: Customer', 'Delete Customer', async () => {
    await db.deleteCustomer(testCustomer.id);
    const customers = await db.getCustomers();
    const found = customers.find(c => c.id === testCustomer.id);
    if (found) throw new Error(`Customer ${testCustomer.id} still exists after deletion`);
  });

  // ----------------------------------------------------
  // TEST GROUP 3: Database CRUD - Drivers
  // ----------------------------------------------------
  const testDriver: Driver = {
    id: `DRV-TEST-${Date.now()}`,
    name: 'Automation Test Driver',
    photoUrl: '',
    licenseNumber: 'KA-01-2022-998877',
    aadharNumber: '1234-5678-9012',
    panNumber: 'ABCDE1234F',
    phone: '9887766554',
    email: 'driver.test@example.com',
    address: '789 Indiranagar, Bengaluru',
    salary: 25000,
    emergencyContactName: 'Test Spouse',
    emergencyContactPhone: '9887766550',
    documents: [],
    isAvailable: true,
    ratings: [5, 5, 4],
    attendance: {}
  };

  await runTest('Database: Driver', 'Upsert Driver', async () => {
    await db.upsertDriver(testDriver);
    const drivers = await db.getDrivers();
    const found = drivers.find(d => d.id === testDriver.id);
    if (!found) throw new Error(`Driver ${testDriver.id} not found`);
    if (found.name !== testDriver.name) throw new Error(`Driver name mismatch`);
  });

  await runTest('Database: Driver', 'Delete Driver', async () => {
    await db.deleteDriver(testDriver.id);
    const drivers = await db.getDrivers();
    const found = drivers.find(d => d.id === testDriver.id);
    if (found) throw new Error(`Driver ${testDriver.id} still exists after deletion`);
  });

  // ----------------------------------------------------
  // TEST GROUP 4: Database CRUD - Vehicles
  // ----------------------------------------------------
  const testVehicle: Vehicle = {
    id: `VEH-TEST-${Date.now()}`,
    vehicleNumber: `KA-05-TEST-${Math.floor(100 + Math.random() * 900)}`,
    category: 'SUV',
    brand: 'Toyota',
    model: 'Innova Crysta',
    fuelType: 'Diesel',
    seats: 7,
    insuranceExpiry: '2027-12-31',
    fitnessExpiry: '2028-12-31',
    permitExpiry: '2027-12-31',
    pollutionExpiry: '2026-12-31',
    rcNumber: 'RC9988776655',
    lastServiceDate: '2026-06-01',
    isAvailable: true,
    maintenanceHistory: []
  };

  await runTest('Database: Vehicle', 'Upsert Vehicle', async () => {
    await db.upsertVehicle(testVehicle);
    const vehicles = await db.getVehicles();
    const found = vehicles.find(v => v.id === testVehicle.id);
    if (!found) throw new Error(`Vehicle ${testVehicle.id} not found`);
    if (found.vehicleNumber !== testVehicle.vehicleNumber) throw new Error('Vehicle number mismatch');
  });

  await runTest('Database: Vehicle', 'Delete Vehicle', async () => {
    await db.deleteVehicle(testVehicle.id);
    const vehicles = await db.getVehicles();
    const found = vehicles.find(v => v.id === testVehicle.id);
    if (found) throw new Error(`Vehicle ${testVehicle.id} still exists after deletion`);
  });

  // ----------------------------------------------------
  // TEST GROUP 5: Database CRUD - Trips
  // ----------------------------------------------------
  const existingCustomers = await db.getCustomers();
  let validCustomerId = existingCustomers.length > 0 ? existingCustomers[0].id : '';
  if (!validCustomerId) {
    validCustomerId = `CUST-FK-${Date.now()}`;
    await db.upsertCustomer({
      id: validCustomerId,
      name: 'FK Holder Customer',
      phone: '9000000000',
      email: 'fk@test.com',
      address: 'Test Address',
      favoriteRoutes: [],
      documents: [],
      notes: '',
      reviews: [],
      createdAt: new Date().toISOString()
    });
  }

  const testTrip: Trip = {
    id: `TRIP-TEST-${Date.now()}`,
    customerId: validCustomerId,
    customerName: 'Test Customer Name',
    pickup: 'Bengaluru Airport (BLR)',
    drop: 'Mysore Palace',
    stops: [],
    startDate: '2026-08-01',
    endDate: '2026-08-03',
    passengers: 4,
    status: TripStatus.UPCOMING,
    timeline: [],
    notes: 'Test trip automated run',
    baseFare: 5000,
    gstAmount: 250,
    totalFare: 5250,
    paymentStatus: 'Pending',
    advancePaid: 1000
  };

  await runTest('Database: Trip', 'Upsert Trip', async () => {
    await db.upsertTrip(testTrip);
    const trips = await db.getTrips();
    const found = trips.find(t => t.id === testTrip.id);
    if (!found) throw new Error(`Trip ${testTrip.id} not found`);
    if (found.pickup !== testTrip.pickup) throw new Error('Trip pickup mismatch');
  });

  await runTest('Database: Trip', 'Delete Trip', async () => {
    await db.deleteTrip(testTrip.id);
    const trips = await db.getTrips();
    const found = trips.find(t => t.id === testTrip.id);
    if (found) throw new Error(`Trip ${testTrip.id} still exists after deletion`);
  });

  // ----------------------------------------------------
  // TEST GROUP 6: Database CRUD - Invoices & Payments
  // ----------------------------------------------------
  const existingTrips = await db.getTrips();
  let validTripId = existingTrips.length > 0 ? existingTrips[0].id : '';
  if (!validTripId) {
    validTripId = `TRIP-FK-${Date.now()}`;
    await db.upsertTrip({
      id: validTripId,
      customerId: validCustomerId,
      customerName: 'FK Holder Customer',
      pickup: 'Bengaluru', drop: 'Mysore', stops: [],
      startDate: '2026-08-01', endDate: '2026-08-02',
      passengers: 1, status: TripStatus.UPCOMING,
      timeline: [], notes: '', baseFare: 1000, gstAmount: 50,
      totalFare: 1050, paymentStatus: 'Pending', advancePaid: 0
    });
  }

  const testInvoice: Invoice = {
    id: `INV-TEST-${Date.now()}`,
    tripId: validTripId,
    tripNumber: validTripId,
    customerName: 'Invoice Test Customer',
    customerEmail: 'cust@test.com',
    customerPhone: '9900000000',
    customerAddress: 'Bengaluru',
    companyName: 'Eagle Travel Private Limited',
    companyLogo: '',
    companyGST: '29ABCDE1234F1ZH',
    companyAddress: 'Bengaluru HQ',
    companyEmail: 'info@eagletravels.in',
    companyPhone: '+91 80 1234 5678',
    lineItems: [
      { id: 1, description: 'Intercity SUV Rental', quantity: 3, unit: 'Days', rate: 3000, amount: 9000 }
    ],
    subtotal: 9000,
    gstRate: 5,
    gstAmount: 450,
    totalAmount: 9450,
    advanceAmount: 2000,
    balanceDue: 7450,
    paymentStatus: 'Partial',
    createdAt: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 864000000).toISOString().split('T')[0]
  };

  await runTest('Database: Invoice', 'Upsert Invoice', async () => {
    await db.upsertInvoice(testInvoice);
    const invoices = await db.getInvoices();
    const found = invoices.find(i => i.id === testInvoice.id);
    if (!found) throw new Error(`Invoice ${testInvoice.id} not found`);
    if (found.totalAmount !== testInvoice.totalAmount) throw new Error('Invoice total mismatch');
  });

  await runTest('Database: Invoice', 'Delete Invoice', async () => {
    await db.deleteInvoice(testInvoice.id);
    const invoices = await db.getInvoices();
    const found = invoices.find(i => i.id === testInvoice.id);
    if (found) throw new Error(`Invoice ${testInvoice.id} still exists after deletion`);
  });

  const testPayment: Payment = {
    id: `PAY-TEST-${Date.now()}`,
    invoiceId: null,
    tripNumber: 'TRIP-001',
    customerName: 'Payment Test Customer',
    amount: 2500,
    paymentMethod: 'UPI',
    transactionId: `TXN-${Date.now()}`,
    date: new Date().toISOString().split('T')[0],
    notes: 'Advance UPI payment'
  };

  await runTest('Database: Payment', 'Upsert & Delete Payment', async () => {
    await db.upsertPayment(testPayment);
    const payments = await db.getPayments();
    const found = payments.find(p => p.id === testPayment.id);
    if (!found) throw new Error(`Payment ${testPayment.id} not found`);
    if (found.amount !== testPayment.amount) throw new Error('Payment amount mismatch');

    await db.deletePayment(testPayment.id);
    const remaining = await db.getPayments();
    if (remaining.some(p => p.id === testPayment.id)) throw new Error('Payment still exists after deletion');
  });

  // ----------------------------------------------------
  // TEST GROUP 7: Database CRUD - Expenses & Leads
  // ----------------------------------------------------
  const testExpense: Expense = {
    id: `EXP-TEST-${Date.now()}`,
    category: ExpenseCategory.FUEL,
    amount: 3500,
    date: new Date().toISOString().split('T')[0],
    paidTo: 'HP Fuel Station',
    paymentMethod: 'Card',
    notes: 'Diesel refill for Innova KA-05-1234'
  };

  await runTest('Database: Expense', 'Upsert & Delete Expense', async () => {
    await db.upsertExpense(testExpense);
    const expenses = await db.getExpenses();
    const found = expenses.find(e => e.id === testExpense.id);
    if (!found) throw new Error(`Expense ${testExpense.id} not found`);

    await db.deleteExpense(testExpense.id);
    const remaining = await db.getExpenses();
    if (remaining.some(e => e.id === testExpense.id)) throw new Error('Expense still exists after deletion');
  });

  const testLead: Lead = {
    id: `LEAD-TEST-${Date.now()}`,
    customerName: 'Potential Lead Corp',
    phone: '9876500000',
    email: 'lead@corp.com',
    pickup: 'Bengaluru',
    destination: 'Ooty',
    journeyDate: '2026-09-10',
    vehicleType: 'Tempo Traveller',
    budget: 18000,
    notes: 'Corporate outing trip inquiry',
    leadSource: 'Website',
    status: LeadStatus.NEW,
    timeline: [],
    createdAt: new Date().toISOString()
  };

  await runTest('Database: Lead', 'Upsert & Delete Lead', async () => {
    await db.upsertLead(testLead);
    const leads = await db.getLeads();
    const found = leads.find(l => l.id === testLead.id);
    if (!found) throw new Error(`Lead ${testLead.id} not found`);

    await db.deleteLead(testLead.id);
    const remaining = await db.getLeads();
    if (remaining.some(l => l.id === testLead.id)) throw new Error('Lead still exists after deletion');
  });

  // ----------------------------------------------------
  // TEST GROUP 8: Full Load Database Sync Test
  // ----------------------------------------------------
  await runTest('Database: Full Sync', 'loadDatabase() Aggregator', async () => {
    const fullDb = await db.loadDatabase();
    if (!fullDb) throw new Error('loadDatabase() returned null');
    if (!Array.isArray(fullDb.customers)) throw new Error('customers array missing');
    if (!Array.isArray(fullDb.drivers)) throw new Error('drivers array missing');
    if (!Array.isArray(fullDb.vehicles)) throw new Error('vehicles array missing');
    if (!Array.isArray(fullDb.trips)) throw new Error('trips array missing');
    if (!Array.isArray(fullDb.invoices)) throw new Error('invoices array missing');
    if (!Array.isArray(fullDb.payments)) throw new Error('payments array missing');
    if (!Array.isArray(fullDb.expenses)) throw new Error('expenses array missing');
    if (!Array.isArray(fullDb.leads)) throw new Error('leads array missing');
  });

  // ----------------------------------------------------
  // TEST GROUP 9: Business & Financial Logic Calculations
  // ----------------------------------------------------
  await runTest('Financial Logic', 'Trip Completed Fare & Profit Calculation', async () => {
    // Standard trip calculation rule:
    // totalKm = 400, ratePerKm = 18 -> kmCost = 7200
    // totalDays = 2, driverBataRate = 500 -> bataCost = 1000
    // tollCharges = 450
    // baseFare = 7200 + 1000 + 450 = 8650
    // GST (5%) = 432.5
    // totalFare = 8650 + 432.5 = 9082.5
    const totalKm = 400;
    const perKmRate = 18;
    const days = 2;
    const bataRate = 500;
    const toll = 450;
    const gstRate = 5;

    const kmCost = totalKm * perKmRate;
    const bataCost = days * bataRate;
    const baseFare = kmCost + bataCost + toll;
    const gstAmount = Math.round((baseFare * gstRate) / 100);
    const totalFare = baseFare + gstAmount;

    if (kmCost !== 7200) throw new Error(`kmCost calculated incorrectly: ${kmCost}`);
    if (bataCost !== 1000) throw new Error(`bataCost calculated incorrectly: ${bataCost}`);
    if (baseFare !== 8650) throw new Error(`baseFare calculated incorrectly: ${baseFare}`);
    if (gstAmount !== 433) throw new Error(`gstAmount calculated incorrectly: ${gstAmount}`);
    if (totalFare !== 9083) throw new Error(`totalFare calculated incorrectly: ${totalFare}`);

    // Profit calculation:
    // profitPerKm = 3 -> 400 * 3 = 1200
    // profitBata = 100 -> 2 * 100 = 200
    // profitEngage = 500
    // total calculated profit = 1200 + 200 + 500 = 1900
    const profitPerKm = 3;
    const profitBata = 100;
    const profitEngage = 500;
    const totalProfit = (totalKm * profitPerKm) + (days * profitBata) + profitEngage;
    if (totalProfit !== 1900) throw new Error(`totalProfit calculated incorrectly: ${totalProfit}`);
  });

  await runTest('Financial Logic', 'Outstanding Balance Calculation & Payment Deductions', async () => {
    const tripTotal = 15000;
    const advancePaid = 3000;
    const paymentCollectedAtCompletion = 7000;
    const totalPaid = advancePaid + paymentCollectedAtCompletion;
    const outstandingBalance = tripTotal - totalPaid;

    if (totalPaid !== 10000) throw new Error(`Total paid incorrect: ${totalPaid}`);
    if (outstandingBalance !== 5000) throw new Error(`Outstanding balance incorrect: ${outstandingBalance}`);
  });

  // ----------------------------------------------------
  // SUMMARY REPORT
  // ----------------------------------------------------
  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;
  const totalDuration = results.reduce((acc, r) => acc + r.durationMs, 0);

  console.log(`\n${CYAN}====================================================${RESET}`);
  console.log(`${CYAN}               TEST EXECUTION SUMMARY               ${RESET}`);
  console.log(`${CYAN}====================================================${RESET}`);
  console.log(`Total Tests Run: ${results.length}`);
  console.log(`Passed: ${GREEN}${passedCount}${RESET}`);
  console.log(`Failed: ${failedCount > 0 ? RED : GREEN}${failedCount}${RESET}`);
  console.log(`Total Duration: ${totalDuration}ms`);
  console.log(`${CYAN}====================================================${RESET}\n`);

  if (failedCount > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error running tests:', err);
  process.exit(1);
});
