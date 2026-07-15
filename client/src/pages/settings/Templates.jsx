import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../api/services';
import toast from 'react-hot-toast';
import { Palette, CheckCircle2, X, Lock } from 'lucide-react';
const TEMPLATES = [
  { id: 'template1', name: 'Classic Blue', desc: 'A clean, universally trusted design with blue accents.', img: '/templates/t1.png' },
  { id: 'template2', name: 'Minimalist Monochrome', desc: 'Elegant black and white. Perfect for ultra-clean printing.', img: '/templates/t2.png' },
  { id: 'template3', name: 'Modern Wave', desc: 'Dark top header with stylized shapes. Contemporary.', img: '/templates/t3.png' },
  { id: 'template4', name: 'Elegant Navy', desc: 'Navy blue and gold accents for a premium agency feel.', img: '/templates/t4.png' },
  { id: 'template5', name: 'Corporate Bright', desc: 'High contrast blue table headers and minimalist layout.', img: '/templates/t5.png' },
  { id: 'template6', name: 'Angular Orange', desc: 'Striking orange and navy blue angular design.', img: '/templates/t6.png' },
  { id: 'template7', name: 'Standard Layout', desc: 'Traditional invoice layout with side-by-side details.', img: '/templates/t7.png' },
];
const DEFAULT_COLORS = {
  template1: { primary: '#4A72D4' },
  template2: { primary: '#000000' },
  template3: { primary: '#1a3a6b', secondary: '#4A72D4' },
  template4: { primary: '#1C2541', secondary: '#d4af37' },
  template5: { primary: '#0A66C2' },
  template6: { primary: '#E8662B', secondary: '#1C2541' },
  template7: { primary: '#B565D8' },
};
const FREE_TEMPLATES = ['template1', 'template2'];
export default function Templates() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [activeTemplate, setActiveTemplate] = useState(user?.invoiceTemplate || 'template1');
  const [templateColors, setTemplateColors] = useState(user?.invoiceTemplateColors || null);
  const [saving, setSaving] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const handleOpenPreview = (tmpl) => {
    setPreviewTemplate(tmpl);
    if (user?.invoiceTemplate === tmpl.id && user?.invoiceTemplateColors) {
      setTemplateColors(user.invoiceTemplateColors);
    } else {
      setTemplateColors(DEFAULT_COLORS[tmpl.id]);
    }
  };
  const selectTemplate = async (templateId) => {
    if (!FREE_TEMPLATES.includes(templateId) && (!user?.plan || user.plan === 'free')) {
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
        invoiceTemplate: templateId,
        invoiceTemplateColors: templateColors
      });
      updateUser(data.user);
      toast.success('Default template and colors updated');
      setPreviewTemplate(null);
    } catch {
      toast.error('Failed to change template');
      setActiveTemplate(user?.invoiceTemplate || 'template1');
    } finally {
      setSaving(false);
    }
  };
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Invoice Templates</h1>
          <p className="page-subtitle">Choose the default design for all your new invoices and quotations.</p>
        </div>
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '32px'
      }}>
        {TEMPLATES.map((tmpl) => {
          const isActive = activeTemplate === tmpl.id;
          const isLocked = !FREE_TEMPLATES.includes(tmpl.id) && (!user?.plan || user.plan === 'free');
          return (
            <div
              key={tmpl.id}
              onClick={() => {
                if (isLocked) {
                  toast('Upgrade your plan to unlock this template', {
                    icon: '🔒',
                  });
                  navigate('/upgrade');
                  return;
                }
                handleOpenPreview(tmpl);
              }}
              style={{
                background: 'var(--bg-card)',
                border: isActive ? '2px solid var(--primary)' : '1px solid var(--border)',
                borderRadius: '16px',
                padding: '20px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                transform: isActive ? 'translateY(-2px)' : 'none',
                boxShadow: isActive ? '0 8px 24px -6px rgba(99,102,241,0.2)' : 'var(--shadow)',
                position: 'relative'
              }}
            >
              <div style={{
                width: '100%',
                aspectRatio: '1 / 1.4', // Standard A4 ratio
                position: 'relative',
                background: 'var(--bg-elevated)',
                borderRadius: '8px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                overflow: 'hidden',
                border: '1px solid var(--border)'
              }}>
                <img
                  src={tmpl.img}
                  alt={tmpl.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
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
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>{tmpl.name}</h3>
                {isActive && (
                  <div style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center' }}>
                    <CheckCircle2 size={20} fill="var(--primary-bg)" />
                  </div>
                )}
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
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
              <img src={previewTemplate.img} alt={previewTemplate.name} style={{ height: 'auto', width: '100%', maxWidth: '500px', objectFit: 'contain', boxShadow: 'var(--shadow-lg)', borderRadius: '8px' }} />
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
