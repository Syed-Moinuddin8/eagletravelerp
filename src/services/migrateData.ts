import { loadDatabase as loadLocalStorage } from '../data/stateManager';
import { supabase } from '../lib/supabaseClient';
import type { ErpDatabase } from '../types';
import * as db from './database';

export async function migrateLocalStorageToSupabase(): Promise<{ success: boolean; message: string; errors?: string[] }> {
  const errors: string[] = [];
  
  try {
    console.log('🚀 Starting migration from localStorage to Supabase...');
    
    // Load data from localStorage
    const localData: ErpDatabase = loadLocalStorage();
    console.log('✅ Loaded data from localStorage');
    
    // 1. Migrate Settings
    try {
      await db.upsertSettings({
        name: localData.settings.name,
        logo_url: localData.settings.logoUrl,
        gst_number: localData.settings.gstNumber,
        address: localData.settings.address,
        email: localData.settings.email,
        phone: localData.settings.phone,
        whatsapp: localData.settings.whatsapp,
        currency_symbol: localData.settings.currencySymbol,
        default_gst_rate: localData.settings.defaultGstRate
      });
      console.log('✅ Migrated settings');
    } catch (error: any) {
      errors.push(`Settings: ${error.message}`);
      console.error('❌ Failed to migrate settings:', error);
    }
    
    // 2. Migrate Employees
    try {
      for (const employee of localData.employees) {
        await db.upsertEmployee({
          ...employee,
          avatar_url: (employee as any).avatar_url || ''
        } as any);
      }
      console.log(`✅ Migrated ${localData.employees.length} employees`);
    } catch (error: any) {
      errors.push(`Employees: ${error.message}`);
      console.error('❌ Failed to migrate employees:', error);
    }
    
    // 3. Migrate Customers
    try {
      for (const customer of localData.customers) {
        await db.upsertCustomer(customer);
      }
      console.log(`✅ Migrated ${localData.customers.length} customers`);
    } catch (error: any) {
      errors.push(`Customers: ${error.message}`);
      console.error('❌ Failed to migrate customers:', error);
    }
    
    // 4. Migrate Drivers
    try {
      for (const driver of localData.drivers) {
        await db.upsertDriver(driver);
      }
      console.log(`✅ Migrated ${localData.drivers.length} drivers`);
    } catch (error: any) {
      errors.push(`Drivers: ${error.message}`);
      console.error('❌ Failed to migrate drivers:', error);
    }
    
    // 5. Migrate Vehicles
    try {
      for (const vehicle of localData.vehicles) {
        await db.upsertVehicle(vehicle);
      }
      console.log(`✅ Migrated ${localData.vehicles.length} vehicles`);
    } catch (error: any) {
      errors.push(`Vehicles: ${error.message}`);
      console.error('❌ Failed to migrate vehicles:', error);
    }
    
    // 6. Migrate Trips
    try {
      for (const trip of localData.trips) {
        await db.upsertTrip(trip);
      }
      console.log(`✅ Migrated ${localData.trips.length} trips`);
    } catch (error: any) {
      errors.push(`Trips: ${error.message}`);
      console.error('❌ Failed to migrate trips:', error);
    }
    
    // 7. Migrate Leads
    try {
      for (const lead of localData.leads) {
        await db.upsertLead(lead);
      }
      console.log(`✅ Migrated ${localData.leads.length} leads`);
    } catch (error: any) {
      errors.push(`Leads: ${error.message}`);
      console.error('❌ Failed to migrate leads:', error);
    }
    
    // 8. Migrate Invoices
    try {
      for (const invoice of localData.invoices) {
        await db.upsertInvoice(invoice);
      }
      console.log(`✅ Migrated ${localData.invoices.length} invoices`);
    } catch (error: any) {
      errors.push(`Invoices: ${error.message}`);
      console.error('❌ Failed to migrate invoices:', error);
    }
    
    // 9. Migrate Payments
    try {
      for (const payment of localData.payments) {
        await db.upsertPayment(payment);
      }
      console.log(`✅ Migrated ${localData.payments.length} payments`);
    } catch (error: any) {
      errors.push(`Payments: ${error.message}`);
      console.error('❌ Failed to migrate payments:', error);
    }
    
    // 10. Migrate Expenses
    try {
      for (const expense of localData.expenses) {
        await db.upsertExpense(expense);
      }
      console.log(`✅ Migrated ${localData.expenses.length} expenses`);
    } catch (error: any) {
      errors.push(`Expenses: ${error.message}`);
      console.error('❌ Failed to migrate expenses:', error);
    }
    
    // 11. Migrate Notifications
    try {
      for (const notification of localData.notifications) {
        await db.upsertNotification(notification);
      }
      console.log(`✅ Migrated ${localData.notifications.length} notifications`);
    } catch (error: any) {
      errors.push(`Notifications: ${error.message}`);
      console.error('❌ Failed to migrate notifications:', error);
    }
    
    if (errors.length > 0) {
      return {
        success: false,
        message: `Migration completed with ${errors.length} error(s)`,
        errors
      };
    }
    
    console.log('🎉 Migration completed successfully!');
    return {
      success: true,
      message: 'All data migrated successfully from localStorage to Supabase!'
    };
    
  } catch (error: any) {
    console.error('❌ Migration failed:', error);
    return {
      success: false,
      message: `Migration failed: ${error.message}`,
      errors: [error.message]
    };
  }
}

// Export data from Supabase to JSON (for backup)
export async function exportSupabaseData() {
  try {
    const data = await db.loadDatabase();
    
    if (!data) {
      throw new Error('No data found in Supabase');
    }
    
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `eagle-erp-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    
    console.log('✅ Backup exported successfully');
    return { success: true, message: 'Backup downloaded successfully!' };
  } catch (error: any) {
    console.error('❌ Export failed:', error);
    return { success: false, message: `Export failed: ${error.message}` };
  }
}

// Check if Supabase has any data
export async function checkSupabaseData() {
  try {
    const { data: settings } = await supabase.from('settings').select('count').single();
    const { data: customers } = await supabase.from('customers').select('count');
    const { data: trips } = await supabase.from('trips').select('count');
    
    return {
      hasData: !!(settings || (customers && customers.length > 0) || (trips && trips.length > 0)),
      settings: !!settings,
      customers: customers?.length || 0,
      trips: trips?.length || 0
    };
  } catch (error) {
    return {
      hasData: false,
      settings: false,
      customers: 0,
      trips: 0
    };
  }
}
