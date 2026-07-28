import React, { useState } from "react";
import { useToasts } from "./Toast";
import {
  ErpDatabase,
  Driver,
  Trip
} from "../types";
import {
  Search,
  Plus,
  Phone,
  PhoneCall,
  Mail,
  Award,
  Calendar,
  Check,
  X,
  MapPin,
  Star,
  FileText,
  BadgeAlert,
  Sliders,
  DollarSign,
  ChevronRight,
  Download,
  Upload,
  ArrowLeft
} from "lucide-react";
import { exportDriversToCsv } from "../utils/csvExport";

interface DriversViewProps {
  db: ErpDatabase;
  onUpdateDb: (updatedDb: ErpDatabase) => void;
}

export function DriversView({ db, onUpdateDb }: DriversViewProps) {
  const { showToast } = useToasts();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDriverId, setSelectedDriverId] = useState<string>(db.drivers[0]?.id || "");
  const [showAddForm, setShowAddForm] = useState(false);
  const [mobileShowDetails, setMobileShowDetails] = useState(false);

  // New Driver Form State
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    licenseNumber: "",
    aadharNumber: "",
    panNumber: "",
    address: "",
    salary: 25000,
    emergencyContactName: "",
    emergencyContactPhone: "",
    photoUrl: ""
  });

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1.5 * 1024 * 1024) {
      showToast("Selected image is too large. Keep file size under 1.5 MB.", "warning");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setFormData(prev => ({ ...prev, photoUrl: event.target!.result as string }));
        showToast("Driver portrait loaded successfully from your device.", "success");
      }
    };
    reader.readAsDataURL(file);
  };

  const selectedDriver = db.drivers.find(d => d.id === selectedDriverId);

  // Filter drivers list
  const filteredDrivers = db.drivers.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.phone.includes(searchTerm) ||
    d.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const driverTrips = db.trips.filter(t => t.driverId === selectedDriverId);

  // Create Driver Profile
  const handleCreateDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.licenseNumber) {
      showToast("Please enter Name, Phone, and Driving License number.", "warning");
      return;
    }

    const newDriver: Driver = {
      id: `DRV-${Math.floor(100 + Math.random() * 900)}`,
      name: formData.name,
      photoUrl: formData.photoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&q=80",
      licenseNumber: formData.licenseNumber,
      aadharNumber: formData.aadharNumber,
      panNumber: formData.panNumber,
      phone: formData.phone,
      email: formData.email,
      address: formData.address,
      salary: Number(formData.salary),
      emergencyContactName: formData.emergencyContactName,
      emergencyContactPhone: formData.emergencyContactPhone,
      documents: [],
      isAvailable: true,
      ratings: [5],
      attendance: {}
    };

    onUpdateDb({
      ...db,
      drivers: [newDriver, ...db.drivers]
    });

    setFormData({
      name: "",
      phone: "",
      email: "",
      licenseNumber: "",
      aadharNumber: "",
      panNumber: "",
      address: "",
      salary: 25000,
      emergencyContactName: "",
      emergencyContactPhone: "",
      photoUrl: ""
    });
    setSelectedDriverId(newDriver.id);
    setShowAddForm(false);
  };

  // Toggle current availability
  const handleToggleAvailability = () => {
    if (!selectedDriver) return;

    const updated = db.drivers.map(d => {
      if (d.id === selectedDriver.id) {
        return {
          ...d,
          isAvailable: !d.isAvailable
        };
      }
      return d;
    });

    onUpdateDb({
      ...db,
      drivers: updated
    });
  };

  // Mark Daily Attendance
  const handleMarkAttendance = (dateStr: string, status: "Present" | "Absent" | "Leave") => {
    if (!selectedDriver) return;

    const updated = db.drivers.map(d => {
      if (d.id === selectedDriver.id) {
        return {
          ...d,
          attendance: {
            ...d.attendance,
            [dateStr]: status
          }
        };
      }
      return d;
    });

    onUpdateDb({
      ...db,
      drivers: updated
    });
  };

  return (
    <div className="space-y-6" id="drivers-view">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display text-slate-800">Fleet Crew Registry</h2>
          <p className="text-sm text-slate-500">Manage driving profiles, salaries, emergency contacts, licenses, and attendance logs.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              exportDriversToCsv(db.drivers);
              showToast("Fleet crew directory exported to CSV successfully!", "success");
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl shadow-xs transition cursor-pointer"
            title="Export all driver records to CSV"
            id="export-drivers-csv"
          >
            <Download className="w-4 h-4 text-slate-500" /> Export CSV
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold rounded-xl shadow-sm transition"
            id="add-driver-btn"
          >
            <Plus className="w-4 h-4" /> Enlist Crew Member
          </button>
        </div>
      </div>

      {/* Add driver Form Slide down */}
      {showAddForm && (
        <form onSubmit={handleCreateDriver} className="bg-white rounded-2xl p-6 border border-brand-100 shadow-md grid grid-cols-1 md:grid-cols-3 gap-5 animate-fade-in" id="add-driver-form">
          <div className="md:col-span-3">
            <h3 className="text-lg font-bold font-display text-slate-800">Driver Enlistment Worksheet</h3>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Full Name *</label>
            <input
              type="text"
              placeholder="e.g., Gurmukh Singh"
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
              placeholder="+91..."
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
              placeholder="driver@eagletravels.com"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Driving License No. *</label>
            <input
              type="text"
              placeholder="e.g., KA03202..."
              required
              value={formData.licenseNumber}
              onChange={e => setFormData({ ...formData, licenseNumber: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:border-brand-500 focus:outline-none font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Aadhar Card Number</label>
            <input
              type="text"
              placeholder="12 digit uid"
              value={formData.aadharNumber}
              onChange={e => setFormData({ ...formData, aadharNumber: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:border-brand-500 focus:outline-none font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">PAN Number</label>
            <input
              type="text"
              placeholder="Permanent Tax ID"
              value={formData.panNumber}
              onChange={e => setFormData({ ...formData, panNumber: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:border-brand-500 focus:outline-none font-mono"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-500 uppercase">Driver Profile Photo</label>
            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Paste Unsplash/web link..."
                  value={formData.photoUrl}
                  onChange={e => setFormData({ ...formData, photoUrl: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50/50 focus:bg-white focus:border-brand-500 focus:outline-none"
                />
              </div>
              <label className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-800 border border-slate-200 rounded-lg cursor-pointer transition text-xs font-medium shrink-0 shadow-3xs active:scale-95">
                <Upload className="w-3.5 h-3.5" />
                <span>Device File</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            </div>
            {formData.photoUrl && (
              <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                <img 
                  src={formData.photoUrl} 
                  alt="Driver preview" 
                  className="w-8 h-8 rounded-full object-cover border border-slate-200"
                  referrerPolicy="no-referrer"
                  onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&q=80" }}
                />
                <span className="text-[10px] text-slate-500 truncate max-w-[150px]">Custom portrait configured</span>
                <button 
                  type="button" 
                  onClick={() => setFormData(prev => ({ ...prev, photoUrl: "" }))} 
                  className="text-slate-400 hover:text-rose-500 ml-auto p-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Agreed Monthly Salary (INR)</label>
            <input
              type="number"
              value={formData.salary}
              onChange={e => setFormData({ ...formData, salary: Number(e.target.value) })}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Emergency Contact Name</label>
            <input
              type="text"
              placeholder="Spouse / Parent Name"
              value={formData.emergencyContactName}
              onChange={e => setFormData({ ...formData, emergencyContactName: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Emergency Contact Phone</label>
            <input
              type="tel"
              placeholder="Contact Number"
              value={formData.emergencyContactPhone}
              onChange={e => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:outline-none"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Residential Home Address</label>
            <input
              type="text"
              placeholder="Enter permanent residential details"
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
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
              id="submit-driver-btn"
            >
              Register Fleet Crew
            </button>
          </div>
        </form>
      )}

      {/* Main split dashboard view */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Drivers roster list (Span 4) */}
        <div className={`bg-white rounded-2xl border border-slate-100 shadow-xs lg:col-span-4 h-[630px] flex-col overflow-hidden ${mobileShowDetails ? "hidden lg:flex" : "flex"}`}>
          <div className="p-4 border-b border-slate-100 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search drivers, licenses..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50/50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-brand-500 focus:outline-none transition"
              />
            </div>
          </div>

          {/* Drivers feed */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredDrivers.map(d => (
              <div
                key={d.id}
                onClick={() => {
                  setSelectedDriverId(d.id);
                  setMobileShowDetails(true);
                }}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  d.id === selectedDriverId
                    ? "border-brand-500 bg-brand-50/30 shadow-2xs"
                    : "border-slate-50 hover:border-slate-100 hover:bg-slate-50/50"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={d.photoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&q=80"}
                    alt={d.name}
                    className="w-10 h-10 rounded-xl object-cover shrink-0 border border-slate-100"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0">
                    <h4 className="font-semibold text-slate-800 text-sm truncate">{d.name}</h4>
                    <p className={`text-[10px] font-bold uppercase mt-0.5 ${d.isAvailable ? 'text-emerald-600' : 'text-indigo-600'}`}>
                      {d.isAvailable ? "● Available" : "● On Dispatch Duty"}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Driver Details Workspace (Span 8) */}
        <div className={`bg-white rounded-2xl border border-slate-100 shadow-xs lg:col-span-8 h-[630px] flex-col overflow-hidden ${!mobileShowDetails ? "hidden lg:flex" : "flex"}`} id="driver-details-panel">
          {/* Mobile Back Header */}
          <div className="lg:hidden p-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
            <button
              type="button"
              onClick={() => setMobileShowDetails(false)}
              className="flex items-center gap-2 text-xs font-bold text-slate-100 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-xl transition cursor-pointer"
              id="mobile-back-driver-list-btn"
            >
              <ArrowLeft className="w-4 h-4 text-brand-400 shrink-0" />
              <span>Back to Drivers Roster</span>
            </button>
            {selectedDriver && (
              <span className="text-[10px] font-mono font-bold text-slate-300 bg-slate-800 px-2 py-1 rounded">
                {selectedDriver.id}
              </span>
            )}
          </div>
          {selectedDriver ? (
            <div className="flex-1 flex flex-col h-full overflow-y-auto p-6 space-y-6">
              {/* Header Profile details */}
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-5 border-b border-slate-100 pb-5 shrink-0">
                <div className="flex items-center gap-4">
                  <img
                    src={selectedDriver.photoUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&q=80"}
                    alt={selectedDriver.name}
                    className="w-16 h-16 rounded-2xl object-cover shrink-0 border border-slate-200 shadow-sm"
                    referrerPolicy="no-referrer"
                  />
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded">
                      ID: {selectedDriver.id}
                    </span>
                    <h3 className="text-xl font-bold font-display text-slate-800 mt-1">
                      {selectedDriver.name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
                      <a
                        href={`tel:${selectedDriver.phone}`}
                        className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition cursor-pointer"
                        title={`Click to call driver ${selectedDriver.name}`}
                      >
                        <PhoneCall className="w-3.5 h-3.5 text-emerald-600" /> Call {selectedDriver.phone}
                      </a>
                      {selectedDriver.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-slate-400" /> {selectedDriver.email}</span>}
                    </div>
                  </div>
                </div>

                {/* Status Toggler */}
                <div className="flex flex-col items-end gap-2 text-xs">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Availability State</span>
                  <button
                    onClick={handleToggleAvailability}
                    className={`px-3 py-1.5 rounded-lg font-semibold border shadow-2xs transition active:scale-95 ${
                      selectedDriver.isAvailable
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/50"
                        : "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100/50"
                    }`}
                  >
                    {selectedDriver.isAvailable ? "Available" : "On Active Duty"}
                  </button>
                </div>
              </div>

              {/* Driver Specs & Credentials Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 shrink-0">
                <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 space-y-3.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Government Credentials</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-slate-500">Driving License</span>
                      <span className="font-mono font-semibold text-slate-800">{selectedDriver.licenseNumber}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-slate-500">Aadhar UID</span>
                      <span className="font-mono font-semibold text-slate-800">{selectedDriver.aadharNumber || "Not Linked"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">PAN Card No.</span>
                      <span className="font-mono font-semibold text-slate-800">{selectedDriver.panNumber || "Not Linked"}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 space-y-3.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1"><Sliders className="w-3.5 h-3.5 text-brand-500" /> Operational Metrics</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-slate-500">Monthly Salary</span>
                      <span className="font-bold text-slate-800 flex items-center"><DollarSign className="w-3 h-3" /> {selectedDriver.salary.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-slate-500">Trips Completed</span>
                      <span className="font-bold text-slate-800">{driverTrips.filter(t => t.status === "Completed").length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Guest Rating</span>
                      <span className="font-bold text-amber-500 flex items-center gap-0.5">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        {(selectedDriver.ratings.reduce((a,b)=>a+b, 0) / selectedDriver.ratings.length).toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Attendance Sheet */}
              <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 space-y-3 shrink-0">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-brand-500" /> Attendance logs (July 2026)</h4>
                <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
                  {["2026-07-08", "2026-07-09", "2026-07-10", "2026-07-11", "2026-07-12"].map(dateStr => {
                    const status = selectedDriver.attendance[dateStr] || "Present";
                    return (
                      <div key={dateStr} className="bg-white p-2.5 rounded-lg border border-slate-100 shadow-2xs text-center space-y-2">
                        <span className="text-[9px] text-slate-400 block font-mono">
                          {dateStr.split('-')[2]} Jul
                        </span>
                        <div className="flex justify-center gap-1">
                          <button
                            onClick={() => handleMarkAttendance(dateStr, "Present")}
                            className={`p-1 rounded text-[9px] font-bold ${status === "Present" ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                            title="Present"
                          >
                            P
                          </button>
                          <button
                            onClick={() => handleMarkAttendance(dateStr, "Leave")}
                            className={`p-1 rounded text-[9px] font-bold ${status === "Leave" ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                            title="Leave"
                          >
                            L
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Emergency info block */}
              <div className="p-4 bg-rose-50/40 border border-rose-100 rounded-xl space-y-2 shrink-0">
                <h4 className="text-xs font-bold text-rose-800 uppercase tracking-wide">Emergency SOS Liaison</h4>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 block">Contact Relation</span>
                    <span className="font-semibold text-slate-700">{selectedDriver.emergencyContactName || "Spouse Liaison"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Contact Phone Number</span>
                    <span className="font-semibold text-slate-700">{selectedDriver.emergencyContactPhone || "+91 99000 12345"}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center text-slate-400 text-sm">
              Select a driver crew profile to review telematics and logs.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
