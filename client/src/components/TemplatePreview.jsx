import React, { memo, useEffect, useMemo, useState } from 'react';

/**
 * Fast template preview component.
 *
 * IMPORTANT PERFORMANCE RULE:
 * - Template cards use `thumbnail`, which renders ONLY the existing SVG/PNG.
 * - The expensive @react-pdf/renderer path is used ONLY when `livePreview` is true.
 *
 * This prevents every template card from creating a PDF document during the
 * InvoiceForm render.
 */

const LOGO_POSITIONS = {
  template1: { top: '1.5%', left: '5%', width: '9%', maxHeight: '6%' },
  template2: { top: '1.5%', left: '40%', width: '9%', maxHeight: '6%' },
  template3: { top: '1.5%', right: '6%', width: '9%', maxHeight: '6%' },
  template4: { top: '1.5%', left: '6%', width: '9%', maxHeight: '6%' },
  template5: { top: '1.5%', right: '6%', width: '9%', maxHeight: '6%' },
  template6: { top: '1.5%', left: '5%', width: '9%', maxHeight: '6%' },
  template7: { top: '1.5%', right: '6%', width: '9%', maxHeight: '6%' },
  template10: { top: '1.5%', left: '5%', width: '9%', maxHeight: '6%' },
  invoice12: { top: '1.5%', right: '6%', width: '9%', maxHeight: '6%' },
  invoice14: { top: '1.5%', left: '6%', width: '9%', maxHeight: '6%' },
  template16: { top: '3.2%', left: '6.5%', width: '8%', maxHeight: '5%' },
  template17: { top: '3%', left: '6%', width: '8%', maxHeight: '5%' },
  template18: { top: '3%', left: '4.5%', width: '7.5%', maxHeight: '5%' },
  template19: { top: '5.5%', left: '8%', width: '5.5%', maxHeight: '4%' },
  template20: { top: '6.5%', left: '6.5%', width: '6%', maxHeight: '4.5%' },
  quotation12: { top: '1.5%', left: '6%', width: '9%', maxHeight: '6%' },
  quotation14: { top: '1.5%', left: '6%', width: '9%', maxHeight: '6%' },
};

const SEAL_POSITIONS = {
  template1: { top: '61.9%', left: '80%' },
  template2: { top: '62.6%', left: '80%' },
  template5: { top: '73.8%', left: '79.2%' },
  template6: { top: '66.2%', left: '79.3%' },
  template7: { top: '61.8%', left: '84%' },
  template10: { top: '85.5%', left: '77.3%' },
  invoice12: { top: '80.7%', left: '85%' },
  invoice14: { top: '80.7%', left: '85%' },
  template16: { top: '61.8%', left: '77.3%' },
  template17: { top: '60.8%', left: '77.3%' },
  template18: { top: '72%', left: '88%' },
  template19: { top: '88%', left: '81%' },
  template20: { top: '60.5%', left: '77%' },
  quotation12: { top: '86%', left: '89.2%' },
  quotation14: { top: '86%', left: '89.2%' },
};

const WATERMARK_SVG = encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 560">' +
    '<text x="200" y="300" text-anchor="middle" transform="rotate(-45 200 300)" ' +
    'font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="58" ' +
    'letter-spacing="4" fill="rgba(17,17,17,0.14)">GoodSynk</text></svg>'
);

