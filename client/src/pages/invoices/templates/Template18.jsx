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

// Caps out inline data-URL images (logo/signature/seal/watermark). Without this,
// an oversized base64 image (e.g. an uncompressed photo used as a watermark)
// can make @react-pdf/renderer fail to produce a PDF at all instead of just
// looking bad -- so we treat anything absurdly large as "no image" rather than
// letting it take down the whole document.
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

export default function Template18({ invoice }) {
  const inv = invoice || {};
  const client = inv.client || {};
  const biz = inv.user || inv.biz || {};
  const colors = inv.templateColors || { primary: '#FFE500', secondary: '#2874F0' };
  const PRIMARY = colors.primary || '#FFE500';
  const scaled = buildScaledStyles(biz);

  const isQuotation = inv.invoiceType === 'quotation' || inv.documentType === 'quotation';
  const docTitle = isQuotation ? 'QUOTATION' : 'TAX INVOICE';
  const docNumber = isQuotation ? (inv.quotationNumber || inv.invoiceNumber || 'QT-1') : (inv.invoiceNumber || 'INV-1');
  const currency = inv._currency || inv.currency || 'INR';
  const currSymbol = currency === 'INR' ? '₹' : `${currency} `;
  const fmt = (n) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);

  const bizName = biz?.businessName || biz?.name || 'Company Name';
  const totalInWords = numberToWords(Math.floor(inv.total || 0));
  const totalQty = inv.items?.reduce((acc, i) => acc + (Number(i.quantity) || 0), 0) || 0;
  const paidAmount = inv.paidAmount || 0;
  const balanceDue = Math.max((inv.total || 0) - paidAmount, 0);
  const isFullyPaid = !isQuotation && paidAmount > 0 && balanceDue <= 0.01;

  const s = StyleSheet.create({
    page: { paddingTop: 25, paddingBottom: 50, paddingHorizontal: 30, fontFamily: 'Inter', color: '#111827', fontSize: 8 },
    watermarkContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', zIndex: -100 },
    watermarkText: { fontSize: 60, fontFamily: B, color: hexToRgba('#111827', 0.06), transform: 'rotate(-45deg)', letterSpacing: 5 },
    watermarkImg: { width: 250, height: 250, objectFit: 'contain', opacity: 0.12 },

    topHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    brandBlock: { flexDirection: 'row', alignItems: 'center' },
    logoImg: { width: 44, height: 44, objectFit: 'contain', marginRight: 10 },
    bizTitle: { fontFamily: B, fontSize: scaled.bizNameFontSize || 14, color: '#111827' },
    bizSub: { fontSize: 7, color: '#4B5563', lineHeight: 1.3 },

    docMetaBlock: { alignItems: 'flex-end' },
    docTypeTitle: { fontFamily: B, fontSize: 13, color: '#111827', textTransform: 'uppercase' },
    docCopyTag: { fontSize: 6.5, fontFamily: B, color: '#4B5563', marginBottom: 4 },
    metaRow: { flexDirection: 'row', marginTop: 1 },
    metaKey: { fontSize: 7, color: '#4B5563', marginRight: 4 },
    metaVal: { fontSize: 7, fontFamily: B, color: '#111827' },

    addressGrid: { marginTop: 8, marginBottom: 10 },
    addressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    addressCol: { width: '48%' },
    addrLabel: { fontSize: 7.5, fontFamily: B, color: '#111827', marginBottom: 2 },
    addrName: { fontSize: 8, fontFamily: B, color: '#1F2937' },
    addrText: { fontSize: 7, color: '#4B5563', lineHeight: 1.3 },

    placeSupply: { fontSize: 7.5, fontFamily: B, color: '#111827', marginTop: 2, marginBottom: 10 },

    table: { borderWidth: 0.75, borderColor: '#9CA3AF', marginBottom: 10 },
    tHead: { flexDirection: 'row', borderBottomWidth: 0.75, borderBottomColor: '#9CA3AF', backgroundColor: '#F9FAFB', paddingVertical: 4 },
    th: { fontSize: 6.5, fontFamily: B, color: '#111827', textAlign: 'center' },
    colNo: { width: '5%', borderRightWidth: 0.75, borderRightColor: '#9CA3AF' },
    colItem: { width: '33%', textAlign: 'left', paddingLeft: 4, paddingRight: 4, borderRightWidth: 0.75, borderRightColor: '#9CA3AF' },
    colHsn: { width: '12%', borderRightWidth: 0.75, borderRightColor: '#9CA3AF' },
    colRate: { width: '12%', textAlign: 'right', paddingRight: 4, borderRightWidth: 0.75, borderRightColor: '#9CA3AF' },
    colQty: { width: '7%', borderRightWidth: 0.75, borderRightColor: '#9CA3AF' },
    colTaxable: { width: '12%', textAlign: 'right', paddingRight: 4, borderRightWidth: 0.75, borderRightColor: '#9CA3AF' },
    colTax: { width: '9%', textAlign: 'right', paddingRight: 4, borderRightWidth: 0.75, borderRightColor: '#9CA3AF' },
    colAmount: { width: '10%', textAlign: 'right', paddingRight: 4 },

    tRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#E5E7EB', paddingVertical: 4, minHeight: 18 },
    td: { fontSize: 6.5, color: '#1F2937', textAlign: 'center' },
    tdItemName: { fontFamily: B, color: '#111827' },
    tdItemDesc: { fontSize: 6, color: '#6B7280' },

    summaryGrid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
    bankCol: { width: '38%' },
    bankTitle: { fontSize: 7.5, fontFamily: B, color: '#111827', marginBottom: 4 },
    bankRow: { flexDirection: 'row', marginBottom: 1.5 },
    bankKey: { fontSize: 7, color: '#4B5563', width: 55 },
    bankVal: { fontSize: 7, fontFamily: B, color: '#111827' },

    qrCol: { width: '22%', alignItems: 'center' },
    qrTitle: { fontSize: 7, fontFamily: B, color: '#111827', marginBottom: 3 },
    qrBox: { width: 44, height: 44, borderWidth: 0.5, borderColor: '#9CA3AF', backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },

    totalsCol: { width: '36%', alignItems: 'flex-end' },
    totRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 3 },
    totKey: { fontSize: 7.5, color: '#374151' },
    totVal: { fontSize: 7.5, fontFamily: B, color: '#111827' },

    grandBox: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', borderWidth: 1, borderColor: '#111827', padding: 4, marginTop: 4 },
    grandKey: { fontSize: 8.5, fontFamily: B, color: '#111827' },
    grandVal: { fontSize: 8.5, fontFamily: B, color: '#111827' },

    paidBadge: { marginTop: 4, flexDirection: 'row', alignItems: 'center', backgroundColor: '#DCFCE7', paddingVertical: 2, paddingHorizontal: 6, borderRadius: 3 },
    paidDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#22C55E', marginRight: 3 },
    paidText: { fontSize: 6.5, fontFamily: B, color: '#15803D' },

    infoStrip: { marginTop: 10, paddingTop: 6, borderTopWidth: 0.5, borderTopColor: '#E5E7EB' },
    infoText: { fontSize: 7, color: '#374151', marginBottom: 2 },

    notesTermsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    notesCol: { width: '60%' },
    sectionTitle: { fontSize: 7.5, fontFamily: B, color: '#111827', marginBottom: 2 },
    termItem: { fontSize: 6.5, color: '#4B5563', lineHeight: 1.3 },

    sigCol: { width: '35%', alignItems: 'flex-end' },
    sigFor: { fontSize: 7.5, color: '#6B7280', marginBottom: 15 },
    sigImg: { width: 70, height: 25, objectFit: 'contain' },
    sealImg: { width: 45, height: 45, objectFit: 'contain', marginTop: 4 },
    sigName: { fontSize: 8, fontFamily: B, color: '#111827' },

    pageFooter: { position: 'absolute', bottom: 15, left: 30, right: 30, borderTopWidth: 0.5, borderTopColor: '#E5E7EB', paddingTop: 4, flexDirection: 'row', justifyContent: 'space-between' },
    footerText: { fontSize: 6.5, color: '#9CA3AF' },
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

        <View style={s.topHeader}>
          <View style={s.brandBlock}>
            {isRasterImage(biz?.businessLogo) ? (
              <Image src={biz.businessLogo} style={s.logoImg} />
            ) : null}
            <View>
              <Text style={s.bizTitle}>{bizName}</Text>
              {biz?.gstin ? <Text style={s.bizSub}>GSTIN: {biz.gstin}</Text> : null}
              {biz?.phone ? <Text style={s.bizSub}>Mobile: {biz.phone}</Text> : null}
              {biz?.email ? <Text style={s.bizSub}>Email: {biz.email}</Text> : null}
              {biz?.website ? <Text style={s.bizSub}>Website: {biz.website}</Text> : null}
            </View>
          </View>

          <View style={s.docMetaBlock}>
            <Text style={s.docTypeTitle}>{docTitle}</Text>
            <Text style={s.docCopyTag}>ORIGINAL FOR RECIPIENT</Text>
            <View style={s.metaRow}><Text style={s.metaKey}>{isQuotation ? 'Quotation #:' : 'Invoice #:'}</Text><Text style={s.metaVal}>{docNumber}</Text></View>
            <View style={s.metaRow}><Text style={s.metaKey}>Date:</Text><Text style={s.metaVal}>{inv.invoiceDate || inv.date || '13 Jul 2023'}</Text></View>
            {inv.dueDate ? <View style={s.metaRow}><Text style={s.metaKey}>Due Date:</Text><Text style={s.metaVal}>{inv.dueDate}</Text></View> : null}
          </View>
        </View>

        <View style={s.addressGrid}>
          <View style={s.addressRow}>
            <View style={s.addressCol}>
              <Text style={s.addrLabel}>Bill From:</Text>
              <Text style={s.addrName}>{bizName}</Text>
              <Text style={s.addrText}>{getAddressStreet(biz?.address)}</Text>
              <Text style={s.addrText}>{getAddressCityLine(biz?.address)}</Text>
            </View>
            <View style={s.addressCol}>
              <Text style={s.addrLabel}>Bill To:</Text>
              <Text style={s.addrName}>{client?.name || client?.clientName || 'Client Name'}</Text>
              <Text style={s.addrText}>{getAddressStreet(client?.address)}</Text>
              <Text style={s.addrText}>{getAddressCityLine(client?.address)}</Text>
              {client?.gstin ? <Text style={s.addrText}>GSTIN: {client.gstin}</Text> : null}
            </View>
          </View>

          <View style={s.addressRow}>
            <View style={s.addressCol}>
              <Text style={s.addrLabel}>Ship From:</Text>
              <Text style={s.addrText}>{biz?.shipAddress || getFullAddress(biz?.address) || 'Same as billing address'}</Text>
            </View>
            <View style={s.addressCol}>
              <Text style={s.addrLabel}>Ship To:</Text>
              <Text style={s.addrText}>{client?.shipAddress || getFullAddress(client?.address) || 'Same as billing address'}</Text>
              {client?.phone ? <Text style={s.addrText}>Ph: {client.phone}</Text> : null}
            </View>
          </View>
        </View>

        {(inv.placeOfSupply || client?.address?.state) ? (
          <Text style={s.placeSupply}>Place of Supply: {inv.placeOfSupply || client?.address?.state}</Text>
        ) : null}

        <View style={s.table}>
          <View style={s.tHead}>
            <Text style={[s.th, s.colNo]}>#</Text>
            <Text style={[s.th, s.colItem]}>Item</Text>
            <Text style={[s.th, s.colHsn]}>HSN/SAC</Text>
            <Text style={[s.th, s.colRate]}>Listed Rate</Text>
            <Text style={[s.th, s.colQty]}>Qty</Text>
            <Text style={[s.th, s.colTaxable]}>Taxable Value</Text>
            <Text style={[s.th, s.colTax]}>Tax Amount</Text>
            <Text style={[s.th, s.colAmount]}>Amount</Text>
          </View>

          {inv.items?.map((item, idx) => {
            const qty = Number(item.quantity) || 1;
            const rate = Number(item.rate || item.price) || 0;
            const taxPct = Number(item.tax) || 0;
            const taxable = qty * rate;
            const taxAmt = (taxable * taxPct) / 100;
            const total = taxable + taxAmt;
            return (
              <View key={idx} style={s.tRow}>
                <Text style={[s.td, s.colNo]}>{idx + 1}</Text>
                <View style={s.colItem}>
                  <Text style={s.tdItemName}>{item.name || item.description}</Text>
                  {item.description && item.name ? <Text style={s.tdItemDesc}>{item.description}</Text> : null}
                </View>
                <Text style={[s.td, s.colHsn]}>{item.hsn || '-'}</Text>
                <Text style={[s.td, s.colRate]}>{fmt(rate)}</Text>
                <Text style={[s.td, s.colQty]}>{qty}</Text>
                <Text style={[s.td, s.colTaxable]}>{fmt(taxable)}</Text>
                <Text style={[s.td, s.colTax]}>{fmt(taxAmt)} ({taxPct}%)</Text>
                <Text style={[s.td, s.colAmount]}>{fmt(total)}</Text>
              </View>
            );
          })}
        </View>

        <View style={s.summaryGrid}>
          <View style={s.bankCol}>
            <Text style={s.bankTitle}>Bank Details:</Text>
            {biz?.bankDetails?.bankName ? <View style={s.bankRow}><Text style={s.bankKey}>Bank:</Text><Text style={s.bankVal}>{biz.bankDetails.bankName}</Text></View> : null}
            {biz?.bankDetails?.accountNumber ? <View style={s.bankRow}><Text style={s.bankKey}>Account #:</Text><Text style={s.bankVal}>{biz.bankDetails.accountNumber}</Text></View> : null}
            {biz?.bankDetails?.ifscCode ? <View style={s.bankRow}><Text style={s.bankKey}>IFSC:</Text><Text style={s.bankVal}>{biz.bankDetails.ifscCode}</Text></View> : null}
            {biz?.bankDetails?.branch ? <View style={s.bankRow}><Text style={s.bankKey}>Branch:</Text><Text style={s.bankVal}>{biz.bankDetails.branch}</Text></View> : null}
          </View>

          <View style={s.qrCol}>
            <Text style={s.qrTitle}>Pay using UPI</Text>
            <View style={s.qrBox}>
              <Text style={{ fontSize: 6, color: '#9CA3AF' }}>[QR Code]</Text>
            </View>
          </View>

          <View style={s.totalsCol}>
            <View style={s.totRow}><Text style={s.totKey}>Taxable Amount</Text><Text style={s.totVal}>{currSymbol}{fmt(inv.subtotal || inv.total)}</Text></View>
            {(inv.taxTotal || inv.tax) ? (
              <View style={s.totRow}><Text style={s.totKey}>Tax Amount</Text><Text style={s.totVal}>{currSymbol}{fmt(inv.taxTotal || inv.tax)}</Text></View>
            ) : null}
            <View style={s.grandBox}>
              <Text style={s.grandKey}>Total</Text>
              <Text style={s.grandVal}>{currSymbol}{fmt(inv.total)}</Text>
            </View>
            {isFullyPaid ? (
              <View style={s.paidBadge}>
                <View style={s.paidDot} />
                <Text style={s.paidText}>Amount Paid</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={s.infoStrip}>
          <Text style={s.infoText}>Total items / Qty : {inv.items?.length || 0} / {totalQty}</Text>
          <Text style={s.infoText}>Total amount (in words): {currency} {totalInWords} Only.</Text>
        </View>

        <View style={s.notesTermsRow}>
          <View style={s.notesCol}>
            {inv.notes ? (
              <View style={{ marginBottom: 6 }}>
                <Text style={s.sectionTitle}>Notes:</Text>
                <Text style={s.termItem}>{inv.notes}</Text>
              </View>
            ) : null}
            <Text style={s.sectionTitle}>Terms and Conditions:</Text>
            <Text style={s.termItem}>1. Goods once sold cannot be taken back or exchanged.</Text>
            <Text style={s.termItem}>2. We are not the manufacturers, company will stand for warranty as per their terms and conditions.</Text>
            <Text style={s.termItem}>3. Interest @24% p.a. will be charged for uncleared bills beyond 15 days.</Text>
            <Text style={s.termItem}>4. Subject to local Jurisdiction.</Text>
          </View>

          <View style={s.sigCol}>
            <Text style={s.sigFor}>For {bizName}</Text>
            {isRasterImage(biz?.businessSignature) ? (
              <Image src={biz.businessSignature} style={s.sigImg} />
            ) : (
              <View style={{ height: 25 }} />
            )}
            {isRasterImage(biz?.businessSeal) ? (
              <Image src={biz.businessSeal} style={s.sealImg} />
            ) : null}
            <Text style={s.sigName}>{biz?.signatoryName || 'Authorised Signatory'}</Text>
          </View>
        </View>

        <View style={s.pageFooter} fixed>
          <Text style={s.footerText}>Page 1/1</Text>
          <Text style={s.footerText}>Powered by GoodSynk<Text style={{ fontSize: 5.5, fontFamily: 'Helvetica' }}>™</Text></Text>
          <Text style={s.footerText}>This is a digitally signed document</Text>
        </View>
      </Page>
    </Document>
  );
}
