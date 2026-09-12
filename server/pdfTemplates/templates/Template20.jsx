import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { buildScaledStyles } from './Pdfheaderscaling';
import { getAddressStreet, getAddressCityLine, getFullAddress } from './addressUtils';

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

const MAX_INLINE_IMAGE_LENGTH = 2_000_000;
const isRasterImage = (url) => typeof url === 'string' && url.trim().length > 0 && url.trim().length <= MAX_INLINE_IMAGE_LENGTH && !url.trim().startsWith('data:image/svg') && !url.includes('OFFICIAL WATERMARK');

function numberToWords(num) {
  if (!num) return 'Zero';
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  let numStr = String(num).split('.')[0];
  if (numStr.length > 9) return String(num);
  if (numStr.length === 0) return 'Zero';
  const getGroup = (nStr) => {
    let w = '';
    const n = parseInt(nStr, 10);
    if (n > 99) w += a[Math.floor(n / 100)] + 'Hundred ';
    const rem = n % 100;
    if (rem > 0) {
      if (rem < 20) w += a[rem];
      else { w += b[Math.floor(rem / 10)] + ' '; if (rem % 10 > 0) w += a[rem % 10]; }
    }
    return w;
  };
  let crores = 0, lakhs = 0, thousands = 0, rest = 0;
  if (numStr.length > 7) { crores = parseInt(numStr.substring(0, numStr.length - 7), 10); numStr = numStr.substring(numStr.length - 7); }
  if (numStr.length > 5) { lakhs = parseInt(numStr.substring(0, numStr.length - 5), 10); numStr = numStr.substring(numStr.length - 5); }
  if (numStr.length > 3) { thousands = parseInt(numStr.substring(0, numStr.length - 3), 10); numStr = numStr.substring(numStr.length - 3); }
  rest = parseInt(numStr, 10);
  let words = '';
  if (crores) words += getGroup(String(crores)) + 'Crore ';
  if (lakhs) words += getGroup(String(lakhs)) + 'Lakh ';
  if (thousands) words += getGroup(String(thousands)) + 'Thousand ';
  if (rest) words += getGroup(String(rest));
  return words.trim();
}

const DEFAULT_TATA_ITEMS = [
  {
    name: 'Tata Nexon',
    hsn: '87038070',
    rate: 805000.00,
    quantity: 1,
    tax: 18,
    taxable: 805000.00,
    taxAmt: 144900.00,
    total: 949900.00
  },
  {
    name: 'Car accessories Kit',
    description: '1. item - Car cover\n2. item - Cleaning spray',
    hsn: '87089900',
    rate: 2117.80,
    quantity: 1,
    tax: 18,
    taxable: 2117.80,
    taxAmt: 381.20,
    total: 2499.00
  }
];

