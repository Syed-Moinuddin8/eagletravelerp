import React, { useState } from "react";
import { useToasts } from "./Toast";
import {
  ErpDatabase,
  Customer,
  CustomerDocument,
  TripStatus,
  LeadStatus,
  Trip
} from "../types";
import {
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  FileText,
  Star,
  Layers,
  ChevronRight,
  BookOpen,
  Calendar,
  IndianRupee,
  ShieldAlert,
  ArrowUpRight,
  Download,
  Car,
  Pencil,
  Clock,
  CheckCircle2,
  PlayCircle,
  Filter,
  Check,
  Tag,
  ChevronDown,
  XCircle,
  X,
  ArrowLeft,
  Navigation,
  Trash2,
  User,
  AlertCircle
} from "lucide-react";
import { exportCustomersToCsv } from "../utils/csvExport";
import * as dbService from "../services/database";

type TripFilterCategory = "ALL" | "CONFIRMED" | "RUNNING" | "COMPLETED" | "CANCELLED";

interface CustomersViewProps {
  db: ErpDatabase;
  onUpdateDb: (updatedDb: ErpDatabase) => void;
}

export function CustomersView({ db, onUpdateDb }: CustomersViewProps) {
  const { showToast } = useToasts();
  const [selectedCustId, setSelectedCustId] = useState<string>(db.customers[0]?.id || "");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeFilter, setActiveFilter] = useState<TripFilterCategory>("ALL");
  const [selectedCustTripFilter, setSelectedCustTripFilter] = useState<TripFilterCategory>("ALL");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isCustTripFilterOpen, setIsCustTripFilterOpen] = useState(false);
  const [mobileShowDetails, setMobileShowDetails] = useState(false);

  // New Customer Form State
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    gstNumber: "",
    address: "",
    notes: "",
    vehicle: "",
    vehicleProvider: "",
    assignedRateEngage: "",
    perKmRate: "",
    driverBata: "",
    advanceAmount: "",
    pickupLocation: "",
    pickupTime: "",
    visitingPlaces: "",
    profitPerKm: "",
    profitBata: "",
    profitEngage: "",
    startDate: "",
    endDate: "",
    passengers: ""
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "",
    phone: "",
    email: "",
    gstNumber: "",
    address: "",
    notes: "",
    vehicle: "",
    vehicleProvider: "",
    assignedRateEngage: "",
    perKmRate: "",
    driverBata: "",
    advanceAmount: "",
    pickupLocation: "",
    pickupTime: "",
    visitingPlaces: "",
    profitPerKm: "",
    profitBata: "",
    profitEngage: "",
    startDate: "",
    endDate: "",
    passengers: ""
  });

  const selectedCust = db.customers.find(c => c.id === selectedCustId);

  // Helper function to evaluate trip and booking data for any customer
  const getCustomerTripData = (customer: Customer) => {
    const custTrips = db.trips.filter(t => {
      // 1. Direct ID match (highest priority and definitive for distinct entries)
      if (t.customerId) {
        return t.customerId === customer.id;
      }
      // 2. Fallback for unlinked trips without customerId: match by phone if available
      if (customer.phone && (t as any).customerPhone && (t as any).customerPhone.trim() === customer.phone.trim()) {
        return true;
      }
      // 3. Match by name ONLY if no other customer shares the exact same name
      if (t.customerName && t.customerName.toLowerCase().trim() === customer.name.toLowerCase().trim()) {
        const otherWithSameName = db.customers.some(c => c.id !== customer.id && c.name.toLowerCase().trim() === customer.name.toLowerCase().trim());
        if (!otherWithSameName) {
          return true;
        }
      }
      return false;
    });

    const custLeads = db.leads.filter(l => {
      // 1. Direct phone match if available
      if (l.phone && customer.phone && l.phone.trim() === customer.phone.trim()) {
        return true;
      }
      // 2. Match by name ONLY if no other customer entry shares the exact same name
      if (l.customerName && l.customerName.toLowerCase().trim() === customer.name.toLowerCase().trim()) {
        const otherWithSameName = db.customers.some(c => c.id !== customer.id && c.name.toLowerCase().trim() === customer.name.toLowerCase().trim());
        if (!otherWithSameName) {
          return true;
        }
      }
      return false;
    });

    const statusVal = (customer.bookingStatus || "").trim();
    const isCancelled = statusVal === "Cancelled" || custTrips.some(t => t.status === TripStatus.CANCELLED);
    const isCompleted = statusVal === "Completed" || custTrips.some(t => t.status === TripStatus.COMPLETED);
    const isRunning = statusVal === "Running" || statusVal === "Started" || custTrips.some(t => t.status === TripStatus.RUNNING || t.status === TripStatus.STARTED);
    const isUpcoming = (statusVal === "Upcoming" || custTrips.some(t => t.status === TripStatus.UPCOMING)) && !isCancelled && !isCompleted && !isRunning;

    const hasActiveConfirmedLead = custLeads.some(l => l.status === LeadStatus.CONFIRMED) && !isRunning && !isCompleted && !isCancelled;
    const pendingConfirmedTrips = custTrips.filter(
      t => t.status !== TripStatus.RUNNING && 
           t.status !== TripStatus.STARTED && 
           t.status !== TripStatus.COMPLETED && 
           t.status !== TripStatus.CANCELLED
    );
    const hasConfirmedBooking = !isCancelled && !isCompleted && (hasActiveConfirmedLead || pendingConfirmedTrips.length > 0 || (customer.advanceAmount !== undefined && customer.advanceAmount > 0 && custTrips.length === 0) || isUpcoming);
    const hasUpcomingTrips = isUpcoming;
    const hasRunningTrips = isRunning;
    const hasCompletedTrips = isCompleted;
    const hasCancelledTrips = isCancelled;

    return {
      trips: custTrips,
      leads: custLeads,
      hasConfirmedBooking,
      hasUpcomingTrips,
      hasRunningTrips,
      hasCompletedTrips,
      hasCancelledTrips,
    };
  };

  // Filter counts for directory header tabs
  const filterCounts = {
    ALL: db.customers.length,
    CONFIRMED: db.customers.filter(c => getCustomerTripData(c).hasConfirmedBooking).length,
    RUNNING: db.customers.filter(c => getCustomerTripData(c).hasRunningTrips).length,
    COMPLETED: db.customers.filter(c => getCustomerTripData(c).hasCompletedTrips).length,
    CANCELLED: db.customers.filter(c => getCustomerTripData(c).hasCancelledTrips).length,
  };

  // Filter customers list by search term AND active category filter
  const filteredCustomers = db.customers.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.vehicleProvider && c.vehicleProvider.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    const data = getCustomerTripData(c);
    if (activeFilter === "CONFIRMED") return data.hasConfirmedBooking;
    if (activeFilter === "RUNNING") return data.hasRunningTrips;
    if (activeFilter === "COMPLETED") return data.hasCompletedTrips;
    if (activeFilter === "CANCELLED") return data.hasCancelledTrips;
    return true;
  });

  // Associated trips and invoices for selected customer
  const selectedCustData = selectedCust ? getCustomerTripData(selectedCust) : { trips: [], leads: [], hasConfirmedBooking: false, hasUpcomingTrips: false, hasRunningTrips: false, hasCompletedTrips: false, hasCancelledTrips: false };
  const customerTrips = selectedCustData.trips;
  const customerInvoices = db.invoices.filter(i => i.customerEmail === selectedCust?.email || i.customerPhone === selectedCust?.phone);

  // Selected Customer's filtered trips for detail panel
  const filteredSelectedCustTrips = customerTrips.filter(t => {
    if (selectedCustTripFilter === "CONFIRMED") return t.status !== TripStatus.RUNNING && t.status !== TripStatus.STARTED && t.status !== TripStatus.COMPLETED && t.status !== TripStatus.CANCELLED;
    if (selectedCustTripFilter === "RUNNING") return t.status === TripStatus.RUNNING || t.status === TripStatus.STARTED;
    if (selectedCustTripFilter === "COMPLETED") return t.status === TripStatus.COMPLETED;
    if (selectedCustTripFilter === "CANCELLED") return t.status === TripStatus.CANCELLED;
    return true;
  });

  // Helper to dynamically style booking status select dropdown
  const getStatusSelectColor = (status?: string) => {
    if (!status) return "text-emerald-300 border-slate-700 bg-slate-800";
    if (status === "Cancelled" || status === TripStatus.CANCELLED) return "text-red-400 border-red-800/80 bg-red-950/70 font-extrabold";
    if (status === "Completed" || status === TripStatus.COMPLETED) return "text-emerald-400 border-emerald-800/80 bg-emerald-950/70 font-extrabold";
    if (status === "Running" || status === "Started" || status === TripStatus.RUNNING || status === TripStatus.STARTED) return "text-blue-400 border-blue-800/80 bg-blue-950/70 font-extrabold";
    return "text-amber-300 border-slate-700 bg-slate-800 font-bold";
  };

  // Function to update trip status directly from Customers Directory
  const handleUpdateTripStatus = (tripId: string, newStatus: TripStatus) => {
    const targetTrip = db.trips.find(t => t.id === tripId);

    const updatedTrips = db.trips.map(t => {
      if (t.id === tripId) {
        const newEv = {
          id: `ev-${Date.now()}`,
          status: newStatus,
          message: `Trip status updated to ${newStatus} from Customers Directory.`,
          timestamp: new Date().toISOString()
        };
        return {
          ...t,
          status: newStatus,
          timeline: [...(t.timeline || []), newEv]
        };
      }
      return t;
    });

    // Also update corresponding customer's bookingStatus
    const updatedCustomers = db.customers.map(c => {
      if ((targetTrip && (c.id === targetTrip.customerId || c.name.toLowerCase() === targetTrip.customerName.toLowerCase())) || c.id === selectedCust?.id) {
        return { ...c, bookingStatus: newStatus };
      }
      return c;
    });

    // Release driver and vehicle if cancelled or completed
    let updatedDrivers = db.drivers;
    let updatedVehicles = db.vehicles;
    if (newStatus === TripStatus.CANCELLED || newStatus === TripStatus.COMPLETED) {
      if (targetTrip?.driverId) {
        updatedDrivers = db.drivers.map(d => d.id === targetTrip.driverId ? { ...d, isAvailable: true, assignedTripId: undefined } : d);
      }
      if (targetTrip?.vehicleId) {
        updatedVehicles = db.vehicles.map(v => v.id === targetTrip.vehicleId ? { ...v, isAvailable: true, currentTripId: undefined } : v);
      }
    }

    onUpdateDb({
      ...db,
      trips: updatedTrips,
      customers: updatedCustomers,
      drivers: updatedDrivers,
      vehicles: updatedVehicles
    });

    showToast(`Trip ${tripId} status updated to ${newStatus}`, "success");
  };

  // Function to update customer booking status (when no trip exists or from header)
  const handleUpdateCustomerBookingStatus = (custId: string, newStatus: string) => {
    const targetCustomer = db.customers.find(c => c.id === custId);

    const updatedCustomers = db.customers.map(c => {
      if (c.id === custId) {
        return { ...c, bookingStatus: newStatus };
      }
      return c;
    });

    // Sync any existing trips for this customer
    const updatedTrips = db.trips.map(t => {
      if (t.customerId === custId || (targetCustomer && t.customerName.toLowerCase() === targetCustomer.name.toLowerCase())) {
        const newEv = {
          id: `ev-${Date.now()}`,
          status: newStatus,
          message: `Trip status updated to ${newStatus} from Customer Profile.`,
          timestamp: new Date().toISOString()
        };
        return {
          ...t,
          status: newStatus as TripStatus,
          timeline: [...(t.timeline || []), newEv]
        };
      }
      return t;
    });

    onUpdateDb({ 
      ...db, 
      customers: updatedCustomers,
      trips: updatedTrips
    });
    showToast(`Booking status updated to "${newStatus}"!`, "success");
  };
  // Function to mark customer booking as confirmed (without creating trip)
  const handleCreateTripForCustomer = (cust: Customer) => {
    // Simply mark the booking as confirmed by ensuring the customer has booking details
    // The actual trip will be created manually in Trip Dispatcher when assigning driver
    
    const updatedCustomers = db.customers.map(c => {
      if (c.id === cust.id) {
        return {
          ...c,
          // Ensure customer has minimum booking info to show as "confirmed"
          startDate: c.startDate || new Date().toISOString().split("T")[0],
          endDate: c.endDate || new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0],
          pickupLocation: c.pickupLocation || c.address || "To be confirmed",
          visitingPlaces: c.visitingPlaces || "To be confirmed",
          advanceAmount: c.advanceAmount || 0, // Keep existing advance or 0
          bookingStatus: "Upcoming" // Set booking status to Upcoming by default
        };
      }
      return c;
    });

    onUpdateDb({
      ...db,
      customers: updatedCustomers
    });

    showToast(`Booking confirmed for ${cust.name}! Create trip in Trip Dispatcher to assign driver.`, "success");
  };

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      showToast("Customer Name and Phone are mandatory!", "warning");
      return;
    }

    // Generate sequential customer ID starting from 1
    const existingIds = db.customers
      .map(c => c.id)
      .filter(id => /^\d+$/.test(id)) // Filter only numeric IDs
      .map(id => parseInt(id))
      .filter(id => !isNaN(id)); // Remove any NaN values
    
    const nextId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
    const newCustomerId = String(nextId);

    const newCust: Customer = {
      id: newCustomerId,
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      gstNumber: formData.gstNumber || undefined,
      address: formData.address,
      favoriteRoutes: formData.visitingPlaces ? [formData.visitingPlaces] : [],
      documents: [],
      notes: formData.notes,
      reviews: [],
      createdAt: new Date().toISOString(),
      vehicle: formData.vehicle || undefined,
      vehicleProvider: formData.vehicleProvider || undefined,
      assignedRateEngage: formData.assignedRateEngage ? Number(formData.assignedRateEngage) : undefined,
      perKmRate: formData.perKmRate ? Number(formData.perKmRate) : undefined,
      driverBata: formData.driverBata ? Number(formData.driverBata) : undefined,
      advanceAmount: formData.advanceAmount ? Number(formData.advanceAmount) : undefined,
      pickupLocation: formData.pickupLocation || undefined,
      pickupTime: formData.pickupTime || undefined,
      visitingPlaces: formData.visitingPlaces || undefined,
      profitPerKm: formData.profitPerKm ? Number(formData.profitPerKm) : undefined,
      profitBata: formData.profitBata ? Number(formData.profitBata) : undefined,
      profitEngage: formData.profitEngage ? Number(formData.profitEngage) : undefined,
      startDate: formData.startDate || undefined,
      endDate: formData.endDate || undefined,
      passengers: formData.passengers ? Number(formData.passengers) : undefined
    };

    // Create customer without auto-creating trip
    // Users should create trips manually in Trips Dispatcher
    onUpdateDb({
      ...db,
      customers: [newCust, ...db.customers]
    });

    setFormData({
      name: "",
      phone: "",
      email: "",
      gstNumber: "",
      address: "",
      notes: "",
      vehicle: "",
      vehicleProvider: "",
      assignedRateEngage: "",
      perKmRate: "",
      driverBata: "",
      advanceAmount: "",
      pickupLocation: "",
      pickupTime: "",
      visitingPlaces: "",
      profitPerKm: "",
      profitBata: "",
      profitEngage: "",
      startDate: "",
      endDate: ""
    });
    setSelectedCustId(newCust.id);
    setShowAddForm(false);
    showToast(`Customer profile for ${formData.name} created successfully!`, "success");
  };

  const handleStartEdit = () => {
    if (!selectedCust) return;
    setEditFormData({
      name: selectedCust.name,
      phone: selectedCust.phone,
      email: selectedCust.email || "",
      gstNumber: selectedCust.gstNumber || "",
      address: selectedCust.address,
      notes: selectedCust.notes || "",
      vehicle: selectedCust.vehicle || "",
      vehicleProvider: selectedCust.vehicleProvider || "",
      assignedRateEngage: selectedCust.assignedRateEngage !== undefined ? String(selectedCust.assignedRateEngage) : "",
      perKmRate: selectedCust.perKmRate !== undefined ? String(selectedCust.perKmRate) : "",
      driverBata: selectedCust.driverBata !== undefined ? String(selectedCust.driverBata) : "",
      advanceAmount: selectedCust.advanceAmount !== undefined ? String(selectedCust.advanceAmount) : "",
      pickupLocation: selectedCust.pickupLocation || "",
      pickupTime: selectedCust.pickupTime || "",
      visitingPlaces: selectedCust.visitingPlaces || "",
      profitPerKm: selectedCust.profitPerKm !== undefined ? String(selectedCust.profitPerKm) : "",
      profitBata: selectedCust.profitBata !== undefined ? String(selectedCust.profitBata) : "",
      profitEngage: selectedCust.profitEngage !== undefined ? String(selectedCust.profitEngage) : "",
      startDate: selectedCust.startDate || "",
      endDate: selectedCust.endDate || "",
      passengers: selectedCust.passengers !== undefined ? String(selectedCust.passengers) : ""
    });
    setIsEditing(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCust) return;
    if (!editFormData.name.trim() || !editFormData.phone.trim()) {
      showToast("Name and Phone Number are required.", "warning");
      return;
    }

    const newAdvanceVal = editFormData.advanceAmount ? Number(editFormData.advanceAmount) : 0;

    const updatedCustomers = db.customers.map(c => {
      if (c.id === selectedCust.id) {
        return {
          ...c,
          name: editFormData.name,
          phone: editFormData.phone,
          email: editFormData.email || undefined,
          gstNumber: editFormData.gstNumber || undefined,
          address: editFormData.address,
          favoriteRoutes: editFormData.visitingPlaces ? [editFormData.visitingPlaces] : c.favoriteRoutes,
          notes: editFormData.notes,
          vehicle: editFormData.vehicle || undefined,
          vehicleProvider: editFormData.vehicleProvider || undefined,
          assignedRateEngage: editFormData.assignedRateEngage ? Number(editFormData.assignedRateEngage) : undefined,
          perKmRate: editFormData.perKmRate ? Number(editFormData.perKmRate) : undefined,
          driverBata: editFormData.driverBata ? Number(editFormData.driverBata) : undefined,
          advanceAmount: editFormData.advanceAmount ? Number(editFormData.advanceAmount) : undefined,
          pickupLocation: editFormData.pickupLocation || undefined,
          pickupTime: editFormData.pickupTime || undefined,
          visitingPlaces: editFormData.visitingPlaces || undefined,
          profitPerKm: editFormData.profitPerKm ? Number(editFormData.profitPerKm) : undefined,
          profitBata: editFormData.profitBata ? Number(editFormData.profitBata) : undefined,
          profitEngage: editFormData.profitEngage ? Number(editFormData.profitEngage) : undefined,
          startDate: editFormData.startDate || undefined,
          endDate: editFormData.endDate || undefined,
          passengers: editFormData.passengers ? Number(editFormData.passengers) : undefined
        };
      }
      return c;
    });

    // Also sync advance payment to customer's active/upcoming trips & invoices
    const updatedTrips = db.trips.map(t => {
      if (t.customerId === selectedCust.id || t.customerName === selectedCust.name) {
        const totalFare = t.totalFare || ((t.baseFare || 0) + (t.gstAmount || 0));
        const status: "Pending" | "Partial" | "Paid" = newAdvanceVal >= totalFare && totalFare > 0 ? "Paid" : (newAdvanceVal > 0 ? "Partial" : "Pending");
        return {
          ...t,
          advancePaid: newAdvanceVal,
          paymentStatus: status
        };
      }
      return t;
    });

    const updatedInvoices = db.invoices.map(inv => {
      if (inv.customerName === selectedCust.name || inv.customerEmail === selectedCust.email || inv.customerPhone === selectedCust.phone) {
        const balance = Math.max(0, inv.totalAmount - newAdvanceVal);
        const status: "Pending" | "Partial" | "Paid" = newAdvanceVal >= inv.totalAmount && inv.totalAmount > 0 ? "Paid" : (newAdvanceVal > 0 ? "Partial" : "Pending");
        return {
          ...inv,
          advanceAmount: newAdvanceVal,
          balanceDue: balance,
          paymentStatus: status
        };
      }
      return inv;
    });

    let finalPayments = [...db.payments];
    if (newAdvanceVal > 0) {
      const custTrip = updatedTrips.find(t => t.customerId === selectedCust.id || t.customerName === selectedCust.name);
      const tripNum = custTrip?.id || `CUST-${selectedCust.id}`;
      const invId = updatedInvoices.find(i => i.customerName === selectedCust.name)?.id || null;
      const existingIdx = finalPayments.findIndex(p => p.customerName === selectedCust.name || p.tripNumber === tripNum);
      if (existingIdx >= 0) {
        finalPayments[existingIdx] = {
          ...finalPayments[existingIdx],
          amount: newAdvanceVal,
          customerName: editFormData.name,
          notes: `Updated advance payment for customer ${editFormData.name}.`
        };
      } else {
        finalPayments = [{
          id: `PAY-ADV-${Math.floor(100 + Math.random() * 900)}`,
          invoiceId: invId,
          tripNumber: tripNum,
          customerName: editFormData.name,
          amount: newAdvanceVal,
          paymentMethod: "UPI" as const,
          transactionId: `TXN-ADV-${Date.now().toString().slice(-4)}`,
          date: new Date().toISOString().split('T')[0],
          notes: `Advance payment recorded for customer ${editFormData.name}.`
        }, ...finalPayments];
      }
    }

    onUpdateDb({
      ...db,
      customers: updatedCustomers,
      trips: updatedTrips,
      invoices: updatedInvoices,
      payments: finalPayments
    });

    setIsEditing(false);
    showToast(`Customer profile for ${editFormData.name} updated successfully!`, "success");
  };

  // Function to delete a specific trip from database and state
  const handleDeleteTrip = async (tripId: string) => {
    const targetTrip = db.trips.find(t => t.id === tripId);
    if (!targetTrip) return;

    if (!window.confirm(`Are you sure you want to delete Trip ${tripId}? This will remove the trip permanently from the website and database.`)) {
      return;
    }

    try {
      // 1. Delete trip from Supabase database
      await dbService.deleteTrip(tripId);

      // 2. Remove trip from local state
      const updatedTrips = db.trips.filter(t => t.id !== tripId);

      // 3. Free up associated driver & vehicle
      let updatedDrivers = db.drivers;
      let updatedVehicles = db.vehicles;
      if (targetTrip.driverId) {
        updatedDrivers = db.drivers.map(d => d.id === targetTrip.driverId ? { ...d, isAvailable: true, assignedTripId: undefined } : d);
      }
      if (targetTrip.vehicleId) {
        updatedVehicles = db.vehicles.map(v => v.id === targetTrip.vehicleId ? { ...v, isAvailable: true, currentTripId: undefined } : v);
      }

      onUpdateDb({
        ...db,
        trips: updatedTrips,
        drivers: updatedDrivers,
        vehicles: updatedVehicles
      });

      showToast(`Trip ${tripId} deleted successfully!`, "success");
    } catch (error: any) {
      console.error("Error deleting trip:", error);
      showToast(`Failed to delete trip: ${error?.message || error}`, "error");
    }
  };

  const handleDeleteCustomer = async () => {
    if (!selectedCust) return;

    const customerName = selectedCust.name;
    const customerId = selectedCust.id;

    // Check for associated trips
    const custTrips = db.trips.filter(t => 
      t.customerId === customerId || 
      (t.customerName && t.customerName.toLowerCase() === customerName.toLowerCase())
    );

    const confirmMsg = custTrips.length > 0 
      ? `Are you sure you want to delete customer ${customerName} AND all ${custTrips.length} associated trip(s)? This will permanently delete them from the website and database.`
      : `Are you sure you want to delete customer ${customerName}? This action cannot be undone.`;

    if (!window.confirm(confirmMsg)) {
      return;
    }

    try {
      // 1. Delete associated trips from Supabase database
      for (const trip of custTrips) {
        await dbService.deleteTrip(trip.id);
      }

      // 2. Delete customer from Supabase database
      await dbService.deleteCustomer(customerId);

      // 3. Remove customer & trips from state
      const updatedCustomers = db.customers.filter(c => c.id !== customerId);
      const updatedTrips = db.trips.filter(t => 
        t.customerId !== customerId && 
        (!t.customerName || t.customerName.toLowerCase() !== customerName.toLowerCase())
      );

      // Free up drivers & vehicles from deleted trips
      let updatedDrivers = [...db.drivers];
      let updatedVehicles = [...db.vehicles];
      custTrips.forEach(t => {
        if (t.driverId) {
          updatedDrivers = updatedDrivers.map(d => d.id === t.driverId ? { ...d, isAvailable: true, assignedTripId: undefined } : d);
        }
        if (t.vehicleId) {
          updatedVehicles = updatedVehicles.map(v => v.id === t.vehicleId ? { ...v, isAvailable: true, currentTripId: undefined } : v);
        }
      });

      // Select a different customer or clear selection
      const newSelectedId = updatedCustomers.length > 0 ? updatedCustomers[0].id : "";
      setSelectedCustId(newSelectedId);

      // Update global state
      onUpdateDb({
        ...db,
        customers: updatedCustomers,
        trips: updatedTrips,
        drivers: updatedDrivers,
        vehicles: updatedVehicles
      });

      showToast(`Customer ${customerName} and associated trips deleted successfully`, "success");
    } catch (error) {
      console.error('Error deleting customer & trips:', error);
      showToast(`Failed to delete: ${error instanceof Error ? error.message : 'Unknown error'}`, "error");
    }
  };

  // Dynamic file upload simulator
  const handleSimulatedDocUpload = (type: "passport" | "visa" | "aadhar" | "pan") => {
    if (!selectedCust) return;
    
    const docNames = {
      passport: "Passport_Scan_Copy.pdf",
      visa: "Tourist_Visa_ECopy.pdf",
      aadhar: "Aadhar_Card_Verified.pdf",
      pan: "PAN_Card_Verification.pdf"
    };

    const newDoc: CustomerDocument = {
      id: `doc-${Date.now()}`,
      name: docNames[type],
      type,
      fileUrl: "data:application/pdf;base64,...",
      uploadedAt: new Date().toISOString(),
      size: `${(0.8 + Math.random() * 2).toFixed(1)} MB`
    };

    const updatedCustomers = db.customers.map(c => {
      if (c.id === selectedCust.id) {
        return {
          ...c,
          documents: [newDoc, ...c.documents]
        };
      }
      return c;
    });

    onUpdateDb({
      ...db,
      customers: updatedCustomers
    });
  };

  return (
    <div className="space-y-6" id="customers-view">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display text-slate-800">Customer Accounts Directory</h2>
          <p className="text-sm text-slate-500">Manage permanent customer profiles, company accounts, and trip bookings.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              exportCustomersToCsv(db.customers);
              showToast("Customer directory exported to CSV successfully!", "success");
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl shadow-xs transition cursor-pointer"
            title="Export all customer records to CSV"
            id="export-customers-csv"
          >
            <Download className="w-4 h-4 text-slate-500" /> Export CSV
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-xl shadow-sm transition cursor-pointer"
            id="add-customer-btn"
          >
            <Plus className="w-4 h-4" /> Create Profile
          </button>
        </div>
      </div>

      {/* Trip & Booking Filters Bar */}
      <div className="bg-white p-2.5 rounded-2xl border border-slate-100 shadow-2xs" id="customer-directory-filters">
        {/* Mobile Custom Dropdown Button */}
        <div className="sm:hidden relative w-full">
          <button
            type="button"
            onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-semibold text-xs border transition shadow-xs cursor-pointer ${
              activeFilter === "ALL" ? "bg-slate-900 text-white border-slate-800" :
              activeFilter === "CONFIRMED" ? "bg-purple-900 text-white border-purple-800" :
              activeFilter === "UPCOMING" ? "bg-blue-900 text-white border-blue-800" :
              activeFilter === "RUNNING" ? "bg-emerald-900 text-white border-emerald-800" :
              activeFilter === "COMPLETED" ? "bg-teal-900 text-white border-teal-800" :
              "bg-rose-900 text-white border-rose-800"
            }`}
            id="mobile-customer-filter-trigger"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Filter className="w-4 h-4 text-brand-400 shrink-0" />
              <span className="text-slate-300 font-medium shrink-0">Filter:</span>
              <span className="font-bold truncate flex items-center gap-2">
                {activeFilter === "ALL" && (
                  <>
                    <Layers className="w-3.5 h-3.5 text-slate-300" />
                    <span>All Customers</span>
                    <span className="bg-slate-700 text-white text-[10px] px-2 py-0.5 rounded-full font-mono">{filterCounts.ALL}</span>
                  </>
                )}
                {activeFilter === "CONFIRMED" && (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                    <span>Confirmed Bookings</span>
                    <span className="bg-purple-800 text-purple-100 text-[10px] px-2 py-0.5 rounded-full font-mono">{filterCounts.CONFIRMED}</span>
                  </>
                )}
                {activeFilter === "RUNNING" && (
                  <>
                    <PlayCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Running Trips</span>
                    <span className="bg-emerald-800 text-emerald-100 text-[10px] px-2 py-0.5 rounded-full font-mono">{filterCounts.RUNNING}</span>
                  </>
                )}
                {activeFilter === "COMPLETED" && (
                  <>
                    <Check className="w-3.5 h-3.5 text-teal-400" />
                    <span>Completed Trips</span>
                    <span className="bg-teal-800 text-teal-100 text-[10px] px-2 py-0.5 rounded-full font-mono">{filterCounts.COMPLETED}</span>
                  </>
                )}
                {activeFilter === "CANCELLED" && (
                  <>
                    <XCircle className="w-3.5 h-3.5 text-rose-400" />
                    <span>Cancelled Trips</span>
                    <span className="bg-rose-800 text-rose-100 text-[10px] px-2 py-0.5 rounded-full font-mono">{filterCounts.CANCELLED}</span>
                  </>
                )}
              </span>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ml-1 ${isMobileFilterOpen ? "rotate-180" : ""}`} />
          </button>

          {/* Mobile Popover Bottom Sheet */}
          {isMobileFilterOpen && (
            <>
              <div
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs z-50 sm:hidden transition-opacity"
                onClick={() => setIsMobileFilterOpen(false)}
              />
              <div className="fixed bottom-0 inset-x-0 bg-white rounded-t-3xl p-5 z-50 shadow-2xl border-t border-slate-200 space-y-4 sm:hidden animate-fade-in">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <Filter className="w-4 h-4 text-brand-500" /> Filter Customer Directory
                    </h3>
                    <p className="text-xs text-slate-500">Select trip category to filter accounts list</p>
                  </div>
                  <button
                    onClick={() => setIsMobileFilterOpen(false)}
                    className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1.5 max-h-[60vh] overflow-y-auto">
                  {[
                    { id: "ALL", label: "All Customers", count: filterCounts.ALL, icon: Layers, color: "text-slate-600 bg-slate-100" },
                    { id: "CONFIRMED", label: "Confirmed Bookings", count: filterCounts.CONFIRMED, icon: CheckCircle2, color: "text-purple-600 bg-purple-100" },
                    { id: "RUNNING", label: "Running Trips", count: filterCounts.RUNNING, icon: PlayCircle, color: "text-emerald-600 bg-emerald-100" },
                    { id: "COMPLETED", label: "Completed Trips", count: filterCounts.COMPLETED, icon: Check, color: "text-teal-600 bg-teal-100" },
                    { id: "CANCELLED", label: "Cancelled Trips", count: filterCounts.CANCELLED, icon: XCircle, color: "text-rose-600 bg-rose-100" },
                  ].map((item) => {
                    const IconComp = item.icon;
                    const isSelected = activeFilter === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveFilter(item.id as TripFilterCategory);
                          setIsMobileFilterOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition text-left cursor-pointer ${
                          isSelected
                            ? "bg-brand-50/60 border-brand-500 text-slate-900 shadow-2xs"
                            : "bg-white border-slate-100 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${item.color}`}>
                            <IconComp className="w-4 h-4" />
                          </div>
                          <span>{item.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold font-mono ${isSelected ? "bg-brand-500 text-white" : "bg-slate-100 text-slate-600"}`}>
                            {item.count}
                          </span>
                          {isSelected && <Check className="w-4 h-4 text-brand-600" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Desktop & Tablet Horizontal Tab Buttons */}
        <div className="hidden sm:flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5 text-slate-400" /> Filter Directory:
          </span>

          <button
            onClick={() => setActiveFilter("ALL")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              activeFilter === "ALL"
                ? "bg-slate-800 text-white shadow-xs"
                : "bg-slate-50 hover:bg-slate-100 text-slate-600"
            }`}
            id="filter-btn-all"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Customers</span>
            <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold font-mono ${activeFilter === "ALL" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"}`}>
              {filterCounts.ALL}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter("CONFIRMED")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              activeFilter === "CONFIRMED"
                ? "bg-purple-600 text-white shadow-xs"
                : "bg-purple-50 hover:bg-purple-100 text-purple-700"
            }`}
            id="filter-btn-confirmed"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Confirmed Bookings</span>
            <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold font-mono ${activeFilter === "CONFIRMED" ? "bg-white/20 text-white" : "bg-purple-200 text-purple-800"}`}>
              {filterCounts.CONFIRMED}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter("RUNNING")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              activeFilter === "RUNNING"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700"
            }`}
            id="filter-btn-running"
          >
            <PlayCircle className="w-3.5 h-3.5" />
            <span>Running Trips</span>
            <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold font-mono ${activeFilter === "RUNNING" ? "bg-white/20 text-white" : "bg-emerald-200 text-emerald-800"}`}>
              {filterCounts.RUNNING}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter("COMPLETED")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              activeFilter === "COMPLETED"
                ? "bg-teal-600 text-white shadow-xs"
                : "bg-teal-50 hover:bg-teal-100 text-teal-700"
            }`}
            id="filter-btn-completed"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Completed Trips</span>
            <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold font-mono ${activeFilter === "COMPLETED" ? "bg-white/20 text-white" : "bg-teal-200 text-teal-800"}`}>
              {filterCounts.COMPLETED}
            </span>
          </button>

          <button
            onClick={() => setActiveFilter("CANCELLED")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              activeFilter === "CANCELLED"
                ? "bg-rose-600 text-white shadow-xs"
                : "bg-rose-50 hover:bg-rose-100 text-rose-700"
            }`}
            id="filter-btn-cancelled"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Cancelled Trips</span>
            <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold font-mono ${activeFilter === "CANCELLED" ? "bg-white/20 text-white" : "bg-rose-200 text-rose-800"}`}>
              {filterCounts.CANCELLED}
            </span>
          </button>
        </div>
      </div>

      {/* Slide down Add Customer Profile */}
      {showAddForm && (
        <form onSubmit={handleCreateCustomer} className="bg-white rounded-2xl p-6 border border-brand-100 shadow-md grid grid-cols-1 md:grid-cols-3 gap-5 animate-fade-in" id="add-cust-form">
          <div className="md:col-span-3 border-b border-slate-100 pb-3">
            <h3 className="text-lg font-bold font-display text-slate-800">Create Travel Agency / Corporate Client Profile</h3>
            <p className="text-xs text-slate-400">Configure client details, contracted vehicle rates, daily driver bata, and default itineraries.</p>
          </div>
          
          {/* Section 1: Contact Details */}
          <div className="md:col-span-3">
            <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-md uppercase tracking-wider">
              1. Contact & Tax Identifications
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Full Name *</label>
            <input
              type="text"
              placeholder="e.g., Vikramaditya Deshmukh"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:border-brand-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Phone Number *</label>
            <input
              type="tel"
              placeholder="+91 98..."
              required
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:border-brand-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Email Address</label>
            <input
              type="email"
              placeholder="name@domain.com"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:border-brand-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase font-medium">Client GSTIN (Tax ID) - Optional</label>
            <input
              type="text"
              placeholder="e.g., 29ABCDE1234F..."
              value={formData.gstNumber}
              onChange={e => setFormData({ ...formData, gstNumber: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:border-brand-500 focus:outline-none font-mono"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Billing / Company Address</label>
            <input
              type="text"
              placeholder="Enter corporate office headquarters or billing address..."
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:border-brand-500 focus:outline-none"
            />
          </div>

          {/* Section 2: Contract Rates & Trip Defaults */}
          <div className="md:col-span-3 border-t border-slate-100 pt-4">
            <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-md uppercase tracking-wider">
              2. Contracted Vehicle, Assigned Rates & Defaults
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Assigned Vehicle Class / Model</label>
            <input
              type="text"
              placeholder="e.g., Sedan, SUV, Innova Crysta"
              value={formData.vehicle}
              onChange={e => setFormData({ ...formData, vehicle: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:border-brand-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Vehicle Provider / Vendor</label>
            <input
              type="text"
              placeholder="e.g., Eagle Travels Fleet, Royal Cabs"
              value={formData.vehicleProvider}
              onChange={e => setFormData({ ...formData, vehicleProvider: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:border-brand-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Assigned Rate Engage (₹ Base Pack)</label>
            <input
              type="number"
              placeholder="e.g., 2500"
              value={formData.assignedRateEngage}
              onChange={e => setFormData({ ...formData, assignedRateEngage: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:border-brand-500 focus:outline-none font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Per KM Rate (₹/KM)</label>
            <input
              type="number"
              step="0.1"
              placeholder="e.g., 14"
              value={formData.perKmRate}
              onChange={e => setFormData({ ...formData, perKmRate: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:border-brand-500 focus:outline-none font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Driver Bata / Daily Allowance (₹)</label>
            <input
              type="number"
              placeholder="e.g., 400"
              value={formData.driverBata}
              onChange={e => setFormData({ ...formData, driverBata: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:border-brand-500 focus:outline-none font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Advance Amount (₹) - Optional</label>
            <input
              type="number"
              placeholder="e.g., 2000"
              value={formData.advanceAmount}
              onChange={e => setFormData({ ...formData, advanceAmount: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:border-brand-500 focus:outline-none font-mono text-emerald-600 font-bold"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Default Pickup Location</label>
            <input
              type="text"
              placeholder="e.g., Kempegowda Airport, Hotel Hilton"
              value={formData.pickupLocation}
              onChange={e => setFormData({ ...formData, pickupLocation: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:border-brand-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Default Pickup Time</label>
            <input
              type="text"
              placeholder="e.g., 08:30 AM or 14:00"
              value={formData.pickupTime}
              onChange={e => setFormData({ ...formData, pickupTime: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:border-brand-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Visiting Places / Destinations</label>
            <input
              type="text"
              placeholder="e.g., Coorg, Mysore, Ooty Sightseeing"
              value={formData.visitingPlaces}
              onChange={e => setFormData({ ...formData, visitingPlaces: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:border-brand-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Total Passengers</label>
            <input
              type="number"
              min="1"
              placeholder="e.g., 4"
              value={formData.passengers}
              onChange={e => setFormData({ ...formData, passengers: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:border-brand-500 focus:outline-none font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Contract Start Date</label>
            <input
              type="date"
              value={formData.startDate}
              onChange={e => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:border-brand-500 focus:outline-none font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Contract End Date</label>
            <input
              type="date"
              value={formData.endDate}
              onChange={e => setFormData({ ...formData, endDate: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:border-brand-500 focus:outline-none font-mono"
            />
          </div>

          {/* Profit Configuration Fields */}
          <div className="md:col-span-3 border-t border-slate-100 pt-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
              📊 Profit Configuration (For Post-Trip Calculation)
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-emerald-50/40 p-3.5 rounded-xl border border-emerald-100/40">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase">Profit per KM (₹/KM)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g., 2.50"
                  value={formData.profitPerKm}
                  onChange={e => setFormData({ ...formData, profitPerKm: e.target.value })}
                  className="w-full px-3.5 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:border-brand-500 focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase">Profit in Bata (₹/Day)</label>
                <input
                  type="number"
                  placeholder="e.g., 100"
                  value={formData.profitBata}
                  onChange={e => setFormData({ ...formData, profitBata: e.target.value })}
                  className="w-full px-3.5 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:border-brand-500 focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase">Profit in Engage (₹ Base Pack)</label>
                <input
                  type="number"
                  placeholder="e.g., 500"
                  value={formData.profitEngage}
                  onChange={e => setFormData({ ...formData, profitEngage: e.target.value })}
                  className="w-full px-3.5 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:border-brand-500 focus:outline-none font-mono"
                />
              </div>
            </div>
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Internal Account Notes & Directives</label>
            <textarea
              placeholder="Add key billing cycles, special transit rates, client guidelines..."
              rows={2}
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:border-brand-500 focus:outline-none"
            />
          </div>
          
          <div className="md:col-span-3 flex justify-end gap-3 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm rounded-xl shadow-sm transition"
              id="submit-cust-btn"
            >
              Create Account Profile
            </button>
          </div>
        </form>
      )}

      {/* Main split dashboard view */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Customers list (Span 4) */}
        <div className={`bg-white rounded-2xl border border-slate-100 shadow-xs lg:col-span-4 h-[620px] flex-col overflow-hidden ${mobileShowDetails ? "hidden lg:flex" : "flex"}`} id="customers-list-panel">
          <div className="p-4 border-b border-slate-100 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search registered accounts..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50/50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-brand-500 focus:outline-none transition"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                No profiles registered.
              </div>
            ) : (
              filteredCustomers.map(cust => {
                const tData = getCustomerTripData(cust);
                return (
                  <div
                    key={cust.id}
                    onClick={() => {
                      setSelectedCustId(cust.id);
                      setIsEditing(false);
                      setMobileShowDetails(true);
                    }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex justify-between items-center ${
                      cust.id === selectedCustId
                        ? "border-brand-500 bg-brand-50/30 shadow-2xs"
                        : "border-slate-50 hover:border-slate-100 hover:bg-slate-50/50"
                    }`}
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-semibold text-slate-800 text-sm truncate">{cust.name}</h4>
                        {cust.advanceAmount !== undefined && cust.advanceAmount > 0 && (
                          <span className="shrink-0 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-mono border border-emerald-100">
                            ₹{cust.advanceAmount} Adv
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">{cust.email || cust.phone}</p>
                      
                      {/* Trip status badges */}
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {cust.vehicleProvider && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 truncate max-w-[140px]" title={cust.vehicleProvider}>
                            🏢 {cust.vehicleProvider}
                          </span>
                        )}
                        {tData.hasRunningTrips && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Running
                          </span>
                        )}
                        {tData.hasUpcomingTrips && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                            <Clock className="w-2.5 h-2.5 text-blue-500" />
                            Upcoming
                          </span>
                        )}
                        {tData.hasConfirmedBooking && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                            <CheckCircle2 className="w-2.5 h-2.5 text-purple-500" />
                            Confirmed
                          </span>
                        )}
                        {tData.hasCompletedTrips && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                            <Check className="w-2.5 h-2.5 text-teal-500" />
                            Completed ({tData.trips.filter(t => t.status === TripStatus.COMPLETED).length})
                          </span>
                        )}
                      </div>

                      {(cust.startDate || cust.endDate) && (
                        <p className="text-[10px] font-bold font-mono text-brand-600 mt-1 flex items-center gap-1">
                          <span>📅</span>
                          <span>
                            {cust.startDate ? new Date(cust.startDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: '2-digit' }) : "Open"}
                            {" — "}
                            {cust.endDate ? new Date(cust.endDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: '2-digit' }) : "Open"}
                          </span>
                        </p>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Customer Details Workspace (Span 8) */}
        <div className={`bg-white rounded-2xl border border-slate-100 shadow-xs lg:col-span-8 h-[620px] flex-col overflow-hidden ${!mobileShowDetails ? "hidden lg:flex" : "flex"}`} id="customer-details-panel">
          {/* Mobile Back Header */}
          <div className="lg:hidden p-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
            <button
              type="button"
              onClick={() => setMobileShowDetails(false)}
              className="flex items-center gap-2 text-xs font-bold text-slate-100 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-xl transition cursor-pointer"
              id="mobile-back-cust-list-btn"
            >
              <ArrowLeft className="w-4 h-4 text-brand-400 shrink-0" />
              <span>Back to Customer Directory</span>
            </button>
            {selectedCust && (
              <span className="text-[10px] font-mono font-bold text-slate-300 bg-slate-800 px-2 py-1 rounded">
                {selectedCust.id}
              </span>
            )}
          </div>
          {selectedCust ? (
            isEditing ? (
              <form onSubmit={handleSaveEdit} className="flex-1 flex flex-col h-full overflow-hidden" id="edit-cust-form-panel">
                {/* Fixed Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
                  <div>
                    <h3 className="text-lg font-bold font-display text-slate-800">Edit Customer Profile</h3>
                    <p className="text-xs text-slate-500">Modify information, contract rates, and default specifications for this account.</p>
                  </div>
                  <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2.5 py-1 rounded">
                    ID: {selectedCust.id}
                  </span>
                </div>

                {/* Scrollable Form Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                  {/* Section 1 */}
                  <div>
                    <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-md uppercase tracking-wider">
                      1. Contact & Tax Identifications
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={editFormData.name}
                        onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:border-brand-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Phone Number *</label>
                      <input
                        type="text"
                        required
                        value={editFormData.phone}
                        onChange={e => setEditFormData({ ...editFormData, phone: e.target.value })}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:border-brand-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Email Address</label>
                      <input
                        type="email"
                        value={editFormData.email}
                        onChange={e => setEditFormData({ ...editFormData, email: e.target.value })}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:border-brand-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase font-medium">Client GSTIN (Tax ID) - Optional</label>
                      <input
                        type="text"
                        placeholder="e.g., 29ABCDE1234F..."
                        value={editFormData.gstNumber}
                        onChange={e => setEditFormData({ ...editFormData, gstNumber: e.target.value })}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:border-brand-500 focus:outline-none font-mono"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Billing / Company Address</label>
                      <input
                        type="text"
                        value={editFormData.address}
                        onChange={e => setEditFormData({ ...editFormData, address: e.target.value })}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:border-brand-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Section 2 */}
                  <div className="border-t border-slate-100 pt-4">
                    <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-md uppercase tracking-wider">
                      2. Contracted Vehicle, Assigned Rates & Defaults
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Assigned Vehicle Class / Model</label>
                      <input
                        type="text"
                        placeholder="e.g., Sedan, SUV, Innova Crysta"
                        value={editFormData.vehicle}
                        onChange={e => setEditFormData({ ...editFormData, vehicle: e.target.value })}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:border-brand-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Vehicle Provider / Vendor</label>
                      <input
                        type="text"
                        placeholder="e.g., Eagle Travels Fleet, Royal Cabs"
                        value={editFormData.vehicleProvider}
                        onChange={e => setEditFormData({ ...editFormData, vehicleProvider: e.target.value })}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:border-brand-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Assigned Rate Engage (₹ Base Pack)</label>
                      <input
                        type="number"
                        value={editFormData.assignedRateEngage}
                        onChange={e => setEditFormData({ ...editFormData, assignedRateEngage: e.target.value })}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:border-brand-500 focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Per KM Rate (₹/KM)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={editFormData.perKmRate}
                        onChange={e => setEditFormData({ ...editFormData, perKmRate: e.target.value })}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:border-brand-500 focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Driver Bata / Daily Allowance (₹)</label>
                      <input
                        type="number"
                        value={editFormData.driverBata}
                        onChange={e => setEditFormData({ ...editFormData, driverBata: e.target.value })}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:border-brand-500 focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Advance Amount (₹)</label>
                      <input
                        type="number"
                        value={editFormData.advanceAmount}
                        onChange={e => setEditFormData({ ...editFormData, advanceAmount: e.target.value })}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:border-brand-500 focus:outline-none font-mono text-emerald-600 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Default Pickup Location</label>
                      <input
                        type="text"
                        value={editFormData.pickupLocation}
                        onChange={e => setEditFormData({ ...editFormData, pickupLocation: e.target.value })}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:border-brand-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Default Pickup Time</label>
                      <input
                        type="text"
                        placeholder="e.g., 08:30 AM or 14:00"
                        value={editFormData.pickupTime}
                        onChange={e => setEditFormData({ ...editFormData, pickupTime: e.target.value })}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:border-brand-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Visiting Places / Destinations</label>
                      <input
                        type="text"
                        value={editFormData.visitingPlaces}
                        onChange={e => setEditFormData({ ...editFormData, visitingPlaces: e.target.value })}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:border-brand-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Total Passengers</label>
                      <input
                        type="number"
                        min="1"
                        placeholder="e.g., 4"
                        value={editFormData.passengers}
                        onChange={e => setEditFormData({ ...editFormData, passengers: e.target.value })}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:border-brand-500 focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Contract Start Date</label>
                      <input
                        type="date"
                        value={editFormData.startDate}
                        onChange={e => setEditFormData({ ...editFormData, startDate: e.target.value })}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:border-brand-500 focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Contract End Date</label>
                      <input
                        type="date"
                        value={editFormData.endDate}
                        onChange={e => setEditFormData({ ...editFormData, endDate: e.target.value })}
                        className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:border-brand-500 focus:outline-none font-mono"
                      />
                    </div>

                    {/* Profit Configuration Fields */}
                    <div className="md:col-span-3 border-t border-slate-100 pt-3">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                        📊 Profit Configuration (For Post-Trip Calculation)
                      </span>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-emerald-50/40 p-3.5 rounded-xl border border-emerald-100/40">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase">Profit per KM (₹/KM)</label>
                          <input
                            type="number"
                            step="0.1"
                            placeholder="e.g., 2.50"
                            value={editFormData.profitPerKm}
                            onChange={e => setEditFormData({ ...editFormData, profitPerKm: e.target.value })}
                            className="w-full px-3.5 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:border-brand-500 focus:outline-none font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase">Profit in Bata (₹/Day)</label>
                          <input
                            type="number"
                            placeholder="e.g., 100"
                            value={editFormData.profitBata}
                            onChange={e => setEditFormData({ ...editFormData, profitBata: e.target.value })}
                            className="w-full px-3.5 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:border-brand-500 focus:outline-none font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase">Profit in Engage (₹ Base Pack)</label>
                          <input
                            type="number"
                            placeholder="e.g., 500"
                            value={editFormData.profitEngage}
                            onChange={e => setEditFormData({ ...editFormData, profitEngage: e.target.value })}
                            className="w-full px-3.5 py-1.5 border border-slate-200 rounded-lg text-sm bg-white focus:border-brand-500 focus:outline-none font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-4">
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Internal Account Notes & Directives</label>
                    <textarea
                      rows={2}
                      value={editFormData.notes}
                      onChange={e => setEditFormData({ ...editFormData, notes: e.target.value })}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:border-brand-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Fixed Footer Buttons */}
                <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold text-xs rounded-xl hover:bg-slate-50 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs rounded-xl shadow-sm transition cursor-pointer"
                    id="save-edited-cust-btn"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex-1 flex flex-col h-full overflow-y-auto p-6 space-y-6">
                {/* Header profile */}
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 border-b border-slate-100 pb-5 shrink-0">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded">
                      {selectedCust.id}
                    </span>
                    <h3 className="text-2xl font-bold font-display text-slate-800">
                      {selectedCust.name}
                    </h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-500 pt-1">
                      <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-slate-400" /> {selectedCust.phone}</span>
                      {selectedCust.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-slate-400" /> {selectedCust.email}</span>}
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {selectedCust.address}</span>
                    </div>

                    {/* Prominent Trip & Itinerary Details Box directly below Contact Details */}
                    <div className="mt-2.5 bg-slate-900 text-white p-3 rounded-xl shadow-xs border border-slate-800 space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-brand-400 shrink-0" />
                          <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Trip Date / Period:</span>
                          <span className="text-xs font-bold font-mono text-emerald-400 bg-slate-800 px-2 py-0.5 rounded">
                            {selectedCust.startDate || selectedCust.endDate ? (
                              <span>
                                {selectedCust.startDate ? new Date(selectedCust.startDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' }) : "Open Start"}
                                {" — "}
                                {selectedCust.endDate ? new Date(selectedCust.endDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' }) : "Open End"}
                              </span>
                            ) : customerTrips.length > 0 ? (
                              <span>
                                {new Date(customerTrips[0].startDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}
                                {" — "}
                                {new Date(customerTrips[0].endDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-sans font-normal">Not Scheduled</span>
                            )}
                          </span>
                        </div>

                        {/* Interactive Status Selector or Book Trip Action */}
                        {customerTrips.length > 0 ? (
                          // Show trip status dropdown if trip exists
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">Update Trip Status:</span>
                            <select
                              value={customerTrips[0].status}
                              onChange={(e) => handleUpdateTripStatus(customerTrips[0].id, e.target.value as TripStatus)}
                              className={`text-xs px-2.5 py-1 rounded-lg transition-colors cursor-pointer shadow-xs focus:outline-none focus:ring-2 focus:ring-brand-400 ${getStatusSelectColor(customerTrips[0].status)}`}
                              id="cust-detail-update-status-select"
                            >
                              <option value={TripStatus.UPCOMING}>🕒 Upcoming</option>
                              <option value={TripStatus.STARTED}>🚀 Started</option>
                              <option value={TripStatus.RUNNING}>🟢 Running</option>
                              <option value={TripStatus.COMPLETED}>✓ Completed</option>
                              <option value={TripStatus.CANCELLED}>🚫 Cancelled</option>
                            </select>
                            <button
                              type="button"
                              onClick={() => handleDeleteTrip(customerTrips[0].id)}
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/50 border border-slate-700/60 rounded-lg transition cursor-pointer"
                              title="Delete Trip"
                              id="cust-detail-delete-trip-btn"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : selectedCust.startDate ? (
                          // Show booking status dropdown if no trip but has booking dates (same options as trip)
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">Booking Status:</span>
                            <select
                              value={selectedCust.bookingStatus || "Upcoming"}
                              onChange={(e) => handleUpdateCustomerBookingStatus(selectedCust.id, e.target.value)}
                              className={`text-xs px-2.5 py-1 rounded-lg transition-colors cursor-pointer shadow-xs focus:outline-none focus:ring-2 focus:ring-brand-400 ${getStatusSelectColor(selectedCust.bookingStatus || "Upcoming")}`}
                              id="cust-detail-update-booking-status-select"
                            >
                              <option value="Upcoming">🕒 Upcoming</option>
                              <option value="Started">🚀 Started</option>
                              <option value="Running">🟢 Running</option>
                              <option value="Completed">✓ Completed</option>
                              <option value="Cancelled">🚫 Cancelled</option>
                            </select>
                          </div>
                        ) : (
                          // Show Confirm Booking button if no booking dates
                          <button
                            type="button"
                            onClick={() => handleCreateTripForCustomer(selectedCust)}
                            className="text-[11px] font-bold px-2.5 py-1 bg-brand-600 hover:bg-brand-500 text-white rounded-lg transition cursor-pointer flex items-center gap-1 shadow-xs"
                            id="cust-detail-book-trip-btn"
                          >
                            <Plus className="w-3.5 h-3.5" /> Confirm Booking
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-0.5">
                        <div className="flex items-start gap-2 bg-slate-800/70 p-2.5 rounded-lg border border-slate-700/50">
                          <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pick Up Place & Time</span>
                            <span className="font-semibold text-slate-100 break-words block">
                              {selectedCust.pickupLocation || (customerTrips.length > 0 ? customerTrips[0].pickup : "Not Specified")}
                            </span>
                            {selectedCust.pickupTime && (
                              <span className="text-emerald-300 text-[11px] font-medium flex items-center gap-1 mt-0.5">
                                <Clock className="w-3 h-3 text-emerald-400 shrink-0" /> {selectedCust.pickupTime}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-start gap-2 bg-slate-800/70 p-2.5 rounded-lg border border-slate-700/50">
                          <Car className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Vehicle / Provider</span>
                            <span className="font-semibold text-slate-100 capitalize break-words block">
                              {selectedCust.vehicle || (customerTrips.length > 0 ? customerTrips[0].vehicleNumber : "Not Assigned")}
                            </span>
                            {selectedCust.vehicleProvider && (
                              <span className="text-amber-300 text-[11px] font-normal block mt-0.5">
                                🏢 Provider: {selectedCust.vehicleProvider}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-start gap-2 bg-slate-800/70 p-2.5 rounded-lg border border-slate-700/50">
                          <User className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Passengers</span>
                            <span className="font-semibold text-slate-100 break-words block">
                              {selectedCust.passengers 
                                ? `${selectedCust.passengers} ${selectedCust.passengers === 1 ? 'Person' : 'People'}`
                                : (customerTrips.length > 0 && customerTrips[0].passengers 
                                    ? `${customerTrips[0].passengers} ${customerTrips[0].passengers === 1 ? 'Person' : 'People'}`
                                    : "Not Specified")}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-start gap-2 bg-slate-800/70 p-2.5 rounded-lg border border-slate-700/50">
                          <Navigation className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Visiting Places / Locations</span>
                            <span className="font-semibold text-slate-100 break-words block leading-relaxed">
                              {selectedCust.visitingPlaces || (customerTrips.length > 0 ? `${customerTrips[0].drop}${customerTrips[0].stops && customerTrips[0].stops.length > 0 ? ` (Stops: ${customerTrips[0].stops.join(', ')})` : ''}` : "Not Specified")}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* GST Badging & Actions */}
                  <div className="flex flex-col items-end gap-2.5 text-right text-xs shrink-0">
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">GST Registration</p>
                      {selectedCust.gstNumber ? (
                        <span className="inline-flex mt-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 font-mono font-semibold rounded-lg border border-emerald-100">
                          {selectedCust.gstNumber}
                        </span>
                      ) : (
                        <span className="inline-flex mt-1 px-2.5 py-0.5 bg-amber-50 text-amber-700 font-semibold rounded-lg border border-amber-100">
                          No GST Listed
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleStartEdit}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-600 font-bold text-xs rounded-lg transition-colors border border-brand-100 cursor-pointer"
                        id="edit-customer-profile-btn"
                      >
                        <Pencil className="w-3 h-3" /> Edit Profile
                      </button>
                      <button
                        onClick={handleDeleteCustomer}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs rounded-lg transition-colors border border-rose-200 cursor-pointer"
                        id="delete-customer-btn"
                        title="Delete Customer"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  </div>
                </div>

              {/* B2B Contracting & Travel Preferences Panel */}
              <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-4 shrink-0 grid grid-cols-2 md:grid-cols-6 gap-4">
                <div className="col-span-2 md:col-span-6 pb-2 border-b border-slate-200/50 flex justify-between items-center">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <Car className="w-4 h-4 text-brand-500" /> Contract Rates & Travel Defaults
                  </h4>
                  <span className="text-[10px] bg-brand-50 text-brand-600 px-2 py-0.5 rounded font-semibold uppercase">
                    B2B Profile Active
                  </span>
                </div>
                
                <div className="space-y-0.5">
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Assigned Vehicle</p>
                  <p className="text-sm font-semibold text-slate-800">{selectedCust.vehicle || "Not Specified"}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Vehicle Provider</p>
                  <p className="text-sm font-semibold text-brand-600">{selectedCust.vehicleProvider || "Not Specified"}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Rate Engage (Base)</p>
                  <p className="text-sm font-bold text-slate-800">
                    {selectedCust.assignedRateEngage ? `₹${selectedCust.assignedRateEngage}` : "Not Contracted"}
                  </p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Per KM Charge</p>
                  <p className="text-sm font-bold text-slate-800">
                    {selectedCust.perKmRate ? `₹${selectedCust.perKmRate}/KM` : "Not Contracted"}
                  </p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Driver Bata (Daily)</p>
                  <p className="text-sm font-bold text-slate-800">
                    {selectedCust.driverBata ? `₹${selectedCust.driverBata}/day` : "Not Specified"}
                  </p>
                </div>
                <div className="space-y-0.5 bg-emerald-50/50 p-1 rounded-lg border border-emerald-100/30">
                  <p className="text-emerald-600 text-[10px] font-bold uppercase tracking-wider">Advance Amount</p>
                  <p className="text-sm font-bold text-emerald-700 font-mono">
                    {selectedCust.advanceAmount ? `₹${selectedCust.advanceAmount}` : "₹0"}
                  </p>
                </div>
                
                <div className="col-span-2 md:col-span-2 space-y-0.5 pt-1 border-t border-slate-200/30">
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Default Pickup Location & Time</p>
                  <p className="text-xs font-medium text-slate-700 truncate" title={selectedCust.pickupLocation}>
                    {selectedCust.pickupLocation || "Not Configured"}
                    {selectedCust.pickupTime && <span className="ml-1 text-emerald-600 font-bold">({selectedCust.pickupTime})</span>}
                  </p>
                </div>
                <div className="col-span-2 md:col-span-4 space-y-0.5 pt-1 border-t border-slate-200/30">
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider font-display">Visiting Places / Destinations</p>
                  <p className="text-xs font-medium text-slate-700 truncate" title={selectedCust.visitingPlaces}>
                    {selectedCust.visitingPlaces || "Not Configured"}
                  </p>
                </div>
                <div className="col-span-2 md:col-span-6 space-y-0.5 pt-1 border-t border-slate-200/30">
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider font-display">Contract Validity Period</p>
                  <p className="text-xs font-semibold text-brand-600 font-mono">
                    {selectedCust.startDate || selectedCust.endDate ? (
                      <span>
                        📅 {selectedCust.startDate ? new Date(selectedCust.startDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' }) : "Open Start"}
                        {" — "}
                        {selectedCust.endDate ? new Date(selectedCust.endDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' }) : "Open End"}
                      </span>
                    ) : (
                      <span className="text-slate-400 font-sans">Not Configured</span>
                    )}
                  </p>
                </div>

                <div className="col-span-2 md:col-span-5 border-t border-dashed border-slate-200 pt-2 grid grid-cols-3 gap-4">
                  <div className="space-y-0.5 bg-emerald-50/20 px-2 py-1.5 rounded-lg border border-emerald-100/20">
                    <p className="text-emerald-700 text-[9px] font-bold uppercase tracking-wider">Configured Profit per KM</p>
                    <p className="text-xs font-bold text-slate-800">
                      {selectedCust.profitPerKm !== undefined ? `₹${selectedCust.profitPerKm}/KM` : "₹0.00/KM"}
                    </p>
                  </div>
                  <div className="space-y-0.5 bg-emerald-50/20 px-2 py-1.5 rounded-lg border border-emerald-100/20">
                    <p className="text-emerald-700 text-[9px] font-bold uppercase tracking-wider">Configured Profit Bata</p>
                    <p className="text-xs font-bold text-slate-800">
                      {selectedCust.profitBata !== undefined ? `₹${selectedCust.profitBata}/day` : "₹0/day"}
                    </p>
                  </div>
                  <div className="space-y-0.5 bg-emerald-50/20 px-2 py-1.5 rounded-lg border border-emerald-100/20">
                    <p className="text-emerald-700 text-[9px] font-bold uppercase tracking-wider">Configured Profit Engage</p>
                    <p className="text-xs font-bold text-slate-800">
                      {selectedCust.profitEngage !== undefined ? `₹${selectedCust.profitEngage}` : "₹0"}
                    </p>
                  </div>
                </div>
              </div>



              {/* Grid content */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 shrink-0">
                {/* Travel routes & notes */}
                <div className="space-y-4">
                  <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1"><BookOpen className="w-3.5 h-3.5 text-brand-500" /> Favorite Circuits</h4>
                    {selectedCust.favoriteRoutes.length > 0 ? (
                      <ul className="space-y-1 text-xs font-semibold text-slate-700">
                        {selectedCust.favoriteRoutes.map((route, idx) => (
                          <li key={idx} className="bg-white p-1.5 rounded border border-slate-100 shadow-2xs">
                            {route}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No historical routes saved.</p>
                    )}
                  </div>

                  <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 space-y-1.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1"><ShieldAlert className="w-3.5 h-3.5 text-brand-500" /> Account Directives</h4>
                    <p className="text-xs text-slate-600 leading-relaxed italic">"{selectedCust.notes || "No special administrative notes."}"</p>
                  </div>
                </div>
              </div>

            </div>
            )
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center text-slate-400 text-sm">
              Select a customer from the catalog directory.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
