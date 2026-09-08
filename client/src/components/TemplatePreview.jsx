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
  quotation12: { top: '1.5%', left: '6%', width: '9%', maxHeight: '6%' },
  quotation13: { top: '1.5%', right: '6%', width: '9%', maxHeight: '6%' },
  quotation14: { top: '1.5%', left: '6%', width: '9%', maxHeight: '6%' },
  quotation15: { top: '1.5%', left: '6%', width: '9%', maxHeight: '6%' },
};

export default function TemplatePreview({ src, templateId, logo, alt, style, imageStyle }) {
  const position = LOGO_POSITIONS[(templateId || '').toLowerCase()] || LOGO_POSITIONS.template1;

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
            ...position,
            height: 'auto',
            maxWidth: '10%',
            objectFit: 'contain',
            display: 'block',
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
}
