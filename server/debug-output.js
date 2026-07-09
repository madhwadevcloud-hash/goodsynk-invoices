"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = Template1;
var _react = _interopRequireDefault(require("react"));
var _renderer = require("@react-pdf/renderer");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
// Register fonts (same as before)
_renderer.Font.register({
  family: 'Inter',
  src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYMZhrib2Bg-4.ttf'
});
_renderer.Font.register({
  family: 'Inter-SemiBold',
  src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYMZhrib2Bg-4.ttf'
});
_renderer.Font.register({
  family: 'Inter-Bold',
  src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYMZhrib2Bg-4.ttf'
});
const B = 'Inter-Bold';
const M = 'Inter-SemiBold';
function Template1({
  invoice
}) {
  const {
    client,
    user: biz
  } = invoice;
  const colors = invoice.templateColors || {
    primary: '#4A72D4'
  };
  const PRIMARY = colors.primary;
  const s = _renderer.StyleSheet.create({
    page: {
      paddingTop: 40,
      paddingBottom: 120,
      fontFamily: 'Inter',
      color: '#000'
    },
    container: {
      paddingHorizontal: 40
    },
    topSection: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingHorizontal: 40,
      marginBottom: 20
    },
    headerText: {
      fontFamily: B,
      fontSize: 32,
      letterSpacing: 2,
      textTransform: 'uppercase',
      color: PRIMARY,
      marginTop: 10
    },
    bizInfoTop: {
      alignItems: 'flex-end',
      maxWidth: '65%'
    },
    topLogo: {
      height: 45,
      maxWidth: 140,
      objectFit: 'contain',
      marginBottom: 6
    },
    bizNameTop: {
      fontFamily: B,
      fontSize: 13,
      color: '#000',
      textTransform: 'uppercase',
      marginBottom: 2
    },
    bizSubText: {
      fontSize: 8.5,
      color: '#444',
      marginTop: 1,
      lineHeight: 1.3
    },
    blueBar: {
      backgroundColor: PRIMARY,
      height: 12,
      width: '100%',
      marginBottom: 15
    },
    detailsRow: {
      flexDirection: 'row',
      paddingHorizontal: 40,
      marginBottom: 25,
      gap: 40
    },
    detailsCol: {},
    detailsLabel: {
      fontSize: 7.5,
      fontFamily: B,
      color: '#666',
      textTransform: 'uppercase',
      marginBottom: 3
    },
    detailsValue: {
      fontSize: 9.5,
      fontFamily: M,
      color: '#000'
    },
    table: {
      width: '100%',
      marginTop: 10
    },
    tHeadRow: {
      flexDirection: 'row',
      borderBottom: `1pt solid ${PRIMARY}`,
      paddingBottom: 8,
      marginBottom: 8
    },
    tRow: {
      flexDirection: 'row',
      borderBottom: `0.5pt solid ${PRIMARY}`,
      paddingVertical: 10
    },
    th: {
      fontSize: 9.5,
      fontFamily: B,
      color: '#000'
    },
    td: {
      fontSize: 9,
      color: '#000'
    },
    colNo: {
      flex: 0.4
    },
    colDesc: {
      flex: 2.2,
      paddingRight: 10
    },
    colHsn: {
      flex: 0.8,
      textAlign: 'center'
    },
    colQty: {
      flex: 0.9,
      textAlign: 'center'
    },
    colPrice: {
      flex: 1.1,
      textAlign: 'right'
    },
    colDisc: {
      flex: 0.7,
      textAlign: 'center'
    },
    colTax: {
      flex: 0.8,
      textAlign: 'center'
    },
    colTotal: {
      flex: 1.2,
      textAlign: 'right'
    },
    thTotal: {
      fontSize: 9.5,
      fontFamily: B,
      color: PRIMARY,
      textAlign: 'right'
    },
    tdTotal: {
      fontSize: 9,
      color: PRIMARY,
      textAlign: 'right',
      fontFamily: M
    },
    totalsBox: {
      marginTop: 12,
      alignItems: 'flex-end',
      paddingRight: 4
    },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginBottom: 4
    },
    totalLabel: {
      fontSize: 9,
      color: '#000',
      width: 80,
      textAlign: 'right',
      paddingRight: 8
    },
    totalVal: {
      fontSize: 9,
      fontFamily: M,
      width: 80,
      textAlign: 'right',
      color: PRIMARY
    },
    grandTotalLabel: {
      fontSize: 11,
      fontFamily: B,
      width: 80,
      textAlign: 'right',
      paddingRight: 8,
      color: '#000',
      marginTop: 4
    },
    grandTotalVal: {
      fontSize: 11,
      fontFamily: B,
      width: 80,
      textAlign: 'right',
      color: PRIMARY,
      marginTop: 4
    },
    infoBlock: {
      flexDirection: 'row',
      marginTop: 30,
      justifyContent: 'space-between'
    },
    infoCol: {
      width: '45%'
    },
    infoTitle: {
      fontFamily: B,
      fontSize: 10,
      textTransform: 'uppercase',
      marginBottom: 6,
      paddingBottom: 4,
      borderBottom: `1pt solid ${PRIMARY}`
    },
    infoText: {
      fontSize: 9,
      color: '#333',
      marginBottom: 3,
      lineHeight: 1.4
    },
    footerBox: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 40,
      backgroundColor: PRIMARY,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 30
    },
    footerText: {
      fontSize: 8.5,
      color: '#FFF'
    }
  });
  const currency = invoice._currency || invoice.currency || 'INR';
  const fmt = n => new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    currencyDisplay: 'code'
  }).format(n || 0).replace(currency, '').trim();
  const bizName = biz?.businessName || biz?.name || '';
  const isQuotation = invoice.invoiceType === 'quotation';
  const docTitle = isQuotation ? 'QUOTATION' : 'INVOICE';
  const showCGST = invoice.cgstTotal > 0;
  const showSGST = invoice.sgstTotal > 0;
  const showIGST = invoice.igstTotal > 0;
  const showVAT = invoice.vatTotal > 0;
  const hasTax = showCGST || showSGST || showIGST || showVAT;
  const hasHsn = invoice.items?.some(i => i.hsn);
  const hasDiscount = invoice.items?.some(i => i.discount > 0);
  return /*#__PURE__*/_react.default.createElement(_renderer.Document, null, /*#__PURE__*/_react.default.createElement(_renderer.Page, {
    size: "A4",
    style: s.page
  }, /*#__PURE__*/_react.default.createElement(_renderer.View, {
    style: s.topSection
  }, /*#__PURE__*/_react.default.createElement(_renderer.View, null, /*#__PURE__*/_react.default.createElement(_renderer.Text, {
    style: s.headerText
  }, docTitle)), /*#__PURE__*/_react.default.createElement(_renderer.View, {
    style: s.bizInfoTop
  }, biz?.businessLogo && /*#__PURE__*/_react.default.createElement(_renderer.Image, {
    style: s.topLogo,
    src: biz.businessLogo
  }), /*#__PURE__*/_react.default.createElement(_renderer.Text, {
    style: s.bizNameTop
  }, bizName), biz?.address?.street && /*#__PURE__*/_react.default.createElement(_renderer.Text, {
    style: s.bizSubText
  }, biz.address.street), biz?.address?.city && /*#__PURE__*/_react.default.createElement(_renderer.Text, {
    style: s.bizSubText
  }, biz.address.city, ", ", biz.address.state, " ", biz.address.pincode), biz?.gstin && /*#__PURE__*/_react.default.createElement(_renderer.Text, {
    style: [s.bizSubText, {
      color: PRIMARY,
      fontFamily: B
    }]
  }, "GSTIN: ", biz.gstin))), /*#__PURE__*/_react.default.createElement(_renderer.View, {
    style: s.blueBar
  }), /*#__PURE__*/_react.default.createElement(_renderer.View, {
    style: s.detailsRow
  }, /*#__PURE__*/_react.default.createElement(_renderer.View, {
    style: s.detailsCol
  }, /*#__PURE__*/_react.default.createElement(_renderer.Text, {
    style: s.detailsLabel
  }, isQuotation ? 'Quotation No' : 'Invoice No'), /*#__PURE__*/_react.default.createElement(_renderer.Text, {
    style: s.detailsValue
  }, invoice.invoiceNumber || invoice.quotationNumber)), /*#__PURE__*/_react.default.createElement(_renderer.View, {
    style: s.detailsCol
  }, /*#__PURE__*/_react.default.createElement(_renderer.Text, {
    style: s.detailsLabel
  }, "Date of Issue"), /*#__PURE__*/_react.default.createElement(_renderer.Text, {
    style: s.detailsValue
  }, new Date(invoice.issueDate).toLocaleDateString())), /*#__PURE__*/_react.default.createElement(_renderer.View, {
    style: s.detailsCol
  }, /*#__PURE__*/_react.default.createElement(_renderer.Text, {
    style: s.detailsLabel
  }, "Due Date"), /*#__PURE__*/_react.default.createElement(_renderer.Text, {
    style: s.detailsValue
  }, invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'Upon Receipt'))), /*#__PURE__*/_react.default.createElement(_renderer.View, {
    style: s.container
  }, /*#__PURE__*/_react.default.createElement(_renderer.View, {
    style: s.infoBlock
  }, /*#__PURE__*/_react.default.createElement(_renderer.View, {
    style: s.infoCol
  }, /*#__PURE__*/_react.default.createElement(_renderer.Text, {
    style: s.infoTitle
  }, "Billed To"), /*#__PURE__*/_react.default.createElement(_renderer.Text, {
    style: [s.infoText, {
      fontFamily: B
    }]
  }, client?.name), client?.address?.street && /*#__PURE__*/_react.default.createElement(_renderer.Text, {
    style: s.infoText
  }, client.address.street), client?.address?.city && /*#__PURE__*/_react.default.createElement(_renderer.Text, {
    style: s.infoText
  }, client.address.city, ", ", client.address.state, " ", client.address.pincode), client?.phone && /*#__PURE__*/_react.default.createElement(_renderer.Text, {
    style: s.infoText
  }, client.phone)), /*#__PURE__*/_react.default.createElement(_renderer.View, {
    style: s.infoCol
  }, /*#__PURE__*/_react.default.createElement(_renderer.Text, {
    style: s.infoTitle
  }, "Payment Details"), !isQuotation && biz?.bankDetails?.accountNumber ? /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, biz.bankDetails.bankName && /*#__PURE__*/_react.default.createElement(_renderer.Text, {
    style: s.infoText
  }, "Bank: ", biz.bankDetails.bankName), /*#__PURE__*/_react.default.createElement(_renderer.Text, {
    style: s.infoText
  }, "Account: ", biz.bankDetails.accountNumber), biz.bankDetails.ifscCode && /*#__PURE__*/_react.default.createElement(_renderer.Text, {
    style: s.infoText
  }, "IFSC: ", biz.bankDetails.ifscCode)) : /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, invoice.paymentInfo && /*#__PURE__*/_react.default.createElement(_renderer.Text, {
    style: s.infoText
  }, invoice.paymentInfo)))), /*#__PURE__*/_react.default.createElement(_renderer.View, {
    style: s.table
  }, /*#__PURE__*/_react.default.createElement(_renderer.View, {
    style: s.tHeadRow
  }, /*#__PURE__*/_react.default.createElement(_renderer.Text, {
    style: [s.th, s.colNo]
  }, "#"), /*#__PURE__*/_react.default.createElement(_renderer.Text, {
    style: [s.th, s.colDesc]
  }, "Description"), hasHsn && /*#__PURE__*/_react.default.createElement(_renderer.Text, {
    style: [s.th, s.colHsn]
  }, "HSN"), /*#__PURE__*/_react.default.createElement(_renderer.Text, {
    style: [s.th, s.colQty]
  }, "Qty"), /*#__PURE__*/_react.default.createElement(_renderer.Text, {
    style: [s.th, s.colPrice]
  }, "Price"), hasDiscount && /*#__PURE__*/_react.default.createElement(_renderer.Text, {
    style: [s.th, s.colDisc]
  }, "Disc%"), showCGST && /*#__PURE__*/_react.default.createElement(_renderer.Text, {
    style: [s.th, s.colTax]
  }, "CGST"), showSGST && /*#__PURE__*/_react.default.createElement(_renderer.Text, {
    style: [s.th, s.colTax]
  }, "SGST"), showIGST && /*#__PURE__*/_react.default.createElement(_renderer.Text, {
    style: [s.th, s.colTax]
  }, "IGST"), showVAT && /*#__PURE__*/_react.default.createElement(_renderer.Text, {
    style: [s.th, s.colTax]
  }, "VAT"), /*#__PURE__*/_react.default.createElement(_renderer.Text, {
    style: [s.thTotal, s.colTotal]
  }, "Total")), invoice.items?.map((item, i) => /*#__PURE__*/_react.default.createElement(_renderer.View, {
    key: i,
    style: s.tRow
  }, /*#__PURE__*/_react.default.createElement(_renderer.Text, {
    style: [s.td, s.colNo]
  }, i + 1), /*#__PURE__*/_react.default.createElement(_renderer.View, {
    style: [s.td, s.colDesc, {
      paddingRight: 10
    }]
  }, /*#__PURE__*/_react.default.createElement(_renderer.Text, {
    style: {
      fontFamily: B
    }
  }, item.name), item.description && /*#__PURE__*/_react.default.createElement(_renderer.Text, {
    style: {
      fontSize: 7.5,
      color: '#555',
      marginTop: 2
    }
  }, item.description)), hasHsn && /*#__PURE__*/_react.default.createElement(_renderer.Text, {
    style: [s.td, s.colHsn]
  }, item.hsn || '—'), /*#__PURE__*/_react.default.createElement(_renderer.Text, {
    style: [s.td, s.colQty]
  }, item.quantity, item.unit ? ` ${item.unit}` : ''), /*#__PURE__*/_react.default.createElement(_renderer.Text, {
    style: [s.td, s.colPrice]
  }, fmt(item.price)), hasDiscount && /*#__PURE__*/_react.default.createElement(_renderer.Text, {
    style: [s.td, s.colDisc]
  }, item.discount || 0, "%"), showCGST && /*#__PURE__*/_react.default.createElement(_renderer.Text, {
    style: [s.td, s.colTax]
  }, item.cgstRate || 0, "%"), showSGST && /*#__PURE__*/_react.default.createElement(_renderer.Text, {
    style: [s.td, s.colTax]
  }, item.sgstRate || 0, "%"), showIGST && /*#__PURE__*/_react.default.createElement(_renderer.Text, {
    style: [s.td, s.colTax]
  }, item.igstRate || 0, "%"), showVAT && /*#__PURE__*/_react.default.createElement(_renderer.Text, {
    style: [s.td, s.colTax]
  }, item.vatRate || 0, "%"), /*#__PURE__*/_react.default.createElement(_renderer.Text, {
    style: [s.tdTotal, s.colTotal]
  }, fmt(item.total))))), /*#__PURE__*/_react.default.createElement(_renderer.View, {
    style: s.totalsBox
  }, /*#__PURE__*/_react.default.createElement(_renderer.View, {
    style: s.totalRow
  }, /*#__PURE__*/_react.default.createElement(_renderer.Text, {
    style: s.totalLabel
  }, "Subtotal"), /*#__PURE__*/_react.default.createElement(_renderer.Text, {
    style: s.totalVal
  }, fmt(invoice.subtotal))), invoice.discountAmount > 0 && /*#__PURE__*/_react.default.createElement(_renderer.View, {
    style: s.totalRow
  }, /*#__PURE__*/_react.default.createElement(_renderer.Text, {
    style: s.totalLabel
  }, "Discount"), /*#__PURE__*/_react.default.createElement(_renderer.Text, {
    style: s.totalVal
  }, "-", fmt(invoice.discountAmount))), showCGST && /*#__PURE__*/_react.default.createElement(_renderer.View, {
    style: s.totalRow
  }, /*#__PURE__*/_react.default.createElement(_renderer.Text, {
    style: s.totalLabel
  }, "CGST"), /*#__PURE__*/_react.default.createElement(_renderer.Text, {
    style: s.totalVal
  }, fmt(invoice.cgstTotal))), showSGST && /*#__PURE__*/_react.default.createElement(_renderer.View, {
    style: s.totalRow
  }, /*#__PURE__*/_react.default.createElement(_renderer.Text, {
    style: s.totalLabel
  }, "SGST"), /*#__PURE__*/_react.default.createElement(_renderer.Text, {
    style: s.totalVal
  }, fmt(invoice.sgstTotal))), showIGST && /*#__PURE__*/_react.default.createElement(_renderer.View, {
    style: s.totalRow
  }, /*#__PURE__*/_react.default.createElement(_renderer.Text, {
    style: s.totalLabel
  }, "IGST"), /*#__PURE__*/_react.default.createElement(_renderer.Text, {
    style: s.totalVal
  }, fmt(invoice.igstTotal))), showVAT && /*#__PURE__*/_react.default.createElement(_renderer.View, {
    style: s.totalRow
  }, /*#__PURE__*/_react.default.createElement(_renderer.Text, {
    style: s.totalLabel
  }, "VAT"), /*#__PURE__*/_react.default.createElement(_renderer.Text, {
    style: s.totalVal
  }, fmt(invoice.vatTotal))), /*#__PURE__*/_react.default.createElement(_renderer.View, {
    style: s.totalRow
  }, /*#__PURE__*/_react.default.createElement(_renderer.Text, {
    style: s.grandTotalLabel
  }, "Total ", currency), /*#__PURE__*/_react.default.createElement(_renderer.Text, {
    style: s.grandTotalVal
  }, fmt(invoice.total)))), invoice.notes && /*#__PURE__*/_react.default.createElement(_renderer.View, {
    style: {
      marginTop: 20
    }
  }, /*#__PURE__*/_react.default.createElement(_renderer.Text, {
    style: {
      fontSize: 9,
      fontFamily: B
    }
  }, "Notes"), /*#__PURE__*/_react.default.createElement(_renderer.Text, {
    style: {
      fontSize: 8.5,
      color: '#000',
      marginTop: 4
    }
  }, invoice.notes)), invoice.termsAndConditions && /*#__PURE__*/_react.default.createElement(_renderer.View, {
    style: {
      marginTop: 15
    }
  }, /*#__PURE__*/_react.default.createElement(_renderer.Text, {
    style: {
      fontSize: 9,
      fontFamily: B
    }
  }, "Terms & Conditions"), /*#__PURE__*/_react.default.createElement(_renderer.Text, {
    style: {
      fontSize: 8,
      color: '#444',
      marginTop: 4,
      lineHeight: 1.4
    }
  }, invoice.termsAndConditions))), /*#__PURE__*/_react.default.createElement(_renderer.View, {
    style: {
      marginTop: 16,
      alignItems: 'flex-end',
      paddingHorizontal: 40
    }
  }, biz?.businessSignature && /*#__PURE__*/_react.default.createElement(_renderer.Image, {
    src: biz.businessSignature,
    style: {
      width: 160,
      height: 55,
      objectFit: 'contain',
      marginBottom: 4
    }
  }), /*#__PURE__*/_react.default.createElement(_renderer.View, {
    style: {
      width: 120,
      borderTopWidth: 0.5,
      borderTopColor: '#1a3a6b',
      borderTopStyle: 'solid',
      paddingTop: 4
    }
  }, /*#__PURE__*/_react.default.createElement(_renderer.Text, {
    style: {
      fontSize: 8,
      color: '#1a3a6b',
      textAlign: 'center'
    }
  }, "Authorised Signature"))), (biz?.phone || biz?.email) && /*#__PURE__*/_react.default.createElement(_renderer.View, {
    style: s.footerBox,
    fixed: true
  }, biz?.phone && /*#__PURE__*/_react.default.createElement(_renderer.Text, {
    style: s.footerText
  }, "Phone: ", biz.phone), biz?.email && /*#__PURE__*/_react.default.createElement(_renderer.Text, {
    style: s.footerText
  }, "Email: ", biz.email))));
}