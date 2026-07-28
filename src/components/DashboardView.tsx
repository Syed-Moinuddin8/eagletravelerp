import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ErpDatabase,
  LeadStatus,
  TripStatus,
  UserRole
} from "../types";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  PhoneCall,
  Car,
  Users,
  Briefcase,
  Layers,
  ChevronRight,
  Plus,
  Compass,
  DollarSign,
  CloudSun,
  CalendarDays,
  Play,
  Search,
  Filter,
  Database,
  ShieldAlert,
  ListFilter,
  Tag,
  ChevronDown,
  UserCheck,
  FileText,
  Activity,
  X,
  FileClock,
  CheckSquare
} from "lucide-react";

const auditContainerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04
    }
  }
};

const auditItemVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 120,
      damping: 15
    }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -8,
    transition: { duration: 0.15 }
  }
};

interface DashboardViewProps {
  db: ErpDatabase;
  onNavigate: (tab: string) => void;
  onAddTrip: () => void;
  onAddExpense: () => void;
  onAddInvoice: () => void;
  onUpdateDb?: (db: ErpDatabase) => void;
}

export function DashboardView({
  db,
  onNavigate,
  onAddTrip,
  onAddExpense,
  onAddInvoice,
  onUpdateDb
}: DashboardViewProps) {
  // Compute key stats
  const activeTripsCount = db.trips.filter(t => t.status === TripStatus.RUNNING || t.status === TripStatus.STARTED).length;
  
  // Financial calculation (only counting payments for valid active trips)
  const totalRevenue = db.payments.reduce((sum, p) => {
    if (p.tripNumber) {
      const tripExists = db.trips.some(t => t.id === p.tripNumber);
      if (!tripExists) return sum;
    }
    return sum + p.amount;
  }, 0);
  const totalExpenses = db.expenses.reduce((sum, e) => sum + e.amount, 0);
  
  // Total profit calculation:
  // 1. Sum of profit from completed trips
  const completedTripsProfit = db.trips
    .filter(t => t.status === TripStatus.COMPLETED)
    .reduce((sum, t) => sum + (t.calculatedProfit || 0), 0);

  // 2. Net profit from receipts minus operational expenses (only if expenses are logged)
  const netCashProfit = totalExpenses > 0 ? Math.max(0, totalRevenue - totalExpenses) : 0;

  // Total profit displayed
  const totalProfit = completedTripsProfit > 0 ? completedTripsProfit : netCashProfit;

  const totalInvoicesAmount = db.invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalBalanceDue = db.invoices.reduce((sum, inv) => sum + inv.balanceDue, 0);

  // Recent trips for the Live Dispatch Feed
  const recentTrips = [...db.trips].reverse().slice(0, 5);

  return (
    <div className="space-y-8 animate-fade-in" id="dashboard-view">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-gradient-to-r from-brand-700 via-brand-600 to-brand-500 rounded-2xl p-6 md:p-8 text-white shadow-lg border border-brand-100">
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-md">
            <Compass className="w-3.5 h-3.5 animate-spin" /> Live Operations Portal
          </span>
          <h1 className="text-3xl font-bold font-display tracking-tight">
            Welcome back, {db.session.name}
          </h1>
          <p className="text-brand-50 text-sm max-w-xl font-light">
            You are logged in as <span className="font-semibold">{db.session.role}</span>. {db.settings.name} fleet is operating smoothly today with {activeTripsCount} active dispatches.
          </p>
        </div>
        
        {/* Quick Actions Panel */}
        <div className="mt-6 md:mt-0 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={onAddTrip}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-accent-500 text-white hover:bg-accent-600 font-medium text-sm rounded-xl shadow-sm transition-all duration-200 active:scale-95 cursor-pointer"
            id="quick-dispatch-btn"
          >
            <Play className="w-4 h-4 fill-current" /> Dispatch Trip
          </button>
          <button
            onClick={onAddExpense}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 border border-white/20 text-white font-medium text-sm rounded-xl transition-all duration-200 active:scale-95 cursor-pointer"
            id="quick-log-expense-btn"
          >
            <DollarSign className="w-4 h-4" /> Log Expense
          </button>
          <button
            onClick={onAddInvoice}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 border border-white/20 text-white font-medium text-sm rounded-xl transition-all duration-200 active:scale-95 cursor-pointer"
            id="quick-create-invoice-btn"
          >
            <Briefcase className="w-4 h-4" /> Raise Invoice
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Today's Trips */}
        <div 
          onClick={() => onNavigate("trips")}
          className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs hover:shadow-md hover:border-brand-100 transition-all duration-200 cursor-pointer group"
          id="stat-trips-card"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Active Dispatches</p>
              <h3 className="text-3xl font-bold font-display text-slate-800">{activeTripsCount} <span className="text-sm font-normal text-slate-400">running</span></h3>
            </div>
            <span className="p-3 bg-blue-50 rounded-xl text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors duration-200">
              <Car className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-4 flex items-center text-xs text-blue-500 font-medium">
            <span>Track active vehicle logs</span>
            <ChevronRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Revenue Card */}
        <div 
          onClick={() => onNavigate("payments")}
          className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs hover:shadow-md hover:border-brand-100 transition-all duration-200 cursor-pointer group"
          id="stat-revenue-card"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Received</p>
              <h3 className="text-3xl font-bold font-display text-emerald-600">{db.settings.currencySymbol || "₹"}{totalRevenue.toLocaleString("en-IN")}</h3>
            </div>
            <span className="p-3 bg-emerald-50 rounded-xl text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-200">
              <TrendingUp className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-4 flex items-center text-xs text-emerald-600 font-medium">
            <span>Invoice payment reconciliation</span>
            <ChevronRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Total Profit Card */}
        <div 
          onClick={() => onNavigate("analytics")}
          className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xs hover:shadow-md hover:border-brand-100 transition-all duration-200 cursor-pointer group"
          id="stat-profit-card"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Profit</p>
              <h3 className={`text-3xl font-bold font-display ${totalProfit >= 0 ? 'text-brand-500' : 'text-rose-500'}`}>
                {db.settings.currencySymbol || "₹"}{totalProfit.toLocaleString("en-IN")}
              </h3>
            </div>
            <span className="p-3 bg-gold-50 rounded-xl text-gold-500 group-hover:bg-gold-500 group-hover:text-white transition-colors duration-200">
              <DollarSign className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-4 flex items-center text-xs text-gold-500 font-medium">
            <span>View business profit analytics</span>
            <ChevronRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* Main Operational Feed Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3): Live Dispatch Operations Feed */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold font-display text-slate-800 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-brand-500" /> Recent Dispatch Activity
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">Live trips, customer bookings, and vehicle assignments</p>
              </div>
              <button
                onClick={() => onNavigate("trips")}
                className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 cursor-pointer"
              >
                View All Dispatches <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {recentTrips.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {recentTrips.map(trip => (
                  <div key={trip.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 rounded-xl px-2 transition">
                    <div className="flex items-start gap-3 min-w-0">
                      <span className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                        trip.status === TripStatus.RUNNING || trip.status === TripStatus.STARTED ? "bg-emerald-50 text-emerald-600" :
                        trip.status === TripStatus.COMPLETED ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600"
                      }`}>
                        <Car className="w-4 h-4" />
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-800 text-sm">{trip.customerName}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-600">
                            {trip.id}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            trip.status === TripStatus.RUNNING || trip.status === TripStatus.STARTED ? "bg-emerald-100 text-emerald-800" :
                            trip.status === TripStatus.COMPLETED ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800"
                          }`}>
                            {trip.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 truncate">
                          📍 <span className="font-semibold text-slate-700">{trip.pickup}</span> → {trip.drop}
                        </p>
                        <div className="text-[11px] text-slate-400 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span>Driver: <span className="font-semibold text-slate-700">{trip.driverName || "Allocated"}</span></span>
                          {trip.driverPhone && (
                            <a
                              href={`tel:${trip.driverPhone}`}
                              className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-200 transition cursor-pointer"
                              title={`Call driver ${trip.driverName || ""}`}
                            >
                              <PhoneCall className="w-2.5 h-2.5 text-emerald-600" /> Call Driver
                            </a>
                          )}
                          {trip.customerPhone && (
                            <a
                              href={`tel:${trip.customerPhone}`}
                              className="inline-flex items-center gap-0.5 text-[10px] font-bold text-brand-700 bg-brand-50 hover:bg-brand-100 px-1.5 py-0.5 rounded border border-brand-200 transition cursor-pointer"
                              title={`Call customer ${trip.customerName}`}
                            >
                              <PhoneCall className="w-2.5 h-2.5 text-brand-600" /> Call Customer
                            </a>
                          )}
                          <span>• {trip.vehicleModel}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center sm:flex-col sm:items-end justify-between shrink-0 gap-1 border-t sm:border-t-0 border-slate-100 pt-2 sm:pt-0">
                      <span className="text-xs font-bold text-emerald-600">
                        Advance: ₹{(trip.advancePaid || 0).toLocaleString("en-IN")}
                      </span>
                      <button
                        onClick={() => onNavigate("trips")}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-brand-50 text-slate-600 hover:text-brand-700 text-[11px] font-bold rounded-lg transition cursor-pointer"
                      >
                        Open Dispatch
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 space-y-2">
                <Car className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs font-semibold">No trips dispatched yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1/3): Financial Quick Health & Pending Invoices */}
        <div className="space-y-6">

          {/* Pending Collections / Outstanding Balances Card */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold font-display text-slate-800 flex items-center gap-2">
                <FileText className="w-4 h-4 text-rose-500" /> Pending Invoices
              </h3>
              <button
                onClick={() => onNavigate("invoices")}
                className="text-[11px] font-bold text-rose-600 hover:text-rose-700 cursor-pointer"
              >
                Invoices & GST →
              </button>
            </div>

            <div className="p-3.5 bg-rose-50/60 border border-rose-100 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase text-rose-700">Outstanding Balance Due</p>
                <p className="text-xl font-bold text-rose-800 font-mono mt-0.5">
                  {db.settings.currencySymbol || "₹"}{totalBalanceDue.toLocaleString("en-IN")}
                </p>
              </div>
              <span className="px-2 py-1 bg-white text-rose-700 font-bold text-[10px] rounded-lg border border-rose-200 shadow-2xs">
                {db.invoices.filter(i => i.paymentStatus !== "Paid").length} Unpaid
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
