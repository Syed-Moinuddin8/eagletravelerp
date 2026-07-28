import React, { useState } from "react";
import { useToasts } from "./Toast";
import {
  ErpDatabase,
  Vehicle
} from "../types";
import {
  Search,
  Plus,
  Car,
  IndianRupee,
  ChevronRight,
  ClipboardList,
  Calculator,
  Percent,
  Settings2,
  DollarSign,
  AlertCircle,
  TrendingUp,
  Download,
  User,
  Calendar,
  Building,
  Briefcase,
  Tag,
  Coins,
  ArrowLeft
} from "lucide-react";
import { exportVehiclesToCsv } from "../utils/csvExport";

interface VehiclesViewProps {
  db: ErpDatabase;
  onUpdateDb: (updatedDb: ErpDatabase) => void;
}

export function VehiclesView({ db, onUpdateDb }: VehiclesViewProps) {
  const { showToast } = useToasts();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVehId, setSelectedVehId] = useState<string>(db.vehicles[0]?.id || "");
  const [showAddForm, setShowAddForm] = useState(false);
  const [isEditingRates, setIsEditingRates] = useState(false);
  const [mobileShowDetails, setMobileShowDetails] = useState(false);

  // Form State for Adding a New Vehicle Rate Slab
  const [formData, setFormData] = useState({
    model: "",
    category: "SUV" as any,
    seats: 7,
    fuelType: "Diesel" as any,
    vehicleNumber: "", // Optional registration plate or dummy
    // Rate Structure
    engage: 3500,
    perKmAcBelow350: 18,
    perKmNonAcBelow350: 16,
    perKmAcAbove350: 20,
    perKmNonAcAbove350: 18,
    driverBata: 500
  });

  // Editing Slabs Form State for Selected Vehicle
  const [editRatesData, setEditRatesData] = useState({
    engage: 0,
    perKmAcBelow350: 0,
    perKmNonAcBelow350: 0,
    perKmAcAbove350: 0,
    perKmNonAcAbove350: 0,
    driverBata: 0
  });

  // Validation errors state
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // Estimator Calculator State - Removed as old rate structure no longer applies
  // const [calcKms, setCalcKms] = useState<number>(300);
  // const [calcDays, setCalcDays] = useState<number>(2);
  // const [calcExtraHours, setCalcExtraHours] = useState<number>(0);
  // const [calcNightHalts, setCalcNightHalts] = useState<number>(1);

  const selectedVeh = db.vehicles.find(v => v.id === selectedVehId);

  // Sync edit state when a new vehicle is selected
  React.useEffect(() => {
    if (selectedVeh) {
      setEditRatesData({
        engage: selectedVeh.engage || 3500,
        perKmAcBelow350: selectedVeh.perKmAcBelow350 || 18,
        perKmNonAcBelow350: selectedVeh.perKmNonAcBelow350 || 16,
        perKmAcAbove350: selectedVeh.perKmAcAbove350 || 20,
        perKmNonAcAbove350: selectedVeh.perKmNonAcAbove350 || 18,
        driverBata: selectedVeh.driverBata || 500
      });
    }
  }, [selectedVehId]);

  // Filter vehicles list based on search
  const filteredVehicles = db.vehicles.filter(v => 
    v.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Create Vehicle with Travel Agency Rates Slab
  const handleCreateVehicleWithRates = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Custom form validation
    const errors: Record<string, string> = {};
    if (!formData.model.trim()) {
      errors.model = "Model specification is required.";
    }
    if (isNaN(formData.seats) || formData.seats <= 0) {
      errors.seats = "Capacity must be a positive integer.";
    }
    if (isNaN(formData.engage) || formData.engage < 0) {
      errors.engage = "Engage rate cannot be negative and must be a valid number.";
    }
    if (isNaN(formData.perKmAcBelow350) || formData.perKmAcBelow350 < 0) {
      errors.perKmAcBelow350 = "AC rate below 350km cannot be negative.";
    }
    if (isNaN(formData.perKmNonAcBelow350) || formData.perKmNonAcBelow350 < 0) {
      errors.perKmNonAcBelow350 = "Non-AC rate below 350km cannot be negative.";
    }
    if (isNaN(formData.perKmAcAbove350) || formData.perKmAcAbove350 < 0) {
      errors.perKmAcAbove350 = "AC rate above 350km cannot be negative.";
    }
    if (isNaN(formData.perKmNonAcAbove350) || formData.perKmNonAcAbove350 < 0) {
      errors.perKmNonAcAbove350 = "Non-AC rate above 350km cannot be negative.";
    }
    if (isNaN(formData.driverBata) || formData.driverBata < 0) {
      errors.driverBata = "Driver bata cannot be negative and must be a valid number.";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      showToast("Please correct the validation errors in the form.", "warning");
      return;
    }

    try {
      // Auto-generate vehicle registration number if not provided
      const plate = formData.vehicleNumber.trim() 
        ? formData.vehicleNumber.toUpperCase() 
        : `KA-03-B2B-${Math.floor(1000 + Math.random() * 9000)}`;

      const newVeh: Vehicle = {
        id: `VEH-${Math.floor(100 + Math.random() * 900)}`,
        vehicleNumber: plate,
        category: formData.category,
        brand: formData.model.split(' ')[0] || formData.category, // Extract first word as brand or use category
        model: formData.model,
        fuelType: formData.fuelType,
        seats: Number(formData.seats),
        isAvailable: true,
        maintenanceHistory: [],
        // Document defaults (minimal mock)
        insuranceExpiry: "2027-01-01",
        fitnessExpiry: "2029-01-01",
        permitExpiry: "2028-01-01",
        pollutionExpiry: "2026-12-31",
        rcNumber: "RC-" + Math.floor(100000 + Math.random() * 900000),
        lastServiceDate: new Date().toISOString().split('T')[0],
        // Rate Structure  
        engage: Number(formData.engage),
        perKmAcBelow350: Number(formData.perKmAcBelow350),
        perKmNonAcBelow350: Number(formData.perKmNonAcBelow350),
        perKmAcAbove350: Number(formData.perKmAcAbove350),
        perKmNonAcAbove350: Number(formData.perKmNonAcAbove350),
        driverBata: Number(formData.driverBata)
      };

      onUpdateDb({
        ...db,
        vehicles: [newVeh, ...db.vehicles]
      });

      // Reset Form
      setFormData({
        model: "",
        category: "SUV",
        seats: 7,
        fuelType: "Diesel",
        vehicleNumber: "",
        engage: 3500,
        perKmAcBelow350: 18,
        perKmNonAcBelow350: 16,
        perKmAcAbove350: 20,
        perKmNonAcAbove350: 18,
        driverBata: 500
      });

      setFormErrors({});
      setSelectedVehId(newVeh.id);
      setShowAddForm(false);
      showToast(`${formData.model} travel agency rates registered successfully!`, "success");
    } catch (error: any) {
      console.error('Error creating vehicle:', error);
      showToast(`Failed to create vehicle: ${error.message || 'Unknown error'}`, "error");
    }
  };

  // Update rates for selected vehicle
  const handleSaveUpdatedRates = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVeh) return;

    const updated = db.vehicles.map(v => {
      if (v.id === selectedVeh.id) {
        return {
          ...v,
          engage: Number(editRatesData.engage),
          perKmAcBelow350: Number(editRatesData.perKmAcBelow350),
          perKmNonAcBelow350: Number(editRatesData.perKmNonAcBelow350),
          perKmAcAbove350: Number(editRatesData.perKmAcAbove350),
          perKmNonAcAbove350: Number(editRatesData.perKmNonAcAbove350),
          driverBata: Number(editRatesData.driverBata)
        };
      }
      return v;
    });

    onUpdateDb({
      ...db,
      vehicles: updated
    });

    setIsEditingRates(false);
    showToast(`Updated B2B Agency rate slabs for ${selectedVeh.model}!`, "success");
  };

  return (
    <div className="space-y-6" id="vehicles-view">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-3xs">
        <div>
          <h2 className="text-2xl font-bold font-display text-slate-800">Travel Agency Fleet & Rates Desk</h2>
          <p className="text-sm text-slate-500">Configure B2B agency pricing slabs, minimum mileage limits, daily driver allowance parameters, and estimate rentals.</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => {
              // Export custom rates with CSV helper
              const exportable = db.vehicles.map(v => {
                return {
                  "Vehicle ID": v.id,
                  "Category": v.category,
                  "Brand": v.brand,
                  "Model": v.model,
                  "Seating Capacity": v.seats,
                  "Engage (₹)": v.engage || 0,
                  "AC Rate Below 350km (₹/KM)": v.perKmAcBelow350 || 0,
                  "Non-AC Rate Below 350km (₹/KM)": v.perKmNonAcBelow350 || 0,
                  "AC Rate Above 350km (₹/KM)": v.perKmAcAbove350 || 0,
                  "Non-AC Rate Above 350km (₹/KM)": v.perKmNonAcAbove350 || 0,
                  "Driver Bata (₹/Day)": v.driverBata || 0,
                  "Registration Number": v.vehicleNumber
                };
              });
              exportVehiclesToCsv(exportable as any);
              showToast("B2B travel agency rate sheet exported to CSV successfully!", "success");
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
            title="Export all B2B vehicle rates to CSV"
            id="export-vehicles-csv"
          >
            <Download className="w-4 h-4 text-slate-500" /> Export Rates Sheet
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold rounded-xl shadow-sm transition"
            id="add-vehicle-btn"
          >
            <Plus className="w-4 h-4" /> Add Vehicle Rate Slab
          </button>
        </div>
      </div>

      {/* Slide Down Form for Registering New Agency Slabs */}
      {showAddForm && (
        <form onSubmit={handleCreateVehicleWithRates} className="bg-white rounded-2xl p-6 border border-brand-100 shadow-md grid grid-cols-1 md:grid-cols-3 gap-5 animate-fade-in" id="add-vehicle-form">
          <div className="md:col-span-3 border-b border-slate-100 pb-3 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold font-display text-slate-800">Add B2B Agency Fleet Class & Rate Slab</h3>
              <p className="text-xs text-slate-400">Establish standard travel agency pricing limits and record acquisition/ownership details.</p>
            </div>
            <span className="text-xs font-mono font-bold bg-brand-50 text-brand-600 px-2.5 py-1 rounded-full">New Slabs</span>
          </div>

          {/* Identification Section */}
          <div className="space-y-4 md:col-span-1 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">1. Vehicle Category & Model</span>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Model Specification *</label>
              <input
                type="text"
                placeholder="e.g., Innova Hycross"
                required
                value={formData.model}
                onChange={e => handleInputChange("model", e.target.value)}
                className={`w-full px-3 py-1.5 border rounded-lg text-xs bg-white focus:outline-none transition ${
                  formErrors.model 
                    ? "border-red-400 focus:border-red-500 ring-1 ring-red-100" 
                    : "border-slate-200 focus:border-brand-500"
                }`}
              />
              {formErrors.model && (
                <p className="text-[10px] text-red-500 mt-1 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" /> {formErrors.model}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Fleet Class</label>
                <select
                  value={formData.category}
                  onChange={e => handleInputChange("category", e.target.value as any)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 focus:outline-none"
                >
                  <option value="Sedan">Sedan</option>
                  <option value="SUV">SUV</option>
                  <option value="Tempo Traveller">Tempo Traveller</option>
                  <option value="Luxury Bus">Luxury Bus</option>
                  <option value="Mini Bus">Mini Bus</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Capacity (Seats)</label>
                <input
                  type="number"
                  value={formData.seats}
                  onChange={e => handleInputChange("seats", Number(e.target.value))}
                  className={`w-full px-2.5 py-1.5 border rounded-lg text-xs bg-white focus:outline-none transition ${
                    formErrors.seats 
                      ? "border-red-400 focus:border-red-500 ring-1 ring-red-100" 
                      : "border-slate-200 focus:border-brand-500"
                  }`}
                />
                {formErrors.seats && (
                  <p className="text-[10px] text-red-500 mt-1 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" /> {formErrors.seats}
                  </p>
                )}
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Optional Plate/Identifier</label>
              <input
                type="text"
                placeholder="e.g., KA-03-F-1234"
                value={formData.vehicleNumber}
                onChange={e => handleInputChange("vehicleNumber", e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:border-brand-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Pricing Section (Takes 2 Columns) */}
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
            <div className="sm:col-span-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">2. Travel Agency B2B Rental Rates Slabs</span>
            </div>
            
            {/* Engage Rate */}
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase">Engage (Base Pack Rate) (₹) *</label>
              <input
                type="number"
                required
                value={formData.engage}
                onChange={e => handleInputChange("engage", Number(e.target.value))}
                className={`w-full px-3 py-1.5 border rounded-lg text-xs bg-white focus:outline-none font-mono font-bold transition ${
                  formErrors.engage 
                    ? "border-red-400 focus:border-red-500 ring-1 ring-red-100" 
                    : "border-slate-200 focus:border-brand-500"
                }`}
              />
              {formErrors.engage && (
                <p className="text-[10px] text-red-500 mt-1 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" /> {formErrors.engage}
                </p>
              )}
            </div>

            {/* Rates Below 350 KM Section */}
            <div className="sm:col-span-2 mt-2">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">Rates Below 350 KM</span>
            </div>
            
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase">AC Rate (₹/KM) *</label>
              <input
                type="number"
                step="0.1"
                required
                value={formData.perKmAcBelow350}
                onChange={e => handleInputChange("perKmAcBelow350", Number(e.target.value))}
                className={`w-full px-3 py-1.5 border rounded-lg text-xs bg-white focus:outline-none font-mono font-bold transition ${
                  formErrors.perKmAcBelow350 
                    ? "border-red-400 focus:border-red-500 ring-1 ring-red-100" 
                    : "border-slate-200 focus:border-brand-500"
                }`}
              />
              {formErrors.perKmAcBelow350 && (
                <p className="text-[10px] text-red-500 mt-1 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" /> {formErrors.perKmAcBelow350}
                </p>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase">Non-AC Rate (₹/KM) *</label>
              <input
                type="number"
                step="0.1"
                required
                value={formData.perKmNonAcBelow350}
                onChange={e => handleInputChange("perKmNonAcBelow350", Number(e.target.value))}
                className={`w-full px-3 py-1.5 border rounded-lg text-xs bg-white focus:outline-none font-mono font-bold transition ${
                  formErrors.perKmNonAcBelow350 
                    ? "border-red-400 focus:border-red-500 ring-1 ring-red-100" 
                    : "border-slate-200 focus:border-brand-500"
                }`}
              />
              {formErrors.perKmNonAcBelow350 && (
                <p className="text-[10px] text-red-500 mt-1 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" /> {formErrors.perKmNonAcBelow350}
                </p>
              )}
            </div>

            {/* Rates Above 350 KM Section */}
            <div className="sm:col-span-2 mt-2">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Rates Above 350 KM</span>
            </div>
            
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase">AC Rate (₹/KM) *</label>
              <input
                type="number"
                step="0.1"
                required
                value={formData.perKmAcAbove350}
                onChange={e => handleInputChange("perKmAcAbove350", Number(e.target.value))}
                className={`w-full px-3 py-1.5 border rounded-lg text-xs bg-white focus:outline-none font-mono font-bold transition ${
                  formErrors.perKmAcAbove350 
                    ? "border-red-400 focus:border-red-500 ring-1 ring-red-100" 
                    : "border-slate-200 focus:border-brand-500"
                }`}
              />
              {formErrors.perKmAcAbove350 && (
                <p className="text-[10px] text-red-500 mt-1 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" /> {formErrors.perKmAcAbove350}
                </p>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase">Non-AC Rate (₹/KM) *</label>
              <input
                type="number"
                step="0.1"
                required
                value={formData.perKmNonAcAbove350}
                onChange={e => handleInputChange("perKmNonAcAbove350", Number(e.target.value))}
                className={`w-full px-3 py-1.5 border rounded-lg text-xs bg-white focus:outline-none font-mono font-bold transition ${
                  formErrors.perKmNonAcAbove350 
                    ? "border-red-400 focus:border-red-500 ring-1 ring-red-100" 
                    : "border-slate-200 focus:border-brand-500"
                }`}
              />
              {formErrors.perKmNonAcAbove350 && (
                <p className="text-[10px] text-red-500 mt-1 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" /> {formErrors.perKmNonAcAbove350}
                </p>
              )}
            </div>

            {/* Driver Bata */}
            <div className="sm:col-span-2 mt-2">
              <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase">Driver Bata (Daily Allowance) (₹) *</label>
              <input
                type="number"
                required
                value={formData.driverBata}
                onChange={e => handleInputChange("driverBata", Number(e.target.value))}
                className={`w-full px-3 py-1.5 border rounded-lg text-xs bg-white focus:outline-none font-mono font-bold transition ${
                  formErrors.driverBata 
                    ? "border-red-400 focus:border-red-500 ring-1 ring-red-100" 
                    : "border-slate-200 focus:border-brand-500"
                }`}
              />
              {formErrors.driverBata && (
                <p className="text-[10px] text-red-500 mt-1 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" /> {formErrors.driverBata}
                </p>
              )}
            </div>
          </div>

          <div className="md:col-span-2 flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs rounded-xl shadow-sm transition cursor-pointer"
              id="submit-veh-btn"
            >
              Register Vehicle & Rate Slabs
            </button>
          </div>
        </form>
      )}

      {/* Main split dashboard view */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fade-in">
        {/* Left Column: Fleet ledger rate cards list (Span 4) */}
        <div className={`bg-white rounded-2xl border border-slate-100 shadow-xs lg:col-span-4 h-[650px] flex-col overflow-hidden ${mobileShowDetails ? "hidden lg:flex" : "flex"}`}>
          <div className="p-4 border-b border-slate-100 shrink-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Fleet Category Selection</span>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search class or category..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50/50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:border-brand-500 focus:outline-none transition"
              />
            </div>
          </div>

          {/* Vehicles list */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredVehicles.map(v => {
              return (
                <div
                  key={v.id}
                  onClick={() => {
                    setSelectedVehId(v.id);
                    setMobileShowDetails(true);
                  }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex justify-between items-center ${
                    v.id === selectedVehId
                      ? "border-brand-500 bg-brand-50/30 shadow-2xs"
                      : "border-slate-50 hover:border-slate-100 hover:bg-slate-50/50"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[8px] font-bold uppercase rounded font-mono">
                        {v.category}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-800 text-xs">{v.model}</h4>
                    <p className="text-[10px] font-bold text-brand-600 font-mono">
                      Engage: {db.settings?.currencySymbol || "₹"}{v.engage || 0}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Vehicle Travel Agency Rates Dashboard & Calculator (Span 8) */}
        <div className={`bg-white rounded-2xl border border-slate-100 shadow-xs lg:col-span-8 h-[650px] flex-col overflow-hidden ${!mobileShowDetails ? "hidden lg:flex" : "flex"}`} id="vehicle-details-panel">
          {/* Mobile Back Header */}
          <div className="lg:hidden p-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
            <button
              type="button"
              onClick={() => setMobileShowDetails(false)}
              className="flex items-center gap-2 text-xs font-bold text-slate-100 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-xl transition cursor-pointer"
              id="mobile-back-vehicle-list-btn"
            >
              <ArrowLeft className="w-4 h-4 text-brand-400 shrink-0" />
              <span>Back to Fleet Categories</span>
            </button>
            {selectedVeh && (
              <span className="text-[10px] font-mono font-bold text-slate-300 bg-slate-800 px-2 py-1 rounded">
                {selectedVeh.model}
              </span>
            )}
          </div>
          {selectedVeh ? (
            <div className="flex-1 flex flex-col h-full overflow-y-auto p-6 space-y-6">
              {/* Header profile details */}
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-5 border-b border-slate-100 pb-5 shrink-0">
                <div className="flex items-center gap-4">
                  <span className="p-3 bg-brand-50 rounded-2xl text-brand-500 shrink-0">
                    <Car className="w-8 h-8" />
                  </span>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-md uppercase tracking-wide">
                        B2B Class: {selectedVeh.category}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md uppercase font-mono">
                        {selectedVeh.seats} Seats • {selectedVeh.fuelType}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold font-display text-slate-800">
                      {selectedVeh.model}
                    </h3>
                  </div>
                </div>

                <button
                  onClick={() => setIsEditingRates(!isEditingRates)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
                >
                  <Settings2 className="w-3.5 h-3.5 text-slate-500" />
                  {isEditingRates ? "View Rates" : "Modify Rate Slabs"}
                </button>
              </div>

              {/* Dynamic Rates Sheet View / Rates Edit Mode */}
              {!isEditingRates ? (
                <div className="space-y-6">
                  {/* Agency Rates Bento Grid */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <ClipboardList className="w-4 h-4 text-brand-500" /> B2B Travel Agency Rate Sheet
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {/* Engage Rate */}
                      <div className="sm:col-span-2 md:col-span-3 p-4 bg-gradient-to-br from-brand-50 to-brand-100/30 rounded-2xl border border-brand-200 hover:shadow-md transition text-center space-y-1">
                        <span className="text-[10px] font-bold text-brand-600 uppercase tracking-wide block">Engage (Base Pack Rate)</span>
                        <h5 className="text-2xl font-bold text-brand-700 font-mono">{db.settings?.currencySymbol || "₹"}{selectedVeh.engage || 0}</h5>
                      </div>

                      {/* Rates Below 350 KM Section */}
                      <div className="sm:col-span-2 md:col-span-3">
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block mb-2">Rates Below 350 KM</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 hover:bg-blue-50 transition text-center space-y-1">
                            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wide block">AC Rate</span>
                            <h5 className="text-xl font-bold text-blue-700 font-mono">{db.settings?.currencySymbol || "₹"}{selectedVeh.perKmAcBelow350 || 0} / KM</h5>
                          </div>
                          <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 hover:bg-blue-50 transition text-center space-y-1">
                            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wide block">Non-AC Rate</span>
                            <h5 className="text-xl font-bold text-blue-700 font-mono">{db.settings?.currencySymbol || "₹"}{selectedVeh.perKmNonAcBelow350 || 0} / KM</h5>
                          </div>
                        </div>
                      </div>

                      {/* Rates Above 350 KM Section */}
                      <div className="sm:col-span-2 md:col-span-3">
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block mb-2">Rates Above 350 KM</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 hover:bg-emerald-50 transition text-center space-y-1">
                            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wide block">AC Rate</span>
                            <h5 className="text-xl font-bold text-emerald-700 font-mono">{db.settings?.currencySymbol || "₹"}{selectedVeh.perKmAcAbove350 || 0} / KM</h5>
                          </div>
                          <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 hover:bg-emerald-50 transition text-center space-y-1">
                            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wide block">Non-AC Rate</span>
                            <h5 className="text-xl font-bold text-emerald-700 font-mono">{db.settings?.currencySymbol || "₹"}{selectedVeh.perKmNonAcAbove350 || 0} / KM</h5>
                          </div>
                        </div>
                      </div>

                      {/* Driver Bata */}
                      <div className="sm:col-span-2 md:col-span-3 p-4 bg-slate-50/50 rounded-2xl border border-slate-100 hover:bg-slate-50 transition text-center space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Driver Bata (Daily Allowance)</span>
                        <h5 className="text-xl font-bold text-slate-800 font-mono">{db.settings?.currencySymbol || "₹"}{selectedVeh.driverBata || 0} / Day</h5>
                      </div>
                    </div>
                  </div>

                  {/* Note about calculator - optional, can be removed if not needed */}
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">New Rate Structure Active</p>
                        <p className="text-amber-700 mt-1">This vehicle now uses distance-based AC/Non-AC rates. Use these rates when calculating trip quotes based on distance and AC usage.</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Modify Rates Slabs Form */
                <form onSubmit={handleSaveUpdatedRates} className="space-y-5 bg-slate-50/50 rounded-2xl p-6 border border-slate-100 animate-fade-in">
                  <div className="border-b border-slate-200 pb-3">
                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                      <Settings2 className="w-4 h-4 text-brand-500" /> Edit Travel Agency Pricing Slabs
                    </h4>
                    <p className="text-xs text-slate-400">Update rates directly for this vehicle class. These will be used for all future agency dispatches.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Engage */}
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase">Engage (Base Pack Rate) (₹)</label>
                      <input
                        type="number"
                        required
                        value={editRatesData.engage}
                        onChange={e => setEditRatesData({ ...editRatesData, engage: Number(e.target.value) })}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none font-mono font-bold"
                      />
                    </div>

                    {/* Rates Below 350 KM Header */}
                    <div className="md:col-span-2">
                      <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Rates Below 350 KM</span>
                    </div>

                    {/* Below 350 - AC */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase">AC Rate (₹/KM)</label>
                      <input
                        type="number"
                        step="0.1"
                        required
                        value={editRatesData.perKmAcBelow350}
                        onChange={e => setEditRatesData({ ...editRatesData, perKmAcBelow350: Number(e.target.value) })}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none font-mono font-bold"
                      />
                    </div>

                    {/* Below 350 - Non-AC */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase">Non-AC Rate (₹/KM)</label>
                      <input
                        type="number"
                        step="0.1"
                        required
                        value={editRatesData.perKmNonAcBelow350}
                        onChange={e => setEditRatesData({ ...editRatesData, perKmNonAcBelow350: Number(e.target.value) })}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none font-mono font-bold"
                      />
                    </div>

                    {/* Rates Above 350 KM Header */}
                    <div className="md:col-span-2 mt-2">
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Rates Above 350 KM</span>
                    </div>

                    {/* Above 350 - AC */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase">AC Rate (₹/KM)</label>
                      <input
                        type="number"
                        step="0.1"
                        required
                        value={editRatesData.perKmAcAbove350}
                        onChange={e => setEditRatesData({ ...editRatesData, perKmAcAbove350: Number(e.target.value) })}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none font-mono font-bold"
                      />
                    </div>

                    {/* Above 350 - Non-AC */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase">Non-AC Rate (₹/KM)</label>
                      <input
                        type="number"
                        step="0.1"
                        required
                        value={editRatesData.perKmNonAcAbove350}
                        onChange={e => setEditRatesData({ ...editRatesData, perKmNonAcAbove350: Number(e.target.value) })}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none font-mono font-bold"
                      />
                    </div>

                    {/* Driver Bata */}
                    <div className="md:col-span-2 mt-2">
                      <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase">Driver Bata (Daily Allowance) (₹)</label>
                      <input
                        type="number"
                        required
                        value={editRatesData.driverBata}
                        onChange={e => setEditRatesData({ ...editRatesData, driverBata: Number(e.target.value) })}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setIsEditingRates(false)}
                      className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-lg transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs rounded-lg shadow-sm transition"
                    >
                      Apply Updated Slabs
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center text-slate-400 text-xs italic gap-2 p-6">
              <AlertCircle className="w-8 h-8 text-slate-300" />
              Select a vehicle model on the left to inspect or configure its travel agency rate slabs.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
