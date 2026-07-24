import { useState, useEffect } from "react";
import {
  Lead,
  Customer,
  Driver,
  Vehicle,
  Trip,
  Invoice,
  Payment,
  Expense,
  Employee,
  SystemNotification,
  CompanySettings,
  UserSession,
  UserRole,
  ErpDatabase
} from "../types";
import {
  defaultCompanySettings,
  defaultUserSession,
  initialEmployees,
  initialLeads,
  initialCustomers,
  initialDrivers,
  initialVehicles,
  initialTrips,
  initialInvoices,
  initialPayments,
  initialExpenses,
  initialNotifications
} from "./seedData";
import * as db from "../services/database";

const USE_SUPABASE = Boolean(
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  (process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY)
);

// Load database ONLY from Supabase (no localStorage)
export async function loadDatabaseAsync(): Promise<ErpDatabase> {
  if (USE_SUPABASE) {
    try {
      console.log('📡 Loading data from Supabase...');
      const data = await db.loadDatabase();
      if (data) {
        console.log('✅ Data loaded from Supabase');
        return data;
      }
      console.log('⚠️ No data in Supabase, using empty defaults');
    } catch (error) {
      console.error('❌ Error loading from Supabase:', error);
    }
  }
  
  // Return empty database (no demo data)
  return {
    settings: defaultCompanySettings,
    session: defaultUserSession,
    employees: [],
    leads: [],
    customers: [],
    drivers: [],
    vehicles: [],
    trips: [],
    invoices: [],
    payments: [],
    expenses: [],
    notifications: []
  };
}

// Deprecated - for backward compatibility only
export function loadDatabase(): ErpDatabase {
  return {
    settings: defaultCompanySettings,
    session: defaultUserSession,
    employees: [],
    leads: [],
    customers: [],
    drivers: [],
    vehicles: [],
    trips: [],
    invoices: [],
    payments: [],
    expenses: [],
    notifications: []
  };
}

// Save database ONLY to Supabase (no localStorage)
export async function saveDatabaseAsync(data: ErpDatabase): Promise<void> {
  if (USE_SUPABASE) {
    try {
      console.log('💾 Saving data to Supabase...');
      
      // Save settings first
      await db.upsertSettings({
        name: data.settings.name,
        logo_url: data.settings.logoUrl,
        gst_number: data.settings.gstNumber,
        address: data.settings.address,
        email: data.settings.email,
        phone: data.settings.phone,
        whatsapp: data.settings.whatsapp,
        currency_symbol: data.settings.currencySymbol,
        default_gst_rate: data.settings.defaultGstRate
      });

      // Save all non-dependent entities in parallel
      await Promise.all([
        ...data.employees.map(emp => db.upsertEmployee(emp)),
        ...data.customers.map(cust => db.upsertCustomer(cust)),
        ...data.drivers.map(drv => db.upsertDriver(drv)),
        ...data.vehicles.map(veh => db.upsertVehicle(veh)),
        ...data.trips.map(trip => db.upsertTrip(trip)),
        ...data.leads.map(lead => db.upsertLead(lead)),
        ...data.expenses.map(exp => db.upsertExpense(exp)),
        ...data.notifications.map(notif => db.upsertNotification(notif))
      ]);

      // Save invoices BEFORE payments (payments depend on invoices)
      await Promise.all(data.invoices.map(inv => db.upsertInvoice(inv)));

      // Finally save payments (after invoices exist)
      await Promise.all(data.payments.map(pay => db.upsertPayment(pay)));
      
      console.log('✅ Data saved to Supabase');
    } catch (error) {
      console.error('❌ Error saving to Supabase:', error);
      throw error;
    }
  } else {
    console.warn('⚠️ Supabase not configured, data not saved');
  }
}

// Deprecated - for backward compatibility
export function saveDatabase(data: ErpDatabase) {
  // Trigger async Supabase save
  if (USE_SUPABASE) {
    saveDatabaseAsync(data).catch(err => {
      console.error('Background Supabase save failed:', err);
    });
  }
}
