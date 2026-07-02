import { useState, useRef, useCallback } from 'react';
import { Upload, Pen, Type, Check, X, RefreshCw } from 'lucide-react';

const CALLIGRAPHY_FONTS = [
  { id: 'dancing', name: 'Classic', family: "'Dancing Script', cursive", url: 'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap' },
  { id: 'greatvibes', name: 'Elegant', family: "'Great Vibes', cursive", url: 'https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap' },
  { id: 'pinyon', name: 'Formal', family: "'Pinyon Script', cursive", url: 'https://fonts.googleapis.com/css2?family=Pinyon+Script&display=swap' },
  { id: 'parisienne', name: 'Stylish', family: "'Parisienne', cursive", url: 'https://fonts.googleapis.com/css2?family=Parisienne&display=swap' },
];

// Inject all font links once
const FONTS_INJECTED = { done: false };
function injectFonts() {
  if (FONTS_INJECTED.done) return;
  CALLIGRAPHY_FONTS.forEach((f) => {
    if (!document.querySelector(`link[href="${f.url}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = f.url;
      document.head.appendChild(link);
    }
  });
  FONTS_INJECTED.done = true;
}
injectFonts();

function renderSignatureToDataURL(text, fontFamily, color = '#1a1a2e') {
  const canvas = document.createElement('canvas');
  const fontSize = 72;
  canvas.height = 120;
  canvas.width = 400; // temporary — measure on this first

  const ctx = canvas.getContext('2d');
  ctx.font = `${fontSize}px ${fontFamily}`;
  const measured = ctx.measureText(text);
  // Resize canvas to exactly fit the text with 40px padding on each side
  canvas.width = Math.max(300, Math.ceil(measured.width) + 80);

  // Re-apply font after resize (resize clears canvas state)
  ctx.font = `${fontSize}px ${fontFamily}`;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = color;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  return canvas.toDataURL('image/png');
}

export default function SignaturePicker({ currentSignature, onSave }) {
  const [mode, setMode] = useState('type'); // 'type' | 'upload'
  const [typedName, setTypedName] = useState('');
  const [selectedFont, setSelectedFont] = useState(CALLIGRAPHY_FONTS[0]);
  const [preview, setPreview] = useState(null);
  const [uploadedImg, setUploadedImg] = useState(null);
  const fileRef = useRef();

  const generatePreview = useCallback(() => {
    if (!typedName.trim()) return;
    // Allow font to load then render
    setTimeout(() => {
      const dataURL = renderSignatureToDataURL(typedName.trim(), selectedFont.family);
      setPreview(dataURL);
    }, 300);
  }, [typedName, selectedFont]);

  const handleFontChange = (font) => {
    setSelectedFont(font);
    if (typedName.trim()) {
      setTimeout(() => {
        const dataURL = renderSignatureToDataURL(typedName.trim(), font.family);
        setPreview(dataURL);
      }, 300);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setUploadedImg(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    const sig = mode === 'type' ? preview : uploadedImg;
    if (!sig) return;
    onSave(sig);
  };

  const handleClear = () => {
    onSave('');
    setPreview(null);
    setUploadedImg(null);
    setTypedName('');
  };

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 20, background: 'var(--bg-card)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h4 style={{ fontWeight: 700, fontSize: '0.95rem', margin: 0 }}>Business Signature</h4>
        {/* Mode Toggle */}
        <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
          <button type="button" onClick={() => setMode('type')} style={{
            padding: '6px 14px', fontSize: '0.78rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5,
            background: mode === 'type' ? 'var(--primary)' : 'transparent',
            color: mode === 'type' ? '#fff' : 'var(--text-secondary)',
            border: 'none', cursor: 'pointer',
          }}>
            <Type size={13} /> Type
          </button>
          <button type="button" onClick={() => setMode('upload')} style={{
            padding: '6px 14px', fontSize: '0.78rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5,
            background: mode === 'upload' ? 'var(--primary)' : 'transparent',
            color: mode === 'upload' ? '#fff' : 'var(--text-secondary)',
            border: 'none', cursor: 'pointer',
          }}>
            <Upload size={13} /> Upload
          </button>
        </div>
      </div>

      {/* Current Signature Preview */}
      {currentSignature && !preview && !uploadedImg && (
        <div style={{ marginBottom: 12, padding: 10, background: 'var(--bg-hover)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 4 }}>Current Signature</div>
            <img src={currentSignature} alt="signature" style={{ height: 40, objectFit: 'contain' }} />
          </div>
          <button type="button" onClick={handleClear} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger, #ef4444)' }} title="Remove">
            <X size={16} />
          </button>
        </div>
      )}

      {mode === 'type' ? (
        <div>
          {/* Typed Name Input */}
          <div style={{ marginBottom: 12 }}>
            <input
              className="form-control"
              placeholder="Type your name..."
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              style={{ marginBottom: 8 }}
            />
            {/* Font style selector */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {CALLIGRAPHY_FONTS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => handleFontChange(f)}
                  style={{
                    padding: '6px 12px',
                    border: selectedFont.id === f.id ? '2px solid var(--primary)' : '2px solid var(--border)',
                    borderRadius: 6,
                    background: selectedFont.id === f.id ? 'rgba(var(--primary-rgb,59,130,246),0.08)' : 'var(--bg-card)',
                    cursor: 'pointer',
                    fontFamily: f.family,
                    fontSize: '1.1rem',
                    color: 'var(--text-primary)',
                  }}
                >
                  {f.name}
                </button>
              ))}
            </div>
          </div>

          <button type="button" onClick={generatePreview} disabled={!typedName.trim()} style={{
            padding: '7px 16px', marginBottom: 12,
            background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 7,
            cursor: typedName.trim() ? 'pointer' : 'not-allowed', opacity: typedName.trim() ? 1 : 0.5,
            fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <RefreshCw size={13} /> Generate
          </button>

          {/* Calligraphy Preview */}
          {preview && (
            <div style={{ marginBottom: 12, padding: 16, background: '#fff', border: '1px dashed var(--border)', borderRadius: 8, textAlign: 'center' }}>
              <img src={preview} alt="signature preview" style={{ maxHeight: 70, objectFit: 'contain' }} />
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 6 }}>Preview — {selectedFont.name} style</div>
            </div>
          )}
        </div>
      ) : (
        <div>
          <div
            onClick={() => fileRef.current.click()}
            style={{
              border: '2px dashed var(--border)', borderRadius: 10, padding: '24px 20px', textAlign: 'center',
              cursor: 'pointer', background: 'var(--bg-hover)', marginBottom: 12,
            }}
          >
            <Upload size={24} style={{ color: 'var(--text-muted)', marginBottom: 8 }} />
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Click to upload signature image</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>PNG with transparent background works best</div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileUpload} />
          {uploadedImg && (
            <div style={{ padding: 16, background: '#fff', border: '1px dashed var(--border)', borderRadius: 8, textAlign: 'center', marginBottom: 12 }}>
              <img src={uploadedImg} alt="uploaded signature" style={{ maxHeight: 70, objectFit: 'contain' }} />
            </div>
          )}
        </div>
      )}

      {/* Save Button */}
      <button
        type="button"
        onClick={handleSave}
        disabled={mode === 'type' ? !preview : !uploadedImg}
        style={{
          width: '100%', padding: '9px 0', borderRadius: 8, border: 'none',
          background: 'var(--primary)', color: '#fff', fontWeight: 700,
          fontSize: '0.88rem', cursor: 'pointer',
          opacity: (mode === 'type' ? preview : uploadedImg) ? 1 : 0.4,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}
      >
        <Check size={15} /> Save Signature
      </button>
    </div>
  );
}
