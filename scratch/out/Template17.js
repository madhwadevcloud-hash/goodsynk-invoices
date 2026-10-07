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
export default function Template17({ invoice }) {
  const { client, user: biz } = invoice;
  Font.registerHyphenationCallback(safeHyphenation);
  const colors = invoice.templateColors || { primary: "#111820" };
  const PRIMARY = colors.primary;
  const scaled = buildScaledStyles(biz);
  const s = StyleSheet.create({
    page: { paddingTop: 36, paddingBottom: 60, paddingHorizontal: 42, fontFamily: "Inter", color: "#111", fontSize: 8.5 },
    watermarkContainer: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center", zIndex: -100 },
    watermarkImg: { width: 250, height: 250, objectFit: "contain", opacity: 0.12 },
    watermarkText: { fontSize: 60, fontFamily: B, color: hexToRgba(PRIMARY, 0.07), transform: "rotate(-45deg)", letterSpacing: 5 },
    // --- Header Alignment Fix ---
    topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
    brandRow: { flexDirection: "row", alignItems: "flex-start", flex: 1, paddingRight: 15 },
    logo: { width: 40, height: 40, objectFit: "contain", marginRight: 10, marginTop: 2 },
    brandTextContainer: { flex: 1, minWidth: 0, flexDirection: "column", alignItems: "flex-start" },
    bizName: { fontFamily: B, fontSize: scaled.bizNameFontSize, color: "#000", textTransform: "uppercase", marginBottom: 2 },
    bizText: { fontSize: scaled.bizSubTextFontSize, color: "#666", lineHeight: scaled.bizSubTextLineHeight, marginTop: 0, textAlign: "left" },
    titleBlock: { alignItems: "flex-end", width: "35%", flexShrink: 0 },
    docTag: { fontSize: 7, fontFamily: B, color: PRIMARY, letterSpacing: 2, marginBottom: 3 },
    docTitle: { fontFamily: B, fontSize: 22, color: "#000" },
    docNumber: { fontSize: 8.5, color: "#555", marginTop: 4, textAlign: "right" },
    divider: { height: 2, backgroundColor: PRIMARY, marginTop: 16, marginBottom: 16 },
    metaGrid: { flexDirection: "row", justifyContent: "space-between", marginBottom: 18 },
    metaCol: { width: "31%", minWidth: 0 },
    metaLabel: { fontSize: 6.8, fontFamily: B, color: "#8A8F98", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 4 },
    metaName: { fontSize: 9, fontFamily: B, color: "#000", marginBottom: 2 },
    metaText: { fontSize: 7.8, color: "#333", lineHeight: 1.45, marginBottom: 1 },
    table: { marginTop: 4 },
    tHead: { flexDirection: "row", borderBottomWidth: 1.5, borderBottomColor: "#111", paddingBottom: 6, marginBottom: 4 },
    th: { fontSize: 7, fontFamily: B, color: "#000", textTransform: "uppercase", letterSpacing: 0.4 },
    tRow: { flexDirection: "row", paddingVertical: 9, borderBottomWidth: 0.6, borderBottomColor: "#EBEBEB" },
    td: { fontSize: 8, color: "#111" },
    colNo: { width: "5%" },
    colDesc: { width: "38%", paddingRight: 8 },
    colHsn: { width: "10%", textAlign: "center" },
    colRate: { width: "13%", textAlign: "right" },
    colQty: { width: "9%", textAlign: "center" },
    colTax: { width: "11%", textAlign: "right" },
    colTotal: { width: "14%", textAlign: "right" },
    totalsWrap: { flexDirection: "row", justifyContent: "flex-end", marginTop: 14 },
    totalsBox: { width: 220 },
    totalLine: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2.5 },
    totalLabel: { fontSize: 8, color: "#555" },
    totalVal: { fontSize: 8, fontFamily: M, color: "#111" },
    totalChip: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: PRIMARY, borderRadius: 6, paddingVertical: 8, paddingHorizontal: 12, marginTop: 8 },
    totalChipLabel: { fontSize: 10, fontFamily: B, color: "#fff" },
    totalChipVal: { fontSize: 12, fontFamily: B, color: "#fff" },
    statusChip: { marginTop: 8, alignSelf: "flex-end", flexDirection: "row", alignItems: "center", paddingVertical: 3, paddingHorizontal: 9, borderRadius: 12 },
    statusDot: { width: 5, height: 5, borderRadius: 3, marginRight: 4 },
    statusText: { fontSize: 7, fontFamily: B },
    // --- Amount in Words Alignment Fix ---
    wordsBlock: { marginTop: 16, paddingTop: 10, borderTopWidth: 0.6, borderTopColor: "#EBEBEB", flexDirection: "row", justifyContent: "flex-end" },
    wordsBox: { width: 220, alignItems: "flex-end" },
    wordsLabel: { fontSize: 6.8, fontFamily: B, color: "#8A8F98", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 3, textAlign: "right" },
    wordsText: { fontSize: 7.8, color: "#333", textAlign: "right" },
    lowerRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 20 },
    noteCol: { width: "52%" },
    noteLabel: { fontSize: 6.8, fontFamily: B, color: "#8A8F98", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 4 },
    noteText: { fontSize: 7.6, color: "#333", lineHeight: 1.4, marginBottom: 8 },
    // --- Bank Details Structured Layout (Prevents page splitting) ---
    bankContainer: { marginTop: 6, flexDirection: "column" },
    bankRow: { flexDirection: "row", marginBottom: 3 },
    bankLabel: { fontSize: 7.4, color: "#555", width: 75 },
    bankValue: { fontSize: 7.4, fontFamily: M, color: "#000", flex: 1, minWidth: 0 },
    sigCol: { width: "30%", alignItems: "flex-end" },
    sigLabel: { fontSize: 7.5, color: "#555", marginBottom: 22 },
    sigLine: { fontSize: 7.4, color: "#333", textAlign: "center", paddingTop: 3, borderTopWidth: 0.6, borderTopColor: "#999", width: 110 },
    footerBar: { position: "absolute", bottom: 22, left: 42, right: 42, borderTopWidth: 0.6, borderTopColor: "#DDD", paddingTop: 8, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    footerBrand: { fontSize: 7, fontFamily: B, color: PRIMARY, letterSpacing: 0.3 },
    footerTagline: { fontSize: 6.3, color: "#888", marginTop: 1 },
    footerTrust: { fontSize: 6.5, color: "#333333" }
  });
  const currency = invoice._currency || invoice.currency || "INR";
  const fmt = (n) => new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);
  const bizName = biz?.businessName || biz?.name || "Your Business";
  const isQuotation = invoice.invoiceType === "quotation";
  const docTitle = isQuotation ? "Quotation" : "Tax Invoice";
  const hasHsn = invoice.items?.some((i) => i.hsn);
  const totalInWords = numberToWords(Math.floor(invoice.total || 0));
  const paidAmount = invoice.paidAmount || 0;
  const balanceDue = Math.max((invoice.total || 0) - paidAmount, 0);
  const isFullyPaid = !isQuotation && paidAmount > 0 && balanceDue <= 0.01;
  return /* @__PURE__ */ React.createElement(Document, null, /* @__PURE__ */ React.createElement(Page, { size: "A4", style: s.page }, !biz?.plan || String(biz.plan).toLowerCase() === "free" ? /* @__PURE__ */ React.createElement(View, { style: s.watermarkContainer, pointerEvents: "none", fixed: true }, /* @__PURE__ */ React.createElement(Text, { style: s.watermarkText }, "GoodSynk")) : isRasterImage(invoice.watermarkImage || biz.watermarkImage) ? /* @__PURE__ */ React.createElement(View, { style: s.watermarkContainer, pointerEvents: "none", fixed: true }, /* @__PURE__ */ React.createElement(Image, { src: invoice.watermarkImage || biz.watermarkImage, style: s.watermarkImg })) : null, /* @__PURE__ */ React.createElement(View, { style: s.topRow }, /* @__PURE__ */ React.createElement(View, { style: s.brandRow }, biz?.businessLogo && /* @__PURE__ */ React.createElement(Image, { src: biz.businessLogo, style: s.logo }), /* @__PURE__ */ React.createElement(View, { style: s.brandTextContainer }, /* @__PURE__ */ React.createElement(Text, { numberOfLines: 1, style: s.bizName }, bizName), biz?.address?.street && /* @__PURE__ */ React.createElement(Text, { style: s.bizText }, biz.address.street), biz?.address?.city && /* @__PURE__ */ React.createElement(Text, { style: s.bizText }, biz.address.city, ", ", biz.address.state, " ", biz.address.pincode), (biz?.phone || biz?.email) && /* @__PURE__ */ React.createElement(Text, { style: s.bizText }, biz?.phone, biz?.phone && biz?.email ? "  \u2022  " : "", biz?.email), biz?.gstin && /* @__PURE__ */ React.createElement(Text, { style: s.bizText }, "GSTIN ", biz.gstin))), /* @__PURE__ */ React.createElement(View, { style: s.titleBlock }, /* @__PURE__ */ React.createElement(Text, { style: s.docTag }, "ORIGINAL FOR RECIPIENT"), /* @__PURE__ */ React.createElement(Text, { style: s.docTitle }, docTitle), /* @__PURE__ */ React.createElement(Text, { style: s.docNumber }, "#", invoice.invoiceNumber || invoice.quotationNumber), /* @__PURE__ */ React.createElement(Text, { style: s.docNumber }, "Date: ", new Date(invoice.issueDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })), invoice.dueDate && /* @__PURE__ */ React.createElement(Text, { style: s.docNumber }, isQuotation ? "Valid until" : "Due date", ": ", new Date(invoice.dueDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })))), /* @__PURE__ */ React.createElement(View, { style: s.divider }), /* @__PURE__ */ React.createElement(View, { style: s.metaGrid }, /* @__PURE__ */ React.createElement(View, { style: s.metaCol }, /* @__PURE__ */ React.createElement(Text, { style: s.metaLabel }, "Bill To"), /* @__PURE__ */ React.createElement(Text, { style: s.metaName }, client?.name), client?.phone && /* @__PURE__ */ React.createElement(Text, { style: s.metaText }, "Ph: ", client.phone), client?.address?.street && /* @__PURE__ */ React.createElement(Text, { style: s.metaText }, client.address.street), client?.address?.city && /* @__PURE__ */ React.createElement(Text, { style: s.metaText }, client.address.city, ", ", client.address.state, " ", client.address.pincode)), /* @__PURE__ */ React.createElement(View, { style: s.metaCol }, /* @__PURE__ */ React.createElement(Text, { style: s.metaLabel }, "Ship To"), /* @__PURE__ */ React.createElement(Text, { style: s.metaName }, client?.name), client?.address?.street && /* @__PURE__ */ React.createElement(Text, { style: s.metaText }, client.address.street), client?.address?.city && /* @__PURE__ */ React.createElement(Text, { style: s.metaText }, client.address.city, ", ", client.address.state, " ", client.address.pincode)), /* @__PURE__ */ React.createElement(View, { style: s.metaCol }, /* @__PURE__ */ React.createElement(Text, { style: s.metaLabel }, "Place of Supply"), /* @__PURE__ */ React.createElement(Text, { style: s.metaText }, invoice.placeOfSupply || client?.address?.state || "\u2014"))), /* @__PURE__ */ React.createElement(View, { style: s.table }, /* @__PURE__ */ React.createElement(View, { style: s.tHead }, /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colNo] }, "#"), /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colDesc] }, "Item"), hasHsn && /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colHsn] }, "HSN/SAC"), /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colRate] }, "Rate/Item"), /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colQty] }, "Qty"), /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colTax] }, "Tax"), /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colTotal] }, "Amount")), invoice.items?.map((item, i) => {
    const rate = (item.cgstRate || 0) + (item.sgstRate || 0) + (item.igstRate || 0) + (item.vatRate || 0);
    return /* @__PURE__ */ React.createElement(View, { key: i, style: s.tRow }, /* @__PURE__ */ React.createElement(Text, { style: [s.td, s.colNo] }, i + 1), /* @__PURE__ */ React.createElement(View, { style: s.colDesc }, /* @__PURE__ */ React.createElement(Text, { style: [s.td, { fontFamily: B }] }, item.name), item.description && /* @__PURE__ */ React.createElement(Text, { style: { fontSize: 6.8, color: "#777", marginTop: 2 } }, item.description)), hasHsn && /* @__PURE__ */ React.createElement(Text, { style: [s.td, s.colHsn] }, item.hsn || "\u2014"), /* @__PURE__ */ React.createElement(Text, { style: [s.td, s.colRate] }, fmt(item.price)), /* @__PURE__ */ React.createElement(Text, { style: [s.td, s.colQty] }, item.itemType === "Service" ? "-" : item.quantity), /* @__PURE__ */ React.createElement(Text, { style: [s.td, s.colTax] }, rate, "%"), /* @__PURE__ */ React.createElement(Text, { style: [s.td, s.colTotal, { fontFamily: B }] }, fmt(item.total)));
  })), /* @__PURE__ */ React.createElement(View, { style: s.totalsWrap }, /* @__PURE__ */ React.createElement(View, { style: s.totalsBox }, /* @__PURE__ */ React.createElement(View, { style: s.totalLine }, /* @__PURE__ */ React.createElement(Text, { style: s.totalLabel }, "Taxable Amount"), /* @__PURE__ */ React.createElement(Text, { style: s.totalVal }, fmt(invoice.subtotal - (invoice.discountAmount || 0)))), invoice.discountAmount > 0 && /* @__PURE__ */ React.createElement(View, { style: s.totalLine }, /* @__PURE__ */ React.createElement(Text, { style: s.totalLabel }, "Discount"), /* @__PURE__ */ React.createElement(Text, { style: s.totalVal }, "-", fmt(invoice.discountAmount))), invoice.cgstTotal > 0 && /* @__PURE__ */ React.createElement(View, { style: s.totalLine }, /* @__PURE__ */ React.createElement(Text, { style: s.totalLabel }, "CGST"), /* @__PURE__ */ React.createElement(Text, { style: s.totalVal }, fmt(invoice.cgstTotal))), invoice.sgstTotal > 0 && /* @__PURE__ */ React.createElement(View, { style: s.totalLine }, /* @__PURE__ */ React.createElement(Text, { style: s.totalLabel }, "SGST"), /* @__PURE__ */ React.createElement(Text, { style: s.totalVal }, fmt(invoice.sgstTotal))), invoice.igstTotal > 0 && /* @__PURE__ */ React.createElement(View, { style: s.totalLine }, /* @__PURE__ */ React.createElement(Text, { style: s.totalLabel }, "IGST"), /* @__PURE__ */ React.createElement(Text, { style: s.totalVal }, fmt(invoice.igstTotal))), invoice.vatTotal > 0 && /* @__PURE__ */ React.createElement(View, { style: s.totalLine }, /* @__PURE__ */ React.createElement(Text, { style: s.totalLabel }, "VAT"), /* @__PURE__ */ React.createElement(Text, { style: s.totalVal }, fmt(invoice.vatTotal))), /* @__PURE__ */ React.createElement(View, { style: s.totalChip }, /* @__PURE__ */ React.createElement(Text, { style: s.totalChipLabel }, isQuotation ? "Estimated Total" : "Total"), /* @__PURE__ */ React.createElement(Text, { style: s.totalChipVal }, currency, " ", fmt(invoice.total))), !isQuotation && paidAmount > 0 && (isFullyPaid ? /* @__PURE__ */ React.createElement(View, { style: [s.statusChip, { backgroundColor: "#E8F5EC" }] }, /* @__PURE__ */ React.createElement(View, { style: [s.statusDot, { backgroundColor: "#2E7D46" }] }), /* @__PURE__ */ React.createElement(Text, { style: [s.statusText, { color: "#2E7D46" }] }, "Amount Paid")) : /* @__PURE__ */ React.createElement(View, { style: [s.statusChip, { backgroundColor: "#FDECEC" }] }, /* @__PURE__ */ React.createElement(View, { style: [s.statusDot, { backgroundColor: "#C43D3D" }] }), /* @__PURE__ */ React.createElement(Text, { style: [s.statusText, { color: "#C43D3D" }] }, "Balance Due ", currency, " ", fmt(balanceDue)))))), /* @__PURE__ */ React.createElement(View, { style: s.wordsBlock }, /* @__PURE__ */ React.createElement(View, { style: s.wordsBox }, /* @__PURE__ */ React.createElement(Text, { style: s.wordsLabel }, "Amount in Words"), /* @__PURE__ */ React.createElement(Text, { style: s.wordsText }, currency, " ", totalInWords, " Only"))), /* @__PURE__ */ React.createElement(View, { style: s.lowerRow }, /* @__PURE__ */ React.createElement(View, { style: s.noteCol }, invoice.notes && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Text, { style: s.noteLabel }, "Notes"), /* @__PURE__ */ React.createElement(Text, { style: s.noteText }, invoice.notes)), invoice.termsAndConditions && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Text, { style: s.noteLabel }, "Terms & Conditions"), /* @__PURE__ */ React.createElement(Text, { style: s.noteText }, invoice.termsAndConditions)), biz?.bankDetails?.accountNumber ? /* @__PURE__ */ React.createElement(View, { style: s.bankContainer }, /* @__PURE__ */ React.createElement(Text, { style: s.noteLabel }, "Bank Details"), biz.bankDetails.bankName && /* @__PURE__ */ React.createElement(View, { style: s.bankRow }, /* @__PURE__ */ React.createElement(Text, { style: s.bankLabel }, "Bank Name:"), /* @__PURE__ */ React.createElement(Text, { style: s.bankValue }, biz.bankDetails.bankName)), /* @__PURE__ */ React.createElement(View, { style: s.bankRow }, /* @__PURE__ */ React.createElement(Text, { style: s.bankLabel }, "A/C Number:"), /* @__PURE__ */ React.createElement(Text, { style: s.bankValue }, biz.bankDetails.accountNumber)), biz.bankDetails.ifscCode && /* @__PURE__ */ React.createElement(View, { style: s.bankRow }, /* @__PURE__ */ React.createElement(Text, { style: s.bankLabel }, "IFSC Code:"), /* @__PURE__ */ React.createElement(Text, { style: s.bankValue }, biz.bankDetails.ifscCode)), biz.bankDetails.branch && /* @__PURE__ */ React.createElement(View, { style: s.bankRow }, /* @__PURE__ */ React.createElement(Text, { style: s.bankLabel }, "Branch:"), /* @__PURE__ */ React.createElement(Text, { style: s.bankValue }, biz.bankDetails.branch))) : invoice.paymentInfo ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Text, { style: s.noteLabel }, "Payment Info"), /* @__PURE__ */ React.createElement(Text, { style: s.noteText }, invoice.paymentInfo)) : null), /* @__PURE__ */ React.createElement(View, { style: s.sigCol }, /* @__PURE__ */ React.createElement(Text, { style: s.sigLabel }, "For ", bizName), biz?.businessSignature && /* @__PURE__ */ React.createElement(Image, { src: biz.businessSignature, style: { width: 100, height: 34, objectFit: "contain", marginBottom: 2 } }), /* @__PURE__ */ React.createElement(SignatoryDetails, { biz }), /* @__PURE__ */ React.createElement(Text, { style: s.sigLine }, "Authorised Signatory"), biz?.businessSeal && /* @__PURE__ */ React.createElement(Image, { src: biz.businessSeal, style: { width: 60, height: 60, objectFit: "contain", marginTop: 6 } }))), /* @__PURE__ */ React.createElement(View, { style: s.footerBar, fixed: true }, /* @__PURE__ */ React.createElement(View, null, /* @__PURE__ */ React.createElement(Text, { style: s.footerBrand }, "Powered by GoodSynk", /* @__PURE__ */ React.createElement(Text, { style: { fontSize: 7, fontFamily: "Helvetica" } }, "\u2122")), /* @__PURE__ */ React.createElement(Text, { style: s.footerTagline }, "Simple Invoicing, Billing & Quotations")), /* @__PURE__ */ React.createElement(
    Text,
    {
      style: s.footerTrust,
      render: ({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`
    }
  ))));
}
