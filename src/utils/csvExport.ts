import { Customer, Driver, Vehicle, Payment, Expense } from "../types";

/**
 * Downloads arbitrary rows as a CSV file.
 * Automatically wraps values in double quotes and escapes existing double quotes.
 */
function downloadCsv(headers: string[], rows: string[][], filename: string) {
  const csvContent = [
    headers.map(h => `"${h.replace(/"/g, '""')}"`).join(","),
    ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(","))
  ].join("\n");

  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export Customer Accounts to CSV
 */
export function exportCustomersToCsv(customers: Customer[]) {
  const headers = [
    "Customer ID",
    "Name",
    "Phone",
    "Email",
    "GSTIN",
    "Address",
    "Vehicle / Model",
    "Vehicle Provider",
    "Engage Base Rate (₹)",
    "Per KM Rate (₹)",
    "Driver Bata Rate (₹)",
    "Advance Received (₹)",
    "Pickup Location",
    "Pickup Time",
    "Visiting Places / Itinerary",
    "Start Date",
    "End Date",
    "Passengers",
    "Booking Status",
    "Notes",
    "Created At"
  ];

  const rows = customers.map(c => [
    c.id || "",
    c.name || "",
    c.phone || "",
    c.email || "",
    c.gstNumber || "N/A",
    c.address || "",
    c.vehicle || "N/A",
    c.vehicleProvider || "N/A",
    c.assignedRateEngage !== undefined && c.assignedRateEngage !== null ? c.assignedRateEngage.toString() : "0",
    c.perKmRate !== undefined && c.perKmRate !== null ? c.perKmRate.toString() : "0",
    c.driverBata !== undefined && c.driverBata !== null ? c.driverBata.toString() : "0",
    c.advanceAmount !== undefined && c.advanceAmount !== null ? c.advanceAmount.toString() : "0",
    c.pickupLocation || "",
    c.pickupTime || "",
    c.visitingPlaces || "",
    c.startDate || "",
    c.endDate || "",
    c.passengers !== undefined && c.passengers !== null ? c.passengers.toString() : "0",
    c.bookingStatus || "Confirmed",
    c.notes || "",
    c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ""
  ]);

  downloadCsv(headers, rows, `eagle_travels_customers_directory_${new Date().toISOString().slice(0, 10)}.csv`);
}

/**
 * Export Drivers to CSV
 */
export function exportDriversToCsv(drivers: Driver[]) {
  const headers = [
    "Driver ID",
    "Name",
    "License Number",
    "Aadhar Number",
    "PAN Number",
    "Phone",
    "Email",
    "Address",
    "Salary (₹)",
    "Emergency Contact Name",
    "Emergency Contact Phone",
    "Availability Status"
  ];

  const rows = drivers.map(d => [
    d.id,
    d.name || "",
    d.licenseNumber || "",
    d.aadharNumber || "",
    d.panNumber || "",
    d.phone || "",
    d.email || "",
    d.address || "",
    (d.salary || 0).toString(),
    d.emergencyContactName || "",
    d.emergencyContactPhone || "",
    d.isAvailable ? "Available" : "Allocated/On-duty"
  ]);

  downloadCsv(headers, rows, `eagle_travels_drivers_${new Date().toISOString().slice(0, 10)}.csv`);
}

/**
 * Export Fleet Vehicles to CSV
 */
export function exportVehiclesToCsv(vehicles: Vehicle[]) {
  const headers = [
    "Vehicle ID",
    "Registration Number",
    "Category",
    "Brand",
    "Model",
    "Fuel Type",
    "Seats",
    "RC Number",
    "Insurance Expiry",
    "Fitness Expiry",
    "Permit Expiry",
    "Pollution Expiry",
    "Last Service Date",
    "Availability Status"
  ];

  const rows = vehicles.map(v => [
    v.id,
    v.vehicleNumber || "",
    v.category || "",
    v.brand || "",
    v.model || "",
    v.fuelType || "",
    (v.seats || 0).toString(),
    v.rcNumber || "",
    v.insuranceExpiry || "",
    v.fitnessExpiry || "",
    v.permitExpiry || "",
    v.pollutionExpiry || "",
    v.lastServiceDate || "",
    v.isAvailable ? "Available" : "Booked/In-transit"
  ]);

  downloadCsv(headers, rows, `eagle_travels_fleet_${new Date().toISOString().slice(0, 10)}.csv`);
}

/**
 * Export Reconciled Payment Ledger & Receipts to CSV
 */
export function exportPaymentsToCsv(payments: Payment[]) {
  const headers = [
    "Receipt Code",
    "Date",
    "Customer Name",
    "Trip ID",
    "Payment Mode",
    "Amount (₹)",
    "Transaction Ref ID",
    "Notes"
  ];

  const rows = payments.map(p => [
    p.id || "",
    p.date || "",
    p.customerName || "",
    p.tripNumber || "N/A",
    p.paymentMethod || "",
    (p.amount || 0).toString(),
    p.transactionId || "N/A",
    p.notes || ""
  ]);

  downloadCsv(headers, rows, `eagle_travels_payments_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
}

/**
 * Export Expenses Log to CSV
 */
export function exportExpensesToCsv(expenses: Expense[]) {
  const headers = [
    "Expense ID",
    "Date",
    "Category",
    "Amount (₹)",
    "Paid To / Vendor",
    "Payment Mode",
    "Notes"
  ];

  const rows = expenses.map(e => [
    e.id || "",
    e.date || "",
    e.category || "",
    (e.amount || 0).toString(),
    e.paidTo || "",
    e.paymentMethod || "",
    e.notes || ""
  ]);

  downloadCsv(headers, rows, `eagle_travels_expenses_log_${new Date().toISOString().slice(0, 10)}.csv`);
}
