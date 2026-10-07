import SignatoryDetails from "./SignatoryDetails";
import React from "react";
import { Document, Page, Text, View, StyleSheet, Font, Image } from "@react-pdf/renderer";
import { buildScaledStyles } from "./Pdfheaderscaling";
import { isRasterImage } from "./watermarkUtils";
import { safeHyphenation } from "./layoutUtils";
Font.register({ family: "Inter", src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYMZhrib2Bg-4.ttf" });
Font.register({ family: "Inter-SemiBold", src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYMZhrib2Bg-4.ttf" });
Font.register({ family: "Inter-Bold", src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYMZhrib2Bg-4.ttf" });
Font.registerHyphenationCallback(safeHyphenation);
const B = "Inter-Bold";
const M = "Inter-SemiBold";
const hexToRgba = (hex, alpha) => {
  if (!hex) return "rgba(0, 0, 0, " + alpha + ")";
  let clean = hex.replace("#", "");
  if (clean.length === 3) clean = clean.split("").map((c) => c + c).join("");
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
};
function numberToWords(num) {
  if (!num) return "Zero";
  const a = ["", "One ", "Two ", "Three ", "Four ", "Five ", "Six ", "Seven ", "Eight ", "Nine ", "Ten ", "Eleven ", "Twelve ", "Thirteen ", "Fourteen ", "Fifteen ", "Sixteen ", "Seventeen ", "Eighteen ", "Nineteen "];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  let numStr = String(num).split(".")[0];
  if (numStr.length > 9) return String(num);
  if (numStr.length === 0) return "Zero";
  const getGroup = (nStr) => {
    let w = "";
    const n = parseInt(nStr, 10);
    if (n > 99) w += a[Math.floor(n / 100)] + "Hundred ";
    const rem = n % 100;
    if (rem > 0) {
      if (rem < 20) w += a[rem];
      else {
        w += b[Math.floor(rem / 10)] + " ";
        if (rem % 10 > 0) w += a[rem % 10];
      }
    }
    return w;
  };
  let crores = 0, lakhs = 0, thousands = 0, rest = 0;
  if (numStr.length > 7) {
    crores = parseInt(numStr.substring(0, numStr.length - 7), 10);
    numStr = numStr.substring(numStr.length - 7);
  }
  if (numStr.length > 5) {
    lakhs = parseInt(numStr.substring(0, numStr.length - 5), 10);
    numStr = numStr.substring(numStr.length - 5);
  }
  if (numStr.length > 3) {
    thousands = parseInt(numStr.substring(0, numStr.length - 3), 10);
    numStr = numStr.substring(numStr.length - 3);
  }
  rest = parseInt(numStr, 10);
  let words = "";
  if (crores) words += getGroup(String(crores)) + "Crore ";
  if (lakhs) words += getGroup(String(lakhs)) + "Lakh ";
  if (thousands) words += getGroup(String(thousands)) + "Thousand ";
  if (rest) words += getGroup(String(rest));
  return words.trim();
}
export default function Template16({ invoice }) {
  const { client, user: biz } = invoice;
  Font.registerHyphenationCallback(safeHyphenation);
  const colors = invoice.templateColors || { primary: "#1F4B3F" };
  const PRIMARY = colors.primary;
  const scaled = buildScaledStyles(biz);
  const s = StyleSheet.create({
    page: { paddingTop: 28, paddingBottom: 60, paddingHorizontal: 34, fontFamily: "Inter", color: "#1a1a1a", fontSize: 8.5 },
    watermarkContainer: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center", zIndex: -100 },
    watermarkImg: { width: 250, height: 250, objectFit: "contain", opacity: 0.12 },
    watermarkText: { fontSize: 60, fontFamily: B, color: hexToRgba(PRIMARY, 0.08), transform: "rotate(-45deg)", letterSpacing: 5 },
    outerBox: { borderWidth: 1, borderColor: PRIMARY },
    // Header — brand on left (constrained), badge inline on right
    headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", padding: 12, borderBottomWidth: 1, borderBottomColor: PRIMARY },
    brandRow: { flexDirection: "row", alignItems: "flex-start", flex: 1, paddingRight: 10, maxWidth: "72%" },
    logo: { width: 34, height: 34, objectFit: "contain", marginRight: 8 },
    bizInfo: { flex: 1, maxWidth: "100%" },
    bizName: { fontFamily: B, fontSize: scaled.bizNameFontSize, color: PRIMARY, textTransform: "uppercase", marginBottom: 2 },
    bizText: { fontSize: scaled.bizSubTextFontSize, color: "#444", lineHeight: scaled.bizSubTextLineHeight, marginBottom: 1 },
    // Badge — sits inline at top-right of the header
    docTypeTag: { backgroundColor: PRIMARY, color: "#fff", fontFamily: B, fontSize: 9, letterSpacing: 1.5, paddingVertical: 4, paddingHorizontal: 12, textAlign: "center", flexShrink: 0 },
    // Bill To + Invoice Meta section
    billToRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: PRIMARY },
    billToCol: { flex: 1, minWidth: 0, padding: 10, borderRightWidth: 1, borderRightColor: PRIMARY },
    billToColLast: { flex: 1, minWidth: 0, padding: 10 },
    partyLabel: { fontSize: 7, fontFamily: B, color: PRIMARY, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
    partyName: { fontSize: 8.5, fontFamily: B, color: "#000", marginBottom: 2 },
    partyText: { fontSize: 7.5, color: "#333", lineHeight: 1.4, marginBottom: 1 },
    invoiceMetaGrid: { flexDirection: "row", flexWrap: "wrap" },
    invoiceMetaItem: { width: "50%", minWidth: 0, paddingRight: 6, marginBottom: 5 },
    invoiceMetaItemLabel: { fontSize: 6.5, color: "#666", marginBottom: 1 },
    invoiceMetaItemValue: { fontSize: 8, fontFamily: B, color: "#000" },
    table: {},
    tHead: { flexDirection: "row", backgroundColor: PRIMARY, paddingVertical: 5 },
    th: { fontSize: 6.8, fontFamily: B, color: "#fff", textTransform: "uppercase", paddingHorizontal: 3 },
    tRow: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#D8DEDC", paddingVertical: 5, minHeight: 18 },
    td: { fontSize: 7.5, color: "#111", paddingHorizontal: 3 },
    colNo: { width: "4%", textAlign: "center" },
    colDesc: { width: "27%" },
    colHsn: { width: "10%", textAlign: "center" },
    colRate: { width: "12%", textAlign: "right" },
    colQty: { width: "7%", textAlign: "center" },
    colTaxable: { width: "13%", textAlign: "right" },
    colTax: { width: "14%", textAlign: "right" },
    colTotal: { width: "13%", textAlign: "right", paddingRight: 6 },
    wordsStrip: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: PRIMARY, borderBottomWidth: 1, borderBottomColor: PRIMARY, padding: 8, backgroundColor: hexToRgba(PRIMARY, 0.05) },
    wordsText: { fontSize: 7, color: "#333", flex: 1, paddingRight: 10 },
    totalsRow: { flexDirection: "row", justifyContent: "space-between" },
    notesCol: { flex: 1, padding: 10, borderRightWidth: 1, borderRightColor: PRIMARY },
    totalsCol: { width: 200, padding: 10 },
    totalLine: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2.5, paddingHorizontal: 4 },
    totalLineAlt: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2.5, paddingHorizontal: 4, backgroundColor: "#F7F9F8" },
    totalLabel: { fontSize: 7.5, color: "#333" },
    totalVal: { fontSize: 7.5, fontFamily: M, color: "#000" },
    grandLine: { flexDirection: "row", justifyContent: "space-between", backgroundColor: PRIMARY, padding: 6, marginTop: 6 },
    grandLabel: { fontSize: 9.5, fontFamily: B, color: "#fff" },
    grandVal: { fontSize: 9.5, fontFamily: B, color: "#fff" },
    paidBadge: { marginTop: 6, alignSelf: "flex-end", paddingVertical: 3, paddingHorizontal: 8, borderRadius: 3, backgroundColor: "#E8F5EC", flexDirection: "row", alignItems: "center" },
    paidBadgeDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: "#2E7D46", marginRight: 4 },
    paidBadgeText: { fontSize: 7, fontFamily: B, color: "#2E7D46" },
    dueBadge: { marginTop: 6, alignSelf: "flex-end", paddingVertical: 3, paddingHorizontal: 8, borderRadius: 3, backgroundColor: "#FDECEC", flexDirection: "row", alignItems: "center" },
    dueBadgeDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: "#C43D3D", marginRight: 4 },
    dueBadgeText: { fontSize: 7, fontFamily: B, color: "#C43D3D" },
    noteLabel: { fontSize: 7, fontFamily: B, color: PRIMARY, textTransform: "uppercase", marginBottom: 3 },
    noteText: { fontSize: 7.2, color: "#333", lineHeight: 1.4, marginBottom: 6 },
    bottomRow: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: PRIMARY },
    bankCol: { flex: 1, padding: 10, borderRightWidth: 1, borderRightColor: PRIMARY },
    bankLabel: { fontSize: 7, fontFamily: B, color: PRIMARY, textTransform: "uppercase", marginBottom: 4 },
    bankRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 1.5 },
    bankKey: { fontSize: 7, color: "#555", width: 55, flexShrink: 0 },
    bankVal: { fontSize: 7, fontFamily: M, color: "#000", flex: 1, minWidth: 0 },
    sigCol: { width: 170, padding: 10, alignItems: "center" },
    sigFor: { fontSize: 7, color: "#555", marginBottom: 20 },
    sigLine: { fontSize: 7, color: "#333", textAlign: "center", paddingTop: 3, borderTopWidth: 0.5, borderTopColor: "#999", width: 130 },
    footerNote: { marginTop: 10, textAlign: "center" },
    footerNoteText: { fontSize: 6.3, color: "#888" },
    footerBar: { position: "absolute", bottom: 20, left: 34, right: 34, borderTopWidth: 0.5, borderTopColor: "#DDD", paddingTop: 6, flexDirection: "row", justifyContent: "space-between" },
    footerBrand: { fontSize: 6.8, fontFamily: B, color: PRIMARY },
    footerTrust: { fontSize: 6.5, color: "#333333" }
  });
  const currency = invoice._currency || invoice.currency || "INR";
  const fmt = (n) => new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);
  const bizName = biz?.businessName || biz?.name || "Your Business";
  const isQuotation = invoice.invoiceType === "quotation";
  const docTitle = isQuotation ? "QUOTATION" : "TAX INVOICE";
  const hasHsn = invoice.items?.some((i) => i.hsn);
  const totalInWords = numberToWords(Math.floor(invoice.total || 0));
  const totalQty = invoice.items?.reduce((acc, i) => acc + (Number(i.quantity) || 0), 0) || 0;
  const paidAmount = invoice.paidAmount || 0;
  const balanceDue = Math.max((invoice.total || 0) - paidAmount, 0);
  const isFullyPaid = !isQuotation && paidAmount > 0 && balanceDue <= 0.01;
  return /* @__PURE__ */ React.createElement(Document, null, /* @__PURE__ */ React.createElement(Page, { size: "A4", style: s.page }, !biz?.plan || String(biz.plan).toLowerCase() === "free" ? /* @__PURE__ */ React.createElement(View, { style: s.watermarkContainer, pointerEvents: "none", fixed: true }, /* @__PURE__ */ React.createElement(Text, { style: s.watermarkText }, "GoodSynk")) : isRasterImage(invoice.watermarkImage || biz.watermarkImage) ? /* @__PURE__ */ React.createElement(View, { style: s.watermarkContainer, pointerEvents: "none", fixed: true }, /* @__PURE__ */ React.createElement(Image, { src: invoice.watermarkImage || biz.watermarkImage, style: s.watermarkImg })) : null, /* @__PURE__ */ React.createElement(View, { style: s.outerBox }, /* @__PURE__ */ React.createElement(View, { style: s.headerRow }, /* @__PURE__ */ React.createElement(View, { style: s.brandRow }, biz?.businessLogo && /* @__PURE__ */ React.createElement(Image, { src: biz.businessLogo, style: s.logo }), /* @__PURE__ */ React.createElement(View, { style: s.bizInfo }, /* @__PURE__ */ React.createElement(Text, { numberOfLines: 1, style: s.bizName }, bizName), biz?.gstin && /* @__PURE__ */ React.createElement(Text, { style: s.bizText }, "GSTIN: ", biz.gstin), biz?.address?.street && /* @__PURE__ */ React.createElement(Text, { style: s.bizText }, biz.address.street), biz?.address?.city && /* @__PURE__ */ React.createElement(Text, { style: s.bizText }, biz.address.city, ", ", biz.address.state, " ", biz.address.pincode), biz?.phone && /* @__PURE__ */ React.createElement(Text, { style: s.bizText }, "Mobile ", biz.phone))), /* @__PURE__ */ React.createElement(View, { style: s.docTypeTag }, /* @__PURE__ */ React.createElement(Text, null, docTitle))), /* @__PURE__ */ React.createElement(View, { style: s.billToRow }, /* @__PURE__ */ React.createElement(View, { style: s.billToCol }, /* @__PURE__ */ React.createElement(Text, { style: s.partyLabel }, "Bill To"), /* @__PURE__ */ React.createElement(Text, { style: s.partyName }, client?.name), client?.companyName && /* @__PURE__ */ React.createElement(Text, { style: s.partyText }, client.companyName), client?.address?.street && /* @__PURE__ */ React.createElement(Text, { style: s.partyText }, client.address.street), client?.address?.city && /* @__PURE__ */ React.createElement(Text, { style: s.partyText }, client.address.city, ", ", client.address.state, " ", client.address.pincode), client?.phone && /* @__PURE__ */ React.createElement(Text, { style: s.partyText }, "Ph: ", client.phone), client?.gstin && /* @__PURE__ */ React.createElement(Text, { style: s.partyText }, "GSTIN: ", client.gstin)), /* @__PURE__ */ React.createElement(View, { style: s.billToColLast }, /* @__PURE__ */ React.createElement(Text, { style: s.partyLabel }, "Invoice Details"), /* @__PURE__ */ React.createElement(View, { style: s.invoiceMetaGrid }, /* @__PURE__ */ React.createElement(View, { style: s.invoiceMetaItem }, /* @__PURE__ */ React.createElement(Text, { style: s.invoiceMetaItemLabel }, isQuotation ? "Quotation No." : "Invoice No."), /* @__PURE__ */ React.createElement(Text, { style: s.invoiceMetaItemValue }, invoice.invoiceNumber || invoice.quotationNumber || "\u2014")), /* @__PURE__ */ React.createElement(View, { style: s.invoiceMetaItem }, /* @__PURE__ */ React.createElement(Text, { style: s.invoiceMetaItemLabel }, "Date"), /* @__PURE__ */ React.createElement(Text, { style: s.invoiceMetaItemValue }, invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString("en-GB") : "\u2014")), /* @__PURE__ */ React.createElement(View, { style: s.invoiceMetaItem }, /* @__PURE__ */ React.createElement(Text, { style: s.invoiceMetaItemLabel }, isQuotation ? "Valid Until" : "Due Date"), /* @__PURE__ */ React.createElement(Text, { style: s.invoiceMetaItemValue }, invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString("en-GB") : "\u2014")), /* @__PURE__ */ React.createElement(View, { style: s.invoiceMetaItem }, /* @__PURE__ */ React.createElement(Text, { style: s.invoiceMetaItemLabel }, "Place of Supply"), /* @__PURE__ */ React.createElement(Text, { style: s.invoiceMetaItemValue }, invoice.placeOfSupply || "\u2014"))))), /* @__PURE__ */ React.createElement(View, { style: s.table }, /* @__PURE__ */ React.createElement(View, { style: s.tHead }, /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colNo] }, "#"), /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colDesc] }, "Item"), hasHsn && /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colHsn] }, "HSN/SAC"), /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colRate] }, "Rate/Item"), /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colQty] }, "Qty"), /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colTaxable] }, "Taxable Value"), /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colTax] }, "Tax Amount"), /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colTotal] }, "Amount")), invoice.items?.map((item, i) => {
    const taxAmt = (item.cgstAmount || 0) + (item.sgstAmount || 0) + (item.igstAmount || 0) + (item.vatAmount || 0);
    const taxable = item.price * item.quantity - (item.discountAmount || 0);
    const rate = (item.cgstRate || 0) + (item.sgstRate || 0) + (item.igstRate || 0) + (item.vatRate || 0);
    return /* @__PURE__ */ React.createElement(View, { key: i, style: s.tRow }, /* @__PURE__ */ React.createElement(Text, { style: [s.td, s.colNo] }, i + 1), /* @__PURE__ */ React.createElement(View, { style: s.colDesc }, /* @__PURE__ */ React.createElement(Text, { style: [s.td, { fontFamily: B }] }, item.name), item.description && /* @__PURE__ */ React.createElement(Text, { style: { fontSize: 6.5, color: "#666", marginTop: 1 } }, item.description)), hasHsn && /* @__PURE__ */ React.createElement(Text, { style: [s.td, s.colHsn] }, item.hsn || "\u2014"), /* @__PURE__ */ React.createElement(Text, { style: [s.td, s.colRate] }, fmt(item.price)), /* @__PURE__ */ React.createElement(Text, { style: [s.td, s.colQty] }, item.itemType === "Service" ? "-" : item.quantity), /* @__PURE__ */ React.createElement(Text, { style: [s.td, s.colTaxable] }, fmt(taxable)), /* @__PURE__ */ React.createElement(Text, { style: [s.td, s.colTax] }, fmt(taxAmt), rate ? ` (${rate}%)` : ""), /* @__PURE__ */ React.createElement(Text, { style: [s.td, s.colTotal, { fontFamily: B }] }, fmt(item.total)));
  })), /* @__PURE__ */ React.createElement(View, { style: s.wordsStrip }, /* @__PURE__ */ React.createElement(Text, { style: s.wordsText }, "Total Items / Qty : ", invoice.items?.length || 0, " / ", totalQty), /* @__PURE__ */ React.createElement(Text, { style: s.wordsText }, "Amount in Words: ", currency, " ", totalInWords, " Only")), /* @__PURE__ */ React.createElement(View, { style: s.totalsRow }, /* @__PURE__ */ React.createElement(View, { style: s.notesCol }, invoice.notes && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Text, { style: s.noteLabel }, "Notes"), /* @__PURE__ */ React.createElement(Text, { style: s.noteText }, invoice.notes)), invoice.termsAndConditions && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Text, { style: s.noteLabel }, "Terms & Conditions"), /* @__PURE__ */ React.createElement(Text, { style: s.noteText }, invoice.termsAndConditions))), /* @__PURE__ */ React.createElement(View, { style: s.totalsCol }, /* @__PURE__ */ React.createElement(View, { style: s.totalLine }, /* @__PURE__ */ React.createElement(Text, { style: s.totalLabel }, "Taxable Amount"), /* @__PURE__ */ React.createElement(Text, { style: s.totalVal }, fmt(invoice.subtotal - (invoice.discountAmount || 0)))), invoice.discountAmount > 0 && /* @__PURE__ */ React.createElement(View, { style: s.totalLineAlt }, /* @__PURE__ */ React.createElement(Text, { style: s.totalLabel }, "Discount"), /* @__PURE__ */ React.createElement(Text, { style: s.totalVal }, "-", fmt(invoice.discountAmount))), invoice.cgstTotal > 0 && /* @__PURE__ */ React.createElement(View, { style: s.totalLine }, /* @__PURE__ */ React.createElement(Text, { style: s.totalLabel }, "CGST"), /* @__PURE__ */ React.createElement(Text, { style: s.totalVal }, fmt(invoice.cgstTotal))), invoice.sgstTotal > 0 && /* @__PURE__ */ React.createElement(View, { style: s.totalLineAlt }, /* @__PURE__ */ React.createElement(Text, { style: s.totalLabel }, "SGST"), /* @__PURE__ */ React.createElement(Text, { style: s.totalVal }, fmt(invoice.sgstTotal))), invoice.igstTotal > 0 && /* @__PURE__ */ React.createElement(View, { style: s.totalLine }, /* @__PURE__ */ React.createElement(Text, { style: s.totalLabel }, "IGST"), /* @__PURE__ */ React.createElement(Text, { style: s.totalVal }, fmt(invoice.igstTotal))), invoice.vatTotal > 0 && /* @__PURE__ */ React.createElement(View, { style: s.totalLineAlt }, /* @__PURE__ */ React.createElement(Text, { style: s.totalLabel }, "VAT"), /* @__PURE__ */ React.createElement(Text, { style: s.totalVal }, fmt(invoice.vatTotal))), /* @__PURE__ */ React.createElement(View, { style: s.grandLine }, /* @__PURE__ */ React.createElement(Text, { style: s.grandLabel }, "Total"), /* @__PURE__ */ React.createElement(Text, { style: s.grandVal }, currency, " ", fmt(invoice.total))), !isQuotation && paidAmount > 0 && (isFullyPaid ? /* @__PURE__ */ React.createElement(View, { style: s.paidBadge }, /* @__PURE__ */ React.createElement(View, { style: s.paidBadgeDot }), /* @__PURE__ */ React.createElement(Text, { style: s.paidBadgeText }, "Amount Paid")) : /* @__PURE__ */ React.createElement(View, { style: s.dueBadge }, /* @__PURE__ */ React.createElement(View, { style: s.dueBadgeDot }), /* @__PURE__ */ React.createElement(Text, { style: s.dueBadgeText }, "Balance Due: ", currency, " ", fmt(balanceDue)))))), /* @__PURE__ */ React.createElement(View, { style: s.bottomRow }, /* @__PURE__ */ React.createElement(View, { style: s.bankCol }, biz?.bankDetails?.accountNumber ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Text, { style: s.bankLabel }, "Bank Details"), biz.bankDetails.bankName && /* @__PURE__ */ React.createElement(View, { style: s.bankRow }, /* @__PURE__ */ React.createElement(Text, { style: s.bankKey }, "Bank:"), /* @__PURE__ */ React.createElement(Text, { style: s.bankVal }, biz.bankDetails.bankName)), /* @__PURE__ */ React.createElement(View, { style: s.bankRow }, /* @__PURE__ */ React.createElement(Text, { style: s.bankKey }, "Account #:"), /* @__PURE__ */ React.createElement(Text, { style: s.bankVal }, biz.bankDetails.accountNumber)), biz.bankDetails.ifscCode && /* @__PURE__ */ React.createElement(View, { style: s.bankRow }, /* @__PURE__ */ React.createElement(Text, { style: s.bankKey }, "IFSC:"), /* @__PURE__ */ React.createElement(Text, { style: s.bankVal }, biz.bankDetails.ifscCode)), biz.bankDetails.branch && /* @__PURE__ */ React.createElement(View, { style: s.bankRow }, /* @__PURE__ */ React.createElement(Text, { style: s.bankKey }, "Branch:"), /* @__PURE__ */ React.createElement(Text, { style: s.bankVal }, biz.bankDetails.branch))) : invoice.paymentInfo ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Text, { style: s.bankLabel }, "Payment Info"), /* @__PURE__ */ React.createElement(Text, { style: s.bankVal }, invoice.paymentInfo)) : null), /* @__PURE__ */ React.createElement(View, { style: s.sigCol }, /* @__PURE__ */ React.createElement(Text, { style: s.sigFor }, "For ", bizName), biz?.businessSignature && /* @__PURE__ */ React.createElement(Image, { src: biz.businessSignature, style: { width: 100, height: 36, objectFit: "contain", marginBottom: 2 } }), /* @__PURE__ */ React.createElement(SignatoryDetails, { biz }), /* @__PURE__ */ React.createElement(Text, { style: s.sigLine }, "Authorised Signatory"), biz?.businessSeal && /* @__PURE__ */ React.createElement(Image, { src: biz.businessSeal, style: { width: 62, height: 62, objectFit: "contain", marginTop: 6 } }))), /* @__PURE__ */ React.createElement(View, { style: s.footerNote }, /* @__PURE__ */ React.createElement(Text, { style: s.footerNoteText }, "This is a computer generated document and does not require a physical signature."))), /* @__PURE__ */ React.createElement(View, { style: s.footerBar, fixed: true }, /* @__PURE__ */ React.createElement(Text, { style: s.footerBrand }, "Powered by GoodSynk", /* @__PURE__ */ React.createElement(Text, { style: { fontSize: 7, fontFamily: "Helvetica" } }, "\u2122"), " \u2014 Simple Invoicing, Billing & Quotations"), /* @__PURE__ */ React.createElement(
    Text,
    {
      style: s.footerTrust,
      render: ({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`
    }
  ))));
}
