import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image, Link } from '@react-pdf/renderer';
import { buildScaledStyles } from './Pdfheaderscaling';

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

export default function Template10({ invoice }) {
  const { client, user: biz } = invoice;
  const colors = invoice.templateColors || { primary: '#10B981' };
  const PRIMARY = colors.primary;
  const LIGHT_CARD = '#F3F4F6';
  const scaled = buildScaledStyles(biz);

  const s = StyleSheet.create({
    watermarkContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: -100 },
    watermarkText: { fontSize: 60, fontFamily: B, color: hexToRgba(PRIMARY, 0.08), transform: 'rotate(-45deg)', letterSpacing: 5 },
    page: { paddingTop: 40, paddingBottom: 60, paddingHorizontal: 40, fontFamily: 'Inter', color: '#1F2937' },
    
    // Top Bar (No background block)
    topFlex: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    bizBox: { flexDirection: 'row', alignItems: 'flex-start', flex: 1, minWidth: 0 },
    topLogo: { width: 36, height: 36, objectFit: 'contain', marginRight: 10, flexShrink: 0 },
    bizName: { fontFamily: B, fontSize: 18, color: PRIMARY, textTransform: 'uppercase', letterSpacing: 1 },
    
    docTitleBox: { alignItems: 'flex-end' },
    docTitle: { fontFamily: B, fontSize: 24, color: '#111', textTransform: 'uppercase', letterSpacing: 2 },
    docNo: { fontSize: 10, color: '#6B7280', marginTop: 4 },
    docNoBold: { fontFamily: B, color: PRIMARY },

    // Business details row
    bizDetailsRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20, gap: 10 },
    bizText: { fontSize: 8.5, color: '#4B5563' },

    // Card Layout for Info
    cardsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
    card: { backgroundColor: LIGHT_CARD, borderRadius: 8, padding: 15, width: '48%' },
    cardHeader: { fontSize: 8, fontFamily: B, color: PRIMARY, textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 },
    clientName: { fontFamily: B, fontSize: 12, color: '#111', marginBottom: 4 },
    clientText: { fontSize: 8.5, color: '#4B5563', lineHeight: 1.5 },
    metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
    metaLabel: { fontSize: 8.5, color: '#6B7280' },
    metaVal: { fontSize: 8.5, fontFamily: B, color: '#111' },

    // Clean Table
    table: { width: '100%', marginBottom: 30 },
    tHead: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: PRIMARY, paddingBottom: 8, marginBottom: 8 },
    tRow: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
    th: { fontSize: 8, fontFamily: B, color: '#111', textTransform: 'uppercase', letterSpacing: 0.5 },
    td: { fontSize: 9, color: '#374151' },

    colNo: { flex: 0.4 },
    colDesc: { flex: 2.2, paddingRight: 10 },
    colHsn: { flex: 0.8, textAlign: 'center' },
    colQty: { flex: 0.9, textAlign: 'center' },
    colPrice: { flex: 1.1, textAlign: 'right' },
    colDisc: { flex: 0.7, textAlign: 'center' },
    colTax: { flex: 0.8, textAlign: 'center' },
    colTotal: { flex: 1.2, textAlign: 'right' },

    // Totals Section in a Card
    bottomFlex: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    notesBox: { width: '50%' },
    totalsCard: { width: '45%', backgroundColor: LIGHT_CARD, borderRadius: 8, padding: 15 },
    
    totRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
    totLabel: { fontSize: 9, color: '#6B7280' },
    totVal: { fontSize: 9, fontFamily: M, color: '#111', textAlign: 'right' },
    totDivider: { height: 1, backgroundColor: '#D1D5DB', marginVertical: 6 },
    grandTotRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
    grandTotLabel: { fontSize: 11, fontFamily: B, color: PRIMARY, textTransform: 'uppercase' },
    grandTotVal: { fontSize: 11, fontFamily: B, color: PRIMARY, textAlign: 'right' },

    // Notes and Signature
    sectionTitle: { fontSize: 9, fontFamily: B, color: '#111', textTransform: 'uppercase', marginBottom: 6, letterSpacing: 1 },
    notesText: { fontSize: 8.5, color: '#4B5563', lineHeight: 1.5, marginBottom: 15 },
    
    sigBox: { width: '40%', alignItems: 'flex-start', marginTop: 20 },
    sigImg: { width: 120, height: 40, objectFit: 'contain', marginBottom: 6 },
    sigLine: { width: 140, height: 1, backgroundColor: '#D1D5DB', marginBottom: 4 },
    sigText: { fontSize: 8, color: '#6B7280' },

    // Footer: Floating Pill
    footerBox: { position: 'absolute', bottom: 20, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center' },
    footerPill: { backgroundColor: PRIMARY, borderRadius: 20, paddingVertical: 10, paddingHorizontal: 30, flexDirection: 'row', alignItems: 'center', gap: 16 },
    footerText: { fontSize: 7.5, color: '#FFFFFF', letterSpacing: 0.5 },
    footerLink: { fontSize: 7.5, fontFamily: B, color: '#FFFFFF', textDecoration: 'none' }
  });

  const currency = invoice._currency || invoice.currency || 'INR';
  const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency, currencyDisplay: 'code' }).format(n || 0).replace(currency, '').trim();

  const bizName = biz?.businessName || biz?.name || '';
  const isQuotation = invoice.invoiceType === 'quotation';
  const docTitle = isQuotation ? 'QUOTATION' : 'INVOICE';
  const docNo = invoice.invoiceNumber || invoice.quotationNumber;

  const showCGST = invoice.cgstTotal > 0;
  const showSGST = invoice.sgstTotal > 0;
  const showIGST = invoice.igstTotal > 0;
  const showVAT = invoice.vatTotal > 0;
  const hasHsn = invoice.items?.some(i => i.hsn);
  const hasDiscount = invoice.items?.some(i => i.discount > 0);
  const roundOffDiff = invoice.roundOff ? (invoice.total || 0) - ((invoice.subtotal || 0) - (invoice.discountAmount || 0) + (invoice.taxTotal || 0)) : 0;
  const notesText = Array.isArray(invoice.notes) ? invoice.notes.join('\n') : invoice.notes;
  const termsText = Array.isArray(invoice.termsAndConditions) ? invoice.termsAndConditions.join('\n') : invoice.termsAndConditions;

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* Watermark */}
        {(!biz?.plan || String(biz.plan).toLowerCase() === 'free') && (
          <View style={s.watermarkContainer} pointerEvents="none" fixed>
            <Text style={s.watermarkText}>GoodSynk</Text>
          </View>
        )}
        
        <View style={s.topFlex}>
          <View style={s.bizBox}>
            {biz?.businessLogo && <Image style={s.topLogo} src={biz.businessLogo} />}
            <Text style={s.bizName}>{bizName}</Text>
          </View>
          <View style={s.docTitleBox}>
            <Text style={s.docTitle}>{docTitle}</Text>
            <Text style={s.docNo}>{isQuotation ? 'NO.' : 'NO.'} <Text style={s.docNoBold}>{docNo}</Text></Text>
          </View>
        </View>

        <View style={s.bizDetailsRow}>
          {biz?.address?.street && <Text style={s.bizText}>{biz.address.street}, </Text>}
          {biz?.address?.city && <Text style={s.bizText}>{[[biz?.address?.city, biz?.address?.state].map((v) => String(v || '').trim().replace(/[-,\s]+$/, '')).filter(Boolean).join(', '), String(biz?.address?.pincode || '').trim()].filter(Boolean).join(' ')}</Text>}
          {biz?.phone && <Text style={s.bizText}> | P: {biz.phone}</Text>}
          {biz?.email && <Text style={s.bizText}> | E: {biz.email}</Text>}
          {biz?.gstin && <Text style={[s.bizText, { fontFamily: B, color: PRIMARY }]}> | GSTIN: {biz.gstin}</Text>}
        </View>

        <View style={s.cardsRow}>
          <View style={s.card}>
            <Text style={s.cardHeader}>Billed To</Text>
            <Text style={s.clientName}>{client?.name}</Text>
            {client?.address?.street && <Text style={s.clientText}>{client.address.street}</Text>}
            {client?.address?.city && <Text style={s.clientText}>{client.address.city}, {client.address.state} {client.address.pincode}</Text>}
            {client?.phone && <Text style={s.clientText}>P: {client.phone}</Text>}
            {client?.email && <Text style={s.clientText}>E: {client.email}</Text>}
          </View>
          
          <View style={s.card}>
             <Text style={s.cardHeader}>Details</Text>
             <View style={s.metaRow}>
               <Text style={s.metaLabel}>Date of Issue:</Text>
               <Text style={s.metaVal}>{new Date(invoice.issueDate).toLocaleDateString('en-US')}</Text>
             </View>
             {invoice.dueDate && (
               <View style={s.metaRow}>
                 <Text style={s.metaLabel}>Due Date:</Text>
                 <Text style={s.metaVal}>{new Date(invoice.dueDate).toLocaleDateString('en-US')}</Text>
               </View>
             )}
             
             {isQuotation && biz?.bankDetails?.accountNumber && (
              <View style={{ marginTop: 10 }}>
                <Text style={[s.cardHeader, { marginBottom: 4 }]}>Payment Info</Text>
                {biz.bankDetails.bankName && <Text style={s.clientText}>Bank: {biz.bankDetails.bankName}</Text>}
                {biz.bankDetails.accountName && <Text style={s.clientText}>A/C Name: {biz.bankDetails.accountName}</Text>}
                <Text style={s.clientText}>A/C: {biz.bankDetails.accountNumber}</Text>
                {biz.bankDetails.ifscCode && <Text style={s.clientText}>IFSC: {biz.bankDetails.ifscCode}</Text>}
                {biz.bankDetails.swiftCode && <Text style={s.clientText}>SWIFT: {biz.bankDetails.swiftCode}</Text>}
                {biz.bankDetails.branch && <Text style={s.clientText}>Branch: {biz.bankDetails.branch}</Text>}
              </View>
            )}
            {!biz?.bankDetails?.accountNumber && invoice.paymentInfo && (
               <View style={{ marginTop: 10 }}>
                  <Text style={[s.cardHeader, { marginBottom: 4 }]}>Payment Info</Text>
                  <Text style={s.clientText}>{invoice.paymentInfo}</Text>
               </View>
            )}
          </View>
        </View>

        <View style={s.table}>
          <View style={s.tHead}>
            <Text style={[s.th, s.colNo]}>#</Text>
            <Text style={[s.th, s.colDesc]}>Description</Text>
            {hasHsn && <Text style={[s.th, s.colHsn]}>HSN</Text>}
            <Text style={[s.th, s.colQty]}>QTY</Text>
            <Text style={[s.th, s.colPrice]}>PRICE</Text>
            {hasDiscount && <Text style={[s.th, s.colDisc]}>DISC</Text>}
            {showCGST && <Text style={[s.th, s.colTax]}>CGST</Text>}
            {showSGST && <Text style={[s.th, s.colTax]}>SGST</Text>}
            {showIGST && <Text style={[s.th, s.colTax]}>IGST</Text>}
            {showVAT && <Text style={[s.th, s.colTax]}>VAT</Text>}
            <Text style={[s.th, s.colTotal]}>AMOUNT</Text>
          </View>

          {invoice.items?.map((item, i) => (
            <View key={i} style={s.tRow}>
              <Text style={[s.td, s.colNo]}>{i + 1}</Text>
              <View style={[s.td, s.colDesc, { paddingRight: 10 }]}>
                <Text style={{ fontFamily: M }}>{item.name}</Text>
                {item.description && <Text style={{ fontSize: 7.5, color: '#6B7280', marginTop: 3 }}>{item.description}</Text>}
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

        <View style={s.bottomFlex}>
          <View style={s.notesBox}>
            {invoice.notes && (
              <View style={{ marginBottom: 15 }}>
                <Text style={s.sectionTitle}>Notes</Text>
                <Text style={s.notesText}>{notesText}</Text>
              </View>
            )}
            {invoice.termsAndConditions && (
              <View>
                <Text style={s.sectionTitle}>Terms & Conditions</Text>
                <Text style={s.notesText}>{termsText}</Text>
              </View>
            )}
            
            <View style={s.sigBox} wrap={false}>
              {biz?.businessSignature && <Image src={biz.businessSignature} style={s.sigImg} />}
              <View style={s.sigLine} />
              <Text style={s.sigText}>Authorised Signatory</Text>
            </View>
          </View>

          <View style={s.totalsCard}>
            <View style={s.totRow}><Text style={s.totLabel}>Subtotal</Text><Text style={s.totVal}>{fmt(invoice.subtotal)}</Text></View>
            {invoice.discountAmount > 0 && <View style={s.totRow}><Text style={s.totLabel}>Discount</Text><Text style={s.totVal}>-{fmt(invoice.discountAmount)}</Text></View>}
            {showCGST && <View style={s.totRow}><Text style={s.totLabel}>CGST</Text><Text style={s.totVal}>{fmt(invoice.cgstTotal)}</Text></View>}
            {showSGST && <View style={s.totRow}><Text style={s.totLabel}>SGST</Text><Text style={s.totVal}>{fmt(invoice.sgstTotal)}</Text></View>}
            {showIGST && <View style={s.totRow}><Text style={s.totLabel}>IGST</Text><Text style={s.totVal}>{fmt(invoice.igstTotal)}</Text></View>}
            {showVAT && <View style={s.totRow}><Text style={s.totLabel}>VAT</Text><Text style={s.totVal}>{fmt(invoice.vatTotal)}</Text></View>}
            {invoice.roundOff && Math.abs(roundOffDiff) > 0.001 && <View style={s.totRow}><Text style={s.totLabel}>Round Off</Text><Text style={s.totVal}>{roundOffDiff >= 0 ? '+' : '-'}{fmt(Math.abs(roundOffDiff))}</Text></View>}
            <View style={s.totDivider} />
            <View style={s.grandTotRow}>
              <Text style={s.grandTotLabel}>Total {currency}</Text>
              <Text style={s.grandTotVal}>{fmt(invoice.total)}</Text>
            </View>
          </View>
        </View>

        <View style={s.footerBox} fixed>
          <View style={s.footerPill}>
            {biz?.phone && <Text style={s.footerText}>P: {biz.phone}</Text>}
            {biz?.email && <Text style={s.footerText}>E: {biz.email}</Text>}
            <Text style={s.footerText}>
              Powered by <Text style={{ fontSize: 8, fontFamily: 'Helvetica' }}>™</Text><Link style={s.footerLink} src="https://invoice.goodsynk.com">GoodSynk</Link>
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}