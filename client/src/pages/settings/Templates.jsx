import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../api/services';
import toast from 'react-hot-toast';
import { Palette, CheckCircle2, X, Lock, Eye } from 'lucide-react';
import TemplatePreview from '../../components/TemplatePreview';

const TEMPLATES = [
  { id: 'template1', name: 'Classic Blue', desc: 'A clean, universally trusted design with blue accents.', img: '/templates/t1.svg' },
  { id: 'template2', name: 'Minimalist Monochrome', desc: 'Elegant black and white. Perfect for ultra-clean printing.', img: '/templates/t2.svg' },
  { id: 'template5', name: 'Corporate Bright', desc: 'High contrast blue table headers and minimalist layout.', img: '/templates/t5.svg' },
  { id: 'template6', name: 'Angular Orange', desc: 'Striking orange and navy blue angular design.', img: '/templates/t6.svg' },
  { id: 'template7', name: 'Standard Layout', desc: 'Traditional invoice layout with side-by-side details.', img: '/templates/t7.png' },
  { id: 'template10', name: 'Soft Corporate Cards', desc: 'A headerless layout with rounded business and client cards.', img: '/templates/t10.svg' },
  { id: 'template16', name: 'Formal Tax Invoice', desc: 'A fully-boxed GST tax invoice with bill-to/ship-to, place of supply and an amount-paid badge.', img: '/templates/t16.svg' },
  { id: 'template17', name: 'Modern Retail', desc: 'A clean, borderless retail-style invoice with a bold total chip and status badge.', img: '/templates/t17.svg' },
  { id: 'template18', name: 'E-Commerce Tax Invoice', desc: 'Flipkart style tax invoice with dual address grid, HSN table, UPI QR code and terms.', img: '/templates/t18.svg' },
  { id: 'template19', name: 'Legal Services Boxed', desc: 'Satatham Kritam style legal tax invoice with boxed headers, reverse charge notes and tax table.', img: '/templates/t19.svg' },
  { id: 'template20', name: 'Corporate Matrix', desc: 'Structured compliance grid template with dual-ruled borders, payment QR and signature approval.', img: '/templates/t20.svg' },
  { id: 'invoice12', name: 'Ledger Gold', desc: 'A structured finance layout with a strong ledger header and gold totals.', img: '/templates/invoice12.svg' },
  { id: 'invoice14', name: 'Green Columns', desc: 'A calm two-column invoice for service businesses and consultants.', img: '/templates/invoice14.svg' },
];

const DEFAULT_COLORS = {
  template1: { primary: '#4A72D4' },
  template2: { primary: '#000000' },
  template5: { primary: '#0A66C2' },
  template6: { primary: '#E8662B', secondary: '#1C2541' },
  template7: { primary: '#B565D8' },
  template10: { primary: '#334155', secondary: '#CBD5E1' },
  template16: { primary: '#1F4B3F', secondary: '#D9A441' },
  template17: { primary: '#111820', secondary: '#3B82F6' },
  template18: { primary: '#FFE500', secondary: '#2874F0' },
  template19: { primary: '#991B1B', secondary: '#DDD6FE' },
  template20: { primary: '#0F172A', secondary: '#38BDF8' },
  invoice12: { primary: '#123B5D', secondary: '#D9A441' },
  invoice14: { primary: '#174A3A', secondary: '#B7D7C5' },
};
const FREE_TEMPLATES = ['template1', 'template2', 'template5'];

const isFlatColorObject = (value) => Boolean(
  value && typeof value === 'object' && (value.primary || value.secondary)
);

const getTemplateColors = (templateId, colorStore, currentDefaultTemplate) => {
  const key = (templateId || 'template1').toLowerCase();
  if (colorStore?.[key] && typeof colorStore[key] === 'object') {
    return colorStore[key];
  }

  // Backward compatibility for users whose database still has the old
  // { primary, secondary } format.
  if (isFlatColorObject(colorStore)) {
    const oldKey = (currentDefaultTemplate || '').toLowerCase();
    if (!oldKey || oldKey === key) return colorStore;
  }

  return DEFAULT_COLORS[key] || DEFAULT_COLORS.template1;
};

