import SignatoryDetails from "./SignatoryDetails";
import React from "react";
import { Document, Page, Text, View, StyleSheet, Font, Image, Link } from "@react-pdf/renderer";
import { buildScaledStyles } from "./Pdfheaderscaling";
const B = "Inter-Bold";
const hexToRgba = (hex, alpha) => {
  if (!hex) return "rgba(0, 0, 0, " + alpha + ")";
  let clean = hex.replace("#", "");
  if (clean.length === 3) clean = clean.split("").map((c) => c + c).join("");
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
};
const M = "Inter-SemiBold";
export default function Template8({ invoice }) {
  const { client, user: biz } = invoice;
  const scaled = buildScaledStyles(biz);
  const s = StyleSheet.create({
    watermarkContainer: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: -100 },
    watermarkText: { fontSize: 60, fontFamily: B, color: hexToRgba("#000000", 0.08), transform: "rotate(-45deg)", letterSpacing: 5 },
    page: { paddingTop: 50, paddingBottom: 60, paddingHorizontal: 50, fontFamily: "Inter", color: "#000", backgroundColor: "#FFF" },
    // Header Layout: Split left/right with massive typography on the right
    headerWrap: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 },
    bizLeft: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "flex-start" },
    brandText: { width: 230, flexShrink: 1 },
    topLogo: { maxWidth: 140, maxHeight: 52, objectFit: "contain", marginRight: 8, flexShrink: 0 },
    bizName: { fontFamily: B, fontSize: 16, color: "#000", textTransform: "uppercase", marginBottom: 6, letterSpacing: 2 },
    bizText: { fontSize: 8.5, color: "#444", lineHeight: 1.5 },
    docRight: { width: "45%", alignItems: "flex-end", borderTopWidth: 3, borderTopColor: "#000", paddingTop: 8 },
    docTitle: { fontFamily: B, fontSize: 36, color: "#000", textTransform: "uppercase", letterSpacing: 4, marginBottom: 10 },
    docMetaText: { fontSize: 9, color: "#555", marginBottom: 4, textAlign: "right" },
    docMetaBold: { fontFamily: B, color: "#000" },
    // Info Section: A stark bordered box layout
    infoWrap: { flexDirection: "row", borderTopWidth: 1, borderBottomWidth: 1, borderColor: "#000", paddingVertical: 15, marginBottom: 30 },
    infoColLeft: { width: "50%", borderRightWidth: 1, borderColor: "#000", paddingRight: 20 },
    infoColRight: { width: "50%", paddingLeft: 20 },
    infoLabel: { fontSize: 8, fontFamily: B, color: "#000", textTransform: "uppercase", marginBottom: 6, letterSpacing: 1 },
    clientName: { fontFamily: B, fontSize: 12, color: "#000", marginBottom: 4 },
    clientText: { fontSize: 8.5, color: "#333", lineHeight: 1.4 },
    // Table: No background colors, just stark lines
    table: { width: "100%", marginBottom: 14 },
    tHead: { flexDirection: "row", borderBottomWidth: 2, borderBottomColor: "#000", paddingBottom: 8, marginBottom: 8 },
    tRow: { flexDirection: "row", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#E5E5E5" },
    th: { fontSize: 8.5, fontFamily: B, color: "#000", textTransform: "uppercase", letterSpacing: 0.5 },
    td: { fontSize: 9, color: "#111" },
    colNo: { flex: 0.4 },
    colDesc: { flex: 2.2, paddingRight: 10 },
    colHsn: { flex: 0.8, textAlign: "center" },
    colQty: { flex: 0.9, textAlign: "center" },
    colPrice: { flex: 1.2, textAlign: "right", paddingRight: 10 },
    colDisc: { flex: 0.8, textAlign: "center", paddingRight: 4 },
    colTax: { flex: 0.8, textAlign: "center", paddingRight: 4 },
    colTotal: { flex: 1.3, textAlign: "right" },
    // Totals section: Clean, right-aligned block
    totalsWrapper: { flexDirection: "row", justifyContent: "flex-end", marginTop: 6 },
    totalsBox: { width: "45%" },
    totRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
    totLabel: { fontSize: 9, color: "#444" },
    totVal: { fontSize: 9, fontFamily: M, color: "#000", textAlign: "right" },
    grandTotRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderTopWidth: 2, borderTopColor: "#000", borderBottomWidth: 2, borderBottomColor: "#000", marginTop: 6 },
    grandTotLabel: { fontSize: 12, fontFamily: B, color: "#000", textTransform: "uppercase" },
    grandTotVal: { fontSize: 12, fontFamily: B, color: "#000", textAlign: "right" },
    // Notes and Signature: Clean and structured
    bottomFlex: { flexDirection: "row", justifyContent: "space-between", marginTop: 40 },
    notesBox: { width: "55%" },
    sectionTitle: { fontSize: 9, fontFamily: B, color: "#000", textTransform: "uppercase", marginBottom: 8, letterSpacing: 1 },
    notesText: { fontSize: 8.5, color: "#444", lineHeight: 1.5, marginBottom: 15 },
    sigBox: { width: "40%", alignItems: "flex-end", justifyContent: "flex-end" },
    sigImg: { width: 140, height: 45, objectFit: "contain", marginBottom: 6 },
    sigLine: { width: "100%", height: 1, backgroundColor: "#000", marginBottom: 6 },
    sigText: { fontSize: 8, fontFamily: B, color: "#000", textTransform: "uppercase", letterSpacing: 1 },
    // Footer: Minimalist
    footer: { position: "absolute", bottom: 25, left: 50, right: 50, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    footerBrand: { fontSize: 7, fontFamily: B, color: "#000", letterSpacing: 1, textTransform: "uppercase" },
    footerPowered: { fontSize: 7, color: "#666" },
    footerLink: { fontSize: 7, fontFamily: B, color: "#000", textDecoration: "underline" }
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
  const roundOffDiff = invoice.roundOff ? (invoice.total || 0) - ((invoice.subtotal || 0) - (invoice.discountAmount || 0) + (invoice.taxTotal || 0)) : 0;
  const notesText = Array.isArray(invoice.notes) ? invoice.notes.join("\n") : invoice.notes;
  const termsText = Array.isArray(invoice.termsAndConditions) ? invoice.termsAndConditions.join("\n") : invoice.termsAndConditions;
  return /* @__PURE__ */ React.createElement(Document, null, /* @__PURE__ */ React.createElement(Page, { size: "A4", style: s.page }, (!biz?.plan || String(biz.plan).toLowerCase() === "free") && /* @__PURE__ */ React.createElement(View, { style: s.watermarkContainer, pointerEvents: "none", fixed: true }, /* @__PURE__ */ React.createElement(Text, { style: s.watermarkText }, "GoodSynk")), /* @__PURE__ */ React.createElement(View, { style: s.headerWrap }, /* @__PURE__ */ React.createElement(View, { style: s.bizLeft }, biz?.businessLogo && /* @__PURE__ */ React.createElement(Image, { style: s.topLogo, src: biz.businessLogo }), /* @__PURE__ */ React.createElement(View, { style: s.brandText }, /* @__PURE__ */ React.createElement(Text, { numberOfLines: 1, style: s.bizName }, bizName), biz?.address?.street && /* @__PURE__ */ React.createElement(Text, { style: s.bizText }, String(biz.address.street).replace(/\s+,/g, ",").replace(/,(?=\S)/g, ", ").trim()), biz?.address?.city && /* @__PURE__ */ React.createElement(Text, { style: s.bizText }, [[biz?.address?.city, biz?.address?.state].map((v) => String(v || "").trim().replace(/[-,\s]+$/, "")).filter(Boolean).join(", "), String(biz?.address?.pincode || "").trim()].filter(Boolean).join(" ")), biz?.phone && /* @__PURE__ */ React.createElement(Text, { style: s.bizText }, "P: ", biz.phone), biz?.email && /* @__PURE__ */ React.createElement(Text, { style: s.bizText }, "E: ", biz.email), biz?.gstin && /* @__PURE__ */ React.createElement(Text, { style: [s.bizText, { marginTop: 6, fontFamily: B }] }, "GSTIN: ", biz.gstin))), /* @__PURE__ */ React.createElement(View, { style: s.docRight }, /* @__PURE__ */ React.createElement(Text, { style: s.docTitle }, docTitle), /* @__PURE__ */ React.createElement(Text, { style: s.docMetaText }, isQuotation ? "QUOTE NO" : "INVOICE NO", ": ", /* @__PURE__ */ React.createElement(Text, { style: s.docMetaBold }, docNo)), /* @__PURE__ */ React.createElement(Text, { style: s.docMetaText }, "DATE: ", /* @__PURE__ */ React.createElement(Text, { style: s.docMetaBold }, new Date(invoice.issueDate).toLocaleDateString("en-US"))), invoice.dueDate && /* @__PURE__ */ React.createElement(Text, { style: s.docMetaText }, "DUE: ", /* @__PURE__ */ React.createElement(Text, { style: s.docMetaBold }, new Date(invoice.dueDate).toLocaleDateString("en-US"))))), /* @__PURE__ */ React.createElement(View, { style: s.infoWrap }, /* @__PURE__ */ React.createElement(View, { style: s.infoColLeft }, /* @__PURE__ */ React.createElement(Text, { style: s.infoLabel }, "Billed To"), /* @__PURE__ */ React.createElement(Text, { numberOfLines: 1, style: s.clientName }, client?.name), client?.address?.street && /* @__PURE__ */ React.createElement(Text, { style: s.clientText }, client.address.street), client?.address?.city && /* @__PURE__ */ React.createElement(Text, { style: s.clientText }, client.address.city, ", ", client.address.state, " ", client.address.pincode), client?.phone && /* @__PURE__ */ React.createElement(Text, { style: s.clientText }, "P: ", client.phone), client?.email && /* @__PURE__ */ React.createElement(Text, { style: s.clientText }, "E: ", client.email)), /* @__PURE__ */ React.createElement(View, { style: s.infoColRight }, biz?.bankDetails?.accountNumber ? /* @__PURE__ */ React.createElement(View, null, /* @__PURE__ */ React.createElement(Text, { style: s.infoLabel }, "Payment Details"), biz.bankDetails.bankName && /* @__PURE__ */ React.createElement(Text, { style: s.clientText }, "Bank: ", biz.bankDetails.bankName), biz.bankDetails.accountName && /* @__PURE__ */ React.createElement(Text, { style: s.clientText }, "A/C Name: ", biz.bankDetails.accountName), /* @__PURE__ */ React.createElement(Text, { style: s.clientText }, "Account: ", biz.bankDetails.accountNumber), biz.bankDetails.ifscCode && /* @__PURE__ */ React.createElement(Text, { style: s.clientText }, "IFSC: ", biz.bankDetails.ifscCode), biz.bankDetails.swiftCode && /* @__PURE__ */ React.createElement(Text, { style: s.clientText }, "SWIFT: ", biz.bankDetails.swiftCode), biz.bankDetails.branch && /* @__PURE__ */ React.createElement(Text, { style: s.clientText }, "Branch: ", biz.bankDetails.branch)) : null, !biz?.bankDetails?.accountNumber && invoice.paymentInfo ? /* @__PURE__ */ React.createElement(View, null, /* @__PURE__ */ React.createElement(Text, { style: s.infoLabel }, "Payment Info"), /* @__PURE__ */ React.createElement(Text, { style: s.clientText }, invoice.paymentInfo)) : null)), /* @__PURE__ */ React.createElement(View, { style: s.table }, /* @__PURE__ */ React.createElement(View, { style: s.tHead }, /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colNo] }, "#"), /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colDesc] }, "Description"), hasHsn && /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colHsn] }, "HSN"), /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colQty] }, "QTY"), /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colPrice] }, "PRICE"), hasDiscount && /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colDisc] }, "DISC"), showCGST && /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colTax] }, "CGST"), showSGST && /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colTax] }, "SGST"), showIGST && /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colTax] }, "IGST"), showVAT && /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colTax] }, "VAT"), /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colTotal] }, "AMOUNT")), invoice.items?.map((item, i) => /* @__PURE__ */ React.createElement(View, { key: i, style: s.tRow }, /* @__PURE__ */ React.createElement(Text, { style: [s.td, s.colNo] }, i + 1), /* @__PURE__ */ React.createElement(View, { style: [s.td, s.colDesc, { paddingRight: 10 }] }, /* @__PURE__ */ React.createElement(Text, { style: { fontFamily: B } }, item.name), item.description && /* @__PURE__ */ React.createElement(Text, { style: { fontSize: 7.5, color: "#555", marginTop: 3 } }, item.description)), hasHsn && /* @__PURE__ */ React.createElement(Text, { style: [s.td, s.colHsn] }, item.hsn || "\u2014"), /* @__PURE__ */ React.createElement(Text, { style: [s.td, s.colQty] }, item.itemType === "Service" ? "-" : `${item.quantity}${item.unit ? ` ${item.unit}` : ""}`), /* @__PURE__ */ React.createElement(Text, { style: [s.td, s.colPrice] }, fmt(item.price)), hasDiscount && /* @__PURE__ */ React.createElement(Text, { style: [s.td, s.colDisc] }, item.discount || 0, "%"), showCGST && /* @__PURE__ */ React.createElement(Text, { style: [s.td, s.colTax] }, item.cgstRate || 0, "%"), showSGST && /* @__PURE__ */ React.createElement(Text, { style: [s.td, s.colTax] }, item.sgstRate || 0, "%"), showIGST && /* @__PURE__ */ React.createElement(Text, { style: [s.td, s.colTax] }, item.igstRate || 0, "%"), showVAT && /* @__PURE__ */ React.createElement(Text, { style: [s.td, s.colTax] }, item.vatRate || 0, "%"), /* @__PURE__ */ React.createElement(Text, { style: [s.td, s.colTotal, { fontFamily: B }] }, fmt(item.total))))), /* @__PURE__ */ React.createElement(View, { style: s.totalsWrapper }, /* @__PURE__ */ React.createElement(View, { style: s.totalsBox }, /* @__PURE__ */ React.createElement(View, { style: s.totRow }, /* @__PURE__ */ React.createElement(Text, { style: s.totLabel }, "SUBTOTAL"), /* @__PURE__ */ React.createElement(Text, { style: s.totVal }, fmt(invoice.subtotal))), invoice.discountAmount > 0 && /* @__PURE__ */ React.createElement(View, { style: s.totRow }, /* @__PURE__ */ React.createElement(Text, { style: s.totLabel }, "DISCOUNT"), /* @__PURE__ */ React.createElement(Text, { style: s.totVal }, "-", fmt(invoice.discountAmount))), showCGST && /* @__PURE__ */ React.createElement(View, { style: s.totRow }, /* @__PURE__ */ React.createElement(Text, { style: s.totLabel }, "CGST"), /* @__PURE__ */ React.createElement(Text, { style: s.totVal }, fmt(invoice.cgstTotal))), showSGST && /* @__PURE__ */ React.createElement(View, { style: s.totRow }, /* @__PURE__ */ React.createElement(Text, { style: s.totLabel }, "SGST"), /* @__PURE__ */ React.createElement(Text, { style: s.totVal }, fmt(invoice.sgstTotal))), showIGST && /* @__PURE__ */ React.createElement(View, { style: s.totRow }, /* @__PURE__ */ React.createElement(Text, { style: s.totLabel }, "IGST"), /* @__PURE__ */ React.createElement(Text, { style: s.totVal }, fmt(invoice.igstTotal))), showVAT && /* @__PURE__ */ React.createElement(View, { style: s.totRow }, /* @__PURE__ */ React.createElement(Text, { style: s.totLabel }, "VAT"), /* @__PURE__ */ React.createElement(Text, { style: s.totVal }, fmt(invoice.vatTotal))), invoice.roundOff && Math.abs(roundOffDiff) > 1e-3 && /* @__PURE__ */ React.createElement(View, { style: s.totRow }, /* @__PURE__ */ React.createElement(Text, { style: s.totLabel }, "ROUND OFF"), /* @__PURE__ */ React.createElement(Text, { style: s.totVal }, roundOffDiff >= 0 ? "+" : "-", fmt(Math.abs(roundOffDiff)))), /* @__PURE__ */ React.createElement(View, { style: s.grandTotRow }, /* @__PURE__ */ React.createElement(Text, { style: s.grandTotLabel }, "TOTAL ", currency), /* @__PURE__ */ React.createElement(Text, { style: s.grandTotVal }, fmt(invoice.total))))), /* @__PURE__ */ React.createElement(View, { style: s.bottomFlex }, /* @__PURE__ */ React.createElement(View, { style: s.notesBox }, invoice.notes && /* @__PURE__ */ React.createElement(View, { style: { marginBottom: 15 } }, /* @__PURE__ */ React.createElement(Text, { style: s.sectionTitle }, "Notes"), /* @__PURE__ */ React.createElement(Text, { style: s.notesText }, notesText)), invoice.termsAndConditions && /* @__PURE__ */ React.createElement(View, null, /* @__PURE__ */ React.createElement(Text, { style: s.sectionTitle }, "Terms & Conditions"), /* @__PURE__ */ React.createElement(Text, { style: s.notesText }, termsText))), /* @__PURE__ */ React.createElement(View, { style: s.sigBox, wrap: false }, biz?.businessSignature && /* @__PURE__ */ React.createElement(Image, { src: biz.businessSignature, style: s.sigImg }), /* @__PURE__ */ React.createElement(View, { style: s.sigLine }), /* @__PURE__ */ React.createElement(SignatoryDetails, { biz }), /* @__PURE__ */ React.createElement(Text, { style: s.sigText }, "Authorised Signatory"), biz?.businessSeal && /* @__PURE__ */ React.createElement(Image, { src: biz.businessSeal, style: { width: 70, height: 70, objectFit: "contain", marginTop: 4 } }))), /* @__PURE__ */ React.createElement(View, { style: s.footer, fixed: true }, /* @__PURE__ */ React.createElement(Text, { style: s.footerBrand }, bizName), /* @__PURE__ */ React.createElement(View, { style: { flexDirection: "row", alignItems: "center" } }, /* @__PURE__ */ React.createElement(Text, { style: s.footerPowered }, "POWERED BY "), /* @__PURE__ */ React.createElement(Link, { style: s.footerLink, src: "https://invoice.goodsynk.com" }, "GOODSYNK"), /* @__PURE__ */ React.createElement(Text, { style: { fontSize: 7, fontFamily: "Helvetica" } }, "\u2122"))), /* @__PURE__ */ React.createElement(
    Text,
    {
      style: { position: "absolute", bottom: 4, right: 40, fontSize: 7.5, color: "#333333" },
      render: ({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`,
      fixed: true
    }
  )));
}
