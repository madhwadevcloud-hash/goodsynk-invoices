import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { getAddressStreet, getFullAddress } from './addressUtils';

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

function formatDateOnly(value) {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

function formatTimeOnly(value) {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
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
  const docNumber = isQuotation ? (inv.quotationNumber || inv.invoiceNumber || '') : (inv.invoiceNumber || '');
  const currency = inv._currency || inv.currency || 'INR';
  const fmt = (n) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);

  const bizName = biz?.businessName || biz?.name || '';
  const totalInWords = numberToWords(Math.floor(inv.total || 0));

  const rawDate = inv.issueDate || inv.invoiceDate || inv.date || '';
  const resolvedDate = formatDateOnly(rawDate);
  const resolvedTime = formatTimeOnly(rawDate);

  const notesText = inv.notes || '';
  const termsText = inv.termsAndConditions || '';

  // Collect unique SAC codes from all items (from item.hsn)
  const sacCodes = Array.from(
    new Set(
      (inv.items || [])
        .map((it) => (it?.hsn || '').toString().trim())
        .filter(Boolean)
    )
  ).join(', ');

  // Tax calculations
  const sgst = (inv.total * 0.09) || 0;
  const cgst = (inv.total * 0.09) || 0;
  const igst = (inv.total * 0.18) || 0;

  const s = StyleSheet.create({
    page: { paddingTop: 25, paddingBottom: 50, paddingHorizontal: 30, fontFamily: 'Inter', color: '#111827', fontSize: 8 },
    watermarkContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', zIndex: -100 },
    watermarkText: { fontSize: 60, fontFamily: B, color: hexToRgba('#111827', 0.06), transform: 'rotate(-45deg)', letterSpacing: 5 },
    watermarkImg: { width: 250, height: 250, objectFit: 'contain', opacity: 0.12 },

    outerBox: { borderWidth: 1, borderColor: '#111827' },
    topHeaderRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#111827', minHeight: 80 },
    headerCol1: { width: '45%', padding: 8, borderRightWidth: 1, borderRightColor: '#111827', justifyContent: 'center', alignItems: 'center' },
    headerCol2: { width: '30%', padding: 8, borderRightWidth: 1, borderRightColor: '#111827' },
    headerCol3: { width: '25%', padding: 8 },

    logoImg: { width: '100%', height: 55, objectFit: 'contain', marginBottom: 2 },
    brandName: { fontSize: 7, fontFamily: B, color: PRIMARY, textAlign: 'center' },

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

    // Table header — SAC column removed
    tHead: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#111827', backgroundColor: '#F9FAFB', paddingVertical: 5 },
    thSno: { width: '8%', paddingLeft: 6, fontSize: 9, fontFamily: B, color: '#111827', borderRightWidth: 1, borderRightColor: '#111827' },
    thDesc: { width: '72%', paddingLeft: 6, fontSize: 9, fontFamily: B, color: '#111827', borderRightWidth: 1, borderRightColor: '#111827' },
    thAmount: { width: '20%', paddingRight: 8, fontSize: 9, fontFamily: B, color: '#111827', textAlign: 'right' },

    // Item rows — SAC column removed, description gets full width
    tRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#E5E7EB', paddingVertical: 6, minHeight: 20 },
    tdSno: { width: '8%', paddingLeft: 6, fontSize: 9, color: '#111827', borderRightWidth: 1, borderRightColor: '#111827' },
    tdDesc: { width: '72%', paddingLeft: 6, paddingRight: 6, fontSize: 9, color: '#111827', borderRightWidth: 1, borderRightColor: '#111827' },
    tdAmount: { width: '20%', paddingRight: 8, fontSize: 9, color: '#111827', textAlign: 'right' },

    itemName: { fontFamily: B, fontSize: 9.5 },
    itemDesc: { fontSize: 8.5, marginTop: 2, color: '#374151' },

    // Tax / total rows
    taxRow: { flexDirection: 'row', borderTopWidth: 0.5, borderTopColor: '#E5E7EB', paddingVertical: 5, paddingHorizontal: 8 },
    taxLabel: { width: '80%', fontSize: 8.5, fontFamily: B, color: '#111827', borderRightWidth: 1, borderRightColor: '#111827', paddingLeft: 4 },
    taxVal: { width: '20%', fontSize: 8.5, color: '#111827', textAlign: 'right' },

    sumRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#111827', paddingVertical: 6, paddingHorizontal: 8, backgroundColor: '#F9FAFB' },
    sumText: { width: '80%', fontSize: 9, fontFamily: B, color: '#111827', borderRightWidth: 1, borderRightColor: '#111827', paddingLeft: 4 },
    sumVal: { width: '20%', fontSize: 9, fontFamily: B, color: '#111827', textAlign: 'right' },

    wordsRow: { flexDirection: 'row', borderTopWidth: 0.5, borderTopColor: '#111827', paddingVertical: 6, paddingHorizontal: 8, backgroundColor: '#F9FAFB' },
    wordsText: { width: '100%', fontSize: 8.5, fontFamily: B, color: '#111827' },

    reverseChargeBlock: { marginHorizontal: 12, flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    noteCol: { width: '100%' },
    noteTitle: { fontSize: 8, fontFamily: B, color: '#111827', marginBottom: 2 },
    noteText: { fontSize: 7.5, color: '#111827', lineHeight: 1.3 },

    termsBlock: { marginHorizontal: 12, marginTop: 10 },
    termsTitle: { fontSize: 8, fontFamily: B, color: '#111827', marginBottom: 2 },
    termsText: { fontSize: 7.5, color: '#111827', lineHeight: 1.3 },

    paymentPage: { marginHorizontal: 12, marginTop: 15, borderWidth: 1, borderColor: '#111827', flexDirection: 'row' },
    payCol1: { width: '60%', padding: 10, borderRightWidth: 1, borderRightColor: '#111827' },
    payCol2: { width: '40%', padding: 10 },
    payTitle: { fontSize: 13, fontFamily: B, color: '#111827', marginBottom: 8 },
    payRow: { fontSize: 8, color: '#111827', marginBottom: 4 },

    certText: { fontSize: 7.5, color: '#111827', marginBottom: 15 },
    sigBox: { borderWidth: 1, borderColor: '#111827', padding: 6 },
    sigLabel: { fontSize: 7.5, fontFamily: B, color: '#111827', marginBottom: 2 },

    pageFooter: { position: 'absolute', bottom: 15, left: 30, right: 30, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    footerPageNum: { fontSize: 8, color: '#111827' },
  });

  return (
    <Document>
      <Page size="A4" style={s.page} wrap>
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
              {isRasterImage(biz?.businessLogo) ? (
                <Image src={biz.businessLogo} style={s.logoImg} />
              ) : null}
              <Text style={s.brandName}>{bizName}</Text>
            </View>

            <View style={s.headerCol2}>
              <Text style={s.officeTitle}>Registered office</Text>
              <Text style={s.officeText}>{bizName}</Text>
              <Text style={s.officeText}>{getAddressStreet(biz?.address) || ''}</Text>
              <Text style={s.officeText}>{biz?.address?.city ? `${biz.address.city}- ${biz.address.pincode || ''}` : ''}</Text>
            </View>

            <View style={s.headerCol3}>
              <Text style={s.contactText}>Ph: {biz?.phone || ''}</Text>
              <Text style={s.contactText}>Email:</Text>
              <Text style={s.linkText}>{biz?.email || ''}</Text>
            </View>
          </View>

          <View style={s.banner} />

          {/* SAC code back at top, below CATEGORY */}
          <View style={s.catRow}>
            <View>
              <Text style={s.catText}>CATEGORY: {inv.category || ''}</Text>
              <Text style={s.catText}>SAC CODE: {sacCodes || ''}</Text>
            </View>
            <Text style={s.gstText}>GSTIN: {biz?.gstin || ''}</Text>
          </View>

          <Text style={s.docTitleText}>{docTitle}</Text>

          <View style={s.metaBox}>
            <View style={s.metaCol1}>
              <Text style={{ fontSize: 7.5, color: '#111827' }}>To,</Text>
              <Text style={{ fontSize: 8, fontFamily: B, color: '#111827' }}>{client?.name || client?.clientName || ''}</Text>
              {client?.gstin ? <Text style={{ fontSize: 7.5, color: '#111827' }}>(GST: {client.gstin})</Text> : null}
              <Text style={{ fontSize: 7.5, color: '#111827' }}>{getFullAddress(client?.address) || ''}</Text>
            </View>

            <View style={s.metaCol2}>
              <Text style={{ fontSize: 7.5, color: '#111827' }}>Kind Attention:</Text>
              <Text style={{ fontSize: 8, fontFamily: B, color: '#111827' }}>{client?.contactPerson || ''}</Text>
            </View>

            <View style={s.metaCol3}>
              <Text style={{ fontSize: 7.5, color: '#111827' }}>{isQuotation ? 'Quotation No:' : 'Invoice No:'} <Text style={{ fontFamily: B }}>{docNumber}</Text></Text>
              <Text style={{ fontSize: 7.5, color: '#111827', marginTop: 4 }}>Date: <Text style={{ fontFamily: B }}>{resolvedDate}</Text></Text>
              <Text style={{ fontSize: 7.5, color: '#111827', marginTop: 2 }}>Time: <Text style={{ fontFamily: B }}>{resolvedTime}</Text></Text>
            </View>
          </View>

          {inv.reference ? (
            <Text style={s.refText}><Text style={{ fontFamily: B }}>Ref:</Text> {inv.reference}</Text>
          ) : null}

          <View style={s.table}>
            <View style={s.tHead}>
              <Text style={s.thSno}>S.No</Text>
              <Text style={s.thDesc}>Description of Services</Text>
              <Text style={s.thAmount}>Amount (Rs.)</Text>
            </View>

            {inv.items?.map((item, idx) => {
              const itemAmount = item.price != null
                ? item.price
                : (item.amount != null
                  ? item.amount
                  : ((item.quantity || 1) * (item.rate || 0)));

              return (
                <View key={idx} style={s.tRow} wrap={false}>
                  <Text style={s.tdSno}>{idx + 1}</Text>
                  <View style={s.tdDesc}>
                    <Text style={s.itemName}>{item.name || ''}</Text>
                    {item.description ? (
                      <Text style={s.itemDesc}>{item.description}</Text>
                    ) : null}
                  </View>
                  <Text style={s.tdAmount}>{fmt(itemAmount)}</Text>
                </View>
              );
            })}

            <View style={s.taxRow} wrap={false}>
              <Text style={s.taxLabel}>SGST @ 9%</Text>
              <Text style={s.taxVal}>{fmt(sgst)}</Text>
            </View>
            <View style={s.taxRow} wrap={false}>
              <Text style={s.taxLabel}>CGST @ 9%</Text>
              <Text style={s.taxVal}>{fmt(cgst)}</Text>
            </View>
            <View style={s.taxRow} wrap={false}>
              <Text style={s.taxLabel}>IGST @ 18%</Text>
              <Text style={s.taxVal}>{fmt(igst)}</Text>
            </View>

            <View style={s.sumRow} wrap={false}>
              <Text style={s.sumText}>{isQuotation ? 'QUOTATION TOTAL:' : 'INVOICE TOTAL:'}</Text>
              <Text style={s.sumVal}>Rs. {fmt(inv.total)}/-</Text>
            </View>

            <View style={s.wordsRow} wrap={false}>
              <Text style={s.wordsText}>Total payable in Words: Rupees {totalInWords} Only</Text>
            </View>
          </View>

          {notesText ? (
            <View style={s.reverseChargeBlock} wrap={false}>
              <View style={s.noteCol}>
                <Text style={s.noteTitle}>Note:</Text>
                <Text style={s.noteText}>{notesText}</Text>
              </View>
            </View>
          ) : null}

          {termsText ? (
            <View style={s.termsBlock} wrap={false}>
              <Text style={s.termsTitle}>Terms & Conditions:</Text>
              <Text style={s.termsText}>{termsText}</Text>
            </View>
          ) : null}

          <View style={s.paymentPage} wrap={false}>
            <View style={s.payCol1}>
              <Text style={s.payTitle}>Payment Details:</Text>
              <Text style={s.payRow}>You may please make the payment either by online transfer to bank</Text>
              <Text style={s.payRow}><Text style={{ fontFamily: B }}>Beneficiary Name:</Text> {bizName}</Text>
              <Text style={s.payRow}><Text style={{ fontFamily: B }}>Bank:</Text> {biz?.bankDetails?.bankName || ''}</Text>
              <Text style={s.payRow}><Text style={{ fontFamily: B }}>Account Number:</Text> {biz?.bankDetails?.accountNumber || ''}</Text>
              <Text style={s.payRow}><Text style={{ fontFamily: B }}>IFSC Code:</Text> {biz?.bankDetails?.ifscCode || ''}</Text>
              <Text style={s.payRow}><Text style={{ fontFamily: B }}>Branch:</Text> {biz?.bankDetails?.branch || ''}</Text>
              <Text style={s.payRow}><Text style={{ fontFamily: B }}>PAN:</Text> {biz?.pan || ''}</Text>
              <Text style={s.payRow}><Text style={{ fontFamily: B }}>Payment Terms:</Text> 15 days from date of document</Text>
            </View>

            <View style={s.payCol2}>
              <Text style={s.certText}>Certified that the particulars given above are true and correct.</Text>
              <View style={s.sigBox}>
                <Text style={s.sigLabel}>Authorised Signatory</Text>
                {isRasterImage(biz?.businessSignature) ? (
                  <Image src={biz.businessSignature} style={{ width: 60, height: 22, objectFit: 'contain', marginTop: 2 }} />
                ) : null}
                <Text style={{ fontSize: 7.5, color: '#111827' }}>Name: {biz?.signatoryName || ''}</Text>
                <Text style={{ fontSize: 7, color: '#4B5563' }}>Designation: {biz?.designation || ''}</Text>
                {isRasterImage(biz?.businessSeal) ? (
                  <Image src={biz.businessSeal} style={{ width: 45, height: 45, marginTop: 4, objectFit: 'contain' }} />
                ) : null}
              </View>
            </View>
          </View>
        </View>

        <View style={s.pageFooter} fixed>
          <Text
            style={s.footerPageNum}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
            fixed
          />
          <Text style={{ fontSize: 7, color: '#4B5563' }}>Powered by GoodSynk<Text style={{ fontSize: 5.5, fontFamily: 'Helvetica' }}>™</Text></Text>
        </View>
      </Page>
    </Document>
  );
}



/*Legal Services Boxed*/
