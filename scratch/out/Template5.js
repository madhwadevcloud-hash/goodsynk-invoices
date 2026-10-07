import SignatoryDetails from "./SignatoryDetails";
import React from "react";
import { Document, Page, Text, View, StyleSheet, Font, Image } from "@react-pdf/renderer";
import { buildScaledStyles } from "./Pdfheaderscaling";
import { isRasterImage } from "./watermarkUtils";
import { safeHyphenation, fitFont, standardColumns, totalsWidths, qtyText, footerReserve, A4_WIDTH } from "./layoutUtils";
Font.register({ family: "Inter", src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYMZhrib2Bg-4.ttf" });
Font.register({ family: "Inter-SemiBold", src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYMZhrib2Bg-4.ttf" });
Font.register({ family: "Inter-Bold", src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYMZhrib2Bg-4.ttf" });
Font.registerHyphenationCallback(safeHyphenation);
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
export default function Template5({ invoice }) {
  const { client, user: biz } = invoice;
  const colors = invoice.templateColors || { primary: "#0A66C2" };
  const BLUE = colors.primary;
  const scaled = buildScaledStyles(biz);
  const currency = invoice._currency || invoice.currency || "INR";
  const fmt = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency, currencyDisplay: "code" }).format(n || 0).replace(currency, "").trim();
  const showCGST = invoice.cgstTotal > 0;
  const showSGST = invoice.sgstTotal > 0;
  const showIGST = invoice.igstTotal > 0;
  const showVAT = invoice.vatTotal > 0;
  const hasTax = showCGST || showSGST || showIGST || showVAT;
  const hasHsn = invoice.items?.some((i) => i.hsn);
  const hasDiscount = invoice.items?.some((i) => i.discount > 0);
  const TABLE_W = A4_WIDTH - 80 - 20;
  const { cw, cellSize } = standardColumns({ invoice, fmt, width: TABLE_W, headerPad: 1, mins: { no: 20, hsn: 48, qty: 44, price: 64, disc: 40, tax: 42, total: 72 } });
  const calcVals = [invoice.subtotal, invoice.discountAmount, invoice.taxTotal].map(fmt);
  const grandStr = `${currency} ${fmt(invoice.total)}`;
  const tw = totalsWidths(calcVals, ["Subtotal", "Discount"], { size: 9.5, bigSize: 10, bigValue: grandStr, bigLabel: "Total", minVal: 90, minLab: 52, pad: 4 });
  const rightBottomW = Math.max((A4_WIDTH - 80) * 0.4, tw.lab + tw.val + 10);
  const FOOT_A_W = A4_WIDTH * (1.7 / 4.4) - 28;
  const footPhoneSize = fitFont(biz?.phone || "", 7.5, FOOT_A_W, 6);
  const footEmailSize = fitFont(biz?.email || "", 7.5, FOOT_A_W, 6);
  const s = StyleSheet.create({
    page: { paddingTop: 32, paddingBottom: footerReserve(biz, 75) + 5, paddingHorizontal: 40, fontFamily: "Inter", color: "#000" },
    headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
    headerLeft: { width: "46%", minWidth: 0 },
    headerRight: { width: "54%", alignItems: "flex-end", minWidth: 0 },
    invoiceTitle: { fontFamily: B, fontSize: 24, color: BLUE, textTransform: "uppercase", letterSpacing: 1 },
    bizInfo: { flexDirection: "row", justifyContent: "flex-end", alignItems: "flex-start", marginTop: 8, minWidth: 0 },
    brandText: { width: 230, flexShrink: 1 },
    topLogo: { maxWidth: 140, maxHeight: 52, objectFit: "contain", marginRight: 8, flexShrink: 0 },
    bizText: { fontSize: scaled.bizSubTextFontSize, color: "#444", textAlign: "right", lineHeight: scaled.bizSubTextLineHeight },
    bizName: { fontSize: scaled.bizNameFontSize, fontFamily: B, color: "#000", marginBottom: 2, textAlign: "right" },
    metaSection: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10, borderTop: `2pt solid ${BLUE}`, paddingTop: 8 },
    metaCol: { width: "47%", minWidth: 0 },
    metaLabel: { fontSize: 7.5, fontFamily: B, textTransform: "uppercase", color: "#777", marginBottom: 4 },
    metaVal: { fontSize: 9, color: "#222", lineHeight: 1.3 },
    table: { width: "100%", marginBottom: 10 },
    tHead: { flexDirection: "row", backgroundColor: BLUE, color: "#FFF", paddingVertical: 6, paddingHorizontal: 10 },
    th: { fontSize: Math.min(8.5, cellSize), fontFamily: B, textTransform: "uppercase" },
    tRow: { flexDirection: "row", paddingVertical: 6, paddingHorizontal: 10, borderBottom: "1pt solid #EEE" },
    td: { fontSize: cellSize, color: "#000" },
    colNo: { width: cw.no, flexShrink: 0 },
    colDesc: { width: cw.desc, flexShrink: 0, paddingRight: 8 },
    colHsn: { width: cw.hsn, flexShrink: 0, textAlign: "center" },
    colPrice: { width: cw.price, flexShrink: 0, textAlign: "right", paddingRight: 8 },
    colQty: { width: cw.qty, flexShrink: 0, textAlign: "center" },
    colDisc: { width: cw.disc, flexShrink: 0, textAlign: "center" },
    colTax: { flexShrink: 0, textAlign: "center" },
    colTotal: { width: cw.total, flexShrink: 0, textAlign: "right" },
    bottomSection: { flexDirection: "row", justifyContent: "space-between" },
    leftBottom: { flex: 1, minWidth: 0, paddingRight: 16 },
    rightBottom: { width: rightBottomW, flexShrink: 0 },
    calcRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
    calcLabel: { fontSize: 9, color: "#444" },
    calcVal: { fontSize: 9.5, fontFamily: M, color: "#000", textAlign: "right" },
    totalRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 6, paddingTop: 7, borderTop: `2pt solid ${BLUE}` },
    grandTotalLabel: { fontSize: 10, fontFamily: B, color: BLUE },
    grandTotalVal: { fontSize: 10, fontFamily: B, color: BLUE },
    totalLabel: { fontSize: 10, fontFamily: B, color: BLUE },
    totalVal: { fontSize: 10, fontFamily: B, color: BLUE, textAlign: "right" },
    footerBox: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: BLUE, flexDirection: "row", alignItems: "center", minHeight: 50, paddingHorizontal: 0 },
    footerSegmentA: { flex: 1.7, minWidth: 0, paddingHorizontal: 14, paddingVertical: 8, justifyContent: "center" },
    footerVRule: { width: 1, backgroundColor: hexToRgba("#FFF", 0.2), alignSelf: "stretch", marginVertical: 8 },
    footerSegmentB: { flex: 1.6, minWidth: 0, paddingHorizontal: 16, paddingVertical: 8, justifyContent: "center", alignItems: "center" },
    footerSegmentC: { flex: 1.1, minWidth: 0, paddingHorizontal: 14, paddingVertical: 8, justifyContent: "center", alignItems: "flex-end" },
    footerSectionTitle: { fontSize: 5.5, fontFamily: B, color: hexToRgba("#FFF", 0.5), letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 3 },
    footerText: { fontSize: 7.5, color: "#FFF", marginBottom: 2 },
    footerBrandName: { fontSize: 11, fontFamily: B, color: "#F2C94C", letterSpacing: 1 },
    footerBrandLine: { fontSize: 6.5, color: hexToRgba("#FFF", 0.75), marginTop: 2, textAlign: "center" },
    footerTagline: { fontSize: 6.5, fontFamily: B, color: hexToRgba("#FFF", 0.85), marginTop: 3, textAlign: "center" },
    footerLink: { fontSize: 6.5, fontFamily: B, color: "#F2C94C", textAlign: "right", marginTop: 2 },
    footerTrustLine: { fontSize: 5.5, color: hexToRgba("#FFF", 0.5), textAlign: "right", lineHeight: 1.5 },
    poweredByContainer: { alignItems: "center", marginTop: 3 },
    poweredByLabel: { fontSize: 5.5, color: hexToRgba("#FFF", 0.5), letterSpacing: 0.5 },
    poweredByValue: { fontSize: 8, fontFamily: B, color: "#FFF", letterSpacing: 0.5, marginTop: 1 },
    watermarkContainer: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: -100
    },
    watermarkImg: { width: 250, height: 250, objectFit: "contain", opacity: 0.12 },
    watermarkText: {
      fontSize: 60,
      fontFamily: B,
      color: hexToRgba(BLUE, 0.08),
      transform: "rotate(-45deg)",
      letterSpacing: 5
    },
    poweredByContainer: { alignItems: "center", marginTop: 6 },
    poweredByLabel: { fontSize: 6, color: hexToRgba("#FFF", 0.65), letterSpacing: 0.5 },
    poweredByValue: { fontSize: 9.5, fontFamily: B, color: "#FFF", letterSpacing: 0.5, marginTop: 1 }
  });
  const bizName = biz?.businessName || biz?.name || "";
  const isQuotation = invoice.invoiceType === "quotation";
  return /* @__PURE__ */ React.createElement(Document, null, /* @__PURE__ */ React.createElement(Page, { size: "A4", style: s.page }, !biz?.plan || String(biz.plan).toLowerCase() === "free" ? /* @__PURE__ */ React.createElement(View, { style: s.watermarkContainer, fixed: true, pointerEvents: "none" }, /* @__PURE__ */ React.createElement(Text, { style: s.watermarkText }, "GoodSynk")) : isRasterImage(invoice.watermarkImage || biz.watermarkImage) ? /* @__PURE__ */ React.createElement(View, { style: s.watermarkContainer, fixed: true, pointerEvents: "none" }, /* @__PURE__ */ React.createElement(Image, { src: invoice.watermarkImage || biz.watermarkImage, style: s.watermarkImg })) : null, /* @__PURE__ */ React.createElement(View, { style: s.headerTop }, /* @__PURE__ */ React.createElement(View, { style: s.headerLeft }, /* @__PURE__ */ React.createElement(Text, { style: s.invoiceTitle }, isQuotation ? "QUOTATION" : "INVOICE"), /* @__PURE__ */ React.createElement(View, { style: { marginTop: 20 } }, /* @__PURE__ */ React.createElement(Text, { style: s.metaLabel }, isQuotation ? "Quotation No" : "Invoice No"), /* @__PURE__ */ React.createElement(Text, { style: [s.metaVal, { fontFamily: B, marginBottom: 10 }] }, invoice.invoiceNumber || invoice.quotationNumber), /* @__PURE__ */ React.createElement(Text, { style: s.metaLabel }, "Date of Issue"), /* @__PURE__ */ React.createElement(Text, { style: [s.metaVal, { marginBottom: 10 }] }, new Date(invoice.issueDate).toLocaleDateString("en-US")), /* @__PURE__ */ React.createElement(Text, { style: s.metaLabel }, "Due Date"), /* @__PURE__ */ React.createElement(Text, { style: s.metaVal }, invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString("en-US") : "Upon Receipt"))), /* @__PURE__ */ React.createElement(View, { style: s.headerRight }, /* @__PURE__ */ React.createElement(View, { style: s.bizInfo }, /* @__PURE__ */ React.createElement(View, { style: { width: "100%", flexDirection: "row", alignItems: "center" } }, biz?.businessLogo && /* @__PURE__ */ React.createElement(Image, { style: s.topLogo, src: biz.businessLogo }), /* @__PURE__ */ React.createElement(View, { style: s.brandText }, /* @__PURE__ */ React.createElement(Text, { numberOfLines: 1, style: s.bizName }, bizName), /* @__PURE__ */ React.createElement(Text, { style: s.bizText }, biz?.address?.street && `${biz.address.street}
`, biz?.address?.city && `${biz.address.city}, ${biz.address.state} ${biz.address.pincode || ""}
`, biz?.email && `${biz.email}
`, biz?.phone && `${biz.phone}`)))))), /* @__PURE__ */ React.createElement(View, { style: s.metaSection }, /* @__PURE__ */ React.createElement(View, { style: s.metaCol }, /* @__PURE__ */ React.createElement(Text, { style: s.metaLabel }, "Billed To:"), /* @__PURE__ */ React.createElement(Text, { style: [s.metaVal, { fontFamily: B, marginBottom: 4 }] }, client?.name), /* @__PURE__ */ React.createElement(Text, { style: s.metaVal }, client?.address?.street && `${client.address.street}
`, client?.address?.city && `${client.address.city}, ${client.address.state}
`, client?.email && `${client.email}
`, client?.phone && `${client.phone}`)), /* @__PURE__ */ React.createElement(View, { style: s.metaCol }, /* @__PURE__ */ React.createElement(Text, { style: s.metaLabel }, "Payment Information"), biz?.bankDetails?.accountNumber ? /* @__PURE__ */ React.createElement(Text, { style: s.metaVal }, biz.bankDetails.bankName && `Bank: ${biz.bankDetails.bankName}
`, "Account Name: ", biz.bankDetails.accountName, "\n", "Account No.: ", biz.bankDetails.accountNumber, "\n", biz.bankDetails.ifscCode && `IFSC: ${biz.bankDetails.ifscCode}
`, biz.bankDetails.branch && `Branch: ${biz.bankDetails.branch}`) : invoice.paymentInfo ? /* @__PURE__ */ React.createElement(Text, { style: s.metaVal }, invoice.paymentInfo) : null)), /* @__PURE__ */ React.createElement(View, { style: s.table }, /* @__PURE__ */ React.createElement(View, { style: s.tHead, wrap: false }, /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colNo] }, "#"), /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colDesc] }, "Description"), hasHsn && /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colHsn] }, "HSN"), /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colQty] }, "Qty"), /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colPrice] }, "Price"), hasDiscount && /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colDisc] }, "Disc%"), showCGST && /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colTax, { width: cw.CGST }] }, "CGST"), showSGST && /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colTax, { width: cw.SGST }] }, "SGST"), showIGST && /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colTax, { width: cw.IGST }] }, "IGST"), showVAT && /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colTax, { width: cw.VAT }] }, "VAT"), /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colTotal] }, "Total")), invoice.items?.map((item, i) => /* @__PURE__ */ React.createElement(View, { key: i, style: s.tRow, wrap: false }, /* @__PURE__ */ React.createElement(Text, { style: [s.td, s.colNo] }, i + 1), /* @__PURE__ */ React.createElement(View, { style: s.colDesc }, /* @__PURE__ */ React.createElement(Text, { style: [s.td, { fontFamily: M }] }, item.name), item.description && /* @__PURE__ */ React.createElement(Text, { style: { fontSize: 8, color: "#666", marginTop: 2 } }, item.description)), hasHsn && /* @__PURE__ */ React.createElement(Text, { style: [s.td, s.colHsn] }, item.hsn || "\u2014"), /* @__PURE__ */ React.createElement(Text, { style: [s.td, s.colQty] }, qtyText(item)), /* @__PURE__ */ React.createElement(Text, { style: [s.td, s.colPrice] }, fmt(item.price)), hasDiscount && /* @__PURE__ */ React.createElement(Text, { style: [s.td, s.colDisc] }, item.discount || 0, "%"), showCGST && /* @__PURE__ */ React.createElement(Text, { style: [s.td, s.colTax, { width: cw.CGST }] }, item.cgstRate || 0, "%"), showSGST && /* @__PURE__ */ React.createElement(Text, { style: [s.td, s.colTax, { width: cw.SGST }] }, item.sgstRate || 0, "%"), showIGST && /* @__PURE__ */ React.createElement(Text, { style: [s.td, s.colTax, { width: cw.IGST }] }, item.igstRate || 0, "%"), showVAT && /* @__PURE__ */ React.createElement(Text, { style: [s.td, s.colTax, { width: cw.VAT }] }, item.vatRate || 0, "%"), /* @__PURE__ */ React.createElement(Text, { style: [s.td, s.colTotal, { fontFamily: B }] }, fmt(item.total))))), /* @__PURE__ */ React.createElement(View, { style: s.bottomSection, wrap: String(invoice.notes || "").length + String(invoice.termsAndConditions || "").length > 900 }, /* @__PURE__ */ React.createElement(View, { style: s.leftBottom }, invoice.notes && /* @__PURE__ */ React.createElement(View, { style: { marginBottom: 15 } }, /* @__PURE__ */ React.createElement(Text, { style: s.metaLabel }, "Notes"), /* @__PURE__ */ React.createElement(Text, { style: s.metaVal }, invoice.notes)), invoice.termsAndConditions && /* @__PURE__ */ React.createElement(View, null, /* @__PURE__ */ React.createElement(Text, { style: s.metaLabel }, "Terms & Conditions"), /* @__PURE__ */ React.createElement(Text, { style: s.metaVal }, invoice.termsAndConditions))), /* @__PURE__ */ React.createElement(View, { style: s.rightBottom }, /* @__PURE__ */ React.createElement(View, { style: s.calcRow }, /* @__PURE__ */ React.createElement(Text, { style: s.calcLabel }, "Subtotal"), /* @__PURE__ */ React.createElement(Text, { style: s.calcVal }, fmt(invoice.subtotal))), invoice.discountAmount > 0 && /* @__PURE__ */ React.createElement(View, { style: s.calcRow }, /* @__PURE__ */ React.createElement(Text, { style: s.calcLabel }, "Discount"), /* @__PURE__ */ React.createElement(Text, { style: s.calcVal }, "-", fmt(invoice.discountAmount))), invoice.taxTotal > 0 && /* @__PURE__ */ React.createElement(View, { style: s.calcRow }, /* @__PURE__ */ React.createElement(Text, { style: s.calcLabel }, "Tax"), /* @__PURE__ */ React.createElement(Text, { style: s.calcVal }, fmt(invoice.taxTotal))), /* @__PURE__ */ React.createElement(View, { style: s.totalRow }, /* @__PURE__ */ React.createElement(Text, { style: s.totalLabel }, "Total"), /* @__PURE__ */ React.createElement(Text, { style: s.totalVal }, currency, " ", fmt(invoice.total))))), /* @__PURE__ */ React.createElement(View, { style: { marginTop: 10, paddingHorizontal: 40, flexDirection: "row", justifyContent: "flex-end", alignItems: "flex-end" }, wrap: false }, biz?.businessSeal && /* @__PURE__ */ React.createElement(Image, { src: biz.businessSeal, style: { width: 55, height: 55, objectFit: "contain", marginRight: 16 } }), /* @__PURE__ */ React.createElement(SignatoryDetails, { biz, color: "#1a3a6b" })), /* @__PURE__ */ React.createElement(View, { style: s.footerBox, fixed: true }, /* @__PURE__ */ React.createElement(View, { style: s.footerSegmentA }, /* @__PURE__ */ React.createElement(Text, { style: s.footerSectionTitle }, "Contact"), biz?.phone && /* @__PURE__ */ React.createElement(Text, { style: [s.footerText, { fontSize: footPhoneSize }] }, biz.phone), biz?.email && /* @__PURE__ */ React.createElement(Text, { style: [s.footerText, { fontSize: footEmailSize }] }, biz.email)), /* @__PURE__ */ React.createElement(View, { style: s.footerVRule }), /* @__PURE__ */ React.createElement(View, { style: s.footerSegmentB }, /* @__PURE__ */ React.createElement(View, { style: s.poweredByContainer }, /* @__PURE__ */ React.createElement(Text, { style: s.poweredByLabel }, "Powered By"), /* @__PURE__ */ React.createElement(Text, { style: s.poweredByValue }, "GoodSynk", /* @__PURE__ */ React.createElement(Text, { style: { fontSize: 7, fontFamily: "Helvetica" } }, "\u2122"))), /* @__PURE__ */ React.createElement(Text, { style: s.footerBrandLine }, "Goodsynk Invoice \u2022 Simple Invoicing & Quotations"), /* @__PURE__ */ React.createElement(Text, { style: s.footerTagline }, "Invoice Banega, Payment Badega.")), /* @__PURE__ */ React.createElement(View, { style: s.footerVRule }), /* @__PURE__ */ React.createElement(View, { style: s.footerSegmentC }, /* @__PURE__ */ React.createElement(Text, { style: s.footerSectionTitle }, "Verified"), /* @__PURE__ */ React.createElement(Text, { style: s.footerTrustLine }, "Generated securely by"), /* @__PURE__ */ React.createElement(Text, { style: s.footerTrustLine }, "GoodSynk", /* @__PURE__ */ React.createElement(Text, { style: { fontSize: 6, fontFamily: "Helvetica" } }, "\u2122"), "."), /* @__PURE__ */ React.createElement(Text, { style: s.footerTrustLine }, "Digitally signed document."), /* @__PURE__ */ React.createElement(Text, { style: s.footerLink, src: "https://invoice.goodsynk.com" }, "invoice.goodsynk.com"), /* @__PURE__ */ React.createElement(Text, { style: { fontSize: 6.5, color: "#FFFFFF", marginTop: 2, textAlign: "right", fontFamily: B }, render: ({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}` })))));
}
