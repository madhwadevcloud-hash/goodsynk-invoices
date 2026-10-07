import SignatoryDetails from "./SignatoryDetails";
import React from "react";
import { Document, Page, Text, View, Image, StyleSheet, Font } from "@react-pdf/renderer";
import { isRasterImage } from "./watermarkUtils";
import { getAddressStreet, getAddressCityLine } from "./addressUtils";
import { safeHyphenation } from "./layoutUtils";
const themes = {
  invoice12: { ink: "#123B5D", accent: "#D9A441", soft: "#F2F5F7", mode: "ledger", title: "INVOICE" },
  invoice13: { ink: "#243B53", accent: "#E07A5F", soft: "#FFF4F0", mode: "band", title: "INVOICE" },
  invoice14: { ink: "#174A3A", accent: "#B7D7C5", soft: "#F1F8F4", mode: "columns", title: "INVOICE" },
  invoice15: { ink: "#202124", accent: "#F4B942", soft: "#FFF9E8", mode: "receipt", title: "INVOICE" },
  // Quotation themes mirror their invoice counterpart exactly (same ink/accent/soft/mode)
  // so the two documents are visually identical apart from the heading and doc-specific copy.
  quotation12: { ink: "#123B5D", accent: "#D9A441", soft: "#F2F5F7", mode: "ledger", title: "QUOTATION" },
  quotation13: { ink: "#243B53", accent: "#E07A5F", soft: "#FFF4F0", mode: "band", title: "QUOTATION" },
  quotation14: { ink: "#174A3A", accent: "#B7D7C5", soft: "#F1F8F4", mode: "columns", title: "QUOTATION" },
  quotation15: { ink: "#202124", accent: "#F4B942", soft: "#FFF9E8", mode: "receipt", title: "QUOTATION" }
};
const money = (value, currency) => `${currency === "INR" ? "Rs. " : `${currency} `}${Number(value || 0).toFixed(2)}`;
const date = (value) => value ? new Date(value).toLocaleDateString("en-GB") : "-";
const hexToRgba = (hex, alpha) => {
  if (!hex) return "rgba(0, 0, 0, " + alpha + ")";
  let clean = hex.replace("#", "");
  if (clean.length === 3) clean = clean.split("").map((c) => c + c).join("");
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
};
export default function DocumentTemplate({ invoice, variant }) {
  Font.registerHyphenationCallback(safeHyphenation);
  const theme = themes[variant] || themes.invoice12;
  const biz = invoice.user || {};
  const client = invoice.client || {};
  const currency = invoice.currency || "INR";
  const number = invoice.invoiceNumber || invoice.quotationNumber || "-";
  const items = invoice.items || [];
  const clientAddress = [getAddressStreet(client.address), getAddressCityLine(client.address)].filter(Boolean).join("\n");
  const isQuotation = theme.title === "QUOTATION";
  const styles = StyleSheet.create({
    page: { padding: 34, fontSize: 9, color: "#27313B", fontFamily: "Helvetica", backgroundColor: "#FFFFFF" },
    top: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: 18, borderBottomWidth: theme.mode === "band" ? 0 : 1, borderBottomColor: theme.accent },
    // flex:1 + minWidth:0: a long business name wraps in its own column instead of running under the INVOICE title
    brand: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1, minWidth: 0, paddingRight: 16 },
    titleBlock: { flexShrink: 0, maxWidth: 210, alignItems: "flex-end" },
    logo: { width: 36, height: 36, objectFit: "contain", flexShrink: 0 },
    logoFallback: { width: 36, height: 36, backgroundColor: theme.ink, color: "#FFFFFF", textAlign: "center", paddingTop: 12, fontSize: 10, fontFamily: "Helvetica-Bold" },
    bizName: { color: theme.ink, fontSize: 14, fontFamily: "Helvetica-Bold" },
    muted: { color: "#66717D", marginTop: 3, lineHeight: 1.35 },
    title: { color: theme.ink, fontSize: 25, fontFamily: "Helvetica-Bold", letterSpacing: 1 },
    meta: { textAlign: "right", color: "#66717D", lineHeight: 1.45, maxWidth: 210 },
    metaStrong: { color: theme.ink, fontFamily: "Helvetica-Bold" },
    intro: { backgroundColor: theme.soft, padding: 14, marginTop: 16, borderLeftWidth: 5, borderLeftColor: theme.accent, flexDirection: "row", justifyContent: "space-between" },
    sectionLabel: { color: theme.ink, fontSize: 8, fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 1, marginBottom: 5 },
    address: { color: "#3F4B57", lineHeight: 1.35, maxWidth: 220 },
    table: { marginTop: 20 },
    head: { flexDirection: "row", backgroundColor: theme.ink, color: "#FFFFFF", padding: 8, fontFamily: "Helvetica-Bold" },
    row: { flexDirection: "row", padding: 8, borderBottomWidth: 1, borderBottomColor: "#E8EBEE", minHeight: 28 },
    alt: { backgroundColor: theme.soft },
    desc: { width: "40%" },
    qty: { width: "10%", textAlign: "right" },
    price: { width: "17%", textAlign: "right" },
    tax: { width: "15%", textAlign: "right" },
    total: { width: "18%", textAlign: "right" },
    itemName: { fontFamily: "Helvetica-Bold", color: theme.ink },
    itemSub: { color: "#74808B", fontSize: 7, marginTop: 2 },
    lower: { flexDirection: "row", justifyContent: "space-between", marginTop: 20, gap: 24 },
    notes: { width: "52%", color: "#53606C", lineHeight: 1.4 },
    totals: { width: "38%", borderTopWidth: 2, borderTopColor: theme.ink, paddingTop: 8 },
    totalLine: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
    grand: { flexDirection: "row", justifyContent: "space-between", backgroundColor: theme.accent, color: theme.ink, padding: 9, marginTop: 6, fontFamily: "Helvetica-Bold", fontSize: 11 },
    footer: { marginTop: 28, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#E8EBEE", flexDirection: "row", justifyContent: "space-between" },
    signature: { textAlign: "right", color: "#66717D" },
    signatureImage: { height: 28, width: 90, objectFit: "contain", marginBottom: 3 },
    band: { backgroundColor: theme.ink, color: "#FFFFFF", marginHorizontal: -34, padding: "18px 34px", flexDirection: "row", justifyContent: "space-between" },
    callout: { marginTop: 18, padding: 14, borderWidth: 1, borderColor: theme.accent, backgroundColor: theme.soft },
    watermarkContainer: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: -100 },
    watermarkImg: { width: 250, height: 250, objectFit: "contain", opacity: 0.12 },
    watermarkText: { fontSize: 60, fontFamily: "Helvetica-Bold", color: hexToRgba(theme.ink, 0.08), transform: "rotate(-45deg)", letterSpacing: 5 }
  });
  return /* @__PURE__ */ React.createElement(Document, null, /* @__PURE__ */ React.createElement(Page, { size: "A4", style: styles.page }, !biz?.plan || String(biz.plan).toLowerCase() === "free" ? /* @__PURE__ */ React.createElement(View, { style: styles.watermarkContainer, pointerEvents: "none", fixed: true }, /* @__PURE__ */ React.createElement(Text, { style: styles.watermarkText }, "GoodSynk")) : isRasterImage(invoice.watermarkImage || biz.watermarkImage) ? /* @__PURE__ */ React.createElement(View, { style: styles.watermarkContainer, pointerEvents: "none", fixed: true }, /* @__PURE__ */ React.createElement(Image, { src: invoice.watermarkImage || biz.watermarkImage, style: styles.watermarkImg })) : null, theme.mode === "band" ? /* @__PURE__ */ React.createElement(View, { style: styles.band }, /* @__PURE__ */ React.createElement(View, { style: styles.brand }, biz.businessLogo ? /* @__PURE__ */ React.createElement(Image, { src: biz.businessLogo, style: styles.logo }) : /* @__PURE__ */ React.createElement(Text, { style: styles.logoFallback }, "G"), /* @__PURE__ */ React.createElement(View, { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement(Text, { numberOfLines: 1, style: { ...styles.bizName, color: "#FFFFFF" } }, biz.businessName || biz.name || "Your Business"), /* @__PURE__ */ React.createElement(Text, { style: { color: "#DCE5ED", marginTop: 3 } }, "Tax invoice and payment record"))), /* @__PURE__ */ React.createElement(View, { style: styles.titleBlock }, /* @__PURE__ */ React.createElement(Text, { style: { ...styles.title, color: "#FFFFFF" } }, theme.title), /* @__PURE__ */ React.createElement(Text, { style: { color: "#DCE5ED", textAlign: "right", marginTop: 4, maxWidth: 210 } }, "#", number))) : /* @__PURE__ */ React.createElement(View, { style: styles.top }, /* @__PURE__ */ React.createElement(View, { style: styles.brand }, biz.businessLogo ? /* @__PURE__ */ React.createElement(Image, { src: biz.businessLogo, style: styles.logo }) : /* @__PURE__ */ React.createElement(Text, { style: styles.logoFallback }, "G"), /* @__PURE__ */ React.createElement(View, { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement(Text, { numberOfLines: 1, style: styles.bizName }, biz.businessName || biz.name || "Your Business"), /* @__PURE__ */ React.createElement(Text, { style: styles.muted }, biz.email || ""))), /* @__PURE__ */ React.createElement(View, { style: styles.titleBlock }, /* @__PURE__ */ React.createElement(Text, { style: styles.title }, theme.title), /* @__PURE__ */ React.createElement(Text, { style: styles.meta }, "#", number, "\n", "Issued ", date(invoice.issueDate), "\n", isQuotation ? `Valid until ${date(invoice.validUntil)}` : `Due ${date(invoice.dueDate)}`))), isQuotation && /* @__PURE__ */ React.createElement(View, { style: styles.callout }, /* @__PURE__ */ React.createElement(Text, { style: styles.sectionLabel }, "Project proposal"), /* @__PURE__ */ React.createElement(Text, { style: { color: theme.ink, fontFamily: "Helvetica-Bold" } }, "Thank you for the opportunity to work together."), /* @__PURE__ */ React.createElement(Text, { style: styles.muted }, "This quotation outlines the requested products and services, pricing, and terms.")), /* @__PURE__ */ React.createElement(View, { style: styles.intro }, /* @__PURE__ */ React.createElement(View, null, /* @__PURE__ */ React.createElement(Text, { style: styles.sectionLabel }, isQuotation ? "Prepared for" : "Bill to"), /* @__PURE__ */ React.createElement(Text, { style: { ...styles.address, fontFamily: "Helvetica-Bold", color: theme.ink } }, client.name || "Client"), /* @__PURE__ */ React.createElement(Text, { style: styles.address }, client.email || "", client.phone ? `
${client.phone}` : "", clientAddress ? `
${clientAddress}` : "")), /* @__PURE__ */ React.createElement(View, null, /* @__PURE__ */ React.createElement(Text, { style: styles.sectionLabel }, "Business details"), /* @__PURE__ */ React.createElement(Text, { style: styles.address }, biz.phone || "", biz.gstin ? `
GSTIN: ${biz.gstin}` : "", biz.address?.city ? `
${biz.address.city}, ${biz.address.state || ""}` : ""))), /* @__PURE__ */ React.createElement(View, { style: styles.table }, /* @__PURE__ */ React.createElement(View, { style: styles.head }, /* @__PURE__ */ React.createElement(Text, { style: styles.desc }, "Description"), /* @__PURE__ */ React.createElement(Text, { style: styles.qty }, "Qty"), /* @__PURE__ */ React.createElement(Text, { style: styles.price }, "Rate"), /* @__PURE__ */ React.createElement(Text, { style: styles.tax }, "Tax"), /* @__PURE__ */ React.createElement(Text, { style: styles.total }, "Amount")), items.map((item, index) => /* @__PURE__ */ React.createElement(View, { key: index, style: [styles.row, index % 2 ? styles.alt : {}] }, /* @__PURE__ */ React.createElement(View, { style: styles.desc }, /* @__PURE__ */ React.createElement(Text, { style: styles.itemName }, item.name || "Item"), /* @__PURE__ */ React.createElement(Text, { style: styles.itemSub }, item.description || "", item.hsn ? ` | HSN ${item.hsn}` : "")), /* @__PURE__ */ React.createElement(Text, { style: styles.qty }, item.quantity || 0, " ", item.unit || ""), /* @__PURE__ */ React.createElement(Text, { style: styles.price }, money(item.price, currency)), /* @__PURE__ */ React.createElement(Text, { style: styles.tax }, Number(item.cgstRate || 0) + Number(item.sgstRate || 0) + Number(item.igstRate || 0) + Number(item.vatRate || 0), "%"), /* @__PURE__ */ React.createElement(Text, { style: styles.total }, money(item.total ?? (item.price || 0) * (item.quantity || 0), currency))))), /* @__PURE__ */ React.createElement(View, { style: styles.lower }, /* @__PURE__ */ React.createElement(View, { style: styles.notes }, /* @__PURE__ */ React.createElement(Text, { style: styles.sectionLabel }, isQuotation ? "Scope and terms" : "Notes and payment details"), /* @__PURE__ */ React.createElement(Text, null, invoice.notes || "Thank you for your business."), /* @__PURE__ */ React.createElement(Text, { style: { marginTop: 8 } }, invoice.termsAndConditions || ""), biz.bankDetails?.bankName && /* @__PURE__ */ React.createElement(Text, { style: { marginTop: 8 } }, "Bank: ", biz.bankDetails.bankName, biz.bankDetails.accountNumber ? ` | A/C ${biz.bankDetails.accountNumber}` : "", biz.bankDetails.ifscCode ? ` | IFSC ${biz.bankDetails.ifscCode}` : "", biz.bankDetails.branch ? ` | Branch ${biz.bankDetails.branch}` : "")), /* @__PURE__ */ React.createElement(View, { style: styles.totals }, /* @__PURE__ */ React.createElement(View, { style: styles.totalLine }, /* @__PURE__ */ React.createElement(Text, null, "Subtotal"), /* @__PURE__ */ React.createElement(Text, null, money(invoice.subtotal, currency))), /* @__PURE__ */ React.createElement(View, { style: styles.totalLine }, /* @__PURE__ */ React.createElement(Text, null, "Discount"), /* @__PURE__ */ React.createElement(Text, null, "- ", money(invoice.discountAmount, currency))), /* @__PURE__ */ React.createElement(View, { style: styles.totalLine }, /* @__PURE__ */ React.createElement(Text, null, "Tax"), /* @__PURE__ */ React.createElement(Text, null, money(invoice.taxTotal, currency))), /* @__PURE__ */ React.createElement(View, { style: styles.grand }, /* @__PURE__ */ React.createElement(Text, null, isQuotation ? "Estimated total" : "Amount due"), /* @__PURE__ */ React.createElement(Text, null, money(invoice.total, currency))))), /* @__PURE__ */ React.createElement(View, { style: { marginTop: 10, paddingHorizontal: 34, flexDirection: "row", justifyContent: "flex-end", alignItems: "flex-end" }, wrap: false }, biz.businessSeal && /* @__PURE__ */ React.createElement(Image, { src: biz.businessSeal, style: { height: 50, width: 50, objectFit: "contain", marginRight: 12 } }), /* @__PURE__ */ React.createElement(SignatoryDetails, { biz, color: theme.primary })), /* @__PURE__ */ React.createElement(View, { style: styles.footer, fixed: true }, /* @__PURE__ */ React.createElement(Text, { style: styles.muted }, "Powered by GoodSynk", /* @__PURE__ */ React.createElement(Text, { style: { fontSize: 7, fontFamily: "Helvetica" } }, "\u2122"), " | ", biz.email || "invoice.goodsynk.com")), /* @__PURE__ */ React.createElement(
    Text,
    {
      style: { position: "absolute", bottom: 12, right: 34, fontSize: 7.5, color: "#333333" },
      render: ({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`,
      fixed: true
    }
  )));
}
