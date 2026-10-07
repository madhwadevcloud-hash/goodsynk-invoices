import SignatoryDetails from "./SignatoryDetails";
import React from "react";
import { Document, Page, Text, View, StyleSheet, Font, Image, Link } from "@react-pdf/renderer";
import { buildScaledStyles } from "./Pdfheaderscaling";
import { isRasterImage } from "./watermarkUtils";
import { safeHyphenation } from "./layoutUtils";
const B = "Inter-Bold";
const M = "Inter-SemiBold";
const hexToRgba = (hex, alpha) => {
  if (!hex) return "rgba(0, 0, 0, " + alpha + ")";
  let clean = hex.replace("#", "");
  if (clean.length === 3) {
    clean = clean.split("").map((c) => c + c).join("");
  }
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
};
const ones = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen"
];
const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
const twoDigit = (n) => {
  if (n < 20) return ones[n];
  return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
};
const threeDigit = (n) => {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  let str = "";
  if (h) str += ones[h] + " Hundred";
  if (rest) str += (h ? " " : "") + twoDigit(rest);
  return str;
};
const numberToWords = (num) => {
  if (num === 0) return "Zero";
  const n = Math.floor(Math.abs(num));
  if (n === 0) return "Zero";
  const crore = Math.floor(n / 1e7);
  const lakh = Math.floor(n % 1e7 / 1e5);
  const thousand = Math.floor(n % 1e5 / 1e3);
  const hundred = n % 1e3;
  let out = "";
  if (crore) out += threeDigit(crore) + " Crore ";
  if (lakh) out += threeDigit(lakh) + " Lakh ";
  if (thousand) out += threeDigit(thousand) + " Thousand ";
  if (hundred) out += threeDigit(hundred);
  return out.trim();
};
const amountInWords = (amount, currency) => {
  const whole = Math.floor(Math.abs(amount || 0));
  const paise = Math.round((Math.abs(amount || 0) - whole) * 100);
  let words = numberToWords(whole) + " " + currency;
  if (paise > 0) words += " and " + numberToWords(paise) + " Paise";
  return words + " Only";
};
export default function Template10({ invoice }) {
  const { client, user: biz } = invoice;
  Font.registerHyphenationCallback(safeHyphenation);
  const colors = invoice.templateColors || { primary: "#10B981" };
  const PRIMARY = colors.primary;
  const LIGHT_CARD = "#F3F4F6";
  const roundOffDiff = invoice.roundOff ? (invoice.total || 0) - ((invoice.subtotal || 0) - (invoice.discountAmount || 0) + (invoice.taxTotal || 0)) : 0;
  const notesText = Array.isArray(invoice.notes) ? invoice.notes.join("\n") : invoice.notes;
  const termsText = Array.isArray(invoice.termsAndConditions) ? invoice.termsAndConditions.join("\n") : invoice.termsAndConditions;
  const scaled = buildScaledStyles(biz);
  const addrParts = [];
  if (biz?.address?.street) addrParts.push(biz.address.street);
  if (biz?.address?.city || biz?.address?.state || biz?.address?.pincode) {
    addrParts.push(
      [
        [biz?.address?.city, biz?.address?.state].filter(Boolean).join(", "),
        biz?.address?.pincode
      ].filter(Boolean).join(" - ")
    );
  }
  let addrLines = [];
  addrParts.forEach((part) => {
    if (!part) return;
    if (part.length > 55) {
      const chunks = part.split(",").map((c) => c.trim()).filter(Boolean);
      let buf = "";
      chunks.forEach((chunk) => {
        if ((buf + ", " + chunk).trim().length > 55) {
          if (buf) addrLines.push(buf.trim());
          buf = chunk;
        } else {
          buf = buf ? buf + ", " + chunk : chunk;
        }
      });
      if (buf) addrLines.push(buf.trim());
    } else {
      addrLines.push(part.trim());
    }
  });
  addrLines = addrLines.slice(0, 3);
  const maxLineLen = addrLines.reduce((m, l) => Math.max(m, l.length), 0);
  const totalLen = addrLines.join(" ").length;
  let addrFontSize = 8.5;
  if (maxLineLen > 55 || totalLen > 130) addrFontSize = 6.5;
  else if (maxLineLen > 45 || totalLen > 100) addrFontSize = 7;
  else if (maxLineLen > 35 || totalLen > 70) addrFontSize = 7.5;
  else if (maxLineLen > 25 || totalLen > 50) addrFontSize = 8;
  const s = StyleSheet.create({
    watermarkContainer: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: -100 },
    watermarkImg: { width: 250, height: 250, objectFit: "contain", opacity: 0.12 },
    watermarkText: { fontSize: 60, fontFamily: B, color: hexToRgba(PRIMARY, 0.08), transform: "rotate(-45deg)", letterSpacing: 5 },
    page: { paddingTop: 40, paddingBottom: 60, paddingHorizontal: 40, fontFamily: "Inter", color: "#1F2937" },
    // Top Bar (No background block)
    topFlex: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
    bizBox: { flexDirection: "row", alignItems: "flex-start", flex: 1, minWidth: 0, paddingRight: 20 },
    topLogo: { maxWidth: 140, maxHeight: 52, objectFit: "contain", marginRight: 10, flexShrink: 0 },
    bizInfoCol: { flexDirection: "column", flex: 1, minWidth: 0 },
    bizName: { fontFamily: B, fontSize: 18, color: PRIMARY, textTransform: "uppercase", letterSpacing: 1 },
    bizAddress: { color: "#4B5563", marginTop: 4, lineHeight: 1.35 },
    docTitleBox: { alignItems: "flex-end", flexShrink: 0, maxWidth: "40%" },
    docTitle: { fontFamily: B, fontSize: 24, color: "#111", textTransform: "uppercase", letterSpacing: 2 },
    docNo: { fontSize: 10, color: "#6B7280", marginTop: 4, textAlign: "right" },
    docNoBold: { fontFamily: B, color: PRIMARY },
    // Business details row (phone / email / GSTIN)
    bizDetailsRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 20, gap: 10 },
    bizText: { fontSize: 8.5, color: "#4B5563" },
    // Card Layout for Info
    cardsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 30, alignItems: "stretch" },
    card: { backgroundColor: LIGHT_CARD, borderRadius: 8, padding: 15, width: "48%", minWidth: 0 },
    cardHeader: { fontSize: 8, fontFamily: B, color: PRIMARY, textTransform: "uppercase", marginBottom: 8, letterSpacing: 1 },
    clientName: { fontFamily: B, fontSize: 12, color: "#111", marginBottom: 4 },
    clientText: { fontSize: 8.5, color: "#4B5563", lineHeight: 1.5 },
    metaRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
    metaLabel: { fontSize: 8.5, color: "#6B7280", flexShrink: 0, paddingRight: 6 },
    metaVal: { fontSize: 8.5, fontFamily: B, color: "#111", flexShrink: 1, textAlign: "right" },
    // Payment info styles
    paymentSection: { marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: "#D1D5DB" },
    paymentRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 3 },
    paymentLabel: { fontSize: 8.5, color: "#6B7280", width: 70, flexShrink: 0 },
    paymentValue: { fontSize: 8.5, color: "#111", fontFamily: M, flex: 1, minWidth: 0 },
    // Clean Table
    table: { width: "100%", marginBottom: 14 },
    tHead: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: PRIMARY, paddingBottom: 8, marginBottom: 8 },
    tRow: { flexDirection: "row", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#E5E7EB" },
    th: { fontSize: 8, fontFamily: B, color: "#111", textTransform: "uppercase", letterSpacing: 0.5 },
    td: { fontSize: 9, color: "#374151" },
    colNo: { flex: 0.4 },
    colDesc: { flex: 2.2, paddingRight: 10 },
    colHsn: { flex: 0.8, textAlign: "center" },
    colQty: { flex: 0.9, textAlign: "center" },
    colPrice: { flex: 1.2, textAlign: "right", paddingRight: 10 },
    colDisc: { flex: 0.8, textAlign: "center", paddingRight: 4 },
    colTax: { flex: 0.8, textAlign: "center", paddingRight: 4 },
    colTotal: { flex: 1.3, textAlign: "right" },
    // Totals Section in a Card
    bottomFlex: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
    notesBox: { width: "50%" },
    totalsCard: { width: "45%", backgroundColor: LIGHT_CARD, borderRadius: 8, padding: 15 },
    totRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 5 },
    totLabel: { fontSize: 9, color: "#6B7280" },
    totVal: { fontSize: 9, fontFamily: M, color: "#111", textAlign: "right" },
    totDivider: { height: 1, backgroundColor: "#D1D5DB", marginVertical: 6 },
    grandTotRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
    grandTotLabel: { fontSize: 11, fontFamily: B, color: PRIMARY, textTransform: "uppercase" },
    grandTotVal: { fontSize: 11, fontFamily: B, color: PRIMARY, textAlign: "right" },
    // Total in words
    wordsRow: { marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: "#D1D5DB" },
    wordsLabel: { fontSize: 7.5, fontFamily: B, color: "#6B7280", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 },
    wordsVal: { fontSize: 8.5, fontFamily: M, color: "#111", lineHeight: 1.4 },
    // Notes and Signature
    sectionTitle: { fontSize: 9, fontFamily: B, color: "#111", textTransform: "uppercase", marginBottom: 6, letterSpacing: 1 },
    notesText: { fontSize: 8.5, color: "#4B5563", lineHeight: 1.5, marginBottom: 15 },
    sigBox: { width: "40%", alignItems: "flex-start", marginTop: 20 },
    sigImg: { width: 120, height: 40, objectFit: "contain", marginBottom: 6 },
    sigLine: { width: 140, height: 1, backgroundColor: "#D1D5DB", marginBottom: 4 },
    sigText: { fontSize: 8, color: "#6B7280" },
    // Footer
    footer: { position: "absolute", bottom: 20, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderTopColor: "#E5E7EB", paddingTop: 12 },
    footerLeft: { fontSize: 7, color: "#9CA3AF" },
    footerRight: { fontSize: 7, color: "#9CA3AF" },
    footerLink: { fontSize: 7, color: PRIMARY, textDecoration: "underline" }
  });
  const currency = invoice._currency || invoice.currency || "INR";
  const fmt = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency, currencyDisplay: "code" }).format(n || 0).replace(currency, "").trim();
  const bizName = biz?.businessName || biz?.name || "";
  const isQuotation = invoice.invoiceType === "quotation";
  const docTitle = isQuotation ? "QUOTATION" : "INVOICE";
  const docNo = invoice.invoiceNumber || invoice.quotationNumber;
  const showCGST = invoice.cgstTotal > 0;
  const showSGST = invoice.sgstTotal > 0;
  const showIGST = invoice.igstTotal > 0;
  const showVAT = invoice.vatTotal > 0;
  const hasHsn = invoice.items?.some((i) => i.hsn);
  const hasDiscount = invoice.items?.some((i) => i.discount > 0);
  const hasBankDetails = biz?.bankDetails?.accountNumber;
  const hasPaymentInfo = invoice.paymentInfo;
  return /* @__PURE__ */ React.createElement(Document, null, /* @__PURE__ */ React.createElement(Page, { size: "A4", style: s.page }, !biz?.plan || String(biz.plan).toLowerCase() === "free" ? /* @__PURE__ */ React.createElement(View, { style: s.watermarkContainer, pointerEvents: "none", fixed: true }, /* @__PURE__ */ React.createElement(Text, { style: s.watermarkText }, "GoodSynk")) : isRasterImage(invoice.watermarkImage || biz.watermarkImage) ? /* @__PURE__ */ React.createElement(View, { style: s.watermarkContainer, pointerEvents: "none", fixed: true }, /* @__PURE__ */ React.createElement(Image, { src: invoice.watermarkImage || biz.watermarkImage, style: s.watermarkImg })) : null, /* @__PURE__ */ React.createElement(View, { style: s.topFlex }, /* @__PURE__ */ React.createElement(View, { style: s.bizBox }, biz?.businessLogo && /* @__PURE__ */ React.createElement(Image, { style: s.topLogo, src: biz.businessLogo }), /* @__PURE__ */ React.createElement(View, { style: s.bizInfoCol }, /* @__PURE__ */ React.createElement(Text, { numberOfLines: 1, style: s.bizName }, bizName), addrLines.length > 0 && /* @__PURE__ */ React.createElement(Text, { style: [s.bizAddress, { fontSize: addrFontSize }] }, addrLines.join("\n")))), /* @__PURE__ */ React.createElement(View, { style: s.docTitleBox }, /* @__PURE__ */ React.createElement(Text, { style: s.docTitle }, docTitle), /* @__PURE__ */ React.createElement(Text, { style: s.docNo }, "NO. ", /* @__PURE__ */ React.createElement(Text, { style: s.docNoBold }, docNo)))), /* @__PURE__ */ React.createElement(View, { style: s.bizDetailsRow }, biz?.phone && /* @__PURE__ */ React.createElement(Text, { style: s.bizText }, "P: ", biz.phone), biz?.email && /* @__PURE__ */ React.createElement(Text, { style: s.bizText }, "E: ", biz.email), biz?.gstin && /* @__PURE__ */ React.createElement(Text, { style: [s.bizText, { fontFamily: B, color: PRIMARY }] }, "GSTIN: ", biz.gstin)), /* @__PURE__ */ React.createElement(View, { style: s.cardsRow }, /* @__PURE__ */ React.createElement(View, { style: s.card }, /* @__PURE__ */ React.createElement(Text, { style: s.cardHeader }, "Billed To"), /* @__PURE__ */ React.createElement(Text, { numberOfLines: 1, style: s.clientName }, client?.name), client?.address?.street && /* @__PURE__ */ React.createElement(Text, { style: s.clientText }, client.address.street), client?.address?.city && /* @__PURE__ */ React.createElement(Text, { style: s.clientText }, client.address.city, ", ", client.address.state, " ", client.address.pincode), client?.phone && /* @__PURE__ */ React.createElement(Text, { style: s.clientText }, "P: ", client.phone), client?.email && /* @__PURE__ */ React.createElement(Text, { style: s.clientText }, "E: ", client.email)), /* @__PURE__ */ React.createElement(View, { style: s.card }, /* @__PURE__ */ React.createElement(Text, { style: s.cardHeader }, "Details"), /* @__PURE__ */ React.createElement(View, { style: s.metaRow }, /* @__PURE__ */ React.createElement(Text, { style: s.metaLabel }, "Date of Issue:"), /* @__PURE__ */ React.createElement(Text, { style: s.metaVal }, new Date(invoice.issueDate).toLocaleDateString("en-US"))), invoice.dueDate && /* @__PURE__ */ React.createElement(View, { style: s.metaRow }, /* @__PURE__ */ React.createElement(Text, { style: s.metaLabel }, "Due Date:"), /* @__PURE__ */ React.createElement(Text, { style: s.metaVal }, new Date(invoice.dueDate).toLocaleDateString("en-US"))), (hasBankDetails || hasPaymentInfo) && /* @__PURE__ */ React.createElement(View, { style: s.paymentSection }, /* @__PURE__ */ React.createElement(Text, { style: [s.cardHeader, { marginBottom: 6 }] }, "Payment Info"), hasBankDetails ? /* @__PURE__ */ React.createElement(View, null, biz.bankDetails.bankName && /* @__PURE__ */ React.createElement(View, { style: s.paymentRow }, /* @__PURE__ */ React.createElement(Text, { style: s.paymentLabel }, "Bank:"), /* @__PURE__ */ React.createElement(Text, { style: s.paymentValue }, biz.bankDetails.bankName)), biz.bankDetails.accountName && /* @__PURE__ */ React.createElement(View, { style: s.paymentRow }, /* @__PURE__ */ React.createElement(Text, { style: s.paymentLabel }, "A/C Name:"), /* @__PURE__ */ React.createElement(Text, { style: s.paymentValue }, biz.bankDetails.accountName)), /* @__PURE__ */ React.createElement(View, { style: s.paymentRow }, /* @__PURE__ */ React.createElement(Text, { style: s.paymentLabel }, "A/C No:"), /* @__PURE__ */ React.createElement(Text, { style: s.paymentValue }, biz.bankDetails.accountNumber)), biz.bankDetails.ifscCode && /* @__PURE__ */ React.createElement(View, { style: s.paymentRow }, /* @__PURE__ */ React.createElement(Text, { style: s.paymentLabel }, "IFSC:"), /* @__PURE__ */ React.createElement(Text, { style: s.paymentValue }, biz.bankDetails.ifscCode)), biz.bankDetails.swiftCode && /* @__PURE__ */ React.createElement(View, { style: s.paymentRow }, /* @__PURE__ */ React.createElement(Text, { style: s.paymentLabel }, "SWIFT:"), /* @__PURE__ */ React.createElement(Text, { style: s.paymentValue }, biz.bankDetails.swiftCode)), biz.bankDetails.branch && /* @__PURE__ */ React.createElement(View, { style: s.paymentRow }, /* @__PURE__ */ React.createElement(Text, { style: s.paymentLabel }, "Branch:"), /* @__PURE__ */ React.createElement(Text, { style: s.paymentValue }, biz.bankDetails.branch))) : hasPaymentInfo ? /* @__PURE__ */ React.createElement(Text, { style: s.clientText }, invoice.paymentInfo) : null))), /* @__PURE__ */ React.createElement(View, { style: s.table }, /* @__PURE__ */ React.createElement(View, { style: s.tHead }, /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colNo] }, "#"), /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colDesc] }, "Description"), hasHsn && /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colHsn] }, "HSN"), /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colQty] }, "QTY"), /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colPrice] }, "PRICE"), hasDiscount && /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colDisc] }, "DISC"), showCGST && /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colTax] }, "CGST"), showSGST && /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colTax] }, "SGST"), showIGST && /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colTax] }, "IGST"), showVAT && /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colTax] }, "VAT"), /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colTotal] }, "AMOUNT")), invoice.items?.map((item, i) => /* @__PURE__ */ React.createElement(View, { key: i, style: s.tRow }, /* @__PURE__ */ React.createElement(Text, { style: [s.td, s.colNo] }, i + 1), /* @__PURE__ */ React.createElement(View, { style: [s.td, s.colDesc, { paddingRight: 10 }] }, /* @__PURE__ */ React.createElement(Text, { style: { fontFamily: M } }, item.name), item.description && /* @__PURE__ */ React.createElement(Text, { style: { fontSize: 7.5, color: "#6B7280", marginTop: 3 } }, item.description)), hasHsn && /* @__PURE__ */ React.createElement(Text, { style: [s.td, s.colHsn] }, item.hsn || "\u2014"), /* @__PURE__ */ React.createElement(Text, { style: [s.td, s.colQty] }, item.itemType === "Service" ? "-" : `${item.quantity}${item.unit ? ` ${item.unit}` : ""}`), /* @__PURE__ */ React.createElement(Text, { style: [s.td, s.colPrice] }, fmt(item.price)), hasDiscount && /* @__PURE__ */ React.createElement(Text, { style: [s.td, s.colDisc] }, item.discount || 0, "%"), showCGST && /* @__PURE__ */ React.createElement(Text, { style: [s.td, s.colTax] }, item.cgstRate || 0, "%"), showSGST && /* @__PURE__ */ React.createElement(Text, { style: [s.td, s.colTax] }, item.sgstRate || 0, "%"), showIGST && /* @__PURE__ */ React.createElement(Text, { style: [s.td, s.colTax] }, item.igstRate || 0, "%"), showVAT && /* @__PURE__ */ React.createElement(Text, { style: [s.td, s.colTax] }, item.vatRate || 0, "%"), /* @__PURE__ */ React.createElement(Text, { style: [s.td, s.colTotal, { fontFamily: B }] }, fmt(item.total))))), /* @__PURE__ */ React.createElement(View, { style: s.bottomFlex }, /* @__PURE__ */ React.createElement(View, { style: s.notesBox }, invoice.notes && /* @__PURE__ */ React.createElement(View, { style: { marginBottom: 15 } }, /* @__PURE__ */ React.createElement(Text, { style: s.sectionTitle }, "Notes"), /* @__PURE__ */ React.createElement(Text, { style: s.notesText }, notesText)), invoice.termsAndConditions && /* @__PURE__ */ React.createElement(View, null, /* @__PURE__ */ React.createElement(Text, { style: s.sectionTitle }, "Terms & Conditions"), /* @__PURE__ */ React.createElement(Text, { style: s.notesText }, termsText)), /* @__PURE__ */ React.createElement(View, { style: s.sigBox, wrap: false }, biz?.businessSignature && /* @__PURE__ */ React.createElement(Image, { src: biz.businessSignature, style: s.sigImg }), /* @__PURE__ */ React.createElement(View, { style: s.sigLine }), /* @__PURE__ */ React.createElement(SignatoryDetails, { biz }), /* @__PURE__ */ React.createElement(Text, { style: s.sigText }, "Authorised Signatory"), biz?.businessSeal && /* @__PURE__ */ React.createElement(Image, { src: biz.businessSeal, style: { width: 70, height: 70, objectFit: "contain", marginTop: 4 } }))), /* @__PURE__ */ React.createElement(View, { style: s.totalsCard }, /* @__PURE__ */ React.createElement(View, { style: s.totRow }, /* @__PURE__ */ React.createElement(Text, { style: s.totLabel }, "Subtotal"), /* @__PURE__ */ React.createElement(Text, { style: s.totVal }, fmt(invoice.subtotal))), invoice.discountAmount > 0 && /* @__PURE__ */ React.createElement(View, { style: s.totRow }, /* @__PURE__ */ React.createElement(Text, { style: s.totLabel }, "Discount"), /* @__PURE__ */ React.createElement(Text, { style: s.totVal }, "-", fmt(invoice.discountAmount))), showCGST && /* @__PURE__ */ React.createElement(View, { style: s.totRow }, /* @__PURE__ */ React.createElement(Text, { style: s.totLabel }, "CGST"), /* @__PURE__ */ React.createElement(Text, { style: s.totVal }, fmt(invoice.cgstTotal))), showSGST && /* @__PURE__ */ React.createElement(View, { style: s.totRow }, /* @__PURE__ */ React.createElement(Text, { style: s.totLabel }, "SGST"), /* @__PURE__ */ React.createElement(Text, { style: s.totVal }, fmt(invoice.sgstTotal))), showIGST && /* @__PURE__ */ React.createElement(View, { style: s.totRow }, /* @__PURE__ */ React.createElement(Text, { style: s.totLabel }, "IGST"), /* @__PURE__ */ React.createElement(Text, { style: s.totVal }, fmt(invoice.igstTotal))), showVAT && /* @__PURE__ */ React.createElement(View, { style: s.totRow }, /* @__PURE__ */ React.createElement(Text, { style: s.totLabel }, "VAT"), /* @__PURE__ */ React.createElement(Text, { style: s.totVal }, fmt(invoice.vatTotal))), invoice.roundOff && Math.abs(roundOffDiff) > 1e-3 && /* @__PURE__ */ React.createElement(View, { style: s.totRow }, /* @__PURE__ */ React.createElement(Text, { style: s.totLabel }, "Round Off"), /* @__PURE__ */ React.createElement(Text, { style: s.totVal }, roundOffDiff >= 0 ? "+" : "-", fmt(Math.abs(roundOffDiff)))), /* @__PURE__ */ React.createElement(View, { style: s.totDivider }), /* @__PURE__ */ React.createElement(View, { style: s.grandTotRow }, /* @__PURE__ */ React.createElement(Text, { style: s.grandTotLabel }, "Total ", currency), /* @__PURE__ */ React.createElement(Text, { style: s.grandTotVal }, fmt(invoice.total))), /* @__PURE__ */ React.createElement(View, { style: s.wordsRow }, /* @__PURE__ */ React.createElement(Text, { style: s.wordsLabel }, "Amount in Words"), /* @__PURE__ */ React.createElement(Text, { style: s.wordsVal }, amountInWords(invoice.total, currency))))), /* @__PURE__ */ React.createElement(View, { style: s.footer, fixed: true }, /* @__PURE__ */ React.createElement(Text, { style: s.footerLeft }, bizName), /* @__PURE__ */ React.createElement(Text, { style: s.footerRight }, "Powered by ", /* @__PURE__ */ React.createElement(Link, { style: s.footerLink, src: "https://invoice.goodsynk.com" }, "GoodSynk"), /* @__PURE__ */ React.createElement(Text, { style: { fontSize: 7, fontFamily: "Helvetica" } }, "\u2122"))), /* @__PURE__ */ React.createElement(
    Text,
    {
      style: { position: "absolute", bottom: 4, right: 40, fontSize: 7.5, color: "#333333" },
      render: ({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`,
      fixed: true
    }
  )));
}
