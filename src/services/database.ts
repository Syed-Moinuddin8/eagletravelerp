import { supabase } from '../lib/supabaseClient';
import type { ErpDatabase, Customer, Trip, Driver, Vehicle, Invoice, Payment, Expense, Lead, Employee, SystemNotification } from '../types';

// Helper function to convert camelCase to snake_case
function toSnakeCase(str: string): string {
  // Special handling for fields with numbers and acronyms
  const specialCases: Record<string, string> = {
    'perKmAcBelow350': 'per_km_ac_below_350',
    'perKmNonAcBelow350': 'per_km_non_ac_below_350',
    'perKmAcAbove350': 'per_km_ac_above_350',
    'perKmNonAcAbove350': 'per_km_non_ac_above_350',
    'driverBata': 'driver_bata',
    'engage': 'engage',
    'companyGST': 'company_gst',
    'customerGST': 'customer_gst',
    'gstNumber': 'gst_number',
    'gstAmount': 'gst_amount',
    'gstRate': 'gst_rate'
  };
  
  if (specialCases[str]) {
    return specialCases[str];
  }
  
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

// Helper function to convert object keys from camelCase to snake_case
function convertKeysToSnakeCase(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(convertKeysToSnakeCase);
  if (typeof obj !== 'object') return obj;
  
  const converted: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = toSnakeCase(key);
    converted[snakeKey] = value;
  }
  return converted;
}

// Helper function to convert object keys from snake_case to camelCase
function toCamelCase(str: string): string {
  // Special handling for fields with numbers and acronyms - reverse mapping
  const specialCases: Record<string, string> = {
    'per_km_ac_below_350': 'perKmAcBelow350',
    'per_km_non_ac_below_350': 'perKmNonAcBelow350',
    'per_km_ac_above_350': 'perKmAcAbove350',
    'per_km_non_ac_above_350': 'perKmNonAcAbove350',
    'driver_bata': 'driverBata',
    'engage': 'engage',
    'company_gst': 'companyGST',
    'customer_gst': 'customerGST',
    'gst_number': 'gstNumber',
    'gst_amount': 'gstAmount',
    'gst_rate': 'gstRate'
  };
  
  if (specialCases[str]) {
    return specialCases[str];
  }
  
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function convertKeysToCamelCase(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(convertKeysToCamelCase);
  if (typeof obj !== 'object') return obj;
  
  const converted: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = toCamelCase(key);
    converted[camelKey] = value;
  }
  return converted;
}

// ============================================
// SETTINGS
// ============================================
export async function getSettings() {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error('Error fetching settings:', error);
    return null;
  }
  
  // Return first row or null
  return data && data.length > 0 ? data[0] : null;
}

export async function upsertSettings(settings: any) {
  const dataToInsert = convertKeysToSnakeCase(settings);
  // Check if settings exist
  const existing = await getSettings();
  
  if (existing) {
    const { error } = await supabase
      .from('settings')
      .update(dataToInsert)
      .eq('id', existing.id);
    
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('settings')
      .insert([dataToInsert]);
    
    if (error) throw error;
  }
}

// ============================================
// EMPLOYEES
// ============================================
export async function getEmployees() {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  
  // Convert snake_case to camelCase
  return (data || []).map(emp => convertKeysToCamelCase(emp));
}

export async function upsertEmployee(employee: Employee) {
  // Convert camelCase to snake_case
  const dataToInsert = convertKeysToSnakeCase(employee);
  
  const { error } = await supabase
    .from('employees')
    .upsert([dataToInsert]);
  
  if (error) throw error;
}

export async function deleteEmployee(id: string) {
  const { error } = await supabase
    .from('employees')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// ============================================
// CUSTOMERS
// ============================================
export async function getCustomers() {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false});
  
  if (error) throw error;
  
  // Fetch related documents and reviews
  const customersWithRelations = await Promise.all(
    (data || []).map(async (customer) => {
      const [documents, reviews] = await Promise.all([
        getCustomerDocuments(customer.id),
        getCustomerReviews(customer.id)
      ]);
      
      // Convert snake_case to camelCase
      return convertKeysToCamelCase({
        ...customer,
        documents,
        reviews
      });
    })
  );
  
  return customersWithRelations;
}

