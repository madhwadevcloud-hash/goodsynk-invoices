import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
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

export default function Template5({ invoice }) {
  const { client, user: biz } = invoice;
  const colors = invoice.templateColors || { primary: '#0A66C2' };
  const BLUE = colors.primary;
  const scaled = buildScaledStyles(biz);

  const s = StyleSheet.create({
    page: { paddingTop: 32, paddingBottom: 75, paddingHorizontal: 40, fontFamily: 'Inter', color: '#000' },

    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
    headerLeft: { width: '50%' },
    headerRight: { width: '50%', alignItems: 'flex-end' },

    invoiceTitle: { fontFamily: B, fontSize: 24, color: BLUE, textTransform: 'uppercase', letterSpacing: 1 },
    logoImage: { height: scaled.logoHeight, maxWidth: 130, objectFit: 'contain' },

    bizInfo: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 },
    bizText: { fontSize: scaled.bizSubTextFontSize, color: '#444', textAlign: 'right', lineHeight: scaled.bizSubTextLineHeight },
    bizName: { fontSize: scaled.bizNameFontSize, fontFamily: B, color: '#000', marginBottom: 2, textAlign: 'right' },

    metaSection: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, borderTop: `2pt solid ${BLUE}`, paddingTop: 8 },
    metaCol: { width: '45%' },
    metaLabel: { fontSize: 7.5, fontFamily: B, textTransform: 'uppercase', color: '#777', marginBottom: 4 },
    metaVal: { fontSize: 9, color: '#222', lineHeight: 1.3 },

    table: { width: '100%', marginBottom: 10 },
    tHead: { flexDirection: 'row', backgroundColor: BLUE, color: '#FFF', paddingVertical: 6, paddingHorizontal: 10 },
    th: { fontSize: 8.5, fontFamily: B, textTransform: 'uppercase' },
    tRow: { flexDirection: 'row', paddingVertical: 6, paddingHorizontal: 10, borderBottom: '1pt solid #EEE' },
    td: { fontSize: 9, color: '#000' },

    colNo: { flex: 0.4 },
    colDesc: { flex: 2.2 },
    colHsn: { flex: 0.8, textAlign: 'center' },
    colPrice: { flex: 1.1, textAlign: 'right' },
    colQty: { flex: 0.9, textAlign: 'center' },
    colDisc: { flex: 0.7, textAlign: 'center' },
    colTax: { flex: 0.8, textAlign: 'center' },
    colTotal: { flex: 1.2, textAlign: 'right' },

    bottomSection: { flexDirection: 'row', justifyContent: 'space-between' },
    leftBottom: { width: '55%' },
    rightBottom: { width: '40%' },

    calcRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
    calcLabel: { fontSize: 9, color: '#444' },
    calcVal: { fontSize: 9.5, fontFamily: M, color: '#000' },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, paddingTop: 7, borderTop: `2pt solid ${BLUE}` },
    grandTotalLabel: { fontSize: 10, fontFamily: B, color: BLUE },
    grandTotalVal: { fontSize: 10, fontFamily: B, color: BLUE },

    footerBox: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: BLUE, flexDirection: 'row', alignItems: 'center', minHeight: 50, paddingHorizontal: 0 },
    footerSegmentA: { flex: 1.2, paddingHorizontal: 14, paddingVertical: 8, justifyContent: 'center' },
    footerVRule: { width: 1, backgroundColor: hexToRgba('#FFF', 0.2), alignSelf: 'stretch', marginVertical: 8 },
    footerSegmentB: { flex: 2, paddingHorizontal: 16, paddingVertical: 8, justifyContent: 'center', alignItems: 'center' },
    footerSegmentC: { flex: 1.2, paddingHorizontal: 14, paddingVertical: 8, justifyContent: 'center', alignItems: 'flex-end' },
    footerSectionTitle: { fontSize: 5.5, fontFamily: B, color: hexToRgba('#FFF', 0.5), letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 3 },
    footerText: { fontSize: 7.5, color: '#FFF', marginBottom: 2 },
    footerBrandName: { fontSize: 11, fontFamily: B, color: '#F2C94C', letterSpacing: 1 },
    footerBrandLine: { fontSize: 6.5, color: hexToRgba('#FFF', 0.75), marginTop: 2, textAlign: 'center' },
    footerTagline: { fontSize: 6.5, fontFamily: B, color: hexToRgba('#FFF', 0.85), marginTop: 3, textAlign: 'center' },
    footerLink: { fontSize: 6.5, fontFamily: B, color: '#F2C94C', textAlign: 'right', marginTop: 2 },
    footerTrustLine: { fontSize: 5.5, color: hexToRgba('#FFF', 0.5), textAlign: 'right', lineHeight: 1.5 },
    poweredByContainer: { alignItems: 'center', marginTop: 3 },
    poweredByLabel: { fontSize: 5.5, color: hexToRgba('#FFF', 0.5), letterSpacing: 0.5 },
    poweredByValue: { fontSize: 8, fontFamily: B, color: '#FFF', letterSpacing: 0.5, marginTop: 1 },
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
      color: hexToRgba(BLUE, 0.08),
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

  const showCGST = invoice.cgstTotal > 0;
  const showSGST = invoice.sgstTotal > 0;
  const showIGST = invoice.igstTotal > 0;
  const showVAT = invoice.vatTotal > 0;
  const hasTax = showCGST || showSGST || showIGST || showVAT;
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

        {/* Header */}
        <View style={s.headerTop}>
          <View style={s.headerLeft}>
            <Text style={s.invoiceTitle}>{isQuotation ? 'QUOTATION' : 'INVOICE'}</Text>
            <View style={{ marginTop: 20 }}>
              <Text style={s.metaLabel}>{isQuotation ? 'Quotation No' : 'Invoice No'}</Text>
              <Text style={[s.metaVal, { fontFamily: B, marginBottom: 10 }]}>{invoice.invoiceNumber || invoice.quotationNumber}</Text>

              <Text style={s.metaLabel}>Date of Issue</Text>
              <Text style={[s.metaVal, { marginBottom: 10 }]}>{new Date(invoice.issueDate).toLocaleDateString('en-US')}</Text>

              <Text style={s.metaLabel}>Due Date</Text>
              <Text style={s.metaVal}>{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-US') : 'Upon Receipt'}</Text>
            </View>
          </View>

          <View style={s.headerRight}>
            {biz?.businessLogo && <Image style={s.logoImage} src={biz.businessLogo} />}
            <View style={s.bizInfo}>
              <View style={{ width: '100%' }}>
                <Text style={s.bizName}>{bizName}</Text>
                <Text style={s.bizText}>
                  {biz?.address?.street && `${biz.address.street}\n`}
                  {biz?.address?.city && `${biz.address.city}, ${biz.address.state} ${biz.address.pincode || ''}\n`}
                  {biz?.email && `${biz.email}\n`}
                  {biz?.phone && `${biz.phone}`}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Billed To */}
        <View style={s.metaSection}>
          <View style={s.metaCol}>
            <Text style={s.metaLabel}>Billed To:</Text>
            <Text style={[s.metaVal, { fontFamily: B, marginBottom: 4 }]}>{client?.name}</Text>
            <Text style={s.metaVal}>
              {client?.address?.street && `${client.address.street}\n`}
              {client?.address?.city && `${client.address.city}, ${client.address.state}\n`}
              {client?.email && `${client.email}\n`}
              {client?.phone && `${client.phone}`}
            </Text>
          </View>

          {isQuotation && (
            <View style={s.metaCol}>
              <Text style={s.metaLabel}>Payment Information</Text>
              {biz?.bankDetails?.accountNumber ? (
                <Text style={s.metaVal}>
                  {biz.bankDetails.bankName && `Bank: ${biz.bankDetails.bankName}\n`}
                  Account Name: {biz.bankDetails.accountName}{'\n'}
                  Account No.: {biz.bankDetails.accountNumber}{'\n'}
                  {biz.bankDetails.ifscCode && `IFSC: ${biz.bankDetails.ifscCode}`}
                </Text>
              ) : invoice.paymentInfo ? (
                <Text style={s.metaVal}>{invoice.paymentInfo}</Text>
              ) : null}
            </View>
          )}
        </View>

        {/* Table */}
        <View style={s.table}>
          <View style={s.tHead}>
            <Text style={[s.th, s.colNo]}>#</Text>
            <Text style={[s.th, s.colDesc, { paddingLeft: 10 }]}>Description</Text>
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
                <Text style={s.metaLabel}>Notes</Text>
                <Text style={s.metaVal}>{invoice.notes}</Text>
              </View>
            )}
            {invoice.termsAndConditions && (
              <View>
                <Text style={s.metaLabel}>Terms & Conditions</Text>
                <Text style={s.metaVal}>{invoice.termsAndConditions}</Text>
              </View>
            )}
          </View>

          <View style={s.rightBottom}>
            <View style={s.calcRow}><Text style={s.calcLabel}>Subtotal</Text><Text style={s.calcVal}>{fmt(invoice.subtotal)}</Text></View>
            {invoice.discountAmount > 0 && <View style={s.calcRow}><Text style={s.calcLabel}>Discount</Text><Text style={s.calcVal}>-{fmt(invoice.discountAmount)}</Text></View>}
            {invoice.taxTotal > 0 && <View style={s.calcRow}><Text style={s.calcLabel}>Tax</Text><Text style={s.calcVal}>{fmt(invoice.taxTotal)}</Text></View>}
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Total</Text>
              <Text style={s.totalVal}>{currency} {fmt(invoice.total)}</Text>
            </View>
          </View>
        </View>

        {/* Signature */}
        <View style={{ marginTop: 30, alignItems: 'flex-end' }}>
          {biz?.businessSignature && (
            <Image src={biz.businessSignature} style={{ width: 160, height: 55, objectFit: 'contain', marginBottom: 4 }} />
          )}
          <View style={{ width: 120, borderTopWidth: 2, borderTopColor: '#0A66C2', borderTopStyle: 'solid', paddingTop: 4 }}>
            <Text style={{ fontSize: 8, color: '#0A66C2', textAlign: 'center' }}>Authorised Signature</Text>
          </View>
        </View>

        {/* Footer: 3-segment edge-to-edge strip */}
        <View style={s.footerBox} fixed>
          {/* Segment A — Contact */}
          <View style={s.footerSegmentA}>
            <Text style={s.footerSectionTitle}>Contact</Text>
            {biz?.phone && <Text style={s.footerText}>{biz.phone}</Text>}
            {biz?.email && <Text style={s.footerText}>{biz.email}</Text>}
          </View>
          <View style={s.footerVRule} />
          {/* Segment B — Brand */}
          <View style={s.footerSegmentB}>
            <Text style={s.footerBrandName}>GoodSynk</Text>
            <Text style={s.footerBrandLine}>Goodsynk Billing • Simple Invoicing & Quotations</Text>
            <Text style={s.footerTagline}>Invoice Banega, Payment Badega.</Text>
            <View style={s.poweredByContainer}>
              <Text style={s.poweredByLabel}>Powered By</Text>
              <Text style={s.poweredByValue}>GoodSynk</Text>
            </View>
          </View>
          <View style={s.footerVRule} />
          {/* Segment C — Trust */}
          <View style={s.footerSegmentC}>
            <Text style={s.footerSectionTitle}>Verified</Text>
            <Text style={s.footerTrustLine}>Generated securely by</Text>
            <Text style={s.footerTrustLine}>Goodsynk Billing.</Text>
            <Text style={s.footerTrustLine}>Digitally signed document.</Text>
            <Text style={s.footerLink} src="https://invoice.goodsynk.com">invoice.goodsynk.com</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
