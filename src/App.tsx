import React, { useState, useEffect } from "react";
import { loadDatabase, loadDatabaseAsync, saveDatabase, saveDatabaseAsync } from "./data/stateManager";
import { ErpDatabase } from "./types";
import { migrateLocalStorageToSupabase, checkSupabaseData } from "./services/migrateData";
import { ToastProvider } from "./components/Toast";
import { DashboardView } from "./components/DashboardView";
import { CustomersView } from "./components/CustomersView";
import { TripsView } from "./components/TripsView";
import { VehiclesView } from "./components/VehiclesView";
import { CalendarView } from "./components/CalendarView";
import { InvoicesView } from "./components/InvoicesView";
import { PaymentsView } from "./components/PaymentsView";
import { ExpensesView } from "./components/ExpensesView";
import { AnalyticsView } from "./components/AnalyticsView";
import { SettingsView } from "./components/SettingsView";
import { LoginView } from "./components/LoginView";

import {
  Compass,
  LayoutDashboard,
  Users,
  Car,
  UserCheck,
  CalendarDays,
  FileText,
  CreditCard,
  TrendingDown,
  BarChart3,
  Settings,
  Bell,
  CheckCircle,
  Menu,
  X,
  LogOut,
  User,
  Clock,
  Briefcase
} from "lucide-react";

