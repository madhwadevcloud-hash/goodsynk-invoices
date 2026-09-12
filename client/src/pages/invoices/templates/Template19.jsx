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

export default function Template19({ invoice }) {
  const inv = invoice || {};
  const client = inv.client || {};
  const biz = inv.user || inv.biz || {};
  const colors = inv.templateColors || { primary: '#991B1B', secondary: '#DDD6FE' };
  const PRIMARY = colors.primary || '#991B1B';
  const BANNER = colors.secondary || '#DDD6FE';

  const isQuotation = inv.invoiceType === 'quotation' || inv.documentType === 'quotation';
  const docTitle = isQuotation ? 'QUOTATION' : 'TAX INVOICE';
  const docNumber = isQuotation ? (inv.quotationNumber || inv.invoiceNumber || 'SK/PatF/2026-00X') : (inv.invoiceNumber || 'SK/PatF/2026-00X');
  const currency = inv._currency || inv.currency || 'INR';
  const fmt = (n) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);

  const bizName = biz?.businessName || biz?.name || 'Company Legal Solutions LLP';
  const totalInWords = numberToWords(Math.floor(inv.total || 0));

  const s = StyleSheet.create({
    page: { paddingTop: 25, paddingBottom: 50, paddingHorizontal: 30, fontFamily: 'Inter', color: '#111827', fontSize: 8 },
    watermarkContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', zIndex: -100 },
    watermarkText: { fontSize: 60, fontFamily: B, color: hexToRgba('#111827', 0.06), transform: 'rotate(-45deg)', letterSpacing: 5 },
    watermarkImg: { width: 250, height: 250, objectFit: 'contain', opacity: 0.12 },

    outerBox: { borderWidth: 1, borderColor: '#111827' },
    topHeaderRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#111827', minHeight: 80 },
    headerCol1: { width: '45%', padding: 8, borderRightWidth: 1, borderRightColor: '#111827' },
    headerCol2: { width: '30%', padding: 8, borderRightWidth: 1, borderRightColor: '#111827' },
    headerCol3: { width: '25%', padding: 8 },

    logoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    logoImg: { width: 36, height: 36, objectFit: 'contain', marginRight: 6 },
    brandName: { fontSize: 10, fontFamily: B, color: PRIMARY },

    officeTitle: { fontSize: 8, color: '#1E3A8A', marginBottom: 2 },
    officeText: { fontSize: 7.5, color: '#111827', lineHeight: 1.25 },

    contactText: { fontSize: 7.5, color: '#111827', marginBottom: 2 },
    linkText: { fontSize: 7.5, color: '#2563EB', textDecoration: 'underline' },

    banner: { backgroundColor: BANNER, paddingVertical: 3, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#111827' },

    catRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 6 },
    catText: { fontSize: 8, color: '#111827' },
    gstText: { fontSize: 8, fontFamily: B, color: '#111827' },

    docTitleText: { fontSize: 13, fontFamily: B, color: '#111827', textAlign: 'center', marginVertical: 8, textTransform: 'uppercase' },

    metaBox: { marginHorizontal: 12, borderWidth: 1, borderColor: '#111827', flexDirection: 'row', minHeight: 60, marginBottom: 8 },
    metaCol1: { width: '45%', padding: 6, borderRightWidth: 1, borderRightColor: '#111827' },
    metaCol2: { width: '25%', padding: 6, borderRightWidth: 1, borderRightColor: '#111827' },
    metaCol3: { width: '30%', padding: 6 },

    refText: { marginHorizontal: 12, fontSize: 8.5, color: '#111827', marginBottom: 10 },

    table: { marginHorizontal: 12, borderWidth: 1, borderColor: '#111827', marginBottom: 10 },
    tHead: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#111827', backgroundColor: '#F9FAFB', paddingVertical: 5 },
    thDesc: { width: '75%', paddingLeft: 8, fontSize: 8.5, fontFamily: B, color: '#111827' },
    thAmount: { width: '25%', paddingRight: 8, fontSize: 8.5, fontFamily: B, color: '#111827', textAlign: 'right' },

    tRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#E5E7EB', paddingVertical: 6, minHeight: 20 },
    tdDesc: { width: '75%', paddingLeft: 8, fontSize: 8, color: '#111827' },
    tdAmount: { width: '25%', paddingRight: 8, fontSize: 8, color: '#111827', textAlign: 'right' },

    sumRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#111827', paddingVertical: 6, paddingHorizontal: 8, backgroundColor: '#F9FAFB' },
    sumText: { width: '75%', fontSize: 8, fontFamily: B, color: '#111827' },
    sumVal: { width: '25%', fontSize: 8, fontFamily: B, color: '#111827', textAlign: 'right' },

    reverseChargeBlock: { marginHorizontal: 12, flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    noteCol: { width: '58%' },
    noteTitle: { fontSize: 8, fontFamily: B, color: '#111827', marginBottom: 2 },
    noteText: { fontSize: 7.5, color: '#111827', lineHeight: 1.3 },

    taxBox: { width: '38%', borderWidth: 1, borderColor: '#111827' },
    taxRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 4, borderBottomWidth: 1, borderBottomColor: '#111827' },
    taxRowLast: { flexDirection: 'row', justifyContent: 'space-between', padding: 4 },
    taxKey: { fontSize: 7.5, fontFamily: B, color: '#111827' },
    taxVal: { fontSize: 7.5, color: '#111827' },

    paymentPage: { marginHorizontal: 12, marginTop: 15, borderWidth: 1, borderColor: '#111827', flexDirection: 'row' },
    payCol1: { width: '60%', padding: 10, borderRightWidth: 1, borderRightColor: '#111827' },
    payCol2: { width: '40%', padding: 10 },
    payTitle: { fontSize: 8.5, fontFamily: B, color: '#111827', marginBottom: 6 },
    payRow: { fontSize: 7.5, color: '#111827', marginBottom: 3 },

    certText: { fontSize: 7.5, color: '#111827', marginBottom: 15 },
    sigBox: { borderWidth: 1, borderColor: '#111827', padding: 6 },
    sigLabel: { fontSize: 7.5, fontFamily: B, color: '#111827', marginBottom: 2 },

    pageFooter: { position: 'absolute', bottom: 15, left: 30, right: 30, textAlign: 'center' },
    footerPageNum: { fontSize: 8, color: '#111827' },
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
          <View style={s.topHeaderRow}>
            <View style={s.headerCol1}>
              <View style={s.logoRow}>
                {isRasterImage(biz?.logo) ? <Image src={biz.logo} style={s.logoImg} /> : null}
                <Text style={s.brandName}>{bizName}</Text>
              </View>
            </View>

            <View style={s.headerCol2}>
              <Text style={s.officeTitle}>Registered office</Text>
              <Text style={s.officeText}>{bizName}</Text>
              <Text style={s.officeText}>{biz?.address || 'AA302, Alpine Block, Golden Grand'}</Text>
              <Text style={s.officeText}>{biz?.city ? `${biz.city}- ${biz.pincode || ''}` : 'Yeshwantpur, Bengaluru- 560022'}</Text>
            </View>

            <View style={s.headerCol3}>
              <Text style={s.contactText}>Ph: {biz?.phone || '+91-94480 83714'}</Text>
              <Text style={s.contactText}>Email:</Text>
              <Text style={s.linkText}>{biz?.email || 'sk@sklegal-solutions.com'}</Text>
            </View>
          </View>

          <View style={s.banner} />

          <View style={s.catRow}>
            <View>
              <Text style={s.catText}>CATEGORY: {inv.category || 'Legal Services'}</Text>
              <Text style={s.catText}>SAC CODE: {inv.sacCode || '998213/214'}</Text>
            </View>
            <Text style={s.gstText}>GSTIN: {biz?.gstin || '29AFLFS718P1ZT'}</Text>
          </View>

          <Text style={s.docTitleText}>{docTitle}</Text>

          <View style={s.metaBox}>
            <View style={s.metaCol1}>
              <Text style={{ fontSize: 7.5, color: '#111827' }}>To,</Text>
              <Text style={{ fontSize: 8, fontFamily: B, color: '#111827' }}>{client?.name || client?.clientName || 'Name of the client company'}</Text>
              {client?.gstin ? <Text style={{ fontSize: 7.5, color: '#111827' }}>(GST: {client.gstin})</Text> : null}
              <Text style={{ fontSize: 7.5, color: '#111827' }}>{client?.address || 'Address'}</Text>
            </View>

            <View style={s.metaCol2}>
              <Text style={{ fontSize: 7.5, color: '#111827' }}>Kind Attention:</Text>
              <Text style={{ fontSize: 8, fontFamily: B, color: '#111827' }}>{client?.contactPerson || 'Mr. XYZ'}</Text>
            </View>

            <View style={s.metaCol3}>
              <Text style={{ fontSize: 7.5, color: '#111827' }}>{isQuotation ? 'Quotation No:' : 'Invoice No:'} <Text style={{ fontFamily: B }}>{docNumber}</Text></Text>
              <Text style={{ fontSize: 7.5, color: '#111827', marginTop: 4 }}>Date: <Text style={{ fontFamily: B }}>{inv.invoiceDate || inv.date || '28th Aug 2026'}</Text></Text>
            </View>
          </View>

          <Text style={s.refText}><Text style={{ fontFamily: B }}>Ref:</Text> {inv.reference || 'Fees towards preparing and filing of a patent application.'}</Text>

          <View style={s.table}>
            <View style={s.tHead}>
              <Text style={s.thDesc}>Description of Services</Text>
              <Text style={s.thAmount}>Amount in Rupees</Text>
            </View>

            {inv.items?.map((item, idx) => (
              <View key={idx} style={s.tRow}>
                <Text style={s.tdDesc}>{String.fromCharCode(97 + (idx % 26))}. {item.description || item.name}</Text>
                <Text style={s.tdAmount}>{fmt(item.amount || ((item.quantity || 1) * (item.rate || 0)))}</Text>
              </View>
            ))}

            <View style={s.sumRow}>
              <Text style={s.sumText}>{isQuotation ? 'QUOTATION TOTAL:' : 'INVOICE TOTAL (excluding GST as COMPANY may pay GST on Reverse charge):'}</Text>
              <Text style={s.sumVal}>Rs. {fmt(inv.total)}/-</Text>
            </View>

            <View style={[s.sumRow, { borderTopWidth: 0.5 }]}>
              <Text style={[s.sumText, { width: '100%' }]}>Total payable in Words: Rupees {totalInWords} Only</Text>
            </View>
          </View>

          <View style={s.reverseChargeBlock}>
            <View style={s.noteCol}>
              <Text style={s.noteTitle}>Note:</Text>
              <Text style={s.noteText}>
                Services Provided by the firm of advocates by way of legal services, directly or indirectly is to be paid by the recipient of the service 100%, on REVERSE CHARGE basis in India as per GST Law.
              </Text>
            </View>

            <View style={s.taxBox}>
              <View style={s.taxRow}><Text style={s.taxKey}>SGST@9%</Text><Text style={s.taxVal}>{fmt((inv.total * 0.09) || 0)}</Text></View>
              <View style={s.taxRow}><Text style={s.taxKey}>CGST@9%</Text><Text style={s.taxVal}>{fmt((inv.total * 0.09) || 0)}</Text></View>
              <View style={s.taxRowLast}><Text style={s.taxKey}>IGST@18%</Text><Text style={s.taxVal}>{fmt((inv.total * 0.18) || 0)}</Text></View>
            </View>
          </View>

          <View style={s.paymentPage}>
            <View style={s.payCol1}>
              <Text style={s.payTitle}>Payment Details:</Text>
              <Text style={s.payRow}>You may please make the payment either by online transfer to bank</Text>
              <Text style={s.payRow}><Text style={{ fontFamily: B }}>Beneficiary Name:</Text> {bizName}</Text>
              <Text style={s.payRow}><Text style={{ fontFamily: B }}>Bank:</Text> {biz?.bankName || 'HDFC Bank Ltd'}</Text>
              <Text style={s.payRow}><Text style={{ fontFamily: B }}>Account Number:</Text> {biz?.accountNumber || '50200119422741'}</Text>
              <Text style={s.payRow}><Text style={{ fontFamily: B }}>IFSC Code:</Text> {biz?.ifscCode || 'HDFC0010299'}</Text>
              <Text style={s.payRow}><Text style={{ fontFamily: B }}>PAN:</Text> {biz?.pan || 'AFLFS8718P'}</Text>
              <Text style={s.payRow}><Text style={{ fontFamily: B }}>Payment Terms:</Text> 15 days from date of document</Text>
            </View>

            <View style={s.payCol2}>
              <Text style={s.certText}>Certified that the particulars given above are true and correct.</Text>
              <View style={s.sigBox}>
                <Text style={s.sigLabel}>Authorised Signatory</Text>
                <Text style={{ fontSize: 7.5, color: '#111827' }}>Name: {biz?.signatoryName || 'Ananth Sripadarao'}</Text>
                <Text style={{ fontSize: 7, color: '#4B5563' }}>Designation: {biz?.designation || 'Head – Brand Protection & Litigation'}</Text>
                {isRasterImage(biz?.seal) ? (
                  <Image src={biz.seal} style={{ width: 45, height: 45, marginTop: 4, objectFit: 'contain' }} />
                ) : (
                  <Text style={{ fontSize: 6.5, color: '#6B7280', marginTop: 10 }}>[ Seal Placeholder ]</Text>
                )}
              </View>
            </View>
          </View>
        </View>

        <View style={s.pageFooter} fixed>
          <Text style={s.footerPageNum}>Page 1 of 1</Text>
        </View>
      </Page>
    </Document>
  );
}
