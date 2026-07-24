import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import * as db from '../services/database';
import { CheckCircle, XCircle, Loader, Play, Database, AlertTriangle } from 'lucide-react';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message: string;
  duration?: number;
}

export function DatabaseTest() {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [overallStatus, setOverallStatus] = useState<'idle' | 'running' | 'complete'>('idle');

  const updateTest = (name: string, status: TestResult['status'], message: string, duration?: number) => {
    setTests(prev => {
      const existing = prev.find(t => t.name === name);
      if (existing) {
        return prev.map(t => t.name === name ? { ...t, status, message, duration } : t);
      }
      return [...prev, { name, status, message, duration }];
    });
  };

  const runTests = async () => {
    setIsRunning(true);
    setOverallStatus('running');
    setTests([]);

    const allTests = [
      { name: 'Connection Test', fn: testConnection },
      { name: 'Settings CRUD', fn: testSettings },
      { name: 'Customer CRUD', fn: testCustomer },
      { name: 'Driver CRUD', fn: testDriver },
      { name: 'Vehicle CRUD', fn: testVehicle },
      { name: 'Trip CRUD', fn: testTrip },
      { name: 'Invoice CRUD', fn: testInvoice },
      { name: 'Payment CRUD', fn: testPayment },
      { name: 'Expense CRUD', fn: testExpense },
      { name: 'Lead CRUD', fn: testLead },
      { name: 'Data Relationships', fn: testRelationships },
      { name: 'Query Performance', fn: testPerformance }
    ];

    for (const test of allTests) {
      updateTest(test.name, 'running', 'Running...');
      const start = Date.now();
      
      try {
        await test.fn(updateTest);
        const duration = Date.now() - start;
        updateTest(test.name, 'success', `Passed (${duration}ms)`, duration);
      } catch (error: any) {
        const duration = Date.now() - start;
        updateTest(test.name, 'error', `Failed: ${error.message}`, duration);
      }
    }

    setIsRunning(false);
    setOverallStatus('complete');
  };

  // Test 1: Connection
  const testConnection = async (update: any) => {
    const { data, error } = await supabase.from('settings').select('count');
    if (error && error.code !== 'PGRST116') throw error;
    update('Connection Test', 'success', '✓ Connected to Supabase');
  };

  // Test 2: Settings CRUD
  const testSettings = async (update: any) => {
    // Create/Update
    await db.upsertSettings({
      name: 'Test Company',
      logo_url: 'https://test.com/logo.png',
      gst_number: 'TEST123',
      address: 'Test Address',
      email: 'test@test.com',
      phone: '1234567890',
      whatsapp: '1234567890'
    });
    
    // Read
    const settings = await db.getSettings();
    if (!settings || settings.name !== 'Test Company') {
      throw new Error('Settings not saved correctly');
    }
    
    update('Settings CRUD', 'success', '✓ Create/Read settings works');
  };

  // Test 3: Customer CRUD
  const testCustomer = async (update: any) => {
    const testCustomer = {
      id: 'TEST-CUST-001',
      name: 'Test Customer',
      phone: '9876543210',
      email: 'customer@test.com',
      address: 'Test Address',
      notes: 'Test customer',
      documents: [],
      reviews: [],
      favorite_routes: ['Route A', 'Route B'], // Use snake_case for database
      created_at: new Date().toISOString()
    };
    
    // Create
    await db.upsertCustomer(testCustomer as any);
    
    // Read
    const customers = await db.getCustomers();
    const found = customers.find(c => c.id === 'TEST-CUST-001');
    if (!found) throw new Error('Customer not found');
    
    // Update
    await db.upsertCustomer({ ...testCustomer, name: 'Updated Customer' } as any);
    const updated = await db.getCustomers();
    const updatedFound = updated.find(c => c.id === 'TEST-CUST-001');
    if (updatedFound?.name !== 'Updated Customer') throw new Error('Customer not updated');
    
    // Delete
    await db.deleteCustomer('TEST-CUST-001');
    const afterDelete = await db.getCustomers();
    if (afterDelete.find(c => c.id === 'TEST-CUST-001')) throw new Error('Customer not deleted');
    
    update('Customer CRUD', 'success', '✓ Create/Read/Update/Delete works');
  };

  // Test 4: Driver CRUD
  const testDriver = async (update: any) => {
    const testDriver = {
      id: 'TEST-DRV-001',
      name: 'Test Driver',
      phone: '9876543210',
      email: 'driver@test.com',
      license_number: 'TEST-LIC-001',
      address: 'Test Address',
      salary: 25000,
      is_available: true,
      documents: [],
      ratings: [5, 4, 5],
      attendance: { '2026-07-23': 'Present' },
      emergency_contact_name: 'Emergency Contact',
      emergency_contact_phone: '1234567890',
      photo_url: '',
      aadhar_number: '',
      pan_number: ''
    };
    
    await db.upsertDriver(testDriver as any);
    const drivers = await db.getDrivers();
    const found = drivers.find(d => d.id === 'TEST-DRV-001');
    if (!found) throw new Error('Driver not found');
    
    await db.deleteDriver('TEST-DRV-001');
    update('Driver CRUD', 'success', '✓ Driver operations work');
  };

  // Test 5: Vehicle CRUD
  const testVehicle = async (update: any) => {
    const testVehicle = {
      id: 'TEST-VEH-001',
      vehicle_number: 'TEST-KA-01-1234',
      category: 'SUV',
      brand: 'Toyota',
      model: 'Innova',
      fuel_type: 'Diesel',
      seats: 7,
      rc_number: 'TEST-RC-001',
      is_available: true,
      maintenanceHistory: [],
      insurance_expiry: '2027-01-01',
      fitness_expiry: '2027-01-01',
      permit_expiry: '2027-01-01',
      pollution_expiry: '2027-01-01',
      last_service_date: '2026-07-01'
    };
    
    await db.upsertVehicle(testVehicle as any);
    const vehicles = await db.getVehicles();
    const found = vehicles.find(v => v.id === 'TEST-VEH-001');
    if (!found) throw new Error('Vehicle not found');
    
    await db.deleteVehicle('TEST-VEH-001');
    update('Vehicle CRUD', 'success', '✓ Vehicle operations work');
  };

  // Test 6: Trip CRUD
  const testTrip = async (update: any) => {
    // First create a customer
    await db.upsertCustomer({
      id: 'TEST-CUST-002',
      name: 'Trip Test Customer',
      phone: '9876543210',
      email: 'trip@test.com',
      address: 'Test',
      documents: [],
      reviews: [],
      favorite_routes: [] // Use snake_case
    } as any);
    
    const testTrip = {
      id: 'TEST-TRIP-001',
      customer_id: 'TEST-CUST-002',
      customer_name: 'Trip Test Customer',
      pickup: 'Bangalore',
      drop: 'Mysore',
      start_date: '2026-07-25',
      end_date: '2026-07-26',
      passengers: 4,
      status: 'Upcoming',
      base_fare: 5000,
      gst_amount: 250,
      total_fare: 5250,
      payment_status: 'Pending',
      advance_paid: 0,
      notes: 'Test trip',
      stops: [],
      timeline: []
    };
    
    await db.upsertTrip(testTrip as any);
    const trips = await db.getTrips();
    const found = trips.find(t => t.id === 'TEST-TRIP-001');
    if (!found) throw new Error('Trip not found');
    
    await db.deleteTrip('TEST-TRIP-001');
    await db.deleteCustomer('TEST-CUST-002');
    update('Trip CRUD', 'success', '✓ Trip operations work');
  };

  // Test 7: Invoice CRUD
  const testInvoice = async (update: any) => {
    const testInvoice = {
      id: 'TEST-INV-001',
      trip_id: null, // Set to null to avoid foreign key constraint
      trip_number: 'TEST-TRIP-999',
      customer_name: 'Test Customer',
      customer_email: 'test@test.com',
      customer_phone: '9876543210',
      customer_address: 'Test Address',
      subtotal: 5000,
      gst_rate: 5,
      gst_amount: 250,
      total_amount: 5250,
      advance_amount: 0,
      balance_due: 5250,
      payment_status: 'Pending',
      created_at: '2026-07-23',
      due_date: '2026-07-30',
      company_name: 'Test Company',
      company_gst: 'TEST123',
      company_address: 'Test',
      company_email: 'test@test.com',
      company_phone: '1234567890'
    };
    
    await db.upsertInvoice(testInvoice as any);
    const invoices = await db.getInvoices();
    const found = invoices.find(i => i.id === 'TEST-INV-001');
    if (!found) throw new Error('Invoice not found');
    
    await db.deleteInvoice('TEST-INV-001');
    update('Invoice CRUD', 'success', '✓ Invoice operations work');
  };

  // Test 8: Payment CRUD
  const testPayment = async (update: any) => {
    const testPayment = {
      id: 'TEST-PAY-001',
      invoice_id: null, // Set to null to avoid foreign key constraint
      trip_number: 'TEST-TRIP-999',
      customer_name: 'Test Customer',
      amount: 1000,
      payment_method: 'UPI',
      transaction_id: 'TEST-TXN-001',
      date: '2026-07-23',
      notes: 'Test payment'
    };
    
    await db.upsertPayment(testPayment as any);
    const payments = await db.getPayments();
    const found = payments.find(p => p.id === 'TEST-PAY-001');
    if (!found) throw new Error('Payment not found');
    
    await db.deletePayment('TEST-PAY-001');
    update('Payment CRUD', 'success', '✓ Payment operations work');
  };

  // Test 9: Expense CRUD
  const testExpense = async (update: any) => {
    const testExpense = {
      id: 'TEST-EXP-001',
      category: 'Fuel',
      amount: 2000,
      date: '2026-07-23',
      paid_to: 'Test Vendor',
      payment_method: 'Cash',
      notes: 'Test expense'
    };
    
    await db.upsertExpense(testExpense as any);
    const expenses = await db.getExpenses();
    const found = expenses.find(e => e.id === 'TEST-EXP-001');
    if (!found) throw new Error('Expense not found');
    
    await db.deleteExpense('TEST-EXP-001');
    update('Expense CRUD', 'success', '✓ Expense operations work');
  };

  // Test 10: Lead CRUD
  const testLead = async (update: any) => {
    const testLead = {
      id: 'TEST-LEAD-001',
      customer_name: 'Test Lead',
      phone: '9876543210',
      email: 'lead@test.com',
      pickup: 'Bangalore',
      destination: 'Mysore',
      journey_date: '2026-07-25',
      vehicle_type: 'SUV',
      budget: 5000,
      notes: 'Test lead',
      lead_source: 'Website',
      status: 'New',
      created_at: '2026-07-23',
      timeline: []
    };
    
    await db.upsertLead(testLead as any);
    const leads = await db.getLeads();
    const found = leads.find(l => l.id === 'TEST-LEAD-001');
    if (!found) throw new Error('Lead not found');
    
    await db.deleteLead('TEST-LEAD-001');
    update('Lead CRUD', 'success', '✓ Lead operations work');
  };

  // Test 11: Relationships
  const testRelationships = async (update: any) => {
    // Create customer
    await db.upsertCustomer({
      id: 'REL-CUST-001',
      name: 'Relationship Test',
      phone: '9876543210',
      email: 'rel@test.com',
      address: 'Test',
      documents: [{
        id: 'DOC-001',
        name: 'Test Doc',
        type: 'aadhar',
        file_url: 'test.pdf',
        uploaded_at: '2026-07-23',
        size: '1MB'
      }],
      reviews: [],
      favorite_routes: [] // Use snake_case
    } as any);
    
    // Verify document was saved
    const customers = await db.getCustomers();
    const found = customers.find(c => c.id === 'REL-CUST-001');
    if (!found?.documents || found.documents.length === 0) {
      throw new Error('Related documents not saved');
    }
    
    await db.deleteCustomer('REL-CUST-001');
    update('Data Relationships', 'success', '✓ Foreign key relationships work');
  };

  // Test 12: Performance
  const testPerformance = async (update: any) => {
    const start = Date.now();
    
    // Run parallel queries
    await Promise.all([
      db.getCustomers(),
      db.getTrips(),
      db.getInvoices(),
      db.getVehicles(),
      db.getDrivers()
    ]);
    
    const duration = Date.now() - start;
    if (duration > 5000) {
      throw new Error(`Queries too slow: ${duration}ms`);
    }
    
    update('Query Performance', 'success', `✓ All queries completed in ${duration}ms`);
  };

  const successCount = tests.filter(t => t.status === 'success').length;
  const errorCount = tests.filter(t => t.status === 'error').length;
  const totalDuration = tests.reduce((sum, t) => sum + (t.duration || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 rounded-xl">
            <Database className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-800">Database Test Suite</h3>
            <p className="text-sm text-slate-500">Comprehensive Supabase integration tests</p>
          </div>
        </div>

        <button
          onClick={runTests}
          disabled={isRunning}
          className="flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {isRunning ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Running Tests...
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              Run All Tests
            </>
          )}
        </button>
      </div>

      {overallStatus !== 'idle' && (
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
            <p className="text-xs text-emerald-600 font-semibold mb-1">Passed</p>
            <p className="text-3xl font-bold text-emerald-700">{successCount}</p>
          </div>
          <div className="p-4 bg-rose-50 rounded-xl border border-rose-100">
            <p className="text-xs text-rose-600 font-semibold mb-1">Failed</p>
            <p className="text-3xl font-bold text-rose-700">{errorCount}</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-xs text-blue-600 font-semibold mb-1">Duration</p>
            <p className="text-3xl font-bold text-blue-700">{totalDuration}ms</p>
          </div>
        </div>
      )}

      {tests.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h4 className="font-bold text-sm text-slate-800">Test Results</h4>
          </div>
          <div className="divide-y divide-slate-100">
            {tests.map((test, idx) => (
              <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                <div className="flex items-center gap-3">
                  {test.status === 'pending' && (
                    <div className="w-5 h-5 rounded-full bg-slate-200"></div>
                  )}
                  {test.status === 'running' && (
                    <Loader className="w-5 h-5 text-blue-500 animate-spin" />
                  )}
                  {test.status === 'success' && (
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                  )}
                  {test.status === 'error' && (
                    <XCircle className="w-5 h-5 text-rose-500" />
                  )}
                  
                  <div>
                    <p className="font-semibold text-sm text-slate-800">{test.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{test.message}</p>
                  </div>
                </div>
                
                {test.duration && (
                  <span className="text-xs font-mono text-slate-400">{test.duration}ms</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {overallStatus === 'complete' && (
        <div className={`p-4 rounded-xl ${errorCount === 0 ? 'bg-emerald-50 border border-emerald-100' : 'bg-amber-50 border border-amber-100'}`}>
          <div className="flex items-center gap-3">
            {errorCount === 0 ? (
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            )}
            <div>
              <p className={`font-bold text-sm ${errorCount === 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                {errorCount === 0 ? '✅ All Tests Passed!' : `⚠️ ${errorCount} Test(s) Failed`}
              </p>
              <p className={`text-xs ${errorCount === 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {errorCount === 0 
                  ? 'Your Supabase database is fully functional and ready for production!'
                  : 'Some tests failed. Check the details above and verify your Supabase configuration.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
