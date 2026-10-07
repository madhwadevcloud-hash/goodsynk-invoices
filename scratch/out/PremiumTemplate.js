import SignatoryDetails from "./SignatoryDetails";
import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
const themes = {
  quotationGreen: { accent: "#1F7A5A", soft: "#E8F4EE", ink: "#17352B", title: "QUOTATION" },
  quotationOrange: { accent: "#C65D2E", soft: "#FFF1E9", ink: "#3D2117", title: "QUOTATION" },
  invoiceSlate: { accent: "#334155", soft: "#E2E8F0", ink: "#172033", title: "INVOICE" },
  invoiceTeal: { accent: "#0F766E", soft: "#CCFBF1", ink: "#123C3A", title: "INVOICE" }
};
const hexToRgba = (hex, alpha) => {
  if (!hex) return "rgba(0, 0, 0, " + alpha + ")";
  let clean = hex.replace("#", "");
  if (clean.length === 3) clean = clean.split("").map((c) => c + c).join("");
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
};
export default function PremiumTemplate({ invoice, variant }) {
  const { client, user: biz } = invoice;
  const theme = themes[variant];
  const isQuotation = invoice.invoiceType === "quotation";
  const currency = invoice._currency || invoice.currency || "INR";
  const fmt = (value) => new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value || 0);
  const date = (value) => value ? new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Upon receipt";
  const styles = StyleSheet.create({
    page: { padding: 38, fontFamily: "Helvetica", color: theme.ink, backgroundColor: "#FFFFFF" },
    watermarkContainer: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: -100 },
    watermarkText: { fontSize: 60, fontFamily: "Helvetica-Bold", color: hexToRgba(theme.ink, 0.08), transform: "rotate(-45deg)", letterSpacing: 5 },
    topBand: { backgroundColor: theme.accent, padding: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    topBandTitle: { color: "#FFFFFF", fontSize: 26, fontFamily: "Helvetica-Bold", letterSpacing: 2 },
    topBandMeta: { color: "#FFFFFF", fontSize: 8, textAlign: "right", lineHeight: 1.5 },
    logo: { width: 92, height: 42, objectFit: "contain", marginBottom: 6 },
    business: { paddingVertical: 14, flexDirection: "row", justifyContent: "space-between" },
    brand: { flexDirection: "row", alignItems: "center" },
    brandText: { marginLeft: 8 },
    businessName: { fontSize: 14, fontFamily: "Helvetica-Bold", color: theme.ink, marginBottom: 5 },
    small: { fontSize: 8, color: "#52615D", lineHeight: 1.45 },
    address: { textAlign: "right", maxWidth: 220 },
    infoGrid: { flexDirection: "row", borderTop: `1pt solid ${theme.soft}`, borderBottom: `1pt solid ${theme.soft}`, paddingVertical: 14, marginBottom: 18 },
    infoBlock: { flex: 1, paddingHorizontal: 10, borderRight: `0.5pt solid ${theme.soft}` },
    infoLast: { borderRight: 0 },
    label: { fontSize: 7, fontFamily: "Helvetica-Bold", color: theme.accent, textTransform: "uppercase", letterSpacing: 1, marginBottom: 5 },
    clientName: { fontSize: 10, fontFamily: "Helvetica-Bold", marginBottom: 3 },
    table: { border: `1pt solid ${theme.soft}` },
    head: { flexDirection: "row", backgroundColor: theme.accent, paddingVertical: 8, paddingHorizontal: 8 },
    row: { flexDirection: "row", paddingVertical: 9, paddingHorizontal: 8, borderBottom: `0.5pt solid ${theme.soft}` },
    cell: { fontSize: 8, color: theme.ink },
    headCell: { fontSize: 7, color: "#FFFFFF", fontFamily: "Helvetica-Bold", textTransform: "uppercase" },
    number: { width: "7%" },
    desc: { width: "45%" },
    qty: { width: "13%", textAlign: "center" },
    price: { width: "17%", textAlign: "right" },
    total: { width: "18%", textAlign: "right" },
    lower: { flexDirection: "row", marginTop: 18, justifyContent: "space-between" },
    notes: { width: "53%", paddingRight: 22 },
    totals: { width: "40%", backgroundColor: theme.soft, padding: 12 },
    totalLine: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
    grand: { borderTop: `1pt solid ${theme.accent}`, marginTop: 5, paddingTop: 7, fontFamily: "Helvetica-Bold", fontSize: 12 },
    footer: { position: "absolute", bottom: 25, left: 38, right: 38, borderTop: `2pt solid ${theme.accent}`, paddingTop: 8, flexDirection: "row", justifyContent: "space-between" },
    signature: { textAlign: "right", width: 170 }
  });
  return /* @__PURE__ */ React.createElement(Document, null, /* @__PURE__ */ React.createElement(Page, { size: "A4", style: styles.page }, (!biz?.plan || String(biz.plan).toLowerCase() === "free") && /* @__PURE__ */ React.createElement(View, { style: styles.watermarkContainer, pointerEvents: "none", fixed: true }, /* @__PURE__ */ React.createElement(Text, { style: styles.watermarkText }, "GoodSynk")), /* @__PURE__ */ React.createElement(View, { style: styles.topBand }, /* @__PURE__ */ React.createElement(Text, { style: styles.topBandTitle }, theme.title), /* @__PURE__ */ React.createElement(View, null, /* @__PURE__ */ React.createElement(Text, { style: styles.topBandMeta }, isQuotation ? "Prepared for your approval" : "Payment document"), /* @__PURE__ */ React.createElement(Text, { style: styles.topBandMeta }, invoice.invoiceNumber || invoice.quotationNumber || "Draft"))), /* @__PURE__ */ React.createElement(View, { style: styles.business }, /* @__PURE__ */ React.createElement(View, { style: styles.brand }, biz?.businessLogo && /* @__PURE__ */ React.createElement(Image, { src: biz.businessLogo, style: styles.logo }), /* @__PURE__ */ React.createElement(View, { style: styles.brandText }, /* @__PURE__ */ React.createElement(Text, { style: styles.businessName }, biz?.businessName || biz?.name || ""), biz?.gstin && /* @__PURE__ */ React.createElement(Text, { style: styles.small }, "GSTIN: ", biz.gstin))), /* @__PURE__ */ React.createElement(View, { style: styles.address }, biz?.address?.street && /* @__PURE__ */ React.createElement(Text, { style: styles.small }, biz.address.street), biz?.address?.city && /* @__PURE__ */ React.createElement(Text, { style: styles.small }, biz.address.city, ", ", biz.address.state, " ", biz.address.pincode), biz?.phone && /* @__PURE__ */ React.createElement(Text, { style: styles.small }, biz.phone))), /* @__PURE__ */ React.createElement(View, { style: styles.infoGrid }, /* @__PURE__ */ React.createElement(View, { style: styles.infoBlock }, /* @__PURE__ */ React.createElement(Text, { style: styles.label }, "Prepared For"), /* @__PURE__ */ React.createElement(Text, { numberOfLines: 1, style: styles.clientName }, client?.name || "Client"), client?.companyName && /* @__PURE__ */ React.createElement(Text, { style: styles.small }, client.companyName), client?.email && /* @__PURE__ */ React.createElement(Text, { style: styles.small }, client.email), client?.phone && /* @__PURE__ */ React.createElement(Text, { style: styles.small }, client.phone)), /* @__PURE__ */ React.createElement(View, { style: styles.infoBlock }, /* @__PURE__ */ React.createElement(Text, { style: styles.label }, "Document Date"), /* @__PURE__ */ React.createElement(Text, { style: styles.small }, date(invoice.issueDate)), /* @__PURE__ */ React.createElement(Text, { style: [styles.label, { marginTop: 9 }] }, isQuotation ? "Valid Until" : "Due Date"), /* @__PURE__ */ React.createElement(Text, { style: styles.small }, date(invoice.dueDate))), /* @__PURE__ */ React.createElement(View, { style: [styles.infoBlock, styles.infoLast] }, /* @__PURE__ */ React.createElement(Text, { style: styles.label }, "Reference"), /* @__PURE__ */ React.createElement(Text, { style: styles.small }, isQuotation ? "Quotation" : "Invoice", " #", invoice.invoiceNumber || invoice.quotationNumber || "Draft"), /* @__PURE__ */ React.createElement(Text, { style: [styles.label, { marginTop: 9 }] }, "Currency"), /* @__PURE__ */ React.createElement(Text, { style: styles.small }, currency))), /* @__PURE__ */ React.createElement(View, { style: styles.table }, /* @__PURE__ */ React.createElement(View, { style: styles.head }, /* @__PURE__ */ React.createElement(Text, { style: [styles.headCell, styles.number] }, "#"), /* @__PURE__ */ React.createElement(Text, { style: [styles.headCell, styles.desc] }, "Description"), /* @__PURE__ */ React.createElement(Text, { style: [styles.headCell, styles.qty] }, "Qty"), /* @__PURE__ */ React.createElement(Text, { style: [styles.headCell, styles.price] }, "Unit Price"), /* @__PURE__ */ React.createElement(Text, { style: [styles.headCell, styles.total] }, "Amount")), (invoice.items || []).map((item, index) => /* @__PURE__ */ React.createElement(View, { style: styles.row, key: index }, /* @__PURE__ */ React.createElement(Text, { style: [styles.cell, styles.number] }, index + 1), /* @__PURE__ */ React.createElement(View, { style: styles.desc }, /* @__PURE__ */ React.createElement(Text, { style: [styles.cell, { fontFamily: "Helvetica-Bold" }] }, item.name || "Item"), item.description && /* @__PURE__ */ React.createElement(Text, { style: [styles.small, { marginTop: 2 }] }, item.description)), /* @__PURE__ */ React.createElement(Text, { style: [styles.cell, styles.qty] }, item.itemType === "Service" ? "-" : item.quantity), /* @__PURE__ */ React.createElement(Text, { style: [styles.cell, styles.price] }, fmt(item.price)), /* @__PURE__ */ React.createElement(Text, { style: [styles.cell, styles.total] }, fmt(item.total))))), /* @__PURE__ */ React.createElement(View, { style: styles.lower }, /* @__PURE__ */ React.createElement(View, { style: styles.notes }, /* @__PURE__ */ React.createElement(Text, { style: styles.label }, "Notes & Terms"), /* @__PURE__ */ React.createElement(Text, { style: styles.small }, invoice.notes || "Thank you for your business."), invoice.termsAndConditions && /* @__PURE__ */ React.createElement(Text, { style: [styles.small, { marginTop: 8 }] }, invoice.termsAndConditions), isQuotation && invoice.paymentInfo && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Text, { style: [styles.label, { marginTop: 12 }] }, "Payment Details"), /* @__PURE__ */ React.createElement(Text, { style: styles.small }, invoice.paymentInfo))), /* @__PURE__ */ React.createElement(View, { style: styles.totals }, /* @__PURE__ */ React.createElement(View, { style: styles.totalLine }, /* @__PURE__ */ React.createElement(Text, { style: styles.small }, "Subtotal"), /* @__PURE__ */ React.createElement(Text, { style: styles.small }, currency, " ", fmt(invoice.subtotal))), invoice.discountAmount > 0 && /* @__PURE__ */ React.createElement(View, { style: styles.totalLine }, /* @__PURE__ */ React.createElement(Text, { style: styles.small }, "Discount"), /* @__PURE__ */ React.createElement(Text, { style: styles.small }, "- ", fmt(invoice.discountAmount))), invoice.taxTotal > 0 && /* @__PURE__ */ React.createElement(View, { style: styles.totalLine }, /* @__PURE__ */ React.createElement(Text, { style: styles.small }, "Tax"), /* @__PURE__ */ React.createElement(Text, { style: styles.small }, fmt(invoice.taxTotal))), /* @__PURE__ */ React.createElement(View, { style: [styles.totalLine, styles.grand] }, /* @__PURE__ */ React.createElement(Text, null, "Total"), /* @__PURE__ */ React.createElement(Text, null, currency, " ", fmt(invoice.total))))), /* @__PURE__ */ React.createElement(View, { style: { marginTop: 10, paddingHorizontal: 36, flexDirection: "row", justifyContent: "flex-end", alignItems: "flex-end" }, wrap: false }, biz?.businessSeal && /* @__PURE__ */ React.createElement(Image, { src: biz.businessSeal, style: { height: 50, width: 50, objectFit: "contain", marginRight: 12 } }), /* @__PURE__ */ React.createElement(SignatoryDetails, { biz, color: accent })), /* @__PURE__ */ React.createElement(View, { style: styles.footer, fixed: true }, /* @__PURE__ */ React.createElement(Text, { style: styles.small }, "Powered by GoodSynk", /* @__PURE__ */ React.createElement(Text, { style: { fontSize: 7, fontFamily: "Helvetica" } }, "\u2122"), " | invoice.goodsynk.com"))));
}
