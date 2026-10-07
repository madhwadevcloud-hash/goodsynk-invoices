import SignatoryDetails from "./SignatoryDetails";
import React from "react";
import { Document, Page, Text, View, StyleSheet, Font, Image, Link } from "@react-pdf/renderer";
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
export default function Template2({ invoice }) {
  const { client, user: biz } = invoice;
  const colors = invoice.templateColors || { primary: "#000000" };
  const PRIMARY = colors.primary;
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
  const TABLE_W = A4_WIDTH - 80;
  const { cw, cellSize } = standardColumns({ invoice, fmt, width: TABLE_W, headerPad: 2, mins: { no: 22, hsn: 48, qty: 44, price: 64, disc: 40, tax: 42, total: 72 } });
  const calcVals = [invoice.subtotal, invoice.discountAmount, invoice.taxTotal].map(fmt);
  const grandStr = `${currency} ${fmt(invoice.total)}`;
  const tw = totalsWidths(calcVals, ["SUBTOTAL", "DISCOUNT"], { size: 9.5, bigSize: 10, bigValue: grandStr, bigLabel: "TOTAL", minVal: 90, minLab: 66 });
  const FOOT_RIGHT_W = (TABLE_W - 11) * 0.55 - 6;
  const footPhone = `Phone:  ${biz?.phone || ""}`;
  const footEmail = `Email:  ${biz?.email || ""}`;
  const footPhoneSize = fitFont(footPhone, 7.5, FOOT_RIGHT_W, 6);
  const footEmailSize = fitFont(footEmail, 7.5, FOOT_RIGHT_W, 6);
  const s = StyleSheet.create({
    page: { paddingTop: 30, paddingBottom: footerReserve(biz, 80), paddingHorizontal: 40, fontFamily: "Inter", color: "#000" },
    topHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
    bizBox: { flexDirection: "row", alignItems: "flex-start", flex: 1, minWidth: 0 },
    brandText: { maxWidth: 250, flexShrink: 1 },
    topLogo: { maxWidth: 140, maxHeight: 52, objectFit: "contain", marginRight: 10, flexShrink: 0 },
    bizName: { fontFamily: B, fontSize: scaled.bizNameFontSize, color: "#000", textTransform: "uppercase", marginBottom: 2 },
    bizSubText: { fontSize: scaled.bizSubTextFontSize, color: "#444", marginTop: 1, lineHeight: scaled.bizSubTextLineHeight },
    titleBox: { alignItems: "flex-end", flexShrink: 0, marginLeft: 16 },
    headerText: { fontFamily: M, fontSize: 26, letterSpacing: 4, textTransform: "uppercase", color: "#000" },
    headerLine: { width: "100%", height: 1, backgroundColor: PRIMARY, marginVertical: 8 },
    detailsRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, marginBottom: 16 },
    detailsItem: { flex: 1 },
    detailsLabel: { fontSize: 7.5, fontFamily: B, textTransform: "uppercase", color: "#666", marginBottom: 2 },
    detailsValue: { fontSize: 9.5, color: "#000" },
    metaGrid: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
    metaColumn: { width: "31%", minWidth: 0 },
    metaTitle: { fontFamily: B, fontSize: 8.5, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4, color: "#333" },
    metaText: { fontSize: 8.5, color: "#444", marginBottom: 2, lineHeight: 1.3 },
    clientName: { fontSize: 11, fontFamily: B, color: "#000", marginBottom: 2 },
    table: { width: "100%", marginBottom: 8 },
    tHeadRow: { flexDirection: "row", borderBottom: `1pt solid ${PRIMARY}`, paddingBottom: 6, marginBottom: 8 },
    tRow: { flexDirection: "row", marginBottom: 6 },
    th: { fontSize: Math.min(9, cellSize), fontFamily: B, letterSpacing: 0.6, textTransform: "uppercase" },
    td: { fontSize: cellSize, color: "#000" },
    colNo: { width: cw.no, flexShrink: 0 },
    colDesc: { width: cw.desc, flexShrink: 0, paddingRight: 10 },
    colHsn: { width: cw.hsn, flexShrink: 0, textAlign: "center" },
    colPrice: { width: cw.price, flexShrink: 0, textAlign: "right", paddingRight: 8 },
    colQty: { width: cw.qty, flexShrink: 0, textAlign: "center" },
    colDisc: { width: cw.disc, flexShrink: 0, textAlign: "center" },
    colTax: { flexShrink: 0, textAlign: "center" },
    colTotal: { width: cw.total, flexShrink: 0, textAlign: "right" },
    totalsArea: { flexDirection: "row", justifyContent: "space-between", marginTop: 4, borderTop: `1pt solid ${PRIMARY}`, paddingTop: 6 },
    notesArea: { flex: 1, minWidth: 0, paddingRight: 16 },
    calcArea: { width: tw.lab + tw.val + 8, flexShrink: 0 },
    calcRow: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 4 },
    calcLabel: { fontFamily: B, fontSize: 9, textTransform: "uppercase", width: tw.lab, textAlign: "right", paddingRight: 8 },
    calcVal: { fontSize: 9.5, fontFamily: B, width: tw.val, textAlign: "right" },
    signatureArea: { marginTop: 10, flexDirection: "row", justifyContent: "flex-end", alignItems: "flex-end" },
    footerBox: { position: "absolute", bottom: 15, left: 40, right: 40, borderTopWidth: 1, borderTopColor: "#E0E0E0", borderTopStyle: "solid", flexDirection: "row", paddingTop: 8, alignItems: "stretch" },
    footerAccent: { width: 3, backgroundColor: PRIMARY, marginRight: 8 },
    footerLeft: { width: "45%", justifyContent: "center", paddingRight: 6 },
    footerRight: { width: "55%", justifyContent: "center", alignItems: "flex-end", paddingLeft: 6 },
    footerText: { fontSize: 7.5, color: "#444", marginBottom: 2 },
    footerContactLabel: { fontSize: 6.5, fontFamily: B, color: PRIMARY, letterSpacing: 0.5, marginBottom: 2, textTransform: "uppercase" },
    footerBrandName: { fontSize: 9.5, fontFamily: B, color: PRIMARY, letterSpacing: 0.3 },
    footerBrandLine: { fontSize: 7, color: "#444", marginTop: 1 },
    footerLink: { fontSize: 7, fontFamily: B, color: PRIMARY, textDecoration: "underline" },
    footerTagline: { fontSize: 6.5, color: "#666", marginTop: 1 },
    footerTrustLine: { fontSize: 5.5, color: "#888", marginTop: 1, textAlign: "left" },
    poweredByContainer: { alignItems: "flex-end", marginTop: 2 },
    poweredByLabel: { fontSize: 5.5, color: "#888", letterSpacing: 0.5 },
    poweredByValue: { fontSize: 8.5, fontFamily: B, color: "#000", letterSpacing: 0.5, marginTop: 1 },
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
      color: hexToRgba(PRIMARY, 0.08),
      transform: "rotate(-45deg)",
      letterSpacing: 5
    }
  });
  const bizName = biz?.businessName || biz?.name || "";
  const isQuotation = invoice.invoiceType === "quotation";
  const docTitle = isQuotation ? "QUOTATION" : "INVOICE";
  return /* @__PURE__ */ React.createElement(Document, null, /* @__PURE__ */ React.createElement(Page, { size: "A4", style: s.page }, !biz?.plan || String(biz.plan).toLowerCase() === "free" ? /* @__PURE__ */ React.createElement(View, { style: s.watermarkContainer, pointerEvents: "none", fixed: true }, /* @__PURE__ */ React.createElement(Text, { style: s.watermarkText }, "GoodSynk")) : isRasterImage(invoice.watermarkImage || biz.watermarkImage) ? /* @__PURE__ */ React.createElement(View, { style: s.watermarkContainer, pointerEvents: "none", fixed: true }, /* @__PURE__ */ React.createElement(Image, { src: invoice.watermarkImage || biz.watermarkImage, style: s.watermarkImg })) : null, /* @__PURE__ */ React.createElement(View, { style: s.topHeader }, /* @__PURE__ */ React.createElement(View, { style: s.bizBox }, biz?.businessLogo && /* @__PURE__ */ React.createElement(Image, { style: s.topLogo, src: biz.businessLogo }), /* @__PURE__ */ React.createElement(View, { style: s.brandText }, /* @__PURE__ */ React.createElement(Text, { style: s.bizName, numberOfLines: 1 }, bizName), biz?.address?.street && /* @__PURE__ */ React.createElement(Text, { style: s.bizSubText }, String(biz.address.street).replace(/\s+,/g, ",").replace(/,(?=\S)/g, ", ").trim()), biz?.address?.city && /* @__PURE__ */ React.createElement(Text, { style: s.bizSubText }, [[biz?.address?.city, biz?.address?.state].map((v) => String(v || "").trim().replace(/[-,\s]+$/, "")).filter(Boolean).join(", "), String(biz?.address?.pincode || "").trim()].filter(Boolean).join(" ")), biz?.gstin && /* @__PURE__ */ React.createElement(Text, { style: [s.bizSubText, { fontFamily: B }] }, "GSTIN: ", biz.gstin))), /* @__PURE__ */ React.createElement(View, { style: s.titleBox }, /* @__PURE__ */ React.createElement(Text, { style: s.headerText }, docTitle))), /* @__PURE__ */ React.createElement(View, { style: s.headerLine }), /* @__PURE__ */ React.createElement(View, { style: s.metaGrid }, /* @__PURE__ */ React.createElement(View, { style: s.metaColumn }, /* @__PURE__ */ React.createElement(Text, { style: s.metaTitle }, "Bill To:"), /* @__PURE__ */ React.createElement(Text, { style: s.clientName, numberOfLines: 1 }, client?.name), client?.address?.street && /* @__PURE__ */ React.createElement(Text, { style: s.metaText }, client.address.street), client?.address?.city && /* @__PURE__ */ React.createElement(Text, { style: s.metaText }, client.address.city, ", ", client.address.state, " ", client.address.pincode || ""), client?.phone && /* @__PURE__ */ React.createElement(Text, { style: s.metaText }, "Phone: ", client.phone)), /* @__PURE__ */ React.createElement(View, { style: s.metaColumn }, /* @__PURE__ */ React.createElement(Text, { style: s.metaTitle }, "Details:"), /* @__PURE__ */ React.createElement(Text, { style: s.metaText }, isQuotation ? "Quotation No" : "Invoice No", ": ", /* @__PURE__ */ React.createElement(Text, { style: { fontFamily: B } }, invoice.invoiceNumber || invoice.quotationNumber)), /* @__PURE__ */ React.createElement(Text, { style: s.metaText }, "Date of Issue: ", /* @__PURE__ */ React.createElement(Text, { style: { fontFamily: B } }, new Date(invoice.issueDate).toLocaleDateString("en-US"))), /* @__PURE__ */ React.createElement(Text, { style: s.metaText }, "Due Date: ", /* @__PURE__ */ React.createElement(Text, { style: { fontFamily: B } }, invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString("en-US") : "Upon Receipt"))), /* @__PURE__ */ React.createElement(View, { style: s.metaColumn }, /* @__PURE__ */ React.createElement(Text, { style: s.metaTitle }, "Payment Details:"), biz?.bankDetails?.accountNumber ? /* @__PURE__ */ React.createElement(React.Fragment, null, biz.bankDetails.bankName && /* @__PURE__ */ React.createElement(Text, { style: s.metaText }, "Bank: ", biz.bankDetails.bankName), /* @__PURE__ */ React.createElement(Text, { style: s.metaText }, "A/C Name: ", biz.bankDetails.accountName), /* @__PURE__ */ React.createElement(Text, { style: s.metaText }, "A/C No: ", biz.bankDetails.accountNumber), biz.bankDetails.ifscCode && /* @__PURE__ */ React.createElement(Text, { style: s.metaText }, "IFSC: ", biz.bankDetails.ifscCode), biz.bankDetails.branch && /* @__PURE__ */ React.createElement(Text, { style: s.metaText }, "Branch: ", biz.bankDetails.branch)) : /* @__PURE__ */ React.createElement(Text, { style: s.metaText }, invoice.paymentInfo || "\u2014"))), /* @__PURE__ */ React.createElement(View, { style: s.table }, /* @__PURE__ */ React.createElement(View, { style: s.tHeadRow, wrap: false }, /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colNo] }, "#"), /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colDesc] }, "Item Description"), hasHsn && /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colHsn] }, "HSN"), /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colQty] }, "Qty"), /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colPrice] }, "Price"), hasDiscount && /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colDisc] }, "Disc%"), showCGST && /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colTax, { width: cw.CGST }] }, "CGST"), showSGST && /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colTax, { width: cw.SGST }] }, "SGST"), showIGST && /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colTax, { width: cw.IGST }] }, "IGST"), showVAT && /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colTax, { width: cw.VAT }] }, "VAT"), /* @__PURE__ */ React.createElement(Text, { style: [s.th, s.colTotal] }, "Total")), invoice.items?.map((item, i) => /* @__PURE__ */ React.createElement(View, { key: i, style: s.tRow, wrap: false }, /* @__PURE__ */ React.createElement(Text, { style: [s.td, s.colNo] }, i + 1), /* @__PURE__ */ React.createElement(View, { style: s.colDesc }, /* @__PURE__ */ React.createElement(Text, { style: [s.td, { fontFamily: B }] }, item.name), item.description && /* @__PURE__ */ React.createElement(Text, { style: { fontSize: 7.5, color: "#333", marginTop: 1 } }, item.description)), hasHsn && /* @__PURE__ */ React.createElement(Text, { style: [s.td, s.colHsn] }, item.hsn || "\u2014"), /* @__PURE__ */ React.createElement(Text, { style: [s.td, s.colQty] }, qtyText(item)), /* @__PURE__ */ React.createElement(Text, { style: [s.td, s.colPrice] }, fmt(item.price)), hasDiscount && /* @__PURE__ */ React.createElement(Text, { style: [s.td, s.colDisc] }, item.discount || 0, "%"), showCGST && /* @__PURE__ */ React.createElement(Text, { style: [s.td, s.colTax, { width: cw.CGST }] }, item.cgstRate || 0, "%"), showSGST && /* @__PURE__ */ React.createElement(Text, { style: [s.td, s.colTax, { width: cw.SGST }] }, item.sgstRate || 0, "%"), showIGST && /* @__PURE__ */ React.createElement(Text, { style: [s.td, s.colTax, { width: cw.IGST }] }, item.igstRate || 0, "%"), showVAT && /* @__PURE__ */ React.createElement(Text, { style: [s.td, s.colTax, { width: cw.VAT }] }, item.vatRate || 0, "%"), /* @__PURE__ */ React.createElement(Text, { style: [s.td, s.colTotal, { fontFamily: B }] }, fmt(item.total))))), /* @__PURE__ */ React.createElement(View, { style: s.totalsArea, wrap: String(invoice.notes || "").length + String(invoice.termsAndConditions || "").length > 900 }, /* @__PURE__ */ React.createElement(View, { style: s.notesArea }, invoice.notes && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Text, { style: [s.metaTitle, { marginBottom: 4 }] }, "Notes"), /* @__PURE__ */ React.createElement(Text, { style: [s.metaText, { fontSize: 8 }] }, invoice.notes)), invoice.termsAndConditions && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Text, { style: [s.metaTitle, { marginTop: 8, marginBottom: 4 }] }, "Terms"), /* @__PURE__ */ React.createElement(Text, { style: [s.metaText, { fontSize: 8 }] }, invoice.termsAndConditions))), /* @__PURE__ */ React.createElement(View, { style: s.calcArea }, /* @__PURE__ */ React.createElement(View, { style: s.calcRow }, /* @__PURE__ */ React.createElement(Text, { style: s.calcLabel }, "Subtotal"), /* @__PURE__ */ React.createElement(Text, { style: s.calcVal }, fmt(invoice.subtotal))), invoice.discountAmount > 0 && /* @__PURE__ */ React.createElement(View, { style: s.calcRow }, /* @__PURE__ */ React.createElement(Text, { style: s.calcLabel }, "Discount"), /* @__PURE__ */ React.createElement(Text, { style: s.calcVal }, "-", fmt(invoice.discountAmount))), invoice.taxTotal > 0 && /* @__PURE__ */ React.createElement(View, { style: s.calcRow }, /* @__PURE__ */ React.createElement(Text, { style: s.calcLabel }, "Tax"), /* @__PURE__ */ React.createElement(Text, { style: s.calcVal }, fmt(invoice.taxTotal))), /* @__PURE__ */ React.createElement(View, { style: [s.calcRow, { marginTop: 4 }] }, /* @__PURE__ */ React.createElement(Text, { style: [s.calcLabel, { fontSize: 10 }] }, "Total"), /* @__PURE__ */ React.createElement(Text, { style: [s.calcVal, { fontSize: 10 }] }, currency, " ", fmt(invoice.total))))), /* @__PURE__ */ React.createElement(View, { style: s.signatureArea, wrap: false }, biz?.businessSeal && /* @__PURE__ */ React.createElement(Image, { src: biz.businessSeal, style: { width: 55, height: 55, objectFit: "contain", marginRight: 16 } }), /* @__PURE__ */ React.createElement(SignatoryDetails, { biz, color: PRIMARY })), /* @__PURE__ */ React.createElement(View, { style: s.footerBox, fixed: true }, /* @__PURE__ */ React.createElement(View, { style: s.footerAccent }), /* @__PURE__ */ React.createElement(View, { style: s.footerLeft }, /* @__PURE__ */ React.createElement(Text, { style: s.footerBrandName }, "GoodSynk", /* @__PURE__ */ React.createElement(Text, { style: { fontSize: 7, fontFamily: "Helvetica" } }, "\u2122")), /* @__PURE__ */ React.createElement(Text, { style: s.footerBrandLine }, "Goodsynk Invoice \u2022 Simple Invoicing & Quotations"), /* @__PURE__ */ React.createElement(Text, { style: s.footerTagline }, "Invoice Banega, Payment Badega."), /* @__PURE__ */ React.createElement(Text, { style: s.footerTrustLine }, "Generated securely \u2022 Digitally signed document")), /* @__PURE__ */ React.createElement(View, { style: s.footerRight }, /* @__PURE__ */ React.createElement(Text, { style: s.footerContactLabel }, "Contact Us"), biz?.phone && /* @__PURE__ */ React.createElement(Text, { style: [s.footerText, { fontSize: footPhoneSize, textAlign: "right" }], numberOfLines: 1 }, footPhone), biz?.email && /* @__PURE__ */ React.createElement(Text, { style: [s.footerText, { fontSize: footEmailSize, textAlign: "right" }], numberOfLines: 1 }, footEmail), /* @__PURE__ */ React.createElement(View, { style: s.poweredByContainer }, /* @__PURE__ */ React.createElement(Text, { style: s.poweredByLabel }, "Powered By"), /* @__PURE__ */ React.createElement(Text, { style: s.poweredByValue }, "GoodSynk", /* @__PURE__ */ React.createElement(Text, { style: { fontSize: 7, fontFamily: "Helvetica" } }, "\u2122"))), /* @__PURE__ */ React.createElement(Link, { style: [s.footerLink, { marginTop: 2, textAlign: "right" }], src: "https://invoice.goodsynk.com" }, "invoice.goodsynk.com"))), /* @__PURE__ */ React.createElement(
    Text,
    {
      style: { position: "absolute", bottom: 4, right: 40, fontSize: 7.5, color: "#333333" },
      render: ({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`,
      fixed: true
    }
  )));
}