export async function upsertCustomer(customer: Customer) {
  const { documents, reviews, ...customerData } = customer;
  
  // Convert camelCase to snake_case
  const dataToInsert = convertKeysToSnakeCase(customerData);
  
  const { error } = await supabase
    .from('customers')
    .upsert([dataToInsert]);
  
  if (error) throw error;
  
  // Handle documents
  if (documents && documents.length > 0) {
    await upsertCustomerDocuments(customer.id, documents);
  }
  
  // Handle reviews
  if (reviews && reviews.length > 0) {
    await upsertCustomerReviews(customer.id, reviews);
  }
}

export async function deleteCustomer(id: string) {
  try {
    await supabase.from('customer_documents').delete().eq('customer_id', id);
  } catch (e) {}
  try {
    await supabase.from('customer_reviews').delete().eq('customer_id', id);
  } catch (e) {}

  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', id);
  
  if (error && error.code !== 'PGRST116') throw error;
}

export async function getCustomerDocuments(customerId: string) {
  const { data, error } = await supabase
    .from('customer_documents')
    .select('*')
    .eq('customer_id', customerId);
  
  if (error) throw error;
  return data || [];
}

export async function upsertCustomerDocuments(customerId: string, documents: any[]) {
  const docsWithCustomerId = documents.map(doc => ({
    ...doc,
    customer_id: customerId
  }));
  
  const { error } = await supabase
    .from('customer_documents')
    .upsert(docsWithCustomerId);
  
  if (error) throw error;
}

export async function getCustomerReviews(customerId: string) {
  const { data, error } = await supabase
    .from('customer_reviews')
    .select('*')
    .eq('customer_id', customerId);
  
  if (error) throw error;
  return data || [];
}

export async function upsertCustomerReviews(customerId: string, reviews: any[]) {
  const reviewsWithCustomerId = reviews.map(review => ({
    ...review,
    customer_id: customerId
  }));
  
  const { error } = await supabase
    .from('customer_reviews')
    .upsert(reviewsWithCustomerId);
  
  if (error) throw error;
}

// ============================================
// DRIVERS
// ============================================
export async function getDrivers() {
  const { data, error } = await supabase
    .from('drivers')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  
  // Fetch related data
  const driversWithRelations = await Promise.all(
    (data || []).map(async (driver) => {
      const [documents, ratings, attendance] = await Promise.all([
        getDriverDocuments(driver.id),
        getDriverRatings(driver.id),
        getDriverAttendance(driver.id)
      ]);
      
      // Convert snake_case to camelCase
      return convertKeysToCamelCase({
        ...driver,
        documents,
        ratings: ratings.map(r => r.rating),
        attendance
      });
    })
  );
  
  return driversWithRelations;
}

export async function upsertDriver(driver: Driver) {
  const { documents, ratings, attendance, ...driverData } = driver;
  
  // Convert camelCase to snake_case
  const dataToInsert = convertKeysToSnakeCase(driverData);
  
  const { error } = await supabase
    .from('drivers')
    .upsert([dataToInsert]);
  
  if (error) throw error;
  
  // Handle documents
  if (documents && documents.length > 0) {
    await upsertDriverDocuments(driver.id, documents);
  }
  
  // Handle ratings
  if (ratings && ratings.length > 0) {
    await upsertDriverRatings(driver.id, ratings);
  }
  
  // Handle attendance
  if (attendance) {
    await upsertDriverAttendance(driver.id, attendance);
  }
}

