import SignatoryDetails from './SignatoryDetails';
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image, Svg, Polygon } from '@react-pdf/renderer';
import { buildScaledStyles } from './Pdfheaderscaling';
import { isRasterImage } from './watermarkUtils';
import { safeHyphenation, fitFont, textWidth, standardColumns, totalsWidths, qtyText, footerReserve, A4_WIDTH } from './layoutUtils';

Font.register({ family: 'Inter', src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYMZhrib2Bg-4.ttf' });
Font.register({ family: 'Inter-SemiBold', src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYMZhrib2Bg-4.ttf' });
Font.register({ family: 'Inter-Bold', src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYMZhrib2Bg-4.ttf' });
Font.registerHyphenationCallback(safeHyphenation);

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
  const bizName = biz?.businessName || biz?.name || '';
  const isQuotation = invoice.invoiceType === 'quotation';

  const currency = invoice._currency || invoice.currency || 'INR';
  const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency, currencyDisplay: 'code' }).format(n || 0).replace(currency, '').trim();

  const showCGST = invoice.cgstTotal > 0;
  const showSGST = invoice.sgstTotal > 0;
  const showIGST = invoice.igstTotal > 0;
  const showVAT = invoice.vatTotal > 0;
  const hasTax = showCGST || showSGST || showIGST || showVAT;
  const hasHsn = invoice.items?.some(i => i.hsn);
  const hasDiscount = invoice.items?.some(i => i.discount > 0);

  // ---- Dynamic layout (sized from the real data) ----
  const TABLE_W = A4_WIDTH - 80;
  const { cw, cellSize } = standardColumns({ invoice, fmt, width: TABLE_W, headerPad: 2, mins: { no: 22, hsn: 48, qty: 44, price: 66, disc: 40, tax: 42, total: 76 } });
  const calcVals = [invoice.subtotal, invoice.discountAmount, invoice.taxTotal].map((v) => `${currency} ${fmt(v)}`);
  const grandStr = `${currency} ${fmt(invoice.total)}`;
  const tw = totalsWidths(calcVals, ['Sub Total', 'Discount'], { size: 9.5, bigSize: 10, bigValue: grandStr, bigLabel: 'Grand Total', minVal: 100, minLab: 70, pad: 12 });
  const rightBottomW = Math.max((A4_WIDTH - 80) * 0.45, tw.lab + tw.val + 16);

  // Header: the orange panel widens (and the header grows taller) when the
  // business name / address are long, so the white text always stays on colour.
  const SX = A4_WIDTH / 800; // svg unit -> pt
  const hdrName = String(biz?.businessName || biz?.name || '').toUpperCase();
  const hdrNameSize = scaled.bizNameFontSize + 2;
  const hdrSubSize = scaled.bizSubTextFontSize;
  const hdrCity = [biz?.address?.city, biz?.address?.state, biz?.address?.pincode].filter(Boolean).join(', ');
  const hdrHasLogo = !!biz?.businessLogo;
  const hdrTextHeight = (textW) => {
    const lines = (str, size, bold) => (str ? Math.max(1, Math.ceil((textWidth(str, size, bold) * 1.1) / textW)) : 0);
    return (hdrName ? 1 : 0) * hdrNameSize * 1.25 + 2
      + (lines(biz?.address?.street, hdrSubSize) + lines(hdrCity, hdrSubSize) + lines(biz?.gstin ? `GSTIN: ${biz.gstin}` : '', hdrSubSize)) * hdrSubSize * scaled.bizSubTextLineHeight;
  };
  let hdrShift = 0;
  const hdrLogoW = hdrHasLogo ? 88 : 0; // logo box (80) + gap (8)
  const hdrTextW = (shift) => (260 + shift) * SX - 12 - 40 - hdrLogoW;
  // Company name always stays on ONE line: widen the orange panel until it fits at a readable size.
  const hdrNameFits = (shift) => textWidth(hdrName, 9.5, true) * 1.1 <= hdrTextW(shift);
  while (hdrShift < 140 && (30 + hdrTextHeight(hdrTextW(hdrShift)) + 22 > 170 || !hdrNameFits(hdrShift))) hdrShift += 35;
  const HDR_H = Math.min(300, Math.max(160, Math.ceil(30 + hdrTextHeight(hdrTextW(hdrShift)) + 24)));
  const hdrLeftW = hdrTextW(hdrShift) + hdrLogoW;
  const hdrNameFitSize = fitFont(hdrName, hdrNameSize, hdrTextW(hdrShift) * 0.92, 5, true);
  const titleStr = isQuotation ? 'QUOTATION' : 'INVOICE';
  const titleSize = fitFont(titleStr, 28, (800 - (440 + hdrShift)) * SX - 60, 16, true);

  // Footer contact line: one row when it fits, stacked (and shrunk) when not.
  const phoneTxt = biz?.phone ? `Phone: ${biz.phone}` : '';
  const emailTxt = biz?.email ? `Email: ${biz.email}` : '';
  const stackContact = textWidth(phoneTxt, 8) + textWidth(emailTxt, 8) + 30 > 500;
  const contactSize = (t) => fitFont(t, 8, 500, 6);

  const s = StyleSheet.create({
    page: { paddingBottom: footerReserve(biz, 100) + (stackContact ? 10 : 0), fontFamily: 'Inter', color: '#000' },

    headerContainer: { height: HDR_H, position: 'relative' },
    headerContent: { position: 'absolute', top: 0, left: 0, right: 0, height: HDR_H, flexDirection: 'row', paddingTop: 30, paddingHorizontal: 40 },

    headerLeft: { width: hdrLeftW, paddingTop: 0, flexDirection: 'row', alignItems: 'flex-start', minWidth: 0 },
    brandText: { flex: 1, minWidth: 0 },
    topLogo: { width: 80, height: 70, objectFit: 'contain', objectPositionX: 0, marginRight: 8, flexShrink: 0 },
    bizNameHeader: { fontSize: scaled.bizNameFontSize + 2, fontFamily: B, color: '#FFF', textTransform: 'uppercase', marginBottom: 2 },
    bizSubTextHeader: { fontSize: scaled.bizSubTextFontSize, color: '#ffffffff', lineHeight: scaled.bizSubTextLineHeight },

    headerRight: { flex: 1, minWidth: 0, alignItems: 'flex-end', paddingTop: 25 },
    invoiceTitleHeader: { fontSize: titleSize, fontFamily: B, color: '#FFF', letterSpacing: 2, marginBottom: 12 },
    headerTextRow: { flexDirection: 'row', marginBottom: 4, justifyContent: 'flex-end' },
    headerTextLabel: { fontSize: 8.5, color: '#B0C4DE', marginRight: 6 },
    headerTextValue: { fontSize: 8.5, color: '#FFF', fontFamily: M },

    metaSection: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 40, marginTop: 15, marginBottom: 10 },
    billToBlock: { width: '33%', marginRight: 10, minWidth: 0 },
    billToTitle: { fontSize: 10, textTransform: 'uppercase', marginBottom: 6, color: '#333', fontFamily: B },
    billToName: { fontSize: 13, fontFamily: B, color: '#000', marginBottom: 2 },
    billToRole: { fontSize: 9, color: '#666', marginBottom: 2 },
    billToText: { fontSize: 9, color: '#444', lineHeight: 1.4 },

    detailsBlock: { width: '33%', marginHorizontal: 10, minWidth: 0 },
    detailsTitle: { fontSize: 10, textTransform: 'uppercase', marginBottom: 6, color: '#333', fontFamily: B },
    detailsRow: { flexDirection: 'row', marginBottom: 3 },
    detailsLabel: { fontSize: 9, color: '#555', width: 62 },
    detailsColon: { fontSize: 9, color: '#555', width: 10, textAlign: 'center' },
    detailsVal: { fontSize: 9, color: '#000', fontFamily: M, flex: 1, minWidth: 0 },

    paymentInfoBlock: { width: '33%', minWidth: 0 },
    paymentTitle: { fontSize: 10, textTransform: 'uppercase', marginBottom: 6, color: '#333', fontFamily: B },
    payRow: { flexDirection: 'row', marginBottom: 3 },
    payLabel: { fontSize: 9, color: '#555', width: 62 },
    payColon: { fontSize: 9, color: '#555', width: 10, textAlign: 'center' },
    payVal: { fontSize: 9, color: '#000', fontFamily: M, flex: 1, minWidth: 0 },
    table: { width: '100%', paddingHorizontal: 40, marginBottom: 15 },

    tHead: { flexDirection: 'row', backgroundColor: ORANGE, paddingVertical: 8 },
    th: { fontSize: Math.min(9, cellSize), fontFamily: B, color: '#FFF', textTransform: 'uppercase', textAlign: 'center' },

    tRow: { flexDirection: 'row', paddingVertical: 10, borderBottom: '1pt solid #DDD' },
    td: { fontSize: cellSize, color: '#000', textAlign: 'center' },

    colNo: { width: cw.no, flexShrink: 0 },
    colDesc: { width: cw.desc, flexShrink: 0, textAlign: 'left', paddingLeft: 10 },
    colHsn: { width: cw.hsn, flexShrink: 0, textAlign: 'center' },
    colQty: { width: cw.qty, flexShrink: 0, textAlign: 'center' },
    colPrice: { width: cw.price, flexShrink: 0, textAlign: 'right', paddingRight: 8 },
    colDisc: { width: cw.disc, flexShrink: 0, textAlign: 'center' },
    colTax: { flexShrink: 0, textAlign: 'center' },
    colTotal: { width: cw.total, flexShrink: 0, textAlign: 'right', paddingRight: 8 },
    bottomGrid: { flexDirection: 'row', paddingHorizontal: 40, marginTop: 5 },
    leftBottom: { flex: 1, minWidth: 0, paddingRight: 15 },
    rightBottom: { width: rightBottomW, flexShrink: 0 },

    termsTitle: { fontSize: 10, fontFamily: B, color: '#000', marginBottom: 4 },
    termsText: { fontSize: 8, color: '#444', lineHeight: 1.4 },

    calcRow: { flexDirection: 'row', paddingVertical: 4, justifyContent: 'space-between' },
    calcLabel: { fontSize: 9.5, color: '#222' },
    calcVal: { fontSize: 9.5, color: '#222' },

    grandTotalWrap: { backgroundColor: ORANGE, flexDirection: 'row', padding: 8, justifyContent: 'space-between', marginTop: 4 },
    grandTotalLabel: { fontSize: 10, fontFamily: B, color: '#FFF' },
    grandTotalVal: { fontSize: 10, fontFamily: B, color: '#FFF' },

    signatureBlock: { marginTop: 15, alignItems: 'flex-end' },
    sigLine: { width: 150, height: 1, backgroundColor: '#DDD', marginBottom: 4 },
    sigText: { fontSize: 9, fontFamily: M, color: '#444' },

    thankYou: { fontSize: 9, marginTop: 8, textAlign: 'center' },
    footerBox: { position: 'absolute', bottom: 0, left: 0, right: 0, minHeight: 54, backgroundColor: NAVY, flexDirection: 'column', justifyContent: 'center', alignItems: 'center', paddingTop: 10, paddingBottom: 46 },
    footerText: { fontSize: 8.5, color: '#FFF' },
    footerDivider: { width: 36, height: 1, backgroundColor: hexToRgba(ORANGE, 0.4), marginBottom: 5 },
    footerBrandLine: { fontSize: 7.5, fontFamily: B, color: ORANGE, letterSpacing: 0.4, textAlign: 'center' },
    footerLink: { fontSize: 7.5, fontFamily: B, color: ORANGE, letterSpacing: 0.4 },
    footerContact: { fontSize: 8, color: '#FFF', flexDirection: stackContact ? 'column' : 'row', alignItems: 'center', gap: stackContact ? 1 : 30, marginBottom: 3, maxWidth: 520 },
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
        watermarkImg: { width: 250, height: 250, objectFit: 'contain', opacity: 0.12 },
    watermarkText: {
      fontSize: 60,
      fontFamily: B,
      color: hexToRgba(NAVY, 0.08),
      transform: 'rotate(-45deg)',
      letterSpacing: 5,
    },
  });



  return (
    <Document>
      <Page size="A4" style={s.page}>
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

        {/* Top margin for continuation pages (page 1 starts with the coloured header) */}
        <View fixed render={({ pageNumber }) => (pageNumber > 1 ? <View style={{ height: 36 }} /> : null)} />

        {/* Header with SVG Angles */}
        <View style={s.headerContainer}>
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: HDR_H }}>
            <Svg viewBox={`0 0 800 ${HDR_H}`} preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
              <Polygon points={`0,0 ${380 + hdrShift},0 ${260 + hdrShift},${HDR_H} 0,${HDR_H}`} fill={ORANGE} />
              <Polygon points={`${400 + hdrShift},0 ${420 + hdrShift},0 ${300 + hdrShift},${HDR_H} ${280 + hdrShift},${HDR_H}`} fill={ORANGE} />
              <Polygon points={`${440 + hdrShift},50 800,50 800,${HDR_H} ${357.5 + hdrShift},${HDR_H}`} fill={NAVY} />
            </Svg>
          </View>

          <View style={s.headerContent}>
            <View style={s.headerLeft}>
              {biz?.businessLogo && <Image style={s.topLogo} src={biz.businessLogo} />}
              <View style={s.brandText}>
              <Text numberOfLines={1} wrap={false} style={[s.bizNameHeader, { fontSize: hdrNameFitSize }]}>{bizName}</Text>
              <Text style={s.bizSubTextHeader}>
                {biz?.address?.street && `${biz.address.street}\n`}
                {biz?.address?.city && `${biz.address.city}, ${biz.address.state} ${biz.address.pincode || ''}\n`}
                {biz?.gstin && `GSTIN: ${biz.gstin}`}
              </Text>
              </View>
            </View>

            <View style={s.headerRight}>
              <Text style={s.invoiceTitleHeader}>{titleStr}</Text>
            </View>
          </View>
        </View>

        {/* Bill To, Details & Payment Info */}
        <View style={s.metaSection}>
          <View style={s.billToBlock}>
            <Text style={s.billToTitle}>{isQuotation ? 'QUOTATION TO.' : 'INVOICE TO.'}</Text>
            <Text numberOfLines={1} style={s.billToName}>{client?.name}</Text>
            {client?.email && <Text style={s.billToRole}>{client.email}</Text>}
            {client?.phone && <Text style={s.billToText}>Phone: {client.phone}</Text>}
            {client?.address?.street && <Text style={s.billToText}>{client.address.street}</Text>}
            {client?.address?.city && <Text style={s.billToText}>{client.address.city}, {client.address.state} {client.address.pincode}</Text>}
          </View>

          <View style={s.detailsBlock}>
            {(
              biz?.bankDetails?.accountNumber ? (
                <>
                  <Text style={s.paymentTitle}>Payment Info :</Text>
                  <View style={s.payRow}><Text style={s.payLabel}>Account No</Text><Text style={s.payColon}>:</Text><Text style={s.payVal}>{biz.bankDetails.accountNumber}</Text></View>
                  <View style={s.payRow}><Text style={s.payLabel}>A/C Name</Text><Text style={s.payColon}>:</Text><Text style={s.payVal}>{biz.bankDetails.accountName}</Text></View>
                  {biz.bankDetails.bankName && <View style={s.payRow}><Text style={s.payLabel}>Bank Name</Text><Text style={s.payColon}>:</Text><Text style={s.payVal}>{biz.bankDetails.bankName}</Text></View>}
                  {biz.bankDetails.ifscCode && <View style={s.payRow}><Text style={s.payLabel}>IFSC Code</Text><Text style={s.payColon}>:</Text><Text style={s.payVal}>{biz.bankDetails.ifscCode}</Text></View>}
                  {biz.bankDetails.branch && <View style={s.payRow}><Text style={s.payLabel}>Branch</Text><Text style={s.payColon}>:</Text><Text style={s.payVal}>{biz.bankDetails.branch}</Text></View>}
                </>
              ) : invoice.paymentInfo ? (
                <>
                  <Text style={s.paymentTitle}>Payment Info :</Text>
                  <Text style={s.payVal}>{invoice.paymentInfo}</Text>
                </>
              ) : null
            )}
          </View>

          <View style={s.paymentInfoBlock}>
            <Text style={s.detailsTitle}>Details :</Text>
            <View style={s.detailsRow}><Text style={s.detailsLabel}>{isQuotation ? 'Quotation No' : 'Invoice No'}</Text><Text style={s.detailsColon}>:</Text><Text style={s.detailsVal}>{invoice.invoiceNumber || invoice.quotationNumber}</Text></View>
            <View style={s.detailsRow}><Text style={s.detailsLabel}>Date of Issue</Text><Text style={s.detailsColon}>:</Text><Text style={s.detailsVal}>{new Date(invoice.issueDate).toLocaleDateString('en-GB')}</Text></View>
            <View style={s.detailsRow}><Text style={s.detailsLabel}>{isQuotation ? 'Valid Until' : 'Due Date'}</Text><Text style={s.detailsColon}>:</Text><Text style={s.detailsVal}>{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-GB') : (isQuotation ? '-' : 'Upon Receipt')}</Text></View>
          </View>
        </View>

        {/* Table */}
        <View style={s.table}>
          <View style={s.tHead} wrap={false}>
            <Text style={[s.th, s.colNo]}>#</Text>
            <Text style={[s.th, s.colDesc]}>Description</Text>
            {hasHsn && <Text style={[s.th, s.colHsn]}>HSN</Text>}
            <Text style={[s.th, s.colQty]}>Qty</Text>
            <Text style={[s.th, s.colPrice]}>Price</Text>
            {hasDiscount && <Text style={[s.th, s.colDisc]}>Disc%</Text>}
            {showCGST && <Text style={[s.th, s.colTax, { width: cw.CGST }]}>CGST</Text>}
            {showSGST && <Text style={[s.th, s.colTax, { width: cw.SGST }]}>SGST</Text>}
            {showIGST && <Text style={[s.th, s.colTax, { width: cw.IGST }]}>IGST</Text>}
            {showVAT && <Text style={[s.th, s.colTax, { width: cw.VAT }]}>VAT</Text>}
            <Text style={[s.th, s.colTotal]}>Total</Text>
          </View>
          {invoice.items?.map((item, i) => (
            <View key={i} style={s.tRow} wrap={false}>
              <Text style={[s.td, s.colNo]}>{i + 1}</Text>
              <View style={s.colDesc}>
                <Text style={[s.td, { fontFamily: B, textAlign: 'left' }]}>{item.name}</Text>
                {item.description && <Text style={{ fontSize: 7.5, color: '#555', marginTop: 2, textAlign: 'left' }}>{item.description}</Text>}
              </View>
              {hasHsn && <Text style={[s.td, s.colHsn]}>{item.hsn || '—'}</Text>}
              <Text style={[s.td, s.colQty]}>{qtyText(item)}</Text>
              <Text style={[s.td, s.colPrice]}>{fmt(item.price)}</Text>
              {hasDiscount && <Text style={[s.td, s.colDisc]}>{item.discount || 0}%</Text>}
              {showCGST && <Text style={[s.td, s.colTax, { width: cw.CGST }]}>{item.cgstRate || 0}%</Text>}
              {showSGST && <Text style={[s.td, s.colTax, { width: cw.SGST }]}>{item.sgstRate || 0}%</Text>}
              {showIGST && <Text style={[s.td, s.colTax, { width: cw.IGST }]}>{item.igstRate || 0}%</Text>}
              {showVAT && <Text style={[s.td, s.colTax, { width: cw.VAT }]}>{item.vatRate || 0}%</Text>}
              <Text style={[s.td, s.colTotal, { fontFamily: B }]}>{fmt(item.total)}</Text>
            </View>
          ))}
        </View>

        {/* Lower Grid */}
        <View style={s.bottomGrid} wrap={(String(invoice.notes || '').length + String(invoice.termsAndConditions || '').length) > 900}>
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

        {/* Signature + stamp side by side — bottom right */}
        <View style={{ marginTop: 10, paddingHorizontal: 40, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'flex-end' }} wrap={false}>
          {biz?.businessSeal && (
            <Image src={biz.businessSeal} style={{ width: 55, height: 55, objectFit: 'contain', marginRight: 16 }} />
          )}
          <SignatoryDetails biz={biz} color={'#1a3a6b'} label="Authorized Signatory" />
        </View>
        <Text style={s.thankYou}>Thank you for your business</Text>

        {/* Fixed Footer Branding */}
        <View style={s.footerBox} fixed>
          {(biz?.phone || biz?.email) && (
            <View style={s.footerContact}>
              {biz?.phone && <Text style={[s.footerContactText, { fontSize: contactSize(phoneTxt), textAlign: 'center' }]}>{phoneTxt}</Text>}
              {biz?.email && <Text wrap={false} style={[s.footerContactText, { fontSize: contactSize(emailTxt), textAlign: 'center' }]}>{emailTxt}</Text>}
            </View>
          )}
          <View style={s.footerDivider} />
          <Text style={s.footerBrandLine}>
            Goodsynk Invoice  |  Simple Invoicing, Billing & Quotations  |  Visit{' '}
            <Text style={s.footerLink} src="https://invoice.goodsynk.com">invoice.goodsynk.com</Text>
          </Text>
          <Text style={s.footerTrustLine}>
            Generated securely by Goodsynk Invoice. This is a digitally signed document.
          </Text>
        </View>

        {/* Bottom Design Decor */}
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 40 }} fixed>
          <Svg viewBox="0 0 800 40" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
            <Polygon points="0,40 400,40 440,0 0,0" fill={NAVY} />
            <Polygon points="420,40 800,40 800,0 460,0" fill={ORANGE} />
          </Svg>
        </View>

        <View style={s.poweredByOnOrange} fixed>
          <Text style={s.poweredByLabelOnOrange}>Powered By</Text>
          <Text style={s.poweredByValueOnOrange}>GoodSynk<Text style={{ fontSize: 7, fontFamily: 'Helvetica' }}>™</Text></Text>
          <Text style={s.footerTaglineOnOrange}>Invoice Banega, Payment Badega.</Text>
        </View>


        <Text
          style={{ position: 'absolute', bottom: 8, left: 24, fontSize: 7.5, color: '#FFFFFF' }}
          render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  );
}
