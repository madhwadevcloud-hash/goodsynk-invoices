import SignatoryDetails from "./SignatoryDetails";
import React from "react";
import { Document, Page, Text, View, StyleSheet, Font, Image, Link } from "@react-pdf/renderer";
import { buildScaledStyles } from "./Pdfheaderscaling";
import { isRasterImage } from "./watermarkUtils";
import { safeHyphenation } from "./layoutUtils";
Font.register({ family: "Inter", src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYMZhrib2Bg-4.ttf" });
Font.register({ family: "Inter-SemiBold", src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYMZhrib2Bg-4.ttf" });
Font.register({ family: "Inter-Bold", src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYMZhrib2Bg-4.ttf" });
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
function numberToWords(num) {
  if (!num) return "Zero";
  const a = ["", "One ", "Two ", "Three ", "Four ", "Five ", "Six ", "Seven ", "Eight ", "Nine ", "Ten ", "Eleven ", "Twelve ", "Thirteen ", "Fourteen ", "Fifteen ", "Sixteen ", "Seventeen ", "Eighteen ", "Nineteen "];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const n = String(num).split(".");
  let numStr = n[0];
  if (numStr.length > 9) return num;
  let words = "";
  if (numStr.length === 0) return "Zero";
  const getGroup = (nStr) => {
    let w = "";
    const num2 = parseInt(nStr, 10);
    if (num2 > 99) {
      w += a[Math.floor(num2 / 100)] + "Hundred ";
    }
    const rem = num2 % 100;
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
  if (crores) words += getGroup(String(crores)) + "Crore ";
  if (lakhs) words += getGroup(String(lakhs)) + "Lakh ";
  if (thousands) words += getGroup(String(thousands)) + "Thousand ";
  if (rest) words += getGroup(String(rest));
  return words.trim();
}
export default function Template7({ invoice }) {
  const { client, user: biz } = invoice;
  Font.registerHyphenationCallback(safeHyphenation);
  const colors = invoice.templateColors || { primary: "#B565D8" };
  const PRIMARY = colors.primary;
  const headerScale = buildScaledStyles(biz);
  const bizInfoWidth = headerScale.bizInfoMaxWidth;
  const s = StyleSheet.create({
    watermarkContainer: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: -100 },
    watermarkImg: { width: 250, height: 250, objectFit: "contain", opacity: 0.12 },
    watermarkText: { fontSize: 60, fontFamily: B, color: hexToRgba(PRIMARY, 0.08), transform: "rotate(-45deg)", letterSpacing: 5 },
    page: { paddingTop: 40, paddingBottom: 60, fontFamily: "Inter", color: "#000" },
    container: { paddingHorizontal: 40 },
    // Header
    topSection: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingHorizontal: 40, marginBottom: 0 },
    docTitle: { fontFamily: B, fontSize: 24, letterSpacing: 1.5, textTransform: "uppercase", color: PRIMARY, marginBottom: 6 },
    bizName: { fontFamily: B, fontSize: headerScale.bizNameFontSize, color: "#000", textTransform: "uppercase", marginBottom: 2 },
    brandRow: { flexDirection: "row", alignItems: "flex-start", minWidth: 0 },
    brandText: { width: 230, flexShrink: 1 },
    topLogoSafe: { width: 36, height: 36, objectFit: "contain", marginRight: 8, flexShrink: 0 },
    bizText: { fontSize: headerScale.bizSubTextFontSize, color: "#444", marginBottom: 1, lineHeight: headerScale.bizSubTextLineHeight },
    boldText: { fontFamily: B, color: "#000" },
    originalText: { fontSize: 6.5, color: "#666", textTransform: "uppercase", textAlign: "right", marginBottom: 10, fontFamily: B },
    // Meta & Info Columns
    gridRow: { flexDirection: "row", paddingHorizontal: 40, marginBottom: 10 },
    col1: { width: "38%", minWidth: 0, paddingRight: 6 },
    col2: { width: "40%", minWidth: 0, paddingRight: 6 },
    col3: { width: "22%", minWidth: 0, alignItems: "flex-end" },
    metaLabel: { fontSize: 7.5, color: "#444" },
    metaValue: { fontSize: 7.5, color: "#000", fontFamily: B },
    infoTitle: { fontSize: 7.5, color: "#444", marginBottom: 4 },
    infoName: { fontFamily: B, fontSize: 8, color: "#000", marginBottom: 1.5 },
    infoText: { fontSize: 7.5, color: "#000", marginBottom: 1.5 },
    // Table
    table: { width: "100%", paddingHorizontal: 40, marginBottom: 8 },
    tHeadRow: { flexDirection: "row", borderBottom: `1pt solid ${PRIMARY}`, borderTop: `1pt solid ${PRIMARY}`, paddingVertical: 4 },
    tRow: { flexDirection: "row", paddingVertical: 6, borderBottom: "1pt solid #E5E5E5" },
    th: { fontSize: 7, fontFamily: B, color: "#000", paddingHorizontal: 2 },
    td: { fontSize: 7.5, color: "#000", paddingHorizontal: 2 },
    colNo: { width: "4%", textAlign: "left" },
    colDesc: { width: "32%" },
    colRate: { width: "13%", textAlign: "right" },
    colQty: { width: "8%", textAlign: "center" },
    colTaxable: { width: "14%", textAlign: "right" },
    colTaxAmt: { width: "15%", textAlign: "right" },
    colTotal: { width: "14%", textAlign: "right" },
    // Totals Box
    totalsWrapper: { flexDirection: "row", justifyContent: "flex-end", paddingHorizontal: 40, marginBottom: 6 },
    totalsBox: { width: "50%" },
    totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 1.5 },
    totalLabel: { fontSize: 7.5, fontFamily: B, color: "#000", textAlign: "right", flex: 1, paddingRight: 10 },
    totalVal: { fontSize: 7.5, fontFamily: B, color: "#000", width: 100, textAlign: "right" },
    grandTotalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, marginTop: 4 },
    grandTotalLabel: { fontSize: 11, fontFamily: B, color: "#000", textAlign: "right", flex: 1, paddingRight: 10 },
    grandTotalVal: { fontSize: 11, fontFamily: B, color: "#000", width: 110, textAlign: "right" },
    // Items and Words
    wordsRow: { flexDirection: "row", justifyContent: "space-between", borderTop: `1pt solid ${PRIMARY}`, borderBottom: `1pt solid ${PRIMARY}`, marginHorizontal: 40, paddingVertical: 3, marginBottom: 15 },
    wordsText: { fontSize: 6.5, color: "#666" },
    // Bank & Signature
    bottomRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 40 },
    bankCol: { width: "50%" },
    sigCol: { width: "40%", alignItems: "flex-end" },
    bankLabel: { fontSize: 7.5, fontFamily: B, color: "#000", marginBottom: 4 },
    bankRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 1.5 },
    bankKey: { fontSize: 7, color: "#444", width: 60, flexShrink: 0 },
    bankVal: { fontSize: 7, fontFamily: B, color: "#000", flex: 1, minWidth: 0 },
    sigText: { fontSize: 7, color: "#444", marginBottom: 25 },
    sigLine: { fontSize: 7, color: "#444", paddingTop: 4, width: 100, textAlign: "center" },
    // Footer - slim, plain background, split left (brand/legal) vs right (powered by)
    footerBox: { position: "absolute", bottom: 18, left: 0, right: 0, paddingHorizontal: 40, paddingTop: 8, borderTop: "0.5pt solid #E0E0E0", flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
    footerLeft: { flexDirection: "column" },
    footerBrandLine: { fontSize: 7, fontFamily: B, color: PRIMARY, letterSpacing: 0.2, marginBottom: 3 },
    footerLink: { fontFamily: B, color: PRIMARY, textDecoration: "underline" },
    footerTrustLine: { fontSize: 6.5, color: "#333333" },
    poweredByContainer: { alignItems: "flex-end" },
    poweredByLabel: { fontSize: 6, color: "#888", letterSpacing: 0.3 },
    poweredByValue: { fontSize: 9.5, fontFamily: B, color: "#000", letterSpacing: 0.3, marginTop: 1 },
    footerTagline: { fontSize: 6, color: PRIMARY, marginTop: 2 }
  });
  const currency = invoice._currency || invoice.currency || "INR";
  const fmt = (n) => new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);
  const bizName = biz?.businessName || biz?.name || "";
  const isQuotation = invoice.invoiceType === "quotation";
  const docTitle = isQuotation ? "QUOTATION" : "INVOICE";
  const totalItems = invoice.items?.length || 0;
  const totalQty = invoice.items?.reduce((acc, item) => acc + (Number(item.quantity) || 0), 0) || 0;
  const totalInWords = numberToWords(Math.floor(invoice.total || 0));
  const cgstRateDisplay = invoice.items?.find((i) => i.cgstRate > 0)?.cgstRate || 0;
  const sgstRateDisplay = invoice.items?.find((i) => i.sgstRate > 0)?.sgstRate || 0;
  const igstRateDisplay = invoice.items?.find((i) => i.igstRate > 0)?.igstRate || 0;
  const vatRateDisplay = invoice.items?.find((i) => i.vatRate > 0)?.vatRate || 0;
  return /* @__PURE__ */ React.createElement(Document, null, /* @__PURE__ */ React.createElement(Page, { size: "A4", style: s.page }, !biz?.plan || String(biz.plan).toLowerCase() === "free" ? /* @__PURE__ */ React.createElement(View, { style: s.watermarkContainer, pointerEvents: "none", fixed: true }, /* @__PURE__ */ React.createElement(Text, { style: s.watermarkText }, "GoodSynk")) : isRasterImage(invoice.watermarkImage || biz.watermarkImage) ? /* @__PURE__ */ React.createElement(View, { style: s.watermarkContainer, pointerEvents: "none", fixed: true }, /* @__PURE__ */ React.createElement(Image, { src: invoice.watermarkImage || biz.watermarkImage, style: s.watermarkImg })) : null, /* @__PURE__ */ React.createElement(View, { style: s.topSection }, /* @__PURE__ */ React.createElement(View, { style: { flex: 1, minWidth: 0 } }, /* @__PURE__ */ React.createElement(Text, { style: s.docTitle }, docTitle), /* @__PURE__ */ React.createElement(View, { style: s.brandRow }, biz?.businessLogo && /* @__PURE__ */ React.createElement(Image, { style: s.topLogoSafe, src: biz.businessLogo }), /* @__PURE__ */ React.createElement(View, { style: s.brandText }, /* @__PURE__ */ React.createElement(Text, { numberOfLines: 1, style: s.bizName }, bizName), biz?.gstin && /* @__PURE__ */ React.createElement(Text, { style: s.bizText }, "GSTIN ", /* @__PURE__ */ React.createElement(Text, { style: s.boldText }, biz.gstin)), biz?.address?.street && /* @__PURE__ */ React.createElement(Text, { style: s.bizText }, biz.address.street), biz?.address?.city && /* @__PURE__ */ React.createElement(Text, { style: s.bizText }, biz.address.city, ", ", biz.address.state, ", ", biz.address.pincode), (biz?.phone || biz?.email) && /* @__PURE__ */ React.createElement(Text, { style: s.bizText }, biz?.phone && /* @__PURE__ */ React.createElement(Text, null, /* @__PURE__ */ React.createElement(Text, { style: s.boldText }, "Mobile"), " ", biz.phone, "   "), biz?.email && /* @__PURE__ */ React.createElement(Text, null, /* @__PURE__ */ React.createElement(Text, { style: s.boldText }, "Email"), " ", biz.email)), biz?.website && /* @__PURE__ */ React.createElement(Text, { style: s.bizText }, /* @__PURE__ */ React.createElement(Text, { style: s.boldText }, "Website"), " ", biz.website))))), /* @__PURE__ */ React.createElement(View, { style: [s.gridRow, { marginTop: 15 }] }, /* @__PURE__ */ React.createElement(View, { style: s.col1 }, /* @__PURE__ */ React.createElement(Text, { style: s.metaLabel }, isQuotation ? "Quotation #" : "Invoice #", ": ", /* @__PURE__ */ React.createElement(Text, { style: s.metaValue }, invoice.invoiceNumber || invoice.quotationNumber))), /* @__PURE__ */ React.createElement(View, { style: s.col2 }, /* @__PURE__ */ React.createElement(Text, { style: s.metaLabel }, isQuotation ? "Quotation Date" : "Invoice Date", ": ", /* @__PURE__ */ React.createElement(Text, { style: s.metaValue }, new Date(invoice.issueDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })))), /* @__PURE__ */ React.createElement(View, { style: s.col3 }, invoice.dueDate && /* @__PURE__ */ React.createElement(Text, { style: s.metaLabel }, isQuotation ? "Validity" : "Due Date", ": ", /* @__PURE__ */ React.createElement(Text, { style: s.metaValue }, new Date(invoice.dueDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }))))), /* @__PURE__ */ React.createElement(View, { style: [s.gridRow, { marginBottom: 15 }] }, /* @__PURE__ */ React.createElement(View, { style: s.col1 }, /* @__PURE__ */ React.createElement(Text, { style: s.infoTitle }, "Customer Details:"), /* @__PURE__ */ React.createElement(Text, { style: s.infoName }, client?.name), client?.companyName && /* @__PURE__ */ React.createElement(Text, { style: s.infoName }, client.companyName), client?.phone && /* @__PURE__ */ React.createElement(Text, { style: s.infoText }, "Ph: ", client.phone), client?.email && /* @__PURE__ */ React.createElement(Text, { style: s.infoText }, client.email), client?.address?.state && /* @__PURE__ */ React.createElement(View, { style: { marginTop: 6 } }, /* @__PURE__ */ React.createElement(Text, { style: s.infoTitle }, "Place of Supply:"), /* @__PURE__ */ React.createElement(Text, { style: s.infoName }, client.address.state))), /* @__PURE__ */ React.createElement(View, { style: s.col2 }, /* @__PURE__ */ React.createElement(Text, { style: s.infoTitle }, "Billing Address:"), client?.address?.street && /* @__PURE__ */ React.createElement(Text, { style: s.infoText }, client.address.street), client?.address?.city && /* @__PURE__ */ React.createElement(Text, { style: s.infoText }, client.address.city, ", ", client.address.state), client?.address?.pincode && /* @__PURE__ */ React.createElement(Text, { style: s.infoText }, client.address.pincode)), /* @__PURE__ */ React.createElement(View, { style: s.col3 })), /* @__PURE__ */ React.createElement(View, { style: s.table }, /* @__PURE__ */ React.createElement(View, { style: s.tHeadRow }, /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colNo] }, "#"), /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colDesc] }, "Item"), /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colRate] }, "Rate / Item"), /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colQty] }, "Qty"), /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colTaxable] }, "Taxable Value"), /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colTaxAmt] }, "Tax Amount"), /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colTotal] }, "Amount")), invoice.items?.map((item, i) => {
    const taxAmt = (item.cgstAmount || 0) + (item.sgstAmount || 0) + (item.igstAmount || 0) + (item.vatAmount || 0);
    const taxable = item.price * item.quantity - (item.discountAmount || 0);
    const totalItemTaxRate = (item.cgstRate || 0) + (item.sgstRate || 0) + (item.igstRate || 0) + (item.vatRate || 0);
    const taxRateStr = totalItemTaxRate > 0 ? ` (${totalItemTaxRate}%)` : "";
    return /* @__PURE__ */ React.createElement(View, { key: i, style: s.tRow }, /* @__PURE__ */ React.createElement(Text, { style: [s.td, s.colNo] }, i + 1), /* @__PURE__ */ React.createElement(Text, { style: [s.td, s.colDesc, { fontFamily: B }] }, item.name), /* @__PURE__ */ React.createElement(Text, { style: [s.td, s.colRate] }, fmt(item.price)), /* @__PURE__ */ React.createElement(Text, { style: [s.td, s.colQty] }, item.quantity), /* @__PURE__ */ React.createElement(Text, { style: [s.td, s.colTaxable] }, fmt(taxable)), /* @__PURE__ */ React.createElement(Text, { style: [s.td, s.colTaxAmt] }, fmt(taxAmt), taxRateStr), /* @__PURE__ */ React.createElement(Text, { style: [s.td, s.colTotal] }, fmt(item.total)));
  })), /* @__PURE__ */ React.createElement(View, { style: s.totalsWrapper }, /* @__PURE__ */ React.createElement(View, { style: s.totalsBox }, /* @__PURE__ */ React.createElement(View, { style: s.totalRow }, /* @__PURE__ */ React.createElement(Text, { style: s.totalLabel }, "Taxable Amount"), /* @__PURE__ */ React.createElement(Text, { style: s.totalVal }, "\u20B9", fmt(invoice.subtotal - (invoice.discountAmount || 0)))), invoice.cgstTotal > 0 && /* @__PURE__ */ React.createElement(View, { style: s.totalRow }, /* @__PURE__ */ React.createElement(Text, { style: s.totalLabel }, "CGST ", cgstRateDisplay ? `${cgstRateDisplay}%` : ""), /* @__PURE__ */ React.createElement(Text, { style: s.totalVal }, "\u20B9", fmt(invoice.cgstTotal))), invoice.sgstTotal > 0 && /* @__PURE__ */ React.createElement(View, { style: s.totalRow }, /* @__PURE__ */ React.createElement(Text, { style: s.totalLabel }, "SGST ", sgstRateDisplay ? `${sgstRateDisplay}%` : ""), /* @__PURE__ */ React.createElement(Text, { style: s.totalVal }, "\u20B9", fmt(invoice.sgstTotal))), invoice.igstTotal > 0 && /* @__PURE__ */ React.createElement(View, { style: s.totalRow }, /* @__PURE__ */ React.createElement(Text, { style: s.totalLabel }, "IGST ", igstRateDisplay ? `${igstRateDisplay}%` : ""), /* @__PURE__ */ React.createElement(Text, { style: s.totalVal }, "\u20B9", fmt(invoice.igstTotal))), invoice.vatTotal > 0 && /* @__PURE__ */ React.createElement(View, { style: s.totalRow }, /* @__PURE__ */ React.createElement(Text, { style: s.totalLabel }, "VAT ", vatRateDisplay ? `${vatRateDisplay}%` : ""), /* @__PURE__ */ React.createElement(Text, { style: s.totalVal }, "\u20B9", fmt(invoice.vatTotal))), /* @__PURE__ */ React.createElement(View, { style: s.grandTotalRow }, /* @__PURE__ */ React.createElement(Text, { style: s.grandTotalLabel }, "Total"), /* @__PURE__ */ React.createElement(Text, { style: s.grandTotalVal }, "\u20B9", fmt(invoice.total))))), /* @__PURE__ */ React.createElement(View, { style: s.wordsRow }, /* @__PURE__ */ React.createElement(Text, { style: s.wordsText }, "Total items / Qty : ", totalItems, " / ", totalQty), /* @__PURE__ */ React.createElement(Text, { style: s.wordsText }, "Total amount (in words): INR ", totalInWords, " Rupees Only.")), /* @__PURE__ */ React.createElement(View, { style: s.bottomRow }, /* @__PURE__ */ React.createElement(View, { style: s.bankCol }, biz?.bankDetails?.accountNumber && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Text, { style: s.bankLabel }, "Bank Details:"), biz.bankDetails.bankName && /* @__PURE__ */ React.createElement(View, { style: s.bankRow }, /* @__PURE__ */ React.createElement(Text, { style: s.bankKey }, "Bank:"), /* @__PURE__ */ React.createElement(Text, { style: s.bankVal }, biz.bankDetails.bankName)), /* @__PURE__ */ React.createElement(View, { style: s.bankRow }, /* @__PURE__ */ React.createElement(Text, { style: s.bankKey }, "Account #:"), /* @__PURE__ */ React.createElement(Text, { style: s.bankVal }, biz.bankDetails.accountNumber)), biz.bankDetails.ifscCode && /* @__PURE__ */ React.createElement(View, { style: s.bankRow }, /* @__PURE__ */ React.createElement(Text, { style: s.bankKey }, "IFSC Code:"), /* @__PURE__ */ React.createElement(Text, { style: s.bankVal }, biz.bankDetails.ifscCode)), biz.bankDetails.branch && /* @__PURE__ */ React.createElement(View, { style: s.bankRow }, /* @__PURE__ */ React.createElement(Text, { style: s.bankKey }, "Branch:"), /* @__PURE__ */ React.createElement(Text, { style: s.bankVal }, biz.bankDetails.branch)))), /* @__PURE__ */ React.createElement(View, { style: s.sigCol }, /* @__PURE__ */ React.createElement(Text, { style: s.sigText }, "For ", bizName), biz?.businessSignature && /* @__PURE__ */ React.createElement(Image, { src: biz.businessSignature, style: { width: 100, height: 40, objectFit: "contain", marginBottom: 4 } }), /* @__PURE__ */ React.createElement(SignatoryDetails, { biz }), /* @__PURE__ */ React.createElement(Text, { style: s.sigLine }, "Authorized Signatory"), biz?.businessSeal && /* @__PURE__ */ React.createElement(Image, { src: biz.businessSeal, style: { width: 70, height: 70, objectFit: "contain", marginTop: 4 } }))), /* @__PURE__ */ React.createElement(View, { style: s.footerBox, fixed: true }, /* @__PURE__ */ React.createElement(View, { style: s.footerLeft }, /* @__PURE__ */ React.createElement(Text, { style: s.footerBrandLine }, "Goodsynk Invoice  |  Simple Invoicing, Billing & Quotations  |  Visit", " ", /* @__PURE__ */ React.createElement(Link, { src: "https://invoice.goodsynk.com", style: s.footerLink }, "invoice.goodsynk.com")), /* @__PURE__ */ React.createElement(
    Text,
    {
      style: s.footerTrustLine,
      render: ({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}  \u2022  This is a digitally signed document.`
    }
  )), /* @__PURE__ */ React.createElement(View, { style: s.poweredByContainer }, /* @__PURE__ */ React.createElement(Text, { style: s.poweredByLabel }, "Powered By"), /* @__PURE__ */ React.createElement(Text, { style: s.poweredByValue }, "GoodSynk", /* @__PURE__ */ React.createElement(Text, { style: { fontSize: 7, fontFamily: "Helvetica" } }, "\u2122")), /* @__PURE__ */ React.createElement(Text, { style: s.footerTagline }, "Invoice Banega, Payment Badega.")))));
}
