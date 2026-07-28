import React, { useState, useEffect, useMemo } from "react";
import { useToasts } from "./Toast";
import { exportPaymentsToCsv } from "../utils/csvExport";
import {
  ErpDatabase,
  Payment,
  Invoice,
  TripStatus
} from "../types";
import {
  Search,
  Plus,
  DollarSign,
  Calendar,
  Layers,
  ChevronRight,
  BellRing,
  Send,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  IndianRupee,
  FileSpreadsheet,
  Edit,
  X,
  User,
  Car,
  PhoneCall,
  MapPin,
  TrendingUp,
  Receipt,
  Trash2,
  FileText
} from "lucide-react";

interface PaymentsViewProps {
  db: ErpDatabase;
  onUpdateDb: (updatedDb: ErpDatabase) => void;
}

export function PaymentsView({ db, onUpdateDb }: PaymentsViewProps) {
  const { showToast } = useToasts();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  // Trip Details Modal State
  const [selectedTripForDetails, setSelectedTripForDetails] = useState<any | null>(null);
  const [showTripDetailsModal, setShowTripDetailsModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editTripData, setEditTripData] = useState({
    totalFare: 0,
    calculatedProfit: 0
  });

  // Update selectedTripForDetails when db changes (real-time updates)
  useEffect(() => {
    if (selectedTripForDetails && showTripDetailsModal) {
      const updatedTrip = db.trips.find(t => t.id === selectedTripForDetails.id);
      if (updatedTrip) {
        setSelectedTripForDetails(updatedTrip);
      }
    }
  }, [db.trips, db.payments, db.invoices, showTripDetailsModal]);

  // New Payment Form State
  const [formData, setFormData] = useState({
    invoiceId: "",
    amount: 5000,
    paymentMethod: "UPI" as any,
    transactionId: "",
    notes: ""
  });

  // Edit Receivable States
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [editTotalAmount, setEditTotalAmount] = useState<number>(0);
  const [editAdvanceAmount, setEditAdvanceAmount] = useState<number>(0);
  const [editDueDate, setEditDueDate] = useState<string>("");
  const [editReceivedDate, setEditReceivedDate] = useState<string>("");
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  // Edit Balance States (for outstanding trips)
  const [editingTripId, setEditingTripId] = useState<string | null>(null);
  const [editBalanceTotalFare, setEditBalanceTotalFare] = useState<number>(0);
  const [editBalancePaid, setEditBalancePaid] = useState<number>(0);

  // Financial metrics & stats calculations (memoized for performance and proper reactivity)
  const totalReconciled = useMemo(() => {
    return db.payments.reduce((acc, curr) => {
      if (curr.tripNumber) {
        const tripExists = db.trips.some(t => t.id === curr.tripNumber);
        if (!tripExists) return acc;
      }
      return acc + curr.amount;
    }, 0);
  }, [db.payments, db.trips]);
  
  // Calculate outstanding from trips (Payment Ledger) - Only for completed trips with unpaid balances
  const totalOutstanding = useMemo(() => {
    return db.trips.reduce((acc, trip) => {
      // Only count COMPLETED trips for outstanding receivables
      if (trip.status !== "Completed") {
        return acc;
      }
      
      // Skip if trip doesn't have a total fare or is already marked as paid
      if (!trip.totalFare || trip.totalFare === 0 || trip.paymentStatus === "Paid") {
        return acc;
      }
      
      const tripPayments = db.payments.filter(p => p.tripNumber === trip.id);
      const totalPaid = tripPayments.reduce((sum, p) => sum + p.amount, 0);
      const balance = Math.max(0, trip.totalFare - totalPaid);
      
      return acc + balance;
    }, 0);
  }, [db.trips, db.payments]);
  
  const totalLedgerProfit = useMemo(() => 
    db.trips.reduce((acc, curr) => acc + (curr.calculatedProfit || 0), 0),
    [db.trips]
  );

  const handleUpdateReceivable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvoiceId) return;

    const invoice = db.invoices.find(i => i.id === editingInvoiceId);
    if (!invoice) return;

    const balanceDue = Math.max(0, editTotalAmount - editAdvanceAmount);
    const paymentStatus: "Pending" | "Partial" | "Paid" = balanceDue <= 0 ? "Paid" : (editAdvanceAmount > 0 ? "Partial" : "Pending");

    // Recalculate subtotal and gstAmount assuming 5% GST
    const subtotal = Math.round(editTotalAmount / 1.05);
    const gstAmount = editTotalAmount - subtotal;

    // 1. Update Invoices
    const updatedInvoices = db.invoices.map(inv => {
      if (inv.id === editingInvoiceId) {
        return {
          ...inv,
          subtotal,
          gstAmount,
          totalAmount: editTotalAmount,
          advanceAmount: editAdvanceAmount,
          balanceDue,
          paymentStatus,
          dueDate: editDueDate
        };
      }
      return inv;
    });

    // 2. Update Trips
    const updatedTrips = db.trips.map(t => {
      if (t.id === invoice.tripId || t.id === invoice.tripNumber) {
        return {
          ...t,
          totalFare: editTotalAmount,
          advancePaid: editAdvanceAmount,
          paymentStatus,
          endDate: editDueDate
        };
      }
      return t;
    });

    // 3. Synchronize ledger payments
    let paymentFound = false;
    const updatedPayments = db.payments.map(p => {
      if (p.invoiceId === invoice.id || p.tripNumber === invoice.tripId || p.tripNumber === invoice.tripNumber) {
        paymentFound = true;
        return {
          ...p,
          amount: editAdvanceAmount,
          date: editReceivedDate
        };
      }
      return p;
    });

    let finalPayments = updatedPayments;
    if (!paymentFound && editAdvanceAmount > 0) {
      const newPayment = {
        id: `PAY-${Math.floor(100 + Math.random() * 900)}`,
        invoiceId: invoice.id,
        tripNumber: invoice.tripId || invoice.tripNumber || "",
        customerName: invoice.customerName,
        amount: editAdvanceAmount,
        paymentMethod: "UPI" as const,
        transactionId: `TXN-ED-${Date.now().toString().slice(-4)}`,
        date: editReceivedDate,
        notes: "Adjusted received amount and date from Outstanding Receivable panel."
      };
      finalPayments = [newPayment, ...db.payments];
    } else if (editAdvanceAmount === 0) {
      // If payment is adjusted to 0, clear it from ledger
      finalPayments = db.payments.filter(p => !(p.invoiceId === invoice.id || p.tripNumber === invoice.tripId || p.tripNumber === invoice.tripNumber));
    }

    // 4. Create Notification
    const newNotification = {
      id: `n-${Date.now()}`,
      title: `Receivable Adjusted`,
      message: `Adjusted receivable details for ${invoice.customerName} (${invoice.id}). New Total: ₹${(editTotalAmount || 0).toLocaleString("en-IN")}, Received Balance: ₹${(editAdvanceAmount || 0).toLocaleString("en-IN")} on ${editReceivedDate}.`,
      type: "success" as const,
      timestamp: new Date().toISOString(),
      read: false
    };

    onUpdateDb({
      ...db,
      invoices: updatedInvoices,
      trips: updatedTrips,
      payments: finalPayments,
      notifications: [newNotification, ...db.notifications]
    });

    setEditingInvoiceId(null);
    showToast(`Receivable details and ledger for ${invoice.id} successfully updated!`, "success");
  };

  // Filter payments
  const filteredPayments = db.payments.filter(pay => 
    pay.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pay.tripNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (pay.transactionId && pay.transactionId.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Filter all completed trips for the Trip Financial Ledger table
  const completedTrips = useMemo(() => {
    return db.trips
      .filter(trip => trip.status === TripStatus.COMPLETED)
      .map(trip => {
        const tripPayments = db.payments.filter(p => p.tripNumber === trip.id);
        const totalPaid = tripPayments.reduce((sum, p) => sum + p.amount, 0);
        const balance = Math.max(0, (trip.totalFare || 0) - totalPaid);
        return { ...trip, balanceDue: balance, totalPaid };
      });
  }, [db.trips, db.payments]);

  // Filter trips that have outstanding balance for Collectable Receivables & Record Payment Dropdown
  const outstandingTrips = useMemo(() => {
    return completedTrips.filter(trip => trip.balanceDue > 0 && trip.paymentStatus !== "Paid");
  }, [completedTrips]);

  // Handle Delete Payment Entry
  const handleDeletePayment = (paymentId: string) => {
    const paymentToDelete = db.payments.find(p => p.id === paymentId);
    if (!paymentToDelete) return;

    if (!window.confirm(`Are you sure you want to delete payment receipt ${paymentId} (₹${paymentToDelete.amount.toLocaleString("en-IN")})?`)) {
      return;
    }

    // 1. Filter out payment
    const updatedPayments = db.payments.filter(p => p.id !== paymentId);

    // 2. Update trip advance & paymentStatus
    const updatedTrips = db.trips.map(trip => {
      if (trip.id === paymentToDelete.tripNumber) {
        const remainingPayments = updatedPayments.filter(p => p.tripNumber === trip.id);
        const newAdvancePaid = remainingPayments.reduce((sum, p) => sum + p.amount, 0);
        const isFullyPaid = (trip.totalFare - newAdvancePaid) <= 0 && trip.totalFare > 0;
        const paymentStatus: "Pending" | "Partial" | "Paid" = isFullyPaid ? "Paid" : (newAdvancePaid > 0 ? "Partial" : "Pending");

        return {
          ...trip,
          advancePaid: newAdvancePaid,
          paymentStatus
        };
      }
      return trip;
    });

    // 3. Update invoice if linked
    const updatedInvoices = db.invoices.map(inv => {
      if (inv.id === paymentToDelete.invoiceId || inv.tripId === paymentToDelete.tripNumber || inv.tripNumber === paymentToDelete.tripNumber) {
        const remainingPayments = updatedPayments.filter(p => p.invoiceId === inv.id || p.tripNumber === inv.tripId || p.tripNumber === inv.tripNumber);
        const newPaid = remainingPayments.reduce((sum, p) => sum + p.amount, 0);
        const newBalance = Math.max(0, inv.totalAmount - newPaid);
        const status = newBalance <= 0 && inv.totalAmount > 0 ? ("Paid" as const) : (newPaid > 0 ? ("Partial" as const) : ("Pending" as const));

        return {
          ...inv,
          amountPaid: newPaid,
          balanceDue: newBalance,
          status
        };
      }
      return inv;
    });

    // 4. Create Notification
    const newNotification = {
      id: `n-${Date.now()}`,
      title: `Payment Receipt Deleted`,
      message: `Deleted payment receipt ${paymentId} (₹${paymentToDelete.amount.toLocaleString("en-IN")}) for ${paymentToDelete.customerName}.`,
      type: "info" as const,
      timestamp: new Date().toISOString(),
      read: false
    };

    onUpdateDb({
      ...db,
      payments: updatedPayments,
      trips: updatedTrips,
      invoices: updatedInvoices,
      notifications: [newNotification, ...db.notifications]
    });

    if (selectedPayment?.id === paymentId) {
      setSelectedPayment(null);
    }

    showToast(`Payment receipt ${paymentId} deleted. Ledger updated.`, "info");
  };

  // Handle Delete Trip from Ledger
  const handleDeleteTripLedger = (tripId: string) => {
    const trip = db.trips.find(t => t.id === tripId);
    if (!trip) return;

    if (!window.confirm(`Are you sure you want to delete trip ${tripId} (${trip.customerName}) from the payment ledger?`)) {
      return;
    }

    const updatedTrips = db.trips.filter(t => t.id !== tripId);
    const updatedPayments = db.payments.filter(p => p.tripNumber !== tripId);
    const updatedInvoices = db.invoices.filter(i => i.tripId !== tripId && i.tripNumber !== tripId);

    const newNotification = {
      id: `n-${Date.now()}`,
      title: `Trip Ledger Record Deleted`,
      message: `Trip ${tripId} for ${trip.customerName} and its payment records were deleted.`,
      type: "warning" as const,
      timestamp: new Date().toISOString(),
      read: false
    };

    onUpdateDb({
      ...db,
      trips: updatedTrips,
      payments: updatedPayments,
      invoices: updatedInvoices,
      notifications: [newNotification, ...db.notifications]
    });

    if (selectedTripForDetails?.id === tripId) {
      setShowTripDetailsModal(false);
    }

    showToast(`Trip ${tripId} deleted from ledger.`, "info");
  };

  // Handle Recording Payment
  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.invoiceId || !formData.amount) {
      showToast("Please select Trip and enter Amount.", "warning");
      return;
    }

    // Find the trip (invoiceId field actually contains tripId now)
    const trip = db.trips.find(t => t.id === formData.invoiceId);
    if (!trip) return;

    // Calculate current balance from Payment Ledger
    const tripPayments = db.payments.filter(p => p.tripNumber === trip.id);
    const totalPaid = tripPayments.reduce((sum, p) => sum + p.amount, 0);
    const currentBalance = Math.max(0, (trip.totalFare || 0) - totalPaid);

    if (formData.amount > currentBalance) {
      showToast(`Amount cannot exceed the remaining outstanding balance of ₹${(currentBalance || 0).toLocaleString("en-IN")}.`, "warning");
      return;
    }

    const newPayment: Payment = {
      id: `PAY-${Math.floor(100 + Math.random() * 900)}`,
      invoiceId: db.invoices.find(i => i.tripId === trip.id || i.tripNumber === trip.id)?.id || null,
      tripNumber: trip.id,
      customerName: trip.customerName,
      amount: Number(formData.amount),
      paymentMethod: formData.paymentMethod,
      transactionId: formData.transactionId,
      date: new Date().toISOString().split('T')[0],
      notes: formData.notes
    };

    // Calculate new total paid and payment status
    const newTotalPaid = totalPaid + Number(formData.amount);
    const newBalance = Math.max(0, (trip.totalFare || 0) - newTotalPaid);
    const newStatus: "Pending" | "Partial" | "Paid" = newBalance <= 0 ? "Paid" : (newTotalPaid > 0 ? "Partial" : "Pending");

    // Update Trip payment status
    const updatedTrips = db.trips.map(t => {
      if (t.id === trip.id) {
        return {
          ...t,
          advancePaid: newTotalPaid,
          paymentStatus: newStatus
        };
      }
      return t;
    });

    // Also update Invoice if exists
    const invoice = db.invoices.find(i => i.tripId === trip.id || i.tripNumber === trip.id);
    const updatedInvoices = invoice ? db.invoices.map(inv => {
      if (inv.id === invoice.id) {
        return {
          ...inv,
          advanceAmount: newTotalPaid,
          balanceDue: newBalance,
          paymentStatus: newStatus
        };
      }
      return inv;
    }) : db.invoices;

    const newNotification = {
      id: `n-${Date.now()}`,
      title: "Payment Received",
      message: `Reconciliation of ₹${(newPayment.amount || 0).toLocaleString("en-IN")} received for trip ${trip.id} (${trip.customerName}).`,
      type: "success" as const,
      timestamp: new Date().toISOString(),
      read: false
    };

    onUpdateDb({
      ...db,
      payments: [newPayment, ...db.payments],
      invoices: updatedInvoices,
      trips: updatedTrips,
      notifications: [newNotification, ...db.notifications]
    });

    // Reset Form
    setFormData({
      invoiceId: "",
      amount: 5000,
      paymentMethod: "UPI",
      transactionId: "",
      notes: ""
    });
    setShowAddForm(false);
    showToast(`Payment of ₹${(newPayment.amount || 0).toLocaleString("en-IN")} recorded successfully for trip ${trip.id}!`, "success");
  };

  // Trigger simulated payment reminders
  const handleSendReminder = (invoice: Invoice) => {
    showToast(`Automated transaction reminder successfully compiled and dispatched to ${invoice.customerName} via WhatsApp (${invoice.customerPhone}) and Email (${invoice.customerEmail}).`, "success");
  };

  // Handle Edit Balance for outstanding trips
  const handleUpdateBalance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTripId) return;

    const trip = db.trips.find(t => t.id === editingTripId);
    if (!trip) return;

    // Update Trip with new total fare
    const updatedTrips = db.trips.map(t => {
      if (t.id === editingTripId) {
        const newBalance = Math.max(0, editBalanceTotalFare - editBalancePaid);
        const newStatus: "Pending" | "Partial" | "Paid" = newBalance <= 0 ? "Paid" : (editBalancePaid > 0 ? "Partial" : "Pending");
        return {
          ...t,
          totalFare: editBalanceTotalFare,
          advancePaid: editBalancePaid,
          paymentStatus: newStatus
        };
      }
      return t;
    });

    // Update or create payment record to match the new paid amount
    const existingTripPayments = db.payments.filter(p => p.tripNumber === editingTripId);
    const currentTotalPaid = existingTripPayments.reduce((sum, p) => sum + p.amount, 0);

    let updatedPayments = db.payments;

    if (editBalancePaid !== currentTotalPaid) {
      // Remove old payments for this trip
      updatedPayments = db.payments.filter(p => p.tripNumber !== editingTripId);
      
      // Add new consolidated payment if amount > 0
      if (editBalancePaid > 0) {
        const newPayment: Payment = {
          id: `PAY-${Math.floor(100 + Math.random() * 900)}`,
          invoiceId: db.invoices.find(i => i.tripId === editingTripId || i.tripNumber === editingTripId)?.id || null,
          tripNumber: editingTripId,
          customerName: trip.customerName,
          amount: editBalancePaid,
          paymentMethod: "UPI",
          transactionId: `ADJ-${Date.now().toString().slice(-6)}`,
          date: new Date().toISOString().split('T')[0],
          notes: "Balance adjusted via Edit Balance"
        };
        updatedPayments = [newPayment, ...updatedPayments];
      }
    }

    // Also update invoice if exists
    const invoice = db.invoices.find(i => i.tripId === editingTripId || i.tripNumber === editingTripId);
    const updatedInvoices = invoice ? db.invoices.map(inv => {
      if (inv.id === invoice.id) {
        const newBalance = Math.max(0, editBalanceTotalFare - editBalancePaid);
        const newStatus: "Pending" | "Partial" | "Paid" = newBalance <= 0 ? "Paid" : (editBalancePaid > 0 ? "Partial" : "Pending");
        
        // Recalculate subtotal and gstAmount assuming 5% GST
        const subtotal = Math.round(editBalanceTotalFare / 1.05);
        const gstAmount = editBalanceTotalFare - subtotal;
        
        return {
          ...inv,
          subtotal,
          gstAmount,
          totalAmount: editBalanceTotalFare,
          advanceAmount: editBalancePaid,
          balanceDue: newBalance,
          paymentStatus: newStatus
        };
      }
      return inv;
    }) : db.invoices;

    const newNotification = {
      id: `n-${Date.now()}`,
      title: "Balance Adjusted",
      message: `Balance updated for trip ${editingTripId} (${trip.customerName}). New Total: ₹${(editBalanceTotalFare || 0).toLocaleString("en-IN")}, Paid: ₹${(editBalancePaid || 0).toLocaleString("en-IN")}.`,
      type: "success" as const,
      timestamp: new Date().toISOString(),
      read: false
    };

    onUpdateDb({
      ...db,
      trips: updatedTrips,
      payments: updatedPayments,
      invoices: updatedInvoices,
      notifications: [newNotification, ...db.notifications]
    });

    setEditingTripId(null);
    showToast(`Balance successfully updated for trip ${editingTripId}!`, "success");
  };

  // Handle trip row click to show details
  const handleTripRowClick = (trip: any) => {
    setSelectedTripForDetails(trip);
    setEditTripData({
      totalFare: trip.totalFare || 0,
      calculatedProfit: trip.calculatedProfit || 0
    });
    setEditMode(false);
    setShowTripDetailsModal(true);
  };

  // Handle edit trip financials
  const handleSaveFinancials = () => {
    if (!selectedTripForDetails) return;

    const updatedTrips = db.trips.map(t => {
      if (t.id === selectedTripForDetails.id) {
        return {
          ...t,
          totalFare: editTripData.totalFare,
          calculatedProfit: editTripData.calculatedProfit
        };
      }
      return t;
    });

    onUpdateDb({
      ...db,
      trips: updatedTrips
    });

    // Keep modal open, just exit edit mode so user can see updated data
    setEditMode(false);
    showToast(`Financial details updated for trip ${selectedTripForDetails.id}`, "success");
  };

  return (
    <div className="space-y-6" id="payments-view">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display text-slate-800">Financial Ledger & Receipts</h2>
          <p className="text-sm text-slate-500">Record customer advances, audit outstanding balances, and dispatch UPI payment links.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportPaymentsToCsv(db.payments)}
            className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-sm font-semibold rounded-xl shadow-2xs transition cursor-pointer"
            id="export-payments-csv"
            title="Export payment ledger receipts to CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export CSV
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-xl shadow-sm transition cursor-pointer"
            id="log-payment-btn"
          >
            <Plus className="w-4 h-4" /> Log Payment Receipt
          </button>
        </div>
      </div>

      {/* Financial Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 animate-fade-in">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Reconciled Collections</span>
            <p className="text-2xl font-bold font-mono text-emerald-600">{db.settings.currencySymbol || "₹"}{(totalReconciled || 0).toLocaleString("en-IN")}</p>
            <p className="text-[10px] text-slate-400 font-medium">Sum of all payments received in ledger</p>
          </div>
          <div className="w-11 h-11 bg-emerald-50 rounded-xl text-emerald-500 flex items-center justify-center font-bold text-lg font-mono">
            {db.settings.currencySymbol || "₹"}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Trip Profits Realized</span>
            <p className="text-2xl font-bold font-mono text-brand-600">{db.settings.currencySymbol || "₹"}{(totalLedgerProfit || 0).toLocaleString("en-IN")}</p>
            <p className="text-[10px] text-slate-400 font-medium">Accumulated profits from completed trips</p>
          </div>
          <div className="p-3 bg-brand-50 rounded-xl text-brand-500">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Outstanding Receivables</span>
            <p className="text-2xl font-bold font-mono text-rose-500">{db.settings.currencySymbol || "₹"}{(totalOutstanding || 0).toLocaleString("en-IN")}</p>
            <p className="text-[10px] text-slate-400 font-medium">Pending customer payments to be collected</p>
          </div>
          <div className="p-3 bg-rose-50 rounded-xl text-rose-500">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Log Payment Receipt Form dropdown */}
      {showAddForm && (
        <form onSubmit={handleRecordPayment} className="bg-white rounded-2xl p-6 border border-brand-100 shadow-md grid grid-cols-1 md:grid-cols-3 gap-5 animate-fade-in" id="record-payment-form">
          <div className="md:col-span-3">
            <h3 className="text-lg font-bold font-display text-slate-800">Payment Collection Worksheet</h3>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Select Outstanding Trip *</label>
            <select
              required
              value={formData.invoiceId}
              onChange={e => {
                const tripId = e.target.value;
                const trip = outstandingTrips.find(t => t.id === tripId);
                setFormData({
                  ...formData,
                  invoiceId: tripId,
                  amount: trip ? trip.balanceDue : 5000
                });
              }}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white text-slate-700 focus:outline-none"
            >
              <option value="">-- Choose Trip --</option>
              {outstandingTrips.map(t => (
                <option key={t.id} value={t.id}>{t.id} - {t.customerName} (Bal: ₹{(t.balanceDue || 0).toLocaleString("en-IN")})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Payment Amount Collected *</label>
            <input
              type="number"
              required
              value={formData.amount}
              onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Payment Method Mode</label>
            <select
              value={formData.paymentMethod}
              onChange={e => setFormData({ ...formData, paymentMethod: e.target.value as any })}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white text-slate-700 focus:outline-none"
            >
              <option value="UPI">UPI / QR Code</option>
              <option value="Bank Transfer">Direct Bank Transfer (IMPS/NEFT)</option>
              <option value="Cash">Cash Ledger</option>
              <option value="Card">Credit/Debit Card Terminal</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">UPI Transaction / IMPS reference</label>
            <input
              type="text"
              placeholder="e.g. TXN9881023912"
              value={formData.transactionId}
              onChange={e => setFormData({ ...formData, transactionId: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:outline-none font-mono"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Payment Notes / Remarks</label>
            <input
              type="text"
              placeholder="e.g. Received part advance via GPay."
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="md:col-span-3 flex justify-end gap-3">
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
              id="submit-payment-btn"
            >
              Reconcile Collection
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Trip Financial Summary (Span 7) */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs lg:col-span-7 flex flex-col overflow-hidden h-[540px]">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center shrink-0">
            <h3 className="text-md font-bold font-display text-slate-800">Trip Financial Ledger</h3>
            
            <div className="relative max-w-xs">
              <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search trips..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1 bg-slate-50/50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Trips financial list table */}
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase">
                <tr>
                  <th className="p-3">Trip ID</th>
                  <th className="p-3">Customer Name</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Total Amount</th>
                  <th className="p-3 text-right">Profit</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {(() => {
                  const filtered = completedTrips.filter(trip => {
                    const matchesSearch = trip.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                         trip.id.toLowerCase().includes(searchTerm.toLowerCase());
                    return matchesSearch;
                  });

                  if (filtered.length === 0) {
                    return (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-slate-400 text-xs font-semibold">
                          No completed trip financial records found. Complete a trip in Trips Dispatcher to view its ledger entries here.
                        </td>
                      </tr>
                    );
                  }

                  return filtered.map(trip => {
                    const tripPayments = db.payments.filter(p => p.tripNumber === trip.id);
                    const totalPaidAmount = tripPayments.reduce((sum, p) => sum + p.amount, 0);
                    const isFullyPaid = trip.paymentStatus === "Paid" || (trip.totalFare > 0 && totalPaidAmount >= trip.totalFare);
                    
                    return (
                      <tr 
                        key={trip.id} 
                        onClick={() => handleTripRowClick(trip)}
                        className="hover:bg-slate-50/50 transition cursor-pointer"
                        title="Click to view trip details and edit financials"
                      >
                        <td className="p-3">
                          <p className="font-mono font-bold text-slate-800">{trip.id}</p>
                          <p className="text-[9px] text-slate-400 font-semibold uppercase">{trip.startDate}</p>
                        </td>
                        <td className="p-3">
                          <p className="font-semibold text-slate-800">{trip.customerName}</p>
                          <p className="text-[10px] text-slate-400">{trip.pickup} → {trip.drop}</p>
                        </td>
                        <td className="p-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold ${
                            isFullyPaid ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                            totalPaidAmount > 0 ? "bg-blue-50 text-blue-700 border border-blue-100" :
                            "bg-amber-50 text-amber-700 border border-amber-100"
                          }`}>
                            {isFullyPaid ? "✓ Fully Paid" : totalPaidAmount > 0 ? "Partial Paid" : "Pending"}
                          </span>
                          <p className="text-[10px] text-slate-400 mt-0.5">Paid: ₹{(totalPaidAmount || 0).toLocaleString("en-IN")}</p>
                        </td>
                        <td className="p-3 text-right">
                          <span className="inline-flex items-center gap-1 text-brand-600 font-mono font-bold px-2 py-0.5 bg-brand-50 rounded text-[11px] border border-brand-100/30">
                            💰 ₹{(trip.totalFare || 0).toLocaleString("en-IN")}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          {trip.calculatedProfit !== undefined ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 font-mono font-bold px-2 py-0.5 bg-emerald-50 rounded text-[11px] border border-emerald-100/30">
                              📈 ₹{(trip.calculatedProfit || 0).toLocaleString("en-IN")}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-sans">—</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTripLedger(trip.id);
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title={`Delete trip ${trip.id} from ledger`}
                          >
                            <Trash2 className="w-4 h-4 text-rose-500" />
                          </button>
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Unpaid Invoices / Send Reminders Panel (Span 5) */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs lg:col-span-5 flex flex-col overflow-hidden h-[540px]">
          <h3 className="text-md font-bold font-display text-slate-800 p-4 border-b border-slate-100 shrink-0">
            Collectable Receivables
          </h3>

          <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
            {outstandingTrips.length === 0 ? (
              <div className="text-center py-24 text-slate-400 text-xs">
                Excellent! All client trips are fully paid.
              </div>
            ) : (
              outstandingTrips.map(trip => (
                <div key={trip.id} className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 space-y-3 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-sm text-slate-800">{trip.customerName}</h4>
                      <p className="font-mono text-[10px] text-slate-400 mt-0.5">{trip.id} • Bal Due: <span className="font-bold text-rose-500">₹{(trip.balanceDue || 0).toLocaleString("en-IN")}</span></p>
                      <p className="text-[10px] text-slate-500 mt-1">Total: ₹{(trip.totalFare || 0).toLocaleString("en-IN")} • Paid: ₹{(trip.totalPaid || 0).toLocaleString("en-IN")}</p>
                    </div>
                    <span className="p-2 bg-rose-50 rounded-lg text-rose-500 shrink-0">
                      <AlertTriangle className="w-4 h-4 animate-bounce" />
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-2.5 border-t border-slate-100">
                    <span className="text-[10px] text-slate-400 font-mono">Route: {trip.pickup} → {trip.drop}</span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => {
                          setEditingTripId(trip.id);
                          setEditBalanceTotalFare(trip.totalFare || 0);
                          setEditBalancePaid(trip.totalPaid || 0);
                        }}
                        className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-white hover:bg-indigo-50 border border-indigo-200 py-1 px-2.5 rounded-lg transition"
                        title="Edit balance"
                      >
                        <DollarSign className="w-3.5 h-3.5" /> Edit Balance
                      </button>
                      <button
                        onClick={() => handleTripRowClick(trip)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 py-1 px-2.5 rounded-lg transition"
                        title="View trip details"
                      >
                        <FileText className="w-3.5 h-3.5" /> Details
                      </button>
                      <button
                        onClick={() => {
                          const invoice = db.invoices.find(i => i.tripId === trip.id || i.tripNumber === trip.id);
                          if (invoice) {
                            handleSendReminder(invoice);
                          } else {
                            showToast(`Payment reminder sent to ${trip.customerName} for trip ${trip.id}`, "success");
                          }
                        }}
                        className="flex items-center gap-1.5 text-xs font-semibold text-brand-500 hover:text-brand-600 bg-white hover:bg-brand-50 border border-brand-100 py-1 px-2.5 rounded-lg transition"
                      >
                        <BellRing className="w-3.5 h-3.5" /> Remind
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Reconciled Payment Receipts Audit Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-md font-bold font-display text-slate-800 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-600" /> Reconciled Payment Receipts
            </h3>
            <p className="text-xs text-slate-400">All customer advance payments and reconciled collection transactions in the database.</p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
            {filteredPayments.length} Receipts
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase">
              <tr>
                <th className="p-3">Receipt Code</th>
                <th className="p-3">Date</th>
                <th className="p-3">Customer Name</th>
                <th className="p-3">Trip ID</th>
                <th className="p-3">Mode</th>
                <th className="p-3 text-right">Amount</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400 text-xs font-semibold">
                    No payment receipt transactions found.
                  </td>
                </tr>
              ) : (
                filteredPayments.map(payment => (
                  <tr key={payment.id} className="hover:bg-slate-50/50 transition">
                    <td className="p-3 font-mono font-bold text-slate-800">{payment.id}</td>
                    <td className="p-3 text-slate-500">{payment.date}</td>
                    <td className="p-3 font-semibold text-slate-800">{payment.customerName}</td>
                    <td className="p-3 font-mono text-brand-600">{payment.tripNumber || "—"}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-100">
                        {payment.paymentMethod}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-600">
                      ₹{payment.amount.toLocaleString("en-IN")}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeletePayment(payment.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title={`Delete payment receipt ${payment.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-rose-500" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Balance Modal */}
      {editingTripId && (() => {
        const trip = db.trips.find(t => t.id === editingTripId);
        if (!trip) return null;

        const calculatedBalance = Math.max(0, editBalanceTotalFare - editBalancePaid);

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="edit-balance-modal">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-lg w-full overflow-hidden flex flex-col">
              {/* Header */}
              <div className="bg-indigo-600 px-6 py-4 flex items-center justify-between text-white shrink-0">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-white/20 rounded-lg text-white">
                    <DollarSign className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="font-bold text-sm text-white">Edit Trip Balance</h3>
                    <p className="text-[10px] text-indigo-100 font-mono">Trip: {trip.id} • {trip.customerName}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingTripId(null)}
                  className="p-1.5 hover:bg-indigo-700 text-indigo-100 hover:text-white rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleUpdateBalance} className="p-6 space-y-5 overflow-y-auto">
                <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600 shrink-0">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div className="text-xs">
                      <p className="font-semibold text-slate-700">Route: {trip.pickup} → {trip.drop}</p>
                      <p className="text-[10px] text-slate-500 mt-1">Trip Date: {trip.startDate}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Total Fare */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">
                      Trip Total Fare (₹)
                    </label>
                    <div className="relative rounded-lg shadow-2xs">
                      <span className="absolute left-3 top-2.5 text-[10px] font-bold text-slate-400">₹</span>
                      <input
                        type="number"
                        min="0"
                        required
                        value={editBalanceTotalFare}
                        onChange={e => setEditBalanceTotalFare(Number(e.target.value))}
                        className="w-full pl-6 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Amount Paid */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">
                      Amount Paid (₹)
                    </label>
                    <div className="relative rounded-lg shadow-2xs">
                      <span className="absolute left-3 top-2.5 text-[10px] font-bold text-slate-400">₹</span>
                      <input
                        type="number"
                        min="0"
                        required
                        value={editBalancePaid}
                        onChange={e => setEditBalancePaid(Number(e.target.value))}
                        className="w-full pl-6 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">
                    Calculated Balance Due
                  </label>
                  <div className="px-4 py-3 bg-rose-50/50 rounded-xl text-sm font-mono font-bold text-rose-600 border border-rose-100 flex items-center justify-between">
                    <span>Balance Due:</span>
                    <span>₹{(calculatedBalance || 0).toLocaleString("en-IN")}</span>
                  </div>
                </div>

                <div className="bg-amber-50 rounded-xl p-3 border border-amber-100/50 text-[11px] text-amber-800 leading-relaxed flex gap-2">
                  <span className="font-bold shrink-0">💡 Note:</span>
                  <span>Editing these values will update the trip's financial records and payment ledger. The outstanding balance will recalculate automatically.</span>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditingTripId(null)}
                    className="px-4 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
                  >
                    Update Balance
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Edit Receivable Modal */}
      {editingInvoiceId && (() => {
        const invoice = db.invoices.find(i => i.id === editingInvoiceId);
        if (!invoice) return null;

        const calculatedBalanceDue = Math.max(0, editTotalAmount - editAdvanceAmount);

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="edit-receivable-modal">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-md w-full overflow-hidden flex flex-col">
              {/* Header */}
              <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white shrink-0">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-brand-500/30 rounded-lg text-brand-400">
                    <Edit className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="font-bold text-sm text-white">Modify Outstanding Receivable</h3>
                    <p className="text-[10px] text-slate-300 font-mono">Invoice Reference: {invoice.id}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingInvoiceId(null)}
                  className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateReceivable} className="p-6 space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Client Profile</span>
                  <p className="font-bold text-sm text-slate-800">{invoice.customerName}</p>
                  <p className="text-xs text-slate-400">{invoice.customerEmail} • {invoice.customerPhone}</p>
                </div>

                <div className="border-t border-slate-100 pt-3 grid grid-cols-2 gap-4">
                  {/* Total Receivable Amount */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">
                      Total Invoice Amount (₹)
                    </label>
                    <div className="relative rounded-lg shadow-2xs">
                      <span className="absolute left-3 top-2.5 text-[10px] font-bold text-slate-400">₹</span>
                      <input
                        type="number"
                        min="0"
                        required
                        value={editTotalAmount}
                        onChange={e => setEditTotalAmount(Number(e.target.value))}
                        className="w-full pl-6 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-brand-500"
                      />
                    </div>
                  </div>

                  {/* Received Balance Amount Paid */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">
                      Received Balance Amount (₹)
                    </label>
                    <div className="relative rounded-lg shadow-2xs">
                      <span className="absolute left-3 top-2.5 text-[10px] font-bold text-slate-400">₹</span>
                      <input
                        type="number"
                        min="0"
                        required
                        value={editAdvanceAmount}
                        onChange={e => setEditAdvanceAmount(Number(e.target.value))}
                        className="w-full pl-6 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:border-brand-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Due Date */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">
                      Payment Due Date
                    </label>
                    <input
                      type="date"
                      required
                      value={editDueDate}
                      onChange={e => setEditDueDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  {/* Payment Received Date */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">
                      Payment Received Date
                    </label>
                    <input
                      type="date"
                      required
                      value={editReceivedDate}
                      onChange={e => setEditReceivedDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">
                    Outstanding Balance Due
                  </label>
                  <div className="px-3 py-2.5 bg-rose-50/50 rounded-xl text-sm font-mono font-bold text-rose-600 border border-rose-100 flex items-center justify-between">
                    <span>Balance Due:</span>
                    <span>₹{(calculatedBalanceDue || 0).toLocaleString("en-IN")}</span>
                  </div>
                </div>

                <div className="bg-amber-50 rounded-xl p-3 border border-amber-100/50 text-[11px] text-amber-800 leading-relaxed flex gap-2">
                  <span className="font-bold shrink-0">💡 Note:</span>
                  <span>Directly correcting these figures will automatically update both client invoices and respective ledger sheets dynamically to ensure billing synchronization.</span>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditingInvoiceId(null)}
                    className="px-4 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Complete Payment Details Modal */}
      {selectedPayment && (() => {
        const matchingInvoice = db.invoices.find(i => i.id === selectedPayment.invoiceId || i.tripId === selectedPayment.tripNumber || i.tripNumber === selectedPayment.tripNumber);
        const matchingTrip = db.trips.find(t => t.id === selectedPayment.tripNumber || (matchingInvoice && t.id === matchingInvoice.tripId));
        const matchingCustomer = db.customers.find(c => c.name === selectedPayment.customerName || (matchingTrip && c.id === matchingTrip.customerId));

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="payment-details-modal">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white shrink-0">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400">
                    <Receipt className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="font-bold text-sm text-white">Ledger Receipt Breakdown</h3>
                    <p className="text-[10px] text-slate-300 font-mono">Reference Code: {selectedPayment.id}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPayment(null)}
                  className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition animate-hover"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="p-6 space-y-6 overflow-y-auto">
                
                {/* Section 1: Payment Metadata */}
                <div className="bg-emerald-50/40 border border-emerald-100/50 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-emerald-800 font-bold uppercase tracking-wider block">Reconciled Amount</span>
                    <p className="text-xl font-mono font-bold text-emerald-600">₹{(selectedPayment.amount || 0).toLocaleString("en-IN")}</p>
                  </div>
                  <div className="space-y-0.5 border-l border-emerald-100/50 pl-4">
                    <span className="text-[9px] text-emerald-800 font-bold uppercase tracking-wider block">Receipt Date</span>
                    <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {selectedPayment.date}
                    </p>
                  </div>
                  <div className="space-y-0.5 border-l border-emerald-100/50 pl-4">
                    <span className="text-[9px] text-emerald-800 font-bold uppercase tracking-wider block">Payment Mode</span>
                    <p className="mt-0.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] font-mono">
                        💳 {selectedPayment.paymentMethod}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Grid for Transaction IDs & Notes */}
                {(selectedPayment.transactionId || selectedPayment.notes) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {selectedPayment.transactionId && (
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Transaction Ref ID</span>
                        <code className="text-slate-700 font-bold font-mono bg-white px-2 py-1 rounded border border-slate-100 block truncate">
                          {selectedPayment.transactionId}
                        </code>
                      </div>
                    )}
                    {selectedPayment.notes && (
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Receipt Notes / Memo</span>
                        <p className="text-slate-600 font-medium italic">"{selectedPayment.notes}"</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Section 2: Associated Customer & Trip Details */}
                <div className="border-t border-slate-100 pt-4 space-y-4">
                  <h4 className="text-[11px] font-bold font-display uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-brand-500" /> Client Profile & Booking
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                    <div className="space-y-2">
                      <div>
                        <p className="text-[9px] text-slate-400 font-bold uppercase">Client Name</p>
                        <p className="font-bold text-slate-800 text-sm mt-0.5">{selectedPayment.customerName}</p>
                      </div>
                      {matchingCustomer && (
                        <div className="space-y-1.5 text-xs text-slate-600">
                          <p className="flex items-center gap-1.5">
                            <span className="text-slate-400">📞</span> {matchingCustomer.phone}
                          </p>
                          <p className="flex items-center gap-1.5">
                            <span className="text-slate-400">✉️</span> {matchingCustomer.email}
                          </p>
                          {matchingCustomer.gstNumber && (
                            <p className="font-mono text-[10px] bg-white px-1.5 py-0.5 rounded border border-slate-100/50 inline-block">
                              GSTIN: {matchingCustomer.gstNumber}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 border-l border-slate-100 pl-4 text-xs">
                      {matchingTrip ? (
                        <div className="space-y-2">
                          <div>
                            <span className="text-[9px] text-slate-400 font-bold uppercase">Linked Booking</span>
                            <span className="ml-2 font-mono font-bold text-[10px] text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded border border-brand-100/40">{matchingTrip.id}</span>
                          </div>
                          <div className="space-y-1 text-slate-600">
                            <p className="flex items-start gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-brand-500 shrink-0 mt-0.5" />
                              <span>
                                <span className="font-semibold text-slate-700">Pickup:</span> {matchingTrip.pickup}
                              </span>
                            </p>
                            <p className="flex items-start gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                              <span>
                                <span className="font-semibold text-slate-700">Drop:</span> {matchingTrip.drop}
                              </span>
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-slate-400 italic">No detailed booking profile found for this payment entry.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section 3: Booking Journey & Crew Assignment */}
                {matchingTrip && (
                  <div className="border-t border-slate-100 pt-4 space-y-3">
                    <h4 className="text-[11px] font-bold font-display uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Car className="w-3.5 h-3.5 text-brand-500" /> Crew & Vehicle Assignment
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100/70 space-y-1.5">
                        <span className="text-[9px] text-slate-400 font-bold uppercase">Assigned Fleet</span>
                        <p className="font-bold text-slate-800">{matchingTrip.vehicleModel || "Unspecified Vehicle"}</p>
                      </div>
                      <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100/70 space-y-1.5">
                        <span className="text-[9px] text-slate-400 font-bold uppercase">Assigned Crew Pilot</span>
                        <p className="font-bold text-slate-800">{matchingTrip.driverName || "Self Drive / No Driver"}</p>
                        {matchingTrip.driverPhone && (
                          <a
                            href={`tel:${matchingTrip.driverPhone}`}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200 transition cursor-pointer mt-1"
                            title={`Call driver ${matchingTrip.driverName || ""}`}
                          >
                            <PhoneCall className="w-3 h-3 text-emerald-600" /> Call {matchingTrip.driverPhone}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Section 4: Revenue & Profitability Breakdown */}
                {matchingTrip && (
                  <div className="border-t border-slate-100 pt-4 space-y-3">
                    <h4 className="text-[11px] font-bold font-display uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> Revenue & Profitability Analysis
                    </h4>

                    {/* Journey Completion Metrics */}
                    {(matchingTrip.totalKm !== undefined || matchingTrip.totalBata !== undefined || matchingTrip.tollCharges !== undefined) && (
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
                          <span className="text-[9px] text-slate-400 font-bold uppercase block">Total Kilometers</span>
                          <p className="text-sm font-mono font-bold text-slate-700 mt-1">
                            {matchingTrip.totalKm !== undefined ? `${matchingTrip.totalKm} km` : "—"}
                          </p>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
                          <span className="text-[9px] text-slate-400 font-bold uppercase block">Driver Bata Days</span>
                          <p className="text-sm font-mono font-bold text-slate-700 mt-1">
                            {matchingTrip.totalBata !== undefined ? `${matchingTrip.totalBata} days` : "—"}
                          </p>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
                          <span className="text-[9px] text-slate-400 font-bold uppercase block">Toll & Parking</span>
                          <p className="text-sm font-mono font-bold text-slate-700 mt-1">
                            {matchingTrip.tollCharges !== undefined ? `₹${(matchingTrip.tollCharges || 0).toLocaleString("en-IN")}` : "—"}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Financials Summary */}
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-2">
                        <span className="text-[9px] text-slate-400 font-bold uppercase block">Billing Breakdown</span>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Subtotal Fare:</span>
                          <span className="font-semibold text-slate-700">₹{(matchingTrip.baseFare || 0).toLocaleString("en-IN")}</span>
                        </div>
                        {matchingTrip.gstAmount !== undefined && (
                          <div className="flex justify-between">
                            <span className="text-slate-500">GST Tax (5%):</span>
                            <span className="font-semibold text-slate-700">₹{(matchingTrip.gstAmount || 0).toLocaleString("en-IN")}</span>
                          </div>
                        )}
                        <div className="flex justify-between pt-1 border-t border-slate-200 font-bold">
                          <span className="text-slate-700">Total Net Cost:</span>
                          <span className="text-slate-900">₹{(matchingTrip.totalFare || 0).toLocaleString("en-IN")}</span>
                        </div>
                      </div>

                      {/* Profit Breakdown */}
                      <div className="p-3 bg-brand-500/5 rounded-xl border border-brand-500/10 text-xs space-y-2 flex flex-col justify-between">
                        <div>
                          <span className="text-[9px] text-brand-800 font-bold uppercase block">Net Travel Agency Profit</span>
                          <p className="text-lg font-mono font-bold text-brand-600 mt-1">
                            ₹{(matchingTrip.calculatedProfit || 0).toLocaleString("en-IN")}
                          </p>
                        </div>
                        
                        {(matchingTrip.profitPerKm !== undefined || matchingTrip.profitBata !== undefined || matchingTrip.profitEngage !== undefined) && (
                          <div className="text-[10px] text-slate-500 space-y-0.5 border-t border-brand-100 pt-1.5">
                            {matchingTrip.profitEngage !== undefined && matchingTrip.profitEngage > 0 && (
                              <p>• Fixed Engagement Profit: <span className="font-mono font-semibold text-slate-700">₹{matchingTrip.profitEngage}</span></p>
                            )}
                            {matchingTrip.profitPerKm !== undefined && matchingTrip.profitPerKm > 0 && matchingTrip.totalKm && (
                              <p>• Kilometers Profit ({matchingTrip.totalKm} km): <span className="font-mono font-semibold text-slate-700">₹{matchingTrip.profitPerKm} / km</span></p>
                            )}
                            {matchingTrip.profitBata !== undefined && matchingTrip.profitBata > 0 && matchingTrip.totalBata && (
                              <p>• Crew Bata Profit ({matchingTrip.totalBata} days): <span className="font-mono font-semibold text-slate-700">₹{matchingTrip.profitBata} / day</span></p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Section 5: Associated Invoice Details */}
                {matchingInvoice && (
                  <div className="border-t border-slate-100 pt-4 space-y-3">
                    <h4 className="text-[11px] font-bold font-display uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-brand-500" /> Commercial Invoice Status
                    </h4>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs space-y-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold uppercase">Invoice Reference</span>
                          <p className="font-bold text-slate-800 font-mono mt-0.5">{matchingInvoice.id}</p>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          matchingInvoice.paymentStatus === "Paid" 
                            ? "bg-emerald-100 text-emerald-800" 
                            : matchingInvoice.paymentStatus === "Partial"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-rose-100 text-rose-800"
                        }`}>
                          {matchingInvoice.paymentStatus}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200">
                        <div>
                          <span className="text-[9px] text-slate-400 font-semibold block">Total Billed</span>
                          <p className="font-bold text-slate-700 font-mono">₹{(matchingInvoice.totalAmount || 0).toLocaleString("en-IN")}</p>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 font-semibold block">Advance Paid</span>
                          <p className="font-bold text-slate-700 font-mono">₹{(matchingInvoice.advanceAmount || 0).toLocaleString("en-IN")}</p>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 font-semibold block">Balance Due</span>
                          <p className="font-bold text-rose-600 font-mono">₹{(matchingInvoice.balanceDue || 0).toLocaleString("en-IN")}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
                <button
                  type="button"
                  onClick={() => handleDeletePayment(selectedPayment.id)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg text-xs font-bold transition cursor-pointer"
                  title="Delete this payment receipt from ledger"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Receipt
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPayment(null)}
                  className="px-5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
                >
                  Close Receipt
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Trip Details Modal */}
      {showTripDetailsModal && selectedTripForDetails && (() => {
        const tripPayments = db.payments.filter(p => p.tripNumber === selectedTripForDetails.id);
        const totalPaidAmount = tripPayments.reduce((sum, p) => sum + p.amount, 0);
        
        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-4xl w-full overflow-hidden flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white shrink-0">
                <div className="flex items-center gap-3">
                  <span className="p-2 bg-brand-500/30 rounded-xl text-brand-400">
                    <FileText className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="font-bold text-sm text-white">Trip Financial Details</h3>
                    <p className="text-[10px] text-slate-300 font-mono">Trip ID: {selectedTripForDetails.id}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTripDetailsModal(false)}
                  className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Trip Information */}
                <div className="bg-slate-50 rounded-xl p-5 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Trip Information</h4>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-xs text-slate-400 block">Customer</span>
                      <p className="font-bold text-slate-800">{selectedTripForDetails.customerName}</p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block">Status</span>
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                        selectedTripForDetails.status === "Completed" ? "bg-emerald-50 text-emerald-700" :
                        selectedTripForDetails.status === "Running" ? "bg-blue-50 text-blue-700" :
                        "bg-amber-50 text-amber-700"
                      }`}>
                        {selectedTripForDetails.status}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block">Start Date</span>
                      <p className="font-mono font-semibold text-slate-800">{selectedTripForDetails.startDate}</p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block">Pickup</span>
                      <p className="font-semibold text-slate-800">{selectedTripForDetails.pickup}</p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block">Drop</span>
                      <p className="font-semibold text-slate-800">{selectedTripForDetails.drop}</p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block">Vehicle</span>
                      <p className="font-semibold text-slate-800">{selectedTripForDetails.vehicleModel || "N/A"}</p>
                    </div>
                  </div>

                  {selectedTripForDetails.status === "Completed" && (
                    <div className="pt-4 border-t border-slate-200 grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-xs text-slate-400 block">Total KM</span>
                        <p className="font-mono font-bold text-slate-800">{selectedTripForDetails.totalKm || 0} KM</p>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 block">Driver Bata</span>
                        <p className="font-mono font-bold text-slate-800">{selectedTripForDetails.totalBata || 0} Days</p>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 block">Toll Charges</span>
                        <p className="font-mono font-bold text-slate-800">₹{(selectedTripForDetails.tollCharges || 0).toLocaleString("en-IN")}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Cost Breakdown Section */}
                {selectedTripForDetails.status === "Completed" && selectedTripForDetails.totalKm !== undefined && (
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-5 border border-indigo-200 space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-2">
                      <span className="p-1.5 bg-indigo-200 rounded-lg">
                        <Receipt className="w-4 h-4 text-indigo-700" />
                      </span>
                      Trip Cost Breakdown & Calculations
                    </h4>

                    {(() => {
                      // Use stored calculation values from trip, or fallback to recalculation
                      const customer = db.customers.find(c => c.id === selectedTripForDetails.customerId);
                      const storedPerKmRate = selectedTripForDetails.perKmRate;
                      const storedBataRate = selectedTripForDetails.driverBataRate;
                      const storedKmCost = selectedTripForDetails.kmCost;
                      const storedBataCost = selectedTripForDetails.bataCost;
                      
                      // Use stored values if available, otherwise fallback to customer rates
                      const perKmRate = storedPerKmRate || customer?.perKmRate || 12;
                      const driverBataRate = storedBataRate || customer?.driverBata || 500;
                      
                      const totalKm = selectedTripForDetails.totalKm || 0;
                      const totalBata = selectedTripForDetails.totalBata || 0;
                      const tollCharges = selectedTripForDetails.tollCharges || 0;
                      
                      // Use stored calculated costs or recalculate
                      const kmCost = storedKmCost != null ? Number(storedKmCost) : (totalKm * perKmRate);
                      const bataCost = storedBataCost != null ? Number(storedBataCost) : (totalBata * driverBataRate);
                      const engageAmount = Number(customer?.assignedRateEngage || 0);
                      const calculatedSubtotal = engageAmount + kmCost + bataCost + tollCharges;
                      
                      return (
                        <div className="space-y-3">
                          {/* Calculation Badge */}
                          {storedKmCost !== undefined && storedBataCost !== undefined && (
                            <div className="flex items-center gap-2 text-xs">
                              <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200 font-semibold">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Using trip's recorded calculations
                              </span>
                            </div>
                          )}

                          {/* Individual Cost Calculations */}
                          <div className="bg-white/80 rounded-lg p-4 space-y-3 border border-indigo-100">
                            {/* Engage Amount */}
                            {engageAmount > 0 && (
                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-start gap-2">
                                  <span className="text-indigo-600 font-bold">🎯</span>
                                  <div>
                                    <p className="font-semibold text-slate-700">Rate Engage (Base)</p>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                      Fixed engagement charge
                                    </p>
                                  </div>
                                </div>
                                <span className="font-mono font-bold text-slate-800">
                                  ₹{Number(engageAmount).toLocaleString("en-IN")}
                                </span>
                              </div>
                            )}

                            {/* KM Cost */}
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-start gap-2">
                                <span className="text-indigo-600 font-bold">🚗</span>
                                <div>
                                  <p className="font-semibold text-slate-700">Per KM Charges</p>
                                  <p className="text-xs text-slate-500 mt-0.5">
                                    {totalKm} km × ₹{perKmRate} per km
                                  </p>
                                </div>
                              </div>
                              <span className="font-mono font-bold text-slate-800">
                                ₹{Number(kmCost || 0).toLocaleString("en-IN")}
                              </span>
                            </div>

                            {/* Bata Cost */}
                            <div className="flex items-center justify-between text-sm border-t border-slate-100 pt-3">
                              <div className="flex items-start gap-2">
                                <span className="text-indigo-600 font-bold">👨‍✈️</span>
                                <div>
                                  <p className="font-semibold text-slate-700">Driver Bata Allowance</p>
                                  <p className="text-xs text-slate-500 mt-0.5">
                                    {totalBata} {totalBata === 1 ? "day" : "days"} × ₹{driverBataRate} per day
                                  </p>
                                </div>
                              </div>
                              <span className="font-mono font-bold text-slate-800">
                                ₹{Number(bataCost || 0).toLocaleString("en-IN")}
                              </span>
                            </div>

                            {/* Toll Charges */}
                            <div className="flex items-center justify-between text-sm border-t border-slate-100 pt-3">
                              <div className="flex items-start gap-2">
                                <span className="text-indigo-600 font-bold">🛣️</span>
                                <div>
                                  <p className="font-semibold text-slate-700">Toll & Parking Charges</p>
                                  <p className="text-xs text-slate-500 mt-0.5">
                                    Direct expenses
                                  </p>
                                </div>
                              </div>
                              <span className="font-mono font-bold text-slate-800">
                                ₹{Number(tollCharges || 0).toLocaleString("en-IN")}
                              </span>
                            </div>

                            {/* Calculated Subtotal */}
                            <div className="flex items-center justify-between text-base border-t-2 border-indigo-200 pt-3 bg-indigo-50/50 rounded-lg px-3 py-2">
                              <span className="font-bold text-indigo-800">Trip Cost (Subtotal)</span>
                              <span className="font-mono font-bold text-indigo-700 text-lg">
                                ₹{Number(calculatedSubtotal || 0).toLocaleString("en-IN")}
                              </span>
                            </div>
                          </div>

                          {/* Calculation Note */}
                          <div className="bg-blue-50/50 rounded-lg p-3 border border-blue-100 flex gap-2">
                            <span className="text-blue-600 shrink-0">ℹ️</span>
                            <div className="text-xs text-blue-800 leading-relaxed">
                              <p className="font-bold mb-1">Calculation Formula:</p>
                              <code className="bg-white px-2 py-1 rounded border border-blue-200 font-mono text-[10px] block">
                                Trip Cost = (KM × Per KM Rate) + (Days × Bata Rate) + Toll Charges
                              </code>
                              <p className="mt-2 text-[10px] text-blue-700">
                                {storedKmCost !== undefined ? 
                                  "Rates and calculations were recorded at trip completion and remain fixed for this trip." :
                                  "Base fare is not included in trip cost calculations as per operational guidelines."
                                }
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Financial Details */}
                <div className="bg-gradient-to-br from-brand-50 to-indigo-50 rounded-xl p-5 space-y-4 border border-brand-200">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-brand-700">Financial Details</h4>
                    {!editMode && (
                      <button
                        onClick={() => setEditMode(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-brand-50 text-brand-700 border border-brand-300 text-xs font-bold rounded-lg transition"
                      >
                        <Edit className="w-3.5 h-3.5" /> Edit
                      </button>
                    )}
                  </div>

                  {!editMode ? (
                    // Display Mode
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/90 rounded-xl p-4 border border-brand-100">
                        <span className="text-xs text-slate-500 block mb-2">Total Bill Amount</span>
                        <p className="text-2xl font-mono font-bold text-brand-600">
                          ₹{(selectedTripForDetails.totalFare || 0).toLocaleString("en-IN")}
                        </p>
                        <span className="text-xs text-slate-400 mt-1 block">Charged to customer</span>
                      </div>
                      <div className="bg-white/90 rounded-xl p-4 border border-emerald-100">
                        <span className="text-xs text-slate-500 block mb-2">Net Profit</span>
                        <p className="text-2xl font-mono font-bold text-emerald-600">
                          ₹{(selectedTripForDetails.calculatedProfit || 0).toLocaleString("en-IN")}
                        </p>
                        <span className="text-xs text-slate-400 mt-1 block">After expenses</span>
                      </div>
                    </div>
                  ) : (
                    // Edit Mode
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-2">Total Bill Amount</label>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-sm font-bold text-slate-500">₹</span>
                            <input
                              type="number"
                              min="0"
                              value={editTripData.totalFare}
                              onChange={e => setEditTripData({ ...editTripData, totalFare: Number(e.target.value) })}
                              className="w-full pl-7 pr-3 py-2.5 bg-white border-2 border-brand-300 focus:border-brand-500 rounded-lg text-sm font-bold text-slate-800 focus:outline-none"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-2">Net Profit</label>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-sm font-bold text-slate-500">₹</span>
                            <input
                              type="number"
                              value={editTripData.calculatedProfit}
                              onChange={e => setEditTripData({ ...editTripData, calculatedProfit: Number(e.target.value) })}
                              className="w-full pl-7 pr-3 py-2.5 bg-white border-2 border-emerald-300 focus:border-emerald-500 rounded-lg text-sm font-bold text-slate-800 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditMode(false)}
                          className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold rounded-lg transition"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveFinancials}
                          className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-lg transition"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Profit Calculation Breakdown */}
                {selectedTripForDetails.status === "Completed" && selectedTripForDetails.calculatedProfit !== undefined && (
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-5 border border-emerald-200 space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-2">
                      <span className="p-1.5 bg-emerald-200 rounded-lg">
                        <TrendingUp className="w-4 h-4 text-emerald-700" />
                      </span>
                      Profit Calculation & Breakdown
                    </h4>

                    {(() => {
                      const customer = db.customers.find(c => c.id === selectedTripForDetails.customerId);
                      
                      const totalKm = selectedTripForDetails.totalKm || 0;
                      const totalBata = selectedTripForDetails.totalBata || 0;
                      
                      // OPTION 1: Use profit rates from customer directory (if available)
                      const profitPerKm = customer?.profitPerKm || 0;
                      const profitPerBata = customer?.profitBata || 0;
                      const profitEngage = customer?.profitEngage || 0;
                      
                      // OPTION 2: Calculate from customer rates vs vendor rates (fallback)
                      const customerPerKmRate = customer?.perKmRate || 12;
                      const customerBataRate = customer?.driverBata || 500;
                      const vehicle = db.vehicles.find(v => v.id === selectedTripForDetails.vehicleId);
                      const vendorPerKmRate = vehicle?.perKmAcBelow350 || (customerPerKmRate * 0.8);
                      const vendorBataRate = vehicle?.driverBata || (customerBataRate * 0.75);
                      
                      // Determine which calculation method to use
                      const usingCustomerProfitRates = (profitPerKm > 0 || profitPerBata > 0 || profitEngage > 0);
                      
                      let customerKmCharge, customerBataCharge, vendorKmCost, vendorBataCost;
                      let kmProfit, bataProfit, engageProfit;
                      
                      if (usingCustomerProfitRates) {
                        // USE PROFIT RATES from customer directory
                        kmProfit = totalKm * profitPerKm;
                        bataProfit = totalBata * profitPerBata;
                        engageProfit = profitEngage;
                        
                        // Calculate revenue and cost based on profit
                        customerKmCharge = totalKm * customerPerKmRate;
                        vendorKmCost = customerKmCharge - kmProfit;
                        
                        customerBataCharge = totalBata * customerBataRate;
                        vendorBataCost = customerBataCharge - bataProfit;
                      } else {
                        // CALCULATE from rate difference (fallback when no profit rates set)
                        customerKmCharge = totalKm * customerPerKmRate;
                        customerBataCharge = totalBata * customerBataRate;
                        vendorKmCost = totalKm * vendorPerKmRate;
                        vendorBataCost = totalBata * vendorBataRate;
                        
                        kmProfit = customerKmCharge - vendorKmCost;
                        bataProfit = customerBataCharge - vendorBataCost;
                        engageProfit = 0;
                      }
                      
                      const totalRevenue = customerKmCharge + customerBataCharge + (selectedTripForDetails.tollCharges || 0);
                      const totalCost = vendorKmCost + vendorBataCost + (selectedTripForDetails.tollCharges || 0);
                      const tollProfit = 0; // Toll is pass-through
                      const calculatedTotalProfit = kmProfit + bataProfit + engageProfit + tollProfit;
                      
                      return (
                        <div className="space-y-3">
                          {/* Revenue vs Cost Comparison */}
                          <div className="bg-white/80 rounded-lg p-4 space-y-3 border border-emerald-100">
                            <div className="grid grid-cols-2 gap-2 text-xs font-bold pb-2 border-b border-emerald-100">
                              <div className="text-slate-600">Component</div>
                              <div className="text-blue-600 text-right">Revenue (Customer)</div>
                            </div>
                            
                            {/* Per KM */}
                            <div className="grid grid-cols-2 gap-2 text-sm items-center">
                              <div>
                                <p className="font-semibold text-slate-700">🚗 Per KM</p>
                                <p className="text-xs text-slate-500">{totalKm} km</p>
                              </div>
                              <div className="text-right">
                                <p className="font-mono font-bold text-blue-600">₹{customerKmCharge.toLocaleString("en-IN")}</p>
                                <p className="text-xs text-slate-500">@₹{customerPerKmRate}/km</p>
                              </div>
                            </div>

                            {/* Driver Bata */}
                            <div className="grid grid-cols-2 gap-2 text-sm items-center border-t border-slate-100 pt-3">
                              <div>
                                <p className="font-semibold text-slate-700">👨‍✈️ Driver Bata</p>
                                <p className="text-xs text-slate-500">{totalBata} {totalBata === 1 ? "day" : "days"}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-mono font-bold text-blue-600">₹{customerBataCharge.toLocaleString("en-IN")}</p>
                                <p className="text-xs text-slate-500">@₹{customerBataRate}/day</p>
                              </div>
                            </div>

                            {/* Toll */}
                            <div className="grid grid-cols-2 gap-2 text-sm items-center border-t border-slate-100 pt-3">
                              <div>
                                <p className="font-semibold text-slate-700">🛣️ Toll & Parking</p>
                                <p className="text-xs text-slate-500">Pass-through</p>
                              </div>
                              <div className="text-right">
                                <p className="font-mono font-bold text-blue-600">₹{(selectedTripForDetails.tollCharges || 0).toLocaleString("en-IN")}</p>
                              </div>
                            </div>

                            {/* Totals */}
                            <div className="grid grid-cols-2 gap-2 text-base items-center border-t-2 border-emerald-200 pt-3 bg-emerald-50/50 rounded-lg px-3 py-2">
                              <div className="font-bold text-slate-800">Total</div>
                              <div className="text-right">
                                <p className="font-mono font-bold text-blue-700">₹{totalRevenue.toLocaleString("en-IN")}</p>
                              </div>
                            </div>
                          </div>

                          {/* Profit Breakdown by Component */}
                          <div className="bg-white/80 rounded-lg p-4 space-y-2 border border-emerald-100">
                            <p className="text-xs font-bold text-emerald-800 mb-3">
                              Profit Breakdown:
                              {usingCustomerProfitRates && (
                                <span className="ml-2 text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-normal">
                                  Using configured profit rates
                                </span>
                              )}
                            </p>
                            
                            {engageProfit > 0 && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-600">💼 Base Engagement Profit</span>
                                <span className="font-mono font-bold text-emerald-600">
                                  +₹{engageProfit.toLocaleString("en-IN")}
                                </span>
                              </div>
                            )}
                            
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-600">🚗 Profit from KM charges</span>
                              <span className="font-mono font-bold text-emerald-600">
                                +₹{Math.round(kmProfit).toLocaleString("en-IN")}
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-600">👨‍✈️ Profit from Bata allowance</span>
                              <span className="font-mono font-bold text-emerald-600">
                                +₹{Math.round(bataProfit).toLocaleString("en-IN")}
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-600">🛣️ Profit from Toll (pass-through)</span>
                              <span className="font-mono font-bold text-slate-400">₹0</span>
                            </div>

                            <div className="flex items-center justify-between text-lg border-t-2 border-emerald-200 pt-3 mt-2 bg-emerald-50 rounded-lg px-3 py-2">
                              <span className="font-bold text-emerald-800">Total Net Profit</span>
                              <span className="font-mono font-bold text-emerald-700">
                                ₹{Math.round(calculatedTotalProfit).toLocaleString("en-IN")}
                              </span>
                            </div>
                          </div>

                          {/* Calculation Formula */}
                          <div className="bg-blue-50/50 rounded-lg p-3 border border-blue-100 flex gap-2">
                            <span className="text-blue-600 shrink-0">ℹ️</span>
                            <div className="text-xs text-blue-800 leading-relaxed">
                              <p className="font-bold mb-1">Profit Calculation Method:</p>
                              {usingCustomerProfitRates ? (
                                <>
                                  <code className="bg-white px-2 py-1 rounded border border-blue-200 font-mono text-[10px] block">
                                    Using configured profit rates from customer profile
                                  </code>
                                  <p className="mt-2 text-[10px] text-blue-700">
                                    • Engage Profit: ₹{profitEngage} (fixed)<br/>
                                    • Per KM Profit: ₹{profitPerKm}/km × {totalKm} km = ₹{Math.round(kmProfit)}<br/>
                                    • Bata Profit: ₹{profitPerBata}/day × {totalBata} day(s) = ₹{Math.round(bataProfit)}
                                  </p>
                                </>
                              ) : (
                                <>
                                  <code className="bg-white px-2 py-1 rounded border border-blue-200 font-mono text-[10px] block">
                                    Profit = Total Revenue - Total Cost
                                  </code>
                                  <p className="mt-2 text-[10px] text-blue-700">
                                    Calculated from difference between customer rates and vendor costs.
                                  </p>
                                </>
                              )}
                              <p className="mt-2 text-[10px] text-blue-700">
                                The displayed profit (₹{(selectedTripForDetails.calculatedProfit || 0).toLocaleString("en-IN")}) 
                                may differ if manually adjusted after trip completion.
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Payment History */}
                <div className="bg-white rounded-xl p-5 border border-slate-200 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Payment History</h4>
                  
                  {tripPayments.length > 0 ? (
                    <div className="space-y-2">
                      {tripPayments.map((payment, index) => (
                        <div key={payment.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                          <div>
                            <p className="text-xs font-bold text-slate-800">
                              {index === 0 ? "Advance Payment" : `Payment ${index}`}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {payment.date} • {payment.paymentMethod}
                              {payment.transactionId && ` • ${payment.transactionId}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-mono font-bold text-emerald-600">
                              +₹{payment.amount.toLocaleString("en-IN")}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeletePayment(payment.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title={`Delete payment ${payment.id}`}
                            >
                              <Trash2 className="w-4 h-4 text-rose-500" />
                            </button>
                          </div>
                        </div>
                      ))}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                        <span className="text-xs font-bold text-slate-700">Total Paid</span>
                        <span className="text-lg font-mono font-bold text-brand-600">
                          ₹{totalPaidAmount.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-4">No payments recorded yet</p>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                {editMode ? (
                  <>
                    <button
                      onClick={() => {
                        setEditMode(false);
                        setEditTripData({
                          totalFare: selectedTripForDetails.totalFare || 0,
                          calculatedProfit: selectedTripForDetails.calculatedProfit || 0
                        });
                      }}
                      className="px-5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-sm font-bold rounded-lg transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveFinancials}
                      className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold rounded-lg transition shadow-sm"
                    >
                      Save Changes
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setShowTripDetailsModal(false)}
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-lg transition"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
