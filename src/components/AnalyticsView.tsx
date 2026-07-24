import React, { useState } from "react";
import { ErpDatabase, LeadStatus, ExpenseCategory } from "../types";
import { DateRangePicker, DateRange } from "./DateRangePicker";
import {
  TrendingUp,
  BarChart3,
  Percent,
  TrendingDown,
  Navigation,
  Truck,
  LineChart,
  IndianRupee,
  FileSpreadsheet,
  AlertCircle,
  CalendarDays
} from "lucide-react";
import { 
  subDays, 
  parseISO, 
  isWithinInterval, 
  differenceInDays, 
  eachDayOfInterval, 
  format, 
  isAfter, 
  isBefore, 
  startOfMonth, 
  endOfMonth, 
  addMonths, 
  startOfYear 
} from "date-fns";

interface AnalyticsViewProps {
  db: ErpDatabase;
}

export function AnalyticsView({ db }: AnalyticsViewProps) {
  // Set initial 30 days range ending on Eagle Travels reference point of July 12, 2026
  const initialTo = new Date("2026-07-12");
  const initialFrom = subDays(initialTo, 29);
  
  const [dateRange, setDateRange] = useState<DateRange>({ 
    from: initialFrom, 
    to: initialTo 
  });

  // Default to Month-by-Month view to directly satisfy the owner's strategic requirement
  const [viewMode, setViewMode] = useState<'range' | 'monthly'>('monthly');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all'); // 'all' means Year-to-Date average/aggregate

  // State to track hovered interval in the chart for dynamic tooltips
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Helper to check if a date falls within the selected range (inclusive)
  const isWithinRange = (dateStr: string) => {
    try {
      const d = parseISO(dateStr);
      return isWithinInterval(d, { start: dateRange.from, end: dateRange.to });
    } catch {
      return false;
    }
  };

  // Helper to check if a date falls in a specific month & year
  const isWithinMonthAndYear = (dateStr: string, monthIdx: number | 'all', year: number) => {
    try {
      const d = parseISO(dateStr);
      if (d.getFullYear() !== year) return false;
      if (monthIdx !== 'all' && d.getMonth() !== monthIdx) return false;
      return true;
    } catch {
      return false;
    }
  };

  // Filter core records dynamically
  const filteredPayments = db.payments.filter(p => 
    viewMode === 'range' 
      ? isWithinRange(p.date) 
      : isWithinMonthAndYear(p.date, selectedMonth, selectedYear)
  );

  const filteredExpenses = db.expenses.filter(e => 
    viewMode === 'range' 
      ? isWithinRange(e.date) 
      : isWithinMonthAndYear(e.date, selectedMonth, selectedYear)
  );

  const filteredLeads = db.leads.filter(l => 
    viewMode === 'range' 
      ? isWithinRange(l.createdAt.slice(0, 10)) 
      : isWithinMonthAndYear(l.createdAt.slice(0, 10), selectedMonth, selectedYear)
  );

  const filteredTrips = db.trips.filter(t => 
    viewMode === 'range' 
      ? isWithinRange(t.startDate) 
      : isWithinMonthAndYear(t.startDate, selectedMonth, selectedYear)
  );

  // Compute reactive financial metrics
  const totalRevenue = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  // Lead Conversion rate for selected period
  const totalLeads = filteredLeads.length;
  const confirmedLeads = filteredLeads.filter(l => l.status === LeadStatus.CONFIRMED).length;
  const leadConversionRate = totalLeads > 0 ? (confirmedLeads / totalLeads) * 100 : 0;

  // Active Fleet capacity (trips scheduled / running / started in range)
  const totalVehicles = db.vehicles.length;
  const activeTripsCount = filteredTrips.filter(t => t.status === "Running" || t.status === "Started" || t.status === "Completed").length;
  const vehicleUtilization = totalVehicles > 0 ? (activeTripsCount / totalVehicles) * 100 : 0;

  // Revenue yield per dispatch
  const totalDispatches = filteredTrips.length;
  const revenueYieldPerDispatch = totalDispatches > 0 ? totalRevenue / totalDispatches : 0;

  // Dynamic interval calculation for the charts based on date difference or monthly mode
  const getChartIntervals = () => {
    if (viewMode === 'monthly') {
      const intervals: { label: string; start: Date; end: Date; monthIdx: number }[] = [];
      for (let m = 0; m < 12; m++) {
        const start = startOfMonth(new Date(selectedYear, m, 1));
        const end = endOfMonth(new Date(selectedYear, m, 1));
        intervals.push({
          label: format(start, "MMM"),
          start,
          end,
          monthIdx: m
        });
      }
      return intervals;
    }

    const intervals: { label: string; start: Date; end: Date }[] = [];
    const daysDiff = differenceInDays(dateRange.to, dateRange.from);

    if (daysDiff <= 10) {
      // 1. Daily intervals
      const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
      days.forEach(d => {
        intervals.push({
          label: format(d, "MMM d"),
          start: d,
          end: d
        });
      });
    } else if (daysDiff <= 45) {
      // 2. 6 custom sub-periods for cleaner visual bars
      const intervalDays = Math.ceil((daysDiff + 1) / 6);
      for (let i = 0; i < 6; i++) {
        const start = new Date(dateRange.from);
        start.setDate(dateRange.from.getDate() + i * intervalDays);
        if (isAfter(start, dateRange.to)) break;

        const end = new Date(dateRange.from);
        end.setDate(dateRange.from.getDate() + (i + 1) * intervalDays - 1);
        const actualEnd = isAfter(end, dateRange.to) ? dateRange.to : end;

        intervals.push({
          label: `${format(start, "MMM d")}-${format(actualEnd, "d")}`,
          start,
          end: actualEnd
        });
      }
    } else {
      // 3. Monthly group intervals (e.g. YTD or longer)
      const startM = startOfMonth(dateRange.from);
      const endM = endOfMonth(dateRange.to);
      
      let current = startM;
      while (!isBefore(endM, current)) {
        const monthStart = isBefore(startOfMonth(current), dateRange.from) ? dateRange.from : startOfMonth(current);
        const monthEnd = isAfter(endOfMonth(current), dateRange.to) ? dateRange.to : endOfMonth(current);
        
        intervals.push({
          label: format(current, "MMM yyyy"),
          start: monthStart,
          end: monthEnd
        });
        
        current = addMonths(current, 1);
      }
    }
    return intervals;
  };

  const chartIntervals = getChartIntervals();

  // Aggregate stats per interval
  const chartData = chartIntervals.map(interval => {
    const intervalPayments = db.payments.filter(p => {
      try {
        const d = parseISO(p.date);
        return isWithinInterval(d, { start: interval.start, end: interval.end });
      } catch {
        return false;
      }
    });

    const intervalExpenses = db.expenses.filter(e => {
      try {
        const d = parseISO(e.date);
        return isWithinInterval(d, { start: interval.start, end: interval.end });
      } catch {
        return false;
      }
    });

    const rev = intervalPayments.reduce((s, p) => s + p.amount, 0);
    const exp = intervalExpenses.reduce((s, e) => s + e.amount, 0);
    const prof = rev - exp;

    return {
      label: interval.label,
      revenue: rev,
      expenses: exp,
      profit: prof
    };
  });

  // Calculate raw highest bounds to map coordinates accurately (excluding negative profit bounds since line graph is removed)
  const rawMaxVal = Math.max(
    1000,
    ...chartData.map(d => Math.max(d.revenue, d.expenses))
  );

  // Helper to find nice rounded positive bounds
  const getNiceBounds = (max: number) => {
    // Choose a nice step size based on max value
    let step = 1000;
    if (max > 100000) {
      step = 25000;
    } else if (max > 50000) {
      step = 10000;
    } else if (max > 20000) {
      step = 5000;
    } else if (max > 1000) {
      step = 1000;
    }
    
    const niceMax = Math.ceil(max / step) * step;
    return { niceMax, niceMin: 0 };
  };

  const { niceMax: maxVal, niceMin: minVal } = getNiceBounds(rawMaxVal);

  // Dynamic expense breakdowns by categories for selected range
  const categorySummary = Object.values(ExpenseCategory).map(cat => {
    const amount = filteredExpenses
      .filter(e => e.category === cat)
      .reduce((s, e) => s + e.amount, 0);
    return { category: cat, amount };
  }).filter(c => c.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  const totalCategoryExpenses = categorySummary.reduce((sum, c) => sum + c.amount, 0);

  // Math to map value to SVG Y position
  const svgWidth = 500;
  const svgHeight = 180;
  const padLeft = 45;
  const padRight = 15;
  const padTop = 15;
  const padBottom = 25;
  const chartInnerWidth = svgWidth - padLeft - padRight;
  const chartInnerHeight = svgHeight - padTop - padBottom;

  const getYCoordinate = (val: number) => {
    const range = maxVal - minVal;
    if (range === 0) return padTop + chartInnerHeight;
    return padTop + chartInnerHeight - ((val - minVal) / range) * chartInnerHeight;
  };

  return (
    <div className="space-y-6" id="analytics-view">
      {/* Title Header with Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-3xs">
        <div>
          <h2 className="text-2xl font-bold font-display text-slate-800">Enterprise BI Analytics</h2>
          <p className="text-sm text-slate-500">Real-time business intelligence metrics, financial tracking, and asset utilization indices.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200/50">
            <button
              onClick={() => {
                setViewMode('monthly');
                setSelectedMonth('all');
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === 'monthly'
                  ? "bg-white text-slate-800 shadow-xs"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" /> Month-by-Month
            </button>
            <button
              onClick={() => setViewMode('range')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === 'range'
                  ? "bg-white text-slate-800 shadow-xs"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" /> Custom Range
            </button>
          </div>
        </div>
      </div>

      {/* Sub-Header Toolbar based on active view mode */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-3xs flex flex-wrap items-center justify-between gap-3">
        {viewMode === 'range' ? (
          <>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-slate-100 rounded-lg text-slate-600">
                <CalendarDays className="w-4 h-4" />
              </span>
              <div>
                <p className="text-xs font-bold text-slate-700">Custom Date Period</p>
                <p className="text-[10px] text-slate-400">Metrics aggregated for the exact selected calendar dates.</p>
              </div>
            </div>
            <div>
              <DateRangePicker 
                value={dateRange} 
                onChange={(range) => setDateRange(range)} 
              />
            </div>
          </>
        ) : (
          <div className="w-full space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-slate-50">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-brand-50 rounded-lg text-brand-600">
                  <BarChart3 className="w-4 h-4" />
                </span>
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    {selectedMonth === 'all' 
                      ? `Full Year ${selectedYear} Financial Overview` 
                      : `Month Deep Dive: ${format(new Date(selectedYear, selectedMonth, 1), "LLLL yyyy")}`
                    }
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {selectedMonth === 'all'
                      ? "Showing Year-to-Date combined business metrics and historical performance."
                      : `Showing specific metrics compiled exclusively for the month of ${format(new Date(selectedYear, selectedMonth, 1), "LLLL")}.`
                    }
                  </p>
                </div>
              </div>

              {/* Year Select & Clear Filter */}
              <div className="flex items-center gap-2 self-end sm:self-center">
                <span className="text-xs text-slate-400 font-medium">Financial Year:</span>
                <select
                  value={selectedYear}
                  onChange={(e) => {
                    setSelectedYear(Number(e.target.value));
                    setSelectedMonth('all');
                  }}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700 outline-none"
                >
                  <option value={2026}>2026 (Current)</option>
                  <option value={2025}>2025</option>
                </select>
                
                {selectedMonth !== 'all' && (
                  <button
                    onClick={() => setSelectedMonth('all')}
                    className="text-[11px] font-bold text-brand-600 bg-brand-50 hover:bg-brand-100 px-2.5 py-1 rounded-lg transition"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
            </div>

            {/* Quick Month Badges Grid */}
            <div className="flex flex-wrap gap-1.5 items-center">
              <button
                onClick={() => setSelectedMonth('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  selectedMonth === 'all'
                    ? "bg-brand-500 text-white shadow-3xs"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                All Months (YTD)
              </button>
              
              {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((mName, idx) => {
                const isSelected = selectedMonth === idx;
                return (
                  <button
                    key={mName}
                    onClick={() => setSelectedMonth(idx)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                      isSelected
                        ? "bg-slate-800 text-white font-bold shadow-3xs"
                        : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    {mName}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Main Graphical Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Beautiful Reactive SVG Chart Desk */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-3xs lg:col-span-2 space-y-6" id="analytics-trend-card">
          <div className="flex justify-between items-center border-b border-slate-50 pb-4">
            <div>
              <h3 className="text-md font-bold font-display text-slate-800 flex items-center gap-1.5">
                <BarChart3 className="w-5 h-5 text-brand-500" /> Financial Intelligence Trend
              </h3>
              <p className="text-slate-400 text-xs">
                {viewMode === 'monthly' 
                  ? `Comparative ledger showing performance of 12 calendar months for year ${selectedYear}.`
                  : "Dynamic tracking of Revenue, Expenses, and Profit across selected intervals."
                }
              </p>
            </div>
            {/* Legend indicators */}
            <div className="flex gap-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500" /> Revenue
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs bg-rose-500" /> Expenses
              </div>
            </div>
          </div>

          {/* Interactive Chart Container */}
          <div className="relative">
            {chartData.length === 0 ? (
              <div className="h-60 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <AlertCircle className="w-8 h-8 text-slate-300 mb-2" />
                <span className="text-xs font-semibold">No transactions found in this period.</span>
              </div>
            ) : (
              <div className="w-full">
                <svg className="w-full h-auto overflow-visible" viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
                  {/* Grid background lines */}
                  {Array.from({ length: 5 }).map((_, idx) => {
                    const yVal = padTop + (chartInnerHeight / 4) * idx;
                    const val = maxVal - ((maxVal - minVal) / 4) * idx;
                    return (
                      <g key={idx}>
                        <line 
                          x1={padLeft} 
                          y1={yVal} 
                          x2={svgWidth - padRight} 
                          y2={yVal} 
                          className="stroke-slate-100" 
                          strokeWidth="1"
                        />
                        <text 
                          x={padLeft - 8} 
                          y={yVal + 3} 
                          textAnchor="end" 
                          className="fill-slate-400 font-mono text-[9px] font-semibold"
                        >
                          ₹{Math.round(val).toLocaleString("en-IN")}
                        </text>
                      </g>
                    );
                  })}

                  {/* Zero baseline if there are negative values */}
                  {minVal < 0 && (
                    <line
                      x1={padLeft}
                      y1={getYCoordinate(0)}
                      x2={svgWidth - padRight}
                      y2={getYCoordinate(0)}
                      className="stroke-slate-300"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                    />
                  )}

                  {/* SVG Bars: Revenue & Expenses */}
                  {chartData.map((d, i) => {
                    const gap = 1.5;
                    const numIntervals = chartData.length;
                    const xCenter = padLeft + (numIntervals > 1 ? (i / (numIntervals - 1)) * chartInnerWidth : chartInnerWidth / 2);
                    const barWidth = Math.max(4, Math.min(18, chartInnerWidth / (numIntervals * 2.8)));

                    // Y values
                    const zeroY = getYCoordinate(0);
                    const revY = getYCoordinate(d.revenue);
                    const expY = getYCoordinate(d.expenses);
                    
                    const revHeight = zeroY - revY;
                    const expHeight = zeroY - expY;

                    const isCurrentMonthFiltered = viewMode === 'monthly' && selectedMonth === i;

                    return (
                      <g key={i}>
                        {/* Background column highlight if selected */}
                        {isCurrentMonthFiltered && (
                          <rect
                            x={xCenter - barWidth - gap - 6}
                            y={padTop}
                            width={barWidth * 2 + gap * 2 + 12}
                            height={chartInnerHeight}
                            className="fill-brand-50/40 stroke-brand-100/30"
                            strokeWidth="1"
                            rx="4"
                          />
                        )}

                        {/* Expenses Column */}
                        <rect
                          x={xCenter - barWidth - gap}
                          y={expY}
                          width={barWidth}
                          height={Math.max(1, expHeight)}
                          className={`fill-rose-400/90 hover:fill-rose-500 transition-all cursor-pointer ${
                            hoveredIdx === i ? "brightness-105" : ""
                          }`}
                          rx="1.5"
                        />

                        {/* Revenue Column */}
                        <rect
                          x={xCenter + gap}
                          y={revY}
                          width={barWidth}
                          height={Math.max(1, revHeight)}
                          className={`fill-emerald-400/90 hover:fill-emerald-500 transition-all cursor-pointer ${
                            hoveredIdx === i ? "brightness-105" : ""
                          }`}
                          rx="1.5"
                        />

                        {/* Interactive Invisible Overlay for easy hovering & clicking */}
                        <rect
                          x={xCenter - barWidth - gap - 6}
                          y={padTop}
                          width={barWidth * 2 + gap * 2 + 12}
                          height={chartInnerHeight}
                          className="fill-transparent cursor-pointer"
                          onMouseEnter={() => setHoveredIdx(i)}
                          onMouseLeave={() => setHoveredIdx(null)}
                          onClick={() => {
                            if (viewMode === 'monthly') {
                              setSelectedMonth(i === selectedMonth ? 'all' : i);
                            }
                          }}
                        />

                        {/* Label x-axis */}
                        <text
                          x={xCenter}
                          y={svgHeight - 8}
                          textAnchor="middle"
                          className={`font-sans text-[8px] font-bold ${
                            isCurrentMonthFiltered ? "fill-brand-600 font-extrabold" : "fill-slate-400"
                          }`}
                        >
                          {d.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* Dynamic Floating Tooltip / Interactive drill down */}
                <div className="mt-4 bg-slate-50 border border-slate-200/60 p-4 rounded-xl grid grid-cols-3 gap-4 text-center">
                  {hoveredIdx !== null ? (
                    <>
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Month ({chartData[hoveredIdx].label})</span>
                        <p className="text-xs font-bold text-slate-700">Received Income</p>
                        <p className="text-sm font-bold text-emerald-600 font-mono">₹{chartData[hoveredIdx].revenue.toLocaleString("en-IN")}</p>
                      </div>
                      <div className="space-y-0.5 border-x border-slate-200 px-4">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Operations Cost</span>
                        <p className="text-xs font-bold text-slate-700">Fuel & Expenses</p>
                        <p className="text-sm font-bold text-rose-500 font-mono">₹{chartData[hoveredIdx].expenses.toLocaleString("en-IN")}</p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Net Yield</span>
                        <p className="text-xs font-bold text-slate-700">Profit Yield</p>
                        <p className={`text-sm font-bold font-mono ${chartData[hoveredIdx].profit >= 0 ? "text-brand-500" : "text-rose-500"}`}>
                          ₹{chartData[hoveredIdx].profit.toLocaleString("en-IN")}
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="col-span-3 text-xs text-slate-500 italic py-1">
                      {viewMode === 'monthly'
                        ? "💡 Hover over any month segment to inspect • Click a month to filter all metrics and performance breakdowns below!"
                        : "Hover over any chart segment or trend dot to inspect granular financial reports"
                      }
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Operational Cost Category Breakdown Panel */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-3xs space-y-5" id="expenses-breakdown-card">
          <div className="border-b border-slate-50 pb-4">
            <h3 className="text-md font-bold font-display text-slate-800 flex items-center gap-1.5">
              <TrendingDown className="w-5 h-5 text-rose-500" /> Cost Center Allocation
            </h3>
            <p className="text-slate-400 text-xs">Operational expense split inside the selected window.</p>
          </div>

          {categorySummary.length === 0 ? (
            <div className="h-44 flex flex-col items-center justify-center text-slate-400 bg-slate-50/40 rounded-xl border border-dashed border-slate-100">
              <FileSpreadsheet className="w-7 h-7 text-slate-300 mb-1" />
              <span className="text-xs font-medium">No recorded operational expenses</span>
            </div>
          ) : (
            <div className="space-y-4">
              {categorySummary.map(item => {
                const pct = totalCategoryExpenses > 0 ? (item.amount / totalCategoryExpenses) * 100 : 0;
                return (
                  <div key={item.category} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-700">{item.category}</span>
                      <span className="font-mono text-slate-500 font-semibold">
                        ₹{item.amount.toLocaleString("en-IN")} <span className="text-[10px] text-slate-400 font-normal">({pct.toFixed(0)}%)</span>
                      </span>
                    </div>
                    {/* Visual Progress Bar */}
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-rose-500 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${pct}%` }} 
                      />
                    </div>
                  </div>
                );
              })}
              <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs font-bold text-slate-600">
                <span>Sum of cost centers:</span>
                <span className="font-mono text-slate-800 text-sm">₹{totalCategoryExpenses.toLocaleString("en-IN")}</span>
              </div>
            </div>
          )}
        </div>
      </div>



      {/* Month-by-Month Comparison Ledger Table */}
      {viewMode === 'monthly' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-3xs space-y-4 animate-in fade-in duration-300" id="monthly-comparison-table">
          <div className="border-b border-slate-50 pb-3">
            <h3 className="text-md font-bold font-display text-slate-800 flex items-center gap-1.5">
              <FileSpreadsheet className="w-5 h-5 text-indigo-500" /> Month-by-Month Performance Ledger ({selectedYear})
            </h3>
            <p className="text-slate-400 text-xs">A comprehensive comparative breakdown of business metrics across all calendar months.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Month</th>
                  <th className="py-3 px-4 text-right">Revenue</th>
                  <th className="py-3 px-4 text-right">Expenses</th>
                  <th className="py-3 px-4 text-right">Net Profit</th>
                  <th className="py-3 px-4 text-right">Profit Margin</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {chartData.map((data, mIdx) => {
                  const marginPct = data.revenue > 0 ? (data.profit / data.revenue) * 100 : 0;
                  
                  // Financial status indicator
                  let statusBadge = (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-400">
                      No Activity
                    </span>
                  );
                  if (data.revenue > 0) {
                    if (data.profit > 100000) {
                      statusBadge = (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                          Highly Profitable
                        </span>
                      );
                    } else if (data.profit > 0) {
                      statusBadge = (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                          Profitable
                        </span>
                      );
                    } else {
                      statusBadge = (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-100">
                          Net Loss
                        </span>
                      );
                    }
                  }

                  const isCurrentFilter = selectedMonth === mIdx;

                  return (
                    <tr 
                      key={data.label} 
                      className={`hover:bg-slate-50/50 transition duration-150 ${
                        isCurrentFilter ? "bg-brand-50/50 font-semibold" : ""
                      }`}
                    >
                      <td className="py-3 px-4 font-bold text-slate-800">
                        {data.label} {isCurrentFilter && <span className="text-[10px] text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded ml-1 font-bold">Active Filter</span>}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-700">
                        ₹{data.revenue.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-rose-500">
                        ₹{data.expenses.toLocaleString("en-IN")}
                      </td>
                      <td className={`py-3 px-4 text-right font-mono font-bold ${
                        data.profit >= 0 ? "text-emerald-600" : "text-rose-600"
                      }`}>
                        ₹{data.profit.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4 text-right font-mono">
                        {data.revenue > 0 ? `${marginPct.toFixed(0)}%` : "0%"}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {statusBadge}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedMonth(isCurrentFilter ? 'all' : mIdx)}
                          className={`text-[10px] font-bold px-2.5 py-1 rounded transition duration-150 ${
                            isCurrentFilter 
                              ? "bg-slate-200 text-slate-700 hover:bg-slate-300"
                              : "bg-brand-50 hover:bg-brand-100 text-brand-600"
                          }`}
                        >
                          {isCurrentFilter ? "Clear Filter" : "Filter Metrics"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
