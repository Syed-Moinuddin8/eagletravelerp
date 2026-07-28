import React, { useState } from "react";
import { jsPDF } from "jspdf";
import { useToasts } from "./Toast";
import {
  ErpDatabase,
  Invoice
} from "../types";
import {
  Search,
  Plus,
  FileText,
  Printer,
  Download,
  Mail,
  CheckCircle,
  IndianRupee,
  Building,
  User,
  QrCode,
  MapPin,
  ChevronRight,
  X,
  Calendar,
  Percent,
  ArrowLeft,
  Settings2,
  AlertCircle
} from "lucide-react";
// Using dynamic db.settings instead of defaultCompanySettings

export function numberToWords(num: number): string {
  if (num === 0) return "Zero Rupees only";
  
  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  
  function convertLessThanThousand(n: number): string {
    if (n === 0) return "";
    let str = "";
    if (n >= 100) {
      str += a[Math.floor(n / 100)] + " Hundred ";
      n %= 100;
    }
    if (n >= 20) {
      str += b[Math.floor(n / 10)] + " ";
      n %= 10;
    }
    if (n > 0) {
      str += a[n] + " ";
    }
    return str.trim();
  }

  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);
  
  let result = "";
  let temp = rupees;
  
  // Indian Numbering System: Crores, Lakhs, Thousands, Hundreds
  if (temp >= 10000000) {
    result += convertLessThanThousand(Math.floor(temp / 10000000)) + " Crore ";
    temp %= 10000000;
  }
  if (temp >= 100000) {
    result += convertLessThanThousand(Math.floor(temp / 100000)) + " Lakh ";
    temp %= 100000;
  }
  if (temp >= 1000) {
    result += convertLessThanThousand(Math.floor(temp / 1000)) + " Thousand ";
    temp %= 1000;
  }
  if (temp > 0) {
    result += convertLessThanThousand(temp);
  }
  
  result = result.trim() + " Rupees";
  
  if (paise > 0) {
    result += " and " + convertLessThanThousand(paise) + " Paisa";
  }
  
  return result + " only";
}

interface InvoicesViewProps {
  db: ErpDatabase;
  onUpdateDb: (updatedDb: ErpDatabase) => void;
}

