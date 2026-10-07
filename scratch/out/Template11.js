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
export default function Template11({ invoice }) {
  const { client, user: biz } = invoice;
  const colors = invoice.templateColors || { primary: "#000000" };
  const PRIMARY = colors.primary;
  const scaled = buildScaledStyles(biz);
  const s = StyleSheet.create({
    watermarkContainer: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: -100 },
    watermarkText: { fontSize: 60, fontFamily: B, color: hexToRgba(PRIMARY, 0.08), transform: "rotate(-45deg)", letterSpacing: 5 },
    page: { paddingTop: 40, paddingBottom: 45, paddingHorizontal: 45, fontFamily: "Inter", color: "#111", backgroundColor: "#FFF" },
    // Minimalist Header
    headerWrap: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 },
    bizBox: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "flex-start" },
    brandText: { width: 230, flexShrink: 1 },
    topLogo: { maxWidth: 140, maxHeight: 52, objectFit: "contain", marginRight: 8, flexShrink: 0 },
    bizName: { fontFamily: B, fontSize: 14, color: "#111", textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 },
    bizText: { fontSize: 8.5, color: "#555", lineHeight: 1.6 },
    docBox: { width: "45%", alignItems: "flex-end" },
    docTitle: { fontFamily: B, fontSize: 12, color: PRIMARY, textTransform: "uppercase", letterSpacing: 4, marginBottom: 15 },
    docMetaRow: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 4 },
    docMetaLabel: { fontSize: 8.5, color: "#777", marginRight: 10, textTransform: "uppercase", letterSpacing: 1 },
    docMetaVal: { fontSize: 8.5, fontFamily: B, color: "#111" },
    // Billed To Section
    billToWrap: { marginBottom: 20 },
    billToLabel: { fontSize: 8, color: "#999", textTransform: "uppercase", letterSpacing: 2, marginBottom: 10 },
    clientName: { fontFamily: B, fontSize: 18, color: "#111", marginBottom: 6 },
    clientText: { fontSize: 9, color: "#555", lineHeight: 1.6 },
    // Borderless Table
    table: { width: "100%", marginBottom: 20 },
    tHead: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#000", paddingBottom: 10, marginBottom: 15 },
    tRow: { flexDirection: "row", paddingVertical: 8 },
    th: { fontSize: 7.5, color: "#777", textTransform: "uppercase", letterSpacing: 1 },
    td: { fontSize: 9, color: "#111" },
    colNo: { flex: 0.4 },
    colDesc: { flex: 2.2, paddingRight: 15 },
    colHsn: { flex: 0.8, textAlign: "center" },
    colQty: { flex: 0.9, textAlign: "center" },
    colPrice: { flex: 1.2, textAlign: "right", paddingRight: 10 },
    colDisc: { flex: 0.8, textAlign: "center", paddingRight: 4 },
    colTax: { flex: 0.8, textAlign: "center", paddingRight: 4 },
    colTotal: { flex: 1.3, textAlign: "right" },
    // Airy Totals
    totalsWrapper: { flexDirection: "row", justifyContent: "flex-end", marginTop: 6 },
    totalsBox: { width: "50%" },
    totRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
    totLabel: { fontSize: 9, color: "#555" },
    totVal: { fontSize: 9, color: "#111", textAlign: "right" },
    grandTotRow: { flexDirection: "row", justifyContent: "space-between", paddingTop: 15, borderTopWidth: 1, borderTopColor: "#000", marginTop: 10 },
    grandTotLabel: { fontSize: 11, fontFamily: B, color: "#111", textTransform: "uppercase", letterSpacing: 1 },
    grandTotVal: { fontSize: 11, fontFamily: B, color: PRIMARY, textAlign: "right" },
    // Bottom Area
    bottomFlex: { marginTop: 15 },
    notesWrap: { marginBottom: 15 },
    sectionTitle: { fontSize: 8, color: "#999", textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 },
    notesText: { fontSize: 8.5, color: "#444", lineHeight: 1.6, maxWidth: "80%" },
    sigWrap: { alignItems: "flex-end", marginTop: 10 },
    sigImg: { width: 140, height: 50, objectFit: "contain", marginBottom: 10 },
    sigLine: { width: 160, height: 1, backgroundColor: "#DDD", marginBottom: 6 },
    sigText: { fontSize: 8, color: "#777", textTransform: "uppercase", letterSpacing: 1 },
    // Footer
    footer: { position: "absolute", bottom: 20, left: 45, right: 45, alignItems: "center" },
    footerDivider: { width: "100%", height: 1, backgroundColor: "#EEE", marginBottom: 10 },
    footerText: { fontSize: 7, color: "#999", letterSpacing: 1, textTransform: "uppercase" },
    footerLink: { color: "#555", textDecoration: "none" }
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
  return /* @__PURE__ */ React.createElement(Document, null, /* @__PURE__ */ React.createElement(Page, { size: "A4", style: s.page }, (!biz?.plan || String(biz.plan).toLowerCase() === "free") && /* @__PURE__ */ React.createElement(View, { style: s.watermarkContainer, pointerEvents: "none", fixed: true }, /* @__PURE__ */ React.createElement(Text, { style: s.watermarkText }, "GoodSynk")), /* @__PURE__ */ React.createElement(View, { style: s.headerWrap }, /* @__PURE__ */ React.createElement(View, { style: s.bizBox }, biz?.businessLogo && /* @__PURE__ */ React.createElement(Image, { style: s.topLogo, src: biz.businessLogo }), /* @__PURE__ */ React.createElement(View, { style: s.brandText }, /* @__PURE__ */ React.createElement(Text, { numberOfLines: 1, style: s.bizName }, bizName), biz?.address?.street && /* @__PURE__ */ React.createElement(Text, { style: s.bizText }, String(biz.address.street).replace(/\s+,/g, ",").replace(/,(?=\S)/g, ", ").trim()), biz?.address?.city && /* @__PURE__ */ React.createElement(Text, { style: s.bizText }, [[biz?.address?.city, biz?.address?.state].map((v) => String(v || "").trim().replace(/[-,\s]+$/, "")).filter(Boolean).join(", "), String(biz?.address?.pincode || "").trim()].filter(Boolean).join(" ")), biz?.phone && /* @__PURE__ */ React.createElement(Text, { style: s.bizText }, biz.phone), biz?.email && /* @__PURE__ */ React.createElement(Text, { style: s.bizText }, biz.email), biz?.gstin && /* @__PURE__ */ React.createElement(Text, { style: [s.bizText, { marginTop: 10, fontFamily: B }] }, "GSTIN: ", biz.gstin))), /* @__PURE__ */ React.createElement(View, { style: s.docBox }, /* @__PURE__ */ React.createElement(Text, { style: s.docTitle }, docTitle), /* @__PURE__ */ React.createElement(View, { style: s.docMetaRow }, /* @__PURE__ */ React.createElement(Text, { style: s.docMetaLabel }, isQuotation ? "QUOTE NO" : "INVOICE NO"), /* @__PURE__ */ React.createElement(Text, { style: s.docMetaVal }, docNo)), /* @__PURE__ */ React.createElement(View, { style: s.docMetaRow }, /* @__PURE__ */ React.createElement(Text, { style: s.docMetaLabel }, "DATE"), /* @__PURE__ */ React.createElement(Text, { style: s.docMetaVal }, new Date(invoice.issueDate).toLocaleDateString("en-US"))), invoice.dueDate && /* @__PURE__ */ React.createElement(View, { style: s.docMetaRow }, /* @__PURE__ */ React.createElement(Text, { style: s.docMetaLabel }, "DUE"), /* @__PURE__ */ React.createElement(Text, { style: s.docMetaVal }, new Date(invoice.dueDate).toLocaleDateString("en-US"))))), /* @__PURE__ */ React.createElement(View, { style: s.billToWrap }, /* @__PURE__ */ React.createElement(Text, { style: s.billToLabel }, "BILLED TO"), /* @__PURE__ */ React.createElement(Text, { numberOfLines: 1, style: s.clientName }, client?.name), client?.address?.street && /* @__PURE__ */ React.createElement(Text, { style: s.clientText }, client.address.street), client?.address?.city && /* @__PURE__ */ React.createElement(Text, { style: s.clientText }, client.address.city, ", ", client.address.state, " ", client.address.pincode), client?.phone && /* @__PURE__ */ React.createElement(Text, { style: s.clientText }, client.phone), client?.email && /* @__PURE__ */ React.createElement(Text, { style: s.clientText }, client.email)), /* @__PURE__ */ React.createElement(View, { style: s.table }, /* @__PURE__ */ React.createElement(View, { style: s.tHead }, /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colNo] }, "NO."), /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colDesc] }, "DESCRIPTION"), hasHsn && /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colHsn] }, "HSN"), /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colQty] }, "QTY"), /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colPrice] }, "PRICE"), hasDiscount && /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colDisc] }, "DISC"), showCGST && /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colTax] }, "CGST"), showSGST && /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colTax] }, "SGST"), showIGST && /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colTax] }, "IGST"), showVAT && /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colTax] }, "VAT"), /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colTotal] }, "TOTAL")), invoice.items?.map((item, i) => /* @__PURE__ */ React.createElement(View, { key: i, style: s.tRow }, /* @__PURE__ */ React.createElement(Text, { style: [s.td, s.colNo, { color: "#999" }] }, (i + 1).toString().padStart(2, "0")), /* @__PURE__ */ React.createElement(View, { style: [s.td, s.colDesc, { paddingRight: 15 }] }, /* @__PURE__ */ React.createElement(Text, { style: { fontFamily: M } }, item.name), item.description && /* @__PURE__ */ React.createElement(Text, { style: { fontSize: 8, color: "#888", marginTop: 4, lineHeight: 1.4 } }, item.description)), hasHsn && /* @__PURE__ */ React.createElement(Text, { style: [s.td, s.colHsn] }, item.hsn || "\u2014"), /* @__PURE__ */ React.createElement(Text, { style: [s.td, s.colQty] }, item.itemType === "Service" ? "-" : `${item.quantity}${item.unit ? ` ${item.unit}` : ""}`), /* @__PURE__ */ React.createElement(Text, { style: [s.td, s.colPrice] }, fmt(item.price)), hasDiscount && /* @__PURE__ */ React.createElement(Text, { style: [s.td, s.colDisc] }, item.discount || 0, "%"), showCGST && /* @__PURE__ */ React.createElement(Text, { style: [s.td, s.colTax] }, item.cgstRate || 0, "%"), showSGST && /* @__PURE__ */ React.createElement(Text, { style: [s.td, s.colTax] }, item.sgstRate || 0, "%"), showIGST && /* @__PURE__ */ React.createElement(Text, { style: [s.td, s.colTax] }, item.igstRate || 0, "%"), showVAT && /* @__PURE__ */ React.createElement(Text, { style: [s.td, s.colTax] }, item.vatRate || 0, "%"), /* @__PURE__ */ React.createElement(Text, { style: [s.td, s.colTotal] }, fmt(item.total))))), /* @__PURE__ */ React.createElement(View, { style: s.totalsWrapper }, /* @__PURE__ */ React.createElement(View, { style: s.totalsBox }, /* @__PURE__ */ React.createElement(View, { style: s.totRow }, /* @__PURE__ */ React.createElement(Text, { style: s.totLabel }, "Subtotal"), /* @__PURE__ */ React.createElement(Text, { style: s.totVal }, fmt(invoice.subtotal))), invoice.discountAmount > 0 && /* @__PURE__ */ React.createElement(View, { style: s.totRow }, /* @__PURE__ */ React.createElement(Text, { style: s.totLabel }, "Discount"), /* @__PURE__ */ React.createElement(Text, { style: s.totVal }, "-", fmt(invoice.discountAmount))), showCGST && /* @__PURE__ */ React.createElement(View, { style: s.totRow }, /* @__PURE__ */ React.createElement(Text, { style: s.totLabel }, "CGST"), /* @__PURE__ */ React.createElement(Text, { style: s.totVal }, fmt(invoice.cgstTotal))), showSGST && /* @__PURE__ */ React.createElement(View, { style: s.totRow }, /* @__PURE__ */ React.createElement(Text, { style: s.totLabel }, "SGST"), /* @__PURE__ */ React.createElement(Text, { style: s.totVal }, fmt(invoice.sgstTotal))), showIGST && /* @__PURE__ */ React.createElement(View, { style: s.totRow }, /* @__PURE__ */ React.createElement(Text, { style: s.totLabel }, "IGST"), /* @__PURE__ */ React.createElement(Text, { style: s.totVal }, fmt(invoice.igstTotal))), showVAT && /* @__PURE__ */ React.createElement(View, { style: s.totRow }, /* @__PURE__ */ React.createElement(Text, { style: s.totLabel }, "VAT"), /* @__PURE__ */ React.createElement(Text, { style: s.totVal }, fmt(invoice.vatTotal))), invoice.roundOff && Math.abs(roundOffDiff) > 1e-3 && /* @__PURE__ */ React.createElement(View, { style: s.totRow }, /* @__PURE__ */ React.createElement(Text, { style: s.totLabel }, "Round Off"), /* @__PURE__ */ React.createElement(Text, { style: s.totVal }, roundOffDiff >= 0 ? "+" : "-", fmt(Math.abs(roundOffDiff)))), /* @__PURE__ */ React.createElement(View, { style: s.grandTotRow }, /* @__PURE__ */ React.createElement(Text, { style: s.grandTotLabel }, "Total ", currency), /* @__PURE__ */ React.createElement(Text, { style: s.grandTotVal }, fmt(invoice.total))))), /* @__PURE__ */ React.createElement(View, { style: s.bottomFlex }, biz?.bankDetails?.accountNumber && /* @__PURE__ */ React.createElement(View, { style: s.notesWrap }, /* @__PURE__ */ React.createElement(Text, { style: s.sectionTitle }, "Payment Details"), biz.bankDetails.bankName && /* @__PURE__ */ React.createElement(Text, { style: s.notesText }, biz.bankDetails.bankName), biz.bankDetails.accountName && /* @__PURE__ */ React.createElement(Text, { style: s.notesText }, "A/C Name: ", biz.bankDetails.accountName), /* @__PURE__ */ React.createElement(Text, { style: s.notesText }, "A/C: ", biz.bankDetails.accountNumber), biz.bankDetails.ifscCode && /* @__PURE__ */ React.createElement(Text, { style: s.notesText }, "IFSC: ", biz.bankDetails.ifscCode), biz.bankDetails.swiftCode && /* @__PURE__ */ React.createElement(Text, { style: s.notesText }, "SWIFT: ", biz.bankDetails.swiftCode), biz.bankDetails.branch && /* @__PURE__ */ React.createElement(Text, { style: s.notesText }, "Branch: ", biz.bankDetails.branch)), !biz?.bankDetails?.accountNumber && invoice.paymentInfo && /* @__PURE__ */ React.createElement(View, { style: s.notesWrap }, /* @__PURE__ */ React.createElement(Text, { style: s.sectionTitle }, "Payment Info"), /* @__PURE__ */ React.createElement(Text, { style: s.notesText }, invoice.paymentInfo)), invoice.notes && /* @__PURE__ */ React.createElement(View, { style: s.notesWrap }, /* @__PURE__ */ React.createElement(Text, { style: s.sectionTitle }, "Notes"), /* @__PURE__ */ React.createElement(Text, { style: s.notesText }, notesText)), invoice.termsAndConditions && /* @__PURE__ */ React.createElement(View, { style: s.notesWrap }, /* @__PURE__ */ React.createElement(Text, { style: s.sectionTitle }, "Terms & Conditions"), /* @__PURE__ */ React.createElement(Text, { style: s.notesText }, termsText)), /* @__PURE__ */ React.createElement(View, { style: s.sigWrap, wrap: false }, biz?.businessSignature && /* @__PURE__ */ React.createElement(Image, { src: biz.businessSignature, style: s.sigImg }), /* @__PURE__ */ React.createElement(View, { style: s.sigLine }), /* @__PURE__ */ React.createElement(SignatoryDetails, { biz }), /* @__PURE__ */ React.createElement(Text, { style: s.sigText }, "Authorised Signatory"), biz?.businessSeal && /* @__PURE__ */ React.createElement(Image, { src: biz.businessSeal, style: { width: 70, height: 70, objectFit: "contain", marginTop: 4 } }))), /* @__PURE__ */ React.createElement(View, { style: s.footer, fixed: true }, /* @__PURE__ */ React.createElement(View, { style: s.footerDivider }), /* @__PURE__ */ React.createElement(Text, { style: s.footerText }, "Generated securely \u2022 Powered by ", /* @__PURE__ */ React.createElement(Link, { style: s.footerLink, src: "https://invoice.goodsynk.com" }, "GoodSynk"), /* @__PURE__ */ React.createElement(Text, { style: { fontSize: 7, fontFamily: "Helvetica" } }, "\u2122"))), /* @__PURE__ */ React.createElement(
    Text,
    {
      style: { position: "absolute", bottom: 6, right: 40, fontSize: 7.5, color: "#333333" },
      render: ({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`,
      fixed: true
    }
  )));
}
