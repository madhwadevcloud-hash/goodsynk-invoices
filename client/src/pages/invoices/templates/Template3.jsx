import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image, Link } from '@react-pdf/renderer';
import { buildScaledStyles } from './Pdfheaderscaling';
Font.register({ family: 'Inter', src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYMZhrib2Bg-4.ttf' });
Font.register({ family: 'Inter-SemiBold', src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYMZhrib2Bg-4.ttf' });
Font.register({ family: 'Inter-Bold', src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYMZhrib2Bg-4.ttf' });
Font.registerHyphenationCallback(word => [word]);

const B = 'Inter-Bold';
const M = 'Inter-SemiBold';


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

export default function Template3({ invoice }) {
  const { client, user: biz } = invoice;
  const colors = invoice.templateColors || { primary: '#1B365D', secondary: '#F0F4F8' };
  const DARK_BLUE = colors.primary;
  const LIGHT_BLUE = colors.secondary;
  const scaled = buildScaledStyles(biz);

  const s = StyleSheet.create({
    page: { paddingBottom: 110, fontFamily: 'Inter', color: '#000' },

    headerBlock: { backgroundColor: DARK_BLUE, paddingTop: 30, paddingBottom: 25, paddingHorizontal: 40, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    headerLeft: { width: scaled.bizInfoMaxWidth },
    logoImage: { height: scaled.logoHeight, maxWidth: 140, objectFit: 'contain', marginBottom: 8 },
    bizNameText: { color: '#FFF', fontFamily: B, fontSize: scaled.bizNameFontSize, textTransform: 'uppercase' },
    bizInfoText: { color: '#FFF', fontSize: scaled.bizSubTextFontSize, marginTop: 2, lineHeight: scaled.bizSubTextLineHeight, opacity: 0.85 },
    invoiceTitle: { color: '#FFF', fontFamily: B, fontSize: 26, letterSpacing: 2, marginTop: 10 },

    separator: { width: '100%', height: 1, backgroundColor: '#EEE' },
    detailsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 40, paddingVertical: 15, marginBottom: 10 },
    detailsItem: { flex: 1 },
    detailsLabel: { fontSize: 7.5, fontFamily: B, color: '#666', textTransform: 'uppercase', marginBottom: 2 },
    detailsValue: { fontSize: 9.5, color: '#000' },

    metaGrid: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 40, marginBottom: 20 },
    metaColumn: { width: '45%' },
    metaLabel: { fontSize: 8.5, color: '#444', marginBottom: 6, textTransform: 'uppercase', fontFamily: B, borderBottom: '0.5pt solid #DDD', paddingBottom: 3 },
    billToName: { fontSize: 11, fontFamily: B, color: DARK_BLUE, marginBottom: 2 },
    billToText: { fontSize: 9, color: '#444', lineHeight: 1.4 },

    tableWrap: { paddingHorizontal: 40 },
    tHead: { flexDirection: 'row', backgroundColor: DARK_BLUE, color: '#FFF', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 4 },
    th: { fontSize: 9.5, fontFamily: B },

    tRow: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 15, borderBottom: '1pt solid #EEE' },
    td: { fontSize: 9, color: '#000' },

    colNo: { flex: 0.4 },
    colDesc: { flex: 2.2 },
    colHsn: { flex: 0.8, textAlign: 'center' },
    colPrice: { flex: 1.1, textAlign: 'right' },
    colQty: { flex: 0.9, textAlign: 'center' },
    colDisc: { flex: 0.7, textAlign: 'center' },
    colTax: { flex: 0.8, textAlign: 'center' },
    colTotal: { flex: 1.2, textAlign: 'right' },

    bottomSection: { flexDirection: 'row', paddingHorizontal: 40, marginTop: 30 },
    leftBottom: { width: '60%', paddingRight: 40 },
    rightBottom: { width: '40%' },

    totalsBox: { backgroundColor: LIGHT_BLUE, padding: 15, borderRadius: 6 },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    totalLabel: { fontSize: 9, color: '#222' },
    totalVal: { fontSize: 9.5, fontFamily: M, color: '#000' },

    grandTotalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTop: '1pt solid #DDD' },
    grandTotalLabel: { fontSize: 11, fontFamily: B, color: DARK_BLUE },
    grandTotalVal: { fontSize: 11, fontFamily: B, color: DARK_BLUE },

    paymentTitle: { fontSize: 10, fontFamily: B, color: DARK_BLUE, marginBottom: 6 },
    paymentText: { fontSize: 9, color: '#000', marginBottom: 3 },

    footerBox: { position: 'absolute', bottom: 15, left: 40, right: 40, borderTopWidth: 1, borderTopColor: '#E0E0E0', borderTopStyle: 'solid', flexDirection: 'column', paddingTop: 8, alignItems: 'center', justifyContent: 'center' },
    footerTopRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
    footerDot: { fontSize: 7, color: '#999', marginHorizontal: 8 },
    footerBrandPill: { backgroundColor: hexToRgba(DARK_BLUE, 0.08), borderRadius: 10, paddingHorizontal: 8, paddingVertical: 1.5, marginHorizontal: 6 },
    footerBrandPillText: { fontSize: 8, fontFamily: B, color: DARK_BLUE, letterSpacing: 0.5 },
    footerText: { fontSize: 7.5, color: '#444' },
    footerBottomRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 },
    footerBrandLine: { fontSize: 6.5, color: '#666', textAlign: 'center' },
    footerLink: { fontSize: 6.5, fontFamily: B, color: DARK_BLUE, textDecoration: 'underline' },
    footerTagline: { fontSize: 6, color: '#666', marginHorizontal: 6 },
    footerTrustLine: { fontSize: 5.5, color: '#888', marginHorizontal: 6 },
    poweredByContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 2 },
    poweredByLabel: { fontSize: 5.5, color: '#888', letterSpacing: 0.5, marginRight: 3 },
    poweredByValue: { fontSize: 7.5, fontFamily: B, color: '#000', letterSpacing: 0.4 },
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
    watermarkText: {
      fontSize: 60,
      fontFamily: B,
      color: hexToRgba(DARK_BLUE, 0.08),
      transform: 'rotate(-45deg)',
      letterSpacing: 5,
    },
    poweredByContainer: { alignItems: 'center', marginTop: 6 },
    poweredByLabel: { fontSize: 6, color: hexToRgba('#FFF', 0.65), letterSpacing: 0.5 },
    poweredByValue: { fontSize: 9.5, fontFamily: B, color: '#FFF', letterSpacing: 0.5, marginTop: 1 },
  });

  const currency = invoice._currency || invoice.currency || 'INR';
  const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency, currencyDisplay: 'code' }).format(n || 0).replace(currency, '').trim();
  const bizName = biz?.businessName || biz?.name || '';
  const isQuotation = invoice.invoiceType === 'quotation';
  const docTitle = isQuotation ? 'QUOTATION' : 'INVOICE';

  const showCGST = invoice.cgstTotal > 0;
  const showSGST = invoice.sgstTotal > 0;
  const showIGST = invoice.igstTotal > 0;
  const showVAT = invoice.vatTotal > 0;
  const hasHsn = invoice.items?.some(i => i.hsn);
  const hasDiscount = invoice.items?.some(i => i.discount > 0);

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Watermark */}
        {biz?.plan !== 'premium' && (
          <View style={s.watermarkContainer} fixed pointerEvents="none">
            <Text style={s.watermarkText}>GoodSynk</Text>
          </View>
        )}

        {/* Header Block */}
        <View style={s.headerBlock}>
          <View style={s.headerLeft}>
            {biz?.businessLogo && <Image style={s.logoImage} src={biz.businessLogo} />}
            <Text style={s.bizNameText}>{bizName}</Text>
            <Text style={s.bizInfoText}>
              {biz?.address?.street && `${biz.address.street}\n`}
              {biz?.address?.city && `${biz.address.city}, ${biz.address.state} ${biz.address.pincode || ''}\n`}
              {biz?.gstin && `GSTIN: ${biz.gstin}`}
            </Text>
          </View>
          <View style={s.headerRight}>
            <Text style={s.invoiceTitle}>{isQuotation ? 'QUOTATION' : 'INVOICE'}</Text>
          </View>
        </View>

        {/* Separator & Details */}
        <View style={s.separator} />
        <View style={s.detailsRow}>
          <View style={s.detailsItem}>
            <Text style={s.detailsLabel}>{isQuotation ? 'Quotation No' : 'Invoice No'}</Text>
            <Text style={s.detailsValue} wrap={false}>{invoice.invoiceNumber || invoice.quotationNumber}</Text>
          </View>
          <View style={s.detailsItem}>
            <Text style={s.detailsLabel}>Date of Issue</Text>
            <Text style={s.detailsValue} wrap={false}>{new Date(invoice.issueDate).toLocaleDateString('en-US')}</Text>
          </View>
          <View style={s.detailsItem}>
            <Text style={s.detailsLabel}>Due Date</Text>
            <Text style={s.detailsValue} wrap={false}>{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-US') : 'Upon Receipt'}</Text>
          </View>
        </View>

        {/* Client & Payment Info Grid */}
        <View style={s.metaGrid}>
          <View style={s.metaColumn}>
            <Text style={s.metaLabel}>Billed To</Text>
            <Text style={s.billToName}>{client?.name}</Text>
            <Text style={s.billToText}>
              {client?.address?.street && `${client.address.street}\n`}
              {client?.address?.city && (
                <Text>
                  {client.address.city}, {client.address.state} {client.address.pincode || ''}{'\n'}
                </Text>
              )}
              {client?.phone && `Phone: ${client.phone}`}
            </Text>
          </View>

          <View style={s.metaColumn}>
            {isQuotation && (
              <>
                <Text style={s.metaLabel}>Payment Details</Text>
                {biz?.bankDetails?.accountNumber ? (
                  <View>
                    {biz.bankDetails.bankName && <Text style={s.billToText}>Bank: {biz.bankDetails.bankName}</Text>}
                    <Text style={s.billToText}>A/C Name: {biz.bankDetails.accountName}</Text>
                    <Text style={s.billToText}>A/C Number: {biz.bankDetails.accountNumber}</Text>
                    {biz.bankDetails.ifscCode && <Text style={s.billToText}>IFSC: {biz.bankDetails.ifscCode}</Text>}
                  </View>
                ) : (
                  <Text style={s.billToText}>{invoice.paymentInfo || '—'}</Text>
                )}
              </>
            )}
          </View>
        </View>

        {/* Table */}
        <View style={s.tableWrap}>
          <View style={s.tHead}>
            <Text style={[s.th, s.colNo]}>#</Text>
            <Text style={[s.th, s.colDesc, { paddingLeft: 10 }]}>Item Description</Text>
            {hasHsn && <Text style={[s.th, s.colHsn]}>HSN</Text>}
            <Text style={[s.th, s.colQty]}>Qty</Text>
            <Text style={[s.th, s.colPrice]}>Price</Text>
            {hasDiscount && <Text style={[s.th, s.colDisc]}>Disc%</Text>}
            {showCGST && <Text style={[s.th, s.colTax]}>CGST</Text>}
            {showSGST && <Text style={[s.th, s.colTax]}>SGST</Text>}
            {showIGST && <Text style={[s.th, s.colTax]}>IGST</Text>}
            {showVAT && <Text style={[s.th, s.colTax]}>VAT</Text>}
            <Text style={[s.th, s.colTotal]}>Total</Text>
          </View>
          {invoice.items?.map((item, i) => (
            <View key={i} style={s.tRow}>
              <Text style={[s.td, s.colNo]}>{i + 1}</Text>
              <View style={[s.colDesc, { paddingLeft: 10 }]}>
                <Text style={[s.td, { fontFamily: M }]}>{item.name}</Text>
                {item.description && <Text style={{ fontSize: 8, color: '#666', marginTop: 2 }}>{item.description}</Text>}
              </View>
              {hasHsn && <Text style={[s.td, s.colHsn]}>{item.hsn || '—'}</Text>}
              <Text style={[s.td, s.colQty]}>{item.itemType === 'Service' ? '-' : `${item.quantity}${item.unit ? ` ${item.unit}` : ''}`}</Text>
              <Text style={[s.td, s.colPrice]}>{fmt(item.price)}</Text>
              {hasDiscount && <Text style={[s.td, s.colDisc]}>{item.discount || 0}%</Text>}
              {showCGST && <Text style={[s.td, s.colTax]}>{item.cgstRate || 0}%</Text>}
              {showSGST && <Text style={[s.td, s.colTax]}>{item.sgstRate || 0}%</Text>}
              {showIGST && <Text style={[s.td, s.colTax]}>{item.igstRate || 0}%</Text>}
              {showVAT && <Text style={[s.td, s.colTax]}>{item.vatRate || 0}%</Text>}
              <Text style={[s.td, s.colTotal, { fontFamily: B }]}>{fmt(item.total)}</Text>
            </View>
          ))}
        </View>

        {/* Bottom Section */}
        <View style={s.bottomSection}>
          <View style={s.leftBottom}>
            {invoice.notes && (
              <View style={{ marginBottom: 15 }}>
                <Text style={s.paymentTitle}>Notes</Text>
                <Text style={s.paymentText}>{invoice.notes}</Text>
              </View>
            )}
            {invoice.termsAndConditions && (
              <View style={{ marginTop: 15 }}>
                <Text style={s.paymentTitle}>Terms & Conditions</Text>
                <Text style={s.paymentText}>{invoice.termsAndConditions}</Text>
              </View>
            )}
          </View>

          <View style={s.rightBottom}>
            <View style={s.totalsBox}>
              <View style={s.totalRow}><Text style={s.totalLabel}>Subtotal</Text><Text style={s.totalVal}>{fmt(invoice.subtotal)}</Text></View>
              {invoice.discountAmount > 0 && <View style={s.totalRow}><Text style={s.totalLabel}>Discount</Text><Text style={s.totalVal}>-{fmt(invoice.discountAmount)}</Text></View>}
              {invoice.taxTotal > 0 && <View style={s.totalRow}><Text style={s.totalLabel}>Tax</Text><Text style={s.totalVal}>{fmt(invoice.taxTotal)}</Text></View>}
              <View style={s.grandTotalRow}>
                <Text style={s.grandTotalLabel}>Total</Text>
                <Text style={s.grandTotalVal}>{currency} {fmt(invoice.total)}</Text>
              </View>
            </View>

            {/* Signature — bottom-right */}
            <View style={{ marginTop: 24, alignItems: 'flex-end' }}>
              {biz?.businessSignature && (
                <Image src={biz.businessSignature} style={{ width: 160, height: 55, objectFit: 'contain', marginBottom: 4 }} />
              )}
              <View style={{ width: 120, borderTopWidth: 0.5, borderTopColor: '#888', borderTopStyle: 'solid', paddingTop: 4 }}>
                <Text style={{ fontSize: 8, color: '#555', textAlign: 'center' }}>Authorised Signature</Text>
              </View>
            </View>

          </View>
        </View>

        {/* Footer: single horizontal strip with inline bullets */}
        <View style={s.footerBox} fixed>
          {/* Top row: contact | brand pill | contact */}
          <View style={s.footerTopRow}>
            {biz?.phone && <Text style={s.footerText}>Phone: {biz.phone}</Text>}
            <View style={s.footerBrandPill}>
              <Text style={s.footerBrandPillText}>GoodSynk</Text>
            </View>
            {biz?.email && <Text style={s.footerText}>Email: {biz.email}</Text>}
          </View>
          {/* Bottom row: tagline • brand • trust • link */}
          <View style={s.footerBottomRow}>
            <Text style={s.footerTagline}>Invoice Banega, Payment Badega.</Text>
            <Text style={s.footerDot}>•</Text>
            <Text style={s.footerBrandLine}>Goodsynk Billing — Simple Invoicing & Quotations</Text>
            <Text style={s.footerDot}>•</Text>
            <Text style={s.footerTrustLine}>Digitally signed document</Text>
            <Text style={s.footerDot}>•</Text>
            <Link style={s.footerLink} src="https://invoice.goodsynk.com">invoice.goodsynk.com</Link>
          </View>
          <View style={s.poweredByContainer}>
            <Text style={s.poweredByLabel}>Powered By</Text>
            <Text style={s.poweredByValue}>GoodSynk</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