export default function Template20({ invoice }) {
  const inv = invoice || {};
  const client = inv.client || {};
  const biz = inv.user || inv.biz || {};
  const scaled = buildScaledStyles(biz);

  const isQuotation = inv.invoiceType === 'quotation' || inv.documentType === 'quotation';
  const docTitle = isQuotation ? 'QUOTATION' : 'TAX INVOICE';
  const docNumber = isQuotation ? (inv.quotationNumber || inv.invoiceNumber || 'INV-1') : (inv.invoiceNumber || 'INV-1');
  const docDate = inv.invoiceDate || inv.date || '17 Jun 2023';
  const dueDate = inv.dueDate || '17 Jun 2023';
  const fmt = (n) => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);

  const bizName = (biz?.businessName || biz?.name || 'TATA MOTORS LIMITED').toUpperCase();
  const bizGstin = biz?.gstin || '27AAACT2727Q1ZW';
  const bizAddress1 = getAddressStreet(biz?.address) || 'Nigadi Bhosari Road , PIMPRI';
  const bizAddress2 = getAddressCityLine(biz?.address) || 'Pune, MAHARASHTRA, 411018';
  const bizPhone = biz?.phone || '9999009999';
  const bizEmail = biz?.email || 'Swipe@getswipe.in';

  const clientName = client?.name || client?.clientName || 'Natarajan Chandrasekaran';
  const clientAddrStreet = getAddressStreet(client?.address) || 'Survey 115/1, ISB Rd, Financial District';
  const clientAddrCity = getAddressCityLine(client?.address) || 'Gachibowli, Nanakramguda\nHyderabad, TELANGANA, 500032';
  const clientPhone = client?.phone || '9999009999';

  const shipAddrText = client?.shipAddress || getFullAddress(client?.address) || 'Survey 115/1, ISB Rd, Financial District\nGachibowli, Nanakramguda\nHyderabad, TELANGANA, 500032';
  const placeOfSupply = inv.placeOfSupply || client?.address?.state || '36-TELANGANA';

  const rawItems = (inv.items && inv.items.length > 0) ? inv.items : DEFAULT_TATA_ITEMS;

  let computedItems = rawItems.map(item => {
    const qty = Number(item.quantity) || 1;
    const rate = Number(item.rate || item.price) || 0;
    const taxable = item.taxable !== undefined ? Number(item.taxable) : (qty * rate);
    const taxPct = Number(item.tax) || 0;
    const taxAmt = item.taxAmt !== undefined ? Number(item.taxAmt) : ((taxable * taxPct) / 100);
    const total = item.total !== undefined ? Number(item.total) : (taxable + taxAmt);
    return { ...item, qty, rate, taxable, taxPct, taxAmt, total };
  });

  const totalQty = computedItems.reduce((acc, i) => acc + i.qty, 0);
  const totalTaxable = computedItems.reduce((acc, i) => acc + i.taxable, 0);
  const totalTaxAmt = computedItems.reduce((acc, i) => acc + i.taxAmt, 0);
  const grandTotal = computedItems.reduce((acc, i) => acc + i.total, 0);
  const totalInWords = numberToWords(Math.floor(grandTotal));

  // Group HSN/SAC summary
  const hsnMap = {};
  computedItems.forEach(i => {
    const code = i.hsn || '-';
    if (!hsnMap[code]) {
      hsnMap[code] = { hsn: code, taxable: 0, taxPct: i.taxPct, taxAmt: 0, totalTax: 0 };
    }
    hsnMap[code].taxable += i.taxable;
    hsnMap[code].taxAmt += i.taxAmt;
    hsnMap[code].totalTax += i.taxAmt;
  });
  const hsnList = Object.values(hsnMap);

  const bankName = biz?.bankDetails?.bankName || 'YES BANK';
  const accountNumber = biz?.bankDetails?.accountNumber || '86789999222445';
  const ifscCode = biz?.bankDetails?.ifscCode || 'YESBBIN4567';
  const branch = biz?.bankDetails?.branch || 'Kodihalli';

  const paidAmount = inv.paidAmount || 0;
  const isPaid = paidAmount > 0 || inv.status === 'Paid';

  const s = StyleSheet.create({
    page: { paddingTop: 20, paddingBottom: 35, paddingHorizontal: 25, fontFamily: 'Inter', color: '#111827', fontSize: 7.5 },
    watermarkContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', zIndex: -100 },
    watermarkText: { fontSize: 60, fontFamily: B, color: hexToRgba('#111827', 0.06), transform: 'rotate(-45deg)', letterSpacing: 5 },
    watermarkImg: { width: 250, height: 250, objectFit: 'contain', opacity: 0.12 },

    titleHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    topDocTitle: { fontSize: 11, fontFamily: B, color: '#1E3A8A', letterSpacing: 0.5, textAlign: 'center', flex: 1, paddingLeft: 60 },
    docCopyTag: { fontSize: 6.5, fontFamily: B, color: '#4B5563', textTransform: 'uppercase' },

    outerBox: { borderWidth: 0.75, borderColor: '#374151' },

    headerGrid: { flexDirection: 'row', borderBottomWidth: 0.75, borderBottomColor: '#374151' },
    headerLeft: { width: '48%', padding: 6, borderRightWidth: 0.75, borderRightColor: '#374151' },
    brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    logoImg: { width: 36, height: 36, objectFit: 'contain', marginRight: 8 },
    bizTitle: { fontSize: 10, fontFamily: B, color: '#1E293B' },
    bizSub: { fontSize: 7, color: '#374151', lineHeight: 1.25 },

    headerRight: { width: '52%' },
    docMetaGrid: { flexDirection: 'row', borderBottomWidth: 0.75, borderBottomColor: '#374151' },
    docMetaCol1: { width: '50%', padding: 4, borderRightWidth: 0.75, borderRightColor: '#374151' },
    docMetaCol2: { width: '50%', padding: 4 },
    metaLabel: { fontSize: 6.5, color: '#4B5563' },
    metaVal: { fontSize: 7, fontFamily: B, color: '#111827' },

    shipAddressBox: { padding: 4 },
    sectionLabelBold: { fontSize: 7, fontFamily: B, color: '#111827', marginBottom: 1.5 },
    addressText: { fontSize: 6.5, color: '#374151', lineHeight: 1.25 },

    custRow: { flexDirection: 'row', borderBottomWidth: 0.75, borderBottomColor: '#374151', minHeight: 65 },
    custColLeft: { width: '48%', padding: 6, borderRightWidth: 0.75, borderRightColor: '#374151' },
    custColRight: { width: '52%', padding: 6 },

    table: { borderBottomWidth: 0.75, borderBottomColor: '#374151' },
    tHead: { flexDirection: 'row', borderBottomWidth: 0.75, borderBottomColor: '#374151', backgroundColor: '#FFFFFF', paddingVertical: 3 },
    th: { fontSize: 6.5, fontFamily: B, color: '#111827', textAlign: 'center' },

    colNo: { width: '4%', borderRightWidth: 0.75, borderRightColor: '#374151' },
    colItem: { width: '31%', textAlign: 'left', paddingLeft: 4, paddingRight: 4, borderRightWidth: 0.75, borderRightColor: '#374151' },
    colHsn: { width: '12%', borderRightWidth: 0.75, borderRightColor: '#374151' },
    colRate: { width: '12%', textAlign: 'right', paddingRight: 4, borderRightWidth: 0.75, borderRightColor: '#374151' },
    colQty: { width: '6%', borderRightWidth: 0.75, borderRightColor: '#374151' },
    colTaxable: { width: '12%', textAlign: 'right', paddingRight: 4, borderRightWidth: 0.75, borderRightColor: '#374151' },
    colTax: { width: '11%', textAlign: 'right', paddingRight: 4, borderRightWidth: 0.75, borderRightColor: '#374151' },
    colAmount: { width: '12%', textAlign: 'right', paddingRight: 4 },

    tRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#E5E7EB', paddingVertical: 4, minHeight: 18 },
    td: { fontSize: 6.5, color: '#111827', textAlign: 'center' },
    tdItemName: { fontFamily: B, color: '#111827' },
    tdItemDesc: { fontSize: 6, color: '#4B5563', marginTop: 1, lineHeight: 1.2 },

    tableSummaryRow: { flexDirection: 'row', borderTopWidth: 0.75, borderTopColor: '#374151', borderBottomWidth: 0.75, borderBottomColor: '#374151' },
    sumLeftCol: { width: '65%', padding: 4, justifyContent: 'center', borderRightWidth: 0.75, borderRightColor: '#374151' },
    sumRightCol: { width: '35%' },
    subTotRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, paddingVertical: 2 },
    grandTotRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, paddingVertical: 3, borderTopWidth: 0.75, borderTopColor: '#374151' },
    grandTotText: { fontSize: 8.5, fontFamily: B, color: '#111827' },

    wordsStrip: { paddingHorizontal: 6, paddingVertical: 4, borderBottomWidth: 0.75, borderBottomColor: '#374151', fontSize: 6.5, color: '#374151' },

    hsnTable: { borderBottomWidth: 0.75, borderBottomColor: '#374151' },
    hsnHead: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#374151', paddingVertical: 2 },
    hsnTh: { fontSize: 6, fontFamily: B, color: '#111827', textAlign: 'center' },
    hsnCol1: { width: '25%', borderRightWidth: 0.5, borderRightColor: '#374151' },
    hsnCol2: { width: '25%', textAlign: 'right', paddingRight: 4, borderRightWidth: 0.5, borderRightColor: '#374151' },
    hsnCol3: { width: '28%', borderRightWidth: 0.5, borderRightColor: '#374151' },
    hsnCol4: { width: '22%', textAlign: 'right', paddingRight: 4 },

    hsnRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#E5E7EB', paddingVertical: 2.5 },
    hsnTd: { fontSize: 6, color: '#111827', textAlign: 'center' },

    hsnTotRow: { flexDirection: 'row', borderTopWidth: 0.75, borderTopColor: '#374151', paddingVertical: 2.5, backgroundColor: '#F9FAFB' },

    paidBadgeBox: { position: 'absolute', right: 8, bottom: 2, flexDirection: 'row', alignItems: 'center', backgroundColor: '#DCFCE7', paddingVertical: 1.5, paddingHorizontal: 5, borderRadius: 2 },
    paidDot: { width: 3.5, height: 3.5, borderRadius: 2, backgroundColor: '#22C55E', marginRight: 2 },
    paidBadgeText: { fontSize: 5.5, fontFamily: B, color: '#15803D' },

    bottomGrid: { flexDirection: 'row', borderBottomWidth: 0.75, borderBottomColor: '#374151', minHeight: 90 },
    bankCol: { width: '45%', padding: 6, borderRightWidth: 0.75, borderRightColor: '#374151' },
    upiCol: { width: '20%', padding: 4, alignItems: 'center', justifyContent: 'center', borderRightWidth: 0.75, borderRightColor: '#374151' },
    sigCol: { width: '35%', padding: 6, alignItems: 'center', justifyContent: 'space-between' },

    bankRow: { flexDirection: 'row', marginBottom: 2 },
    bankKey: { fontSize: 6.5, color: '#4B5563', width: 50 },
    bankVal: { fontSize: 6.5, fontFamily: B, color: '#111827' },

    qrBox: { width: 55, height: 55, borderWidth: 0.5, borderColor: '#9CA3AF', backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
    qrText: { fontSize: 5, color: '#6B7280', textAlign: 'center' },

    sigBoxCircle: { width: 52, height: 52, borderRadius: 26, borderWidth: 1, borderColor: '#1E3A8A', borderStyle: 'solid', alignItems: 'center', justifyContent: 'center', marginVertical: 2 },
    sigTextSmall: { fontSize: 5.5, color: '#1E3A8A', fontFamily: B, textAlign: 'center' },

    notesTermsGrid: { flexDirection: 'row', padding: 6 },
    notesCol: { width: '48%', paddingRight: 6 },
    termsCol: { width: '52%', borderLeftWidth: 0.75, borderLeftColor: '#374151', paddingLeft: 6 },

    notesText: { fontSize: 6.5, color: '#374151', marginTop: 2 },
    termItem: { fontSize: 6, color: '#4B5563', lineHeight: 1.25, marginBottom: 1 },

    pageFooter: { position: 'absolute', bottom: 12, left: 25, right: 25, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    footerText: { fontSize: 6, color: '#6B7280' },
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

        <View style={s.titleHeaderRow}>
          <Text style={s.topDocTitle}>{docTitle}</Text>
          <Text style={s.docCopyTag}>ORIGINAL FOR RECIPIENT</Text>
        </View>

        <View style={s.outerBox}>
          {/* Top Header Block */}
          <View style={s.headerGrid}>
            <View style={s.headerLeft}>
              <View style={s.brandRow}>
                {isRasterImage(biz?.businessLogo) ? (
                  <Image src={biz.businessLogo} style={s.logoImg} />
                ) : null}
                <View>
                  <Text style={s.bizTitle}>{bizName}</Text>
                </View>
              </View>
              <Text style={s.bizSub}><Text style={{ fontFamily: B }}>GSTIN </Text>{bizGstin}</Text>
              <Text style={s.bizSub}>{bizAddress1}</Text>
              <Text style={s.bizSub}>{bizAddress2}</Text>
              <Text style={s.bizSub}>Mobile <Text style={{ fontFamily: B }}>{bizPhone}</Text></Text>
              <Text style={s.bizSub}>Email <Text style={{ fontFamily: B }}>{bizEmail}</Text></Text>
            </View>

            <View style={s.headerRight}>
              <View style={s.docMetaGrid}>
                <View style={s.docMetaCol1}>
                  <Text style={s.metaLabel}>{isQuotation ? 'Quotation #:' : 'Invoice #:'}</Text>
                  <Text style={s.metaVal}>{docNumber}</Text>
                  <Text style={[s.metaLabel, { marginTop: 4 }]}>Place of Supply:</Text>
                  <Text style={s.metaVal}>{placeOfSupply}</Text>
                </View>

                <View style={s.docMetaCol2}>
                  <Text style={s.metaLabel}>{isQuotation ? 'Quotation Date:' : 'Invoice Date:'}</Text>
                  <Text style={s.metaVal}>{docDate}</Text>
                  <Text style={[s.metaLabel, { marginTop: 4 }]}>{isQuotation ? 'Validity:' : 'Due Date:'}</Text>
                  <Text style={s.metaVal}>{dueDate}</Text>
                </View>
              </View>

              <View style={s.shipAddressBox}>
                <Text style={s.sectionLabelBold}>Shipping address:</Text>
                <Text style={s.addressText}>{shipAddrText}</Text>
              </View>
            </View>
          </View>

          {/* Customer Details Block */}
          <View style={s.custRow}>
            <View style={s.custColLeft}>
              <Text style={s.sectionLabelBold}>Customer Details:</Text>
              <Text style={{ fontSize: 7.5, fontFamily: B, color: '#1E293B', marginBottom: 2 }}>{clientName}</Text>
              <Text style={s.sectionLabelBold}>Billing address:</Text>
              <Text style={s.addressText}>{clientAddrStreet}</Text>
              <Text style={s.addressText}>{clientAddrCity}</Text>
              <Text style={s.addressText}>Ph: {clientPhone}</Text>
            </View>

            <View style={s.custColRight}>
              <Text style={s.sectionLabelBold}>Shipping address:</Text>
              <Text style={s.addressText}>{shipAddrText}</Text>
            </View>
          </View>

          {/* Items Description Table */}
          <View style={s.table}>
            <View style={s.tHead}>
              <Text style={[s.th, s.colNo]}>#</Text>
              <Text style={[s.th, s.colItem]}>Item</Text>
              <Text style={[s.th, s.colHsn]}>HSN/SAC</Text>
              <Text style={[s.th, s.colRate]}>Rated Item</Text>
              <Text style={[s.th, s.colQty]}>Qty</Text>
              <Text style={[s.th, s.colTaxable]}>Taxable Value</Text>
              <Text style={[s.th, s.colTax]}>Tax Amount</Text>
              <Text style={[s.th, s.colAmount]}>Amount</Text>
            </View>

            {computedItems.map((item, idx) => (
              <View key={idx} style={s.tRow}>
                <Text style={[s.td, s.colNo]}>{idx + 1}</Text>
                <View style={s.colItem}>
                  <Text style={s.tdItemName}>{item.name || item.description}</Text>
                  {item.description && item.name ? (
                    <Text style={s.tdItemDesc}>{item.description}</Text>
                  ) : null}
                </View>
                <Text style={[s.td, s.colHsn]}>{item.hsn || '-'}</Text>
                <Text style={[s.td, s.colRate]}>{fmt(item.rate)}</Text>
                <Text style={[s.td, s.colQty]}>{item.qty}</Text>
                <Text style={[s.td, s.colTaxable]}>{fmt(item.taxable)}</Text>
                <Text style={[s.td, s.colTax]}>{fmt(item.taxAmt)} ({item.taxPct}%)</Text>
                <Text style={[s.td, s.colAmount]}>{fmt(item.total)}</Text>
              </View>
            ))}

            {/* Table Summary Row */}
            <View style={s.tableSummaryRow}>
              <View style={s.sumLeftCol}>
                <Text style={{ fontSize: 6.5, color: '#374151' }}>Total items / Qty : {computedItems.length} / {totalQty.toFixed(3)}</Text>
              </View>
              <View style={s.sumRightCol}>
                <View style={s.subTotRow}>
                  <Text style={{ fontSize: 6.5, color: '#4B5563' }}>Taxable Amount</Text>
                  <Text style={{ fontSize: 6.5, fontFamily: B, color: '#111827' }}>₹{fmt(totalTaxable)}</Text>
                </View>
                <View style={s.subTotRow}>
                  <Text style={{ fontSize: 6.5, color: '#4B5563' }}>IGST 18.0%</Text>
                  <Text style={{ fontSize: 6.5, fontFamily: B, color: '#111827' }}>₹{fmt(totalTaxAmt)}</Text>
                </View>
                <View style={s.grandTotRow}>
                  <Text style={s.grandTotText}>Total</Text>
                  <Text style={s.grandTotText}>₹{fmt(grandTotal)}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Total Amount in Words */}
          <View style={s.wordsStrip}>
            <Text>Total amount (in words): <Text style={{ fontFamily: B }}>INR {totalInWords} Only.</Text></Text>
          </View>

          {/* HSN/SAC Breakdown Table */}
          <View style={s.hsnTable}>
            <View style={s.hsnHead}>
              <Text style={[s.hsnTh, s.hsnCol1]}>HSN/SAC</Text>
              <Text style={[s.hsnTh, s.hsnCol2]}>Taxable Value</Text>
              <View style={[s.hsnCol3, { alignItems: 'center' }]}>
                <Text style={[s.hsnTh, { borderBottomWidth: 0.5, borderBottomColor: '#374151', width: '100%', textAlign: 'center' }]}>Integrated Tax</Text>
                <View style={{ flexDirection: 'row', width: '100%' }}>
                  <Text style={[s.hsnTh, { width: '50%', borderRightWidth: 0.5, borderRightColor: '#374151' }]}>Rate</Text>
                  <Text style={[s.hsnTh, { width: '50%' }]}>Amount</Text>
                </View>
              </View>
              <Text style={[s.hsnTh, s.hsnCol4]}>Total Tax Amount</Text>
            </View>

            {hsnList.map((row, idx) => (
              <View key={idx} style={s.hsnRow}>
                <Text style={[s.hsnTd, s.hsnCol1]}>{row.hsn}</Text>
                <Text style={[s.hsnTd, s.hsnCol2]}>{fmt(row.taxable)}</Text>
                <View style={[s.hsnCol3, { flexDirection: 'row' }]}>
                  <Text style={[s.hsnTd, { width: '50%', borderRightWidth: 0.5, borderRightColor: '#374151' }]}>{row.taxPct}%</Text>
                  <Text style={[s.hsnTd, { width: '50%', textAlign: 'right', paddingRight: 4 }]}>{fmt(row.taxAmt)}</Text>
                </View>
                <Text style={[s.hsnTd, s.hsnCol4]}>{fmt(row.totalTax)}</Text>
              </View>
            ))}

            <View style={s.hsnTotRow}>
              <Text style={[s.hsnTd, s.hsnCol1, { fontFamily: B }]}>TOTAL</Text>
              <Text style={[s.hsnTd, s.hsnCol2, { fontFamily: B }]}>{fmt(totalTaxable)}</Text>
              <View style={[s.hsnCol3, { flexDirection: 'row' }]}>
                <Text style={[s.hsnTd, { width: '50%', borderRightWidth: 0.5, borderRightColor: '#374151' }]}></Text>
                <Text style={[s.hsnTd, { width: '50%', fontFamily: B, textAlign: 'right', paddingRight: 4 }]}>{fmt(totalTaxAmt)}</Text>
              </View>
              <Text style={[s.hsnTd, s.hsnCol4, { fontFamily: B }]}>{fmt(totalTaxAmt)}</Text>

              {isPaid ? (
                <View style={s.paidBadgeBox}>
                  <View style={s.paidDot} />
                  <Text style={s.paidBadgeText}>Amount Paid</Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Bottom Grid: Bank, UPI QR, Signature & Seal */}
          <View style={s.bottomGrid}>
            <View style={s.bankCol}>
              <Text style={s.sectionLabelBold}>Bank Details:</Text>
              <View style={s.bankRow}><Text style={s.bankKey}>Bank:</Text><Text style={s.bankVal}>{bankName}</Text></View>
              <View style={s.bankRow}><Text style={s.bankKey}>Account #:</Text><Text style={s.bankVal}>{accountNumber}</Text></View>
              <View style={s.bankRow}><Text style={s.bankKey}>IFSC:</Text><Text style={s.bankVal}>{ifscCode}</Text></View>
              <View style={s.bankRow}><Text style={s.bankKey}>Branch:</Text><Text style={s.bankVal}>{branch}</Text></View>
            </View>

            <View style={s.upiCol}>
              <Text style={[s.sectionLabelBold, { marginBottom: 3 }]}>Pay using UPI</Text>
              <View style={s.qrBox}>
                <Text style={s.qrText}>[QR Code]</Text>
              </View>
            </View>

            <View style={s.sigCol}>
              <Text style={{ fontSize: 6.5, color: '#374151', marginBottom: 2 }}>For {bizName}</Text>
              {isRasterImage(biz?.businessSignature || inv.signatureImage) ? (
                <Image src={biz.businessSignature || inv.signatureImage} style={{ width: 70, height: 25, objectFit: 'contain', marginVertical: 2 }} />
              ) : null}
              {isRasterImage(biz?.businessSeal || inv.sealImage) ? (
                <Image src={biz.businessSeal || inv.sealImage} style={{ width: 44, height: 44, objectFit: 'contain', marginVertical: 2 }} />
              ) : null}
              {!isRasterImage(biz?.businessSignature || inv.signatureImage) && !isRasterImage(biz?.businessSeal || inv.sealImage) ? (
                <View style={s.sigBoxCircle}>
                  <Text style={s.sigTextSmall}>SIGNATURE</Text>
                  <Text style={[s.sigTextSmall, { fontSize: 4.5 }]}>GOODSYNK</Text>
                </View>
              ) : null}
              <Text style={{ fontSize: 6, fontFamily: B, color: '#374151', marginTop: 2 }}>Authorised Signatory</Text>
            </View>
          </View>

          {/* Notes & Terms Section */}
          <View style={s.notesTermsGrid}>
            <View style={s.notesCol}>
              <Text style={s.sectionLabelBold}>Notes:</Text>
              <Text style={s.notesText}>{inv.notes || 'Thank you for the Business'}</Text>
            </View>

            <View style={s.termsCol}>
              <Text style={s.sectionLabelBold}>Terms and Conditions:</Text>
              <Text style={s.termItem}>1. Goods once sold cannot be taken back or exchanged.</Text>
              <Text style={s.termItem}>2. We are not the manufacturers; company will stand for warranty as per their terms and conditions.</Text>
              <Text style={s.termItem}>3. Interest @24% p.a. will be charged for uncleared bills beyond 15 days.</Text>
              <Text style={s.termItem}>4. Subject to local Jurisdiction.</Text>
            </View>
          </View>
        </View>

        {/* Page Footer */}
        <View style={s.pageFooter} fixed>
          <Text style={s.footerText}>Page 1 / 1</Text>
          <Text style={s.footerText}>Powered by GoodSynk<Text style={{ fontSize: 5, fontFamily: 'Helvetica' }}>™</Text></Text>
          <Text style={s.footerText}>This is a digitally signed document.</Text>
        </View>
      </Page>
    </Document>
  );
}
