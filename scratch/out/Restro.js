import React from "react";
import SignatoryDetails from "./SignatoryDetails";
import { Document, Page, Text, View, StyleSheet, Font, Image } from "@react-pdf/renderer";
import { buildScaledStyles } from "./Pdfheaderscaling";
import { isRasterImage } from "./watermarkUtils";
import { safeHyphenation, layoutColumns, neededWidth } from "./layoutUtils";
Font.register({ family: "Inter", src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYMZhrib2Bg-4.ttf" });
Font.register({ family: "Inter-SemiBold", src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYMZhrib2Bg-4.ttf" });
Font.register({ family: "Inter-Bold", src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYMZhrib2Bg-4.ttf" });
Font.registerHyphenationCallback(safeHyphenation);
const B = "Inter-Bold";
const M = "Inter-SemiBold";
const BLACK = "#000000";
const WHITE = "#FFFFFF";
const GRAY = "#555555";
const LIGHT_GRAY = "#AAAAAA";
const PAGE_WIDTH = 226.77;
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
export default function Template1({ invoice }) {
  const { client, user: biz } = invoice;
  const scaled = buildScaledStyles(biz);
  Font.registerHyphenationCallback(safeHyphenation);
  const INNER_W = PAGE_WIDTH - 20;
  const numFmt = (n) => new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);
  const rows = invoice.items || [];
  const cols = layoutColumns([
    { key: "item", flex: true },
    { key: "qty", min: 22, strings: ["Qty.", ...rows.map((i) => String(i.quantity || 1))] },
    { key: "price", min: 34, strings: ["Price", ...rows.map((i) => numFmt(i.price))] },
    { key: "amount", min: 42, strings: ["Amount", ...rows.map((i) => numFmt(i.total))] }
  ], INNER_W, 7, { pad: 4, minSize: 5.5, minFlex: 60 });
  const cw = cols.widths;
  const cellSize = cols.size;
  const sym = (n) => `\u20B9${numFmt(n)}`;
  const totalStrings = [
    `Sub ${sym(invoice.subtotal)}`,
    invoice.discountAmount > 0 ? `(${sym(invoice.discountAmount)})` : "",
    invoice.cgstTotal > 0 ? sym(invoice.cgstTotal) : "",
    invoice.sgstTotal > 0 ? sym(invoice.sgstTotal) : "",
    invoice.igstTotal > 0 ? sym(invoice.igstTotal) : "",
    invoice.vatTotal > 0 ? sym(invoice.vatTotal) : ""
  ];
  const totValW = Math.max(70, neededWidth(totalStrings, 7, { pad: 4 }));
  const totLabW = Math.max(50, Math.min(90, INNER_W - totValW - 4));
  const s = StyleSheet.create({
    page: {
      width: PAGE_WIDTH,
      paddingTop: 12,
      paddingBottom: 12,
      paddingHorizontal: 10,
      fontFamily: "Inter",
      color: BLACK,
      backgroundColor: WHITE
    },
    // Company name
    companyName: {
      fontFamily: B,
      fontSize: 14,
      color: BLACK,
      textAlign: "center",
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 4
    },
    companyAddress: {
      fontSize: 6.5,
      color: BLACK,
      textAlign: "center",
      lineHeight: 1.45
    },
    gstinLine: {
      fontSize: 6.5,
      color: BLACK,
      textAlign: "center",
      marginTop: 3,
      marginBottom: 4
    },
    solidDivider: {
      borderBottomWidth: 0.5,
      borderBottomColor: BLACK,
      borderBottomStyle: "solid",
      marginVertical: 4
    },
    nameRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 2
    },
    nameLabel: {
      fontSize: 7,
      color: BLACK,
      flex: 1,
      minWidth: 0,
      paddingRight: 6
    },
    nameValue: {
      fontSize: 7,
      color: BLACK,
      fontFamily: B,
      flexShrink: 0
    },
    dateRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 2
    },
    dateLabel: {
      fontSize: 7,
      color: BLACK
    },
    dateValue: {
      fontSize: 7,
      color: BLACK
    },
    metaRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 2
    },
    metaLabel: {
      fontSize: 7,
      color: BLACK
    },
    metaValue: {
      fontSize: 7,
      fontFamily: B,
      color: BLACK
    },
    tokenRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 4
    },
    tokenLabel: {
      fontSize: 7.5,
      fontFamily: B,
      color: BLACK
    },
    tableHead: {
      flexDirection: "row",
      borderBottomWidth: 0.5,
      borderBottomColor: BLACK,
      borderBottomStyle: "solid",
      paddingBottom: 2,
      marginBottom: 3
    },
    thItem: {
      width: cw.item,
      fontSize: cellSize,
      color: BLACK,
      fontFamily: B
    },
    thQty: {
      width: cw.qty,
      fontSize: cellSize,
      color: BLACK,
      fontFamily: B,
      textAlign: "center"
    },
    thPrice: {
      width: cw.price,
      fontSize: cellSize,
      color: BLACK,
      fontFamily: B,
      textAlign: "right"
    },
    thAmount: {
      width: cw.amount,
      fontSize: cellSize,
      color: BLACK,
      fontFamily: B,
      textAlign: "right"
    },
    tableRow: {
      flexDirection: "row",
      marginBottom: 2
    },
    tdItem: {
      width: cw.item,
      paddingRight: 4,
      fontSize: cellSize,
      color: BLACK
    },
    tdQty: {
      width: cw.qty,
      fontSize: cellSize,
      color: BLACK,
      textAlign: "center"
    },
    tdPrice: {
      width: cw.price,
      fontSize: cellSize,
      color: BLACK,
      textAlign: "right"
    },
    tdAmount: {
      width: cw.amount,
      fontSize: cellSize,
      color: BLACK,
      textAlign: "right"
    },
    totalsRow: {
      flexDirection: "row",
      justifyContent: "flex-end",
      marginBottom: 2
    },
    totalsLabel: {
      fontSize: 7,
      color: BLACK,
      width: totLabW,
      textAlign: "right",
      paddingRight: 8
    },
    totalsValue: {
      fontSize: 7,
      color: BLACK,
      width: totValW,
      textAlign: "right"
    },
    grandTotalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 4,
      paddingTop: 3,
      borderTopWidth: 1,
      borderTopColor: BLACK,
      borderTopStyle: "solid"
    },
    grandTotalLabel: {
      fontSize: 10,
      fontFamily: B,
      color: BLACK
    },
    grandTotalValue: {
      fontSize: 10,
      fontFamily: B,
      color: BLACK
    },
    footerLine: {
      fontSize: 6.5,
      color: BLACK,
      textAlign: "center",
      marginTop: 4,
      lineHeight: 1.4
    },
    footerBold: {
      fontSize: 8,
      fontFamily: B,
      color: BLACK,
      textAlign: "center",
      marginTop: 14,
      marginBottom: 4
    },
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
    watermarkImg: {
      width: 100,
      height: 100,
      objectFit: "contain",
      opacity: 0.08
    },
    watermarkText: {
      fontSize: 26,
      fontFamily: B,
      color: hexToRgba("#000000", 0.06),
      transform: "rotate(-45deg)",
      letterSpacing: 2
    },
    signatureImg: {
      width: 60,
      height: 25,
      objectFit: "contain",
      alignSelf: "flex-end",
      marginTop: 6
    }
  });
  const fmt = (n) => new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);
  const fmtCurrency = (n) => `\u20B9${fmt(n)}`;
  const bizName = biz?.businessName || biz?.name || "";
  const isQuotation = invoice.invoiceType === "quotation";
  const showCGST = invoice.cgstTotal > 0;
  const showSGST = invoice.sgstTotal > 0;
  const showIGST = invoice.igstTotal > 0;
  const showVAT = invoice.vatTotal > 0;
  const issueDate = invoice.issueDate ? new Date(invoice.issueDate) : null;
  const dateStr = issueDate ? issueDate.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "2-digit" }) : "";
  const timeStr = issueDate ? issueDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }) : "";
  const totalQty = invoice.items?.reduce((a, i) => a + (i.quantity || 1), 0) || 0;
  return /* @__PURE__ */ React.createElement(Document, null, /* @__PURE__ */ React.createElement(Page, { size: { width: PAGE_WIDTH, height: "auto" }, style: s.page }, !biz?.plan || String(biz.plan).toLowerCase() === "free" ? /* @__PURE__ */ React.createElement(View, { style: s.watermarkContainer, fixed: true, pointerEvents: "none" }, /* @__PURE__ */ React.createElement(Text, { style: s.watermarkText }, "GoodSynk")) : isRasterImage(invoice.watermarkImage || biz.watermarkImage) ? /* @__PURE__ */ React.createElement(View, { style: s.watermarkContainer, fixed: true, pointerEvents: "none" }, /* @__PURE__ */ React.createElement(Image, { src: invoice.watermarkImage || biz.watermarkImage, style: s.watermarkImg })) : null, /* @__PURE__ */ React.createElement(Text, { numberOfLines: 1, style: s.companyName }, bizName || "HOTEL"), (biz?.address?.street || biz?.address?.city) && /* @__PURE__ */ React.createElement(Text, { style: s.companyAddress }, biz.address.street ? `${biz.address.street},
` : "", [biz.address.city, biz.address.state].filter(Boolean).join(", "), biz.address.pincode ? ` - ${biz.address.pincode}` : ""), biz?.gstin && /* @__PURE__ */ React.createElement(Text, { style: s.gstinLine }, "GST : ", biz.gstin), /* @__PURE__ */ React.createElement(View, { style: s.solidDivider }), /* @__PURE__ */ React.createElement(View, { style: s.nameRow }, /* @__PURE__ */ React.createElement(Text, { style: s.nameLabel }, "Name: ", client?.name || "\u2014"), client?.phone && /* @__PURE__ */ React.createElement(Text, { style: s.nameValue }, "(M: ", client.phone, ")")), /* @__PURE__ */ React.createElement(View, { style: s.dateRow }, /* @__PURE__ */ React.createElement(Text, { style: s.dateLabel }, "Date: ", dateStr), /* @__PURE__ */ React.createElement(Text, { style: s.dateValue }, timeStr)), /* @__PURE__ */ React.createElement(View, { style: s.metaRow }, /* @__PURE__ */ React.createElement(Text, { style: s.metaLabel }, isQuotation ? "Quotation No" : "Bill No", ": ", /* @__PURE__ */ React.createElement(Text, { style: s.metaValue }, invoice.invoiceNumber || invoice.quotationNumber || "\u2014"))), /* @__PURE__ */ React.createElement(View, { style: s.tokenRow }, /* @__PURE__ */ React.createElement(Text, { style: s.tokenLabel }, "Token No: ", invoice.tokenNo || invoice.invoiceNumber || "\u2014")), /* @__PURE__ */ React.createElement(View, { style: s.solidDivider }), /* @__PURE__ */ React.createElement(View, { style: s.tableHead }, /* @__PURE__ */ React.createElement(Text, { style: s.thItem }, "Item"), /* @__PURE__ */ React.createElement(Text, { style: s.thQty }, "Qty."), /* @__PURE__ */ React.createElement(Text, { style: s.thPrice }, "Price"), /* @__PURE__ */ React.createElement(Text, { style: s.thAmount }, "Amount")), invoice.items?.map((item, i) => /* @__PURE__ */ React.createElement(View, { key: i, style: s.tableRow }, /* @__PURE__ */ React.createElement(Text, { style: s.tdItem }, item.name), /* @__PURE__ */ React.createElement(Text, { style: s.tdQty }, item.quantity || 1), /* @__PURE__ */ React.createElement(Text, { style: s.tdPrice }, fmt(item.price)), /* @__PURE__ */ React.createElement(Text, { style: s.tdAmount }, fmt(item.total)))), /* @__PURE__ */ React.createElement(View, { style: s.solidDivider }), /* @__PURE__ */ React.createElement(View, { style: s.totalsRow }, /* @__PURE__ */ React.createElement(Text, { style: s.totalsLabel }, "Total Qty: ", totalQty), /* @__PURE__ */ React.createElement(Text, { style: s.totalsValue }, "Sub ", fmtCurrency(invoice.subtotal))), invoice.discountAmount > 0 && /* @__PURE__ */ React.createElement(View, { style: s.totalsRow }, /* @__PURE__ */ React.createElement(Text, { style: s.totalsLabel }, "Discount ", invoice.discountPercent ? `${invoice.discountPercent}%` : ""), /* @__PURE__ */ React.createElement(Text, { style: s.totalsValue }, "(", fmtCurrency(invoice.discountAmount), ")")), showCGST && /* @__PURE__ */ React.createElement(View, { style: s.totalsRow }, /* @__PURE__ */ React.createElement(Text, { style: s.totalsLabel }, "CGST ", invoice.cgstRate ? `${invoice.cgstRate}%` : ""), /* @__PURE__ */ React.createElement(Text, { style: s.totalsValue }, fmtCurrency(invoice.cgstTotal))), showSGST && /* @__PURE__ */ React.createElement(View, { style: s.totalsRow }, /* @__PURE__ */ React.createElement(Text, { style: s.totalsLabel }, "SGST ", invoice.sgstRate ? `${invoice.sgstRate}%` : ""), /* @__PURE__ */ React.createElement(Text, { style: s.totalsValue }, fmtCurrency(invoice.sgstTotal))), showIGST && /* @__PURE__ */ React.createElement(View, { style: s.totalsRow }, /* @__PURE__ */ React.createElement(Text, { style: s.totalsLabel }, "IGST ", invoice.igstRate ? `${invoice.igstRate}%` : ""), /* @__PURE__ */ React.createElement(Text, { style: s.totalsValue }, fmtCurrency(invoice.igstTotal))), showVAT && /* @__PURE__ */ React.createElement(View, { style: s.totalsRow }, /* @__PURE__ */ React.createElement(Text, { style: s.totalsLabel }, "VAT ", invoice.vatRate ? `${invoice.vatRate}%` : ""), /* @__PURE__ */ React.createElement(Text, { style: s.totalsValue }, fmtCurrency(invoice.vatTotal))), /* @__PURE__ */ React.createElement(View, { style: s.grandTotalRow }, /* @__PURE__ */ React.createElement(Text, { style: s.grandTotalLabel }, "Grand Total"), /* @__PURE__ */ React.createElement(Text, { style: s.grandTotalValue }, fmtCurrency(invoice.total))), /* @__PURE__ */ React.createElement(View, { style: s.solidDivider }), /* @__PURE__ */ React.createElement(SignatoryDetails, { biz, color: "#000" }), biz?.fssai && /* @__PURE__ */ React.createElement(Text, { style: s.footerLine }, "FSSAI Lic No. ", biz.fssai), invoice.notes && /* @__PURE__ */ React.createElement(Text, { style: s.footerLine }, invoice.notes), /* @__PURE__ */ React.createElement(Text, { style: s.footerBold }, "Thank You Visit Again!!!")));
}
