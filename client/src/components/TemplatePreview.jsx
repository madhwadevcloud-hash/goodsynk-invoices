import React from 'react';

// The preview artwork is static, so the user's profile photo is layered at
// runtime. Each template has its own logo slot so the photo never obscures
// the template's header content.
const LOGO_POSITIONS = {
  template1: { top: '1.5%', left: '5%', width: '9%', maxHeight: '6%' },
  template2: { top: '1.5%', left: '40%', width: '9%', maxHeight: '6%' },
  template3: { top: '1.5%', right: '6%', width: '9%', maxHeight: '6%' },
  template4: { top: '1.5%', left: '6%', width: '9%', maxHeight: '6%' },
  template5: { top: '1.5%', right: '6%', width: '9%', maxHeight: '6%' },
  template6: { top: '1.5%', left: '5%', width: '9%', maxHeight: '6%' },
  template7: { top: '1.5%', right: '6%', width: '9%', maxHeight: '6%' },
  template8: { top: '1.5%', right: '6%', width: '9%', maxHeight: '6%' },
  template9: { top: '1.5%', right: '6%', width: '9%', maxHeight: '6%' },
  template10: { top: '1.5%', left: '5%', width: '9%', maxHeight: '6%' },
  template11: { top: '1.5%', right: '6%', width: '9%', maxHeight: '6%' },
  invoice12: { top: '1.5%', right: '6%', width: '9%', maxHeight: '6%' },
  invoice13: { top: '1.5%', right: '6%', width: '9%', maxHeight: '6%' },
  invoice14: { top: '1.5%', left: '6%', width: '9%', maxHeight: '6%' },
  invoice15: { top: '1.5%', right: '6%', width: '9%', maxHeight: '6%' },
  quotation1: { top: '1.5%', left: '5%', width: '9%', maxHeight: '6%' },
  quotation2: { top: '1.5%', left: '40%', width: '9%', maxHeight: '6%' },
  quotation3: { top: '1.5%', right: '6%', width: '9%', maxHeight: '6%' },
  quotation4: { top: '1.5%', left: '6%', width: '9%', maxHeight: '6%' },
  quotation5: { top: '1.5%', right: '6%', width: '9%', maxHeight: '6%' },
  quotation6: { top: '1.5%', left: '5%', width: '9%', maxHeight: '6%' },
  quotation7: { top: '1.5%', right: '6%', width: '9%', maxHeight: '6%' },
  quotation8: { top: '1.5%', right: '6%', width: '9%', maxHeight: '6%' },
  quotation9: { top: '1.5%', right: '6%', width: '9%', maxHeight: '6%' },
  quotation10: { top: '1.5%', left: '5%', width: '9%', maxHeight: '6%' },
  quotation11: { top: '1.5%', right: '6%', width: '9%', maxHeight: '6%' },
  template16: { top: '3.2%', left: '6.5%', width: '8%', maxHeight: '5%' },
  quotation16: { top: '3.2%', left: '6.5%', width: '8%', maxHeight: '5%' },
  template17: { top: '3%', left: '6%', width: '8%', maxHeight: '5%' },
  quotation17: { top: '3%', left: '6%', width: '8%', maxHeight: '5%' },
  quotation12: { top: '1.5%', left: '6%', width: '9%', maxHeight: '6%' },
  quotation13: { top: '1.5%', right: '6%', width: '9%', maxHeight: '6%' },
  quotation14: { top: '1.5%', left: '6%', width: '9%', maxHeight: '6%' },
  quotation15: { top: '1.5%', left: '6%', width: '9%', maxHeight: '6%' },
};

const SEAL_POSITIONS = {
  template1: { top: '61.9%', left: '80%' },
  template2: { top: '62.6%', left: '80%' },
  template3: { top: '72.6%', left: '19.2%' },
  template4: { top: '72.9%', left: '76.8%' },
  template5: { top: '73.8%', left: '79.2%' },
  template6: { top: '66.2%', left: '78.7%' },
  template7: { top: '62%', left: '85%' },
  template8: { top: '89.1%', left: '80%' },
  template9: { top: '85.7%', left: '79.5%' },
  template10: { top: '85.7%', left: '78.7%' },
  template11: { top: '97.6%', left: '79.8%' },
  invoice12: { top: '90.7%', left: '85%' },
  invoice13: { top: '90.7%', left: '85%' },
  invoice14: { top: '90.7%', left: '85%' },
  invoice15: { top: '90.7%', left: '85%' },
  quotation1: { top: '92.3%', left: '50.8%' },
  quotation2: { top: '92.3%', left: '81.7%' },
  quotation3: { top: '92.6%', left: '83.3%' },
  quotation4: { top: '90.5%', left: '81.7%' },
  quotation5: { top: '90.5%', left: '88.3%' },
  quotation6: { top: '92.3%', left: '76.7%' },
  quotation7: { top: '95.2%', left: '70%' },
  quotation8: { top: '92.6%', left: '89.2%' },
  quotation9: { top: '92.9%', left: '95%' },
  quotation10: { top: '92.9%', left: '75%' },
  quotation11: { top: '93.1%', left: '95%' },
  template16: { top: '85%', left: '84%' },
  quotation16: { top: '85%', left: '84%' },
  template17: { top: '87%', left: '87%' },
  quotation17: { top: '87%', left: '87%' },
  quotation12: { top: '86%', left: '89.2%' },
  quotation13: { top: '84.8%', left: '89.2%' },
  quotation14: { top: '86%', left: '89.2%' },
  quotation15: { top: '86%', left: '89.2%' },
};