const buildTemplateColorStore = (templateId, colors, existingStore, currentDefaultTemplate) => {
  const next = {};

  if (existingStore && typeof existingStore === 'object') {
    if (isFlatColorObject(existingStore)) {
      const oldKey = (currentDefaultTemplate || templateId || 'template1').toLowerCase();
      next[oldKey] = { ...existingStore };
    } else {
      Object.entries(existingStore).forEach(([key, value]) => {
        if (value && typeof value === 'object') next[key.toLowerCase()] = { ...value };
      });
    }
  }

  const key = (templateId || 'template1').toLowerCase();
  next[key] = { ...(colors || DEFAULT_COLORS[key] || DEFAULT_COLORS.template1) };
  return next;
};

const QUOTATION_PREVIEWS = {
  template1: '/templates/quotation1.svg',
  template2: '/templates/quotation2.svg',
  template5: '/templates/quotation5.svg',
  template6: '/templates/quotation6.svg',
  template7: '/templates/quotation7.svg',
  template10: '/templates/quotation10.svg',
  template16: '/templates/quotation16.svg',
  template17: '/templates/quotation17.svg',
  template18: '/templates/quotation18.svg',
  template19: '/templates/quotation19.svg',
  template20: '/templates/quotation20.svg',
  invoice12: '/templates/quotation12.svg',
  invoice14: '/templates/quotation14.svg',
};