export function InvoicesView({ db, onUpdateDb }: InvoicesViewProps) {
  const { showToast } = useToasts();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInvId, setSelectedInvId] = useState<string>(db.invoices[0]?.id || "");

  // Modal & Form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [invoiceId, setInvoiceId] = useState("");
  const [selectedTripId, setSelectedTripId] = useState("");
  const [customTripNumber, setCustomTripNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerGST, setCustomerGST] = useState("");
  
  const [subtotal, setSubtotal] = useState<number>(0);
  const [gstRate, setGstRate] = useState<number>(5);
  const [advanceAmount, setAdvanceAmount] = useState<number>(0);
  const [paymentStatus, setPaymentStatus] = useState<"Pending" | "Partial" | "Paid">("Pending");
  
  const [createdAt, setCreatedAt] = useState("2026-07-17");
  const [dueDate, setDueDate] = useState("2026-07-24");
  const [mobileShowDetails, setMobileShowDetails] = useState(false);

  // Edit invoice state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editInvoiceId, setEditInvoiceId] = useState("");

  // Line items state for manual invoice creation/editing
  const [lineItems, setLineItems] = useState<Array<{id: number; description: string; quantity: number; unit: string; rate: number; amount: number}>>([
    { id: 1, description: "", quantity: 1, unit: "Trip", rate: 0, amount: 0 }
  ]);

  // Calculate subtotal from line items (with safety check)
  React.useEffect(() => {
    try {
      const total = lineItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
      setSubtotal(total);
    } catch (error) {
      console.error("Error calculating subtotal:", error);
      setSubtotal(0);
    }
  }, [lineItems]);

  // Line item management functions
  const handleLineItemChange = (id: number, field: string, value: any) => {
    setLineItems(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        // Recalculate amount when quantity or rate changes
        if (field === 'quantity' || field === 'rate') {
          updated.amount = Number(updated.quantity) * Number(updated.rate);
        }
        return updated;
      }
      return item;
    }));
  };

  const handleAddLineItem = () => {
    const newId = Math.max(...lineItems.map(item => item.id), 0) + 1;
    setLineItems(prev => [...prev, { id: newId, description: "", quantity: 1, unit: "Trip", rate: 0, amount: 0 }]);
  };

  const handleRemoveLineItem = (id: number) => {
    if (lineItems.length > 1) {
      setLineItems(prev => prev.filter(item => item.id !== id));
    }
  };

  // Dynamically update payment status suggestion based on calculation
  React.useEffect(() => {
    if (!showCreateModal) return;
    const calcGst = Math.round((subtotal * gstRate) / 100);
    const total = subtotal + calcGst;
    if (total === 0) {
      setPaymentStatus("Pending");
    } else if (advanceAmount >= total) {
      setPaymentStatus("Paid");
    } else if (advanceAmount > 0) {
      setPaymentStatus("Partial");
    } else {
      setPaymentStatus("Pending");
    }
  }, [subtotal, gstRate, advanceAmount, showCreateModal]);

  const selectedInv = db.invoices.find(i => i.id === selectedInvId);

  // Find associated trip & vehicle for selected invoice
  const associatedTrip = selectedInv ? db.trips.find(t => t.id === selectedInv.tripId || t.id === selectedInv.tripNumber) : null;
  const associatedVehicle = associatedTrip ? db.vehicles.find(v => v.id === associatedTrip.vehicleId || v.vehicleNumber === associatedTrip.vehicleNumber) : null;
  
  const vehicleModel = associatedTrip?.vehicleModel || associatedVehicle?.model || "Tempo Traveller";
  const vehicleNumber = associatedTrip?.vehicleNumber || associatedVehicle?.vehicleNumber || "KA 51 AD 5859";
  
  const companyName = db.settings.name || selectedInv?.companyName || "Eagle Travels Private Limited - Ballari";
  const companyLogo = db.settings.logoUrl || selectedInv?.companyLogo;
  const companyGST = db.settings.gstNumber || selectedInv?.companyGST || "29AAMCB0602L1ZM";
  const companyAddress = db.settings.address || selectedInv?.companyAddress || "Opp. Siratum Mustaqeem Masjid, Old Bypass Road, Ex-servicemen Colony, Cowlbazar, Ballari";
  const companyEmail = db.settings.email || selectedInv?.companyEmail || "eagletravels.ballari@gmail.com";
  const companyPhone = db.settings.phone || selectedInv?.companyPhone || "+91-9686342201";
  
  const companyState = companyGST.startsWith("29") ? "29-Karnataka" : "29-Karnataka";
  const activeCustomerGST = selectedInv?.customerGST || "29AABCJ3574E1ZJ";
  const customerState = activeCustomerGST.startsWith("29") ? "29-Karnataka" : "29-Karnataka";

  // Generate line items dynamically from invoice's stored lineItems (manual entry)
  const generateItemizedRows = (inv: Invoice) => {
    // Use stored line items if available, otherwise fallback to default
    if (inv.lineItems && Array.isArray(inv.lineItems) && inv.lineItems.length > 0) {
      return inv.lineItems;
    }
    
    // Fallback: create a single default item
    return [{
      id: 1,
      description: `Service charges for ${inv.tripNumber}`,
      quantity: 1,
      unit: "Trip",
      rate: inv.subtotal,
      amount: inv.subtotal
    }];
  };

  const itemizedRows = selectedInv ? generateItemizedRows(selectedInv) : [];

  // Safety check for rendering
  if (!db || !db.invoices) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-slate-600">Loading invoices...</p>
        </div>
      </div>
    );
  }

  // Filter invoices
  const filteredInvoices = db.invoices.filter(inv => 
    inv.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.tripNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Fully functioning high-fidelity PDF and Print triggers
  const handleDownloadPDF = () => {
    if (!selectedInv) return;

    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // A4: 210mm x 297mm
      const pageWidth = 210;
      
      // Colors
      const brandRed = [225, 29, 72]; // #e11d48
      const slateDark = [30, 37, 48]; // #1e2530
      const textDark = [30, 41, 59]; // #1e293b
      const textMuted = [100, 116, 139]; // #64748b
      const borderGray = [203, 213, 225]; // #cbd5e1
      const lightBg = [248, 250, 252]; // #f8fafc

      // 1. Top Red Band
      doc.setFillColor(brandRed[0], brandRed[1], brandRed[2]);
      doc.rect(10, 10, 190, 15, "F");

      // Draw Logo container inside the top band
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(12, 11, 13, 13, 1, 1, "F");

      if (companyLogo) {
        try {
          doc.addImage(companyLogo, "PNG", 13, 12, 11, 11);
        } catch (e) {
          // Fallback text if image loading fails (CORS/format)
          doc.setTextColor(brandRed[0], brandRed[1], brandRed[2]);
          doc.setFont("Helvetica", "bold");
          doc.setFontSize(8);
          doc.text("ET", 16.5, 19);
        }
      } else {
        // Fallback text
        doc.setTextColor(brandRed[0], brandRed[1], brandRed[2]);
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(8);
        doc.text("ET", 16.5, 19);
      }

      // Phone & Email in top band
      doc.setTextColor(255, 255, 255);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text(`Phone: ${companyPhone}`, 28, 18.5);
      doc.text(`Email: ${companyEmail}`, 75, 18.5);

      // Address (right aligned & multi-lined, constrained to prevent spill out)
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(6.5);
      const addressLines = doc.splitTextToSize(companyAddress, 65);
      doc.text(addressLines, 132, 15);

      // 2. Company Name Slate & Tax Invoice Row
      doc.setFillColor(slateDark[0], slateDark[1], slateDark[2]);
      doc.rect(10, 25, 110, 18, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10.5);
      doc.text(companyName, 15, 31);
      
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(203, 213, 225);
      doc.text(`GSTIN: ${companyGST}    State: ${companyState}`, 15, 37);

      // Tax Invoice Title
      doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(18);
      doc.text("TAX INVOICE", 135, 37);

      // 3. Details grid
      let y = 50;

      // Vertical separators
      doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
      doc.setLineWidth(0.2);
      
      // Column 1: Bill To
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(brandRed[0], brandRed[1], brandRed[2]);
      doc.text("BILL TO", 15, y);
      
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      doc.setFontSize(10);
      doc.setFont("Helvetica", "bold");
      doc.text(selectedInv.customerName, 15, y + 5);
      
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
      const custAddrLines = doc.splitTextToSize(selectedInv.customerAddress, 55);
      doc.text(custAddrLines, 15, y + 9);

      const custAddrHeight = custAddrLines.length * 3.5;
      
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      doc.text(`Contact: ${selectedInv.customerPhone || "+91 70226 53888"}`, 15, y + 10 + custAddrHeight);
      doc.text(`GSTIN: ${activeCustomerGST}`, 15, y + 14 + custAddrHeight);
      doc.text(`State: ${customerState}`, 15, y + 18 + custAddrHeight);

      // Vertical separator
      doc.line(75, y - 2, 75, y + 25);

      // Column 2: Transportation Details
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(brandRed[0], brandRed[1], brandRed[2]);
      doc.text("TRANSPORTATION DETAILS:", 80, y);
      
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      doc.text(vehicleModel, 80, y + 5);

      if (associatedTrip) {
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
        doc.text(`• Route: ${associatedTrip.pickup} to ${associatedTrip.drop}`, 80, y + 10);
        doc.text(`• Start Date: ${associatedTrip.startDate}`, 80, y + 14);
      }

      // Vertical separator
      doc.line(140, y - 2, 140, y + 25);

      // Column 3: Invoice Particulars
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(brandRed[0], brandRed[1], brandRed[2]);
      doc.text("INVOICE PARTICULARS", 145, y);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      doc.text(`Invoice No:`, 145, y + 5);
      doc.setFont("Helvetica", "bold");
      doc.text(selectedInv.id, 172, y + 5);

      doc.setFont("Helvetica", "normal");
      doc.text(`Date:`, 145, y + 10);
      doc.text(selectedInv.createdAt, 172, y + 10);

      doc.text(`Due Date:`, 145, y + 15);
      doc.text(selectedInv.dueDate, 172, y + 15);

      doc.text(`Status:`, 145, y + 20);
      doc.setFont("Helvetica", "bold");
      doc.text(selectedInv.paymentStatus, 172, y + 20);

      // 4. Items Table
      y = y + 32;

      // Table Header Row
      doc.setFillColor(brandRed[0], brandRed[1], brandRed[2]);
      doc.rect(10, y, 190, 7, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8);
      doc.text("#", 14, y + 4.5, { align: "center" });
      doc.text("Item Name", 22, y + 4.5);
      doc.text("Qty", 126.5, y + 4.5, { align: "center" });
      doc.text("Unit", 140.5, y + 4.5, { align: "center" });
      doc.text("Price/Unit", 167, y + 4.5, { align: "right" });
      doc.text("Amount", 195, y + 4.5, { align: "right" });

      y = y + 7;

      // Draw table cells
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);

      itemizedRows.forEach((row) => {
        // Draw row line separator
        doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
        doc.setLineWidth(0.1);
        doc.line(10, y, 200, y);

        // Vertical lines for column boundaries
        doc.line(10, y, 10, y + 8);
        doc.line(18, y, 18, y + 8);
        doc.line(120, y, 120, y + 8);
        doc.line(133, y, 133, y + 8);
        doc.line(148, y, 148, y + 8);
        doc.line(170, y, 170, y + 8);
        doc.line(200, y, 200, y + 8);

        doc.text(String(row.id || 1), 14, y + 5, { align: "center" });

        // Split item description into lines to avoid overflow
        const descLines = doc.splitTextToSize(row.description || "Service", 98);
        doc.text(descLines, 22, y + 5);

        doc.text(String(row.quantity || 1), 126.5, y + 5, { align: "center" });
        doc.text(row.unit || "Trip", 140.5, y + 5, { align: "center" });
        // Use 'rate' field from our line items structure
        const rate = row.rate || 0;
        doc.text(`Rs. ${rate.toFixed(2)}`, 167, y + 5, { align: "right" });
        doc.text(`Rs. ${(row.amount || 0).toFixed(2)}`, 195, y + 5, { align: "right" });

        y = y + 8;
      });

      // Bottom border for last item row
      doc.line(10, y, 200, y);

      // Table Total Row with Red BG
      doc.setFillColor(brandRed[0], brandRed[1], brandRed[2]);
      doc.rect(10, y, 190, 8, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("Helvetica", "bold");
      doc.text("TOTAL", 22, y + 5);
      doc.text(`Rs. ${selectedInv.subtotal.toFixed(2)}`, 195, y + 5, { align: "right" });

      y = y + 13;

      // 5. Bottom block
      const bottomStartY = y;

      // Left part: Bank Details
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(brandRed[0], brandRed[1], brandRed[2]);
      doc.text("PAY TO:", 10, bottomStartY);

      doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
      doc.rect(10, bottomStartY + 2, 105, 20, "F");
      doc.setDrawColor(241, 245, 249);
      doc.rect(10, bottomStartY + 2, 105, 20, "S");

      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      doc.setFontSize(7.5);
      
      const drawBankDetail = (label: string, value: string, x: number, yPos: number) => {
        doc.setFont("Helvetica", "bold");
        doc.text(label, x, yPos);
        const labelWidth = doc.getTextWidth(label);
        doc.setFont("Helvetica", "normal");
        doc.text(value, x + labelWidth + 1, yPos);
      };

      drawBankDetail("Bank Name: ", "ICICI Bank Limited, Bellary Infantry Road", 13, bottomStartY + 6);
      drawBankDetail("Bank Account No: ", "728005001677", 13, bottomStartY + 10);
      drawBankDetail("Bank IFSC code: ", "ICIC0007280", 13, bottomStartY + 14);
      drawBankDetail("Account Holder: ", "Black Eagle Travels Private Limited", 13, bottomStartY + 18);

      // Amount in Words
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(brandRed[0], brandRed[1], brandRed[2]);
      doc.text("INVOICE AMOUNT IN WORDS:", 10, bottomStartY + 26);
      
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      const wordsLines = doc.splitTextToSize(numberToWords(selectedInv.totalAmount), 105);
      doc.text(wordsLines, 10, bottomStartY + 30);

      // Terms
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(brandRed[0], brandRed[1], brandRed[2]);
      doc.text("TERMS AND CONDITIONS:", 10, bottomStartY + 38);
      
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      doc.text("Thank you for doing business with us.", 10, bottomStartY + 42);

      // Signature block
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      doc.text(`For: ${companyName}`, 10, bottomStartY + 50);
      
      doc.setFont("Helvetica", "oblique");
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text("EagleTravels", 25, bottomStartY + 58);
      
      doc.setDrawColor(150, 150, 150);
      doc.line(10, bottomStartY + 60, 60, bottomStartY + 60);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
      doc.text("AUTHORIZED SIGNATORY", 10, bottomStartY + 63);

      // Right part: Calculation Grid
      const rightX = 125;
      const colWidth = 75;
      let gridY = bottomStartY;

      const drawGridRow = (label: string, value: string, isHeader = false) => {
        if (isHeader) {
          doc.setFillColor(brandRed[0], brandRed[1], brandRed[2]);
          doc.rect(rightX, gridY, colWidth, 8, "F");
          doc.setTextColor(255, 255, 255);
          doc.setFont("Helvetica", "bold");
        } else {
          doc.setTextColor(textDark[0], textDark[1], textDark[2]);
          doc.setFont("Helvetica", "bold");
        }
        
        doc.setFontSize(8);
        doc.text(label, rightX + 3, gridY + 5.5);
        doc.text(value, rightX + colWidth - 3, gridY + 5.5, { align: "right" });
        
        // Horizontal cell divider
        doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
        doc.setLineWidth(0.2);
        doc.line(rightX, gridY + 8, rightX + colWidth, gridY + 8);
        gridY += 8;
      };

      drawGridRow("SUB TOTAL", `Rs. ${selectedInv.subtotal.toFixed(2)}`);
      drawGridRow(`SGST@${(selectedInv.gstRate / 2).toFixed(1)}%`, `Rs. ${(selectedInv.gstAmount / 2).toFixed(2)}`);
      drawGridRow(`CGST@${(selectedInv.gstRate / 2).toFixed(1)}%`, `Rs. ${(selectedInv.gstAmount / 2).toFixed(2)}`);
      drawGridRow("TOTAL", `Rs. ${selectedInv.totalAmount.toFixed(2)}`, true);
      drawGridRow("RECEIVED", `Rs. ${selectedInv.advanceAmount.toFixed(2)}`);
      drawGridRow("BALANCE", `Rs. ${selectedInv.balanceDue.toFixed(2)}`);
      drawGridRow("AVAILABLE POINTS", "0");

      // Draw outer border and vertical divider ON TOP of grid rows
      doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
      doc.setLineWidth(0.25);
      doc.rect(rightX, bottomStartY, colWidth, 56, "S");
      doc.line(rightX + 45, bottomStartY, rightX + 45, bottomStartY + 56);

      // Save document
      doc.save(`Invoice_${selectedInv.id}.pdf`);
      showToast(`High-fidelity PDF for Invoice ${selectedInv.id} has been generated and downloaded.`, "success");
    } catch (err: any) {
      console.error(err);
      showToast(`Failed to generate PDF: ${err?.message || "Unknown error"}`, "warning");
    }
  };

  const handlePrint = () => {
    try {
      window.print();
      showToast("Opening print dialog... If your browser restricts printing inside the preview panel, please open the app in a new tab.", "info");
    } catch (err: any) {
      console.warn("Print failed:", err);
      showToast("Print blocked by preview frame. Please open the app in a new tab using the top-right icon to print successfully.", "warning");
    }
  };

  const handleOpenCreateModal = () => {
    // Generate next invoice ID
    let nextNum = 1;
    if (db.invoices.length > 0) {
      const ids = db.invoices.map(inv => {
        const parts = inv.id.split("-");
        const numPart = parts[parts.length - 1];
        return parseInt(numPart) || 0;
      });
      nextNum = Math.max(...ids, 0) + 1;
    }
    const nextId = `INV-2026-${String(nextNum).padStart(3, "0")}`;
    
    setInvoiceId(nextId);
    setSelectedTripId("");
    setCustomTripNumber("");
    setCustomerName("");
    setCustomerEmail("");
    setCustomerPhone("");
    setCustomerAddress("");
    setCustomerGST("");
    setSubtotal(0);
    setGstRate(5);
    setAdvanceAmount(0);
    setPaymentStatus("Pending");
    setCreatedAt("2026-07-17");
    setDueDate("2026-07-24");
    setLineItems([{ id: 1, description: "", quantity: 1, unit: "Trip", rate: 0, amount: 0 }]);
    setShowCreateModal(true);
  };

  const handleTripChange = (tripId: string) => {
    setSelectedTripId(tripId);
    if (!tripId) {
      setCustomTripNumber("");
      setCustomerName("");
      setCustomerEmail("");
      setCustomerPhone("");
      setCustomerAddress("");
      setSubtotal(0);
      setAdvanceAmount(0);
      return;
    }

    const trip = db.trips.find(t => t.id === tripId);
    if (trip) {
      setCustomTripNumber(trip.id);
      setCustomerName(trip.customerName);
      
      // Look up customer in customer directory
      const customer = db.customers.find(c => c.id === trip.customerId || c.name === trip.customerName);
      if (customer) {
        setCustomerEmail(customer.email);
        setCustomerPhone(customer.phone);
        setCustomerAddress(customer.address);
        setCustomerGST(customer.gstNumber || "");
      } else {
        setCustomerEmail("");
        setCustomerPhone(trip.driverPhone || "");
        setCustomerAddress("");
        setCustomerGST("");
      }

      const perKmRate = customer?.perKmRate || 13;
      const driverBataRate = customer?.driverBata || 400;

      const baseFare = trip.baseFare || 0;
      const kmCost = (trip.totalKm || 0) * perKmRate;
      const bataCost = (trip.totalBata || 0) * driverBataRate;
      const tollCost = trip.tollCharges || 0;

      const computedSubtotal = (kmCost > 0 || bataCost > 0 || tollCost > 0)
        ? (baseFare + kmCost + bataCost + tollCost)
        : (trip.baseFare || trip.totalFare || 0);

      setSubtotal(computedSubtotal);
      setAdvanceAmount(trip.advancePaid || 0);
    }
  };

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();

    if (!invoiceId.trim()) {
      showToast("Invoice ID is required", "warning");
      return;
    }
    if (!customerName.trim()) {
      showToast("Customer Name is required", "warning");
      return;
    }

    // Check if ID already exists
    if (db.invoices.some(inv => inv.id.toLowerCase() === invoiceId.trim().toLowerCase())) {
      showToast(`Invoice ID ${invoiceId} already exists. Please use a unique ID.`, "warning");
      return;
    }

    const calculatedGst = Math.round((subtotal * gstRate) / 100);
    const calculatedTotal = subtotal + calculatedGst;
    const calculatedBalance = calculatedTotal - advanceAmount;

    // UPI QR Code Generator link
    const upiLink = `upi://pay?pa=eagletravels@hdfc&pn=Eagle%20Travels&am=${calculatedBalance.toFixed(2)}&cu=INR`;

    const newInvoice: Invoice = {
      id: invoiceId.trim(),
      tripId: selectedTripId || invoiceId.trim(),
      tripNumber: customTripNumber.trim() || selectedTripId || "MANUAL",
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim() || "billing@eagletravels.com",
      customerPhone: customerPhone.trim() || "+91 99999 99999",
      customerAddress: customerAddress.trim() || "Indiranagar, Bangalore",
      customerGST: customerGST.trim() || undefined,
      companyName: db.settings.name,
      companyLogo: db.settings.logoUrl,
      companyGST: db.settings.gstNumber,
      companyAddress: db.settings.address,
      companyEmail: db.settings.email,
      companyPhone: db.settings.phone,
      lineItems: lineItems.map(item => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        rate: item.rate,
        amount: item.amount
      })),
      subtotal,
      gstRate,
      gstAmount: calculatedGst,
      totalAmount: calculatedTotal,
      advanceAmount,
      balanceDue: calculatedBalance,
      paymentStatus,
      createdAt,
      dueDate,
      qrCodeData: upiLink
    };

    const updatedInvoices = [newInvoice, ...db.invoices];
    
    onUpdateDb({
      ...db,
      invoices: updatedInvoices
    });

    setSelectedInvId(newInvoice.id);
    setShowCreateModal(false);
    showToast(`Invoice ${newInvoice.id} successfully created manually.`, "success");
  };

  const handleEditInvoice = (e: React.FormEvent) => {
    e.preventDefault();

    if (!editInvoiceId.trim()) {
      showToast("Invoice ID is required", "warning");
      return;
    }
    if (!customerName.trim()) {
      showToast("Customer Name is required", "warning");
      return;
    }

    const calculatedGst = Math.round((subtotal * gstRate) / 100);
    const calculatedTotal = subtotal + calculatedGst;
    const calculatedBalance = calculatedTotal - advanceAmount;

    // UPI QR Code Generator link
    const upiLink = `upi://pay?pa=eagletravels@hdfc&pn=Eagle%20Travels&am=${calculatedBalance.toFixed(2)}&cu=INR`;

    const updatedInvoices = db.invoices.map(inv => {
      if (inv.id === editInvoiceId) {
        return {
          ...inv,
          id: invoiceId.trim(),
          tripId: selectedTripId || invoiceId.trim(),
          tripNumber: customTripNumber.trim() || selectedTripId || "MANUAL",
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim() || "billing@eagletravels.com",
          customerPhone: customerPhone.trim() || "+91 99999 99999",
          customerAddress: customerAddress.trim() || "Indiranagar, Bangalore",
          customerGST: customerGST.trim() || undefined,
          companyName: db.settings.name,
          companyLogo: db.settings.logoUrl,
          companyGST: db.settings.gstNumber,
          companyAddress: db.settings.address,
          companyEmail: db.settings.email,
          companyPhone: db.settings.phone,
          lineItems: lineItems.map(item => ({
            id: item.id,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            rate: item.rate,
            amount: item.amount
          })),
          subtotal,
          gstRate,
          gstAmount: calculatedGst,
          totalAmount: calculatedTotal,
          advanceAmount,
          balanceDue: calculatedBalance,
          paymentStatus,
          createdAt,
          dueDate,
          qrCodeData: upiLink
        };
      }
      return inv;
    });
    
    onUpdateDb({
      ...db,
      invoices: updatedInvoices
    });

    setSelectedInvId(invoiceId.trim());
    setShowEditModal(false);
    showToast(`Invoice ${invoiceId.trim()} successfully updated.`, "success");
  };

  return (
    <div className="space-y-6" id="invoices-view">
      {/* Title Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display text-slate-800">Invoicing & GST Reconciliation</h2>
          <p className="text-sm text-slate-500">Audit tax compliance invoices, download transaction PDFs, and print corporate receipts.</p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Create Invoice
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Invoice entries list (Span 4) */}
        <div className={`bg-white rounded-2xl border border-slate-100 shadow-xs lg:col-span-4 h-[630px] flex-col overflow-hidden ${mobileShowDetails ? "hidden lg:flex" : "flex"}`}>
          <div className="p-4 border-b border-slate-100 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search invoices, customers..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50/50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-brand-500 focus:outline-none transition"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredInvoices.map(inv => (
              <div
                key={inv.id}
                onClick={() => {
                  setSelectedInvId(inv.id);
                  setMobileShowDetails(true);
                }}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex justify-between items-center ${
                  inv.id === selectedInvId
                    ? "border-brand-500 bg-brand-50/30 shadow-2xs"
                    : "border-slate-50 hover:border-slate-100 hover:bg-slate-50/50"
                }`}
              >
                <div>
                  <h4 className="font-mono font-bold text-slate-800 text-sm">{inv.id}</h4>
                  <p className="text-xs text-slate-500 mt-1 truncate max-w-[150px]">{inv.customerName}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                    inv.paymentStatus === "Paid" ? "bg-emerald-50 text-emerald-700" :
                    inv.paymentStatus === "Partial" ? "bg-amber-50 text-amber-700" :
                    "bg-rose-50 text-rose-700"
                  }`}>
                    {inv.paymentStatus}
                  </span>
                  <p className="text-[11px] font-bold text-slate-700 font-mono mt-1">{db.settings.currencySymbol || "₹"}{(inv.totalAmount || 0).toLocaleString("en-IN")}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Premium Invoice Details Canvas (Span 8) */}
        <div className={`bg-white rounded-2xl border border-slate-100 shadow-xs lg:col-span-8 flex-col overflow-hidden ${!mobileShowDetails ? "hidden lg:flex" : "flex"}`} id="invoice-details-panel">
          {/* Mobile Back Header */}
          <div className="lg:hidden p-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
            <button
              type="button"
              onClick={() => setMobileShowDetails(false)}
              className="flex items-center gap-2 text-xs font-bold text-slate-100 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-xl transition cursor-pointer"
              id="mobile-back-invoice-list-btn"
            >
              <ArrowLeft className="w-4 h-4 text-brand-400 shrink-0" />
              <span>Back to Invoices List</span>
            </button>
            {selectedInv && (
              <span className="text-[10px] font-mono font-bold text-slate-300 bg-slate-800 px-2 py-1 rounded">
                {selectedInv.id}
              </span>
            )}
          </div>
          {selectedInv ? (
            <div className="flex flex-col h-full">
              {/* Document Actions Menu Bar */}
              <div className="p-4 border-b border-slate-100 flex flex-wrap gap-2.5 bg-slate-50/50 justify-between items-center shrink-0">
                <span className="text-xs font-semibold text-slate-500">Audit Actions:</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (!selectedInv) return;
                      setEditInvoiceId(selectedInv.id);
                      setInvoiceId(selectedInv.id);
                      setSelectedTripId(selectedInv.tripId);
                      setCustomTripNumber(selectedInv.tripNumber);
                      setCustomerName(selectedInv.customerName);
                      setCustomerEmail(selectedInv.customerEmail);
                      setCustomerPhone(selectedInv.customerPhone);
                      setCustomerAddress(selectedInv.customerAddress);
                      setCustomerGST(selectedInv.customerGST || "");
                      setSubtotal(selectedInv.subtotal);
                      setGstRate(selectedInv.gstRate);
                      setAdvanceAmount(selectedInv.advanceAmount);
                      setPaymentStatus(selectedInv.paymentStatus);
                      setCreatedAt(selectedInv.createdAt);
                      setDueDate(selectedInv.dueDate);
                      // Load line items or create default if none exist
                      if (selectedInv.lineItems && selectedInv.lineItems.length > 0) {
                        setLineItems(selectedInv.lineItems);
                      } else {
                        setLineItems([{ id: 1, description: "", quantity: 1, unit: "Trip", rate: selectedInv.subtotal, amount: selectedInv.subtotal }]);
                      }
                      setShowEditModal(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 text-xs font-semibold rounded-lg transition"
                  >
                    <Settings2 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={handleDownloadPDF}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg transition"
                  >
                    <Download className="w-3.5 h-3.5" /> PDF
                  </button>
                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg transition"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print
                  </button>
                </div>
              </div>

              {/* Printable Invoice Workspace Area */}
              <div className="border border-slate-300 rounded-2xl overflow-hidden bg-white text-slate-900 font-sans shadow-md" id="printable-invoice-container">
                {/* Red Top Info Band */}
                <div className="bg-[#e11d48] text-white p-3 px-5 flex flex-col sm:flex-row justify-between items-center gap-3 text-[11px] border-b border-[#be123c] shrink-0">
                  {/* Phone & Logo */}
                  <div className="flex items-center gap-4 flex-wrap justify-center sm:justify-start">
                    <div className="bg-white p-1.5 rounded-md shrink-0 flex items-center justify-center shadow-xs border border-slate-100 min-w-[36px] min-h-[36px]">
                      {companyLogo ? (
                        <img
                          src={companyLogo}
                          alt="Company Logo"
                          className="w-8 h-8 object-contain rounded"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-8 h-8 text-white flex items-center justify-center font-extrabold font-display text-[11px] bg-[#e11d48] rounded">ET</div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 font-bold">
                      <span className="text-white">📞</span>
                      <span>{companyPhone}</span>
                    </div>
                  </div>
                  
                  {/* Email */}
                  <div className="flex items-center gap-1.5 font-bold">
                    <span>✉️</span>
                    <span>{companyEmail}</span>
                  </div>
                  
                  {/* Address */}
                  <div className="flex items-center gap-1.5 text-[10px] leading-tight text-center sm:text-right max-w-sm font-semibold">
                    <span>📍</span>
                    <span>{companyAddress}</span>
                  </div>
                </div>

                {/* Company Name Slate & Tax Invoice Row */}
                <div className="flex flex-col sm:flex-row justify-between items-stretch bg-white border-b border-slate-200 shrink-0">
                  {/* Slate block with bottom-right curve */}
                  <div className="bg-[#1e2530] text-white p-4 px-6 rounded-br-[40px] shadow-sm flex-1 flex flex-col justify-center min-h-[72px]">
                    <h3 className="font-bold text-base tracking-wide font-display text-white">{companyName}</h3>
                    <div className="text-[10px] opacity-95 font-mono mt-1 flex flex-wrap gap-x-4 text-slate-300">
                      <span>GSTIN: <span className="font-bold text-white">{companyGST}</span></span>
                      <span>State: <span className="font-bold text-white">{companyState}</span></span>
                    </div>
                  </div>
                  
                  {/* Tax Invoice Text */}
                  <div className="p-4 px-6 text-center sm:text-right flex items-center justify-center sm:justify-end shrink-0">
                    <h1 className="text-2xl font-black font-display uppercase tracking-widest text-slate-800">Tax Invoice</h1>
                  </div>
                </div>

                {/* Bill To / Transportation Details / Invoice Details grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 border-b border-slate-200 text-xs text-slate-700 shrink-0">
                  {/* Column 1: Bill To */}
                  <div className="space-y-1">
                    <h4 className="font-black text-[#e11d48] text-xs uppercase tracking-wider mb-2">Bill To</h4>
                    <p className="font-extrabold text-slate-900 text-sm leading-tight">{selectedInv.customerName}</p>
                    <p className="text-slate-600 font-medium leading-relaxed mt-1">{selectedInv.customerAddress}</p>
                    <div className="pt-2 space-y-1 text-slate-700 font-medium">
                      <p><span className="font-bold text-slate-500">Contact No.:</span> {selectedInv.customerPhone || "+91 70226 53888"}</p>
                      <p><span className="font-bold text-slate-500">GSTIN Number:</span> <span className="font-mono font-bold text-slate-900">{selectedInv.customerGST || "29AABCJ3574E1ZJ"}</span></p>
                      <p><span className="font-bold text-slate-500">State:</span> {customerState}</p>
                    </div>
                  </div>

                  {/* Column 2: Transportation Details */}
                  <div className="space-y-1 border-l border-slate-100 pl-0 md:pl-6">
                    <h4 className="font-black text-[#e11d48] text-xs uppercase tracking-wider mb-2">Transportation Details:</h4>
                    <div className="text-slate-700 space-y-1.5 pt-1">
                      <p className="font-bold text-slate-800 text-xs">{vehicleModel}</p>
                      {associatedTrip && (
                        <div className="pt-2 text-[10px] text-slate-500 space-y-0.5">
                          <p>• Route: <span className="font-medium text-slate-700">{associatedTrip.pickup} ➔ {associatedTrip.drop}</span></p>
                          <p>• Start Date: <span className="font-mono text-slate-700">{associatedTrip.startDate}</span></p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Column 3: Invoice Details */}
                  <div className="space-y-1 border-l border-slate-100 pl-0 md:pl-6 text-left md:text-right w-full">
                    <h4 className="font-black text-slate-500 text-[11px] uppercase tracking-wider mb-2">Invoice Particulars</h4>
                    <div className="space-y-1.5 text-slate-700 pt-1">
                      <p className="flex justify-between md:justify-end gap-3"><span className="font-bold text-slate-500">Invoice No.:</span> <span className="font-mono font-extrabold text-slate-900 text-sm">{selectedInv.id}</span></p>
                      <p className="flex justify-between md:justify-end gap-3"><span className="font-bold text-slate-500">Date:</span> <span className="font-mono font-semibold text-slate-800">{selectedInv.createdAt}</span></p>
                      <p className="flex justify-between md:justify-end gap-3"><span className="font-bold text-slate-500">Due Date:</span> <span className="font-mono text-slate-600">{selectedInv.dueDate}</span></p>
                      <p className="flex justify-between md:justify-end gap-3 items-center">
                        <span className="font-bold text-slate-500">Status:</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          selectedInv.paymentStatus === "Paid" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                          selectedInv.paymentStatus === "Partial" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                          "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}>{selectedInv.paymentStatus}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <div className="p-6 shrink-0">
                  <div className="border border-slate-300 rounded-lg overflow-hidden shadow-2xs">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="bg-[#e11d48] text-white text-[10px] font-bold uppercase border-b border-slate-300">
                        <tr>
                          <th className="p-2.5 border-r border-slate-300 text-center w-10 text-white">#</th>
                          <th className="p-2.5 border-r border-slate-300 text-white">Item name</th>
                          <th className="p-2.5 border-r border-slate-300 text-center w-24 text-white">Quantity</th>
                          <th className="p-2.5 border-r border-slate-300 text-center w-20 text-white">Unit</th>
                          <th className="p-2.5 border-r border-slate-300 text-right w-28 text-white">Price/ unit</th>
                          <th className="p-2.5 text-right w-32 text-white">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-300 text-slate-800 font-medium">
                        {itemizedRows.map((row) => (
                          <tr key={row.id} className="hover:bg-slate-50/50">
                            <td className="p-2.5 border-r border-slate-300 text-center font-bold text-slate-500">{row.id}</td>
                            <td className="p-2.5 border-r border-slate-300 font-semibold">{row.description || ""}</td>
                            <td className="p-2.5 border-r border-slate-300 text-center font-mono">{row.quantity || 0}</td>
                            <td className="p-2.5 border-r border-slate-300 text-center text-slate-600">{row.unit || ""}</td>
                            <td className="p-2.5 border-r border-slate-300 text-right font-mono">{db.settings.currencySymbol || "₹"}{(row.rate || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td className="p-2.5 text-right font-mono font-bold text-slate-900">{db.settings.currencySymbol || "₹"}{(row.amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          </tr>
                        ))}
                        {/* Total row at bottom of items table with solid red bg */}
                        <tr className="bg-[#e11d48] text-white font-bold border-t border-slate-300">
                          <td className="p-2.5 border-r border-red-400 text-center text-white"></td>
                          <td className="p-2.5 border-r border-red-400 text-white uppercase text-[10px]">Total</td>
                          <td className="p-2.5 border-r border-red-400 text-white"></td>
                          <td className="p-2.5 border-r border-red-400 text-white"></td>
                          <td className="p-2.5 border-r border-red-400 text-white"></td>
                          <td className="p-2.5 text-right font-mono text-sm text-white">{db.settings.currencySymbol || "₹"}{(selectedInv.subtotal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Footer block: Payment Details & Calculation Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 p-6 text-xs border-t border-slate-200 bg-white shrink-0">
                  {/* Left Column: Bank Details, Terms & Signatures */}
                  <div className="md:col-span-7 space-y-4">
                    {/* Pay To */}
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-[#e11d48] text-xs uppercase tracking-wide">Pay To:</h4>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-slate-700 space-y-0.5">
                        <p><span className="font-bold text-slate-500">Bank Name:</span> Icici Bank Limited, Bellary Infantry Road</p>
                        <p><span className="font-bold text-slate-500">Bank Account No.:</span> <span className="font-mono font-extrabold text-slate-800">728005001677</span></p>
                        <p><span className="font-bold text-slate-500">Bank IFSC code:</span> <span className="font-mono font-extrabold text-slate-800">ICIC0007280</span></p>
                        <p><span className="font-bold text-slate-500">Account Holder's Name:</span> Black Eagle Travels Private Limited</p>
                      </div>
                    </div>

                    {/* Invoice Amount in Words */}
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-[#e11d48] text-[11px] uppercase tracking-wide">Invoice Amount In Words</h4>
                      <p className="font-extrabold text-slate-800 pl-1">
                        {numberToWords(selectedInv.totalAmount)}
                      </p>
                    </div>

                    {/* Terms And Conditions */}
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-[#e11d48] text-[11px] uppercase tracking-wide">Terms And Conditions</h4>
                      <p className="text-slate-600 font-medium pl-1">Thank you for doing business with us.</p>
                    </div>

                    {/* Authorized Signatory Block */}
                    <div className="pt-6 space-y-2">
                      <p className="font-extrabold text-slate-700 text-xs">For: {companyName}</p>
                      <div className="pt-2 pl-2">
                        <div className="h-10 flex items-end pl-6">
                          <span className="italic text-lg text-slate-400 tracking-widest opacity-80 select-none transform -rotate-3 font-semibold" style={{ fontFamily: "Georgia, serif" }}>
                            EagleTravels
                          </span>
                        </div>
                        <div className="w-48 border-t border-slate-400 mt-1"></div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1 pl-1">Authorized Signatory</p>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Bordered Calculation Grid matching sample bill image */}
                  <div className="md:col-span-5">
                    <div className="border border-slate-300 rounded-lg overflow-hidden shadow-2xs">
                      <table className="w-full text-xs text-left border-collapse">
                        <tbody className="divide-y divide-slate-300 text-slate-700 font-bold">
                          {/* Sub Total */}
                          <tr className="bg-slate-50/50">
                            <td className="p-2.5 border-r border-slate-300 font-bold text-slate-700 uppercase text-[10px]">Sub Total</td>
                            <td className="p-2.5 text-right font-mono font-bold text-slate-900">{db.settings.currencySymbol || "₹"}{(selectedInv.subtotal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          </tr>
                          {/* SGST@2.5% */}
                          <tr>
                            <td className="p-2.5 border-r border-slate-300 font-bold text-slate-700 uppercase text-[10px]">SGST@{(selectedInv.gstRate / 2).toFixed(1)}%</td>
                            <td className="p-2.5 text-right font-mono font-bold text-slate-900">{db.settings.currencySymbol || "₹"}{(selectedInv.gstAmount / 2).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          </tr>
                          {/* CGST@2.5% */}
                          <tr>
                            <td className="p-2.5 border-r border-slate-300 font-bold text-slate-700 uppercase text-[10px]">CGST@{(selectedInv.gstRate / 2).toFixed(1)}%</td>
                            <td className="p-2.5 text-right font-mono font-bold text-slate-900">{db.settings.currencySymbol || "₹"}{(selectedInv.gstAmount / 2).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          </tr>
                          {/* Total Row with solid red background */}
                          <tr className="bg-[#e11d48] text-white">
                            <td className="p-2.5 border-r border-red-400 uppercase text-[10px] text-white font-bold">Total</td>
                            <td className="p-2.5 text-right font-mono text-sm text-white font-bold">{db.settings.currencySymbol || "₹"}{(selectedInv.totalAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          </tr>
                          {/* Received */}
                          <tr className="bg-slate-50/30">
                            <td className="p-2.5 border-r border-slate-300 font-bold text-slate-700 uppercase text-[10px]">Received</td>
                            <td className="p-2.5 text-right font-mono font-bold text-slate-900">{db.settings.currencySymbol || "₹"}{selectedInv.advanceAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          </tr>
                          {/* Balance */}
                          <tr className={selectedInv.balanceDue > 0 ? "bg-rose-50/30 text-rose-700" : "bg-slate-50/30"}>
                            <td className="p-2.5 border-r border-slate-300 font-bold text-slate-700 uppercase text-[10px]">Balance</td>
                            <td className="p-2.5 text-right font-mono font-bold">{db.settings.currencySymbol || "₹"}{(selectedInv.balanceDue || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          </tr>
                          {/* Available Points */}
                          <tr className="bg-slate-50/50">
                            <td className="p-2.5 border-r border-slate-300 font-bold text-slate-700 uppercase text-[10px]">Available Points</td>
                            <td className="p-2.5 text-right font-mono font-bold text-slate-800 flex items-center justify-end gap-1">
                              <span>0</span>
                              <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-slate-400 text-white text-[9px]">★</span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center text-slate-400 text-sm py-20">
              Select an invoice on the left to review billing items.
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in text-slate-800" id="create-invoice-modal">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-4xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-brand-500/20 rounded-xl text-brand-400">
                  <FileText className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-sm text-white">Issue Manual Tax Invoice</h3>
                  <p className="text-[10px] text-slate-300">Generate compliance receipts & direct UPI payment routing</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateInvoice} className="flex-1 overflow-y-auto flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-100">
              {/* Left Form inputs (scrollable) */}
              <div className="p-6 space-y-5 flex-1 overflow-y-auto max-h-[calc(90vh-140px)]">
                
                {/* Reference & Timeline Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Invoice Code</label>
                    <input
                      type="text"
                      required
                      value={invoiceId}
                      onChange={e => setInvoiceId(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-700 focus:bg-white focus:border-brand-500 focus:outline-none transition"
                      placeholder="e.g. INV-2026-003"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Issue Date</label>
                    <input
                      type="date"
                      required
                      value={createdAt}
                      onChange={e => setCreatedAt(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-semibold text-slate-700 focus:bg-white focus:border-brand-500 focus:outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Due Date</label>
                    <input
                      type="date"
                      required
                      value={dueDate}
                      onChange={e => setDueDate(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-semibold text-slate-700 focus:bg-white focus:border-brand-500 focus:outline-none transition"
                    />
                  </div>
                </div>

                {/* Trip Association Selection */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-brand-600 uppercase tracking-wider block mb-1">Associate Existing Booking Trip (Optional)</label>
                    <select
                      value={selectedTripId}
                      onChange={e => handleTripChange(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:border-brand-500 focus:outline-none transition"
                    >
                      <option value="">-- Manual Input (No Association) --</option>
                      {db.trips.map(trip => (
                        <option key={trip.id} value={trip.id}>
                          {trip.id} - {trip.customerName} ({trip.pickup} ➔ {trip.drop})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Trip Reference Code</label>
                    <input
                      type="text"
                      value={customTripNumber}
                      onChange={e => setCustomTripNumber(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-semibold text-slate-700 focus:border-brand-500 focus:outline-none transition"
                      placeholder="e.g. TRIP-2026-101 or MANUAL"
                    />
                  </div>
                </div>

                {/* Customer Information */}
                <div className="space-y-3">
                  <h4 className="text-[11px] font-bold font-display uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-brand-500" /> Billed To (Client Particulars)
                  </h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Client Name</label>
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={e => setCustomerName(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:bg-white focus:border-brand-500 focus:outline-none transition"
                        placeholder="Aditya Hegde"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Client GSTIN (Optional)</label>
                      <input
                        type="text"
                        value={customerGST}
                        onChange={e => setCustomerGST(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-semibold text-slate-700 focus:bg-white focus:border-brand-500 focus:outline-none transition"
                        placeholder="e.g. 29ABCDE1234F1Z8"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Email Address</label>
                      <input
                        type="email"
                        value={customerEmail}
                        onChange={e => setCustomerEmail(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:bg-white focus:border-brand-500 focus:outline-none transition"
                        placeholder="aditya@techcorp.com"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Contact Phone</label>
                      <input
                        type="text"
                        value={customerPhone}
                        onChange={e => setCustomerPhone(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:bg-white focus:border-brand-500 focus:outline-none transition"
                        placeholder="+91 98801 23456"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Billing Address</label>
                    <textarea
                      value={customerAddress}
                      onChange={e => setCustomerAddress(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:bg-white focus:border-brand-500 focus:outline-none transition resize-none"
                      placeholder="Prestige Tech Park, Block C, Bangalore - 560103"
                    />
                  </div>
                </div>

                {/* Line Items Editor */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-brand-600 uppercase tracking-wider">Invoice Line Items</h4>
                    <button
                      type="button"
                      onClick={handleAddLineItem}
                      className="px-2 py-1 bg-brand-50 hover:bg-brand-100 text-brand-600 border border-brand-200 text-[10px] font-bold rounded transition flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Item
                    </button>
                  </div>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto border border-slate-200 rounded-lg p-3 bg-slate-50">
                    {lineItems.map((item, index) => (
                      <div key={item.id} className="bg-white border border-slate-200 rounded-lg p-3 space-y-2">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-bold text-slate-400">ITEM #{index + 1}</span>
                          {lineItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveLineItem(item.id)}
                              className="text-rose-500 hover:text-rose-700 transition"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Description</label>
                          <input
                            type="text"
                            value={item.description}
                            onChange={e => handleLineItemChange(item.id, 'description', e.target.value)}
                            className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700 focus:bg-white focus:border-brand-500 focus:outline-none transition"
                            placeholder="e.g., Transportation charges from Ballari to Bangalore"
                          />
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Qty</label>
                            <input
                              type="number"
                              step="0.01"
                              value={item.quantity}
                              onChange={e => handleLineItemChange(item.id, 'quantity', Number(e.target.value))}
                              className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-mono text-slate-700 focus:bg-white focus:border-brand-500 focus:outline-none transition"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Unit</label>
                            <input
                              type="text"
                              value={item.unit}
                              onChange={e => handleLineItemChange(item.id, 'unit', e.target.value)}
                              className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700 focus:bg-white focus:border-brand-500 focus:outline-none transition"
                              placeholder="Trip/Km/Day"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Rate (₹)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={item.rate}
                              onChange={e => handleLineItemChange(item.id, 'rate', Number(e.target.value))}
                              className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-mono text-slate-700 focus:bg-white focus:border-brand-500 focus:outline-none transition"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Amount (₹)</label>
                            <input
                              type="number"
                              value={item.amount}
                              readOnly
                              className="w-full px-2 py-1 bg-slate-100 border border-slate-300 rounded text-xs font-mono font-bold text-slate-800 cursor-not-allowed"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-blue-700">
                      Subtotal is automatically calculated from line items. Add/edit items above to update the invoice total.
                    </p>
                  </div>
                </div>

                {/* Ledger Item Details */}
                <div className="space-y-3">
                  <h4 className="text-[11px] font-bold font-display uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <IndianRupee className="w-3.5 h-3.5 text-emerald-500" /> Itemized Financial Particulars
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Subtotal / Base Fare - Auto-calculated</label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-2 text-xs font-semibold text-slate-400">{db.settings.currencySymbol || "₹"}</span>
                        <input
                          type="number"
                          min="0"
                          required
                          value={subtotal || ""}
                          readOnly
                          className="w-full pl-6 pr-3 py-1.5 bg-slate-100 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-800 cursor-not-allowed"
                          placeholder="e.g. 25000"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">GST Tax Rate</label>
                      <select
                        value={gstRate}
                        onChange={e => setGstRate(parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:bg-white focus:border-brand-500 focus:outline-none transition"
                      >
                        <option value={0}>0% No Tax</option>
                        <option value={5}>5% Rent-A-Cab GST</option>
                        <option value={12}>12% Transport Service</option>
                        <option value={18}>18% Executive Logistics</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Advance Received</label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-2 text-xs font-semibold text-slate-400">{db.settings.currencySymbol || "₹"}</span>
                        <input
                          type="number"
                          min="0"
                          required
                          value={advanceAmount || ""}
                          onChange={e => setAdvanceAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                          className="w-full pl-6 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-700 focus:bg-white focus:border-brand-500 focus:outline-none transition"
                          placeholder="e.g. 10000"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-amber-50/20 p-3 rounded-xl border border-amber-100/50">
                    <div>
                      <label className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block mb-1">Manual Payment Status Override</label>
                      <select
                        value={paymentStatus}
                        onChange={e => setPaymentStatus(e.target.value as any)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:border-brand-500 focus:outline-none transition"
                      >
                        <option value="Pending">🔴 Pending (No Payment)</option>
                        <option value="Partial">🟡 Partial (Advance Paid)</option>
                        <option value="Paid">🟢 Paid (Settled)</option>
                      </select>
                      <p className="text-[9px] text-amber-600 mt-1 italic">Suggested status based on payment math will update dynamically.</p>
                    </div>

                    <div className="text-xs text-slate-500 flex flex-col justify-center space-y-1 pl-2 border-l border-slate-200/50">
                      <p>• GST Calculated Amount: <span className="font-mono font-bold text-slate-700">{db.settings.currencySymbol || "₹"}{Math.round((subtotal * gstRate) / 100).toLocaleString("en-IN")}</span></p>
                      <p>• Total (Base + Tax): <span className="font-mono font-bold text-slate-700">{db.settings.currencySymbol || "₹"}{(subtotal + Math.round((subtotal * gstRate) / 100)).toLocaleString("en-IN")}</span></p>
                      <p>• Balance Outstanding: <span className="font-mono font-bold text-rose-600">{db.settings.currencySymbol || "₹"}{(subtotal + Math.round((subtotal * gstRate) / 100) - advanceAmount).toLocaleString("en-IN")}</span></p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Ledger Live Preview Block */}
              <div className="w-full md:w-80 bg-slate-50 p-6 flex flex-col shrink-0 justify-between">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ledger Compliance Sheet Preview</h4>
                  
                  {/* Digital Preview Box */}
                  <div className="bg-white rounded-xl border border-slate-200/60 p-4 shadow-sm space-y-4">
                    <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                      <div>
                        <p className="text-[9px] text-slate-400 font-bold uppercase">Invoice Code</p>
                        <p className="font-mono font-bold text-slate-800 text-sm mt-0.5">{invoiceId || "INV-XXXX"}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        paymentStatus === "Paid" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                        paymentStatus === "Partial" ? "bg-amber-50 text-amber-700 border border-amber-100" :
                        "bg-rose-50 text-rose-700 border border-rose-100"
                      }`}>
                        {paymentStatus}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <p className="text-[9px] text-slate-400 font-bold uppercase">Client Particulars</p>
                      <p className="font-bold text-slate-800">{customerName || "No Client Selected"}</p>
                      {customerPhone && <p className="text-slate-500 text-[11px] font-medium">📞 {customerPhone}</p>}
                      {customerGST && <p className="text-[10px] text-slate-400 font-mono font-semibold">GSTIN: {customerGST}</p>}
                    </div>

                    <div className="border-t border-slate-100 pt-3 space-y-2 text-xs">
                      <div className="flex justify-between text-slate-500">
                        <span>Base Fare:</span>
                        <span className="font-mono font-semibold text-slate-700">{db.settings.currencySymbol || "₹"}{subtotal.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>GST ({gstRate}%):</span>
                        <span className="font-mono font-semibold text-slate-700">{db.settings.currencySymbol || "₹"}{Math.round((subtotal * gstRate) / 100).toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between border-t border-slate-100 pt-1.5 font-bold text-slate-800">
                        <span>Grand Total:</span>
                        <span className="font-mono text-brand-600">{db.settings.currencySymbol || "₹"}{(subtotal + Math.round((subtotal * gstRate) / 100)).toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between text-emerald-600">
                        <span>Advance Paid:</span>
                        <span className="font-mono">- {db.settings.currencySymbol || "₹"}{advanceAmount.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between border-t border-dashed border-slate-200 pt-1.5 font-bold text-rose-600">
                        <span>Balance Due:</span>
                        <span className="font-mono">{db.settings.currencySymbol || "₹"}{(subtotal + Math.round((subtotal * gstRate) / 100) - advanceAmount).toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-emerald-500/10 rounded-xl p-3 border border-emerald-500/20 text-[11px] text-emerald-800 leading-relaxed font-medium">
                    ✨ Selecting an associated Trip booking instantly fills all details such as client name, address, phone number, and transaction base prices!
                  </div>
                </div>

                {/* Submit Actions */}
                <div className="pt-4 space-y-2">
                  <button
                    type="submit"
                    className="w-full py-2 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4" /> Finalize & Issue Bill
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="w-full py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl text-xs transition cursor-pointer"
                  >
                    Cancel Creation
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Edit Invoice Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in text-slate-800" id="edit-invoice-modal">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-4xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-brand-500/20 rounded-xl text-brand-400">
                  <Settings2 className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-sm text-white">Edit Invoice</h3>
                  <p className="text-[10px] text-slate-300">Update invoice details and recalculate totals</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleEditInvoice} className="flex-1 overflow-y-auto flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-100">
              {/* Left Form inputs (scrollable) */}
              <div className="flex-1 overflow-y-auto max-h-[calc(90vh-140px)]">
                
                {/* Reference & Timeline Row - Sticky Header */}
                <div className="bg-slate-50 p-6 border-b border-slate-200 sticky top-0 z-10">
                  <h4 className="text-xs font-bold text-brand-600 uppercase tracking-wider mb-3">Invoice Reference Details</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Invoice Code</label>
                      <input
                        type="text"
                        required
                        value={invoiceId}
                        onChange={e => setInvoiceId(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-700 focus:bg-white focus:border-brand-500 focus:outline-none transition"
                        placeholder="e.g. INV-2026-003"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Issue Date</label>
                      <input
                        type="date"
                        required
                        value={createdAt}
                        onChange={e => setCreatedAt(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-semibold text-slate-700 focus:bg-white focus:border-brand-500 focus:outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Due Date</label>
                      <input
                        type="date"
                        required
                        value={dueDate}
                        onChange={e => setDueDate(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-semibold text-slate-700 focus:bg-white focus:border-brand-500 focus:outline-none transition"
                      />
                    </div>
                  </div>
                </div>

                {/* Scrollable Content Area */}
                <div className="p-6 space-y-5">
                  {/* Trip Linking */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Link to Trip (Optional)</label>
                    <select
                      value={selectedTripId}
                      onChange={e => handleTripChange(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:bg-white focus:border-brand-500 focus:outline-none transition"
                    >
                      <option value="">-- Manual Entry (No Trip Link) --</option>
                      {db.trips.map(trip => (
                        <option key={trip.id} value={trip.id}>
                          {trip.id} - {trip.customerName} ({trip.pickup} → {trip.drop}) [{trip.startDate}]
                        </option>
                      ))}
                    </select>
                  </div>

                {/* Customer Details */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-brand-600 uppercase tracking-wider">Client Billing Details</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Customer Name *</label>
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={e => setCustomerName(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:bg-white focus:border-brand-500 focus:outline-none transition"
                        placeholder="e.g., Eagle Travels Pvt Ltd"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Customer Phone</label>
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={e => setCustomerPhone(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-semibold text-slate-700 focus:bg-white focus:border-brand-500 focus:outline-none transition"
                        placeholder="+91 99999 99999"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Customer Email</label>
                      <input
                        type="email"
                        value={customerEmail}
                        onChange={e => setCustomerEmail(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-semibold text-slate-700 focus:bg-white focus:border-brand-500 focus:outline-none transition"
                        placeholder="billing@company.com"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Customer GST Number</label>
                      <input
                        type="text"
                        value={customerGST}
                        onChange={e => setCustomerGST(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-700 focus:bg-white focus:border-brand-500 focus:outline-none transition uppercase"
                        placeholder="29AABCJ3574E1ZJ"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Billing Address</label>
                    <textarea
                      value={customerAddress}
                      onChange={e => setCustomerAddress(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-normal text-slate-700 focus:bg-white focus:border-brand-500 focus:outline-none transition resize-none"
                      placeholder="Street, City, State, PIN"
                    ></textarea>
                  </div>
                </div>

                {/* Line Items Editor */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-brand-600 uppercase tracking-wider">Invoice Line Items</h4>
                    <button
                      type="button"
                      onClick={handleAddLineItem}
                      className="px-2 py-1 bg-brand-50 hover:bg-brand-100 text-brand-600 border border-brand-200 text-[10px] font-bold rounded transition flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Item
                    </button>
                  </div>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto border border-slate-200 rounded-lg p-3 bg-slate-50">
                    {lineItems.map((item, index) => (
                      <div key={item.id} className="bg-white border border-slate-200 rounded-lg p-3 space-y-2">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-bold text-slate-400">ITEM #{index + 1}</span>
                          {lineItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveLineItem(item.id)}
                              className="text-rose-500 hover:text-rose-700 transition"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Description</label>
                          <input
                            type="text"
                            value={item.description}
                            onChange={e => handleLineItemChange(item.id, 'description', e.target.value)}
                            className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700 focus:bg-white focus:border-brand-500 focus:outline-none transition"
                            placeholder="e.g., Transportation charges from Ballari to Bangalore"
                          />
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Qty</label>
                            <input
                              type="number"
                              step="0.01"
                              value={item.quantity}
                              onChange={e => handleLineItemChange(item.id, 'quantity', Number(e.target.value))}
                              className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-mono text-slate-700 focus:bg-white focus:border-brand-500 focus:outline-none transition"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Unit</label>
                            <input
                              type="text"
                              value={item.unit}
                              onChange={e => handleLineItemChange(item.id, 'unit', e.target.value)}
                              className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700 focus:bg-white focus:border-brand-500 focus:outline-none transition"
                              placeholder="Trip/Km/Day"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Rate (₹)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={item.rate}
                              onChange={e => handleLineItemChange(item.id, 'rate', Number(e.target.value))}
                              className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-mono text-slate-700 focus:bg-white focus:border-brand-500 focus:outline-none transition"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Amount (₹)</label>
                            <input
                              type="number"
                              value={item.amount}
                              readOnly
                              className="w-full px-2 py-1 bg-slate-100 border border-slate-300 rounded text-xs font-mono font-bold text-slate-800 cursor-not-allowed"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-blue-700">
                      Subtotal is automatically calculated from line items. Add/edit items above to update the invoice total.
                    </p>
                  </div>
                </div>

                {/* Pricing & GST Calculation */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-brand-600 uppercase tracking-wider">Tax & Payment Calculation</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Subtotal (₹) - Auto-calculated</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={subtotal}
                        readOnly
                        className="w-full px-3 py-1.5 bg-slate-100 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-800 cursor-not-allowed"
                        placeholder="10000"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">GST Rate (%) *</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={gstRate}
                        onChange={e => setGstRate(Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-700 focus:bg-white focus:border-brand-500 focus:outline-none transition"
                        placeholder="5"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Advance Received (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={advanceAmount}
                      onChange={e => setAdvanceAmount(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-700 focus:bg-white focus:border-brand-500 focus:outline-none transition"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Payment Status</label>
                    <select
                      value={paymentStatus}
                      onChange={e => setPaymentStatus(e.target.value as any)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:bg-white focus:border-brand-500 focus:outline-none transition"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Partial">Partial</option>
                      <option value="Paid">Paid</option>
                    </select>
                  </div>
                </div>
                </div>
              </div>

              {/* Right preview summary (sticky) */}
              <div className="w-full md:w-72 bg-slate-50/50 p-5 space-y-4 shrink-0">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Invoice Summary</h4>
                
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Subtotal:</span>
                    <span className="font-mono font-bold text-slate-800">₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">GST ({gstRate}%):</span>
                    <span className="font-mono font-bold text-slate-800">₹{Math.round((subtotal * gstRate) / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                    <span className="font-bold text-slate-700">Total Amount:</span>
                    <span className="font-mono font-bold text-brand-600 text-sm">₹{(subtotal + Math.round((subtotal * gstRate) / 100)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Advance Paid:</span>
                    <span className="font-mono font-bold text-emerald-600">₹{advanceAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                    <span className="font-bold text-slate-700">Balance Due:</span>
                    <span className="font-mono font-bold text-rose-600 text-sm">₹{Math.max(0, (subtotal + Math.round((subtotal * gstRate) / 100)) - advanceAmount).toFixed(2)}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 space-y-2">
                  <button
                    type="submit"
                    className="w-full px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-lg shadow-sm transition"
                  >
                    Update Invoice
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="w-full px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
