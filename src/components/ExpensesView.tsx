import React, { useState } from "react";
import { useToasts } from "./Toast";
import {
  ErpDatabase,
  Expense,
  ExpenseCategory
} from "../types";
import {
  Search,
  Plus,
  DollarSign,
  Calendar,
  Layers,
  ChevronRight,
  TrendingDown,
  FileSpreadsheet,
  IndianRupee,
  ShoppingBag,
  Filter,
  ChevronDown,
  Edit2,
  Trash2,
  AlertTriangle,
  AlertCircle,
  Settings2
} from "lucide-react";

interface ExpensesViewProps {
  db: ErpDatabase;
  onUpdateDb: (updatedDb: ErpDatabase) => void;
}

export function ExpensesView({ db, onUpdateDb }: ExpensesViewProps) {
  const { showToast } = useToasts();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Editing and Deleting States
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({
    category: ExpenseCategory.FUEL,
    amount: 1500,
    date: "",
    paidTo: "",
    paymentMethod: "Bank Transfer" as any,
    notes: ""
  });

  // New Expense Form State
  const [formData, setFormData] = useState({
    category: ExpenseCategory.FUEL,
    amount: 1500,
    date: new Date().toISOString().split('T')[0],
    paidTo: "",
    paymentMethod: "Bank Transfer" as any,
    notes: ""
  });

  const handleUpdateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData.paidTo || !editFormData.amount) {
      showToast("Please fill in recipient Name and Expense Amount.", "warning");
      return;
    }

    const updatedExpenses = db.expenses.map(exp => {
      if (exp.id === editingExpenseId) {
        return {
          ...exp,
          category: editFormData.category,
          amount: Number(editFormData.amount),
          date: editFormData.date || new Date().toISOString().split('T')[0],
          paidTo: editFormData.paidTo,
          paymentMethod: editFormData.paymentMethod,
          notes: editFormData.notes
        };
      }
      return exp;
    });

    onUpdateDb({
      ...db,
      expenses: updatedExpenses
    });

    setEditingExpenseId(null);
    showToast("Expenditure entry updated successfully!", "success");
  };

  const handleDeleteExpense = (id: string) => {
    const expenseToDelete = db.expenses.find(exp => exp.id === id);
    if (!expenseToDelete) return;

    onUpdateDb({
      ...db,
      expenses: db.expenses.filter(exp => exp.id !== id)
    });

    setDeletingExpenseId(null);
    showToast(`Expenditure entry ${expenseToDelete.id} deleted successfully!`, "success");
  };

  // Filter expenses
  const filteredExpenses = db.expenses.filter(exp => {
    const matchesSearch = 
      exp.paidTo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.notes.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedCategory === "all") return matchesSearch;
    return matchesSearch && exp.category.toLowerCase() === selectedCategory.toLowerCase();
  });

  // Total expenses sum
  const totalExpenseSum = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Handle Recording Expense
  const handleRecordExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.paidTo || !formData.amount) {
      showToast("Please fill in recipient Name and Expense Amount.", "warning");
      return;
    }

    const newExpense: Expense = {
      id: `EXP-${Date.now()}`,
      category: formData.category,
      amount: Number(formData.amount),
      date: formData.date || new Date().toISOString().split('T')[0],
      paidTo: formData.paidTo,
      paymentMethod: formData.paymentMethod,
      notes: formData.notes
    };

    const newNotification = {
      id: `n-${Date.now()}`,
      title: "Expense Logged",
      message: `A new business expense of ${db.settings.currencySymbol || "₹"}${newExpense.amount.toLocaleString("en-IN")} was committed.`,
      type: "warning" as const,
      timestamp: new Date().toISOString(),
      read: false
    };

    onUpdateDb({
      ...db,
      expenses: [newExpense, ...db.expenses],
      notifications: [newNotification, ...db.notifications]
    });

    // Reset Form
    setFormData({
      category: ExpenseCategory.FUEL,
      amount: 1500,
      date: new Date().toISOString().split('T')[0],
      paidTo: "",
      paymentMethod: "Bank Transfer",
      notes: ""
    });
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6" id="expenses-view">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display text-slate-800">Operational Expenses Log</h2>
          <p className="text-sm text-slate-500">Log agency expenditures, fuel top-ups, mechanical servicing costs, and driver salary disbursements.</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold rounded-xl shadow-sm transition"
          id="log-expense-btn"
        >
          <Plus className="w-4 h-4" /> Log Expenditure
        </button>
      </div>

      {/* Log Expenditure Form Dropdown */}
      {showAddForm && (
        <form onSubmit={handleRecordExpense} className="bg-white rounded-2xl p-6 border border-brand-100 shadow-md grid grid-cols-1 md:grid-cols-3 gap-5 animate-fade-in" id="add-expense-form">
          <div className="md:col-span-3">
            <h3 className="text-lg font-bold font-display text-slate-800 text-rose-600 flex items-center gap-1">
              <TrendingDown className="w-5 h-5" /> Business Expenditure Worksheet
            </h3>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Expense Category *</label>
            <select
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value as any })}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white text-slate-700 focus:outline-none"
            >
              <option value={ExpenseCategory.FUEL}>⛽ Fuel Top-Up</option>
              <option value={ExpenseCategory.MAINTENANCE}>🔧 Mechanical Service</option>
              <option value={ExpenseCategory.SALARY}>💵 Salaries & Wages</option>
              <option value={ExpenseCategory.OFFICE_RENT}>🏢 Branch Office Rent</option>
              <option value={ExpenseCategory.HOTEL_PAYMENT}>🏨 Hotel Partner Settlement</option>
              <option value={ExpenseCategory.VENDOR_PAYMENT}>🤝 Vendor / Agent Payout</option>
              <option value={ExpenseCategory.MISCELLANEOUS}>🛍 Miscellaneous Outlay</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Paid To (Recipient Entity) *</label>
            <input
              type="text"
              placeholder="e.g. Shell Petrol Indiranagar"
              required
              value={formData.paidTo}
              onChange={e => setFormData({ ...formData, paidTo: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Outlay Amount (INR) *</label>
            <input
              type="number"
              required
              value={formData.amount}
              onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Transaction Date *</label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={e => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:outline-none text-slate-700 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Transaction Medium</label>
            <select
              value={formData.paymentMethod}
              onChange={e => setFormData({ ...formData, paymentMethod: e.target.value as any })}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white text-slate-700 focus:outline-none"
            >
              <option value="Bank Transfer">Bank Transfer / IMPS</option>
              <option value="Card">Business Card</option>
              <option value="Cash">Cash Ledger</option>
              <option value="UPI">Company GPay UPI</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Audit Remarks & Vouchering Notes</label>
            <input
              type="text"
              placeholder="Enter comprehensive bill descriptions, odometer readings, etc..."
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
              className="px-5 py-2 bg-rose-500 hover:bg-rose-600 text-white font-semibold text-sm rounded-xl shadow-sm transition"
              id="submit-expense-btn"
            >
              Commit Outlay Entry
            </button>
          </div>
        </form>
      )}

      {/* Main split dashboard view */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Search, Category Filters, and Table ledger (Span 8) */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs lg:col-span-8 flex flex-col overflow-hidden h-[540px]">
          <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shrink-0">
            {/* Category Filter Dropdown */}
            <div className="relative z-20" id="category-filter-dropdown">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center justify-between gap-2 px-3.5 py-1.5 min-w-[160px] bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg shadow-3xs transition"
              >
                <div className="flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <span>{selectedCategory === "all" ? "All Costs" : selectedCategory}</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
              
              {isDropdownOpen && (
                <>
                  {/* Invisible full-screen overlay to catch clicks outside of the dropdown */}
                  <div 
                    className="fixed inset-0 z-30" 
                    onClick={() => setIsDropdownOpen(false)} 
                  />
                  <div className="absolute left-0 mt-1.5 w-56 bg-white border border-slate-150 rounded-xl shadow-lg py-1.5 z-40 animate-fade-in font-display">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory("all");
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs font-bold transition flex items-center justify-between ${
                        selectedCategory === "all" ? "bg-slate-50 text-brand-600 font-extrabold" : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span>All Costs</span>
                      {selectedCategory === "all" && <span className="w-1.5 h-1.5 rounded-full bg-brand-600" />}
                    </button>
                    {Object.values(ExpenseCategory).map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setSelectedCategory(cat);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-xs font-bold transition flex items-center justify-between ${
                          selectedCategory === cat ? "bg-slate-50 text-brand-600 font-extrabold" : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span>{cat}</span>
                        {selectedCategory === cat && <span className="w-1.5 h-1.5 rounded-full bg-brand-600" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="relative max-w-xs shrink-0">
              <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search outlays..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1 bg-slate-50/50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase">
                <tr>
                  <th className="p-3">Reference Code</th>
                  <th className="p-3">Recipient / Vendor</th>
                  <th className="p-3">Category</th>
                  <th className="p-3 text-right">Debit Outlay</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredExpenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-slate-50/50 transition">
                    <td className="p-3">
                      <p className="font-mono font-bold text-slate-800">{exp.id.split('-')[0] || exp.id}</p>
                      <p className="text-[9px] text-slate-400 font-semibold uppercase">{exp.date}</p>
                    </td>
                    <td className="p-3">
                      <p className="font-semibold text-slate-800">{exp.paidTo}</p>
                      {exp.notes && <p className="text-[10px] text-slate-400 max-w-[200px] truncate">"{exp.notes}"</p>}
                    </td>
                    <td className="p-3">
                      <span className="inline-block px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-bold text-[9px]">
                        {exp.category}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-rose-600">
                      - {db.settings.currencySymbol || "₹"}{exp.amount.toLocaleString("en-IN")}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditingExpenseId(exp.id);
                            setEditFormData({
                              category: exp.category,
                              amount: exp.amount,
                              date: exp.date,
                              paidTo: exp.paidTo,
                              paymentMethod: exp.paymentMethod,
                              notes: exp.notes || ""
                            });
                          }}
                          type="button"
                          className="px-2 py-1 bg-slate-50 hover:bg-slate-100 hover:text-rose-600 text-slate-600 border border-slate-200 rounded-lg font-bold text-[10px] transition cursor-pointer flex items-center gap-1 active:scale-95"
                          title="Modify Entry"
                        >
                          <Edit2 className="w-3 h-3 text-slate-500" /> Edit
                        </button>
                        <button
                          onClick={() => setDeletingExpenseId(exp.id)}
                          type="button"
                          className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg font-bold text-[10px] transition cursor-pointer flex items-center gap-1 active:scale-95"
                          title="Delete Entry"
                        >
                          <Trash2 className="w-3 h-3 text-red-500" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Quick visual statistics breakdown (Span 4) */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs lg:col-span-4 h-[540px] flex flex-col p-6 space-y-6">
          <h3 className="text-md font-bold font-display text-slate-800 border-b border-slate-100 pb-3 shrink-0">
            Outlays Analytics
          </h3>

          <div className="bg-slate-50 p-4 rounded-xl text-center space-y-1.5 shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Filtered Cost</span>
            <h4 className="text-3xl font-bold font-display text-rose-600 font-mono">
              {db.settings.currencySymbol || "₹"}{totalExpenseSum.toLocaleString("en-IN")}
            </h4>
            <p className="text-[10px] text-slate-500">Debited from corporate balance ledger.</p>
          </div>

          {/* Graphical Progress Bar breakdowns */}
          <div className="flex-1 overflow-y-auto space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Outlays Percentage Weights</h4>
            {Object.values(ExpenseCategory).map(cat => {
              const catSum = db.expenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0);
              const totalSum = db.expenses.reduce((s, e) => s + e.amount, 0);
              const percentage = totalSum > 0 ? (catSum / totalSum) * 100 : 0;
              return (
                <div key={cat} className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>{cat}</span>
                    <span className="font-mono font-semibold">{db.settings.currencySymbol || "₹"}{catSum.toLocaleString("en-IN")} ({percentage.toFixed(0)}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full rounded-full" style={{ width: `${percentage}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* EDIT EXPENSE MODAL */}
      {editingExpenseId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <form
            onSubmit={handleUpdateExpense}
            className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-lg w-full overflow-hidden animate-slide-up flex flex-col max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-brand-50 rounded-xl text-brand-600">
                  <Settings2 className="w-5 h-5" />
                </span>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Edit Outlay Record</h4>
                  <p className="text-[11px] text-slate-400 font-medium font-mono">Reference ID: {editingExpenseId}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingExpenseId(null)}
                className="text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase">Expense Category *</label>
                <select
                  value={editFormData.category}
                  onChange={e => setEditFormData({ ...editFormData, category: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50/50 focus:bg-white text-slate-700 focus:outline-none font-bold"
                >
                  <option value={ExpenseCategory.FUEL}>⛽ Fuel Top-Up</option>
                  <option value={ExpenseCategory.MAINTENANCE}>🔧 Mechanical Service</option>
                  <option value={ExpenseCategory.SALARY}>💵 Salaries & Wages</option>
                  <option value={ExpenseCategory.OFFICE_RENT}>🏢 Branch Office Rent</option>
                  <option value={ExpenseCategory.HOTEL_PAYMENT}>🏨 Hotel Partner Settlement</option>
                  <option value={ExpenseCategory.VENDOR_PAYMENT}>🤝 Vendor / Agent Payout</option>
                  <option value={ExpenseCategory.MISCELLANEOUS}>🛍 Miscellaneous Outlay</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase">Paid To (Recipient Entity) *</label>
                <input
                  type="text"
                  required
                  value={editFormData.paidTo}
                  onChange={e => setEditFormData({ ...editFormData, paidTo: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50/50 focus:bg-white focus:outline-none font-bold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase">Outlay Amount ({db.settings.currencySymbol || "₹"}) *</label>
                  <input
                    type="number"
                    required
                    value={editFormData.amount}
                    onChange={e => setEditFormData({ ...editFormData, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50/50 focus:bg-white focus:outline-none font-mono font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase">Transaction Date *</label>
                  <input
                    type="date"
                    required
                    value={editFormData.date}
                    onChange={e => setEditFormData({ ...editFormData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50/50 focus:bg-white focus:outline-none font-bold text-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase">Transaction Medium</label>
                <select
                  value={editFormData.paymentMethod}
                  onChange={e => setEditFormData({ ...editFormData, paymentMethod: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50/50 focus:bg-white text-slate-700 focus:outline-none font-bold"
                >
                  <option value="Bank Transfer">Bank Transfer / IMPS</option>
                  <option value="Card">Business Card</option>
                  <option value="Cash">Cash Ledger</option>
                  <option value="UPI">Company GPay UPI</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase">Audit Remarks & Vouchering Notes</label>
                <textarea
                  rows={3}
                  value={editFormData.notes}
                  onChange={e => setEditFormData({ ...editFormData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50/50 focus:bg-white focus:outline-none font-medium text-slate-700 leading-relaxed"
                  placeholder="Enter comments..."
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setEditingExpenseId(null)}
                className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-rose-500 hover:bg-rose-600 text-white font-semibold text-xs rounded-xl shadow-sm transition cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* DELETE EXPENSE MODAL */}
      {deletingExpenseId && (() => {
        const deletingExpense = db.expenses.find(exp => exp.id === deletingExpenseId);
        if (!deletingExpense) return null;
        return (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-md w-full overflow-hidden animate-slide-up">
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-100 bg-red-50/50 flex items-center gap-3">
                <span className="p-2 bg-red-100 rounded-xl text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                </span>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Confirm Outlay Deletion</h4>
                  <p className="text-[11px] text-slate-400 font-medium">This action cannot be undone.</p>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-3">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Are you sure you want to permanently delete the following operational expenditure log?
                </p>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1.5">
                  <div className="text-xs font-bold text-slate-800">
                    Recipient: {deletingExpense.paidTo}
                  </div>
                  <div className="text-[10px] text-slate-400 font-semibold font-mono uppercase">
                    Ref Code: {deletingExpense.id}
                  </div>
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">
                    Category: {deletingExpense.category}
                  </div>
                  <div className="text-sm font-bold text-rose-600 font-mono">
                    Amount: - {db.settings.currencySymbol || "₹"}{deletingExpense.amount.toLocaleString("en-IN")}
                  </div>
                </div>
                <p className="text-[11px] text-red-500 font-medium flex items-center gap-1.5 bg-red-50/50 p-2.5 rounded-lg border border-red-100/50">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" /> This will instantly remove this transaction from the corporate Balance Sheet and Outlay percentages.
                </p>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeletingExpenseId(null)}
                  className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer"
                >
                  Cancel, Keep Log
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteExpense(deletingExpenseId)}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl shadow-sm transition cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Yes, Delete Outlay
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