import { subscribeToRealtime } from "./services/database";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem("eagle_erp_authenticated") === "true" ||
           sessionStorage.getItem("eagle_erp_authenticated") === "true";
  });

  const handleLogout = () => {
    localStorage.removeItem("eagle_erp_authenticated");
    sessionStorage.removeItem("eagle_erp_authenticated");
    setIsAuthenticated(false);
  };

  const [db, setDb] = useState<ErpDatabase>(loadDatabase());
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [systemTime, setSystemTime] = useState("");
  const [isLoadingSupabase, setIsLoadingSupabase] = useState(true);
  const [showMigrationBanner, setShowMigrationBanner] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);

  // Load data from Supabase on mount & listen to Realtime changes
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let isMounted = true;

    const loadSupabaseData = async () => {
      try {
        // Clear localStorage (we don't use it anymore)
        localStorage.removeItem('eagle_travels_erp_db_v1');
        
        const data = await loadDatabaseAsync();
        if (!isMounted) return;
        setDb(data);
        
        // Check if we need to show migration banner
        const supabaseStatus = await checkSupabaseData();
        if (!isMounted) return;
        if (!supabaseStatus.hasData) {
          setShowMigrationBanner(true);
        }

        // Subscribe to live PostgreSQL database changes across all tables
        const sub = subscribeToRealtime(async () => {
          if (!isMounted) return;
          const freshData = await loadDatabaseAsync();
          if (isMounted) {
            setDb(freshData);
          }
        });

        if (!isMounted) {
          sub();
        } else {
          unsubscribe = sub;
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error loading Supabase data:', error);
        }
      } finally {
        if (isMounted) {
          setIsLoadingSupabase(false);
        }
      }
    };
    
    loadSupabaseData();

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Migrate data from localStorage to Supabase
  const handleMigration = async () => {
    setIsMigrating(true);
    try {
      const result = await migrateLocalStorageToSupabase();
      if (result.success) {
        alert('✅ ' + result.message);
        setShowMigrationBanner(false);
        // Reload data from Supabase
        const data = await loadDatabaseAsync();
        setDb(data);
      } else {
        alert('⚠️ ' + result.message + '\n\nErrors:\n' + (result.errors?.join('\n') || 'Unknown'));
      }
    } catch (error: any) {
      alert('❌ Migration failed: ' + error.message);
    } finally {
      setIsMigrating(false);
    }
  };

  // Update clock for active display
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formattedDate = now.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
      const formattedTime = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
      setSystemTime(`${formattedDate}, ${formattedTime}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateDb = (updatedDb: ErpDatabase) => {
    setDb(updatedDb);
    // Save asynchronously to both localStorage and Supabase
    saveDatabaseAsync(updatedDb).catch(err => {
      console.error('Failed to save to Supabase:', err);
      alert(`⚠️ Failed to save data to database:\n\n${err.message || 'Unknown error'}\n\nPlease check the browser console for details.`);
    });
  };

  // Side navigation definition
  const navigationItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "customers", label: "Customers Directory", icon: Users },
    { id: "trips", label: "Trips Dispatcher", icon: Compass },
    { id: "vehicles", label: "Vehicles Fleet", icon: Car },
    { id: "calendar", label: "Operations Calendar", icon: CalendarDays },
    { id: "invoices", label: "Invoices & GST", icon: FileText },
    { id: "payments", label: "Payments Ledger", icon: CreditCard },
    { id: "expenses", label: "Expenses Log", icon: TrendingDown },
    { id: "analytics", label: "BI Analytics", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: Settings }
  ];

  if (!isAuthenticated) {
    return (
      <ToastProvider>
        <LoginView
          companyName={db.settings.name || "Eagle Travel ERP"}
          logoUrl={db.settings.logoUrl}
          onLoginSuccess={() => setIsAuthenticated(true)}
        />
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans" id="app-root">
        {/* Migration Banner */}
        {showMigrationBanner && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-500 to-brand-500 text-white px-6 py-4 shadow-lg">
          <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm">🚀 Upgrade to Supabase Database</h3>
                <p className="text-xs text-white/90">Migrate your data from browser storage to cloud database for better reliability and multi-device sync.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleMigration}
                disabled={isMigrating}
                className="px-4 py-2 bg-white text-brand-600 rounded-lg font-semibold text-sm hover:bg-white/90 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {isMigrating ? 'Migrating...' : 'Migrate Now'}
              </button>
              <button
                onClick={() => setShowMigrationBanner(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoadingSupabase && (
        <div className="fixed inset-0 z-50 bg-white/80 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mb-4"></div>
            <p className="text-slate-600 font-semibold">Loading from database...</p>
          </div>
        </div>
      )}
      
      {/* Mobile Top Bar */}
      <header className="md:hidden bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between shrink-0 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          {db.settings.logoUrl && db.settings.logoUrl.trim() ? (
            <img
              src={db.settings.logoUrl}
              alt="Logo"
              className="w-9 h-9 object-cover rounded-xl border border-slate-200 bg-white"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="p-2 bg-brand-500 rounded-xl text-white shadow-md">
              <Compass className="w-5 h-5" />
            </span>
          )}
          <span className="font-bold font-display tracking-tight text-slate-800 text-lg">{db.settings.name}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition cursor-pointer"
            title="Logout"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>

          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 hover:bg-slate-50 text-slate-700 rounded-xl transition"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Sidebar Navigation */}
      <aside 
        className={`fixed md:sticky top-0 left-0 bottom-0 z-40 bg-white border-r border-slate-100 flex flex-col justify-between shrink-0 transition-all duration-300 md:translate-x-0 ${
          sidebarCollapsed ? "md:w-20" : "md:w-64"
        } ${
          mobileMenuOpen ? "translate-x-0 w-64" : "-translate-x-full"
        }`}
        id="app-sidebar"
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Brand Header */}
          <div className={`p-4 border-b border-slate-50 shrink-0 flex items-center justify-between ${sidebarCollapsed ? "md:justify-center" : ""}`}>
            <div className="flex items-center gap-2.5 overflow-hidden">
              {db.settings.logoUrl && db.settings.logoUrl.trim() ? (
                <img
                  src={db.settings.logoUrl}
                  alt="Logo"
                  className="w-9 h-9 object-cover rounded-xl border border-slate-200 bg-white shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="p-2 bg-gradient-to-br from-brand-600 to-brand-500 rounded-xl text-white shadow-md shrink-0">
                  <Compass className="w-5 h-5" />
                </span>
              )}
              {!sidebarCollapsed && (
                <div className="min-w-0 transition-all duration-150 animate-fade-in">
                  <h1 className="font-bold font-display tracking-tight text-slate-800 text-sm truncate">{db.settings.name}</h1>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">Enterprise ERP</p>
                </div>
              )}
            </div>

            {/* Minimize button inside sidebar (only visible when expanded on desktop) */}
            {!sidebarCollapsed && (
              <button
                onClick={() => setSidebarCollapsed(true)}
                className="hidden md:flex p-1.5 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-lg transition active:scale-95 cursor-pointer shrink-0"
                title="Collapse Menu"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin">
            {navigationItems.map(item => {
              const IconComponent = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center ${sidebarCollapsed ? "md:justify-center md:px-2" : "gap-3 px-4"} py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                    isActive 
                      ? "bg-brand-50 text-brand-600 shadow-3xs font-semibold" 
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-50/70"
                  }`}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <IconComponent className={`w-4 h-4 shrink-0 ${isActive ? "text-brand-500" : "text-slate-400"}`} />
                  {!sidebarCollapsed && <span className="animate-fade-in whitespace-nowrap truncate">{item.label}</span>}
                </button>
              );
            })}
          </nav>

          {/* Logged in Employee Account badge footer */}
          <div className="p-3.5 border-t border-slate-50 shrink-0 bg-slate-50/50 flex items-center justify-between gap-2">
            <div className={`flex items-center ${sidebarCollapsed ? "md:justify-center" : "gap-2.5"} min-w-0`}>
              <img
                src={db.session.avatarUrl}
                alt={db.session.name}
                className="w-9 h-9 rounded-xl object-cover border border-slate-100 shrink-0"
                referrerPolicy="no-referrer"
              />
              {!sidebarCollapsed && (
                <div className="min-w-0 animate-fade-in">
                  <p className="font-bold text-slate-800 text-xs truncate">{db.session.name}</p>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">{db.session.role}</p>
                </div>
              )}
            </div>

            {!sidebarCollapsed && (
              <button
                onClick={handleLogout}
                className="flex items-center justify-center p-2 text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 rounded-xl transition cursor-pointer shrink-0"
                title="Logout from Portal"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Container Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Desktop Admin Header */}
        <header className="hidden md:flex bg-white border-b border-slate-100 h-16 px-8 items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 hover:bg-slate-50 text-slate-500 hover:text-slate-800 rounded-xl transition active:scale-95 flex items-center gap-2 border border-slate-100 cursor-pointer shadow-3xs"
              title={sidebarCollapsed ? "Expand Navigation Menu" : "Collapse Navigation Menu"}
            >
              <Menu className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Menu</span>
            </button>
            <div className="h-4 w-px bg-slate-200"></div>
            <div className="flex items-center gap-2.5 text-slate-500 text-xs font-semibold">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="font-mono tracking-wide">{systemTime}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition cursor-pointer"
                title="Sign Out of Portal"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Dynamic View Workspace Frame */}
        <main className="flex-1 overflow-y-auto p-2 sm:p-5 md:p-8 pb-12 md:pb-8">
          {activeTab === "dashboard" && (
            <DashboardView
              db={db}
              onNavigate={setActiveTab}
              onAddTrip={() => setActiveTab("trips")}
              onAddExpense={() => setActiveTab("expenses")}
              onAddInvoice={() => setActiveTab("invoices")}
              onUpdateDb={handleUpdateDb}
            />
          )}
          {activeTab === "customers" && <CustomersView db={db} onUpdateDb={handleUpdateDb} />}
          {activeTab === "trips" && <TripsView db={db} onUpdateDb={handleUpdateDb} />}
          {activeTab === "vehicles" && <VehiclesView db={db} onUpdateDb={handleUpdateDb} />}
          {activeTab === "calendar" && <CalendarView db={db} />}
          {activeTab === "invoices" && <InvoicesView db={db} onUpdateDb={handleUpdateDb} />}
          {activeTab === "payments" && <PaymentsView db={db} onUpdateDb={handleUpdateDb} />}
          {activeTab === "expenses" && <ExpensesView db={db} onUpdateDb={handleUpdateDb} />}
          {activeTab === "analytics" && <AnalyticsView db={db} />}
          {activeTab === "settings" && <SettingsView db={db} onUpdateDb={handleUpdateDb} />}
        </main>
      </div>
      </div>
    </ToastProvider>
  );
}