export async function deleteDriver(id: string) {
  const { error } = await supabase
    .from('drivers')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

export async function getDriverDocuments(driverId: string) {
  const { data, error } = await supabase
    .from('driver_documents')
    .select('*')
    .eq('driver_id', driverId);
  
  if (error) throw error;
  return data || [];
}

export async function upsertDriverDocuments(driverId: string, documents: any[]) {
  const docsWithDriverId = documents.map(doc => ({
    ...doc,
    driver_id: driverId
  }));
  
  const { error } = await supabase
    .from('driver_documents')
    .upsert(docsWithDriverId);
  
  if (error) throw error;
}

export async function getDriverRatings(driverId: string) {
  const { data, error } = await supabase
    .from('driver_ratings')
    .select('*')
    .eq('driver_id', driverId);
  
  if (error) throw error;
  return data || [];
}

export async function upsertDriverRatings(driverId: string, ratings: number[]) {
  // Delete existing ratings
  await supabase
    .from('driver_ratings')
    .delete()
    .eq('driver_id', driverId);
  
  // Insert new ratings
  const ratingRecords = ratings.map(rating => ({
    driver_id: driverId,
    rating
  }));
  
  if (ratingRecords.length > 0) {
    const { error } = await supabase
      .from('driver_ratings')
      .insert(ratingRecords);
    
    if (error) throw error;
  }
}

export async function getDriverAttendance(driverId: string) {
  const { data, error } = await supabase
    .from('driver_attendance')
    .select('*')
    .eq('driver_id', driverId);
  
  if (error) throw error;
  
  // Convert to object format
  const attendance: { [date: string]: string } = {};
  (data || []).forEach(record => {
    attendance[record.date] = record.status;
  });
  
  return attendance;
}

export async function upsertDriverAttendance(driverId: string, attendance: { [date: string]: string }) {
  const records = Object.entries(attendance).map(([date, status]) => ({
    driver_id: driverId,
    date,
    status
  }));
  
  if (records.length > 0) {
    const { error } = await supabase
      .from('driver_attendance')
      .upsert(records);
    
    if (error) throw error;
  }
}

// ============================================
// VEHICLES
// ============================================
export async function getVehicles() {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  
  // Fetch maintenance history
  const vehiclesWithMaintenance = await Promise.all(
    (data || []).map(async (vehicle) => {
      const maintenance = await getVehicleMaintenance(vehicle.id);
      
      // Convert snake_case to camelCase
      return convertKeysToCamelCase({
        ...vehicle,
        maintenanceHistory: maintenance
      });
    })
  );
  
  return vehiclesWithMaintenance;
}

export async function upsertVehicle(vehicle: Vehicle) {
  const { maintenanceHistory, ...vehicleData } = vehicle;
  
  // Convert camelCase to snake_case
  const dataToInsert = convertKeysToSnakeCase(vehicleData);
  
  const { error } = await supabase
    .from('vehicles')
    .upsert([dataToInsert]);
  
  if (error) throw error;
  
  // Handle maintenance history
  if (maintenanceHistory && maintenanceHistory.length > 0) {
    await upsertVehicleMaintenance(vehicle.id, maintenanceHistory);
  }
}

export async function deleteVehicle(id: string) {
  const { error } = await supabase
    .from('vehicles')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

export async function getVehicleMaintenance(vehicleId: string) {
  const { data, error } = await supabase
    .from('vehicle_maintenance')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .order('date', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function upsertVehicleMaintenance(vehicleId: string, maintenance: any[]) {
  const maintenanceWithVehicleId = maintenance.map(m => ({
    ...m,
    vehicle_id: vehicleId
  }));
  
  const { error } = await supabase
    .from('vehicle_maintenance')
    .upsert(maintenanceWithVehicleId);
  
  if (error) throw error;
}

// ============================================
// TRIPS
// ============================================
export async function getTrips() {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  
  // Fetch related data
  const tripsWithRelations = await Promise.all(
    (data || []).map(async (trip) => {
      const [stops, timeline] = await Promise.all([
        getTripStops(trip.id),
        getTripTimeline(trip.id)
      ]);
      
      // Convert snake_case to camelCase
      const camelTrip = convertKeysToCamelCase(trip);
      
      return {
        ...camelTrip,
        drop: trip.drop_location, // Map drop_location to drop
        stops,
        timeline
      };
    })
  );
  
  return tripsWithRelations;
}

export async function upsertTrip(trip: Trip) {
  const { stops, timeline, drop, ...rest } = trip;
  
  // Convert camelCase to snake_case for database
  const dataToInsert = {
    id: trip.id,
    customer_id: trip.customerId,
    customer_name: trip.customerName,
    vehicle_id: trip.vehicleId,
    vehicle_number: trip.vehicleNumber,
    vehicle_model: trip.vehicleModel,
    driver_id: trip.driverId,
    driver_name: trip.driverName,
    driver_phone: trip.driverPhone,
    pickup: trip.pickup,
    drop_location: drop,
    start_date: trip.startDate,
    end_date: trip.endDate,
    pickup_time: trip.pickupTime,
    closing_time: trip.closingTime,
    passengers: trip.passengers,
    tour_package: trip.tourPackage,
    hotel: trip.hotel,
    guide_name: trip.guideName,
    status: trip.status,
    notes: trip.notes,
    base_fare: trip.baseFare,
    gst_amount: trip.gstAmount,
    total_fare: trip.totalFare,
    payment_status: trip.paymentStatus,
    advance_paid: trip.advancePaid,
    total_km: trip.totalKm,
    total_bata: trip.totalBata,
    toll_charges: trip.tollCharges,
    profit_per_km: trip.profitPerKm,
    profit_bata: trip.profitBata,
    profit_engage: trip.profitEngage,
    calculated_profit: trip.calculatedProfit
  };
  
  const { error } = await supabase
    .from('trips')
    .upsert([dataToInsert]);
  
  if (error) throw error;
  
  // Handle stops
  if (stops && stops.length > 0) {
    await upsertTripStops(trip.id, stops);
  }
  
  // Handle timeline
  if (timeline && timeline.length > 0) {
    await upsertTripTimeline(trip.id, timeline);
  }
}

export async function deleteTrip(id: string) {
  // Delete dependent child rows first to prevent PostgreSQL Foreign Key 409 Conflict errors
  try {
    await supabase.from('trip_stops').delete().eq('trip_id', id);
  } catch (e) {}
  try {
    await supabase.from('trip_timeline').delete().eq('trip_id', id);
  } catch (e) {}
  try {
    await supabase.from('payments').delete().eq('trip_number', id);
  } catch (e) {}
  try {
    await supabase.from('invoices').delete().eq('trip_id', id);
  } catch (e) {}
  try {
    await supabase.from('invoices').delete().eq('trip_number', id);
  } catch (e) {}

  const { error } = await supabase
    .from('trips')
    .delete()
    .eq('id', id);
  
  if (error && error.code !== 'PGRST116') {
    console.error(`Error deleting trip ${id}:`, error);
    throw error;
  }
}

export async function getTripStops(tripId: string) {
  const { data, error } = await supabase
    .from('trip_stops')
    .select('*')
    .eq('trip_id', tripId)
    .order('stop_order', { ascending: true });
  
  if (error) throw error;
  return data || [];
}

export async function upsertTripStops(tripId: string, stops: any[]) {
  // Delete existing stops
  await supabase
    .from('trip_stops')
    .delete()
    .eq('trip_id', tripId);
  
  // Insert new stops
  const stopsWithTripId = stops.map((stop, index) => ({
    ...stop,
    trip_id: tripId,
    stop_order: index
  }));
  
  if (stopsWithTripId.length > 0) {
    const { error } = await supabase
      .from('trip_stops')
      .insert(stopsWithTripId);
    
    if (error) throw error;
  }
}

export async function getTripTimeline(tripId: string) {
  const { data, error } = await supabase
    .from('trip_timeline')
    .select('*')
    .eq('trip_id', tripId)
    .order('timestamp', { ascending: true });
  
  if (error) throw error;
  return data || [];
}

export async function upsertTripTimeline(tripId: string, timeline: any[]) {
  const timelineWithTripId = timeline.map(event => ({
    ...event,
    trip_id: tripId
  }));
  
  const { error } = await supabase
    .from('trip_timeline')
    .upsert(timelineWithTripId);
  
  if (error) throw error;
}

// ============================================
// LEADS
// ============================================
export async function getLeads() {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  
  // Fetch timeline
  const leadsWithTimeline = await Promise.all(
    (data || []).map(async (lead) => {
      const timeline = await getLeadTimeline(lead.id);
      
      // Convert snake_case to camelCase
      return convertKeysToCamelCase({
        ...lead,
        timeline
      });
    })
  );
  
  return leadsWithTimeline;
}

export async function upsertLead(lead: Lead) {
  const { timeline, ...leadData } = lead;
  
  // Convert camelCase to snake_case
  const dataToInsert = convertKeysToSnakeCase(leadData);
  
  const { error } = await supabase
    .from('leads')
    .upsert([dataToInsert]);
  
  if (error) throw error;
  
  // Handle timeline
  if (timeline && timeline.length > 0) {
    await upsertLeadTimeline(lead.id, timeline);
  }
}

export async function deleteLead(id: string) {
  const { error } = await supabase
    .from('leads')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

export async function getLeadTimeline(leadId: string) {
  const { data, error } = await supabase
    .from('lead_timeline')
    .select('*')
    .eq('lead_id', leadId)
    .order('timestamp', { ascending: true });
  
  if (error) throw error;
  return data || [];
}

export async function upsertLeadTimeline(leadId: string, timeline: any[]) {
  const timelineWithLeadId = timeline.map(event => ({
    ...event,
    lead_id: leadId
  }));
  
  const { error } = await supabase
    .from('lead_timeline')
    .upsert(timelineWithLeadId);
  
  if (error) throw error;
}

// ============================================
// INVOICES
// ============================================
export async function getInvoices() {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  
  // Convert snake_case to camelCase
  return (data || []).map(inv => convertKeysToCamelCase(inv));
}

export async function upsertInvoice(invoice: Invoice) {
  // Omit lineItems before upserting if not a table column
  const { lineItems, ...rest } = invoice;
  // Convert camelCase to snake_case
  const dataToInsert = convertKeysToSnakeCase(rest);

  // Validate trip_id foreign key reference
  if (dataToInsert.trip_id) {
    const { data: tripExists } = await supabase
      .from('trips')
      .select('id')
      .eq('id', dataToInsert.trip_id)
      .maybeSingle();

    if (!tripExists) {
      // If referenced trip doesn't exist in PostgreSQL trips table, set trip_id to null
      dataToInsert.trip_id = null;
    }
  }
  
  const { error } = await supabase
    .from('invoices')
    .upsert([dataToInsert]);
  
  if (error) throw error;
}

export async function deleteInvoice(id: string) {
  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// ============================================
// PAYMENTS
// ============================================
export async function getPayments() {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .order('date', { ascending: false });
  
  if (error) throw error;
  
  // Convert snake_case to camelCase
  return (data || []).map(pay => convertKeysToCamelCase(pay));
}

export async function upsertPayment(payment: Payment) {
  // Convert camelCase to snake_case
  const dataToInsert = convertKeysToSnakeCase(payment);

  // Validate invoice_id foreign key reference
  if (dataToInsert.invoice_id) {
    const { data: invoiceExists } = await supabase
      .from('invoices')
      .select('id')
      .eq('id', dataToInsert.invoice_id)
      .maybeSingle();

    if (!invoiceExists) {
      dataToInsert.invoice_id = null;
    }
  }
  
  const { error } = await supabase
    .from('payments')
    .upsert([dataToInsert]);
  
  if (error) throw error;
}

export async function deletePayment(id: string) {
  const { error } = await supabase
    .from('payments')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// ============================================
// EXPENSES
// ============================================
export async function getExpenses() {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('date', { ascending: false });
  
  if (error) throw error;
  
  // Convert snake_case to camelCase
  return (data || []).map(exp => convertKeysToCamelCase(exp));
}

export async function upsertExpense(expense: Expense) {
  // Convert camelCase to snake_case
  const dataToInsert = convertKeysToSnakeCase(expense);
  
  const { error } = await supabase
    .from('expenses')
    .upsert([dataToInsert]);
  
  if (error) throw error;
}

export async function deleteExpense(id: string) {
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// ============================================
// NOTIFICATIONS
// ============================================
export async function getNotifications() {
  const { data, error} = await supabase
    .from('notifications')
    .select('*')
    .order('timestamp', { ascending: false });
  
  if (error) throw error;
  
  // Convert snake_case to camelCase
  return (data || []).map(notif => convertKeysToCamelCase(notif));
}

export async function upsertNotification(notification: SystemNotification) {
  // Convert camelCase to snake_case
  const dataToInsert = convertKeysToSnakeCase(notification);
  
  const { error } = await supabase
    .from('notifications')
    .upsert([dataToInsert]);
  
  if (error) throw error;
}

export async function deleteNotification(id: string) {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

export async function markNotificationAsRead(id: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', id);
  
  if (error) throw error;
}

// ============================================
// LOAD ENTIRE DATABASE
// ============================================
export async function loadDatabase(): Promise<ErpDatabase | null> {
  try {
    const [
      settings,
      employees,
      customers,
      drivers,
      vehicles,
      trips,
      leads,
      invoices,
      payments,
      expenses,
      notifications
    ] = await Promise.all([
      getSettings(),
      getEmployees(),
      getCustomers(),
      getDrivers(),
      getVehicles(),
      getTrips(),
      getLeads(),
      getInvoices(),
      getPayments(),
      getExpenses(),
      getNotifications()
    ]);
    
    // Get session from first employee (owner)
    let owner = employees.find(e => e.role === 'Owner') || employees[0];
    
    // If no employees exist, create a default owner employee
    if (!owner) {
      console.log('⚠️ No employees found in database, creating default owner...');
      const defaultEmployee = {
        id: 'USR-001',
        name: 'Admin User',
        email: 'admin@eagletravels.com',
        phone: '+91 98860 12345',
        role: 'Owner',
        salary: 0,
        joining_date: new Date().toISOString().split('T')[0],
        status: 'Active',
        avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&q=80'
      };
      
      try {
        await upsertEmployee({
          id: defaultEmployee.id,
          name: defaultEmployee.name,
          email: defaultEmployee.email,
          phone: defaultEmployee.phone,
          role: defaultEmployee.role,
          salary: defaultEmployee.salary,
          joiningDate: defaultEmployee.joining_date,
          status: defaultEmployee.status,
          avatarUrl: defaultEmployee.avatar_url
        });
        console.log('✅ Default owner employee created in database');
        
        // Set owner to the default employee we just created
        owner = {
          id: defaultEmployee.id,
          name: defaultEmployee.name,
          email: defaultEmployee.email,
          role: defaultEmployee.role,
          avatar_url: defaultEmployee.avatar_url
        };
      } catch (error) {
        console.error('❌ Error creating default employee:', error);
      }
    }
    
    const session = owner ? {
      id: owner.id,
      name: owner.name,
      email: owner.email,
      role: owner.role as any,
      avatarUrl: owner.avatar_url || ''
    } : {
      id: 'USR-001',
      name: 'Admin User',
      email: 'admin@eagletravels.com',
      role: 'Owner',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&q=80'
    };
    
    // If no settings exist in database, create default settings and save them
    let settingsData;
    if (!settings) {
      console.log('⚠️ No settings found in database, creating default settings...');
      settingsData = {
        name: 'Eagle Travels Private Limited',
        logoUrl: '/assets/logo.png',
        gstNumber: '29AAFCE4321F1ZX',
        address: 'Premium Plaza, Suite 402, 100 Feet Road, Indiranagar, Bangalore - 560038, Karnataka, India',
        email: 'operations@eagletravels.com',
        phone: '+91 80 4912 3000',
        whatsapp: '+91 98860 12345',
        currencySymbol: '₹',
        defaultGstRate: 5
      };
      
      // Save default settings to database so they persist
      try {
        await upsertSettings({
          name: settingsData.name,
          logo_url: settingsData.logoUrl,
          gst_number: settingsData.gstNumber,
          address: settingsData.address,
          email: settingsData.email,
          phone: settingsData.phone,
          whatsapp: settingsData.whatsapp,
          currency_symbol: settingsData.currencySymbol,
          default_gst_rate: settingsData.defaultGstRate
        });
        console.log('✅ Default settings saved to database');
      } catch (error) {
        console.error('❌ Error saving default settings:', error);
      }
    } else {
      // Use existing settings from database
      settingsData = {
        name: settings.name,
        logoUrl: settings.logo_url,
        gstNumber: settings.gst_number,
        address: settings.address,
        email: settings.email,
        phone: settings.phone,
        whatsapp: settings.whatsapp,
        currencySymbol: settings.currency_symbol,
        defaultGstRate: settings.default_gst_rate
      };
    }
    
    return {
      settings: settingsData,
      session,
      employees,
      customers,
      drivers,
      vehicles,
      trips,
      leads,
      invoices,
      payments,
      expenses,
      notifications
    };
  } catch (error) {
    console.error('Error loading database:', error);
    return null;
  }
}

// ============================================
// REAL-TIME SUPABASE SUBSCRIPTIONS
// ============================================
export function subscribeToRealtime(onChange: () => void) {
  const channel = supabase
    .channel('erp-realtime-sync')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public' },
      (payload) => {
        console.log('⚡ Realtime database change received:', payload.table, payload.eventType);
        onChange();
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('📡 Realtime database synchronization ACTIVE');
      }
    });

  return () => {
    supabase.removeChannel(channel);
  };
}
