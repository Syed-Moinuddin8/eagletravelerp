import { Customer, Driver, Vehicle } from "../types";

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
    "ID",
    "Name",
    "Phone",
    "Email",
    "GSTIN",
    "Address",
    "Notes",
    "Created At"
  ];

  const rows = customers.map(c => [
    c.id,
    c.name || "",
    c.phone || "",
    c.email || "",
    c.gstNumber || "N/A",
    c.address || "",
    c.notes || "",
    c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ""
  ]);

  downloadCsv(headers, rows, `eagle_travels_customers_${new Date().toISOString().slice(0, 10)}.csv`);
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
