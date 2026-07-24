import React, { useState } from "react";
import { useToasts } from "./Toast";
import {
  ErpDatabase,
  TripStatus
} from "../types";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Clock,
  MapPin,
  Car,
  User,
  Phone
} from "lucide-react";

interface CalendarViewProps {
  db: ErpDatabase;
}

export function CalendarView({ db }: CalendarViewProps) {
  const { showToast } = useToasts();
  // Static state locked to July 2026 context
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(6); // July is month index 6 (0-indexed: Jan=0...Jul=6)

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Selected date details
  const [selectedDay, setSelectedDay] = useState<number | null>(24); // Selected 24th July by default (current date)

  // Calculate calendar days
  // July 1, 2026 is a Wednesday (day index 3: Sun=0, Mon=1, Tue=2, Wed=3)
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
  const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();

  const daysArray = Array.from({ length: totalDays }, (_, i) => i + 1);
  const prefixEmptyBlocks = Array.from({ length: firstDayIndex }, (_, i) => null);

  // Map events to dates in July 2026
  const getEventsForDate = (day: number) => {
    const dateStr = `${currentYear}-07-${day < 10 ? '0' + day : day}`;
    const events: { title: string; type: "trip" | "service" | "renewal" | "followup"; meta?: string }[] = [];

    // Check active trips starting on this day
    db.trips.forEach(t => {
      if (t.startDate === dateStr) {
        events.push({ title: `Trip: ${t.customerName}`, type: "trip", meta: `${t.pickup} ⇆ ${t.drop}` });
      }
    });

    // Check vehicle service (last serviced or maintenance entries)
    db.vehicles.forEach(v => {
      if (v.lastServiceDate === dateStr) {
        events.push({ title: `Service: ${v.vehicleNumber}`, type: "service", meta: `${v.brand} maintenance` });
      }
    });

    // Check government permit/insurance exiries
    db.vehicles.forEach(v => {
      if (v.insuranceExpiry === dateStr) {
        events.push({ title: `Insurance: ${v.vehicleNumber}`, type: "renewal", meta: "Insurance Policy Expiry" });
      }
      if (v.permitExpiry === dateStr) {
        events.push({ title: `Permit: ${v.vehicleNumber}`, type: "renewal", meta: "Permit Expiry" });
      }
    });

    // Check followups
    db.leads.forEach(l => {
      if (l.nextFollowUpDate && l.nextFollowUpDate.split('T')[0] === dateStr) {
        events.push({ title: `Follow-up: ${l.customerName}`, type: "followup", meta: l.phone });
      }
    });

    return events;
  };

  const selectedDateEvents = selectedDay ? getEventsForDate(selectedDay) : [];

  return (
    <div className="space-y-6" id="calendar-view">
      {/* Title Header */}
      <div>
        <h2 className="text-2xl font-bold font-display text-slate-800">Operational Calendar Workspace</h2>
        <p className="text-sm text-slate-500">Coordinate active vehicle dispatches, service cycles, policy renewals, and customer callbacks.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Monthly Calendar (Span 8) */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 lg:col-span-8 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold font-display text-slate-800 flex items-center gap-2">
              <CalendarDays className="text-brand-500 w-5 h-5" />
              {monthNames[currentMonth]} {currentYear}
            </h3>
            
            <div className="flex gap-2 text-xs">
              <button 
                onClick={() => showToast("Static calendar locked to July 2026 operations cycle.", "info")}
                className="p-1.5 hover:bg-slate-50 border border-slate-200 rounded-lg transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={() => showToast("Static calendar locked to July 2026 operations cycle.", "info")}
                className="p-1.5 hover:bg-slate-50 border border-slate-200 rounded-lg transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-slate-500">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
              <div key={day} className="py-2">{day}</div>
            ))}

            {/* Prefix Empty slots */}
            {prefixEmptyBlocks.map((_, idx) => (
              <div key={`empty-${idx}`} className="bg-slate-50/20 aspect-square rounded-xl"></div>
            ))}

            {/* Days list */}
            {daysArray.map(day => {
              const isSelected = day === selectedDay;
              const dayEvents = getEventsForDate(day);
              const isToday = day === 24; // Static current date July 24 2026

              return (
                <div
                  key={`day-${day}`}
                  onClick={() => setSelectedDay(day)}
                  className={`relative p-2 aspect-square rounded-xl border flex flex-col justify-between cursor-pointer transition ${
                    isSelected 
                      ? "border-brand-500 bg-brand-50 text-brand-700 shadow-md ring-2 ring-brand-200" 
                      : isToday
                      ? "border-slate-300 bg-slate-50 text-slate-800 font-bold"
                      : "border-slate-50 hover:border-slate-200 hover:bg-slate-50/50 text-slate-700"
                  }`}
                >
                  <span className={`font-bold self-start text-xs ${isToday && !isSelected ? 'underline decoration-2' : ''}`}>{day}</span>
                  
                  {/* Miniature Event Indicator Dots */}
                  <div className="flex justify-center gap-1 mt-1 shrink-0 overflow-hidden">
                    {dayEvents.map((ev, idx) => (
                      <span 
                        key={idx} 
                        className={`w-1.5 h-1.5 rounded-full ${
                          ev.type === "trip" ? "bg-brand-500" :
                          ev.type === "service" ? "bg-rose-500" :
                          ev.type === "renewal" ? "bg-amber-500" : "bg-sky-500"
                        }`}
                        title={ev.title}
                      ></span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Date Event Details (Span 4) */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 lg:col-span-4 h-[470px] flex flex-col overflow-hidden">
          <h3 className="text-md font-bold font-display text-slate-800 border-b border-slate-100 pb-3 shrink-0">
            Agenda: {selectedDay} July 2026
          </h3>

          <div className="flex-1 overflow-y-auto pt-4 space-y-3">
            {selectedDateEvents.length === 0 ? (
              <div className="text-center py-20 text-slate-400 text-xs">
                No fleet logs or followups listed for this day.
              </div>
            ) : (
              selectedDateEvents.map((ev, idx) => (
                <div 
                  key={idx} 
                  className={`p-3 rounded-xl border flex gap-3 ${
                    ev.type === "trip" ? "bg-blue-50/30 border-blue-100 text-blue-900" :
                    ev.type === "service" ? "bg-rose-50/30 border-rose-100 text-rose-900" :
                    ev.type === "renewal" ? "bg-amber-50/30 border-amber-100 text-amber-900" : 
                    "bg-sky-50/30 border-sky-100 text-sky-900"
                  }`}
                >
                  <div className="space-y-1 text-xs">
                    <p className="font-bold text-slate-800">{ev.title}</p>
                    {ev.meta && <p className="text-slate-500 text-[11px] leading-tight">{ev.meta}</p>}
                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/60 text-slate-600">
                      {ev.type}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
