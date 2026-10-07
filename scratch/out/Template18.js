import React from "react";
import { Document, Page, Text, View, StyleSheet, Font, Image } from "@react-pdf/renderer";
import { buildScaledStyles } from "./Pdfheaderscaling";
import { getAddressStreet, getAddressCityLine, getFullAddress } from "./addressUtils";
import { safeHyphenation } from "./layoutUtils";
Font.register({ family: "Inter", src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYMZhrib2Bg-4.ttf" });
Font.register({ family: "Inter-Bold", src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYMZhrib2Bg-4.ttf" });
Font.registerHyphenationCallback(safeHyphenation);
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
const MAX_INLINE_IMAGE_LENGTH = 2e6;
const isRasterImage = (url) => typeof url === "string" && url.trim().length > 0 && url.trim().length <= MAX_INLINE_IMAGE_LENGTH && !url.trim().startsWith("data:image/svg") && !url.includes("OFFICIAL WATERMARK");
function normalizeTerms(terms) {
  if (!terms) return [];
  let list = [];
  if (Array.isArray(terms)) {
    list = terms.map((t) => {
      if (typeof t === "string") return t.trim();
      if (t && typeof t === "object") {
        return String(t.text || t.term || t.value || t.description || "").trim();
      }
      return "";
    });
  } else if (typeof terms === "string") {
    list = terms.split(/\r?\n/).map((t) => t.trim());
  }
  return list.filter(Boolean).map((t) => t.replace(/^\s*(?:\d+[\.\)]|[-•*])\s*/, "").trim()).filter(Boolean);
}
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
export default function Template18({ invoice }) {
  Font.registerHyphenationCallback(safeHyphenation);
  const inv = invoice || {};
  const client = inv.client || {};
  const biz = inv.user || inv.biz || {};
  const colors = inv.templateColors || { primary: "#FFE500", secondary: "#2874F0" };
  const PRIMARY = colors.primary || "#FFE500";
  const scaled = buildScaledStyles(biz);
  const isQuotation = inv.invoiceType === "quotation" || inv.documentType === "quotation";
  const docTitle = isQuotation ? "QUOTATION" : "TAX INVOICE";
  const docNumber = isQuotation ? inv.quotationNumber || inv.invoiceNumber || "QT-1" : inv.invoiceNumber || "INV-1";
  const currency = inv._currency || inv.currency || "INR";
  const currSymbol = currency === "INR" ? "\u20B9" : `${currency} `;
  const fmt = (n) => new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);
  const bizName = biz?.businessName || biz?.name || "Company Name";
  const totalInWords = numberToWords(Math.floor(inv.total || 0));
  const totalQty = inv.items?.reduce((acc, i) => acc + (Number(i.quantity) || 0), 0) || 0;
  const paidAmount = inv.paidAmount || 0;
  const balanceDue = Math.max((inv.total || 0) - paidAmount, 0);
  const isFullyPaid = !isQuotation && paidAmount > 0 && balanceDue <= 0.01;
  const termsList = normalizeTerms(
    inv.termsAndConditions || inv.terms || inv.termsList || biz?.termsAndConditions || biz?.terms || biz?.termsList
  );
  const s = StyleSheet.create({
    page: { paddingTop: 25, paddingBottom: 50, paddingHorizontal: 30, fontFamily: "Inter", color: "#111827", fontSize: 8 },
    watermarkContainer: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center", zIndex: -100 },
    watermarkText: { fontSize: 60, fontFamily: B, color: hexToRgba("#111827", 0.06), transform: "rotate(-45deg)", letterSpacing: 5 },
    watermarkImg: { width: 250, height: 250, objectFit: "contain", opacity: 0.12 },
    topHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 15 },
    // flex:1 + minWidth:0 lets a long business name wrap inside its own column instead of running under the title
    brandBlock: { flexDirection: "row", alignItems: "center", flex: 1, minWidth: 0, paddingRight: 14 },
    logoImg: { width: 44, height: 44, objectFit: "contain", marginRight: 10, flexShrink: 0 },
    bizTitle: { fontFamily: B, fontSize: scaled.bizNameFontSize || 14, color: "#111827" },
    bizSub: { fontSize: 7, color: "#4B5563", lineHeight: 1.3 },
    docMetaBlock: { alignItems: "flex-end", flexShrink: 0, maxWidth: "38%" },
    docTypeTitle: { fontFamily: B, fontSize: 13, color: "#111827", textTransform: "uppercase" },
    docCopyTag: { fontSize: 6.5, fontFamily: B, color: "#4B5563", marginBottom: 4 },
    metaRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 1, maxWidth: "100%" },
    metaKey: { fontSize: 7, color: "#4B5563", marginRight: 4, flexShrink: 0 },
    metaVal: { fontSize: 7, fontFamily: B, color: "#111827", flexShrink: 1, textAlign: "right" },
    addressGrid: { marginTop: 8, marginBottom: 10 },
    addressRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
    addressCol: { width: "48%" },
    addrLabel: { fontSize: 7.5, fontFamily: B, color: "#111827", marginBottom: 2 },
    addrName: { fontSize: 8, fontFamily: B, color: "#1F2937" },
    addrText: { fontSize: 7, color: "#4B5563", lineHeight: 1.3 },
    placeSupply: { fontSize: 7.5, fontFamily: B, color: "#111827", marginTop: 2, marginBottom: 10 },
    table: { borderWidth: 0.75, borderColor: "#9CA3AF", marginBottom: 10 },
    tHead: { flexDirection: "row", borderBottomWidth: 0.75, borderBottomColor: "#9CA3AF", backgroundColor: "#F9FAFB", paddingVertical: 4 },
    th: { fontSize: 7, fontFamily: B, color: "#111827", textAlign: "center" },
    colNo: { width: "5%", borderRightWidth: 0.75, borderRightColor: "#9CA3AF" },
    colItem: { width: "33%", textAlign: "left", paddingLeft: 4, paddingRight: 4, borderRightWidth: 0.75, borderRightColor: "#9CA3AF" },
    colHsn: { width: "12%", borderRightWidth: 0.75, borderRightColor: "#9CA3AF" },
    colRate: { width: "12%", textAlign: "right", paddingRight: 4, borderRightWidth: 0.75, borderRightColor: "#9CA3AF" },
    colQty: { width: "7%", borderRightWidth: 0.75, borderRightColor: "#9CA3AF" },
    colTaxable: { width: "12%", textAlign: "right", paddingRight: 4, borderRightWidth: 0.75, borderRightColor: "#9CA3AF" },
    colTax: { width: "9%", textAlign: "right", paddingRight: 4, borderRightWidth: 0.75, borderRightColor: "#9CA3AF" },
    colAmount: { width: "10%", textAlign: "right", paddingRight: 4 },
    tRow: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#E5E7EB", paddingVertical: 4, minHeight: 18 },
    td: { fontSize: 7, color: "#1F2937", textAlign: "center" },
    tdItemName: { fontFamily: B, color: "#111827" },
    tdItemDesc: { fontSize: 6.5, color: "#6B7280" },
    summaryGrid: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
    bankCol: { width: "38%" },
    bankTitle: { fontSize: 7.5, fontFamily: B, color: "#111827", marginBottom: 4 },
    bankRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 1.5 },
    bankKey: { fontSize: 7, color: "#4B5563", width: 55, flexShrink: 0 },
    bankVal: { fontSize: 7, fontFamily: B, color: "#111827", flex: 1, minWidth: 0 },
    qrCol: { width: "22%", alignItems: "center" },
    qrTitle: { fontSize: 7, fontFamily: B, color: "#111827", marginBottom: 3 },
    qrBox: { width: 44, height: 44, borderWidth: 0.5, borderColor: "#9CA3AF", backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" },
    totalsCol: { width: "36%", alignItems: "flex-end" },
    totRow: { flexDirection: "row", justifyContent: "space-between", width: "100%", marginBottom: 3 },
    totKey: { fontSize: 7.5, color: "#374151" },
    totVal: { fontSize: 7.5, fontFamily: B, color: "#111827" },
    grandBox: { flexDirection: "row", justifyContent: "space-between", width: "100%", borderWidth: 1, borderColor: "#111827", padding: 4, marginTop: 4 },
    grandKey: { fontSize: 8.5, fontFamily: B, color: "#111827" },
    grandVal: { fontSize: 8.5, fontFamily: B, color: "#111827" },
    paidBadge: { marginTop: 4, flexDirection: "row", alignItems: "center", backgroundColor: "#DCFCE7", paddingVertical: 2, paddingHorizontal: 6, borderRadius: 3 },
    paidDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: "#22C55E", marginRight: 3 },
    paidText: { fontSize: 6.5, fontFamily: B, color: "#15803D" },
    infoStrip: { marginTop: 10, paddingTop: 6, borderTopWidth: 0.5, borderTopColor: "#E5E7EB" },
    infoText: { fontSize: 7, color: "#374151", marginBottom: 2 },
    notesTermsRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
    notesCol: { width: "60%" },
    sectionTitle: { fontSize: 7.5, fontFamily: B, color: "#111827", marginBottom: 2 },
    termItem: { fontSize: 6.5, color: "#4B5563", lineHeight: 1.3 },
    sigCol: { width: "35%", alignItems: "flex-end" },
    sigFor: { fontSize: 7.5, color: "#6B7280", marginBottom: 15 },
    sigImg: { width: 70, height: 25, objectFit: "contain" },
    sealImg: { width: 45, height: 45, objectFit: "contain", marginTop: 4 },
    sigName: { fontSize: 8, fontFamily: B, color: "#111827" },
    pageFooter: { position: "absolute", bottom: 15, left: 30, right: 30, borderTopWidth: 0.5, borderTopColor: "#E5E7EB", paddingTop: 4, flexDirection: "row", justifyContent: "space-between" },
    footerText: { fontSize: 6.5, color: "#9CA3AF" }
  });
  return /* @__PURE__ */ React.createElement(Document, null, /* @__PURE__ */ React.createElement(Page, { size: "A4", style: s.page }, !biz?.plan || String(biz.plan).toLowerCase() === "free" ? /* @__PURE__ */ React.createElement(View, { style: s.watermarkContainer, fixed: true }, /* @__PURE__ */ React.createElement(Text, { style: s.watermarkText }, "GoodSynk")) : isRasterImage(inv.watermarkImage || biz.watermarkImage) ? /* @__PURE__ */ React.createElement(View, { style: s.watermarkContainer, fixed: true }, /* @__PURE__ */ React.createElement(Image, { src: inv.watermarkImage || biz.watermarkImage, style: s.watermarkImg })) : null, /* @__PURE__ */ React.createElement(View, { style: s.topHeader }, /* @__PURE__ */ React.createElement(View, { style: s.brandBlock }, isRasterImage(biz?.businessLogo) ? /* @__PURE__ */ React.createElement(Image, { src: biz.businessLogo, style: s.logoImg }) : null, /* @__PURE__ */ React.createElement(View, { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement(Text, { style: s.bizTitle }, bizName), biz?.gstin ? /* @__PURE__ */ React.createElement(Text, { style: s.bizSub }, "GSTIN: ", biz.gstin) : null, biz?.phone ? /* @__PURE__ */ React.createElement(Text, { style: s.bizSub }, "Mobile: ", biz.phone) : null, biz?.email ? /* @__PURE__ */ React.createElement(Text, { style: s.bizSub }, "Email: ", biz.email) : null, biz?.website ? /* @__PURE__ */ React.createElement(Text, { style: s.bizSub }, "Website: ", biz.website) : null)), /* @__PURE__ */ React.createElement(View, { style: s.docMetaBlock }, /* @__PURE__ */ React.createElement(Text, { style: s.docTypeTitle }, docTitle), /* @__PURE__ */ React.createElement(Text, { style: s.docCopyTag }, "ORIGINAL FOR RECIPIENT"), /* @__PURE__ */ React.createElement(View, { style: s.metaRow }, /* @__PURE__ */ React.createElement(Text, { style: s.metaKey }, isQuotation ? "Quotation #:" : "Invoice #:"), /* @__PURE__ */ React.createElement(Text, { style: s.metaVal }, docNumber)), /* @__PURE__ */ React.createElement(View, { style: s.metaRow }, /* @__PURE__ */ React.createElement(Text, { style: s.metaKey }, "Date:"), /* @__PURE__ */ React.createElement(Text, { style: s.metaVal }, inv.invoiceDate || inv.date || "13 Jul 2023")), inv.dueDate ? /* @__PURE__ */ React.createElement(View, { style: s.metaRow }, /* @__PURE__ */ React.createElement(Text, { style: s.metaKey }, "Due Date:"), /* @__PURE__ */ React.createElement(Text, { style: s.metaVal }, inv.dueDate)) : null)), /* @__PURE__ */ React.createElement(View, { style: s.addressGrid }, /* @__PURE__ */ React.createElement(View, { style: s.addressRow }, /* @__PURE__ */ React.createElement(View, { style: s.addressCol }, /* @__PURE__ */ React.createElement(Text, { style: s.addrLabel }, "Bill From:"), /* @__PURE__ */ React.createElement(Text, { style: s.addrName }, bizName), /* @__PURE__ */ React.createElement(Text, { style: s.addrText }, getAddressStreet(biz?.address)), /* @__PURE__ */ React.createElement(Text, { style: s.addrText }, getAddressCityLine(biz?.address))), /* @__PURE__ */ React.createElement(View, { style: s.addressCol }, /* @__PURE__ */ React.createElement(Text, { style: s.addrLabel }, "Bill To:"), /* @__PURE__ */ React.createElement(Text, { style: s.addrName }, client?.name || client?.clientName || "Client Name"), /* @__PURE__ */ React.createElement(Text, { style: s.addrText }, getAddressStreet(client?.address)), /* @__PURE__ */ React.createElement(Text, { style: s.addrText }, getAddressCityLine(client?.address)), client?.gstin ? /* @__PURE__ */ React.createElement(Text, { style: s.addrText }, "GSTIN: ", client.gstin) : null)), /* @__PURE__ */ React.createElement(View, { style: s.addressRow }, /* @__PURE__ */ React.createElement(View, { style: s.addressCol }, /* @__PURE__ */ React.createElement(Text, { style: s.addrLabel }, "Ship From:"), /* @__PURE__ */ React.createElement(Text, { style: s.addrText }, biz?.shipAddress || getFullAddress(biz?.address) || "Same as billing address")), /* @__PURE__ */ React.createElement(View, { style: s.addressCol }, /* @__PURE__ */ React.createElement(Text, { style: s.addrLabel }, "Ship To:"), /* @__PURE__ */ React.createElement(Text, { style: s.addrText }, client?.shipAddress || getFullAddress(client?.address) || "Same as billing address"), client?.phone ? /* @__PURE__ */ React.createElement(Text, { style: s.addrText }, "Ph: ", client.phone) : null))), inv.placeOfSupply || client?.address?.state ? /* @__PURE__ */ React.createElement(Text, { style: s.placeSupply }, "Place of Supply: ", inv.placeOfSupply || client?.address?.state) : null, /* @__PURE__ */ React.createElement(View, { style: s.table }, /* @__PURE__ */ React.createElement(View, { style: s.tHead }, /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colNo] }, "#"), /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colItem] }, "Item"), /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colHsn] }, "HSN/SAC"), /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colRate] }, "Listed Rate"), /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colQty] }, "Qty"), /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colTaxable] }, "Taxable Value"), /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colTax] }, "Tax Amount"), /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colAmount] }, "Amount")), inv.items?.map((item, idx) => {
    const qty = Number(item.quantity) || 1;
    const rate = Number(item.rate || item.price) || 0;
    const taxPct = Number(item.tax) || 0;
    const taxable = qty * rate;
    const taxAmt = taxable * taxPct / 100;
    const total = taxable + taxAmt;
    return /* @__PURE__ */ React.createElement(View, { key: idx, style: s.tRow }, /* @__PURE__ */ React.createElement(Text, { style: [s.td, s.colNo] }, idx + 1), /* @__PURE__ */ React.createElement(View, { style: s.colItem }, /* @__PURE__ */ React.createElement(Text, { style: s.tdItemName }, item.name || item.description), item.description && item.name ? /* @__PURE__ */ React.createElement(Text, { style: s.tdItemDesc }, item.description) : null), /* @__PURE__ */ React.createElement(Text, { style: [s.td, s.colHsn] }, item.hsn || "-"), /* @__PURE__ */ React.createElement(Text, { style: [s.td, s.colRate] }, fmt(rate)), /* @__PURE__ */ React.createElement(Text, { style: [s.td, s.colQty] }, qty), /* @__PURE__ */ React.createElement(Text, { style: [s.td, s.colTaxable] }, fmt(taxable)), /* @__PURE__ */ React.createElement(Text, { style: [s.td, s.colTax] }, fmt(taxAmt), " (", taxPct, "%)"), /* @__PURE__ */ React.createElement(Text, { style: [s.td, s.colAmount] }, fmt(total)));
  })), /* @__PURE__ */ React.createElement(View, { style: s.summaryGrid }, /* @__PURE__ */ React.createElement(View, { style: s.bankCol }, /* @__PURE__ */ React.createElement(Text, { style: s.bankTitle }, "Bank Details:"), biz?.bankDetails?.bankName ? /* @__PURE__ */ React.createElement(View, { style: s.bankRow }, /* @__PURE__ */ React.createElement(Text, { style: s.bankKey }, "Bank:"), /* @__PURE__ */ React.createElement(Text, { style: s.bankVal }, biz.bankDetails.bankName)) : null, biz?.bankDetails?.accountNumber ? /* @__PURE__ */ React.createElement(View, { style: s.bankRow }, /* @__PURE__ */ React.createElement(Text, { style: s.bankKey }, "Account #:"), /* @__PURE__ */ React.createElement(Text, { style: s.bankVal }, biz.bankDetails.accountNumber)) : null, biz?.bankDetails?.ifscCode ? /* @__PURE__ */ React.createElement(View, { style: s.bankRow }, /* @__PURE__ */ React.createElement(Text, { style: s.bankKey }, "IFSC:"), /* @__PURE__ */ React.createElement(Text, { style: s.bankVal }, biz.bankDetails.ifscCode)) : null, biz?.bankDetails?.branch ? /* @__PURE__ */ React.createElement(View, { style: s.bankRow }, /* @__PURE__ */ React.createElement(Text, { style: s.bankKey }, "Branch:"), /* @__PURE__ */ React.createElement(Text, { style: s.bankVal }, biz.bankDetails.branch)) : null), /* @__PURE__ */ React.createElement(View, { style: s.qrCol }, /* @__PURE__ */ React.createElement(Text, { style: s.qrTitle }, "Pay using UPI"), /* @__PURE__ */ React.createElement(View, { style: s.qrBox }, /* @__PURE__ */ React.createElement(Text, { style: { fontSize: 6, color: "#9CA3AF" } }, "[QR Code]"))), /* @__PURE__ */ React.createElement(View, { style: s.totalsCol }, /* @__PURE__ */ React.createElement(View, { style: s.totRow }, /* @__PURE__ */ React.createElement(Text, { style: s.totKey }, "Taxable Amount"), /* @__PURE__ */ React.createElement(Text, { style: s.totVal }, currSymbol, fmt(inv.subtotal || inv.total))), inv.taxTotal || inv.tax ? /* @__PURE__ */ React.createElement(View, { style: s.totRow }, /* @__PURE__ */ React.createElement(Text, { style: s.totKey }, "Tax Amount"), /* @__PURE__ */ React.createElement(Text, { style: s.totVal }, currSymbol, fmt(inv.taxTotal || inv.tax))) : null, /* @__PURE__ */ React.createElement(View, { style: s.grandBox }, /* @__PURE__ */ React.createElement(Text, { style: s.grandKey }, "Total"), /* @__PURE__ */ React.createElement(Text, { style: s.grandVal }, currSymbol, fmt(inv.total))), isFullyPaid ? /* @__PURE__ */ React.createElement(View, { style: s.paidBadge }, /* @__PURE__ */ React.createElement(View, { style: s.paidDot }), /* @__PURE__ */ React.createElement(Text, { style: s.paidText }, "Amount Paid")) : null)), /* @__PURE__ */ React.createElement(View, { style: s.infoStrip }, /* @__PURE__ */ React.createElement(Text, { style: s.infoText }, "Total items / Qty : ", inv.items?.length || 0, " / ", totalQty), /* @__PURE__ */ React.createElement(Text, { style: s.infoText }, "Total amount (in words): ", currency, " ", totalInWords, " Only.")), /* @__PURE__ */ React.createElement(View, { style: s.notesTermsRow }, /* @__PURE__ */ React.createElement(View, { style: s.notesCol }, inv.notes ? /* @__PURE__ */ React.createElement(View, { style: { marginBottom: 6 } }, /* @__PURE__ */ React.createElement(Text, { style: s.sectionTitle }, "Notes:"), /* @__PURE__ */ React.createElement(Text, { style: s.termItem }, inv.notes)) : null, termsList.length > 0 ? /* @__PURE__ */ React.createElement(View, null, /* @__PURE__ */ React.createElement(Text, { style: s.sectionTitle }, "Terms and Conditions:"), termsList.map((term, i) => /* @__PURE__ */ React.createElement(Text, { key: i, style: s.termItem }, i + 1, ". ", term))) : null), /* @__PURE__ */ React.createElement(View, { style: s.sigCol }, /* @__PURE__ */ React.createElement(Text, { style: s.sigFor }, "For ", bizName), isRasterImage(biz?.businessSignature) ? /* @__PURE__ */ React.createElement(Image, { src: biz.businessSignature, style: s.sigImg }) : /* @__PURE__ */ React.createElement(View, { style: { height: 25 } }), isRasterImage(biz?.businessSeal) ? /* @__PURE__ */ React.createElement(Image, { src: biz.businessSeal, style: s.sealImg }) : null, /* @__PURE__ */ React.createElement(Text, { style: s.sigName }, biz?.signatoryName || "Authorised Signatory"), biz?.designation && /* @__PURE__ */ React.createElement(Text, { style: { fontSize: 7, textAlign: "right" } }, biz.designation))), /* @__PURE__ */ React.createElement(View, { style: s.pageFooter, fixed: true }, /* @__PURE__ */ React.createElement(Text, { style: s.footerText }, "Page 1/1"), /* @__PURE__ */ React.createElement(Text, { style: s.footerText }, "Powered by GoodSynk", /* @__PURE__ */ React.createElement(Text, { style: { fontSize: 5.5, fontFamily: "Helvetica" } }, "\u2122")), /* @__PURE__ */ React.createElement(Text, { style: s.footerText }, "This is a digitally signed document"))));
}
