import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { buildScaledStyles } from './Pdfheaderscaling';

Font.register({ family: 'Inter', src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYMZhrib2Bg-4.ttf' });
Font.register({ family: 'Inter-Bold', src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYMZhrib2Bg-4.ttf' });
Font.registerHyphenationCallback(word => [word]);

const B = 'Inter-Bold';

const hexToRgba = (hex, alpha) => {
  if (!hex) return 'rgba(0, 0, 0, ' + alpha + ')';
  let clean = hex.replace('#', '');
  if (clean.length === 3) clean = clean.split('').map(c => c + c).join('');
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + alpha + ')';
};

const isRasterImage = (url) => typeof url === 'string' && url.trim().length > 0 && !url.trim().startsWith('data:image/svg') && !url.includes('OFFICIAL WATERMARK');

export default function Template20({ invoice }) {
  const inv = invoice || {};
  const client = inv.client || {};
  const biz = inv.user || inv.biz || {};
  const colors = inv.templateColors || { primary: '#0F172A', secondary: '#38BDF8' };
  const PRIMARY = colors.primary || '#0F172A';
  const ACCENT = colors.secondary || '#38BDF8';
  const scaled = buildScaledStyles(biz);

  const isQuotation = inv.invoiceType === 'quotation' || inv.documentType === 'quotation';
  const docTitle = isQuotation ? 'QUOTATION' : 'TAX INVOICE';
  const docNumber = isQuotation ? (inv.quotationNumber || inv.invoiceNumber || 'QT/2026/001') : (inv.invoiceNumber || 'INV/2026/001');
  const currency = inv._currency || inv.currency || 'INR';
  const currSymbol = currency === 'INR' ? '₹' : `${currency} `;
  const fmt = (n) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);

  const bizName = biz?.businessName || biz?.name || 'Company Name';

  const s = StyleSheet.create({
    page: { paddingTop: 25, paddingBottom: 50, paddingHorizontal: 30, fontFamily: 'Inter', color: '#1E293B', fontSize: 8 },
    watermarkContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', zIndex: -100 },
    watermarkText: { fontSize: 60, fontFamily: B, color: hexToRgba('#0F172A', 0.06), transform: 'rotate(-45deg)', letterSpacing: 5 },
    watermarkImg: { width: 250, height: 250, objectFit: 'contain', opacity: 0.12 },

    outerBox: { borderWidth: 1, borderColor: PRIMARY },
    headerBar: { backgroundColor: PRIMARY, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    brandTitleRow: { flexDirection: 'row', alignItems: 'center' },
    logoImg: { width: 32, height: 32, objectFit: 'contain', marginRight: 8 },
    brandTitle: { fontSize: 13, fontFamily: B, color: '#FFFFFF', letterSpacing: 0.5 },
    docTitle: { fontSize: 11, fontFamily: B, color: ACCENT, textTransform: 'uppercase' },

    bizSubHeader: { paddingHorizontal: 12, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: PRIMARY, backgroundColor: '#F8FAFC' },
    bizSubTitle: { fontSize: 8.5, fontFamily: B, color: PRIMARY },
    bizSubText: { fontSize: 7, color: '#475569', lineHeight: 1.3 },

    threeBox: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: PRIMARY, backgroundColor: '#F8FAFC' },
    boxCol1: { width: '35%', padding: 8, borderRightWidth: 1, borderRightColor: '#CBD5E1' },
    boxCol2: { width: '33%', padding: 8, borderRightWidth: 1, borderRightColor: '#CBD5E1' },
    boxCol3: { width: '32%', padding: 8 },

    boxLabel: { fontSize: 6.5, fontFamily: B, color: PRIMARY, textTransform: 'uppercase', marginBottom: 3 },
    boxTextBold: { fontSize: 8, fontFamily: B, color: '#1E293B' },
    boxText: { fontSize: 7, color: '#475569', lineHeight: 1.3 },

    table: { borderWidth: 0.75, borderColor: PRIMARY, marginHorizontal: 12, marginVertical: 10 },
    tHead: { flexDirection: 'row', backgroundColor: PRIMARY, paddingVertical: 5 },
    th: { fontSize: 6.5, fontFamily: B, color: '#FFFFFF', textAlign: 'center' },
    colNo: { width: '5%' },
    colDesc: { width: '38%', textAlign: 'left', paddingLeft: 4 },
    colHsn: { width: '12%' },
    colQty: { width: '8%', textAlign: 'right' },
    colRate: { width: '12%', textAlign: 'right' },
    colTaxable: { width: '13%', textAlign: 'right' },
    colTotal: { width: '12%', textAlign: 'right', paddingRight: 4 },

    tRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#E2E8F0', paddingVertical: 5, minHeight: 18 },
    td: { fontSize: 7, color: '#1E293B', textAlign: 'center' },
    tdDescTitle: { fontFamily: B, color: '#0F172A' },
    tdDescSub: { fontSize: 6, color: '#64748B' },

    lowerGrid: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 12, marginTop: 4 },
    bankQrBox: { width: '55%', borderWidth: 0.75, borderColor: '#CBD5E1', padding: 8, backgroundColor: '#F8FAFC', flexDirection: 'row', justifyContent: 'space-between' },
    bankCol: { width: '65%' },
    qrCol: { width: '30%', alignItems: 'center', justifyContent: 'center' },
    qrBox: { width: 42, height: 42, borderWidth: 0.5, borderColor: '#94A3B8', backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },

    totalsBox: { width: '42%', borderWidth: 0.75, borderColor: PRIMARY },
    totRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 6, paddingVertical: 3 },
    totKey: { fontSize: 7, color: '#334155' },
    totVal: { fontSize: 7, fontFamily: B, color: '#0F172A' },
    grandRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: PRIMARY, paddingHorizontal: 6, paddingVertical: 4 },
    grandKey: { fontSize: 8.5, fontFamily: B, color: '#FFFFFF' },
    grandVal: { fontSize: 8.5, fontFamily: B, color: ACCENT },

    sigRow: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 12, marginTop: 25 },
    sigColLeft: { width: '40%' },
    sigColRight: { width: '40%', alignItems: 'flex-end' },
    sigLine: { width: 100, borderTopWidth: 0.5, borderTopColor: '#94A3B8', marginTop: 20 },
    sigText: { fontSize: 6.5, color: '#64748B', marginTop: 2 },

    pageFooter: { position: 'absolute', bottom: 15, left: 30, right: 30, textAlign: 'center' },
    footerText: { fontSize: 6.5, color: '#94A3B8' },
  });

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {(!biz?.plan || String(biz.plan).toLowerCase() === 'free') ? (
          <View style={s.watermarkContainer} fixed>
            <Text style={s.watermarkText}>GoodSynk</Text>
          </View>
        ) : isRasterImage(inv.watermarkImage || biz.watermarkImage) ? (
          <View style={s.watermarkContainer} fixed>
            <Image src={inv.watermarkImage || biz.watermarkImage} style={s.watermarkImg} />
          </View>
        ) : null}

        <View style={s.outerBox}>
          <View style={s.headerBar}>
            <View style={s.brandTitleRow}>
              {isRasterImage(biz?.logo) ? <Image src={biz.logo} style={s.logoImg} /> : null}
              <Text style={s.brandTitle}>{bizName}</Text>
            </View>
            <Text style={s.docTitle}>{docTitle}</Text>
          </View>

          <View style={s.bizSubHeader}>
            <Text style={s.bizSubTitle}>{bizName}</Text>
            {biz?.gstin ? <Text style={s.bizSub}>GSTIN: {biz.gstin} | PAN: {biz?.pan || 'AAAAA0000A'}</Text> : null}
            {biz?.address ? <Text style={s.bizSub}>{biz.address}{biz?.city ? `, ${biz.city}` : ''}</Text> : null}
          </View>

          <View style={s.threeBox}>
            <View style={s.boxCol1}>
              <Text style={s.boxLabel}>Bill To (Recipient):</Text>
              <Text style={s.boxTextBold}>{client?.name || client?.clientName || 'Client Name'}</Text>
              {client?.gstin ? <Text style={s.boxText}>GSTIN: {client.gstin}</Text> : null}
              <Text style={s.boxText}>{client?.address || ''}</Text>
            </View>

            <View style={s.boxCol2}>
              <Text style={s.boxLabel}>Document Details:</Text>
              <Text style={s.boxText}>{isQuotation ? 'Quotation #' : 'Invoice #'}: <Text style={{ fontFamily: B }}>{docNumber}</Text></Text>
              <Text style={s.boxText}>Date: <Text style={{ fontFamily: B }}>{inv.invoiceDate || inv.date || '12 Sep 2026'}</Text></Text>
              {inv.dueDate ? <Text style={s.boxText}>Due Date: <Text style={{ fontFamily: B }}>{inv.dueDate}</Text></Text> : null}
            </View>

            <View style={s.boxCol3}>
              <Text style={s.boxLabel}>Supply Details:</Text>
              <Text style={s.boxText}>Place of Supply: <Text style={{ fontFamily: B }}>{inv.placeOfSupply || client?.state || '27-MAHARASHTRA'}</Text></Text>
              <Text style={s.boxText}>P.O. No: <Text style={{ fontFamily: B }}>{inv.poNumber || '-'}</Text></Text>
            </View>
          </View>

          <View style={s.table}>
            <View style={s.tHead}>
              <Text style={[s.th, s.colNo]}>#</Text>
              <Text style={[s.th, s.colDesc]}>Item &amp; Description</Text>
              <Text style={[s.th, s.colHsn]}>HSN/SAC</Text>
              <Text style={[s.th, s.colQty]}>Qty</Text>
              <Text style={[s.th, s.colRate]}>Rate</Text>
              <Text style={[s.th, s.colTaxable]}>Taxable Val</Text>
              <Text style={[s.th, s.colTotal]}>Total</Text>
            </View>

            {inv.items?.map((item, idx) => {
              const qty = Number(item.quantity) || 1;
              const rate = Number(item.rate || item.price) || 0;
              const taxable = qty * rate;
              const taxPct = Number(item.tax) || 0;
              const total = taxable + ((taxable * taxPct) / 100);
              return (
                <View key={idx} style={s.tRow}>
                  <Text style={[s.td, s.colNo]}>{idx + 1}</Text>
                  <View style={s.colDesc}>
                    <Text style={s.tdDescTitle}>{item.name || item.description}</Text>
                    {item.description && item.name ? <Text style={s.tdDescSub}>{item.description}</Text> : null}
                  </View>
                  <Text style={[s.td, s.colHsn]}>{item.hsn || '-'}</Text>
                  <Text style={[s.td, s.colQty]}>{qty}</Text>
                  <Text style={[s.td, s.colRate]}>{fmt(rate)}</Text>
                  <Text style={[s.td, s.colTaxable]}>{fmt(taxable)}</Text>
                  <Text style={[s.td, s.colTotal]}>{fmt(total)}</Text>
                </View>
              );
            })}
          </View>

          <View style={s.lowerGrid}>
            <View style={s.bankQrBox}>
              <View style={s.bankCol}>
                <Text style={[s.boxLabel, { marginBottom: 4 }]}>Payment &amp; Banking Details</Text>
                {biz?.bankName ? <Text style={s.boxText}>Bank: <Text style={{ fontFamily: B }}>{biz.bankName}</Text></Text> : null}
                {biz?.accountNumber ? <Text style={s.boxText}>A/C: <Text style={{ fontFamily: B }}>{biz.accountNumber}</Text></Text> : null}
                {biz?.ifscCode ? <Text style={s.boxText}>IFSC: <Text style={{ fontFamily: B }}>{biz.ifscCode}</Text></Text> : null}
                {biz?.bankBranch ? <Text style={s.boxText}>Branch: <Text style={{ fontFamily: B }}>{biz.bankBranch}</Text></Text> : null}
              </View>
              <View style={s.qrCol}>
                <View style={s.qrBox}>
                  <Text style={{ fontSize: 5, color: '#64748B' }}>UPI PAY</Text>
                </View>
              </View>
            </View>

            <View style={s.totalsBox}>
              <View style={s.totRow}><Text style={s.totKey}>Taxable Value</Text><Text style={s.totVal}>{currSymbol}{fmt(inv.subtotal || inv.total)}</Text></View>
              {(inv.taxTotal || inv.tax) ? (
                <View style={s.totRow}><Text style={s.totKey}>Tax</Text><Text style={s.totVal}>{currSymbol}{fmt(inv.taxTotal || inv.tax)}</Text></View>
              ) : null}
              <View style={s.grandRow}>
                <Text style={s.grandKey}>Grand Total</Text>
                <Text style={s.grandVal}>{currSymbol}{fmt(inv.total)}</Text>
              </View>
            </View>
          </View>

          <View style={s.sigRow}>
            <View style={s.sigColLeft}>
              <Text style={s.boxText}>Prepared By</Text>
              <View style={s.sigLine} />
              <Text style={s.sigText}>Accounts Executive</Text>
            </View>

            <View style={s.sigColRight}>
              <Text style={s.boxText}>For {bizName}</Text>
              {isRasterImage(biz?.signature) ? (
                <Image src={biz.signature} style={{ width: 60, height: 20, objectFit: 'contain' }} />
              ) : (
                <View style={s.sigLine} />
              )}
              <Text style={s.sigText}>Authorised Signatory</Text>
            </View>
          </View>
        </View>

        <View style={s.pageFooter} fixed>
          <Text style={s.footerText}>This document is generated by GoodSynk Compliance Manager</Text>
        </View>
      </Page>
    </Document>
  );
}
