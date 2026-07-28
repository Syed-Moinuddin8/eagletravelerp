import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useToasts } from "./Toast";
import { SupabaseMigration } from "./SupabaseMigration";
import { DatabaseTest } from "./DatabaseTest";
import { ErpDatabase, CompanySettings, UserSession, UserRole } from "../types";
import {
  Building,
  User,
  Database,
  Save,
  RotateCcw,
  Download,
  Upload,
  Globe,
  Coins,
  QrCode,
  FileText,
  Mail,
  Phone,
  MapPin,
  Sparkles,
  Shield,
  HelpCircle,
  FileCode
} from "lucide-react";
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
} from "../data/seedData";

interface SettingsViewProps {
  db: ErpDatabase;
  onUpdateDb: (updatedDb: ErpDatabase) => void;
}

type SettingsTab = "office" | "operator";

export function SettingsView({ db, onUpdateDb }: SettingsViewProps) {
  const { showToast } = useToasts();
  const [activeTab, setActiveTab] = useState<SettingsTab>("office");

  // Office state
  const [companyName, setCompanyName] = useState(db.settings.name);
  const [logoUrl, setLogoUrl] = useState(db.settings.logoUrl);
  const [gstNumber, setGstNumber] = useState(db.settings.gstNumber);
  const [address, setAddress] = useState(db.settings.address);
  const [email, setEmail] = useState(db.settings.email);
  const [phone, setPhone] = useState(db.settings.phone);
  const [whatsapp, setWhatsapp] = useState(db.settings.whatsapp);
  const [currencySymbol, setCurrencySymbol] = useState(db.settings.currencySymbol || "₹");
  const [defaultGstRate, setDefaultGstRate] = useState<number>(db.settings.defaultGstRate || 5);

  // Operator state
  const [operatorName, setOperatorName] = useState(db.session.name);
  const [operatorRole, setOperatorRole] = useState(db.session.role);
  const [avatarUrl, setAvatarUrl] = useState(db.session.avatarUrl);

  // Image Upload Handlers (converts local files to Base64)
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1.5 * 1024 * 1024) {
      showToast("Selected image is too large. Keep file size under 1.5 MB to avoid storage limits.", "warning");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setLogoUrl(event.target.result as string);
        showToast("Company logo loaded from device successfully.", "success");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1.5 * 1024 * 1024) {
      showToast("Selected avatar is too large. Keep file size under 1.5 MB to avoid storage limits.", "warning");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setAvatarUrl(event.target.result as string);
        showToast("Operator avatar loaded from device successfully.", "success");
      }
    };
    reader.readAsDataURL(file);
  };

  // Check if form is dirty (has unsaved changes)
  const isOfficeDirty =
    companyName !== db.settings.name ||
    logoUrl !== db.settings.logoUrl ||
    gstNumber !== db.settings.gstNumber ||
    address !== db.settings.address ||
    email !== db.settings.email ||
    phone !== db.settings.phone ||
    whatsapp !== db.settings.whatsapp ||
    currencySymbol !== (db.settings.currencySymbol || "₹") ||
    defaultGstRate !== (db.settings.defaultGstRate || 5);

  const isOperatorDirty =
    operatorName !== db.session.name ||
    operatorRole !== db.session.role ||
    avatarUrl !== db.session.avatarUrl;

  const handleSaveOffice = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!companyName.trim()) {
      showToast("Agency Registered Name is required", "warning");
      return;
    }

    const updatedSettings: CompanySettings = {
      name: companyName.trim(),
      logoUrl: logoUrl.trim(),
      gstNumber: gstNumber.trim().toUpperCase(),
      address: address.trim(),
      email: email.trim(),
      phone: phone.trim(),
      whatsapp: whatsapp.trim(),
      currencySymbol,
      defaultGstRate
    };

    onUpdateDb({
      ...db,
      settings: updatedSettings
    });

    showToast("Office & billing settings saved successfully.", "success");
  };

  const handleSaveOperator = (e: React.FormEvent) => {
    e.preventDefault();

    if (!operatorName.trim()) {
      showToast("Operator Name is required", "warning");
      return;
    }

    const updatedSession: UserSession = {
      id: db.session.id,
      name: operatorName.trim(),
      email: db.session.email,
      role: operatorRole as UserRole,
      avatarUrl: avatarUrl.trim()
    };

    // Find the employee that matches the session
    const sessionEmployee = db.employees.find(emp => emp.id === db.session.id);
    
    // Update the employee record (this is what persists to database)
    const updatedEmployees = sessionEmployee 
      ? db.employees.map(emp => 
          emp.id === db.session.id 
            ? { ...emp, name: operatorName.trim(), role: operatorRole, avatarUrl: avatarUrl.trim() }
            : emp
        )
      : [
          // If no matching employee exists, create one
          {
            id: db.session.id,
            name: operatorName.trim(),
            email: db.session.email,
            phone: '',
            role: operatorRole,
            salary: 0,
            joiningDate: new Date().toISOString().split('T')[0],
            status: 'Active' as const,
            avatarUrl: avatarUrl.trim()
          },
          ...db.employees
        ];

    onUpdateDb({
      ...db,
      session: updatedSession,
      employees: updatedEmployees  // Update employees array so it saves to Supabase
    });

    showToast("Operator profile credentials saved successfully.", "success");
  };

  const handleResetDatabase = () => {
    if (window.confirm("Are you absolutely sure you want to restore all ERP database states to their original seed settings? This will overwrite all modifications, new bookings, customer records, and ledger invoice files.")) {
      const restoredDb: ErpDatabase = {
        settings: defaultCompanySettings,
        session: defaultUserSession,
        employees: initialEmployees,
        leads: initialLeads,
        customers: initialCustomers,
        drivers: initialDrivers,
        vehicles: initialVehicles,
        trips: initialTrips,
        invoices: initialInvoices,
        payments: initialPayments,
        expenses: initialExpenses,
        notifications: [
          {
            id: `sys-reset-${Date.now()}`,
            title: "Database State Reinitialized",
            message: "ERP state engine restored back to default system specifications.",
            type: "info",
            timestamp: new Date().toLocaleTimeString(),
            read: false
          },
          ...initialNotifications
        ]
      };

      onUpdateDb(restoredDb);
      
      // Update form fields instantly
      setCompanyName(defaultCompanySettings.name);
      setLogoUrl(defaultCompanySettings.logoUrl);
      setGstNumber(defaultCompanySettings.gstNumber);
      setAddress(defaultCompanySettings.address);
      setEmail(defaultCompanySettings.email);
      setPhone(defaultCompanySettings.phone);
      setWhatsapp(defaultCompanySettings.whatsapp);
      setCurrencySymbol(defaultCompanySettings.currencySymbol || "₹");
      setDefaultGstRate(defaultCompanySettings.defaultGstRate || 5);

      setOperatorName(defaultUserSession.name);
      setOperatorRole(defaultUserSession.role);
      setAvatarUrl(defaultUserSession.avatarUrl);

      showToast("ERP Database restored successfully back to manufacturer specifications.", "success");
    }
  };

  const handleDeleteAllRecords = () => {
    if (window.confirm("⚠️ WARNING: This will PERMANENTLY DELETE all records (trips, customers, drivers, vehicles, payments, invoices, expenses).\n\nSettings and employees will be preserved.\n\nThis action CANNOT be undone!\n\nAre you absolutely sure?")) {
      if (window.confirm("FINAL CONFIRMATION: All your data will be lost forever. Click OK to proceed or Cancel to abort.")) {
        const clearedDb: ErpDatabase = {
          settings: db.settings, // Preserve settings
          session: db.session, // Preserve session
          employees: db.employees, // Preserve employees
          leads: [], // Clear all leads
          customers: [], // Clear all customers
          drivers: [], // Clear all drivers
          vehicles: [], // Clear all vehicles
          trips: [], // Clear all trips
          invoices: [], // Clear all invoices
          payments: [], // Clear all payments
          expenses: [], // Clear all expenses
          notifications: [
            {
              id: `sys-clear-${Date.now()}`,
              title: "All Records Deleted",
              message: "All trips, customers, drivers, vehicles, payments, invoices, and expenses have been permanently deleted. Settings and employees preserved.",
              type: "warning",
              timestamp: new Date().toISOString(),
              read: false
            }
          ]
        };

        onUpdateDb(clearedDb);
        showToast("✅ All records have been permanently deleted. Settings and employees preserved.", "success");
      }
    }
  };

  const handleExportBackup = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(db, null, 2));
      const downloadAnchor = document.createElement("a");
      const timestamp = new Date().toISOString().slice(0, 10);
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `eagletravels_erp_backup_${timestamp}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast("Database backup file (.json) downloaded successfully.", "success");
    } catch (e) {
      showToast("Failed to compile database backup download.", "warning");
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const file = e.target.files?.[0];
    if (!file) return;

    fileReader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        
        // Basic schema verification
        if (parsed && typeof parsed === "object" && parsed.settings && parsed.session && Array.isArray(parsed.customers) && Array.isArray(parsed.trips)) {
          onUpdateDb(parsed);
          
          // Hydrate forms
          setCompanyName(parsed.settings.name || "");
          setLogoUrl(parsed.settings.logoUrl || "");
          setGstNumber(parsed.settings.gstNumber || "");
          setAddress(parsed.settings.address || "");
          setEmail(parsed.settings.email || "");
          setPhone(parsed.settings.phone || "");
          setWhatsapp(parsed.settings.whatsapp || "");
          setCurrencySymbol(parsed.settings.currencySymbol || "₹");
          setDefaultGstRate(parsed.settings.defaultGstRate || 5);

          setOperatorName(parsed.session.name || "");
          setOperatorRole(parsed.session.role || "");
          setAvatarUrl(parsed.session.avatarUrl || "");

          showToast("Backup imported successfully. All ledgers and tables restored.", "success");
        } else {
          showToast("Invalid backup file structure. Ensure this is an Eagle Travels ERP JSON backup.", "warning");
        }
      } catch (err) {
        showToast("Error reading the JSON backup file.", "warning");
      }
    };
    fileReader.readAsText(file);
  };

  return (
    <div className="space-y-6" id="settings-view">
      {/* Title Header */}
      <div>
        <h2 className="text-2xl font-bold font-display text-slate-800">System ERP Settings</h2>
        <p className="text-sm text-slate-500">Configure agency contact cards, GST billing rates, default operators, and run data maintenance routines.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-3 bg-white p-4 rounded-2xl border border-slate-100 space-y-1 shadow-xs">
          <button
            onClick={() => setActiveTab("office")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
              activeTab === "office"
                ? "bg-brand-50 text-brand-600 border border-brand-100"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            }`}
          >
            <Building className="w-4 h-4" /> Office Profile
          </button>
          <button
            onClick={() => setActiveTab("operator")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition ${
              activeTab === "operator"
                ? "bg-brand-50 text-brand-600 border border-brand-100"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            }`}
          >
            <User className="w-4 h-4" /> Operator Account
          </button>

          {/* Quick Info Box */}
          <div className="mt-8 pt-4 border-t border-slate-100 text-[10px] text-slate-400 space-y-2.5">
            <p className="font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-slate-300 shrink-0" /> Local Sandbox Engine
            </p>
            <p className="leading-relaxed">All changes are persisted in the browser's localStorage system under keys safe-guarded from external tracking scripts.</p>
          </div>
        </div>

        {/* Content Panel */}
        <div className="lg:col-span-9 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden text-slate-800">
          <AnimatePresence mode="wait">
            {activeTab === "office" && (
              <motion.form
                key="office-form"
                onSubmit={handleSaveOffice}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="divide-y divide-slate-100"
              >
                {/* Header */}
                <div className="p-6 bg-slate-50/50 flex items-center gap-3 border-b border-slate-100">
                  <span className="p-2.5 bg-brand-500/10 rounded-xl text-brand-600 shrink-0">
                    <Building className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">Office & Agency Profile Details</h3>
                    <p className="text-[10px] text-slate-500">Corporate details populated into travel receipts and tax invoices</p>
                  </div>
                </div>

                {/* Form fields */}
                <div className="p-6 space-y-6">
                  {/* Row 1: Name and GST */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Travel Agency Registered Name</label>
                      <input
                        type="text"
                        required
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:bg-white focus:border-brand-500 focus:outline-none transition"
                        placeholder="e.g. Eagle Travels"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Corporate GSTIN Number</label>
                      <input
                        type="text"
                        required
                        value={gstNumber}
                        onChange={(e) => setGstNumber(e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-700 focus:bg-white focus:border-brand-500 focus:outline-none transition"
                        placeholder="e.g. 29AAFCE4321F1ZX"
                      />
                    </div>
                  </div>

                  {/* Row 2: Image Logo and Preview */}
                  <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 flex flex-col sm:flex-row items-center gap-4">
                    <div className="shrink-0 flex flex-col items-center gap-2">
                      <img
                        src={logoUrl || "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=100&h=100&fit=crop&q=80"}
                        alt="Company Logo Preview"
                        className="w-16 h-16 rounded-xl object-cover border border-slate-200 bg-white shadow-xs"
                        onError={(e) => {
                          // Fallback
                          (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=100&h=100&fit=crop&q=80";
                        }}
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-1 w-full space-y-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Corporate Logo Image</label>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            value={logoUrl.startsWith("data:") ? "Local Device Image (Base64)" : logoUrl}
                            onChange={(e) => setLogoUrl(e.target.value)}
                            className="flex-1 px-3.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:border-brand-500 focus:outline-none transition"
                            placeholder="https://images.unsplash.com/... (or choose file below)"
                            disabled={logoUrl.startsWith("data:")}
                          />
                          <div className="relative shrink-0">
                            <input
                              type="file"
                              id="logo-file-upload"
                              accept="image/*"
                              onChange={handleLogoUpload}
                              className="hidden"
                            />
                            <label
                              htmlFor="logo-file-upload"
                              className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-600 border border-brand-200 rounded-lg text-xs font-bold transition cursor-pointer text-center font-sans"
                            >
                              <Upload className="w-3.5 h-3.5" /> Select File
                            </label>
                          </div>
                          {logoUrl.startsWith("data:") && (
                            <button
                              type="button"
                              onClick={() => setLogoUrl("")}
                              className="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg font-bold transition"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-[9px] text-slate-400">Allows you to paste a web URL or select any local JPG, PNG, or SVG image from your phone/desktop.</p>
                    </div>
                  </div>

                  {/* Row 3: Contacts */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Corporate Email Address</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:bg-white focus:border-brand-500 focus:outline-none transition"
                        placeholder="operations@eagletravels.com"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Primary Telephone</label>
                      <input
                        type="text"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:bg-white focus:border-brand-500 focus:outline-none transition"
                        placeholder="+91 80 4912 3000"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">WhatsApp Direct Support No</label>
                      <input
                        type="text"
                        required
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:bg-white focus:border-brand-500 focus:outline-none transition"
                        placeholder="+91 98860 12345"
                      />
                    </div>
                  </div>

                  {/* Row 4: Billing Address */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Registered Corporate Address</label>
                    <textarea
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      rows={2}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:bg-white focus:border-brand-500 focus:outline-none transition resize-none"
                      placeholder="e.g. Premium Plaza, Suite 402, Bangalore"
                    />
                  </div>

                  {/* Row 5: Finance Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Currency Symbol Indicator</label>
                      <input
                        type="text"
                        required
                        maxLength={3}
                        value={currencySymbol}
                        onChange={(e) => setCurrencySymbol(e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-700 focus:bg-white focus:border-brand-500 focus:outline-none transition"
                        placeholder="₹"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Default Invoice GST Rate</label>
                      <select
                        value={defaultGstRate}
                        onChange={(e) => setDefaultGstRate(parseInt(e.target.value) || 0)}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:bg-white focus:border-brand-500 focus:outline-none transition"
                      >
                        <option value={0}>0% (Tax Exempted)</option>
                        <option value={5}>5% (Rent-A-Cab Standard)</option>
                        <option value={12}>12% (Travel Agency Logistics)</option>
                        <option value={18}>18% (Executive Business Logistics)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Submit footer */}
                <div className="px-6 py-4 bg-slate-50 flex items-center justify-between shrink-0">
                  <div className="text-[11px] text-slate-400 italic">
                    {isOfficeDirty ? "🔴 Unsaved Office configuration changes detected!" : "✨ Settings match actual state."}
                  </div>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-5 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    <Save className="w-4 h-4" /> Save Office Settings
                  </button>
                </div>
              </motion.form>
            )}

            {activeTab === "operator" && (
              <motion.form
                key="operator-form"
                onSubmit={handleSaveOperator}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="divide-y divide-slate-100"
              >
                {/* Header */}
                <div className="p-6 bg-slate-50/50 flex items-center gap-3 border-b border-slate-100">
                  <span className="p-2.5 bg-brand-500/10 rounded-xl text-brand-600 shrink-0">
                    <User className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">Active Operator Profile Account</h3>
                    <p className="text-[10px] text-slate-500">Configure current operator name, designation details and avatar</p>
                  </div>
                </div>

                {/* Form fields */}
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Operator Profile Name</label>
                      <input
                        type="text"
                        required
                        value={operatorName}
                        onChange={(e) => setOperatorName(e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:bg-white focus:border-brand-500 focus:outline-none transition"
                        placeholder="e.g. Mr. Rajeev Kumar"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Security / Staff Role Designation</label>
                      <select
                        value={operatorRole}
                        onChange={(e) => setOperatorRole(e.target.value as UserRole)}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:bg-white focus:border-brand-500 focus:outline-none transition"
                      >
                        <option value={UserRole.OWNER}>Owner / Administrator</option>
                        <option value={UserRole.ADMIN}>System Admin</option>
                        <option value={UserRole.OPERATIONS_MANAGER}>Operations Manager</option>
                        <option value={UserRole.OFFICE_STAFF}>Office Staff / Dispatcher</option>
                      </select>
                    </div>
                  </div>

                  {/* Profile Image & URL */}
                  <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 flex flex-col sm:flex-row items-center gap-4">
                    <div className="shrink-0 flex flex-col items-center gap-2">
                      <img
                        src={avatarUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&q=80"}
                        alt="Operator Avatar"
                        className="w-16 h-16 rounded-xl object-cover border border-slate-200 bg-white shadow-xs"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&q=80";
                        }}
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-1 w-full space-y-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Operator Profile Image</label>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            value={avatarUrl.startsWith("data:") ? "Local Device Image (Base64)" : avatarUrl}
                            onChange={(e) => setAvatarUrl(e.target.value)}
                            className="flex-1 px-3.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:border-brand-500 focus:outline-none transition"
                            placeholder="https://images.unsplash.com/... (or choose file below)"
                            disabled={avatarUrl.startsWith("data:")}
                          />
                          <div className="relative shrink-0">
                            <input
                              type="file"
                              id="avatar-file-upload"
                              accept="image/*"
                              onChange={handleAvatarUpload}
                              className="hidden"
                            />
                            <label
                              htmlFor="avatar-file-upload"
                              className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-600 border border-brand-200 rounded-lg text-xs font-bold transition cursor-pointer text-center font-sans"
                            >
                              <Upload className="w-3.5 h-3.5" /> Select File
                            </label>
                          </div>
                          {avatarUrl.startsWith("data:") && (
                            <button
                              type="button"
                              onClick={() => setAvatarUrl("")}
                              className="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg font-bold transition"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-[9px] text-slate-400">Allows you to paste a web URL or select any local JPG or PNG photo file from your phone/desktop.</p>
                    </div>
                  </div>
                </div>

                {/* Submit footer */}
                <div className="px-6 py-4 bg-slate-50 flex items-center justify-between shrink-0">
                  <div className="text-[11px] text-slate-400 italic">
                    {isOperatorDirty ? "🔴 Unsaved Account configuration changes detected!" : "✨ Settings match actual state."}
                  </div>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-5 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    <Save className="w-4 h-4" /> Save Account Settings
                  </button>
                </div>
              </motion.form>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
