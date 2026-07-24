export enum UserRole {
  OWNER = "Owner",
  ADMIN = "Admin",
  OFFICE_STAFF = "Office Staff",
  ACCOUNTANT = "Accountant",
  OPERATIONS_MANAGER = "Operations Manager",
  DRIVER = "Driver"
}

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
}

export enum LeadStatus {
  NEW = "New",
  FOLLOW_UP = "Follow-up",
  NEGOTIATION = "Negotiation",
  CONFIRMED = "Confirmed",
  CANCELLED = "Cancelled",
  LOST = "Lost"
}

export interface LeadTimelineEvent {
  id: string;
  type: "call" | "email" | "meeting" | "system" | "note";
  timestamp: string;
  author: string;
  message: string;
}

export interface Lead {
  id: string;
  customerName: string;
  phone: string;
  email: string;
  pickup: string;
  destination: string;
  journeyDate: string;
  vehicleType: string;
  budget: number;
  notes: string;
  leadSource: string;
  status: LeadStatus;
  timeline: LeadTimelineEvent[];
  nextFollowUpDate?: string;
  createdAt: string;
}

export interface CustomerDocument {
  id: string;
  name: string;
  type: "passport" | "visa" | "ticket" | "aadhar" | "pan" | "other";
  fileUrl: string; // Base64 or mock URL
  uploadedAt: string;
  size: string;
}

export interface CustomerReview {
  id: string;
  tripNumber: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  gstNumber?: string;
  address: string;
  favoriteRoutes: string[];
  documents: CustomerDocument[];
  notes: string;
  reviews: CustomerReview[];
  createdAt: string;
  // Custom travel agency/client profile fields
  vehicle?: string;
  vehicleProvider?: string;
  assignedRateEngage?: number;
  perKmRate?: number;
  driverBata?: number;
  pickupLocation?: string;
  pickupTime?: string;
  visitingPlaces?: string;
  advanceAmount?: number;
  profitPerKm?: number;
  profitBata?: number;
  profitEngage?: number;
  startDate?: string;
  endDate?: string;
  bookingStatus?: string; // Booking status: "Confirmed", "Upcoming", "Completed", etc.
  passengers?: number; // Total number of passengers
}

export enum TripStatus {
  UPCOMING = "Upcoming",
  STARTED = "Started",
  RUNNING = "Running",
  COMPLETED = "Completed",
  CANCELLED = "Cancelled"
}

export interface TripStop {
  id: string;
  location: string;
  arrivalTime?: string;
}

export interface TripTimelineEvent {
  id: string;
  status: string;
  message: string;
  timestamp: string;
  location?: string;
}

export interface Trip {
  id: string; // e.g., "TRIP-2026-001"
  customerId: string;
  customerName: string;
  customerPhone?: string;
  vehicleId?: string;
  vehicleNumber?: string;
  vehicleModel?: string;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  pickup: string;
  drop: string;
  stops: TripStop[];
  startDate: string;
  endDate: string;
  pickupTime?: string;
  closingTime?: string;
  passengers: number;
  tourPackage?: string;
  hotel?: string;
  guideName?: string;
  status: TripStatus;
  timeline: TripTimelineEvent[];
  notes: string;
  baseFare: number;
  gstAmount: number;
  totalFare: number;
  paymentStatus: "Pending" | "Partial" | "Paid";
  advancePaid: number;
  totalKm?: number;
  totalBata?: number;
  tollCharges?: number;
  // Rates used for calculation
  perKmRate?: number;
  driverBataRate?: number;
  // Calculated breakdown
  kmCost?: number;
  bataCost?: number;
  // Profit rates and calculation
  profitPerKm?: number;
  profitBata?: number;
  profitEngage?: number;
  calculatedProfit?: number;
}

export interface Driver {
  id: string;
  name: string;
  photoUrl: string;
  licenseNumber: string;
  aadharNumber: string;
  panNumber: string;
  phone: string;
  email: string;
  address: string;
  salary: number;
  emergencyContactName: string;
  emergencyContactPhone: string;
  documents: CustomerDocument[];
  isAvailable: boolean;
  assignedTripId?: string;
  ratings: number[]; // Array of ratings e.g., [5, 4, 5]
  attendance: { [date: string]: "Present" | "Absent" | "Leave" };
}

