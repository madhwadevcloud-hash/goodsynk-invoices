import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../api/services';
import toast from 'react-hot-toast';
import { Palette, CheckCircle2, X, Lock } from 'lucide-react';
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
  const [templateColors, setTemplateColors] = useState(user?.invoiceTemplateColors || null);
  const [saving, setSaving] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const isFreePlan = !user?.plan || String(user.plan).toLowerCase() === 'free';
  const handleOpenPreview = (tmpl) => {
    if (!FREE_TEMPLATES.includes(tmpl.id) && isFreePlan) {
      toast('Upgrade your plan to unlock this template', { icon: '🔒' });
      navigate('/upgrade');
      return;
    }
    setPreviewTemplate(tmpl);
    const selectedTemplate = documentType === 'quotation' ? user?.quotationTemplate : user?.invoiceTemplate;
    const selectedColors = documentType === 'quotation' ? user?.quotationTemplateColors : user?.invoiceTemplateColors;
    if (selectedTemplate === tmpl.id && selectedColors) {
      setTemplateColors(selectedColors);
    } else {
      setTemplateColors(DEFAULT_COLORS[tmpl.id]);
    }
  };
  const selectTemplate = async (templateId) => {
    if (!FREE_TEMPLATES.includes(templateId) && isFreePlan) {
      toast('Upgrade your plan to unlock this template', {
        icon: '🔒',
      });
      navigate('/upgrade');
      return;
    }
    setActiveTemplate(templateId);
    setSaving(true);
    try {
      const { data } = await authAPI.updateMe({
        [documentType === 'quotation' ? 'quotationTemplate' : 'invoiceTemplate']: templateId,
        [documentType === 'quotation' ? 'quotationTemplateColors' : 'invoiceTemplateColors']: templateColors
      });
      updateUser(data.user);
      toast.success('Default template and colors updated');
      setPreviewTemplate(null);
    } catch {
      toast.error('Failed to change template');
      setActiveTemplate(documentType === 'quotation' ? (user?.quotationTemplate || 'template1') : (user?.invoiceTemplate || 'template1'));
    } finally {
      setSaving(false);
    }
  };
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Document Templates</h1>
          <p className="page-subtitle">Choose independent designs for invoices and quotations.</p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {['invoice', 'quotation'].map((type) => <button key={type} className={`btn ${documentType === type ? 'btn-primary' : 'btn-ghost'}`} onClick={() => { setDocumentType(type); setActiveTemplate(type === 'quotation' ? (user?.quotationTemplate || 'template1') : (user?.invoiceTemplate || 'template1')); setTemplateColors(type === 'quotation' ? user?.quotationTemplateColors : user?.invoiceTemplateColors); }}>{type === 'invoice' ? 'Invoice designs' : 'Quotation designs'}</button>)}
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
        gap: '24px'
      }}>
        {TEMPLATES.filter((tmpl) => !tmpl.type || tmpl.type === documentType).map((tmpl) => {
          const isActive = activeTemplate === tmpl.id;
          const isLocked = !FREE_TEMPLATES.includes(tmpl.id) && isFreePlan;
          const previewSrc = documentType === 'quotation' ? (QUOTATION_PREVIEWS[tmpl.id] || tmpl.img) : tmpl.img;
          return (
            <div
              key={tmpl.id}
              onClick={() => {
                handleOpenPreview(tmpl);
              }}
              style={{
                background: 'var(--bg-card)',
                border: isActive ? '2px solid var(--primary)' : '1px solid var(--border)',
                borderRadius: '16px',
                padding: '20px',
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                transition: 'all 0.2s',
                transform: isActive ? 'translateY(-2px)' : 'none',
                boxShadow: isActive ? '0 8px 24px -6px rgba(99,102,241,0.2)' : 'var(--shadow)',
                position: 'relative'
              }}
            >
              <div style={{
                width: '100%',
                aspectRatio: '5 / 7',
                flex: '0 0 auto',
                position: 'relative',
                background: 'var(--bg-elevated)',
                borderRadius: '8px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                overflow: 'hidden',
                border: 'none'
              }}>
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
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '5px 10px',
                        borderRadius: 20
                      }}
                    >
                      <Lock size={12} />
                      Upgrade
                    </span>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <h3 style={{ minWidth: 0, margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', overflowWrap: 'anywhere' }}>{tmpl.name}</h3>
                {isActive && (
                  <div style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center' }}>
                    <CheckCircle2 size={20} fill="var(--primary-bg)" />
                  </div>
                )}
              </div>
              <p style={{ minWidth: 0, margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, overflowWrap: 'anywhere' }}>
                {tmpl.desc}
              </p>
            </div>
          );
        })}
      </div>
      {/* Preview Modal */}
      {previewTemplate && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'var(--bg-card)', borderRadius: '16px', width: '900px', maxWidth: '95vw',
            maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden'
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{previewTemplate.name}</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{previewTemplate.desc}</p>
              </div>
              <button onClick={() => setPreviewTemplate(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={24} />
              </button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: '24px', backgroundColor: 'var(--bg-elevated)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
              <div style={{ position: 'relative', width: '100%', maxWidth: '500px' }}>
                <div style={{ position: 'relative' }}>
                  
                  <TemplatePreview
                    src={documentType === 'quotation' ? (QUOTATION_PREVIEWS[previewTemplate.id] || previewTemplate.img) : previewTemplate.img}
                    templateId={previewTemplate.id}
                    logo={user?.businessLogo}
                    seal={user?.businessSeal}
                    signature={user?.businessSignature}
                    alt={previewTemplate.name}
                    style={{ width: '100%', boxShadow: 'var(--shadow-lg)', borderRadius: '8px' }}
                    imageStyle={{ height: 'auto' }}
                    isFreePlan={isFreePlan}
                  />

                </div>
              </div>
              {/* Color Customization UI */}
              <div style={{
                width: '100%', maxWidth: '500px', padding: '20px',
                background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <div style={{ padding: 8, background: 'var(--primary-bg)', borderRadius: 8, color: 'var(--primary)' }}>
                    <Palette size={18} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 700, margin: 0 }}>Template Colors</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Configure default colors for this template</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
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
                    onClick={() => setTemplateColors(DEFAULT_COLORS[previewTemplate.id])}
                  >
                    Reset to Default
                  </button>
                </div>
              </div>
            </div>
            <div style={{ padding: '20px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: 'var(--bg-card)' }}>
              <button className="btn btn-ghost" onClick={() => setPreviewTemplate(null)}>Cancel</button>
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
