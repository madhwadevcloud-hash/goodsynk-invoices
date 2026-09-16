import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { buildScaledStyles } from './Pdfheaderscaling';
import { isRasterImage } from './watermarkUtils';

// Register fonts
Font.register({ family: 'Inter', src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYMZhrib2Bg-4.ttf' });
Font.register({ family: 'Inter-SemiBold', src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYMZhrib2Bg-4.ttf' });
Font.register({ family: 'Inter-Bold', src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYMZhrib2Bg-4.ttf' });
Font.registerHyphenationCallback(word => [word]);

const B = 'Inter-Bold';
const M = 'Inter-SemiBold';

// Constants declared BEFORE StyleSheet uses them
const BLACK = '#000000';
const WHITE = '#FFFFFF';
const GRAY = '#555555';
const LIGHT_GRAY = '#AAAAAA';

// Thermal receipt width: 80mm = 226.77 points
const PAGE_WIDTH = 226.77;

const hexToRgba = (hex, alpha) => {
  if (!hex) return 'rgba(0, 0, 0, ' + alpha + ')';
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + alpha + ')';
};

export default function Template1({ invoice }) {
  const { client, user: biz } = invoice;
  const scaled = buildScaledStyles(biz);

  const s = StyleSheet.create({
    page: {
      width: PAGE_WIDTH,
      paddingTop: 12,
      paddingBottom: 12,
      paddingHorizontal: 10,
      fontFamily: 'Inter',
      color: BLACK,
      backgroundColor: WHITE,
    },

    // Company name
    companyName: {
      fontFamily: B,
      fontSize: 14,
      color: BLACK,
      textAlign: 'center',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    companyAddress: {
      fontSize: 6.5,
      color: BLACK,
      textAlign: 'center',
      lineHeight: 1.45,
    },
    gstinLine: {
      fontSize: 6.5,
      color: BLACK,
      textAlign: 'center',
      marginTop: 3,
      marginBottom: 4,
    },

    solidDivider: {
      borderBottomWidth: 0.5,
      borderBottomColor: BLACK,
      borderBottomStyle: 'solid',
      marginVertical: 4,
    },

    nameRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 2,
    },
    nameLabel: {
      fontSize: 7,
      color: BLACK,
    },
    nameValue: {
      fontSize: 7,
      color: BLACK,
      fontFamily: B,
    },

    dateRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 2,
    },
    dateLabel: {
      fontSize: 7,
      color: BLACK,
    },
    dateValue: {
      fontSize: 7,
      color: BLACK,
    },

    metaRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 2,
    },
    metaLabel: {
      fontSize: 7,
      color: BLACK,
    },
    metaValue: {
      fontSize: 7,
      fontFamily: B,
      color: BLACK,
    },

    tokenRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    tokenLabel: {
      fontSize: 7.5,
      fontFamily: B,
      color: BLACK,
    },

    tableHead: {
      flexDirection: 'row',
      borderBottomWidth: 0.5,
      borderBottomColor: BLACK,
      borderBottomStyle: 'solid',
      paddingBottom: 2,
      marginBottom: 3,
    },
    thItem: {
      width: '52%',
      fontSize: 7,
      color: BLACK,
      fontFamily: B,
    },
    thQty: {
      width: '12%',
      fontSize: 7,
      color: BLACK,
      fontFamily: B,
      textAlign: 'center',
    },
    thPrice: {
      width: '16%',
      fontSize: 7,
      color: BLACK,
      fontFamily: B,
      textAlign: 'right',
    },
    thAmount: {
      width: '20%',
      fontSize: 7,
      color: BLACK,
      fontFamily: B,
      textAlign: 'right',
    },

    tableRow: {
      flexDirection: 'row',
      marginBottom: 2,
    },
    tdItem: {
      width: '52%',
      fontSize: 7,
      color: BLACK,
    },
    tdQty: {
      width: '12%',
      fontSize: 7,
      color: BLACK,
      textAlign: 'center',
    },
    tdPrice: {
      width: '16%',
      fontSize: 7,
      color: BLACK,
      textAlign: 'right',
    },
    tdAmount: {
      width: '20%',
      fontSize: 7,
      color: BLACK,
      textAlign: 'right',
    },

    totalsRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginBottom: 2,
    },
    totalsLabel: {
      fontSize: 7,
      color: BLACK,
      width: 90,
      textAlign: 'right',
      paddingRight: 8,
    },
    totalsValue: {
      fontSize: 7,
      color: BLACK,
      width: 70,
      textAlign: 'right',
    },

    grandTotalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 4,
      paddingTop: 3,
      borderTopWidth: 1,
      borderTopColor: BLACK,
      borderTopStyle: 'solid',
    },
    grandTotalLabel: {
      fontSize: 10,
      fontFamily: B,
      color: BLACK,
    },
    grandTotalValue: {
      fontSize: 10,
      fontFamily: B,
      color: BLACK,
    },

    footerLine: {
      fontSize: 6.5,
      color: BLACK,
      textAlign: 'center',
      marginTop: 4,
      lineHeight: 1.4,
    },
    footerBold: {
      fontSize: 8,
      fontFamily: B,
      color: BLACK,
      textAlign: 'center',
      marginTop: 14,
      marginBottom: 4,
    },

    watermarkContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: -100,
    },
    watermarkImg: {
      width: 100,
      height: 100,
      objectFit: 'contain',
      opacity: 0.08,
    },
    watermarkText: {
      fontSize: 26,
      fontFamily: B,
      color: hexToRgba('#000000', 0.06),
      transform: 'rotate(-45deg)',
      letterSpacing: 2,
    },

    signatureImg: {
      width: 60,
      height: 25,
      objectFit: 'contain',
      alignSelf: 'flex-end',
      marginTop: 6,
    },
  });

  const fmt = (n) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);
  const fmtCurrency = (n) => `\u20B9${fmt(n)}`;

  const bizName = biz?.businessName || biz?.name || '';
  const isQuotation = invoice.invoiceType === 'quotation';

  const showCGST = invoice.cgstTotal > 0;
  const showSGST = invoice.sgstTotal > 0;
  const showIGST = invoice.igstTotal > 0;
  const showVAT = invoice.vatTotal > 0;

  const issueDate = invoice.issueDate ? new Date(invoice.issueDate) : null;
  const dateStr = issueDate ? issueDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '';
  const timeStr = issueDate ? issueDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : '';

  const totalQty = invoice.items?.reduce((a, i) => a + (i.quantity || 1), 0) || 0;

  return (
    <Document>
      <Page size={{ width: PAGE_WIDTH, height: 'auto' }} style={s.page}>
        {/* Watermark */}
        {(!biz?.plan || String(biz.plan).toLowerCase() === 'free') ? (
          <View style={s.watermarkContainer} fixed pointerEvents="none">
            <Text style={s.watermarkText}>GoodSynk</Text>
          </View>
        ) : isRasterImage(invoice.watermarkImage || biz.watermarkImage) ? (
          <View style={s.watermarkContainer} fixed pointerEvents="none">
            <Image src={invoice.watermarkImage || biz.watermarkImage} style={s.watermarkImg} />
          </View>
        ) : null}

        {/* Company Name */}
        <Text style={s.companyName}>{bizName || 'HOTEL'}</Text>

        {/* Address */}
        {(biz?.address?.street || biz?.address?.city) && (
          <Text style={s.companyAddress}>
            {biz.address.street ? `${biz.address.street},\n` : ''}
            {[biz.address.city, biz.address.state].filter(Boolean).join(', ')}
            {biz.address.pincode ? ` - ${biz.address.pincode}` : ''}
          </Text>
        )}

        {/* GSTIN */}
        {biz?.gstin && <Text style={s.gstinLine}>GST : {biz.gstin}</Text>}

        <View style={s.solidDivider} />

        {/* Name + Mobile */}
        <View style={s.nameRow}>
          <Text style={s.nameLabel}>Name: {client?.name || '—'}</Text>
          {client?.phone && <Text style={s.nameValue}>(M: {client.phone})</Text>}
        </View>

        {/* Date + Time */}
        <View style={s.dateRow}>
          <Text style={s.dateLabel}>Date: {dateStr}</Text>
          <Text style={s.dateValue}>{timeStr}</Text>
        </View>

        {/* Bill No */}
        <View style={s.metaRow}>
          <Text style={s.metaLabel}>
            {isQuotation ? 'Quotation No' : 'Bill No'}: <Text style={s.metaValue}>{invoice.invoiceNumber || invoice.quotationNumber || '—'}</Text>
          </Text>
        </View>

        {/* Token No */}
        <View style={s.tokenRow}>
          <Text style={s.tokenLabel}>Token No: {invoice.tokenNo || invoice.invoiceNumber || '—'}</Text>
        </View>

        <View style={s.solidDivider} />

        {/* Table Header */}
        <View style={s.tableHead}>
          <Text style={s.thItem}>Item</Text>
          <Text style={s.thQty}>Qty.</Text>
          <Text style={s.thPrice}>Price</Text>
          <Text style={s.thAmount}>Amount</Text>
        </View>

        {/* Table Rows */}
        {invoice.items?.map((item, i) => (
          <View key={i} style={s.tableRow}>
            <Text style={s.tdItem}>{item.name}</Text>
            <Text style={s.tdQty}>{item.quantity || 1}</Text>
            <Text style={s.tdPrice}>{fmt(item.price)}</Text>
            <Text style={s.tdAmount}>{fmt(item.total)}</Text>
          </View>
        ))}

        <View style={s.solidDivider} />

        {/* Total Qty + Subtotal */}
        <View style={s.totalsRow}>
          <Text style={s.totalsLabel}>Total Qty: {totalQty}</Text>
          <Text style={s.totalsValue}>Sub {fmtCurrency(invoice.subtotal)}</Text>
        </View>

        {/* Discount */}
        {invoice.discountAmount > 0 && (
          <View style={s.totalsRow}>
            <Text style={s.totalsLabel}>
              Discount {invoice.discountPercent ? `${invoice.discountPercent}%` : ''}
            </Text>
            <Text style={s.totalsValue}>({fmtCurrency(invoice.discountAmount)})</Text>
          </View>
        )}

        {/* CGST */}
        {showCGST && (
          <View style={s.totalsRow}>
            <Text style={s.totalsLabel}>CGST {invoice.cgstRate ? `${invoice.cgstRate}%` : ''}</Text>
            <Text style={s.totalsValue}>{fmtCurrency(invoice.cgstTotal)}</Text>
          </View>
        )}

        {/* SGST */}
        {showSGST && (
          <View style={s.totalsRow}>
            <Text style={s.totalsLabel}>SGST {invoice.sgstRate ? `${invoice.sgstRate}%` : ''}</Text>
            <Text style={s.totalsValue}>{fmtCurrency(invoice.sgstTotal)}</Text>
          </View>
        )}

        {/* IGST */}
        {showIGST && (
          <View style={s.totalsRow}>
            <Text style={s.totalsLabel}>IGST {invoice.igstRate ? `${invoice.igstRate}%` : ''}</Text>
            <Text style={s.totalsValue}>{fmtCurrency(invoice.igstTotal)}</Text>
          </View>
        )}

        {/* VAT */}
        {showVAT && (
          <View style={s.totalsRow}>
            <Text style={s.totalsLabel}>VAT {invoice.vatRate ? `${invoice.vatRate}%` : ''}</Text>
            <Text style={s.totalsValue}>{fmtCurrency(invoice.vatTotal)}</Text>
          </View>
        )}

        {/* Grand Total */}
        <View style={s.grandTotalRow}>
          <Text style={s.grandTotalLabel}>Grand Total</Text>
          <Text style={s.grandTotalValue}>{fmtCurrency(invoice.total)}</Text>
        </View>

        <View style={s.solidDivider} />

        {/* Signature */}
        {biz?.businessSignature && (
          <Image src={biz.businessSignature} style={s.signatureImg} />
        )}

        {/* Footer lines */}
        {biz?.fssai && <Text style={s.footerLine}>FSSAI Lic No. {biz.fssai}</Text>}
        {invoice.notes && <Text style={s.footerLine}>{invoice.notes}</Text>}

        {/* Thank you */}
        <Text style={s.footerBold}>Thank You Visit Again!!!</Text>
      </Page>
    </Document>
  );
}
