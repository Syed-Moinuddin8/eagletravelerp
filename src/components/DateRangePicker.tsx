import React, { useState, useRef, useEffect } from "react";
import { 
  format, 
  subDays, 
  startOfYear, 
  isSameDay, 
  isAfter, 
  isBefore, 
  isWithinInterval, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  addMonths, 
  subMonths, 
  getDay,
  parseISO
} from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export interface DateRange {
  from: Date;
  to: Date;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

export function DateRangePicker({ value, onChange, className = "" }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<Date>(value.from || new Date("2026-07-12"));
  
  // Track picking state: "none" | "picking-start" | "picking-end"
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handlePresetSelect = (preset: "7days" | "30days" | "ytd" | "all") => {
    const today = new Date("2026-07-12"); // Fixed ERP operations reference point (July 2026 cycle)
    let from = today;
    let to = today;

    if (preset === "7days") {
      from = subDays(today, 6);
    } else if (preset === "30days") {
      from = subDays(today, 29);
    } else if (preset === "ytd") {
      from = startOfYear(today);
    } else if (preset === "all") {
      from = new Date("2026-01-01");
    }

    onChange({ from, to });
    setCurrentMonth(from);
    setIsOpen(false);
  };

  const handleDayClick = (day: Date) => {
    // If we click and we already have a full range, reset it to select start
    // If we only have start, select end (if end is after start, else make it start)
    if (isSameDay(value.from, value.to)) {
      if (isBefore(day, value.from)) {
        onChange({ from: day, to: value.from });
      } else {
        onChange({ from: value.from, to: day });
      }
      setIsOpen(false); // Close on range completion
    } else {
      onChange({ from: day, to: day });
    }
  };

  const handlePrevMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1));
  };

  // Build calendar days
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Day of week index (0-6) for empty cells
  const startDayOfWeek = getDay(monthStart);
  const blankDays = Array.from({ length: startDayOfWeek });

  const isSelected = (day: Date) => {
    return isSameDay(day, value.from) || isSameDay(day, value.to);
  };

  const isRangeSelected = (day: Date) => {
    try {
      return isWithinInterval(day, { start: value.from, end: value.to });
    } catch {
      return false;
    }
  };

  const isRangeHovered = (day: Date) => {
    if (!hoveredDate || !isSameDay(value.from, value.to)) return false;
    if (isBefore(day, value.from) && isAfter(day, hoveredDate)) return true;
    if (isAfter(day, value.from) && isBefore(day, hoveredDate)) return true;
    return false;
  };

  return (
    <div className={`relative ${className}`} ref={containerRef} id="date-range-picker-container">
      {/* Trigger Button - Shadcn Style */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl shadow-xs transition duration-200 cursor-pointer w-full sm:w-auto justify-between"
        id="date-range-picker-trigger"
      >
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-slate-400" />
          <span>
            {format(value.from, "MMM d, yyyy")} – {format(value.to, "MMM d, yyyy")}
          </span>
        </div>
      </button>

      {/* Date Range Dropdown Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 mt-2 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 overflow-hidden flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-100 min-w-[320px] md:min-w-[520px]"
            id="date-range-picker-popover"
          >
            {/* Quick Presets Menu - Left Rail */}
            <div className="p-4 bg-slate-50 md:w-44 shrink-0 flex flex-col gap-1.5 justify-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Presets</span>
              <button
                type="button"
                onClick={() => handlePresetSelect("7days")}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold hover:bg-slate-200/60 text-slate-700 hover:text-slate-900 transition cursor-pointer"
              >
                Last 7 Days
              </button>
              <button
                type="button"
                onClick={() => handlePresetSelect("30days")}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold hover:bg-slate-200/60 text-slate-700 hover:text-slate-900 transition cursor-pointer"
              >
                Last 30 Days
              </button>
              <button
                type="button"
                onClick={() => handlePresetSelect("ytd")}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold hover:bg-slate-200/60 text-slate-700 hover:text-slate-900 transition cursor-pointer"
              >
                Year-to-Date
              </button>
              <button
                type="button"
                onClick={() => handlePresetSelect("all")}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold hover:bg-slate-200/60 text-slate-700 hover:text-slate-900 transition cursor-pointer"
              >
                All Operations
              </button>
            </div>

            {/* Calendar Core Panel - Right Pane */}
            <div className="p-4 flex-1">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-slate-700">
                  {format(currentMonth, "MMMM yyyy")}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-1 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-500 hover:text-slate-700 transition cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-1 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-500 hover:text-slate-700 transition cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Day Name Row */}
              <div className="grid grid-cols-7 gap-1 text-center mb-1">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(dayName => (
                  <span key={dayName} className="text-[10px] font-bold text-slate-400 uppercase">
                    {dayName}
                  </span>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {blankDays.map((_, idx) => (
                  <div key={`blank-${idx}`} className="h-7 w-7" />
                ))}

                {daysInMonth.map(day => {
                  const selected = isSelected(day);
                  const inRange = isRangeSelected(day);
                  const inHoverRange = isRangeHovered(day);
                  const isStart = isSameDay(day, value.from);
                  const isEnd = isSameDay(day, value.to);

                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      onClick={() => handleDayClick(day)}
                      onMouseEnter={() => setHoveredDate(day)}
                      onMouseLeave={() => setHoveredDate(null)}
                      className={`h-7 w-7 text-xs font-semibold rounded-lg flex items-center justify-center transition-all cursor-pointer relative ${
                        selected
                          ? "bg-brand-500 text-white font-bold scale-105 z-10"
                          : inRange
                          ? "bg-brand-50 text-brand-600 rounded-none first:rounded-l-lg last:rounded-r-lg"
                          : inHoverRange
                          ? "bg-slate-100 text-slate-700 rounded-none"
                          : "hover:bg-slate-100 text-slate-600"
                      } ${
                        isStart && !isSameDay(value.from, value.to) ? "rounded-l-lg" : ""
                      } ${
                        isEnd && !isSameDay(value.from, value.to) ? "rounded-r-lg" : ""
                      }`}
                    >
                      {format(day, "d")}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400 font-medium">
                <span>Select range start & end</span>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-brand-500 hover:text-brand-600 font-bold uppercase"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