const WATERMARK_STYLE = {
  position: 'absolute',
  inset: 0,
  backgroundImage: `url("data:image/svg+xml,${WATERMARK_SVG}")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'center',
  backgroundSize: '100% 100%',
  pointerEvents: 'none',
};

const getPositionKey = (templateId, isQuotation) => {
  let key = String(templateId || 'template1').toLowerCase();
  if (isQuotation && !key.startsWith('quotation')) {
    key = key.replace('template', 'quotation');
    if (!key.startsWith('quotation')) key = `quotation${key}`;
  }
  return key;
};

const getSignaturePosition = (sealPosition) => ({
  top: `${Math.max((parseFloat(sealPosition?.top) || 0) - 3, 2)}%`,
  left: sealPosition?.left || '80%',
});

const SAMPLE_INVOICE = {
  invoiceNumber: 'INV-1001',
  invoiceDate: new Date().toISOString().slice(0, 10),
  issueDate: new Date().toISOString().slice(0, 10),
  dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
  date: new Date().toISOString().slice(0, 10),
  template: 'template1',
  invoiceType: 'invoice',
  currency: 'INR',
  currencySymbol: '₹',
  client: {
    name: 'Sample Customer',
    email: 'customer@example.com',
    phone: '+91 98765 43210',
    address: 'Bengaluru, Karnataka, India',
    gstin: '29ABCDE1234F1Z5',
  },
  business: {
    name: 'Your Business',
    email: 'hello@example.com',
    phone: '+91 98765 43210',
    address: 'Bengaluru, Karnataka, India',
  },
  user: {
    businessName: 'Your Business',
    businessEmail: 'hello@example.com',
    businessPhone: '+91 98765 43210',
    businessAddress: 'Bengaluru, Karnataka, India',
    currency: 'INR',
  },
  items: [
    {
      name: 'Professional Service',
      description: 'Sample service item',
      quantity: 1,
      price: 5000,
      rate: 5000,
      amount: 5000,
      total: 5000,
      discount: 0,
      cgstRate: 9,
      sgstRate: 9,
      igstRate: 0,
      hsn: '9983',
      unit: 'pcs',
    },
  ],
  subtotal: 5000,
  tax: 900,
  total: 5900,
  grandTotal: 5900,
  notes: [],
  termsAndConditions: [],
  templateColors: { primary: '#4A72D4' },
};

function LivePreview({
  templateId,
  templateColors,
  user,
  isQuotation,
  style,
}) {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [renderColors, setRenderColors] = useState(templateColors || SAMPLE_INVOICE.templateColors);

  const invoice = useMemo(() => ({
    ...SAMPLE_INVOICE,
    template: String(templateId || 'template1').toLowerCase(),
    invoiceType: isQuotation ? 'quotation' : 'invoice',
    templateColors: renderColors,
    user: {
      ...SAMPLE_INVOICE.user,
      ...(user || {}),
    },
  }), [templateId, renderColors, user, isQuotation]);

  // Debounce color changes so dragging the native color picker does not start a
  // new PDF render for every single mouse movement.
  useEffect(() => {
    const timer = setTimeout(() => {
      setRenderColors(templateColors || SAMPLE_INVOICE.templateColors);
    }, 220);
    return () => clearTimeout(timer);
  }, [templateColors]);

  useEffect(() => {
    let cancelled = false;
    let objectUrl = null;

    async function createPreview() {
      setLoading(true);
      setError('');
      setPdfUrl(null);

      try {
        // These imports are intentionally inside the effect. The PDF library and
        // resolver are not loaded/rendered while the InvoiceForm is idle.
        const [{ pdf }, { default: TemplateResolver }] = await Promise.all([
          import('@react-pdf/renderer'),
          import('../pages/invoices/templates/TemplateResolver'),
        ]);

        if (cancelled) return;

        const blob = await pdf(<TemplateResolver invoice={invoice} />).toBlob();
        if (cancelled) return;

        objectUrl = URL.createObjectURL(blob);
        setPdfUrl(objectUrl);
        setLoading(false);
      } catch (err) {
        console.error('Template live preview failed:', err);
        if (!cancelled) {
          setError('Live preview could not be generated.');
          setLoading(false);
        }
      }
    }

    createPreview();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [invoice]);

  if (loading) {
    return (
      <div style={{ ...style, minHeight: 500, display: 'grid', placeItems: 'center', background: '#fff', borderRadius: 8 }}>
        <div style={{ textAlign: 'center', color: '#64748b', fontSize: 14 }}>
          <div
            style={{
              width: 30,
              height: 30,
              margin: '0 auto 10px',
              border: '3px solid #e2e8f0',
              borderTopColor: '#4A72D4',
              borderRadius: '50%',
              animation: 'goodsynk-template-spin 0.8s linear infinite',
            }}
          />
          Preparing preview…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ ...style, minHeight: 300, display: 'grid', placeItems: 'center', background: '#fff', borderRadius: 8, color: '#64748b' }}>
        {error}
      </div>
    );
  }

  return (
    <iframe
      title="Template preview"
      src={pdfUrl || undefined}
      style={{
        ...style,
        border: 0,
        background: '#fff',
        display: 'block',
        minHeight: 650,
      }}
    />
  );
}

function TemplatePreview({
  src,
  templateId,
  logo,
  seal,
  signature,
  watermarkImage,
  alt,
  style,
  imageStyle,
  isFreePlan = true,
  isQuotation = false,
  thumbnail = false,
  livePreview = false,
  templateColors,
  user,
}) {
  // FASTEST PATH: cards use only the existing template artwork.
  // No PDF rendering, no watermark calculation, no extra image overlays.
  if (thumbnail || !livePreview) {
    return (
      <div style={{ position: 'relative', width: '100%', ...style }}>
        <img
          src={src}
          alt={alt || 'Template preview'}
          loading="lazy"
          decoding="async"
          fetchPriority="low"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            display: 'block',
            background: '#fff',
            ...imageStyle,
          }}
        />
      </div>
    );
  }

  return (
    <LivePreview
      templateId={templateId}
      templateColors={templateColors}
      user={user}
      isQuotation={isQuotation}
      style={style}
    />
  );
}

export default memo(TemplatePreview);