export default function Templates() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [documentType, setDocumentType] = useState('invoice');
  const [activeTemplate, setActiveTemplate] = useState(user?.invoiceTemplate || 'template1');
  const [templateColors, setTemplateColors] = useState(
    getTemplateColors(user?.invoiceTemplate || 'template1', user?.invoiceTemplateColors, user?.invoiceTemplate)
  );
  const [saving, setSaving] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [confirmTemplate, setConfirmTemplate] = useState(null);
  const isFreePlan = !user?.plan || String(user.plan).toLowerCase() === 'free';

  const currentTemplateKey = (documentType === 'quotation' ? user?.quotationTemplate : user?.invoiceTemplate) || 'template1';
  const currentColorStore = documentType === 'quotation' ? user?.quotationTemplateColors : user?.invoiceTemplateColors;
  const colorField = documentType === 'quotation' ? 'quotationTemplateColors' : 'invoiceTemplateColors';
  const templateField = documentType === 'quotation' ? 'quotationTemplate' : 'invoiceTemplate';

  const changeDocumentType = (type) => {
    const nextTemplate = (type === 'quotation' ? user?.quotationTemplate : user?.invoiceTemplate) || 'template1';
    const nextStore = type === 'quotation' ? user?.quotationTemplateColors : user?.invoiceTemplateColors;
    setDocumentType(type);
    setActiveTemplate(nextTemplate);
    setTemplateColors(getTemplateColors(nextTemplate, nextStore, nextTemplate));
    setPreviewTemplate(null);
  };

  const handleOpenPreview = (tmpl, colorsOnly = false) => {
    if (!FREE_TEMPLATES.includes(tmpl.id) && isFreePlan) {
      toast('Upgrade your plan to unlock this template', { icon: '🔒' });
      navigate('/upgrade');
      return;
    }

    const key = (tmpl.id || currentTemplateKey || 'template1').toLowerCase();
    setPreviewTemplate({ ...tmpl, colorsOnly });
    setTemplateColors(getTemplateColors(key, currentColorStore, currentTemplateKey));
  };

  // Opens the confirmation dialog inside the website.
  // This intentionally does NOT use window.confirm/browser UI.
  const selectTemplate = async (templateId, colorsOverride = templateColors) => {
    if (!FREE_TEMPLATES.includes(templateId) && isFreePlan) {
      toast('Upgrade your plan to unlock this template', { icon: '🔒' });
      navigate('/upgrade');
      return;
    }

    const key = (templateId || 'template1').toLowerCase();
    const templateName =
      TEMPLATES.find((item) => item.id === templateId)?.name || 'this template';

    setConfirmTemplate({
      templateId,
      templateName,
      colors: { ...(colorsOverride || getTemplateColors(key, currentColorStore, currentTemplateKey)) },
    });
  };

  const confirmSetAsDefault = async () => {
    if (!confirmTemplate?.templateId || saving) return;

    const templateId = confirmTemplate.templateId;
    const key = templateId.toLowerCase();
    const colorsOverride = confirmTemplate.colors || getTemplateColors(
      key,
      currentColorStore,
      currentTemplateKey
    );
    const oldDefault = currentTemplateKey;
    const existingStore = currentColorStore;
    const mergedColorStore = buildTemplateColorStore(
      key,
      colorsOverride,
      existingStore,
      oldDefault
    );

    setConfirmTemplate(null);
    setSaving(true);

    try {
      const { data } = await authAPI.updateMe({
        [templateField]: templateId,
        [colorField]: mergedColorStore,
      });

      updateUser(data.user);
      setActiveTemplate(templateId);
      setTemplateColors(mergedColorStore[key] || DEFAULT_COLORS[key]);
      toast.success('Default template and colors updated');
      setPreviewTemplate(null);
    } catch (error) {
      console.error('Failed to change template:', error);
      toast.error('Failed to change template');
      setActiveTemplate(currentTemplateKey);
      setTemplateColors(
        getTemplateColors(currentTemplateKey, currentColorStore, currentTemplateKey)
      );
    } finally {
      setSaving(false);
    }
  };

  const saveTemplateColorsOnly = async () => {
    const key = (previewTemplate?.id || currentTemplateKey || 'template1').toLowerCase();
    const mergedColorStore = buildTemplateColorStore(key, templateColors, currentColorStore, currentTemplateKey);
    setSaving(true);
    try {
      const { data } = await authAPI.updateMe({ [colorField]: mergedColorStore });
      updateUser(data.user);
      setTemplateColors(mergedColorStore[key] || DEFAULT_COLORS[key]);
      toast.success('Template colors saved');
      setPreviewTemplate(null);
    } catch (error) {
      console.error('Failed to save template colors:', error);
      toast.error('Failed to save template colors');
    } finally {
      setSaving(false);
    }
  };

  const handleCardSelect = (tmpl) => {
    if (tmpl.id && !FREE_TEMPLATES.includes(tmpl.id) && isFreePlan) {
      toast('Upgrade your plan to unlock this template', { icon: '🔒' });
      navigate('/upgrade');
      return;
    }
    const key = (tmpl.id || currentTemplateKey || 'template1').toLowerCase();
    const colors = getTemplateColors(key, currentColorStore, currentTemplateKey);
    selectTemplate(tmpl.id, colors);
  };

  return (
    <div className="templates-page">
      <style>{`
        .templates-page {
          width: 100%;
          max-width: 1500px;
          margin: 0 auto;
          padding: 0 12px 32px;
          box-sizing: border-box;
        }

        .templates-page .page-header {
          margin-bottom: 20px;
        }

        .templates-page .page-title {
          font-size: clamp(1.15rem, 2.5vw, 1.6rem);
          margin: 0;
          word-break: break-word;
        }

        .templates-page .page-subtitle {
          font-size: clamp(0.78rem, 1.5vw, 0.9rem);
          margin: 4px 0 0;
        }

        .templates-page .doc-type-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 18px;
          flex-wrap: wrap;
        }

        .templates-page .doc-type-tabs .btn {
          flex: 1 1 auto;
          min-width: 120px;
          justify-content: center;
          white-space: nowrap;
        }

        /* Responsive grid: mobile 2, sm 2, md 3, lg 4, xl 5 */
        .templates-page .templates-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .templates-page .template-card {
          background: var(--bg-card);
          border-radius: 12px;
          padding: 10px;
          min-width: 0;
          display: flex;
          flex-direction: column;
          cursor: pointer;
          transition: opacity 0.18s ease, filter 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
          position: relative;
          box-sizing: border-box;
        }

        .templates-page .template-card-preview {
          width: 100%;
          aspect-ratio: 5 / 7;
          flex: 0 0 auto;
          position: relative;
          background: var(--bg-elevated);
          border-radius: 8px;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          overflow: hidden;
          border: none;
        }

        .templates-page .template-card-title {
          min-width: 0;
          margin: 0;
          font-size: 0.82rem;
          font-weight: 700;
          color: var(--text-primary);
          overflow-wrap: anywhere;
          line-height: 1.25;
        }

        .templates-page .template-card-desc {
          min-width: 0;
          margin: 0;
          font-size: 0.68rem;
          color: var(--text-secondary);
          line-height: 1.4;
          overflow-wrap: anywhere;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .templates-page .template-card-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
          margin-top: 10px;
        }

        .templates-page .template-card-actions .btn {
          min-height: 32px;
          font-size: 0.65rem;
          padding: 4px 4px;
          justify-content: center;
          gap: 3px;
          white-space: nowrap;
          overflow: hidden;
        }

        .templates-page .template-card-actions .btn svg {
          flex-shrink: 0;
        }

        .templates-page .template-card-swatches {
          display: flex;
          justify-content: center;
          gap: 5px;
          margin-top: 6px;
        }

        /* Modal base */
        .templates-page .modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 1000;
          background: rgba(0,0,0,0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(4px);
          padding: 0;
        }

        .templates-page .modal-box {
          background: var(--bg-card);
          border-radius: 0;
          width: 100vw;
          height: 100vh;
          max-width: none;
          max-height: none;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .templates-page .modal-header {
          padding: 14px 16px;
          border-bottom: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          flex-shrink: 0;
        }

        .templates-page .modal-header h3 {
          font-size: 1rem;
          font-weight: 700;
          margin: 0;
          overflow-wrap: anywhere;
        }

        .templates-page .modal-header p {
          font-size: 0.78rem;
          color: var(--text-secondary);
          margin: 4px 0 0;
          overflow-wrap: anywhere;
        }

        .templates-page .modal-body {
          flex: 1;
          overflow: auto;
          padding: 14px;
          background-color: var(--bg-elevated);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          -webkit-overflow-scrolling: touch;
        }

        .templates-page .modal-footer {
          padding: 12px 14px;
          border-top: 1px solid var(--border);
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-end;
          gap: 8px;
          background: var(--bg-card);
          flex-shrink: 0;
        }

        .templates-page .modal-footer .btn {
          flex: 1 1 auto;
          justify-content: center;
          min-width: 110px;
          font-size: 0.82rem;
        }

        /* Color customization panel */
        .templates-page .color-panel {
          width: 100%;
          max-width: 500px;
          padding: 16px;
          background: var(--bg-card);
          border-radius: 12px;
          border: 1px solid var(--border);
          box-sizing: border-box;
        }

        .templates-page .color-panel-row {
          display: flex;
          gap: 18px;
          flex-wrap: wrap;
        }

        /* Confirmation modal */
        .templates-page .confirm-overlay {
          position: fixed;
          inset: 0;
          z-index: 1100;
          background: rgba(15, 23, 42, 0.62);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          backdrop-filter: blur(4px);
        }

        .templates-page .confirm-box {
          width: min(460px, 94vw);
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 18px;
          box-shadow: 0 24px 70px rgba(0,0,0,0.24);
          padding: 20px;
          box-sizing: border-box;
        }

        .templates-page .confirm-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 22px;
          flex-wrap: wrap;
        }

        .templates-page .confirm-actions .btn {
          flex: 1 1 auto;
          justify-content: center;
          min-width: 120px;
        }

        /* Very small mobile (<360px) — still 2 columns but tighter */
        @media (max-width: 360px) {
          .templates-page {
            padding: 0 8px 24px;
          }

          .templates-page .templates-grid {
            gap: 8px;
          }

          .templates-page .template-card {
            padding: 8px;
          }

          .templates-page .template-card-title {
            font-size: 0.76rem;
          }

          .templates-page .template-card-actions {
            grid-template-columns: 1fr;
          }
        }

        /* Small mobile — 2 columns */
        @media (min-width: 400px) {
          .templates-page .templates-grid {
            gap: 12px;
          }

          .templates-page .template-card {
            padding: 12px;
          }

          .templates-page .template-card-title {
            font-size: 0.88rem;
          }

          .templates-page .template-card-desc {
            font-size: 0.72rem;
          }

          .templates-page .template-card-actions .btn {
            font-size: 0.7rem;
            min-height: 34px;
          }
        }

        /* Tablet — 3 columns */
        @media (min-width: 640px) {
          .templates-page {
            padding: 0 16px 32px;
          }

          .templates-page .doc-type-tabs .btn {
            flex: 0 0 auto;
          }

          .templates-page .templates-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 16px;
          }

          .templates-page .template-card {
            padding: 14px;
            border-radius: 14px;
          }

          .templates-page .template-card-preview {
            margin-bottom: 12px;
          }

          .templates-page .template-card-title {
            font-size: 0.95rem;
          }

          .templates-page .template-card-desc {
            font-size: 0.78rem;
            -webkit-line-clamp: 4;
          }

          .templates-page .template-card-actions .btn {
            font-size: 0.72rem;
            min-height: 36px;
          }
        }

        /* Tablet landscape / small desktop — 4 columns */
        @media (min-width: 900px) {
          .templates-page {
            padding: 0 20px 32px;
          }

          .templates-page .templates-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 18px;
          }

          .templates-page .modal-overlay {
            padding: 24px;
          }

          .templates-page .modal-box {
            width: auto;
            height: auto;
            border-radius: 16px;
            max-width: 95vw;
            max-height: 92vh;
          }

          .templates-page .modal-header {
            padding: 20px 24px;
          }

          .templates-page .modal-header h3 {
            font-size: 1.25rem;
          }

          .templates-page .modal-header p {
            font-size: 0.9rem;
          }

          .templates-page .modal-body {
            padding: 24px;
          }

          .templates-page .modal-footer {
            padding: 20px 24px;
            gap: 12px;
          }

          .templates-page .modal-footer .btn {
            flex: 0 0 auto;
            min-width: 0;
            font-size: 0.9rem;
          }
        }

        /* Desktop */
        @media (min-width: 1024px) {
          .templates-page {
            padding: 0 32px 40px;
          }

          .templates-page .page-header {
            margin-bottom: 24px;
          }

          .templates-page .templates-grid {
            gap: 22px;
          }

          .templates-page .template-card {
            padding: 16px;
          }

          .templates-page .template-card-title {
            font-size: 1rem;
          }

          .templates-page .template-card-desc {
            font-size: 0.8rem;
          }
        }

        /* Large desktop — 5 columns */
        @media (min-width: 1440px) {
          .templates-page .templates-grid {
            grid-template-columns: repeat(5, minmax(0, 1fr));
            gap: 24px;
          }
        }
      `}</style>

      <div className="page-header">
        <div>
          <h1 className="page-title">Document Templates</h1>
          <p className="page-subtitle">Choose independent designs for invoices and quotations.</p>
        </div>
      </div>

      <div className="doc-type-tabs">
        {['invoice', 'quotation'].map((type) => (
          <button
            key={type}
            type="button"
            className={`btn ${documentType === type ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => changeDocumentType(type)}
          >
            {type === 'invoice' ? 'Invoice designs' : 'Quotation designs'}
          </button>
        ))}
      </div>

      <div className="templates-grid">
        {TEMPLATES.filter((tmpl) => !tmpl.type || tmpl.type === documentType).map((tmpl) => {
          const isActive = activeTemplate === tmpl.id;
          const isLocked = !FREE_TEMPLATES.includes(tmpl.id) && isFreePlan;
          const previewSrc = documentType === 'quotation' ? (QUOTATION_PREVIEWS[tmpl.id] || tmpl.img) : tmpl.img;
          return (
            <div
              key={tmpl.id}
              className="template-card"
              onClick={() => handleCardSelect(tmpl)}
              style={{
                background: isActive ? 'var(--bg-card)' : 'rgba(248,250,252,0.92)',
                border: isActive ? '2px solid var(--primary)' : '1px solid var(--border)',
                transform: isActive ? 'translateY(-2px)' : 'none',
                boxShadow: isActive ? '0 8px 24px -6px rgba(99,102,241,0.2)' : 'var(--shadow)',
                opacity: isLocked ? 0.42 : (isActive ? 1 : 0.58),
                filter: isActive ? 'none' : 'saturate(0.72)',
              }}
            >
              <div className="template-card-preview">
                <TemplatePreview
                  src={previewSrc}
                  templateId={tmpl.id}
                  logo={user?.businessLogo}
                  seal={user?.businessSeal}
                  signature={user?.businessSignature}
                  alt={tmpl.name}
                  style={{ height: '100%' }}
                  imageStyle={{ height: '100%' }}
                  isFreePlan={isFreePlan}
                />
                {isLocked && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(20,20,30,0.45)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        background: '#fff',
                        color: '#111',
                        fontSize: '0.62rem',
                        fontWeight: 700,
                        padding: '4px 8px',
                        borderRadius: 20
                      }}
                    >
                      <Lock size={10} />
                      Upgrade
                    </span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6, marginBottom: 6 }}>
                <h3 className="template-card-title">{tmpl.name}</h3>
                {isActive && (
                  <div style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                    <CheckCircle2 size={16} fill="var(--primary-bg)" />
                  </div>
                )}
              </div>

              <p className="template-card-desc">{tmpl.desc}</p>

              <div className="template-card-actions">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={(e) => { e.stopPropagation(); handleOpenPreview(tmpl, false); }}
                >
                  <Eye size={12} /> Preview
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={(e) => { e.stopPropagation(); handleOpenPreview(tmpl, true); }}
                >
                  <Palette size={12} /> Color
                </button>
              </div>

              <div className="template-card-swatches">
                {(() => {
                  const colors = getTemplateColors(tmpl.id || currentTemplateKey, currentColorStore, currentTemplateKey);
                  return <>
                    <span title={`Primary ${colors.primary}`} style={{ width: 11, height: 11, borderRadius: '50%', background: colors.primary, border: '1px solid var(--border)' }} />
                    {colors.secondary && <span title={`Secondary ${colors.secondary}`} style={{ width: 11, height: 11, borderRadius: '50%', background: colors.secondary, border: '1px solid var(--border)' }} />}
                  </>;
                })()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="modal-overlay">
          <div
            className="modal-box"
            style={{
              maxWidth: previewTemplate.colorsOnly ? '900px' : '760px',
              height: 'auto',
              maxHeight: '92vh',
            }}
          >
            <div className="modal-header">
              <div style={{ minWidth: 0, flex: 1 }}>
                <h3>{previewTemplate.name}</h3>
                <p>{previewTemplate.desc}</p>
              </div>
              <button
                onClick={() => setPreviewTemplate(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', flexShrink: 0 }}
                aria-label="Close preview"
              >
                <X size={22} />
              </button>
            </div>

            <div className="modal-body">
              <div style={{ position: 'relative', width: '100%', maxWidth: previewTemplate.colorsOnly ? '500px' : '650px' }}>
                <div style={{ position: 'relative' }}>
                  <TemplatePreview
                    src={documentType === 'quotation' ? (QUOTATION_PREVIEWS[previewTemplate.id] || previewTemplate.img) : previewTemplate.img}
                    templateId={previewTemplate.id}
                    logo={user?.businessLogo}
                    seal={user?.businessSeal}
                    signature={user?.businessSignature}
                    alt={previewTemplate.name}
                    templateColors={templateColors}
                    user={user}
                    isQuotation={documentType === 'quotation'}
                    style={{ width: '100%', minHeight: 500, boxShadow: 'var(--shadow-lg)', borderRadius: '8px' }}
                    imageStyle={{ height: 'auto' }}
                    isFreePlan={isFreePlan}
                  />
                </div>
              </div>

              {/* Color Customization UI — shown only from "Custom Color" */}
              {previewTemplate.colorsOnly && (
                <div className="color-panel">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <div style={{ padding: 8, background: 'var(--primary-bg)', borderRadius: 8, color: 'var(--primary)' }}>
                      <Palette size={18} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: 700, margin: 0 }}>Template Colors</h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Configure default colors for this template</p>
                    </div>
                  </div>

                  <div className="color-panel-row">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Primary Color</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <input
                          type="color"
                          value={templateColors?.primary || DEFAULT_COLORS[previewTemplate.id]?.primary || '#000000'}
                          onChange={(e) => setTemplateColors(c => ({ ...c, primary: e.target.value }))}
                          style={{ width: 44, height: 44, padding: 0, border: 'none', borderRadius: 10, cursor: 'pointer', background: 'none' }}
                        />
                        <span style={{ fontSize: '0.85rem', fontFamily: 'monospace', fontWeight: 600 }}>{templateColors?.primary}</span>
                      </div>
                    </div>

                    {DEFAULT_COLORS[previewTemplate.id]?.secondary && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Secondary Color</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <input
                            type="color"
                            value={templateColors?.secondary || DEFAULT_COLORS[previewTemplate.id]?.secondary || '#000000'}
                            onChange={(e) => setTemplateColors(c => ({ ...c, secondary: e.target.value }))}
                            style={{ width: 44, height: 44, padding: 0, border: 'none', borderRadius: 10, cursor: 'pointer', background: 'none' }}
                          />
                          <span style={{ fontSize: '0.85rem', fontFamily: 'monospace', fontWeight: 600 }}>{templateColors?.secondary}</span>
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ marginTop: 'auto', marginBottom: 6, fontSize: '0.75rem' }}
                      onClick={() => setTemplateColors({ ...(DEFAULT_COLORS[previewTemplate.id] || DEFAULT_COLORS.template1) })}
                    >
                      Reset to Default
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setPreviewTemplate(null)}>Close</button>
              {previewTemplate.colorsOnly && (
                <>
                  <button
                    className="btn btn-secondary"
                    onClick={saveTemplateColorsOnly}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Colors'}
                  </button>
                  {activeTemplate === previewTemplate.id ? (
                    <button className="btn btn-primary" disabled style={{ opacity: 0.7 }}>
                      <CheckCircle2 size={16} /> Currently Default
                    </button>
                  ) : (
                    <button
                      className="btn btn-primary"
                      onClick={() => selectTemplate(previewTemplate.id)}
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : 'Set as Default'}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* In-website confirmation modal — no browser confirm dialog */}
      {confirmTemplate && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="set-default-template-title"
          className="confirm-overlay"
          onClick={() => !saving && setConfirmTemplate(null)}
        >
          <div
            className="confirm-box"
            onClick={(event) => event.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  flexShrink: 0,
                  display: 'grid',
                  placeItems: 'center',
                  borderRadius: 12,
                  background: 'var(--primary-bg)',
                  color: 'var(--primary)',
                }}
              >
                <CheckCircle2 size={21} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <h3
                  id="set-default-template-title"
                  style={{ margin: 0, fontSize: '1.05rem', fontWeight: 750 }}
                >
                  Set as Default?
                </h3>
                <p
                  style={{
                    margin: '8px 0 0',
                    fontSize: '0.88rem',
                    lineHeight: 1.55,
                    color: 'var(--text-secondary)',
                  }}
                >
                  Set <strong style={{ color: 'var(--text-primary)' }}>{confirmTemplate.templateName}</strong>{' '}
                  as your default {documentType}? New {documentType}s will automatically use this template.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close confirmation"
                disabled={saving}
                onClick={() => setConfirmTemplate(null)}
                style={{
                  border: '1px solid var(--border)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-muted)',
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  flexShrink: 0,
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div
              style={{
                marginTop: 20,
                padding: 12,
                borderRadius: 12,
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                flexWrap: 'wrap',
              }}
            >
              <span
                title={`Primary ${confirmTemplate.colors?.primary || ''}`}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: confirmTemplate.colors?.primary || '#000',
                  border: '1px solid var(--border)',
                  flexShrink: 0,
                }}
              />
              {confirmTemplate.colors?.secondary && (
                <span
                  title={`Secondary ${confirmTemplate.colors.secondary}`}
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: confirmTemplate.colors.secondary,
                    border: '1px solid var(--border)',
                    flexShrink: 0,
                  }}
                />
              )}
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', minWidth: 0 }}>
                These template colors will also be saved for this default.
              </span>
            </div>

            <div className="confirm-actions">
              <button
                type="button"
                className="btn btn-ghost"
                disabled={saving}
                onClick={() => setConfirmTemplate(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={saving}
                onClick={confirmSetAsDefault}
              >
                {saving ? 'Saving...' : 'Yes, Set as Default'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
