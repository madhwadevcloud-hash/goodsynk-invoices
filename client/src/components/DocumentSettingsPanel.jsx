import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Lock, Upload, X, Check } from 'lucide-react';
import { getDocumentSettings, saveDocumentSettings, DEFAULT_WATERMARK_SVG } from '../utils/documentSettings';

export default function DocumentSettingsPanel({ onClose }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isFreePlan = !user?.plan || String(user.plan).toLowerCase() === 'free';

  const [settings, setSettings] = useState(getDocumentSettings());

  useEffect(() => {
    const handleSync = (e) => {
      if (e.detail) setSettings(e.detail);
    };
    window.addEventListener('documentSettingsChanged', handleSync);
    return () => window.removeEventListener('documentSettingsChanged', handleSync);
  }, []);

  const updateSetting = (key, value) => {
    let nextSettings = { ...settings, [key]: value };
    if (key === 'hideDiscount' && value === true) {
      nextSettings.showDiscountColumn = false;
    } else if (key === 'showDiscountColumn' && value === true) {
      nextSettings.hideDiscount = false;
    }
    setSettings(nextSettings);
    saveDocumentSettings(nextSettings);
  };

  const handleWatermarkUpload = (e) => {
    if (isFreePlan) {
      toast('Upgrade your plan to unlock Watermark customization', { icon: '🔒' });
      navigate('/upgrade');
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      updateSetting('watermarkImage', evt.target?.result);
      toast.success('Watermark updated');
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    saveDocumentSettings(settings);
    toast.success('Document settings saved successfully');
    if (onClose) onClose();
  };

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg, 12px)',
      padding: '24px',
      marginBottom: '24px',
      boxShadow: 'var(--shadow-md, 0 4px 12px rgba(0,0,0,0.05))',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Document Settings</h3>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Card 1: Pricing & Discounts */}
      <div style={{
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px',
        background: 'var(--bg-elevated, #fafafa)',
      }}>
        <h4 style={{ margin: '0 0 16px 0', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
          Pricing & Discounts
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          {/* Hide Discount */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>Hide Discount</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>Hide line discounts on PDFs.</div>
            </div>
            <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, cursor: 'pointer', flexShrink: 0 }}>
              <input
                type="checkbox"
                checked={settings.hideDiscount}
                onChange={(e) => updateSetting('hideDiscount', e.target.checked)}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute', inset: 0,
                backgroundColor: settings.hideDiscount ? 'var(--primary, #276EF1)' : '#cbd5e1',
                borderRadius: 24, transition: '0.2s',
              }}>
                <span style={{
                  position: 'absolute', content: '""', height: 18, width: 18,
                  left: settings.hideDiscount ? 22 : 3, bottom: 3,
                  backgroundColor: '#fff', borderRadius: '50%', transition: '0.2s',
                }} />
              </span>
            </label>
          </div>

          {/* Show Discount Column */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>Show Discount Column</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>Put discount in its own PDF column.</div>
            </div>
            <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, cursor: 'pointer', flexShrink: 0 }}>
              <input
                type="checkbox"
                checked={settings.showDiscountColumn}
                onChange={(e) => updateSetting('showDiscountColumn', e.target.checked)}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute', inset: 0,
                backgroundColor: settings.showDiscountColumn ? 'var(--primary, #276EF1)' : '#cbd5e1',
                borderRadius: 24, transition: '0.2s',
              }}>
                <span style={{
                  position: 'absolute', content: '""', height: 18, width: 18,
                  left: settings.showDiscountColumn ? 22 : 3, bottom: 3,
                  backgroundColor: '#fff', borderRadius: '50%', transition: '0.2s',
                }} />
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Card 2: Branding */}
      <div style={{
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '20px',
        background: 'var(--bg-elevated, #fafafa)',
      }}>
        <h4 style={{ margin: '0 0 4px 0', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
          Branding
        </h4>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '16px' }}>
          Color & Watermark
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          {/* PDF Accent Color */}
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
              PDF accent color (default #276EF1)
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2, marginBottom: 12 }}>
              Hex color for PDF accents on templates that support tinting.
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                type="text"
                className="form-control"
                style={{ width: 120, fontFamily: 'monospace', textTransform: 'lowercase' }}
                value={settings.pdfAccentColor}
                onChange={(e) => updateSetting('pdfAccentColor', e.target.value)}
              />
              <div style={{ position: 'relative', width: 44, height: 44, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
                <input
                  type="color"
                  value={settings.pdfAccentColor || '#276EF1'}
                  onChange={(e) => updateSetting('pdfAccentColor', e.target.value)}
                  style={{ position: 'absolute', inset: -8, width: 60, height: 60, cursor: 'pointer', border: 'none', background: 'none' }}
                />
              </div>
            </div>
          </div>

          {/* Watermark */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
              <span>Watermark</span>
              {isFreePlan && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '2px 8px', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  <Lock size={10} /> Upgrade
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2, marginBottom: 12 }}>
              PNG or JPEG, 512×512 square. Transparency is handled for you.
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <label
                onClick={(e) => {
                  if (isFreePlan) {
                    e.preventDefault();
                    toast('Upgrade your plan to unlock Watermark customization', { icon: '🔒' });
                    navigate('/upgrade');
                  }
                }}
                style={{
                  position: 'relative',
                  width: 90, height: 90,
                  borderRadius: 12,
                  border: '1.5px dashed var(--border)',
                  background: 'var(--bg-card, #ffffff)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', overflow: 'hidden',
                }}
              >
                <img
                  src={settings.watermarkImage || DEFAULT_WATERMARK_SVG}
                  alt="Watermark"
                  style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4 }}
                />
                <input type="file" accept="image/*" onChange={handleWatermarkUpload} disabled={isFreePlan} style={{ display: 'none' }} />
              </label>

              {settings.watermarkImage && settings.watermarkImage !== DEFAULT_WATERMARK_SVG && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ color: 'var(--danger)', fontSize: '0.75rem' }}
                  onClick={() => updateSetting('watermarkImage', DEFAULT_WATERMARK_SVG)}
                >
                  <X size={14} /> Reset Watermark
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Save Changes Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: '20px' }}>
        {onClose && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onClose}
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleSave}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 20px', fontWeight: 600 }}
        >
          <Check size={16} /> Save Changes
        </button>
      </div>
    </div>
  );
}
