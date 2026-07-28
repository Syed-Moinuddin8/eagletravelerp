/**
 * Utility function to convert 24-hour time strings (e.g., "13:18", "13:18:00", "09:30")
 * or ISO timestamp strings into 12-hour AM/PM format (e.g., "1:18 PM", "9:30 AM").
 */
export function format12HourTime(timeStr?: string | null): string {
  if (!timeStr) return "";
  
  const trimmed = timeStr.trim();
  if (!trimmed) return "";

  // If it already ends with AM or PM, return clean
  if (/am|pm/i.test(trimmed)) {
    return trimmed;
  }

  // Handle ISO date strings (e.g. 2026-07-26T13:18:00Z)
  if (trimmed.includes("T")) {
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    }
  }

  // Handle HH:mm or HH:mm:ss format
  const parts = trimmed.split(":");
  if (parts.length >= 2) {
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1].slice(0, 2).padStart(2, "0");
    if (isNaN(hours)) return trimmed;
    
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12; // convert 0 to 12
    return `${hours}:${minutes} ${ampm}`;
  }

  return trimmed;
}
