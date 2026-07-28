import React, { useState, useEffect } from "react";
import { useToasts } from "./Toast";
import { jsPDF } from "jspdf";
import { format12HourTime } from "../utils/timeUtils";
import {
  ErpDatabase,
  Trip,
  TripStatus,
  TripTimelineEvent,
  TripStop,
  Vehicle,
  Driver,
  Payment
} from "../types";
import {
  Search,
  Plus,
  Play,
  MapPin,
  Calendar,
  Users,
  Compass,
  CheckCircle2,
  AlertTriangle,
  Clock,
  PhoneCall,
  Send,
  User,
  Car,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Tag,
  BookOpen,
  MessageSquare,
  ExternalLink,
  FileDown,
  X,
  Copy,
  Check,
  Link,
  Share2,
  Download,
  FileText,
  Coins,
  IndianRupee,
  ArrowLeft,
  Edit,
  AlertCircle,
  TrendingUp,
  Phone
} from "lucide-react";

interface TripsViewProps {
  db: ErpDatabase;
  onUpdateDb: (updatedDb: ErpDatabase) => void;
  showAddTripFormByDefault?: boolean;
  onAddTripFormClosed?: () => void;
}

export function TripsView({
  db,
  onUpdateDb,
  showAddTripFormByDefault = false,
  onAddTripFormClosed
}: TripsViewProps) {
  const { showToast } = useToasts();
  const [selectedTripId, setSelectedTripId] = useState<string>(db.trips[0]?.id || "");
  const [searchTerm, setSearchTerm] = useState("");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");
  const [showDispatchForm, setShowDispatchForm] = useState(showDispatchFormState());
  const [dispatchStep, setDispatchStep] = useState<1 | 2>(1);
  const [tripsTab, setTripsTab] = useState<"running" | "completed" | "all">("running");
  const [mobileShowDetails, setMobileShowDetails] = useState(false);
  
  // Trip Completion Modal States
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionData, setCompletionData] = useState({
    totalKm: 250,
    totalBata: 1,
    toll: 0,
    engageAmount: 0,
    amountTook: 0,
    paymentMethod: "UPI" as "UPI" | "Cash" | "Bank Transfer" | "Card"
  });

  // Editable Bill & Profit States
  const [editFinancials, setEditFinancials] = useState(false);
  const [editableTotalFare, setEditableTotalFare] = useState(0);
  const [editableProfit, setEditableProfit] = useState(0);
  // Payment Modal States
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentInputVal, setPaymentInputVal] = useState("");
  const [paymentMode, setPaymentMode] = useState<"add" | "set">("add");

  function showDispatchFormState() {
    return showAddTripFormByDefault;
  }

  // Dispatch Trip Form State
  const [formData, setFormData] = useState({
    customerId: db.customers[0]?.id || "",
    vehicleId: "",
    driverId: "",
    driverName: "",
    driverPhone: "",
    pickup: "",
    drop: "",
    stopsText: "", // Comma-separated
    startDate: "",
    endDate: "",
    pickupTime: "",
    closingTime: "",
    passengers: 4,
    tourPackage: "",
    hotel: "",
    guideName: "",
    notes: "",
    advancePaid: ""
  });

  // Real-Time Quick Advance Input map per trip
  const [quickAdvanceInput, setQuickAdvanceInput] = useState<{ [tripId: string]: string }>({});

  // WhatsApp Message Dispatch Preview State
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [whatsappPreview, setWhatsappPreview] = useState<{
    isOpen: boolean;
    message: string;
    phone: string;
    targetName: string;
    whatsappUrl: string;
    trip: Trip;
  } | null>(null);

  const [lastFetchedCustomerId, setLastFetchedCustomerId] = useState<string>("");

  const handleCustomerChange = (customerId: string) => {
    const cust = db.customers.find(c => c.id === customerId);
    if (cust) {
      // Find matching vehicle model if possible among available vehicles
      let matchedVehicleId = formData.vehicleId;
      if (cust.vehicle) {
        const matchingVehicle = db.vehicles.find(
          v => v.isAvailable && (
            v.model.toLowerCase().includes(cust.vehicle!.toLowerCase()) || 
            v.brand.toLowerCase().includes(cust.vehicle!.toLowerCase()) ||
            cust.vehicle!.toLowerCase().includes(v.model.toLowerCase())
          )
        );
        if (matchingVehicle) {
          matchedVehicleId = matchingVehicle.id;
        }
      }

      setFormData(prev => ({
        ...prev,
        customerId,
        pickup: cust.pickupLocation || prev.pickup,
        drop: cust.visitingPlaces || prev.drop,
        startDate: cust.startDate || prev.startDate,
        endDate: cust.endDate || prev.endDate,
        pickupTime: cust.pickupTime || prev.pickupTime,
        passengers: cust.passengers || prev.passengers,
        advancePaid: cust.advanceAmount ? String(cust.advanceAmount) : "",
        notes: cust.notes ? `Customer preferences: ${cust.notes}` : prev.notes,
        vehicleId: matchedVehicleId
      }));

      setLastFetchedCustomerId(customerId);
      showToast(`Loaded ${cust.name}'s profile!`, "info");
    } else {
      setFormData(prev => ({
        ...prev,
        customerId
      }));
      setLastFetchedCustomerId(customerId);
    }
  };

  useEffect(() => {
    if (showDispatchForm && formData.customerId && formData.customerId !== lastFetchedCustomerId) {
      handleCustomerChange(formData.customerId);
    }
  }, [showDispatchForm, formData.customerId, lastFetchedCustomerId]);

  const sendWhatsAppTripSheet = (trip: Trip, target: "customer" | "driver") => {
    const cust = db.customers.find(c => c.id === trip.customerId);
    const phone = target === "customer" ? (cust?.phone || "") : (trip.driverPhone || "");
    
    if (!phone) {
      showToast(`No phone number available for the ${target}.`, "warning");
      return;
    }

    // Clean phone number (keep only digits)
    const cleanPhone = phone.replace(/\D/g, "");
    // Add default country code if missing (91 for India)
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    const cleanVehicleName = (model?: string) => {
      if (!model) return "N/A";
      const parts = model.trim().split(/\s+/);
      if (parts.length === 2 && parts[0].toLowerCase() === parts[1].toLowerCase()) {
        return parts[0];
      }
      return model;
    };
    const vehicleName = cleanVehicleName(trip.vehicleModel);

    let message = "";
    if (target === "customer") {
      message = `*TRIP DISPATCH CONFIRMATION* 🚕\n\n` +
        `Dear *${trip.customerName}*,\n` +
        `Your booking with *${db.settings.name}* has been dispatched. Please find your trip sheet details below:\n\n` +
        `• *Guest Name:* ${trip.customerName}\n` +
        `• *Guest Phone Number:* ${cust?.phone || "N/A"}\n` +
        `• *Vehicle Name:* ${vehicleName}\n` +
        `• *Pick Up Date:* ${trip.startDate}\n` +
        `• *Driver Name:* ${trip.driverName || "N/A"}\n` +
        `• *Driver Phone Number:* ${trip.driverPhone || "N/A"}\n` +
        `• *Pickup Location:* ${trip.pickup}\n` +
        `• *Drop Location:* ${trip.drop}\n\n` +
        `Thank you for choosing ${db.settings.name}. Have a wonderful and safe journey! 🙏✨`;
    } else {
      message = `*DUTY DISPATCH SLIP - ${db.settings.name.toUpperCase()}* 📋\n\n` +
        `Dear *${trip.driverName}*,\n` +
        `You have been assigned to the following duty:\n\n` +
        `• *Guest Name:* ${trip.customerName}\n` +
        `• *Guest Phone Number:* ${cust?.phone || "N/A"}\n` +
        `• *Vehicle Name:* ${vehicleName}\n` +
        `• *Pick Up Date:* ${trip.startDate}\n` +
        `• *Driver Name:* ${trip.driverName || "N/A"}\n` +
        `• *Driver Phone Number:* ${trip.driverPhone || "N/A"}\n` +
        `• *Pickup Location:* ${trip.pickup}\n` +
        `• *Drop Location:* ${trip.drop}\n\n` +
        `Thank you for your dedicated service. Please ensure the vehicle is clean and report on time! 👍`;
    }

    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    
    // Open WhatsApp preview modal (PDF can be downloaded from modal if needed)
    setWhatsappPreview({
      isOpen: true,
      message,
      phone: formattedPhone,
      targetName: target === "customer" ? trip.customerName : trip.driverName,
      whatsappUrl,
      trip
    });
    
    showToast(`Prepared WhatsApp dispatch for ${target === "customer" ? trip.customerName : trip.driverName}!`, "success");
  };

  const generateTripPDF = (trip: Trip): jsPDF => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const formatDate = (dateStr: string) => {
      if (!dateStr) return "";
      try {
        const parts = dateStr.split("-");
        if (parts.length === 3 && parts[0].length === 4) {
          // yyyy-mm-dd format
          return `${parts[2]}-${parts[1]}-${parts[0].slice(-2)}`;
        }
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year = String(d.getFullYear()).slice(-2);
        return `${day}-${month}-${year}`;
      } catch {
        return dateStr;
      }
    };

    const cust = db.customers.find(c => c.id === trip.customerId);
    const matchedVeh = db.vehicles.find(v => v.id === trip.vehicleId || v.model === trip.vehicleModel);
    const vehicleSize = matchedVeh ? `${matchedVeh.seats - 1}+1` : "6+1";

    // 1. Draw Page Border (thin, high-contrast black line)
    doc.setLineWidth(0.2);
    doc.setDrawColor(0, 0, 0);
    doc.rect(10, 10, 190, 277);

    // 2. Title Section
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("Trip Sheet (Duty Slip)", 105, 24, { align: "center" });

    // 3. Draw Table 1 (Personal & Vehicle Info)
    // Height of each of the 7 rows: 9mm. Table starts at Y = 32, ends at Y = 95.
    doc.setLineWidth(0.25);
    doc.rect(15, 32, 180, 63);

    // Horizontal dividers
    for (let i = 1; i < 7; i++) {
      doc.line(15, 32 + i * 9, 195, 32 + i * 9);
    }

    // Row 1 vertical dividers (X: 55, 100, 125)
    doc.line(55, 32, 55, 32 + 9);
    doc.line(100, 32, 100, 32 + 9);
    doc.line(125, 32, 125, 32 + 9);

    // Row 2 vertical dividers
    doc.line(55, 32 + 9, 55, 32 + 18);

    // Row 3 vertical dividers
    doc.line(55, 32 + 18, 55, 32 + 27);

    // Row 4 vertical dividers (X: 55, 100, 125)
    doc.line(55, 32 + 27, 55, 32 + 36);
    doc.line(100, 32 + 27, 100, 32 + 36);
    doc.line(125, 32 + 27, 125, 32 + 36);

    // Row 5 vertical dividers (X: 55, 100, 125)
    doc.line(55, 32 + 36, 55, 32 + 45);
    doc.line(100, 32 + 36, 100, 32 + 45);
    doc.line(125, 32 + 36, 125, 32 + 45);

    // Row 6 vertical dividers
    doc.line(55, 32 + 45, 55, 32 + 54);

    // Row 7 vertical dividers
    doc.line(55, 32 + 54, 55, 32 + 63);

    // Populating Table 1 text
    doc.setFontSize(10);

    // Row 1
    doc.setFont("helvetica", "bold");
    doc.text("Trip Date", 17, 32 + 6);
    doc.setFont("helvetica", "normal");
    doc.text(formatDate(trip.startDate) || "14-07-26", 57, 32 + 6);
    doc.setFont("helvetica", "bold");
    doc.text("Start Time", 102, 32 + 6);
    doc.setFont("helvetica", "normal");
    doc.text(format12HourTime(trip.pickupTime) || "5:30 PM", 127, 32 + 6);

    // Row 2
    doc.setFont("helvetica", "bold");
    doc.text("Vehicle Name", 17, 32 + 9 + 6);
    doc.setFont("helvetica", "normal");
    doc.text(trip.vehicleModel || "Ertiga", 57, 32 + 9 + 6);

    // Row 3
    doc.setFont("helvetica", "bold");
    doc.text("Vehicle Size", 17, 32 + 18 + 6);
    doc.setFont("helvetica", "normal");
    doc.text(vehicleSize, 57, 32 + 18 + 6);

    // Row 4
    doc.setFont("helvetica", "bold");
    doc.text("Driver Name", 17, 32 + 27 + 6);
    doc.setFont("helvetica", "normal");
    doc.text(trip.driverName || "Sajjad", 57, 32 + 27 + 6);
    doc.setFont("helvetica", "bold");
    doc.text("Mobile No", 102, 32 + 27 + 6);
    doc.setFont("helvetica", "normal");
    doc.text(trip.driverPhone || "7337621806", 127, 32 + 27 + 6);

    // Row 5
    doc.setFont("helvetica", "bold");
    doc.text("Guest Name", 17, 32 + 36 + 6);
    doc.setFont("helvetica", "normal");
    doc.text(trip.customerName || "Jeelan", 57, 32 + 36 + 6);
    doc.setFont("helvetica", "bold");
    doc.text("Mobile No", 102, 32 + 36 + 6);
    doc.setFont("helvetica", "normal");
    doc.text(cust?.phone || "9902372833", 127, 32 + 36 + 6);

    // Row 6
    doc.setFont("helvetica", "bold");
    doc.text("Pick Up Address", 17, 32 + 45 + 6);
    doc.setFont("helvetica", "normal");
    doc.text(trip.pickup || "Ballari", 57, 32 + 45 + 6);

    // Row 7
    doc.setFont("helvetica", "bold");
    doc.text("Trip Address", 17, 32 + 54 + 6);
    doc.setFont("helvetica", "normal");
    doc.text(trip.drop || "Chintamani", 57, 32 + 54 + 6);

    // 4. Trip Details Title & Subtitle Section
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("Trip Details", 105, 105, { align: "center" });

    // 5. Draw Table 2 (Trip start, other, and end details)
    // Table starts at Y = 110, Header is 6mm, 3 rows are 10mm each. Total height = 36mm. Ends at Y = 146.
    doc.setLineWidth(0.25);
    doc.rect(15, 110, 180, 36);

    // Horizontal lines
    doc.line(15, 116, 195, 116);
    doc.line(15, 126, 195, 126);
    doc.line(15, 136, 195, 136);

    // Main column dividers
    doc.line(75, 110, 75, 146);
    doc.line(135, 110, 135, 146);

    // Inside column sub-label dividers (35mm labels, 25mm inputs)
    doc.line(50, 116, 50, 146);
    doc.line(110, 116, 110, 146);
    doc.line(170, 116, 170, 146);

    // Header Labels
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("TRIP START DETAILS", 45, 114, { align: "center" });
    doc.text("OTHER DETAILS", 105, 114, { align: "center" });
    doc.text("TRIP END DETAILS", 165, 114, { align: "center" });

    // Row 1 (Y = 116 to 126, center text at Y = 122)
    doc.setFont("helvetica", "bold");
    doc.text("Start Date", 17, 122);
    doc.setFont("helvetica", "normal");
    doc.text(formatDate(trip.startDate) || "", 52, 122);

    doc.setFont("helvetica", "bold");
    doc.text("Toll Plaza", 77, 120);
    doc.text("Charges", 77, 124);

    doc.text("End Date", 137, 122);
    doc.setFont("helvetica", "normal");
    doc.text(formatDate(trip.endDate) || "", 172, 122);

    // Row 2 (Y = 126 to 136, center text at Y = 132)
    doc.setFont("helvetica", "bold");
    doc.text("Start Time", 17, 132);
    doc.setFont("helvetica", "normal");
    doc.text(format12HourTime(trip.pickupTime) || "", 52, 132);

    doc.setFont("helvetica", "bold");
    doc.text("Parking", 77, 132);

    doc.text("End Time", 137, 132);
    doc.setFont("helvetica", "normal");
    doc.text(format12HourTime(trip.closingTime) || "", 172, 132);

    // Row 3 (Y = 136 to 146, center text at Y = 142)
    doc.setFont("helvetica", "bold");
    doc.text("Starting Kms from", 17, 140);
    doc.text("Office", 17, 144);

    doc.text("State Tax", 77, 142);

    doc.text("Ending Kms till", 137, 140);
    doc.text("Office", 137, 144);

    // 6. Signatures & Feedback Layout Y = 160
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Driver Signature", 15, 163);
    doc.text("Guest Signature", 135, 163);

    // Feedback Dotted lines
    doc.setFontSize(10);
    doc.text("FEEDBACK IF ANY:", 15, 178);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("........................................................................", 15, 185);
    doc.text("........................................................................", 15, 193);
    doc.text("........................................................................", 15, 201);
    doc.text("..", 15, 209);
    doc.text("........................................................................", 15, 217);

    // Logo of EAGLE TRAVELS on bottom right
    doc.setTextColor(34, 197, 94); // Green 500
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.text("EAGLE TRAVELS LTD", 155, 175, { align: "center" });
    
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "italic");
    doc.text("Enjoy the feel of traveling...", 155, 179, { align: "center" });

    // Contact information at bottom
    doc.setTextColor(30, 41, 59); // Slate 800
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text("Contact +91-9686342201 for any queries", 155, 190, { align: "center" });

    return doc;
  };

  const handleExportPDF = (trip: Trip) => {
    try {
      const doc = generateTripPDF(trip);
      doc.save(`TripSheet_${trip.id}_${trip.customerName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`);
      showToast(`Trip Sheet PDF generated successfully in exact official format!`, "success");
    } catch (err: any) {
      console.error(err);
      showToast("Could not export PDF. Please try again.", "warning");
    }
  };

  // Dynamically enrich trip with advance payments recorded in Customer Directory, Invoices, or Payments Ledger
  const getEnrichedTrip = (t: Trip): Trip => {
    const cust = db.customers.find(c => c.id === t.customerId || (t.customerName && c.name.toLowerCase().trim() === t.customerName.toLowerCase().trim()));
    let advance = t.advancePaid !== undefined && t.advancePaid !== 0 ? t.advancePaid : (cust?.advanceAmount || 0);

    // 1. Check associated invoice's advanceAmount
    const inv = db.invoices.find(i => i.tripId === t.id || i.tripNumber === t.id);
    if (inv && inv.advanceAmount && inv.advanceAmount > advance) {
      advance = inv.advanceAmount;
    }

    // 2. Check payments ledger entries strictly linked to this specific trip ID or its invoice ID
    const tripPayments = db.payments.filter(p => 
      p.tripNumber === t.id || 
      (inv && p.invoiceId === inv.id)
    );
    if (tripPayments.length > 0) {
      const sumPayments = tripPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
      if (sumPayments > advance) {
        advance = sumPayments;
      }
    }

    const baseFare = t.baseFare || 0;
    const gstAmount = 0; // GST is calculated only while generating invoice bill
    const totalFare = t.totalFare || t.baseFare || 0;
    const paymentStatus: "Pending" | "Partial" | "Paid" = advance >= totalFare && totalFare > 0
      ? "Paid"
      : (advance > 0 ? "Partial" : "Pending");

    const customerPhone = t.customerPhone || cust?.phone || "";

    const rawVehicleModel = t.vehicleModel || "";
    const vehicleParts = rawVehicleModel.trim().split(/\s+/);
    const cleanVehicleModel = (vehicleParts.length === 2 && vehicleParts[0].toLowerCase() === vehicleParts[1].toLowerCase())
      ? vehicleParts[0]
      : rawVehicleModel;

    return {
      ...t,
      vehicleModel: cleanVehicleModel,
      customerPhone,
      advancePaid: advance,
      totalFare,
      paymentStatus
    };
  };

  const enrichedTrips = db.trips.map(getEnrichedTrip);

  const selectedTrip = enrichedTrips.find(t => t.id === selectedTripId) || enrichedTrips[0];

  // Available drivers & vehicles lists
  const availableVehicles = db.vehicles.filter(v => v.isAvailable);
  const availableDrivers = db.drivers.filter(d => d.isAvailable);

  // Filter trips
  const filteredTrips = enrichedTrips.filter(t => {
    const matchesSearch = t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.pickup.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.drop.toLowerCase().includes(searchTerm.toLowerCase());
      
    let matchesDate = true;
    if (startDateFilter) {
      matchesDate = matchesDate && t.startDate >= startDateFilter;
    }
    if (endDateFilter) {
      // If end date filter is selected, check that the trip's start date is on or before it
      matchesDate = matchesDate && t.startDate <= endDateFilter;
    }
    return matchesSearch && matchesDate;
  });

  // Handle Dispatch submit
  const handleDispatchTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId || !formData.vehicleId || !formData.driverName.trim() || !formData.pickup || !formData.drop) {
      showToast("Missing required dispatch variables! Please verify Customer, Vehicle, Driver Name, and Routes.", "warning");
      return;
    }

    const customer = db.customers.find(c => c.id === formData.customerId);
    const vehicle = db.vehicles.find(v => v.id === formData.vehicleId);

    if (!customer || !vehicle) return;

    // Resolve or create virtual driver
    let driver = db.drivers.find(d => d.name.toLowerCase() === formData.driverName.trim().toLowerCase());
    if (!driver) {
      driver = {
        id: `drv-manual-${Date.now()}`,
        name: formData.driverName.trim(),
        photoUrl: "",
        licenseNumber: "Manual Input",
        aadharNumber: "",
        panNumber: "",
        phone: formData.driverPhone,
        email: "",
        address: "",
        salary: 0,
        emergencyContactName: "",
        emergencyContactPhone: "",
        documents: [],
        isAvailable: true,
        ratings: [5],
        attendance: {}
      };
    }

    const stops: TripStop[] = formData.stopsText
      ? formData.stopsText.split(",").map((s, idx) => ({ id: `s-${idx}-${Date.now()}`, location: s.trim() }))
      : [];

    // Calculate next sequential trip number in series (TRIP-2026-001, TRIP-2026-002, TRIP-2026-003...)
    const existingNumbers = db.trips
      .map(t => {
        const match = t.id.match(/\d+$/);
        return match ? parseInt(match[0], 10) : 0;
      })
      .filter(num => !isNaN(num));

    const maxNum = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
    const nextSeqNum = maxNum + 1;
    const newTripId = `TRIP-2026-${String(nextSeqNum).padStart(3, '0')}`;

    // Get base fare from customer's assigned rate, fallback to 0
    const baseFare = customer.assignedRateEngage || 0;
    const totalFare = baseFare; // Total fare on trip dispatch equals base fare
    const advancePaid = Number(formData.advancePaid) || 0;
    const paymentStatus: "Pending" | "Partial" | "Paid" = advancePaid >= totalFare && totalFare > 0
      ? "Paid"
      : (advancePaid > 0 ? "Partial" : "Pending");

    const formattedVehicleModel = vehicle.brand.toLowerCase() === vehicle.model.toLowerCase()
      ? vehicle.brand
      : (vehicle.model.toLowerCase().includes(vehicle.brand.toLowerCase()) ? vehicle.model : `${vehicle.brand} ${vehicle.model}`);

    const newTrip: Trip = {
      id: newTripId,
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      vehicleId: vehicle.id,
      vehicleNumber: vehicle.vehicleNumber,
      vehicleModel: formattedVehicleModel,
      driverName: driver.name,
      driverPhone: formData.driverPhone || driver.phone,
      pickup: formData.pickup,
      drop: formData.drop,
      stops,
      startDate: formData.startDate || new Date().toISOString().split('T')[0],
      endDate: formData.endDate || new Date().toISOString().split('T')[0],
      pickupTime: formData.pickupTime || undefined,
      closingTime: formData.closingTime || undefined,
      passengers: Number(formData.passengers),
      tourPackage: formData.tourPackage,
      hotel: formData.hotel,
      guideName: formData.guideName,
      status: TripStatus.UPCOMING,
      timeline: [
        {
          id: `ev-${Date.now()}`,
          status: "Upcoming",
          message: `Trip created and dispatched. Vehicle (${formattedVehicleModel}) and Driver (${driver.name}) allocated.${advancePaid > 0 ? ` Advance payment of ₹${advancePaid.toLocaleString("en-IN")} received.` : ""}`,
          timestamp: new Date().toISOString()
        }
      ],
      notes: formData.notes,
      baseFare,
      gstAmount: 0,
      totalFare,
      paymentStatus,
      advancePaid
    };

    // Auto update Vehicle state to BUSY (without driver ID reference)
    const updatedVehicles = db.vehicles.map(v => 
      v.id === vehicle.id ? { ...v, isAvailable: false, currentTripId: newTripId } : v
    );

    // Don't update driver state since we're not tracking driver IDs
    const updatedDrivers = db.drivers;

    // Note: Invoice generation is now manual - user must create invoices from Invoices & GST section

    const newNotification = {
      id: `n-${Date.now()}`,
      title: "Trip Dispatched",
      message: `Trip ${newTripId} successfully assigned to ${driver.name} with vehicle ${formattedVehicleModel}.${advancePaid > 0 ? ` Advance: ₹${advancePaid}` : ""}`,
      type: "success" as const,
      timestamp: new Date().toISOString(),
      read: false
    };

    onUpdateDb({
      ...db,
      trips: [newTrip, ...db.trips],
      vehicles: updatedVehicles,
      drivers: updatedDrivers,
      notifications: [newNotification, ...db.notifications]
    });

    // Reset Form
    setFormData({
      customerId: db.customers[0]?.id || "",
      vehicleId: "",
      driverId: "",
      driverName: "",
      driverPhone: "",
      pickup: "",
      drop: "",
      stopsText: "",
      startDate: "",
      endDate: "",
      pickupTime: "",
      closingTime: "",
      passengers: 4,
      tourPackage: "",
      hotel: "",
      guideName: "",
      notes: "",
      advancePaid: ""
    });
    setDispatchStep(1);
    setSelectedTripId(newTripId);
    setShowDispatchForm(false);
    setLastFetchedCustomerId("");
    if (onAddTripFormClosed) onAddTripFormClosed();
  };

  // Add New Payment Entry (Don't update existing)
  const handleSaveQuickAdvance = (trip: Trip) => {
    const rawVal = quickAdvanceInput[trip.id];
    if (!rawVal || rawVal.trim() === "") {
      showToast("Please enter a payment amount", "warning");
      return;
    }
    
    const newPaymentAmount = Number(rawVal) || 0;
    if (newPaymentAmount <= 0) {
      showToast("Payment amount must be greater than 0", "warning");
      return;
    }

    const inv = db.invoices.find(i => i.tripId === trip.id || i.tripNumber === trip.id);
    const existingPayments = db.payments.filter(p => 
      p.tripNumber === trip.id || 
      (inv && p.invoiceId === inv.id)
    );

    let finalPayments = [...db.payments];
    const baseAdvance = trip.advancePaid || 0;
    if (existingPayments.length === 0 && baseAdvance > 0) {
      const initialPayment = {
        id: `PAY-ADV-INIT-${trip.id}`,
        invoiceId: inv?.id || null,
        tripNumber: trip.id,
        customerName: trip.customerName,
        amount: baseAdvance,
        paymentMethod: "UPI" as const,
        transactionId: `TXN-INIT-${Date.now().toString().slice(-4)}`,
        date: trip.startDate || new Date().toISOString().split('T')[0],
        notes: `Initial advance payment recorded for trip ${trip.id}.`
      };
      finalPayments = [initialPayment, ...finalPayments];
    }

    // Now create the new payment entry
    const targetInvoice = db.invoices.find(inv => inv.tripId === trip.id || inv.tripNumber === trip.id);
    const invId = targetInvoice?.id || null;
    
    const newPayment = {
      id: `PAY-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      invoiceId: invId,
      tripNumber: trip.id,
      customerName: trip.customerName,
      amount: newPaymentAmount,
      paymentMethod: "UPI" as const,
      transactionId: `TXN-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString().split('T')[0],
      notes: `Payment entry for trip ${trip.id}.`
    };
    
    finalPayments = [newPayment, ...finalPayments];

    // Total advance is the exact sum of all payment records for this trip
    const allTripPayments = finalPayments.filter(p => 
      p.tripNumber === trip.id || 
      (trip.customerName && p.customerName.toLowerCase().trim() === trip.customerName.toLowerCase().trim()) ||
      (trip.customerId && (p.tripNumber === `CUST-${trip.customerId}` || p.tripNumber === `TRIP-${trip.customerId}`))
    );
    const totalAdvance = allTripPayments.reduce((sum, p) => sum + p.amount, 0);

    const newEv = {
      id: `ev-adv-${Date.now()}`,
      status: trip.status,
      message: `New payment of ₹${newPaymentAmount.toLocaleString("en-IN")} received. Total collected: ₹${totalAdvance.toLocaleString("en-IN")}.`,
      timestamp: new Date().toISOString()
    };

    const updatedTrips = db.trips.map(t => {
      if (t.id === trip.id) {
        return {
          ...t,
          advancePaid: totalAdvance,
          timeline: [...t.timeline, newEv]
        };
      }
      return t;
    });

    const updatedInvoices = db.invoices.map(inv => {
      if (inv.tripId === trip.id || inv.tripNumber === trip.id) {
        const invBalance = Math.max(0, inv.totalAmount - totalAdvance);
        const invStatus: "Pending" | "Partial" | "Paid" = totalAdvance >= inv.totalAmount && inv.totalAmount > 0
          ? "Paid"
          : (totalAdvance > 0 ? "Partial" : "Pending");
        return {
          ...inv,
          advanceAmount: totalAdvance,
          balanceDue: invBalance,
          paymentStatus: invStatus
        };
      }
      return inv;
    });

    onUpdateDb({
      ...db,
      trips: updatedTrips,
      invoices: updatedInvoices,
      payments: finalPayments
    });

    setQuickAdvanceInput({ ...quickAdvanceInput, [trip.id]: "" });
    showToast(`Payment of ₹${newPaymentAmount.toLocaleString("en-IN")} recorded for ${trip.customerName}!`, "success");
  };

  const handleSavePaymentModal = () => {
    if (!selectedTrip) return;
    const val = Number(paymentInputVal);
    if (isNaN(val) || val < 0) {
      showToast("Please enter a valid payment amount", "warning");
      return;
    }

    const targetInvoice = db.invoices.find(inv => inv.tripId === selectedTrip.id || inv.tripNumber === selectedTrip.id);
    const existingPayments = db.payments.filter(p => 
      p.tripNumber === selectedTrip.id || 
      (targetInvoice && p.invoiceId === targetInvoice.id)
    );

    let newTotalAdvance = 0;
    let finalPayments = [...db.payments];

    if (paymentMode === "add") {
      const baseAdvance = selectedTrip.advancePaid || 0;

      if (existingPayments.length === 0 && baseAdvance > 0) {
        const initialPayment = {
          id: `PAY-ADV-INIT-${selectedTrip.id}`,
          invoiceId: targetInvoice?.id || null,
          tripNumber: selectedTrip.id,
          customerName: selectedTrip.customerName,
          amount: baseAdvance,
          paymentMethod: "UPI" as const,
          transactionId: `TXN-INIT-${Date.now().toString().slice(-4)}`,
          date: selectedTrip.startDate || new Date().toISOString().split('T')[0],
          notes: `Initial advance payment recorded for trip ${selectedTrip.id}.`
        };
        finalPayments = [initialPayment, ...finalPayments];
      }

      const newPayment = {
        id: `PAY-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        invoiceId: targetInvoice?.id || null,
        tripNumber: selectedTrip.id,
        customerName: selectedTrip.customerName,
        amount: val,
        paymentMethod: "UPI" as const,
        transactionId: `TXN-${Date.now().toString().slice(-6)}`,
        date: new Date().toISOString().split('T')[0],
        notes: `Payment recorded for trip ${selectedTrip.id}.`
      };
      finalPayments = [newPayment, ...finalPayments];

      const allTripPayments = finalPayments.filter(p => 
        p.tripNumber === selectedTrip.id || 
        (targetInvoice && p.invoiceId === targetInvoice.id)
      );
      newTotalAdvance = allTripPayments.reduce((sum, p) => sum + p.amount, 0);
    } else {
      newTotalAdvance = val;
      if (existingPayments.length === 0 && val > 0) {
        const newPayment = {
          id: `PAY-ADV-SET-${selectedTrip.id}`,
          invoiceId: targetInvoice?.id || null,
          tripNumber: selectedTrip.id,
          customerName: selectedTrip.customerName,
          amount: val,
          paymentMethod: "UPI" as const,
          transactionId: `TXN-SET-${Date.now().toString().slice(-4)}`,
          date: selectedTrip.startDate || new Date().toISOString().split('T')[0],
          notes: `Advance amount updated for trip ${selectedTrip.id}.`
        };
        finalPayments = [newPayment, ...finalPayments];
      }
    }

    const updatedTrips = db.trips.map(t => {
      if (t.id === selectedTrip.id) {
        return { ...t, advancePaid: newTotalAdvance };
      }
      return t;
    });

    const updatedInvoices = db.invoices.map(inv => {
      if (inv.tripId === selectedTrip.id || inv.tripNumber === selectedTrip.id) {
        const invBalance = Math.max(0, inv.totalAmount - newTotalAdvance);
        const invStatus: "Pending" | "Partial" | "Paid" = newTotalAdvance >= inv.totalAmount && inv.totalAmount > 0
          ? "Paid"
          : (newTotalAdvance > 0 ? "Partial" : "Pending");
        return {
          ...inv,
          advanceAmount: newTotalAdvance,
          balanceDue: invBalance,
          paymentStatus: invStatus
        };
      }
      return inv;
    });

    onUpdateDb({
      ...db,
      trips: updatedTrips,
      invoices: updatedInvoices,
      payments: finalPayments
    });

    setShowPaymentModal(false);
    setPaymentInputVal("");
    showToast(`Advance payment updated to ₹${newTotalAdvance.toLocaleString("en-IN")} for ${selectedTrip.customerName}!`, "success");
  };

  // Handle live status changes (Started, Completed, etc.)
  const handleLiveStatusChange = (status: TripStatus) => {
    if (!selectedTrip) return;

    if (status === TripStatus.COMPLETED) {
      const customer = db.customers.find(c => c.id === selectedTrip.customerId || (selectedTrip.customerName && c.name.toLowerCase().trim() === selectedTrip.customerName.toLowerCase().trim()));
      const initialKm = selectedTrip.totalKm || 250;
      const initialBata = selectedTrip.totalBata || 1;
      const initialToll = selectedTrip.tollCharges || 0;
      const perKmRate = customer?.perKmRate || 12;
      const driverBataRate = customer?.driverBata || 500;
      const initialEngage = customer?.assignedRateEngage !== undefined && customer?.assignedRateEngage !== null ? customer.assignedRateEngage : (selectedTrip.baseFare || 0);

      const subtotal = initialEngage + (initialKm * perKmRate) + (initialBata * driverBataRate) + initialToll;
      const totalFare = subtotal;

      const tripPayments = db.payments.filter(p => p.tripNumber === selectedTrip.id);
      const totalAdvancePaid = tripPayments.reduce((sum, p) => sum + p.amount, 0);
      const outstanding = Math.max(0, totalFare - totalAdvancePaid);

      setCompletionData({
        totalKm: initialKm,
        totalBata: initialBata,
        toll: initialToll,
        engageAmount: initialEngage,
        amountTook: outstanding,
        paymentMethod: "UPI"
      });
      setShowCompletionModal(true);
      return;
    }

    // Transition log
    const newEv: TripTimelineEvent = {
      id: `ev-${Date.now()}`,
      status,
      message: `Trip marked as ${status.toUpperCase()} by Operations Desk.`,
      timestamp: new Date().toISOString()
    };

    // Update Trip
    const updatedTrips = db.trips.map(t => {
      if (t.id === selectedTrip.id) {
        return {
          ...t,
          status,
          timeline: [...t.timeline, newEv]
        };
      }
      return t;
    });

    // If marked CANCELLED, release Vehicle and Driver
    let updatedVehicles = [...db.vehicles];
    let updatedDrivers = [...db.drivers];

    if (status === TripStatus.CANCELLED) {
      updatedVehicles = db.vehicles.map(v => 
        v.id === selectedTrip.vehicleId ? { ...v, isAvailable: true, currentTripId: undefined } : v
      );
      updatedDrivers = db.drivers.map(d => 
        d.id === selectedTrip.driverId ? { ...d, isAvailable: true, assignedTripId: undefined } : d
      );
    }

    const newNotification = {
      id: `n-${Date.now()}`,
      title: `Trip Status Updated`,
      message: `Trip ${selectedTrip.id} is now ${status}.`,
      type: "info" as const,
      timestamp: new Date().toISOString(),
      read: false
    };

    onUpdateDb({
      ...db,
      trips: updatedTrips,
      vehicles: updatedVehicles,
      drivers: updatedDrivers,
      notifications: [newNotification, ...db.notifications]
    });

    if (status === TripStatus.STARTED || status === TripStatus.RUNNING) {
      setTripsTab("running");
    } else {
      setTripsTab("all");
    }
  };

  const handleCompleteTripSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrip) return;

    const customer = db.customers.find(c => c.id === selectedTrip.customerId || (selectedTrip.customerName && c.name.toLowerCase().trim() === selectedTrip.customerName.toLowerCase().trim()));
    const perKmRate = customer?.perKmRate || 12;
    const driverBataRate = customer?.driverBata || 500;

    const kmCost = completionData.totalKm * perKmRate;
    const bataCost = completionData.totalBata * driverBataRate;
    const tollCost = completionData.toll;
    const engageAmount = customer?.assignedRateEngage || selectedTrip.baseFare || 0; // Base/Engage amount
    
    // Subtotal = Engage Amount + KM Cost + Bata Cost + Toll Cost
    const subtotal = engageAmount + kmCost + bataCost + tollCost;
    const totalFare = subtotal; // Trip total cost is without GST

    // Calculate total advance from actual payment entries
    const tripPayments = db.payments.filter(p => p.tripNumber === selectedTrip.id);
    const totalAdvancePaid = tripPayments.reduce((sum, p) => sum + p.amount, 0);
    
    // Advance paid so far + current payment took
    const newAdvancePaid = totalAdvancePaid + Number(completionData.amountTook);
    const isFullyPaid = (totalFare - newAdvancePaid) <= 0;
    const paymentStatus: "Pending" | "Partial" | "Paid" = isFullyPaid ? "Paid" : (newAdvancePaid > 0 ? "Partial" : "Pending");

    // 1. Transition Timeline Event
    const newEv: TripTimelineEvent = {
      id: `ev-${Date.now()}`,
      status: TripStatus.COMPLETED,
      message: `Trip completed. Engage: ₹${engageAmount}, Kilometers: ${completionData.totalKm} km (₹${kmCost}), Driver Bata Days: ${completionData.totalBata} (₹${bataCost}), Tolls: ₹${completionData.toll}. Complete Trip Cost: ₹${totalFare.toLocaleString("en-IN")}. Collected: ₹${Number(completionData.amountTook).toLocaleString("en-IN")}.`,
      timestamp: new Date().toISOString()
    };

    // 2. Update Trips
    const updatedTrips = db.trips.map(t => {
      if (t.id === selectedTrip.id) {
        const pKm = customer?.profitPerKm || 0;
        const pBata = customer?.profitBata || 0;
        const pEngage = customer?.profitEngage || 0;
        const calcProfit = pEngage + (completionData.totalKm * pKm) + (completionData.totalBata * pBata);

        return {
          ...t,
          status: TripStatus.COMPLETED,
          totalKm: completionData.totalKm,
          totalBata: completionData.totalBata,
          tollCharges: completionData.toll,
          // Store rates used
          perKmRate,
          driverBataRate,
          // Store calculated costs
          kmCost,
          bataCost,
          baseFare: engageAmount, // Store engage amount as base fare
          gstAmount: 0,
          totalFare,
          advancePaid: newAdvancePaid,
          paymentStatus,
          profitPerKm: pKm,
          profitBata: pBata,
          profitEngage: pEngage,
          calculatedProfit: calcProfit,
          timeline: [...t.timeline, newEv]
        };
      }
      return t;
    });

    // 3. Create Payment Record if amount was collected
    let updatedPayments = db.payments;
    if (Number(completionData.amountTook) > 0) {
      const newPayment: Payment = {
        id: `PAY-${Math.floor(100 + Math.random() * 900)}`,
        invoiceId: db.invoices.find(i => i.tripId === selectedTrip.id || i.tripNumber === selectedTrip.id)?.id || null,
        tripNumber: selectedTrip.id,
        customerName: selectedTrip.customerName,
        amount: Number(completionData.amountTook),
        paymentMethod: completionData.paymentMethod,
        transactionId: completionData.transactionId || `TXN-${Date.now().toString().slice(-6)}`,
        date: new Date().toISOString().split('T')[0],
        notes: `Payment collected during trip completion. ${completionData.notes || ""}`
      };
      updatedPayments = [newPayment, ...db.payments];
    }

    // 4. Release Vehicle & Driver
    const updatedVehicles = db.vehicles.map(v => 
      v.id === selectedTrip.vehicleId ? { ...v, isAvailable: true, currentTripId: undefined } : v
    );
    const updatedDrivers = db.drivers.map(d => 
      d.id === selectedTrip.driverId ? { ...d, isAvailable: true, assignedTripId: undefined } : d
    );

    // 5. Update Invoice if exists
    const existingInvoice = db.invoices.find(i => i.tripId === selectedTrip.id || i.tripNumber === selectedTrip.id);
    const updatedInvoices = existingInvoice ? db.invoices.map(inv => {
      if (inv.id === existingInvoice.id) {
        const newBalance = Math.max(0, totalFare - newAdvancePaid);
        return {
          ...inv,
          totalAmount: totalFare,
          advanceAmount: newAdvancePaid,
          balanceDue: newBalance,
          paymentStatus
        };
      }
      return inv;
    }) : db.invoices;

    // 6. Create Notification
    const newNotification = {
      id: `n-${Date.now()}`,
      title: `Trip Completed`,
      message: `Trip ${selectedTrip.id} is marked COMPLETED. Total Cost: ₹${totalFare.toLocaleString("en-IN")} (incl. ₹${completionData.toll} toll, ${completionData.totalKm} km). Collected: ₹${Number(completionData.amountTook).toLocaleString("en-IN")}.`,
      type: "success" as const,
      timestamp: new Date().toISOString(),
      read: false
    };

    onUpdateDb({
      ...db,
      trips: updatedTrips,
      payments: updatedPayments,
      invoices: updatedInvoices,
      vehicles: updatedVehicles,
      drivers: updatedDrivers,
      notifications: [newNotification, ...db.notifications]
    });

    setTripsTab("completed");
    setShowCompletionModal(false);
    showToast(`Trip ${selectedTrip.id} completed! Payment of ₹${Number(completionData.amountTook).toLocaleString("en-IN")} recorded.`, "success");
  };

  return (
    <div className="space-y-6" id="trips-view">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display text-slate-800">Trip Dispatch Operations</h2>
          <p className="text-sm text-slate-500">Dispatch active tours, allocate drivers, check vehicle double bookings, and track progress.</p>
        </div>
        <button
          onClick={() => setShowDispatchForm(!showDispatchForm)}
          className="flex items-center gap-1.5 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-xl shadow-sm transition"
          id="dispatch-trip-btn"
        >
          <Play className="w-4 h-4 fill-current" /> Dispatch New Trip
        </button>
      </div>

      {/* Dispatch form dropdown */}
      {showDispatchForm && (
        <div className="bg-white rounded-2xl p-6 border border-brand-100 shadow-md animate-fade-in" id="dispatch-form">
          {/* Wizard Header & Steps Indicator */}
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-4 mb-6 gap-3">
            <div>
              <h3 className="text-lg font-bold font-display text-slate-800">Strategic Dispatch Workspace</h3>
              <p className="text-xs text-slate-400">Step-by-step fleet unit allocation & client onboarding</p>
            </div>
            
            {/* Steps indicator */}
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                dispatchStep === 1 
                  ? "bg-brand-50 text-brand-600 border border-brand-100" 
                  : "bg-emerald-50 text-emerald-600 border border-emerald-100"
              }`}>
                {dispatchStep === 1 ? "●" : "✓"} 1. Select Client
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                dispatchStep === 2 
                  ? "bg-brand-50 text-brand-600 border border-brand-100" 
                  : "bg-slate-50 text-slate-400 border border-slate-100"
              }`}>
                ● 2. Allocate Crew
              </span>
            </div>
          </div>

          {dispatchStep === 1 ? (
            /* STEP 1: SELECT CUSTOMER */
            <div className="max-w-2xl mx-auto py-2 space-y-6">
              <div className="bg-slate-50 border border-slate-100/80 p-4 rounded-xl flex items-start gap-3">
                <Users className="w-5 h-5 text-brand-500 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Client Directory Retrieval</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Choose an existing customer account. The dispatch system will instantly pre-fetch their commercial rates, travel agreements, default routes, and special preferences.</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Select Customer Account *</label>
                <select
                  required
                  value={formData.customerId}
                  onChange={e => handleCustomerChange(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm bg-slate-50/50 focus:bg-white text-slate-800 focus:border-brand-500 focus:outline-none transition shadow-2xs font-semibold"
                >
                  <option value="">-- Choose Account --</option>
                  {db.customers.map(c => {
                    const custTrips = db.trips.filter(t => t.customerId === c.id);
                    const upcomingTrips = custTrips.filter(t => t.status === TripStatus.UPCOMING || t.status === TripStatus.RUNNING);
                    
                    let bookingLabel = "";
                    if (upcomingTrips.length > 0) {
                      // Show count of upcoming bookings
                      bookingLabel = ` - ${upcomingTrips.length} Upcoming`;
                    } else if (c.startDate) {
                      // Customer has booking dates but no trip yet
                      bookingLabel = ` - Booking: ${c.startDate}`;
                    } else if (custTrips.length > 0) {
                      // Has past trips
                      bookingLabel = ` - ${custTrips.length} Past Trip${custTrips.length > 1 ? 's' : ''}`;
                    } else {
                      // No bookings
                      bookingLabel = ` - No Bookings`;
                    }

                    return (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone}){bookingLabel}
                      </option>
                    );
                  })}
                </select>
              </div>

              {formData.customerId && (() => {
                const selectedCust = db.customers.find(c => c.id === formData.customerId);
                if (!selectedCust) return null;

                const custTrips = db.trips.filter(t => t.customerId === selectedCust.id);
                const upcomingTrips = custTrips.filter(t => t.status === TripStatus.UPCOMING || t.status === TripStatus.RUNNING);

                return (
                  <div className="p-5 bg-gradient-to-r from-brand-50/20 to-indigo-50/20 border border-slate-100 rounded-xl space-y-3 text-xs text-slate-600 animate-fade-in">
                    <p className="font-bold text-slate-800 text-sm flex items-center gap-1.5 border-b border-slate-100 pb-2">
                      <Users className="w-4 h-4 text-brand-500" /> Prefetched Account Profile
                    </p>
                    
                    {/* Upcoming Booking Schedule Panel */}
                    <div className="bg-emerald-50/90 border border-emerald-200/80 p-3 rounded-lg text-emerald-950 space-y-1.5">
                      <span className="text-[10px] text-emerald-800 uppercase font-bold flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-emerald-600" /> Upcoming Booking Schedule & Dates
                      </span>
                      {upcomingTrips.length > 0 ? (
                        <div className="space-y-1.5">
                          {upcomingTrips.map(t => (
                            <div key={t.id} className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold bg-white/90 p-2 rounded-md border border-emerald-100">
                              <span className="text-emerald-900 font-bold flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                                {t.startDate} {t.endDate ? `to ${t.endDate}` : ''}
                              </span>
                              <span className="text-slate-700">
                                <MapPin className="w-3 h-3 inline text-slate-400 mr-0.5" />
                                {t.pickup} ➔ {t.drop || t.tourPackage || 'Outstation'}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-emerald-100 text-emerald-800">
                                {t.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 italic">No active or upcoming bookings currently scheduled.</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-1">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Contact Email</span>
                        <p className="text-slate-700 font-medium">{selectedCust.email || "N/A"}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Default Pickup Point</span>
                        <p className="text-slate-700 font-medium">{selectedCust.pickupLocation || "Kempegowda Int. Airport"}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Default Pickup Time</span>
                        <p className="text-emerald-700 font-bold">{format12HourTime(selectedCust.pickupTime) || "08:30 AM"}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Default Destination</span>
                        <p className="text-slate-700 font-medium">{selectedCust.visitingPlaces || "Coorg, Karnataka"}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Contract Vehicle Type</span>
                        <p className="text-slate-700 font-medium flex items-center gap-1">
                          <Car className="w-3.5 h-3.5 text-slate-400" /> {selectedCust.vehicle || "Any available unit"}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Special Instructions</span>
                        <p className="text-slate-700 italic mt-0.5">{selectedCust.notes || "No special constraints registered."}</p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowDispatchForm(false);
                    setLastFetchedCustomerId("");
                    if (onAddTripFormClosed) onAddTripFormClosed();
                  }}
                  className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!formData.customerId}
                  onClick={() => setDispatchStep(2)}
                  className={`flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-bold shadow-sm transition ${
                    formData.customerId 
                      ? "bg-brand-500 hover:bg-brand-600 text-white cursor-pointer" 
                      : "bg-slate-100 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  Next: Assign Driver <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* STEP 2: ALLOCATE CREW & CONFIRM (EDITABLE DETAILS) */
            <form onSubmit={handleDispatchTrip} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Side: Auto-Fetched Details (Fully Editable & Adjustable) */}
                <div className="lg:col-span-7 bg-white border border-slate-100 rounded-xl p-5 space-y-4 shadow-xs">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
                    <ShieldCheck className="w-4 h-4 text-brand-500" /> 1. Auto-Fetched & Adjustable Trip Details
                  </h4>
                  
                  {/* Summary Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Customer Account</label>
                      <p className="font-bold text-slate-700 bg-slate-50 border border-slate-150 px-3 py-2 rounded-lg mt-1 select-none">
                        {db.customers.find(c => c.id === formData.customerId)?.name || "N/A"}
                      </p>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Assign Fleet Unit *</label>
                      <select
                        required
                        value={formData.vehicleId}
                        onChange={e => setFormData({ ...formData, vehicleId: e.target.value })}
                        className="w-full px-3 py-2 mt-1 border border-slate-200 rounded-lg text-xs font-semibold bg-white text-slate-800 focus:outline-none focus:border-brand-500 transition"
                      >
                        <option value="">-- Choose Fleet Car --</option>
                        {db.vehicles.map(v => (
                          <option key={v.id} value={v.id}>
                            {v.model} ({v.seats - 1}+1)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pickup Point *</label>
                      <input
                        type="text"
                        required
                        placeholder="Type pickup location..."
                        value={formData.pickup}
                        onChange={e => setFormData({ ...formData, pickup: e.target.value })}
                        className="w-full px-3 py-2 mt-1 border border-slate-200 rounded-lg text-xs font-semibold bg-white text-slate-800 focus:outline-none focus:border-brand-500 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Final Destination *</label>
                      <input
                        type="text"
                        required
                        placeholder="Type destination..."
                        value={formData.drop}
                        onChange={e => setFormData({ ...formData, drop: e.target.value })}
                        className="w-full px-3 py-2 mt-1 border border-slate-200 rounded-lg text-xs font-semibold bg-white text-slate-800 focus:outline-none focus:border-brand-500 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-emerald-700 font-bold uppercase tracking-wider">Advance Paid by Customer (INR)</label>
                      <div className="relative mt-1">
                        <span className="absolute left-3 top-2 text-xs font-bold text-emerald-600">₹</span>
                        <input
                          type="number"
                          placeholder="e.g. 1000"
                          value={formData.advancePaid}
                          onChange={e => setFormData({ ...formData, advancePaid: e.target.value })}
                          className="w-full pl-7 pr-3 py-2 border border-emerald-200 rounded-lg text-xs font-bold bg-emerald-50/40 text-emerald-800 focus:outline-none focus:border-emerald-500 transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Intermediate Waypoints</label>
                      <input
                        type="text"
                        placeholder="Comma separated stops (Optional)"
                        value={formData.stopsText}
                        onChange={e => setFormData({ ...formData, stopsText: e.target.value })}
                        className="w-full px-3 py-2 mt-1 border border-slate-200 rounded-lg text-xs font-semibold bg-white text-slate-800 focus:outline-none focus:border-brand-500 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Start Date</label>
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                        className="w-full px-3 py-2 mt-1 border border-slate-200 rounded-lg text-xs font-semibold bg-white text-slate-800 focus:outline-none focus:border-brand-500 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pickup Time</label>
                      <input
                        type="time"
                        value={formData.pickupTime}
                        onChange={e => setFormData({ ...formData, pickupTime: e.target.value })}
                        className="w-full px-3 py-2 mt-1 border border-slate-200 rounded-lg text-xs font-semibold bg-white text-slate-800 focus:outline-none focus:border-brand-500 transition font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">End Date</label>
                      <input
                        type="date"
                        value={formData.endDate}
                        onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                        className="w-full px-3 py-2 mt-1 border border-slate-200 rounded-lg text-xs font-semibold bg-white text-slate-800 focus:outline-none focus:border-brand-500 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Closing / Return Time</label>
                      <input
                        type="time"
                        value={formData.closingTime}
                        onChange={e => setFormData({ ...formData, closingTime: e.target.value })}
                        className="w-full px-3 py-2 mt-1 border border-slate-200 rounded-lg text-xs font-semibold bg-white text-slate-800 focus:outline-none focus:border-brand-500 transition font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Passengers</label>
                      <input
                        type="number"
                        placeholder="Count"
                        value={formData.passengers || ""}
                        onChange={e => setFormData({ ...formData, passengers: Number(e.target.value) })}
                        className="w-full px-3 py-2 mt-1 border border-slate-200 rounded-lg text-xs font-semibold bg-white text-slate-800 focus:outline-none focus:border-brand-500 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tour / Campaign Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Coorg Monsoon Escape"
                        value={formData.tourPackage}
                        onChange={e => setFormData({ ...formData, tourPackage: e.target.value })}
                        className="w-full px-3 py-2 mt-1 border border-slate-200 rounded-lg text-xs font-semibold bg-white text-slate-800 focus:outline-none focus:border-brand-500 transition"
                      />
                    </div>

                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Operational Directives / Safety Briefing</label>
                      <textarea
                        placeholder="Add special guest instructions, custom routes, safety measures..."
                        value={formData.notes}
                        rows={2}
                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                        className="w-full px-3 py-2 mt-1 border border-slate-200 rounded-lg text-xs font-semibold bg-white text-slate-800 focus:outline-none focus:border-brand-500 transition"
                      />
                    </div>
                  </div>
                </div>

                {/* Right Side: Crew Allocation - The active input fields */}
                <div className="lg:col-span-5 border border-brand-100 rounded-xl p-5 space-y-4 bg-brand-50/10">
                  <h4 className="text-xs font-bold text-brand-600 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-brand-100/50">
                    <Users className="w-4 h-4" /> 2. Manual Crew Allocation (Action Required)
                  </h4>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Driver Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="Type driver's name"
                        value={formData.driverName}
                        onChange={e => {
                          const typedName = e.target.value;
                          const matchingDriver = db.drivers.find(
                            d => d.name.toLowerCase() === typedName.trim().toLowerCase()
                          );
                          setFormData({
                            ...formData,
                            driverName: typedName,
                            driverPhone: matchingDriver ? matchingDriver.phone : formData.driverPhone,
                            driverId: matchingDriver ? matchingDriver.id : ""
                          });
                        }}
                        className="w-full px-3.5 py-2.5 border border-brand-200 focus:border-brand-500 rounded-lg text-sm bg-white font-semibold text-slate-800 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">Driver Mobile Number / Driver Number *</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">+91</span>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 9876543210"
                          value={formData.driverPhone}
                          onChange={e => setFormData({ ...formData, driverPhone: e.target.value })}
                          className="w-full pl-11 pr-3 py-2 border border-brand-200 focus:border-brand-500 rounded-lg text-sm font-semibold text-slate-800 focus:outline-none bg-white"
                        />
                      </div>
                    </div>

                    {(() => {
                      const driver = db.drivers.find(
                        d => d.id === formData.driverId || d.name.toLowerCase() === formData.driverName.trim().toLowerCase()
                      );
                      if (!driver) return null;
                      const avgRating = driver.ratings && driver.ratings.length > 0
                        ? (driver.ratings.reduce((a, b) => a + b, 0) / driver.ratings.length).toFixed(1)
                        : "5.0";
                      return (
                        <div className="p-3.5 bg-white border border-slate-100 rounded-lg space-y-1.5 animate-fade-in text-[11px] text-slate-600">
                          <p className="font-bold text-slate-700 flex items-center gap-1.5">
                            <span className="text-emerald-600 font-bold">✓</span> Registered Driver Profile Found
                          </p>
                          <p>• <span className="font-semibold text-slate-500">License:</span> {driver.licenseNumber}</p>
                          <p>• <span className="font-semibold text-slate-500">Aadhaar Status:</span> Verified ✓</p>
                          <p>• <span className="font-semibold text-slate-500">Rating:</span> ⭐ {avgRating}/5</p>
                        </div>
                      );
                    })()}
                  </div>
                </div>

              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDispatchStep(1)}
                  className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition"
                >
                  <ChevronLeft className="w-4 h-4" /> Change Customer
                </button>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDispatchForm(false);
                      if (onAddTripFormClosed) onAddTripFormClosed();
                    }}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-6 py-2 bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs rounded-xl shadow-sm transition"
                    id="dispatch-submit-btn"
                  >
                    Verify & Dispatch Fleet Unit <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Split Operations console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Dispatches List (Span 5) */}
        <div className={`bg-white rounded-2xl border border-slate-100 shadow-xs lg:col-span-5 h-[calc(100vh-140px)] lg:h-[650px] min-h-[400px] flex-col overflow-hidden ${mobileShowDetails ? "hidden lg:flex" : "flex"}`} id="trips-list-panel">
          {/* List Search & Filter Header */}
          <div className="p-4 border-b border-slate-100 space-y-3 shrink-0 bg-slate-50/50">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search customer, trip ID, route..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-brand-500 font-medium shadow-3xs"
              />
            </div>

            {/* Date Range Filter */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-brand-500" /> Date Range Filter
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] font-semibold text-slate-400 uppercase mb-0.5">From Date</label>
                  <input
                    type="date"
                    value={startDateFilter}
                    onChange={e => setStartDateFilter(e.target.value)}
                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-mono text-slate-700 focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-semibold text-slate-400 uppercase mb-0.5">To Date</label>
                  <input
                    type="date"
                    value={endDateFilter}
                    onChange={e => setEndDateFilter(e.target.value)}
                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-mono text-slate-700 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex bg-slate-100/80 p-1 rounded-xl gap-1 text-xs">
              <button
                onClick={() => setTripsTab("running")}
                className={`flex-1 py-1.5 rounded-lg font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer ${
                  tripsTab === "running" ? "bg-white text-slate-800 shadow-2xs" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-brand-500" />
                <span>Running</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-600 font-mono font-bold">
                  {filteredTrips.filter(t => t.status === TripStatus.STARTED || t.status === TripStatus.RUNNING).length}
                </span>
              </button>
              <button
                onClick={() => setTripsTab("completed")}
                className={`flex-1 py-1.5 rounded-lg font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer ${
                  tripsTab === "completed" ? "bg-white text-slate-800 shadow-2xs" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Completed</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-600 font-mono font-bold">
                  {filteredTrips.filter(t => t.status === TripStatus.COMPLETED).length}
                </span>
              </button>
              <button
                onClick={() => setTripsTab("all")}
                className={`flex-1 py-1.5 rounded-lg font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer ${
                  tripsTab === "all" ? "bg-white text-slate-800 shadow-2xs" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <span>All</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-600 font-mono font-bold">
                  {filteredTrips.length}
                </span>
              </button>
            </div>
          </div>

          {/* Trips list */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {(() => {
              const sortedTrips = [...filteredTrips].sort((a, b) => {
                const numA = parseInt(a.id.replace(/\D/g, "") || "0", 10);
                const numB = parseInt(b.id.replace(/\D/g, "") || "0", 10);
                return numB - numA; // Series order (newest trip number first)
              });

              const displayedTrips = sortedTrips.filter(t => {
                if (tripsTab === "running") {
                  return t.status === TripStatus.STARTED || t.status === TripStatus.RUNNING;
                }
                if (tripsTab === "completed") {
                  return t.status === TripStatus.COMPLETED;
                }
                return true;
              });

              if (displayedTrips.length === 0) {
                return (
                  <div className="text-center py-12 text-slate-400 text-sm">
                    No {tripsTab} trips dispatched under these parameters.
                  </div>
                );
              }

              return displayedTrips.map(trip => {
                const isSelected = trip.id === selectedTripId;
                return (
                  <div
                    key={trip.id}
                    onClick={() => {
                      setSelectedTripId(trip.id);
                      setMobileShowDetails(true);
                    }}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "border-brand-500 bg-brand-50/30 shadow-2xs"
                        : "border-slate-50 hover:border-slate-100 hover:bg-slate-50/50"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                        {trip.id}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        trip.status === TripStatus.UPCOMING ? "bg-amber-50 text-amber-600 border border-amber-100" :
                        trip.status === TripStatus.STARTED ? "bg-blue-50 text-blue-600 border border-blue-100" :
                        trip.status === TripStatus.RUNNING ? "bg-indigo-50 text-indigo-600 border border-indigo-100" :
                        trip.status === TripStatus.COMPLETED ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                        "bg-slate-100 text-slate-500"
                      }`}>
                        {trip.status}
                      </span>
                    </div>

                    <h4 className="font-semibold text-slate-800 text-sm mt-2">{trip.customerName}</h4>
                    
                    <p className="text-xs text-slate-500 mt-1 font-medium flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                      {trip.pickup} ⇆ {trip.drop}
                    </p>

                    <div className="flex justify-between items-center mt-4 text-[10px] text-slate-400 border-t border-slate-100/50 pt-2 font-mono">
                      <span>{trip.startDate} to {trip.endDate}</span>
                      <span className="font-semibold text-slate-600">{trip.vehicleModel || "Vehicle Unit"}</span>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>

        {/* Right Column: Dynamic Timeline & Dispatch Details Workspace (Span 7) */}
        <div className={`bg-white rounded-2xl border border-slate-100 shadow-xs lg:col-span-7 h-[calc(100vh-140px)] lg:h-[650px] min-h-[450px] flex-col overflow-hidden ${!mobileShowDetails ? "hidden lg:flex" : "flex"}`} id="trip-details-panel">
          {/* Mobile Back Header */}
          <div className="lg:hidden p-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
            <button
              type="button"
              onClick={() => setMobileShowDetails(false)}
              className="flex items-center gap-2 text-xs font-bold text-slate-100 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-xl transition cursor-pointer"
              id="mobile-back-trip-list-btn"
            >
              <ArrowLeft className="w-4 h-4 text-brand-400 shrink-0" />
              <span>Back to Dispatches List</span>
            </button>
            {selectedTrip && (
              <span className="text-[10px] font-mono font-bold text-slate-300 bg-slate-800 px-2 py-1 rounded">
                {selectedTrip.id}
              </span>
            )}
          </div>
          {selectedTrip ? (
            <div className="flex-1 flex flex-col h-full min-h-0 overflow-y-auto pb-24">
              {/* Header Details */}
              <div className="p-4 sm:p-6 border-b border-slate-100 bg-slate-50/50 shrink-0 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">
                      Dispatch File: {selectedTrip.id}
                    </span>
                    <div className="flex items-center gap-2.5 flex-wrap mt-1.5">
                      <h3 className="text-xl font-bold font-display text-slate-800">
                        {selectedTrip.customerName}
                      </h3>
                      {(() => {
                        const cust = db.customers.find(c => c.id === selectedTrip.customerId || (selectedTrip.customerName && c.name.toLowerCase().trim() === selectedTrip.customerName.toLowerCase().trim()));
                        const phone = selectedTrip.customerPhone || cust?.phone;
                        return phone ? (
                          <a
                            href={`tel:${phone}`}
                            className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition cursor-pointer"
                            title={`Click to call customer ${selectedTrip.customerName}`}
                          >
                            <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Call {phone}</span>
                          </a>
                        ) : null;
                      })()}
                    </div>
                  </div>

                  {/* Active Status controls */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-500 uppercase">Stage:</span>
                      <select
                        value={selectedTrip.status}
                        onChange={e => handleLiveStatusChange(e.target.value as TripStatus)}
                        className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-brand-500"
                      >
                        <option value={TripStatus.UPCOMING}>Upcoming</option>
                        <option value={TripStatus.STARTED}>Started</option>
                        <option value={TripStatus.RUNNING}>Running</option>
                        <option value={TripStatus.COMPLETED}>Completed</option>
                        <option value={TripStatus.CANCELLED}>Cancelled</option>
                      </select>
                    </div>

                    <button
                      onClick={() => handleExportPDF(selectedTrip)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold text-xs rounded-lg transition-all border border-brand-100 cursor-pointer"
                      id="export-trip-pdf-btn"
                      title="Download complete Trip Sheet as PDF"
                    >
                      <FileDown className="w-3.5 h-3.5" /> Export PDF
                    </button>
                  </div>
                </div>

                {/* Resource Assignments summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-2xs flex items-center gap-3">
                    <span className="p-2 bg-brand-50 rounded-xl text-brand-500">
                      <Car className="w-4 h-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[9px] font-semibold text-slate-400 uppercase">Assigned Fleet Unit</p>
                      <p className="text-xs font-bold text-slate-700 truncate">
                        {(() => {
                          const raw = selectedTrip.vehicleModel || "Vehicle Assigned";
                          const parts = raw.trim().split(/\s+/);
                          if (parts.length === 2 && parts[0].toLowerCase() === parts[1].toLowerCase()) {
                            return parts[0];
                          }
                          return raw;
                        })()}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-2xs flex items-center gap-3">
                    <span className="p-2 bg-indigo-50 rounded-xl text-indigo-500">
                      <User className="w-4 h-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[9px] font-semibold text-slate-400 uppercase">Assigned Fleet Crew</p>
                      {selectedTrip.driverPhone ? (
                        <a
                          href={`tel:${selectedTrip.driverPhone}`}
                          className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-700 hover:text-emerald-800 hover:underline mt-0.5"
                          title={`Click to call driver ${selectedTrip.driverName || ""}`}
                        >
                          <PhoneCall className="w-3 h-3 text-emerald-600" /> Call {selectedTrip.driverPhone}
                        </a>
                      ) : (
                        <p className="text-[10px] text-slate-500 font-mono">Contact details</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Instant WhatsApp Dispatch Action Panel */}
                <div className="bg-emerald-50/50 border border-emerald-100/60 rounded-xl p-3 flex flex-col md:flex-row items-center justify-between gap-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg">
                      <MessageSquare className="w-4 h-4 fill-emerald-600" />
                    </span>
                    <div>
                      <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide">WhatsApp Dispatch Center</p>
                      <p className="text-[10px] text-emerald-600">Send digitized trip sheet and official PDF instantly</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <button
                      onClick={() => sendWhatsAppTripSheet(selectedTrip, "customer")}
                      className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-all cursor-pointer"
                      id="whatsapp-cust-tripsheet-btn"
                    >
                      <Send className="w-3.5 h-3.5" /> Customer Trip Sheet
                    </button>
                    <button
                      onClick={() => sendWhatsAppTripSheet(selectedTrip, "driver")}
                      className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-semibold text-xs rounded-lg transition-all cursor-pointer"
                      id="whatsapp-driver-duty-btn"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Driver Duty Slip
                    </button>
                  </div>
                </div>

                {/* Trip stops & logistics info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
                  <div className="bg-white/40 p-3 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-semibold uppercase text-slate-400 mb-1">Transit Route</p>
                    <p className="font-semibold text-slate-800 truncate">{selectedTrip.pickup}</p>
                    <p className="text-slate-400 mt-0.5">to {selectedTrip.drop}</p>
                  </div>
                  <div className="bg-white/40 p-3 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-semibold uppercase text-slate-400 mb-1">Stops Scheduled ({selectedTrip.stops.length})</p>
                    {selectedTrip.stops.length > 0 ? (
                      <p className="font-semibold text-slate-800 truncate">
                        {selectedTrip.stops.map(s => s.location).join(", ")}
                      </p>
                    ) : (
                      <p className="text-slate-400">Direct Non-Stop</p>
                    )}
                  </div>
                  <div className="bg-white/40 p-3 rounded-xl border border-slate-100 shadow-2xs space-y-1">
                    <div className="flex justify-between items-center gap-1">
                      <p className="text-[10px] font-semibold uppercase text-slate-400">Advance Payment</p>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentInputVal("");
                            setPaymentMode("add");
                            setShowPaymentModal(true);
                          }}
                          className="px-1.5 py-0.5 bg-brand-50 hover:bg-brand-100 text-brand-700 text-[10px] font-bold rounded border border-brand-100 transition cursor-pointer"
                          title="Click to update or add advance payment for this trip"
                        >
                          + Update / Add
                        </button>
                        {(() => {
                          const cust = db.customers.find(c => c.id === selectedTrip.customerId || (selectedTrip.customerName && c.name.toLowerCase().trim() === selectedTrip.customerName.toLowerCase().trim()));
                          const targetInv = db.invoices.find(i => i.tripId === selectedTrip.id || i.tripNumber === selectedTrip.id);
                          const tripPayments = db.payments.filter(p => 
                            p.tripNumber === selectedTrip.id || 
                            (targetInv && p.invoiceId === targetInv.id)
                          );
                          const sumPayments = tripPayments.reduce((sum, payment) => sum + payment.amount, 0);
                          const totalPaid = Math.max(selectedTrip.advancePaid || 0, sumPayments > 0 ? sumPayments : (cust?.advanceAmount || 0));
                          return (
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                              totalPaid > 0 ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                            }`}>
                              {totalPaid > 0 ? "RECEIVED" : "PENDING"}
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                    <p className="font-bold text-emerald-700 text-base mt-0.5">
                      ₹{(() => {
                        const cust = db.customers.find(c => c.id === selectedTrip.customerId || (selectedTrip.customerName && c.name.toLowerCase().trim() === selectedTrip.customerName.toLowerCase().trim()));
                        const targetInv = db.invoices.find(i => i.tripId === selectedTrip.id || i.tripNumber === selectedTrip.id);
                        const tripPayments = db.payments.filter(p => 
                          p.tripNumber === selectedTrip.id || 
                          (targetInv && p.invoiceId === targetInv.id)
                        );
                        const sumPayments = tripPayments.reduce((sum, payment) => sum + payment.amount, 0);
                        const totalPaid = Math.max(selectedTrip.advancePaid || 0, sumPayments > 0 ? sumPayments : (cust?.advanceAmount || 0));
                        return totalPaid.toLocaleString("en-IN");
                      })()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Comprehensive Trip Details & Information Sheet */}
              <div className="p-4 sm:p-6 space-y-6 bg-slate-50/20">
                {/* Section 1: Passenger Information */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold font-display uppercase tracking-wider text-slate-400">Passenger Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
                    <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-2xs flex items-center gap-3">
                      <span className="p-2 bg-slate-100 text-slate-600 rounded-lg">
                        <Users className="w-4 h-4" />
                      </span>
                      <div>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase">Passenger Group Size</p>
                        <p className="text-xs font-bold text-slate-700">{selectedTrip.passengers || 1} Passengers</p>
                      </div>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-2xs flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                          <PhoneCall className="w-4 h-4" />
                        </span>
                        <div>
                          <p className="text-[10px] font-semibold text-slate-400 uppercase">Customer Contact</p>
                          {(() => {
                            const cust = db.customers.find(c => c.id === selectedTrip.customerId || (selectedTrip.customerName && c.name.toLowerCase().trim() === selectedTrip.customerName.toLowerCase().trim()));
                            const phone = selectedTrip.customerPhone || cust?.phone;
                            return phone ? (
                              <a href={`tel:${phone}`} className="text-xs font-bold text-emerald-700 font-mono hover:underline block">
                                {phone}
                              </a>
                            ) : (
                              <p className="text-xs font-bold text-slate-800 font-mono">Not Provided</p>
                            );
                          })()}
                        </div>
                      </div>
                      {(() => {
                        const cust = db.customers.find(c => c.id === selectedTrip.customerId || (selectedTrip.customerName && c.name.toLowerCase().trim() === selectedTrip.customerName.toLowerCase().trim()));
                        const phone = selectedTrip.customerPhone || cust?.phone;
                        return phone ? (
                          <a
                            href={`tel:${phone}`}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition shadow-xs flex items-center gap-1 cursor-pointer shrink-0"
                            title="Call Customer Now"
                          >
                            <PhoneCall className="w-3 h-3" /> Call
                          </a>
                        ) : null;
                      })()}
                    </div>
                  </div>
                </div>

                {/* Section 2: Operation Schedule */}
                <div className="space-y-3 max-w-lg">
                  <h4 className="text-xs font-bold font-display uppercase tracking-wider text-slate-400">Operation Schedule</h4>
                  <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-2xs space-y-3">
                    <div className="flex items-center gap-2.5 text-xs text-slate-600">
                      <Calendar className="w-4 h-4 text-brand-500" />
                      <div>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase">Departure</p>
                        <p className="font-bold text-slate-700 flex items-center flex-wrap gap-1 mt-0.5">
                          <span>{selectedTrip.startDate ? new Date(selectedTrip.startDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' }) : "N/A"}</span>
                          {selectedTrip.pickupTime && (
                            <span className="text-brand-600 font-mono font-bold px-1.5 py-0.5 bg-brand-50 rounded border border-brand-100/50 text-[10px] flex items-center gap-0.5">
                              ⏰ {format12HourTime(selectedTrip.pickupTime)}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs text-slate-600">
                      <Calendar className="w-4 h-4 text-rose-500" />
                      <div>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase">Expected Return</p>
                        <p className="font-bold text-slate-700 flex items-center flex-wrap gap-1 mt-0.5">
                          <span>{selectedTrip.endDate ? new Date(selectedTrip.endDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' }) : "N/A"}</span>
                          {selectedTrip.closingTime && (
                            <span className="text-rose-600 font-mono font-bold px-1.5 py-0.5 bg-rose-50 rounded border border-rose-100/50 text-[10px] flex items-center gap-0.5">
                              ⏰ {format12HourTime(selectedTrip.closingTime)}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2.5: Trip Metrics & Profit Analysis (Only if Completed) */}
                {selectedTrip.status === TripStatus.COMPLETED && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold font-display uppercase tracking-wider text-emerald-600 flex items-center gap-1.5 font-semibold">
                      <Coins className="w-4 h-4 text-emerald-500" /> Profit & Reconciliation Analysis
                    </h4>
                    <div className="bg-emerald-50/30 border border-emerald-100/60 rounded-2xl p-4 grid grid-cols-2 md:grid-cols-4 gap-4 shadow-3xs">
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Distance Run</span>
                        <p className="text-sm font-mono font-bold text-slate-800">{selectedTrip.totalKm || 0} KM</p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Driver Bata Days</span>
                        <p className="text-sm font-mono font-bold text-slate-800">{selectedTrip.totalBata || 0} Days</p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Tolls & Toll Charges</span>
                        <p className="text-sm font-mono font-bold text-slate-800">₹{(selectedTrip.tollCharges || 0).toLocaleString("en-IN")}</p>
                      </div>
                      <div className="space-y-0.5 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20 flex flex-col justify-center">
                        <span className="text-[9px] text-emerald-700 font-bold uppercase tracking-wider block">Calculated Net Profit</span>
                        <p className="text-sm font-mono font-bold text-emerald-600">
                          ₹{(selectedTrip.calculatedProfit || 0).toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>

                    {/* Editable Bill Amount & Profit Section */}
                    <div className="bg-gradient-to-br from-brand-50 to-indigo-50 border border-brand-200 rounded-2xl p-5 space-y-4 shadow-sm">
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs font-bold font-display uppercase tracking-wider text-brand-700 flex items-center gap-1.5">
                          <Edit className="w-4 h-4 text-brand-600" /> Final Bill & Profit Adjustment
                        </h5>
                        {!editFinancials && (
                          <button
                            onClick={() => {
                              setEditFinancials(true);
                              setEditableTotalFare(selectedTrip.totalFare);
                              setEditableProfit(selectedTrip.calculatedProfit || 0);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-brand-50 text-brand-700 border border-brand-300 text-xs font-bold rounded-lg transition shadow-xs"
                          >
                            <Edit className="w-3.5 h-3.5" /> Edit
                          </button>
                        )}
                      </div>

                      {!editFinancials ? (
                        // Display Mode
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white/90 rounded-xl p-4 border border-brand-100 shadow-xs">
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1.5">Total Bill Amount</span>
                            <p className="text-2xl font-mono font-bold text-brand-600">
                              ₹{(selectedTrip.totalFare || 0).toLocaleString("en-IN")}
                            </p>
                            <span className="text-[9px] text-slate-400 mt-1 block">Charged to customer</span>
                          </div>
                          <div className="bg-white/90 rounded-xl p-4 border border-emerald-100 shadow-xs">
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1.5">Net Profit</span>
                            <p className="text-2xl font-mono font-bold text-emerald-600">
                              ₹{(selectedTrip.calculatedProfit || 0).toLocaleString("en-IN")}
                            </p>
                            <span className="text-[9px] text-slate-400 mt-1 block">After all expenses</span>
                          </div>
                        </div>
                      ) : (
                        // Edit Mode
                        <form onSubmit={(e) => {
                          e.preventDefault();
                          // Update the trip with new values
                          const updatedTrips = db.trips.map(t => {
                            if (t.id === selectedTrip.id) {
                              return {
                                ...t,
                                totalFare: editableTotalFare,
                                calculatedProfit: editableProfit
                              };
                            }
                            return t;
                          });

                          onUpdateDb({
                            ...db,
                            trips: updatedTrips
                          });

                          setEditFinancials(false);
                          showToast(`Financial details updated for trip ${selectedTrip.id}`, "success");
                        }} className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                <IndianRupee className="w-3.5 h-3.5 text-brand-600" />
                                Total Bill Amount
                              </label>
                              <div className="relative">
                                <span className="absolute left-3 top-2.5 text-sm font-bold text-slate-500">₹</span>
                                <input
                                  type="number"
                                  min="0"
                                  required
                                  value={editableTotalFare}
                                  onChange={e => setEditableTotalFare(Number(e.target.value))}
                                  className="w-full pl-7 pr-3 py-2.5 bg-white border-2 border-brand-300 focus:border-brand-500 rounded-lg text-sm font-bold text-slate-800 focus:outline-none shadow-sm"
                                  placeholder="Enter amount"
                                />
                              </div>
                              <span className="text-[9px] text-slate-500 block">Amount charged to customer</span>
                            </div>

                            <div className="space-y-2">
                              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                                Net Profit
                              </label>
                              <div className="relative">
                                <span className="absolute left-3 top-2.5 text-sm font-bold text-slate-500">₹</span>
                                <input
                                  type="number"
                                  required
                                  value={editableProfit}
                                  onChange={e => setEditableProfit(Number(e.target.value))}
                                  className="w-full pl-7 pr-3 py-2.5 bg-white border-2 border-emerald-300 focus:border-emerald-500 rounded-lg text-sm font-bold text-slate-800 focus:outline-none shadow-sm"
                                  placeholder="Enter profit"
                                />
                              </div>
                              <span className="text-[9px] text-slate-500 block">Profit after all expenses</span>
                            </div>
                          </div>

                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                            <p className="text-[10px] text-amber-800 leading-relaxed">
                              <strong>Note:</strong> These values will update the trip's financial records. Make sure the amounts are accurate before saving.
                            </p>
                          </div>

                          <div className="flex justify-end gap-2 pt-2">
                            <button
                              type="button"
                              onClick={() => setEditFinancials(false)}
                              className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold rounded-lg transition"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-lg transition shadow-sm"
                            >
                              Save Changes
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  </div>
                )}

                {/* Section 3: Notes & Special Instructions */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold font-display uppercase tracking-wider text-slate-400">Operations Notes & Remarks</h4>
                  <div className="bg-amber-50/30 border border-amber-100/70 p-4 rounded-xl">
                    <p className="text-xs text-slate-600 leading-relaxed italic">
                      {selectedTrip.notes || "No special instructions, billing remarks, or route preferences recorded for this dispatch file."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center text-slate-400 text-sm">
              Select a trip from the list to view its complete operational details.
            </div>
          )}
        </div>
      </div>
      
      {/* Trip Completion Reconciliation Modal */}
      {showCompletionModal && selectedTrip && (() => {
        const customer = db.customers.find(c => c.id === selectedTrip.customerId || (selectedTrip.customerName && c.name.toLowerCase().trim() === selectedTrip.customerName.toLowerCase().trim()));
        const perKmRate = customer?.perKmRate || 12;
        const driverBataRate = customer?.driverBata || 500;
        const engageAmount = Number(completionData.engageAmount || 0);

        const kmCost = completionData.totalKm * perKmRate;
        const bataCost = completionData.totalBata * driverBataRate;
        const subtotal = engageAmount + kmCost + bataCost + completionData.toll;
        const totalTripCost = subtotal;
        
        // Calculate total advance from actual payment entries
        const tripPayments = db.payments.filter(p => p.tripNumber === selectedTrip.id);
        const totalAdvancePaid = tripPayments.reduce((sum, payment) => sum + payment.amount, 0);
        const remainingOutstanding = Math.max(0, totalTripCost - totalAdvancePaid);

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="trip-completion-modal">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white shrink-0">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-brand-500/30 rounded-lg text-brand-400">
                    <CheckCircle2 className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="font-bold text-sm">Complete Trip Reconciliation</h3>
                    <p className="text-[10px] text-slate-300 font-medium font-mono">Dispatch File: {selectedTrip.id}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCompletionModal(false)}
                  className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition"
                  title="Cancel trip completion"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCompleteTripSubmit} className="flex-1 overflow-y-auto flex flex-col">
                {/* Customer Banner */}
                <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 text-xs flex justify-between items-center text-slate-600 shrink-0">
                  <div>
                    <p className="font-semibold text-slate-400 uppercase text-[9px] tracking-wider">Customer Name</p>
                    <p className="font-bold text-slate-800 text-sm">{selectedTrip.customerName}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-400 uppercase text-[9px] tracking-wider">Advance Paid</p>
                    <p className="font-mono font-bold text-emerald-600 text-sm">₹{totalAdvancePaid.toLocaleString("en-IN")}</p>
                  </div>
                </div>

                {/* Form Content */}
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Engage Amount Input */}
                    <div className="space-y-1 col-span-2 sm:col-span-1">
                      <label className="text-xs font-semibold text-slate-500">
                        Engage Amount (Base Fare)
                      </label>
                      <div className="relative rounded-lg shadow-2xs">
                        <span className="absolute left-3 top-2.5 text-[10px] font-bold text-slate-400">₹</span>
                        <input
                          type="number"
                          min="0"
                          required
                          value={completionData.engageAmount}
                          onChange={e => {
                            const val = Number(e.target.value);
                            const updatedKmCost = completionData.totalKm * perKmRate;
                            const updatedBataCost = completionData.totalBata * driverBataRate;
                            const updatedSubtotal = val + updatedKmCost + updatedBataCost + completionData.toll;
                            const updatedTotal = updatedSubtotal;
                            const updatedOutstanding = Math.max(0, updatedTotal - totalAdvancePaid);
                            setCompletionData(prev => ({
                              ...prev,
                              engageAmount: val,
                              amountTook: updatedOutstanding
                            }));
                          }}
                          className="w-full pl-6 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-brand-500 font-mono"
                          placeholder="e.g. 1000"
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">Customer Booking Engage Rate</span>
                    </div>

                    {/* Total KM */}
                    <div className="space-y-1 col-span-2 sm:col-span-1">
                      <label className="text-xs font-semibold text-slate-500">
                        Total Kilometers Run
                      </label>
                      <div className="relative rounded-lg shadow-2xs">
                        <input
                          type="number"
                          min="0"
                          required
                          value={completionData.totalKm}
                          onChange={e => {
                            const val = Number(e.target.value);
                            const updatedKmCost = val * perKmRate;
                            const updatedBataCost = completionData.totalBata * driverBataRate;
                            const updatedSubtotal = engageAmount + updatedKmCost + updatedBataCost + completionData.toll;
                            const updatedTotal = updatedSubtotal;
                            const updatedOutstanding = Math.max(0, updatedTotal - totalAdvancePaid);
                            setCompletionData(prev => ({
                              ...prev,
                              totalKm: val,
                              amountTook: updatedOutstanding
                            }));
                          }}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-brand-500"
                          placeholder="e.g. 250"
                        />
                        <span className="absolute right-3 top-2.5 text-[10px] font-bold text-slate-400 font-mono">KM</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">Contract Rate: ₹{perKmRate}/km</span>
                    </div>

                    {/* Total Driver Bata Count */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500">
                        Driver Bata (Days)
                      </label>
                      <div className="relative rounded-lg shadow-2xs">
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          required
                          value={completionData.totalBata}
                          onChange={e => {
                            const val = Number(e.target.value);
                            const updatedKmCost = completionData.totalKm * perKmRate;
                            const updatedBataCost = val * driverBataRate;
                            const updatedSubtotal = engageAmount + updatedKmCost + updatedBataCost + completionData.toll;
                            const updatedTotal = updatedSubtotal;
                            const updatedOutstanding = Math.max(0, updatedTotal - totalAdvancePaid);
                            setCompletionData(prev => ({
                              ...prev,
                              totalBata: val,
                              amountTook: updatedOutstanding
                            }));
                          }}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-brand-500"
                          placeholder="e.g. 1"
                        />
                        <span className="absolute right-3 top-2.5 text-[10px] font-bold text-slate-400 font-mono">Days</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">Contract Rate: ₹{driverBataRate}/day</span>
                    </div>

                    {/* Toll Charges */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-500">
                        Toll & Parking Charges
                      </label>
                      <div className="relative rounded-lg shadow-2xs">
                        <span className="absolute left-3 top-2.5 text-[10px] font-bold text-slate-400">₹</span>
                        <input
                          type="number"
                          min="0"
                          required
                          value={completionData.toll}
                          onChange={e => {
                            const val = Number(e.target.value);
                            const updatedKmCost = completionData.totalKm * perKmRate;
                            const updatedBataCost = completionData.totalBata * driverBataRate;
                            const updatedSubtotal = engageAmount + updatedKmCost + updatedBataCost + val;
                            const updatedTotal = updatedSubtotal;
                            const updatedOutstanding = Math.max(0, updatedTotal - totalAdvancePaid);
                            setCompletionData(prev => ({
                              ...prev,
                              toll: val,
                              amountTook: updatedOutstanding
                            }));
                          }}
                          className="w-full pl-6 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-brand-500"
                          placeholder="e.g. 350"
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">Added to total cost</span>
                    </div>

                    {/* Payment Method */}
                    <div className="space-y-1 col-span-2">
                      <label className="text-xs font-semibold text-slate-500">
                        Payment Mode Collected
                      </label>
                      <select
                        value={completionData.paymentMethod}
                        onChange={e => setCompletionData(prev => ({ ...prev, paymentMethod: e.target.value as any }))}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-brand-500"
                      >
                        <option value="UPI">UPI / PhonePe / GPay</option>
                        <option value="Cash">Cash Collected</option>
                        <option value="Bank Transfer">NEFT / IMPS</option>
                        <option value="Card">Card Swipe</option>
                      </select>
                      <span className="text-[10px] text-slate-400 font-medium">For Payments Ledger</span>
                    </div>
                  </div>

                  {/* Live Invoice Summary Card */}
                  <div className="bg-slate-50 rounded-xl border border-slate-200/60 p-4 space-y-2">
                    <div className="flex items-center gap-1.5 border-b border-slate-200/60 pb-1.5">
                      <FileText className="w-4 h-4 text-slate-600" />
                      <span className="text-xs font-bold text-slate-700">Calculated Trip Cost Details</span>
                    </div>
                    
                    <div className="space-y-1.5 text-[11px] text-slate-600">
                      {engageAmount > 0 && (
                        <div className="flex justify-between font-semibold text-brand-700 bg-brand-50/70 p-1.5 rounded-lg border border-brand-100/60">
                          <span>Engage Amount (Fixed Base Package)</span>
                          <span className="font-mono font-bold">₹{engageAmount.toLocaleString("en-IN")}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>KM Cost ({completionData.totalKm} km × ₹{perKmRate})</span>
                        <span className="font-medium text-slate-700">₹{kmCost.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Driver Bata ({completionData.totalBata} days × ₹{driverBataRate})</span>
                        <span className="font-medium text-slate-700">₹{bataCost.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Toll Plaza & Parking Charges</span>
                        <span className="font-medium text-slate-700">₹{completionData.toll.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between border-t border-dashed border-slate-200 pt-1.5">
                        <span className="font-semibold text-slate-700">Subtotal</span>
                        <span className="font-bold text-slate-800">₹{subtotal.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between border-t border-slate-200 pt-1.5 text-xs font-bold">
                        <span className="text-slate-800">Complete Trip Cost</span>
                        <span className="text-brand-600">₹{totalTripCost.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>Less Advance Received</span>
                        <span className="font-medium">- ₹{totalAdvancePaid.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between border-t border-double border-slate-200 pt-1.5 text-xs font-bold bg-amber-50/50 p-1.5 rounded">
                        <span className="text-amber-900">Remaining Balance Due</span>
                        <span className="text-amber-700">₹{remainingOutstanding.toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                  </div>

                  {/* Amount Took right now */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <span className="p-1 bg-brand-50 rounded text-brand-600">
                        <Coins className="w-3.5 h-3.5" />
                      </span>
                      Amount Took (Payment Collected Now)
                    </label>
                    <div className="relative rounded-lg shadow-xs">
                      <span className="absolute left-3 top-2 text-sm font-bold text-slate-500">₹</span>
                      <input
                        type="number"
                        min="0"
                        max={totalTripCost}
                        required
                        value={completionData.amountTook}
                        onChange={e => setCompletionData(prev => ({ ...prev, amountTook: Number(e.target.value) }))}
                        className="w-full pl-6 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-800 focus:outline-none focus:border-brand-500"
                        placeholder="e.g. 1500"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400">
                      💡 If this amount matches the remaining balance of ₹{remainingOutstanding.toLocaleString("en-IN")}, the invoice status will become <span className="text-emerald-600 font-bold">Paid</span>.
                    </p>
                  </div>
                </div>

                {/* Action Footer */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowCompletionModal(false)}
                    className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
                  >
                    Confirm Completion & Update Ledger
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* WhatsApp Dispatch Preview Modal */}
      {whatsappPreview && whatsappPreview.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="whatsapp-preview-modal">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-emerald-600 px-6 py-4 flex items-center justify-between text-white shrink-0">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-emerald-500/30 rounded-lg">
                  <MessageSquare className="w-5 h-5 fill-current text-white" />
                </span>
                <div>
                  <h3 className="font-bold text-sm">WhatsApp Dispatch Worksheet</h3>
                  <p className="text-[10px] text-emerald-100 font-medium">{db.settings.name} Dispatch Center</p>
                </div>
              </div>
              <button
                onClick={() => setWhatsappPreview(null)}
                className="p-1.5 hover:bg-emerald-500/20 text-emerald-100 hover:text-white rounded-lg transition"
                title="Close dispatch preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Recipient details */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 text-xs flex justify-between items-center text-slate-600 shrink-0">
              <div>
                <p className="font-semibold text-slate-400 uppercase text-[9px] tracking-wider">Recipient Name</p>
                <p className="font-bold text-slate-800 text-sm">{whatsappPreview.targetName}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-slate-400 uppercase text-[9px] tracking-wider">Phone number</p>
                <p className="font-mono font-semibold text-slate-700">+{whatsappPreview.phone}</p>
              </div>
            </div>

            {/* Help Prompt for Iframe Sandbox Popups */}
            <div className="px-6 py-3 bg-amber-50 border-b border-amber-100/60 text-xs text-amber-900 space-y-2 shrink-0">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <p className="leading-normal font-medium">
                  <span className="font-bold text-amber-950">Important WhatsApp File Notice:</span> WhatsApp's official web integration (via wa.me link) does <span className="underline decoration-amber-400 font-semibold">not</span> support attaching files directly through web browser links. Only text is sent via the link redirect.
                </p>
              </div>
              
              <div className="bg-white/80 rounded-lg p-2.5 border border-amber-200/60 text-[11px] space-y-1 text-slate-700">
                <p className="font-bold text-slate-800 text-[11px]">How to share the PDF on WhatsApp in 3 simple steps:</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1">
                  <div className="bg-slate-50 p-1.5 rounded border border-slate-100">
                    <span className="font-bold text-emerald-600">1. Save File 📥</span>
                    <p className="text-[10px] text-slate-500">The PDF is downloaded automatically to your device.</p>
                  </div>
                  <div className="bg-slate-50 p-1.5 rounded border border-slate-100">
                    <span className="font-bold text-emerald-600">2. Open Chat 💬</span>
                    <p className="text-[10px] text-slate-500">Click <strong>"Open WhatsApp"</strong> below to send the trip text summary.</p>
                  </div>
                  <div className="bg-slate-50 p-1.5 rounded border border-slate-100">
                    <span className="font-bold text-emerald-600">3. Attach PDF 📎</span>
                    <p className="text-[10px] text-slate-500">Tap paperclip inside WhatsApp and attach the downloaded PDF!</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Chat message area */}
            <div className="p-6 flex-1 overflow-y-auto bg-slate-100/50 space-y-4">
              {/* PDF Document Attachment Section */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <span className="p-2.5 bg-red-50 text-red-600 rounded-lg shrink-0">
                    <FileText className="w-5 h-5 animate-pulse" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">
                      TripSheet_{whatsappPreview.trip.id}_{whatsappPreview.trip.customerName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf
                    </p>
                    <p className="text-[10px] text-slate-500">Official High-Format Digitized Document</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const doc = generateTripPDF(whatsappPreview.trip);
                        const pdfBlob = doc.output('blob');
                        const filename = `TripSheet_${whatsappPreview.trip.id}_${whatsappPreview.trip.customerName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
                        const file = new File([pdfBlob], filename, { type: "application/pdf" });

                        if (navigator.canShare && navigator.canShare({ files: [file] })) {
                          await navigator.share({
                            files: [file],
                            title: `Trip Sheet - ${whatsappPreview.trip.customerName}`,
                            text: `Attached is the official Trip Sheet / Duty Slip from ${db.settings.name}.`,
                          });
                          showToast("PDF document shared successfully!", "success");
                        } else {
                          // Fallback: download
                          doc.save(filename);
                          showToast("Direct Web Share not supported on this browser. PDF downloaded so you can attach it manually!", "info");
                        }
                      } catch (err) {
                        console.error(err);
                        showToast("Failed to share PDF. Please use the Download button.", "warning");
                      }
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold shadow-xs transition cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" /> Share PDF Document
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      try {
                        const doc = generateTripPDF(whatsappPreview.trip);
                        doc.save(`TripSheet_${whatsappPreview.trip.id}_${whatsappPreview.trip.customerName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`);
                        showToast("PDF downloaded successfully!", "success");
                      } catch (err) {
                        console.error(err);
                        showToast("Could not download PDF. Please try again.", "warning");
                      }
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" /> Download PDF
                  </button>
                </div>
                <p className="text-[10px] text-emerald-700 font-medium bg-emerald-50 border border-emerald-100 rounded-lg p-2 leading-relaxed">
                  💡 <span className="font-bold">Share PDF</span> allows sending the actual PDF file directly to any WhatsApp chat, contact, or other application on your device!
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Message Content Preview</p>
                <div className="bg-[#DCF8C6] border border-[#C7EDB2] rounded-2xl p-4 text-xs font-sans text-slate-800 whitespace-pre-wrap leading-relaxed relative max-w-[95%] shadow-2xs">
                  {whatsappPreview.message}
                  {/* Visual Speech Bubble tail */}
                  <div className="absolute right-0 top-3 transform translate-x-1/2 rotate-45 w-2 h-2 bg-[#DCF8C6] border-t border-r border-[#C7EDB2]"></div>
                </div>
              </div>
            </div>

            {/* Action Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(whatsappPreview.message);
                  setCopied(true);
                  showToast("Message text copied to clipboard!", "success");
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600 animate-scale-up" />
                    Text Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-500" />
                    Copy Message Text
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(whatsappPreview.whatsappUrl);
                  setCopiedLink(true);
                  showToast("WhatsApp API direct link copied!", "success");
                  setTimeout(() => setCopiedLink(false), 2000);
                }}
                className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600 animate-scale-up" />
                    Link Copied!
                  </>
                ) : (
                  <>
                    <Link className="w-4 h-4 text-slate-500" />
                    Copy WhatsApp Link
                  </>
                )}
              </button>

              <a
                href={whatsappPreview.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
                id="modal-open-whatsapp-link"
              >
                <ExternalLink className="w-4 h-4" />
                Open WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Update / Add Payment Modal */}
      {showPaymentModal && selectedTrip && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Update Advance Payment</h3>
                <p className="text-xs text-slate-500">Trip {selectedTrip.id} • {selectedTrip.customerName}</p>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex bg-slate-100 p-1 rounded-xl gap-1 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setPaymentMode("add")}
                  className={`flex-1 py-1.5 rounded-lg transition ${paymentMode === "add" ? "bg-white text-emerald-700 shadow-2xs" : "text-slate-500"}`}
                >
                  + Add Payment Amount
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMode("set")}
                  className={`flex-1 py-1.5 rounded-lg transition ${paymentMode === "set" ? "bg-white text-emerald-700 shadow-2xs" : "text-slate-500"}`}
                >
                  Set Total Advance
                </button>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  {paymentMode === "add" ? "Payment Amount to Add (₹)" : "New Total Advance Amount (₹)"}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">₹</span>
                  <input
                    type="number"
                    placeholder={paymentMode === "add" ? "e.g. 500" : "e.g. 3500"}
                    value={paymentInputVal}
                    onChange={e => setPaymentInputVal(e.target.value)}
                    className="w-full pl-8 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:border-brand-500 focus:outline-none transition"
                    autoFocus
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2 justify-end">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePaymentModal}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
              >
                Save Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