export interface VehicleMaintenance {
  id: string;
  type: string; // e.g., "Engine Oil Change", "Tire Rotation"
  cost: number;
  date: string;
  notes: string;
}

export interface Vehicle {
  id: string;
  vehicleNumber: string; // e.g., "KA-01-MJ-4567"
  category: "Sedan" | "SUV" | "Tempo Traveller" | "Luxury Bus" | "Mini Bus";
  brand: string;
  model: string;
  fuelType: "Diesel" | "Petrol" | "Electric" | "CNG";
  seats: number;
  insuranceExpiry: string;
  fitnessExpiry: string;
  permitExpiry: string;
  pollutionExpiry: string;
  rcNumber: string;
  lastServiceDate: string;
  isAvailable: boolean;
  currentDriverId?: string;
  currentTripId?: string;
  maintenanceHistory: VehicleMaintenance[];
  // Travel Agency B2B Rates
  agencyBaseRate?: number;
  agencyRatePerKm?: number;
  agencyDriverAllowance?: number;
  agencyMinKmPerDay?: number;
  agencyNightHalt?: number;
  agencyExtraHourCharge?: number;
  // Ownership & Acquisition Details
  ownerName?: string;
  ownershipType?: "Self-Owned" | "Leased" | "Sub-Contracted";
  acquisitionPrice?: number;
  attachedDate?: string;
  board?: string; // e.g. "Yellow Board", "White Board"
  engage?: number; // Base pack/engage rate
  perKmAcBelow350?: number; // Per km for AC < 350km
  perKmAcAbove350?: number; // Per km for AC >= 350km
  perKmNonAcBelow350?: number; // Per km for Non-AC < 350km
  perKmNonAcAbove350?: number; // Per km for Non-AC >= 350km
  driverBata?: number; // Driver Bata Allowance
}

export interface InvoiceLineItem {
  id: number;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
}

export interface Invoice {
  id: string; // e.g., "INV-2026-001"
  tripId: string;
  tripNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  customerGST?: string;
  companyName: string;
  companyLogo: string;
  companyGST: string;
  companyAddress: string;
  companyEmail: string;
  companyPhone: string;
  lineItems: InvoiceLineItem[]; // Manual line items
  subtotal: number;
  gstRate: number; // e.g. 5% or 18%
  gstAmount: number;
  totalAmount: number;
  advanceAmount: number;
  balanceDue: number;
  paymentStatus: "Pending" | "Partial" | "Paid";
  createdAt: string;
  dueDate: string;
  qrCodeData?: string; // payment link or UPI deep link
}

export interface Payment {
  id: string;
  invoiceId: string | null;
  tripNumber: string;
  customerName: string;
  amount: number;
  paymentMethod: "UPI" | "Cash" | "Bank Transfer" | "Card";
  transactionId?: string;
  date: string;
  notes?: string;
}

export enum ExpenseCategory {
  FUEL = "Fuel",
  MAINTENANCE = "Maintenance",
  SALARY = "Salary",
  OFFICE_RENT = "Office Rent",
  HOTEL_PAYMENT = "Hotel Payment",
  VENDOR_PAYMENT = "Vendor Payment",
  MISCELLANEOUS = "Miscellaneous"
}

export interface Expense {
  id: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  paidTo: string;
  paymentMethod: "UPI" | "Cash" | "Bank Transfer" | "Card";
  receiptUrl?: string;
  notes: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  salary: number;
  joiningDate: string;
  status: "Active" | "Inactive";
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "reminder";
  timestamp: string;
  read: boolean;
}

export interface CompanySettings {
  name: string;
  logoUrl: string;
  gstNumber: string;
  address: string;
  email: string;
  phone: string;
  whatsapp: string;
  currencySymbol?: string;
  defaultGstRate?: number;
}

export interface ErpDatabase {
  settings: CompanySettings;
  session: UserSession;
  employees: Employee[];
  leads: Lead[];
  customers: Customer[];
  drivers: Driver[];
  vehicles: Vehicle[];
  trips: Trip[];
  invoices: Invoice[];
  payments: Payment[];
  expenses: Expense[];
  notifications: SystemNotification[];
}
