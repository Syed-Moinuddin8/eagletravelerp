import {
  UserRole,
  UserSession,
  LeadStatus,
  Lead,
  Customer,
  TripStatus,
  Trip,
  Driver,
  Vehicle,
  Invoice,
  Payment,
  Expense,
  ExpenseCategory,
  Employee,
  SystemNotification,
  CompanySettings
} from "../types";

export const defaultCompanySettings: CompanySettings = {
  name: "Eagle Travels Private Limited",
  logoUrl: "/assets/logo.png",
  gstNumber: "29AAFCE4321F1ZX",
  address: "Premium Plaza, Suite 402, 100 Feet Road, Indiranagar, Bangalore - 560038, Karnataka, India",
  email: "operations@eagletravels.com",
  phone: "+91 80 4912 3000",
  whatsapp: "+91 98860 12345"
};

export const defaultUserSession: UserSession = {
  id: "USR-001",
  name: "Mr. Rajeev Kumar",
  email: "rajeev.k@eagletravels.com",
  role: UserRole.OWNER,
  avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&q=80"
};

// Empty arrays - no demo data
export const initialEmployees: Employee[] = [];
export const initialLeads: Lead[] = [];
export const initialCustomers: Customer[] = [];
export const initialDrivers: Driver[] = [];
export const initialVehicles: Vehicle[] = [];
export const initialTrips: Trip[] = [];
export const initialInvoices: Invoice[] = [];
export const initialPayments: Payment[] = [];
export const initialExpenses: Expense[] = [];
export const initialNotifications: SystemNotification[] = [];