// Signature sits directly above the seal/stamp on every template, so its
// position is derived from SEAL_POSITIONS at render time (see
// getSignaturePosition below) rather than duplicated per template here.

// Same "GoodSynk" diagonal watermark used across the generated PDF/preview
// templates (see the `watermarkContainer`/`watermarkText` styles in
// Template1-11.jsx and DocumentTemplate.jsx), rendered
// here as a background image so it scales cleanly with any thumbnail size
// (small grid cards, the large modal preview, etc.) without distortion.
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

// The signature image sits just above the seal on every generated PDF, so
// its preview position is derived from the seal's position rather than
// tracked separately for each template.
const getSignaturePosition = (sealPosition) => {
  const topPct = parseFloat(sealPosition.top) || 0;
  return { top: `${Math.max(topPct - 7, 2)}%`, left: sealPosition.left };
};

export default function TemplatePreview({ src, templateId, logo, seal, signature, alt, style, imageStyle, isFreePlan = true, isQuotation = false }) {
  const isQuote = isQuotation || (typeof src === 'string' && src.toLowerCase().includes('quotation'));
  let rawKey = (templateId || '').toLowerCase();
  if (isQuote && !rawKey.startsWith('quotation')) {
    rawKey = rawKey.replace('template', 'quotation');
    if (!rawKey.startsWith('quotation')) {
      rawKey = 'quotation' + rawKey;
    }
  }
  const logoPosition = LOGO_POSITIONS[rawKey] || LOGO_POSITIONS[(templateId || '').toLowerCase()] || LOGO_POSITIONS.template1;
  const sealPosition = SEAL_POSITIONS[rawKey] || SEAL_POSITIONS[(templateId || '').toLowerCase()] || SEAL_POSITIONS.template1;
  const signaturePosition = getSignaturePosition(sealPosition);

  return (
    <div style={{ position: 'relative', width: '100%', ...style }}>
      <img
        src={src}
        alt={alt || 'Template preview'}
        style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', background: '#fff', ...imageStyle }}
      />
      {logo && (
        <img
          src={logo}
          alt="Profile logo"
          style={{
            position: 'absolute',
            ...logoPosition,
            height: 'auto',
            maxWidth: '10%',
            objectFit: 'contain',
            display: 'block',
            pointerEvents: 'none',
          }}
        />
      )}
      {signature && (
        <img
          src={signature}
          alt="Authorised signature"
          style={{
            position: 'absolute',
            top: signaturePosition.top,
            left: signaturePosition.left,
            transform: 'translate(-50%, -100%)',
            width: '14%',
            height: 'auto',
            maxHeight: '5%',
            objectFit: 'contain',
            display: 'block',
            pointerEvents: 'none',
          }}
        />
      )}
      {seal ? (
        <div
          style={{
            position: 'absolute',
            top: sealPosition.top,
            left: sealPosition.left,
            transform: 'translate(-50%, -50%)',
            width: '8%',
            height: '8%',
            borderRadius: '50%',
            background: '#ffffff',
            boxShadow: '0 0 0 2px #ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            pointerEvents: 'none',
          }}
        >
          <img
            src={seal}
            alt="Profile seal"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: 'block',
            }}
          />
        </div>
      ) : (
        <div
          style={{
            position: 'absolute',
            top: sealPosition.top,
            left: sealPosition.left,
            transform: 'translate(-50%, -50%)',
            width: '6.5%',
            aspectRatio: '1',
            borderRadius: '50%',
            border: '1px dashed #66717d',
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            fontSize: '0.4rem',
            fontWeight: 700,
            color: '#66717d',
            letterSpacing: '0.5px',
          }}
        >
          SEAL
        </div>
      )}
      {isFreePlan && <div aria-hidden="true" style={WATERMARK_STYLE} />}
    </div>
  );
}
