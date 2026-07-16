import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image, Svg, Polygon } from '@react-pdf/renderer';
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

export default function Template6({ invoice }) {
  const { client, user: biz } = invoice;
  const colors = invoice.templateColors || { primary: '#E8662B', secondary: '#1C2541' };
  const ORANGE = colors.primary;
  const NAVY = colors.secondary;
  const scaled = buildScaledStyles(biz);

  const s = StyleSheet.create({
    page: { paddingBottom: 60, fontFamily: 'Inter', color: '#000' },

    headerContainer: { height: 160, position: 'relative' },
    headerContent: { position: 'absolute', top: 0, left: 0, right: 0, height: 160, flexDirection: 'row', paddingTop: 30, paddingHorizontal: 40 },

    headerLeft: { width: '30%', paddingTop: 0 },
    bizNameHeader: { fontSize: scaled.bizNameFontSize + 2, fontFamily: B, color: '#FFF', textTransform: 'uppercase', marginBottom: 2 },
    bizSubTextHeader: { fontSize: scaled.bizSubTextFontSize, color: '#ffffffff', lineHeight: scaled.bizSubTextLineHeight },
    logoImgHeader: { height: Math.min(scaled.logoHeight, 40), maxWidth: 120, objectFit: 'contain', marginBottom: 6 },

    headerRight: { width: '70%', alignItems: 'flex-end', paddingTop: 25 },
    invoiceTitleHeader: { fontSize: 28, fontFamily: B, color: '#FFF', letterSpacing: 2, marginBottom: 12 },
    headerTextRow: { flexDirection: 'row', marginBottom: 4, justifyContent: 'flex-end' },
    headerTextLabel: { fontSize: 8.5, color: '#B0C4DE', marginRight: 6 },
    headerTextValue: { fontSize: 8.5, color: '#FFF', fontFamily: M },

    metaSection: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 40, marginTop: 20, marginBottom: 15 },
    billToBlock: { width: '33%', marginRight: 10 },
    billToTitle: { fontSize: 10, textTransform: 'uppercase', marginBottom: 6, color: '#333', fontFamily: B },
    billToName: { fontSize: 13, fontFamily: B, color: '#000', marginBottom: 2 },
    billToRole: { fontSize: 9, color: '#666', marginBottom: 2 },
    billToText: { fontSize: 9, color: '#444', lineHeight: 1.4 },

    detailsBlock: { width: '33%', marginHorizontal: 10 },
    detailsTitle: { fontSize: 10, textTransform: 'uppercase', marginBottom: 6, color: '#333', fontFamily: B },
    detailsRow: { flexDirection: 'row', marginBottom: 3 },
    detailsLabel: { fontSize: 9, color: '#555', width: 65 },
    detailsColon: { fontSize: 9, color: '#555', width: 10, textAlign: 'center' },
    detailsVal: { fontSize: 9, color: '#000', fontFamily: M },

    paymentInfoBlock: { width: '33%' },
    paymentTitle: { fontSize: 10, textTransform: 'uppercase', marginBottom: 6, color: '#333', fontFamily: B },
    payRow: { flexDirection: 'row', marginBottom: 3 },
    payLabel: { fontSize: 9, color: '#555', width: 65 },
    payColon: { fontSize: 9, color: '#555', width: 10, textAlign: 'center' },
    payVal: { fontSize: 9, color: '#000', fontFamily: M, flex: 1 },
    table: { width: '100%', paddingHorizontal: 40, marginBottom: 15 },

    tHead: { flexDirection: 'row', backgroundColor: ORANGE, paddingVertical: 8 },
    th: { fontSize: 9, fontFamily: B, color: '#FFF', textTransform: 'uppercase', textAlign: 'center' },

    tRow: { flexDirection: 'row', paddingVertical: 10, borderBottom: '1pt solid #DDD' },
    td: { fontSize: 9, color: '#000', textAlign: 'center' },

    colNo: { flex: 0.4 },
    colDesc: { flex: 2.2, textAlign: 'left', paddingLeft: 10 },
    colHsn: { flex: 0.8, textAlign: 'center' },
    colQty: { flex: 0.9, textAlign: 'center' },
    colPrice: { flex: 1.1, textAlign: 'right' },
    colDisc: { flex: 0.7, textAlign: 'center' },
    colTax: { flex: 0.8, textAlign: 'center' },
    colTotal: { flex: 1.2, textAlign: 'right', paddingRight: 10 },

    bottomGrid: { flexDirection: 'row', paddingHorizontal: 40, marginTop: 10 },
    leftBottom: { width: '55%' },
    rightBottom: { width: '45%' },

    termsTitle: { fontSize: 10, fontFamily: B, color: '#000', marginBottom: 4 },
    termsText: { fontSize: 8, color: '#444', lineHeight: 1.4 },

    calcRow: { flexDirection: 'row', paddingVertical: 4, justifyContent: 'space-between' },
    calcLabel: { fontSize: 9.5, color: '#222' },
    calcVal: { fontSize: 9.5, color: '#222' },

    grandTotalWrap: { backgroundColor: ORANGE, flexDirection: 'row', padding: 8, justifyContent: 'space-between', marginTop: 4 },
    grandTotalLabel: { fontSize: 10, fontFamily: B, color: '#FFF' },
    grandTotalVal: { fontSize: 10, fontFamily: B, color: '#FFF' },

    signatureBlock: { marginTop: 25, alignItems: 'flex-end' },
    sigLine: { width: 150, height: 1, backgroundColor: '#DDD', marginBottom: 4 },
    sigText: { fontSize: 9, fontFamily: M, color: '#444' },

    thankYou: { fontSize: 9, marginTop: 20, textAlign: 'center' },
    footerBox: { position: 'absolute', bottom: 0, left: 0, right: 0, minHeight: 54, backgroundColor: NAVY, flexDirection: 'column', justifyContent: 'center', alignItems: 'center', paddingTop: 10, paddingBottom: 46 },
    footerText: { fontSize: 8.5, color: '#FFF' },
    footerDivider: { width: 36, height: 1, backgroundColor: hexToRgba(ORANGE, 0.4), marginBottom: 5 },
    footerBrandLine: { fontSize: 7.5, fontFamily: B, color: ORANGE, letterSpacing: 0.4, textAlign: 'center' },
    footerLink: { fontSize: 7.5, fontFamily: B, color: ORANGE, letterSpacing: 0.4 },
    footerContact: { fontSize: 8, color: '#FFF', flexDirection: 'row', gap: 30, marginBottom: 3 },
    footerContactText: { fontSize: 8, color: '#FFF' },
    footerTrustLine: { fontSize: 6, color: '#FFF', opacity: 0.6, marginTop: 5, textAlign: 'center' },
    poweredByOnOrange: { position: 'absolute', bottom: 6, right: 24, width: 150, alignItems: 'center' },
    poweredByLabelOnOrange: { fontSize: 5.5, color: hexToRgba('#1C2541', 0.7), letterSpacing: 0.5 },
    poweredByValueOnOrange: { fontSize: 9, fontFamily: B, color: '#1C2541', letterSpacing: 0.5, marginTop: 1 },
    footerTaglineOnOrange: { fontSize: 6, fontFamily: M, color: '#1C2541', opacity: 0.85, textAlign: 'center', marginTop: 2 },

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
      color: hexToRgba(NAVY, 0.08),
      transform: 'rotate(-45deg)',
      letterSpacing: 5,
    },
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

        {/* Header with SVG Angles */}
        <View style={s.headerContainer}>
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 160 }}>
            <Svg viewBox="0 0 800 160" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
              <Polygon points="0,0 380,0 260,160 0,160" fill={ORANGE} />
              <Polygon points="400,0 420,0 300,160 280,160" fill={ORANGE} />
              <Polygon points="440,50 800,50 800,160 357.5,160" fill={NAVY} />
            </Svg>
          </View>

          <View style={s.headerContent}>
            <View style={s.headerLeft}>
              {biz?.businessLogo && <Image src={biz.businessLogo} style={s.logoImgHeader} />}
              <Text style={s.bizNameHeader}>{bizName}</Text>
              <Text style={s.bizSubTextHeader}>
                {biz?.address?.street && `${biz.address.street}\n`}
                {biz?.address?.city && `${biz.address.city}, ${biz.address.state} ${biz.address.pincode || ''}\n`}
                {biz?.gstin && `GSTIN: ${biz.gstin}`}
              </Text>
            </View>

            <View style={s.headerRight}>
              <Text style={s.invoiceTitleHeader}>{isQuotation ? 'QUOTATION' : 'INVOICE'}</Text>
            </View>
          </View>
        </View>

        {/* Bill To, Details & Payment Info */}
        <View style={s.metaSection}>
          <View style={s.billToBlock}>
            <Text style={s.billToTitle}>{isQuotation ? 'QUOTATION TO.' : 'INVOICE TO.'}</Text>
            <Text style={s.billToName}>{client?.name}</Text>
            {client?.email && <Text style={s.billToRole}>{client.email}</Text>}
            {client?.phone && <Text style={s.billToText}>Phone: {client.phone}</Text>}
            {client?.address?.street && <Text style={s.billToText}>{client.address.street}</Text>}
            {client?.address?.city && <Text style={s.billToText}>{client.address.city}, {client.address.state} {client.address.pincode}</Text>}
          </View>

          <View style={s.detailsBlock}>
            {isQuotation ? (
              biz?.bankDetails?.accountNumber ? (
                <>
                  <Text style={s.paymentTitle}>Payment Info :</Text>
                  <View style={s.payRow}><Text style={s.payLabel}>Account No</Text><Text style={s.payColon}>:</Text><Text style={s.payVal}>{biz.bankDetails.accountNumber}</Text></View>
                  <View style={s.payRow}><Text style={s.payLabel}>A/C Name</Text><Text style={s.payColon}>:</Text><Text style={s.payVal}>{biz.bankDetails.accountName}</Text></View>
                  {biz.bankDetails.bankName && <View style={s.payRow}><Text style={s.payLabel}>Bank Name</Text><Text style={s.payColon}>:</Text><Text style={s.payVal}>{biz.bankDetails.bankName}</Text></View>}
                  {biz.bankDetails.ifscCode && <View style={s.payRow}><Text style={s.payLabel}>IFSC Code</Text><Text style={s.payColon}>:</Text><Text style={s.payVal}>{biz.bankDetails.ifscCode}</Text></View>}
                </>
              ) : invoice.paymentInfo ? (
                <>
                  <Text style={s.paymentTitle}>Payment Info :</Text>
                  <Text style={s.payVal}>{invoice.paymentInfo}</Text>
                </>
              ) : null
            ) : null}
          </View>

          <View style={s.paymentInfoBlock}>
            <Text style={s.detailsTitle}>Details :</Text>
            <View style={s.detailsRow}><Text style={s.detailsLabel}>{isQuotation ? 'Quotation No' : 'Invoice No'}</Text><Text style={s.detailsColon}>:</Text><Text style={s.detailsVal}>{invoice.invoiceNumber || invoice.quotationNumber}</Text></View>
            <View style={s.detailsRow}><Text style={s.detailsLabel}>Date of Issue</Text><Text style={s.detailsColon}>:</Text><Text style={s.detailsVal}>{new Date(invoice.issueDate).toLocaleDateString('en-US')}</Text></View>
            <View style={s.detailsRow}><Text style={s.detailsLabel}>Due Date</Text><Text style={s.detailsColon}>:</Text><Text style={s.detailsVal}>{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-US') : 'Upon Receipt'}</Text></View>
          </View>
        </View>

        {/* Table */}
        <View style={s.table}>
          <View style={s.tHead}>
            <Text style={[s.th, s.colNo]}>#</Text>
            <Text style={[s.th, s.colDesc]}>Description</Text>
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
              <View style={s.colDesc}>
                <Text style={[s.td, { fontFamily: B, textAlign: 'left' }]}>{item.name}</Text>
                {item.description && <Text style={{ fontSize: 7.5, color: '#555', marginTop: 2, textAlign: 'left' }}>{item.description}</Text>}
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

        {/* Lower Grid */}
        <View style={s.bottomGrid}>
          <View style={s.leftBottom}>
            {invoice.notes && (
              <View style={{ marginBottom: 15 }}>
                <Text style={s.termsTitle}>Notes</Text>
                <Text style={s.termsText}>{invoice.notes}</Text>
              </View>
            )}
            {invoice.termsAndConditions && (
              <View style={{ marginBottom: 20 }}>
                <Text style={s.termsTitle}>Terms & Conditions</Text>
                <Text style={s.termsText}>{invoice.termsAndConditions}</Text>
              </View>
            )}
          </View>

          <View style={s.rightBottom}>
            <View style={s.calcRow}>
              <Text style={s.calcLabel}>Sub Total</Text>
              <Text style={s.calcVal}>{currency} {fmt(invoice.subtotal)}</Text>
            </View>
            {invoice.discountAmount > 0 && <View style={s.calcRow}><Text style={s.calcLabel}>Discount</Text><Text style={s.calcVal}>-{fmt(invoice.discountAmount)}</Text></View>}
            {invoice.taxTotal > 0 && <View style={s.calcRow}><Text style={s.calcLabel}>Tax</Text><Text style={s.calcVal}>{currency} {fmt(invoice.taxTotal)}</Text></View>}

            <View style={s.grandTotalWrap}>
              <Text style={s.grandTotalLabel}>Grand Total</Text>
              <Text style={s.grandTotalVal}>{currency} {fmt(invoice.total)}</Text>
            </View>
          </View>
        </View>

        {/* Signature — bottom right */}
        <View style={{ paddingHorizontal: 40, alignItems: 'flex-end', marginTop: 10 }}>
          <View style={{ width: 160, alignItems: 'center' }}>
            {biz?.businessSignature && (
              <Image src={biz.businessSignature} style={{ width: 160, height: 55, objectFit: 'contain', marginBottom: 4 }} />
            )}
            <View style={[s.sigLine, { alignSelf: 'stretch' }]} />
            <Text style={s.sigText}>Authorised Signature</Text>
          </View>
        </View>

        <Text style={s.thankYou}>Thank you for your business</Text>

        {/* Fixed Footer Branding */}
        <View style={s.footerBox} fixed>
          {(biz?.phone || biz?.email) && (
            <View style={s.footerContact}>
              {biz?.phone && <Text style={s.footerContactText}>Phone: {biz.phone}</Text>}
              {biz?.email && <Text style={s.footerContactText}>Email: {biz.email}</Text>}
            </View>
          )}
          <View style={s.footerDivider} />
          <Text style={s.footerBrandLine}>
            Goodsynk Billing  |  Simple Invoicing, Billing & Quotations  |  Visit{' '}
            <Text style={s.footerLink} src="https://invoice.goodsynk.com">invoice.goodsynk.com</Text>
          </Text>
          <Text style={s.footerTrustLine}>
            Generated securely by Goodsynk Billing. This is a digitally signed document.
          </Text>
        </View>

        {/* Bottom Design Decor */}
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 40 }} fixed>
          <Svg viewBox="0 0 800 40" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
            <Polygon points="0,40 400,40 440,0 0,0" fill={NAVY} />
            <Polygon points="420,40 800,40 800,0 460,0" fill={ORANGE} />
          </Svg>
        </View>

        {/* Powered By + Tagline, sitting inside the orange corner of the decor */}
        <View style={s.poweredByOnOrange} fixed>
          <Text style={s.poweredByLabelOnOrange}>Powered By</Text>
          <Text style={s.poweredByValueOnOrange}>GoodSynk</Text>
          <Text style={s.footerTaglineOnOrange}>Invoice Banega, Payment Badega.</Text>
        </View>


      </Page>
    </Document>
  );
}