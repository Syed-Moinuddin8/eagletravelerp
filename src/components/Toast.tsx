import React, { useEffect, createContext, useContext } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

export interface ToastType {
  id: string;
  message: string;
  type: "success" | "warning" | "info";
}

interface ToastContainerProps {
  toasts: ToastType[];
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none max-w-sm w-full">
      <AnimatePresence>
        {toasts.map((toast) => {
          let Icon = Info;
          let iconClass = "text-brand-500 bg-brand-50 border-brand-100";
          
          if (toast.type === "success") {
            Icon = CheckCircle2;
            iconClass = "text-emerald-600 bg-emerald-50 border-emerald-100";
          } else if (toast.type === "warning") {
            Icon = AlertTriangle;
            iconClass = "text-amber-600 bg-amber-50 border-amber-100";
          }

          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="bg-white border border-slate-200/80 shadow-lg rounded-2xl p-4 flex items-start gap-3 pointer-events-auto select-none"
            >
              <span className={`p-1.5 rounded-xl border ${iconClass} shrink-0`}>
                <Icon className="w-4 h-4" />
              </span>
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="text-xs font-semibold text-slate-800 leading-normal">
                  {toast.message}
                </p>
              </div>
              <button
                onClick={() => onClose(toast.id)}
                className="p-1 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-lg transition shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

// Global Toast Context
interface ToastContextType {
  showToast: (message: string, type?: "success" | "warning" | "info") => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

// Global Toast Provider Component
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastType[]>([]);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const showToast = (message: string, type: "success" | "warning" | "info" = "info") => {
    // Check if a toast with the exact same message already exists
    setToasts((prev) => {
      const existingToast = prev.find(t => t.message === message && t.type === type);
      if (existingToast) {
        // Don't add duplicate toast
        return prev;
      }
      
      const id = Math.random().toString(36).substring(2, 9);
      const newToast = { id, message, type };
      
      // Auto dismiss after 4 seconds
      setTimeout(() => {
        removeToast(id);
      }, 4000);
      
      return [...prev, newToast];
    });
  };

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  );
}

// Hook to use global toast
export function useToasts() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToasts must be used within ToastProvider");
  }
  return context;
}

// Legacy hook for backward compatibility (deprecated)
export function useToastsLegacy() {
  const [toasts, setToasts] = React.useState<ToastType[]>([]);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const showToast = (message: string, type: "success" | "warning" | "info" = "info") => {
    // Check if a toast with the exact same message already exists
    setToasts((prev) => {
      const existingToast = prev.find(t => t.message === message && t.type === type);
      if (existingToast) {
        // Don't add duplicate toast
        return prev;
      }
      
      const id = Math.random().toString(36).substring(2, 9);
      const newToast = { id, message, type };
      
      // Auto dismiss after 4 seconds
      setTimeout(() => {
        removeToast(id);
      }, 4000);
      
      return [...prev, newToast];
    });
  };

  return {
    toasts,
    showToast,
    removeToast,
    ToastComponent: () => <ToastContainer toasts={toasts} onClose={removeToast} />
  };
}
