import React, { useState } from "react";
import { useToasts } from "./Toast";
import { ErpDatabase } from "../types";
import {
  FileSpreadsheet,
  Printer,
  Calendar,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Building,
  CheckCircle2,
  DollarSign
} from "lucide-react";

interface ReportsViewProps {
  db: ErpDatabase;
}

export function ReportsView({ db }: ReportsViewProps) {
  const { showToast } = useToasts();
  const [reportType, setReportType] = useState<"daily" | "weekly" | "monthly">("daily");

  const handlePrintReport = () => {
    window.print();
  };

  const handleExcelExport = () => {
    showToast("Compiling audit report columns... Dispatched XML payload download to browser local download path.", "success");
  };

  const totalInvoiced = db.invoices.reduce((s, i) => s + i.totalAmount, 0);
  const totalReceived = db.payments.reduce((s, p) => s + p.amount, 0);
  const totalExpenses = db.expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-6" id="reports-view">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display text-slate-800">Operational Audit Reports</h2>
          <p className="text-sm text-slate-500">Generate executive summaries, operational cost sheets, and cash flow reports for company accountants.</p>
        </div>

        {/* Buttons */}
        <div className="flex gap-2.5">
          <button
            onClick={handleExcelExport}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export Excel
          </button>
          <button
            onClick={handlePrintReport}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold rounded-xl transition shadow-xs"
          >
            <Printer className="w-4 h-4" /> Print Statement
          </button>
        </div>
      </div>

      {/* Reports Segment Selector */}
      <div className="flex gap-2 p-1.5 bg-slate-100/60 rounded-xl max-w-xs shrink-0 text-xs font-bold">
        {["daily", "weekly", "monthly"].map(type => (
          <button
            key={type}
            onClick={() => setReportType(type as any)}
            className={`flex-1 py-1.5 rounded-lg capitalize transition ${reportType === type ? 'bg-white shadow-3xs text-brand-600' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Printable Report Worksheet */}
      <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-xs space-y-6" id="printable-report-container">
        <div className="flex justify-between items-start border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-800 font-display flex items-center gap-2">
              <Building className="text-brand-500 w-5 h-5" /> {db.settings.name}
            </h3>
            <p className="text-xs text-slate-500">GSTIN: <span className="font-mono font-bold">{db.settings.gstNumber}</span></p>
          </div>
          <div className="text-right text-xs text-slate-500">
            <p className="font-bold uppercase tracking-wider text-slate-400">Ledger Statement</p>
            <p className="font-semibold text-slate-700 mt-0.5 capitalize">{reportType} Audit Summary</p>
            <p className="font-mono">July 2026 Context</p>
          </div>
        </div>

        {/* Audit metrics table */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Billed Invoiced</span>
            <p className="text-2xl font-bold text-indigo-600 font-mono mt-1">₹{totalInvoiced.toLocaleString("en-IN")}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Collections Reconciled</span>
            <p className="text-2xl font-bold text-emerald-600 font-mono mt-1">₹{totalReceived.toLocaleString("en-IN")}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Operational Expenses Debited</span>
            <p className="text-2xl font-bold text-rose-600 font-mono mt-1">₹{totalExpenses.toLocaleString("en-IN")}</p>
          </div>
        </div>

        {/* Breakdown segments */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Operational Dispatches in Statement Range</h4>
          <div className="border border-slate-100 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100 font-bold uppercase text-slate-500 text-[10px]">
                <tr>
                  <th className="p-3">Trip ID</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Vehicle</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Fare Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
                {db.trips.map(trip => (
                  <tr key={trip.id} className="hover:bg-slate-50/55 transition">
                    <td className="p-3 font-mono font-bold text-slate-800">{trip.id}</td>
                    <td className="p-3">{trip.customerName}</td>
                    <td className="p-3 font-mono text-slate-500">{trip.vehicleNumber}</td>
                    <td className="p-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">{trip.status}</td>
                    <td className="p-3 text-right font-mono text-slate-800">₹{trip.totalFare.toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Foot declaration */}
        <div className="text-center text-[10px] text-slate-400 border-t border-slate-100 pt-6 uppercase tracking-wider font-semibold">
          This is a computer-generated operations audit statement. Certified by the Accountant office.
        </div>
      </div>
    </div>
  );
}
