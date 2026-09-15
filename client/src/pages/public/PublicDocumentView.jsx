import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import {
    Download, ChevronRight, X, AlertCircle, CheckCircle2, Clock,
    FileText, Copy, Check, Shield, Building2, Calendar,
    CreditCard, Package, Loader2, Mail, Phone, Hash, TrendingUp,
    Lock, Zap, BadgeCheck, Receipt, Wallet, ArrowRight
} from 'lucide-react';

const LOGO_URL = 'https://res.cloudinary.com/dgabaplay/image/upload/v1789050352/copy_of_chatgpt_image_sep_10_2026_07_46_43_pm_1_gw6it7.png';

const API_BASE = import.meta.env.VITE_API_URL;

const fmtCurrency = (n, currency = 'INR') =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 2 }).format(n || 0);

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const fmtAmt = (n) => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);

const getStatusConfig = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('paid') || s.includes('accept'))
        return { color: '#059669', bg: '#ecfdf5', icon: CheckCircle2, label: 'Paid', grad: 'linear-gradient(135deg,#10b981,#059669)' };
    if (s.includes('overdue') || s.includes('reject'))
        return { color: '#dc2626', bg: '#fef2f2', icon: AlertCircle, label: 'Overdue', grad: 'linear-gradient(135deg,#ef4444,#dc2626)' };
    if (s.includes('pending') || s.includes('sent'))
        return { color: '#d97706', bg: '#fffbeb', icon: Clock, label: 'Pending', grad: 'linear-gradient(135deg,#f59e0b,#d97706)' };
    return { color: '#4f46e5', bg: '#eef2ff', icon: FileText, label: status || 'Draft', grad: 'linear-gradient(135deg,#6366f1,#4f46e5)' };
};

/* ═══════════════════════════════════════════════════════════════
   GLOBAL CSS
   ═══════════════════════════════════════════════════════════════ */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .pdv { font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
  .pdv-mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }

  @keyframes pdv-spin { to { transform: rotate(360deg); } }
  @keyframes pdv-fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes pdv-fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes pdv-slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
  @keyframes pdv-slideRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
  @keyframes pdv-meshMove { 0%,100% { transform: translate(0,0) scale(1); } 33% { transform: translate(4%, -4%) scale(1.08); } 66% { transform: translate(-4%, 4%) scale(0.96); } }
  @keyframes pdv-gradientShift { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
  @keyframes pdv-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
  @keyframes pdv-pop { 0% { transform: scale(0.85); opacity: 0; } 60% { transform: scale(1.03); } 100% { transform: scale(1); opacity: 1; } }

  .pdv-btn { transition: all .28s cubic-bezier(.4,0,.2,1); position: relative; overflow: hidden; }
  .pdv-btn::after {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
    transform: translateX(-100%); transition: transform .8s;
    pointer-events: none;
  }
  .pdv-btn:hover::after { transform: translateX(200%); }
  .pdv-btn:active { transform: scale(.98); }
  @media (hover: hover) {
    .pdv-btn:hover { transform: translateY(-2px); }
  }

  .pdv-lift { transition: all .3s cubic-bezier(.4,0,.2,1); }
  @media (hover: hover) {
    .pdv-lift:hover { transform: translateY(-3px); }
  }

  .pdv-scroll { -webkit-overflow-scrolling: touch; }
  .pdv-scroll::-webkit-scrollbar { width: 5px; height: 5px; }
  .pdv-scroll::-webkit-scrollbar-track { background: transparent; }
  .pdv-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
  .pdv-scroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

  .pdv-row { transition: background .18s ease; }
  @media (hover: hover) {
    .pdv-row:hover { background: rgba(99,102,241,0.05); }
  }

  .pdv-mesh-bg {
    background:
      radial-gradient(at 20% 20%, rgba(99,102,241,0.35) 0px, transparent 50%),
      radial-gradient(at 80% 0%, rgba(139,92,246,0.35) 0px, transparent 50%),
      radial-gradient(at 60% 90%, rgba(56,189,248,0.28) 0px, transparent 50%),
      radial-gradient(at 0% 70%, rgba(236,72,153,0.22) 0px, transparent 50%),
      linear-gradient(180deg, #fafbff, #f4f6fb);
  }

  .pdv-noise::before {
    content: ''; position: absolute; inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.85'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E");
    opacity: .035; pointer-events: none; mix-blend-mode: overlay;
    z-index: 1;
  }

  /* ── Mobile-first responsive ── */
  .pdv-main { padding: 0 16px 60px; max-width: 100%; }
  .pdv-split { display: grid; grid-template-columns: 1fr; gap: 16px; align-items: start; }
  .pdv-hero { padding: 24px 20px 22px; }
  .pdv-hero-amount { font-size: 42px; }
  .pdv-panel-body { padding: 22px 20px 24px; }
  .pdv-tile-grid { grid-template-columns: 1fr; }
  .pdv-actions { flex-direction: column; }
  .pdv-btn-sec, .pdv-btn-pri { width: 100%; min-width: 0 !important; }
  .pdv-hero-content { flex-direction: column; align-items: flex-start; gap: 14px; }
  .pdv-hero-status { align-self: flex-start; }
  .pdv-topbar { padding: 18px 16px 8px; }
  .pdv-meta-grid { grid-template-columns: 1fr; }
  .pdv-drawer { max-width: 100%; animation: pdv-slideUp .38s cubic-bezier(.16,1,.3,1); }
  .pdv-drawer-body { padding: 18px 16px 40px; }
  .pdv-drawer-head { padding: 14px 16px; }
  .pdv-blob { width: 420px; height: 420px; }

  /* ── Tablet ── */
  @media (min-width: 640px) {
    .pdv-main { padding: 0 24px 80px; }
    .pdv-hero { padding: 30px 28px 26px; }
    .pdv-hero-amount { font-size: 50px; }
    .pdv-panel-body { padding: 26px 28px 28px; }
    .pdv-tile-grid { grid-template-columns: repeat(2, minmax(0,1fr)); }
    .pdv-actions { flex-direction: row; }
    .pdv-btn-sec { flex: 1; }
    .pdv-btn-pri { flex: 1.3; }
    .pdv-hero-content { flex-direction: row; align-items: center; }
    .pdv-hero-status { align-self: auto; }
    .pdv-topbar { padding: 22px 24px 10px; }
    .pdv-meta-grid { grid-template-columns: repeat(2, minmax(0,1fr)); }
    .pdv-drawer { max-width: 620px; animation: pdv-slideRight .38s cubic-bezier(.16,1,.3,1); }
    .pdv-drawer-body { padding: 22px 22px 44px; }
    .pdv-drawer-head { padding: 18px 22px; }
  }

  /* ── Desktop ── */
  @media (min-width: 1024px) {
    .pdv-main { padding: 0 28px 100px; max-width: 1280px; margin: 0 auto; }
    .pdv-split { grid-template-columns: minmax(0,1fr) 340px; gap: 24px; }
    .pdv-hero { padding: 34px 36px 30px; }
    .pdv-hero-amount { font-size: 60px; }
    .pdv-panel-body { padding: 32px 36px 36px; }
    .pdv-topbar { padding: 26px 28px 12px; max-width: 1280px; margin: 0 auto; }
    .pdv-side-sticky { position: sticky; top: 24px; }
    .pdv-blob { width: 720px; height: 720px; }
  }

  @media (min-width: 1280px) {
    .pdv-hero-amount { font-size: 64px; }
  }

  /* Reduce motion */
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
`;

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function PublicDocumentView() {
    const { docType, token } = useParams();
    const [doc, setDoc] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        axios.get(`${API_BASE}/public/${docType}/${token}`)
            .then((r) => setDoc(r.data.document))
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, [docType, token]);

    useEffect(() => {
        if (doc) {
            const t = setTimeout(() => setMounted(true), 60);
            return () => clearTimeout(t);
        }
    }, [doc]);

    // Lock body scroll when drawer is open (mobile UX)
    useEffect(() => {
        if (detailsOpen) {
            const prev = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            return () => { document.body.style.overflow = prev; };
        }
    }, [detailsOpen]);

    const handleDownload = async () => {
        if (downloading) return;
        setDownloading(true);
        try {
            const res = await fetch(`${API_BASE}/public/${docType}/${token}/pdf`);
            if (!res.ok) throw new Error('Failed to fetch PDF');
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const label = docType === 'invoice' ? 'Invoice' : 'Quotation';
            a.download = `${label}-${doc?.number || token}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Download failed:', err);
            window.open(`${API_BASE}/public/${docType}/${token}/pdf`, '_blank');
        } finally {
            setDownloading(false);
        }
    };

    const handleCopy = () => {
        if (!doc?.number) return;
        navigator.clipboard.writeText(doc.number).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
        });
    };

    /* ── LOADING ── */
    if (loading) {
        return (
            <div className="pdv" style={S.stateWrap}>
                <style>{GLOBAL_CSS}</style>
                <div style={{ position: 'relative', width: 84, height: 84 }}>
                    <div style={{
                        position: 'absolute', inset: 0, borderRadius: 24,
                        background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.15))',
                        animation: 'pdv-pulse 1.6s ease-in-out infinite',
                    }} />
                    <div style={{
                        position: 'absolute', inset: 0, borderRadius: 24,
                        border: '3px solid transparent',
                        borderTopColor: '#6366f1', borderRightColor: '#8b5cf6',
                        animation: 'pdv-spin 1s linear infinite',
                    }} />
                    <Receipt size={32} color="#6366f1" strokeWidth={2.2}
                        style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 4, letterSpacing: '-0.01em' }}>
                        Preparing your document
                    </div>
                    <div style={{ fontSize: 13, color: '#94a3b8' }}>Just a moment…</div>
                </div>
            </div>
        );
    }

    /* ── ERROR ── */
    if (error || !doc) {
        return (
            <div className="pdv" style={{ ...S.stateWrap, padding: 24 }}>
                <style>{GLOBAL_CSS}</style>
                <div style={{
                    width: 92, height: 92, borderRadius: 30,
                    background: 'linear-gradient(135deg, #fef2f2, #fee2e2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid #fecaca',
                    boxShadow: '0 20px 48px -12px rgba(239,68,68,0.3)',
                    animation: 'pdv-pop .5s cubic-bezier(.16,1,.3,1)',
                }}>
                    <AlertCircle size={40} color="#dc2626" strokeWidth={2} />
                </div>
                <div style={{ textAlign: 'center', maxWidth: 400, padding: '0 12px' }}>
                    <h2 style={{ marginBottom: 10, fontSize: 22, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                        Link Invalid or Expired
                    </h2>
                    <p style={{ fontSize: 14, lineHeight: 1.65, color: '#64748b' }}>
                        This document link is either invalid or has expired. Please contact the sender for a fresh link.
                    </p>
                </div>
            </div>
        );
    }

    const initials = (doc.businessName || 'B').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
    const clientInitials = (doc.client?.name || 'C').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
    const statusCfg = getStatusConfig(doc.status);
    const StatusIcon = statusCfg.icon;
    const itemsCount = (doc.items || []).length;

    return (
        <div className="pdv pdv-mesh-bg pdv-noise" style={S.root}>
            <style>{GLOBAL_CSS}</style>

            {/* Floating animated mesh blobs */}
            <div style={S.meshLayer} aria-hidden>
                <div className="pdv-blob" style={{ ...S.blob, top: '5%', left: '8%', background: 'radial-gradient(circle, rgba(99,102,241,0.4), transparent 70%)', animation: 'pdv-meshMove 18s ease-in-out infinite' }} />
                <div className="pdv-blob" style={{ ...S.blob, top: '45%', right: '5%', background: 'radial-gradient(circle, rgba(139,92,246,0.35), transparent 70%)', animation: 'pdv-meshMove 22s ease-in-out infinite reverse' }} />
                <div className="pdv-blob" style={{ ...S.blob, bottom: '5%', left: '35%', background: 'radial-gradient(circle, rgba(56,189,248,0.28), transparent 70%)', animation: 'pdv-meshMove 26s ease-in-out infinite' }} />
            </div>

            {/* ═══════════ TOP BAR ═══════════ */}
            <header className="pdv-topbar" style={S.topbar}>
                <div style={S.brandWrap}>
                    <div style={S.brandLogoBox}>
                        <img src={LOGO_URL} alt="Goodsynk" style={S.brandLogoImg} />
                    </div>
                    <div>
                        <div style={S.brandTitle}>Goodsynk</div>
                        <div style={S.brandTag}>INVOICES</div>
                    </div>
                </div>
                <div style={S.topRight}>
                    <div style={S.securePill}>
                        <Lock size={11} color="#059669" strokeWidth={2.6} />
                        <span>Encrypted</span>
                    </div>
                </div>
            </header>

            {/* ═══════════ MAIN ═══════════ */}
            <main className="pdv-main" style={S.main}>
                {/* Eyebrow badge */}
                <div style={S.eyebrowWrap}>
                    <div style={S.eyebrow}>
                        <span style={S.eyebrowDot} />
                        <span style={{ textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 800, fontSize: 10.5, color: '#4f46e5' }}>
                            {doc.docLabel} · {doc.status || 'Ready'}
                        </span>
                    </div>
                </div>

                {/* ══ Split Layout ══ */}
                <div className="pdv-split" style={S.split}>

                    {/* ── LEFT: Primary Panel ── */}
                    <section style={{
                        ...S.primaryPanel,
                        opacity: mounted ? 1 : 0,
                        transform: mounted ? 'translateY(0)' : 'translateY(20px)',
                        transition: 'opacity .7s ease, transform .7s cubic-bezier(.16,1,.3,1)',
                    }}>
                        {/* Hero header */}
                        <div className="pdv-hero" style={S.heroHeader}>
                            <div style={S.heroGlow1} />
                            <div style={S.heroGlow2} />
                            <div style={S.heroGrid} />

                            <div className="pdv-hero-content" style={S.heroContent}>
                                <div style={S.heroAvatar}>
                                    {doc.businessLogo
                                        ? <img src={doc.businessLogo} alt={doc.businessName}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        : <span style={S.heroAvatarText}>{initials}</span>}
                                </div>
                                <div style={{ flex: 1, minWidth: 0, width: '100%' }}>
                                    <div style={S.heroFrom}>
                                        <Building2 size={10} strokeWidth={2.8} />
                                        <span>FROM</span>
                                    </div>
                                    <div style={S.heroBizName}>{doc.businessName}</div>
                                </div>
                                <div className="pdv-hero-status" style={{ ...S.heroStatus, background: statusCfg.grad }}>
                                    <StatusIcon size={13} strokeWidth={2.6} color="#fff" />
                                    <span style={{ color: '#fff' }}>{statusCfg.label}</span>
                                </div>
                            </div>

                            {/* Amount hero */}
                            <div style={S.heroAmountWrap}>
                                <div style={S.heroAmountLabel}>AMOUNT DUE</div>
                                <div className="pdv-hero-amount" style={S.heroAmount}>
                                    {fmtCurrency(doc.total, doc.currency)}
                                </div>
                                <div style={S.heroMetaRow}>
                                    <span style={S.heroMetaChip}>
                                        <Calendar size={11} strokeWidth={2.4} /> {fmtDate(doc.date)}
                                    </span>
                                    <span style={S.heroMetaChip}>
                                        <Package size={11} strokeWidth={2.4} /> {itemsCount} item{itemsCount !== 1 ? 's' : ''}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="pdv-panel-body" style={S.panelBody}>
                            {/* Greeting */}
                            <div style={S.greetingCard}>
                                <div style={S.greetingAvatar}>{clientInitials}</div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={S.greetingLine}>
                                        Hi <strong style={{ color: '#4f46e5' }}>{doc.client?.name || 'there'}</strong>,
                                    </div>
                                    <div style={S.greetingSub}>
                                        Your {doc.docLabel.toLowerCase()} from {doc.businessName} is ready.
                                    </div>
                                </div>
                            </div>

                            {/* Info tiles */}
                            <div className="pdv-tile-grid" style={S.tileGrid}>
                                <InfoTile
                                    icon={<Hash size={16} strokeWidth={2.3} />}
                                    tint="#6366f1"
                                    label={`${doc.docLabel} Number`}
                                    value={
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                            <span className="pdv-mono" style={{ fontSize: 12.5 }}>{doc.number}</span>
                                            <button onClick={handleCopy} style={S.tileCopy} title="Copy">
                                                {copied
                                                    ? <Check size={11} strokeWidth={3.2} color="#10b981" />
                                                    : <Copy size={11} strokeWidth={2.4} />}
                                            </button>
                                        </span>
                                    }
                                />
                                <InfoTile
                                    icon={<Calendar size={16} strokeWidth={2.3} />}
                                    tint="#8b5cf6"
                                    label="Issue Date"
                                    value={fmtDate(doc.date)}
                                />
                                {doc.dueDate && (
                                    <InfoTile
                                        icon={<Clock size={16} strokeWidth={2.3} />}
                                        tint="#f59e0b"
                                        label="Due Date"
                                        value={fmtDate(doc.dueDate)}
                                    />
                                )}
                                <InfoTile
                                    icon={<Wallet size={16} strokeWidth={2.3} />}
                                    tint="#10b981"
                                    label="Currency"
                                    value={doc.currency || 'INR'}
                                />
                            </div>

                            {/* Actions */}
                            <div className="pdv-actions" style={S.actionRow}>
                                <button onClick={() => setDetailsOpen(true)} className="pdv-btn pdv-btn-sec" style={S.btnSecondary}>
                                    <Receipt size={16} strokeWidth={2.4} />
                                    <span>View Line Items</span>
                                    <ChevronRight size={15} strokeWidth={2.6} />
                                </button>
                                <button
                                    onClick={handleDownload}
                                    disabled={downloading}
                                    className="pdv-btn pdv-btn-pri"
                                    style={{ ...S.btnPrimary, opacity: downloading ? 0.9 : 1, cursor: downloading ? 'wait' : 'pointer' }}
                                >
                                    {downloading
                                        ? <Loader2 size={17} style={{ animation: 'pdv-spin .9s linear infinite' }} />
                                        : <Download size={17} strokeWidth={2.6} />}
                                    <span>{downloading ? 'Preparing…' : `Download ${doc.docLabel}`}</span>
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* ── RIGHT: Side Rail ── */}
                    <aside className="pdv-side-sticky" style={S.sideRail}>

                        {/* Trust card */}
                        <div className="pdv-lift" style={S.railCard}>
                            <div style={S.railCardHead}>
                                <div style={{ ...S.railIcon, background: 'linear-gradient(135deg,#ecfdf5,#d1fae5)', color: '#059669' }}>
                                    <BadgeCheck size={17} strokeWidth={2.4} />
                                </div>
                                <div>
                                    <div style={S.railTitle}>Verified</div>
                                    <div style={S.railSub}>Secure document</div>
                                </div>
                            </div>
                            <p style={S.railText}>
                                Issued by <strong style={{ color: '#0f172a' }}>{doc.businessName}</strong> and digitally protected end-to-end.
                            </p>
                            <div style={S.railFeatures}>
                                <RailFeature icon={<Lock size={11} strokeWidth={2.6} />} text="256-bit encryption" />
                                <RailFeature icon={<Shield size={11} strokeWidth={2.6} />} text="Tamper-proof" />
                                <RailFeature icon={<Zap size={11} strokeWidth={2.6} />} text="Instant access" />
                            </div>
                        </div>

                        {/* Summary card */}
                        <div className="pdv-lift" style={S.railCard}>
                            <div style={S.railCardHead}>
                                <div style={{ ...S.railIcon, background: 'linear-gradient(135deg,#eef2ff,#e0e7ff)', color: '#4f46e5' }}>
                                    <TrendingUp size={17} strokeWidth={2.4} />
                                </div>
                                <div>
                                    <div style={S.railTitle}>Summary</div>
                                    <div style={S.railSub}>Financial breakdown</div>
                                </div>
                            </div>
                            <div style={S.summaryList}>
                                <SummaryRow label="Subtotal" value={fmtCurrency(doc.subtotal, doc.currency)} />
                                <SummaryRow label="Tax" value={fmtCurrency(doc.taxTotal, doc.currency)} />
                                <div style={S.summaryDivider} />
                                <div style={S.summaryGrand}>
                                    <span style={S.summaryGrandLabel}>Total</span>
                                    <span className="pdv-mono" style={S.summaryGrandValue}>
                                        {fmtCurrency(doc.total, doc.currency)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Mini CTA */}
                        <button onClick={handleDownload} disabled={downloading} className="pdv-btn" style={S.miniCta}>
                            <Download size={14} strokeWidth={2.5} />
                            <span>Download PDF</span>
                            <ArrowRight size={13} strokeWidth={2.6} style={{ marginLeft: 'auto', opacity: 0.6 }} />
                        </button>

                        <div style={S.railFoot}>
                            <img src={LOGO_URL} alt="" style={{ width: 14, height: 14, objectFit: 'contain', opacity: 0.7 }} />
                            <span>Powered by <strong style={{ color: '#4f46e5' }}>Goodsynk</strong></span>
                        </div>
                    </aside>
                </div>
            </main>

            {/* ═══════════ DETAILS DRAWER ═══════════ */}
            {detailsOpen && (
                <>
                    <div onClick={() => setDetailsOpen(false)} style={S.backdrop} />
                    <div className="pdv-drawer pdv-scroll" style={S.drawer}>
                        {/* Drawer top gradient strip */}
                        <div style={S.drawerStrip} />

                        {/* Header */}
                        <div className="pdv-drawer-head" style={S.drawerHead}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
                                <button onClick={() => setDetailsOpen(false)} className="pdv-btn" style={S.drawerClose} aria-label="Close">
                                    <X size={16} strokeWidth={2.6} />
                                </button>
                                <div style={{ minWidth: 0 }}>
                                    <div style={S.drawerTitle}>{doc.docLabel} Details</div>
                                    <div style={S.drawerSub} className="pdv-mono">#{doc.number}</div>
                                </div>
                            </div>
                            <button
                                onClick={handleDownload}
                                disabled={downloading}
                                className="pdv-btn"
                                style={{ ...S.drawerBtn, opacity: downloading ? 0.85 : 1, cursor: downloading ? 'wait' : 'pointer' }}
                            >
                                {downloading
                                    ? <Loader2 size={13} style={{ animation: 'pdv-spin .9s linear infinite' }} />
                                    : <Download size={13} strokeWidth={2.5} />}
                                <span>{downloading ? '…' : 'PDF'}</span>
                            </button>
                        </div>

                        {/* Body */}
                        <div className="pdv-scroll pdv-drawer-body" style={S.drawerBody}>

                            {/* Client card */}
                            <div style={S.clientCard}>
                                <div style={S.clientAvatar}>{clientInitials}</div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={S.clientLabel}>BILLED TO</div>
                                    <div style={S.clientName}>{doc.client?.name || '—'}</div>
                                    <div style={S.clientMetaWrap}>
                                        {doc.client?.email && (
                                            <span style={S.clientChip}>
                                                <Mail size={10} strokeWidth={2.4} /> {doc.client.email}
                                            </span>
                                        )}
                                        {doc.client?.phone && (
                                            <span style={S.clientChip}>
                                                <Phone size={10} strokeWidth={2.4} /> {doc.client.phone}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Meta grid */}
                            <div className="pdv-meta-grid" style={S.metaGrid}>
                                <MetaTile icon={<FileText size={13} strokeWidth={2.4} />} label={`${doc.docLabel} Date`} value={fmtDate(doc.date)} />
                                {doc.dueDate && <MetaTile icon={<Clock size={13} strokeWidth={2.4} />} label="Due Date" value={fmtDate(doc.dueDate)} />}
                                <MetaTile
                                    icon={<StatusIcon size={13} strokeWidth={2.4} />}
                                    label="Status"
                                    value={<span style={{ color: statusCfg.color, textTransform: 'capitalize' }}>{statusCfg.label}</span>}
                                />
                                <MetaTile icon={<Wallet size={13} strokeWidth={2.4} />} label="Currency" value={doc.currency || 'INR'} />
                            </div>

                            {/* Items */}
                            <div style={{ marginBottom: 20 }}>
                                <div style={S.sectionHead}>
                                    <Package size={14} strokeWidth={2.4} />
                                    <span>Line Items</span>
                                    <span style={S.sectionCount}>{itemsCount}</span>
                                </div>
                                <div className="pdv-scroll" style={S.tableWrap}>
                                    <table style={S.table}>
                                        <thead>
                                            <tr>
                                                <th style={{ ...S.th, textAlign: 'left', width: '38%' }}>ITEM</th>
                                                <th style={{ ...S.th, textAlign: 'center' }}>QTY</th>
                                                <th style={{ ...S.th, textAlign: 'right' }}>UNIT</th>
                                                <th style={{ ...S.th, textAlign: 'right' }}>NET (TAX)</th>
                                                <th style={{ ...S.th, textAlign: 'right' }}>TOTAL</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(doc.items || []).map((item, i) => {
                                                const taxAmt = (item.cgstAmount || 0) + (item.sgstAmount || 0) + (item.igstAmount || 0) + (item.vatAmount || 0);
                                                const taxRate = (item.cgstRate || 0) + (item.sgstRate || 0) + (item.igstRate || 0) + (item.vatRate || 0);
                                                const netAmt = item.taxableAmount || (item.price * item.quantity);
                                                return (
                                                    <tr key={i} className="pdv-row" style={S.tr}>
                                                        <td style={{ ...S.td, fontWeight: 700, color: '#0f172a' }}>{item.name}</td>
                                                        <td style={{ ...S.td, textAlign: 'center', color: '#475569' }}>{item.quantity}</td>
                                                        <td style={{ ...S.td, textAlign: 'right', color: '#475569' }} className="pdv-mono">{fmtAmt(item.price)}</td>
                                                        <td style={{ ...S.td, textAlign: 'right', color: '#475569' }}>
                                                            <div className="pdv-mono">{fmtAmt(netAmt)}</div>
                                                            {taxAmt > 0 && (
                                                                <div style={S.taxChip}>+{fmtAmt(taxAmt)} · {taxRate}%</div>
                                                            )}
                                                        </td>
                                                        <td style={{ ...S.td, textAlign: 'right', fontWeight: 800, color: '#0f172a' }} className="pdv-mono">
                                                            {fmtAmt(item.total)}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Totals */}
                            <div style={S.totalsBox}>
                                <div style={S.totalsBoxGlow} />
                                <div style={S.totalRow}>
                                    <span style={S.totalLabel}>Subtotal</span>
                                    <span className="pdv-mono" style={S.totalValue}>{fmtCurrency(doc.subtotal, doc.currency)}</span>
                                </div>
                                <div style={S.totalRow}>
                                    <span style={S.totalLabel}>Tax</span>
                                    <span className="pdv-mono" style={S.totalValue}>{fmtCurrency(doc.taxTotal, doc.currency)}</span>
                                </div>
                                <div style={S.totalsDivider} />
                                <div style={S.totalsGrand}>
                                    <span style={S.totalsGrandLabel}>Total Amount</span>
                                    <span className="pdv-mono" style={S.totalsGrandValue}>{fmtCurrency(doc.total, doc.currency)}</span>
                                </div>
                            </div>

                            {/* Fine print */}
                            <div style={S.finePrint}>
                                <Shield size={11} strokeWidth={2.4} />
                                <span>Computer-generated document. No signature required.</span>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════════ */
function InfoTile({ icon, tint, label, value }) {
    return (
        <div className="pdv-lift" style={S.tile}>
            <div style={{ ...S.tileIcon, background: `${tint}14`, color: tint }}>{icon}</div>
            <div style={{ minWidth: 0, flex: 1 }}>
                <div style={S.tileLabel}>{label}</div>
                <div style={S.tileValue}>{value}</div>
            </div>
        </div>
    );
}

function RailFeature({ icon, text }) {
    return (
        <div style={S.railFeature}>
            <span style={S.railFeatureDot}>{icon}</span>
            <span>{text}</span>
        </div>
    );
}

function SummaryRow({ label, value }) {
    return (
        <div style={S.summaryRow}>
            <span style={S.summaryLabel}>{label}</span>
            <span className="pdv-mono" style={S.summaryValue}>{value}</span>
        </div>
    );
}

function MetaTile({ icon, label, value }) {
    return (
        <div style={S.metaTile}>
            <div style={S.metaTileHead}>
                {icon}
                <span style={S.metaTileLabel}>{label}</span>
            </div>
            <div style={S.metaTileValue}>{value}</div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════
   STYLES
   ═══════════════════════════════════════════════════════════════ */
const S = {
    root: { minHeight: '100vh', position: 'relative', overflow: 'hidden' },
    meshLayer: { position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' },
    blob: { position: 'absolute', borderRadius: '50%', filter: 'blur(80px)', opacity: 0.55 },

    /* ── Topbar ── */
    topbar: {
        position: 'relative', zIndex: 5,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    },
    brandWrap: { display: 'flex', alignItems: 'center', gap: 11 },
    brandLogoBox: {
        width: 42, height: 42, borderRadius: 12,
        background: '#ffffff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 10px 26px -6px rgba(99,102,241,0.35), 0 2px 6px -1px rgba(15,23,42,0.08), inset 0 0 0 1px rgba(226,232,240,0.9)',
        overflow: 'hidden', flexShrink: 0,
    },
    brandLogoImg: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
    brandTitle: { fontSize: 14.5, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1.05 },
    brandTag: { fontSize: 9, fontWeight: 800, color: '#6366f1', letterSpacing: '0.18em', marginTop: 3 },
    topRight: { display: 'flex', alignItems: 'center', gap: 8 },
    securePill: {
        display: 'inline-flex', alignItems: 'center', gap: 5,
        background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        color: '#059669', fontSize: 11, fontWeight: 700,
        padding: '7px 12px', borderRadius: 20,
        border: '1px solid rgba(16,185,129,0.28)',
        boxShadow: '0 4px 12px -3px rgba(16,185,129,0.2)',
        letterSpacing: '0.02em',
    },

    /* ── Main ── */
    main: { position: 'relative', zIndex: 3 },
    eyebrowWrap: { display: 'flex', justifyContent: 'center', marginBottom: 16, marginTop: 4 },
    eyebrow: {
        display: 'inline-flex', alignItems: 'center', gap: 8,
        background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid rgba(255,255,255,0.95)',
        padding: '7px 14px', borderRadius: 22,
        boxShadow: '0 8px 24px -8px rgba(15,23,42,0.12)',
    },
    eyebrowDot: {
        width: 7, height: 7, borderRadius: '50%',
        background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
        boxShadow: '0 0 0 3px rgba(99,102,241,0.2)',
        animation: 'pdv-pulse 2s ease-in-out infinite',
        flexShrink: 0,
    },

    split: { alignItems: 'start' },

    /* ── Primary Panel ── */
    primaryPanel: {
        background: '#ffffff',
        borderRadius: 24,
        overflow: 'hidden',
        border: '1px solid rgba(226,232,240,0.7)',
        boxShadow: '0 40px 80px -32px rgba(15,23,42,0.22), 0 16px 40px -20px rgba(99,102,241,0.15)',
    },
    heroHeader: {
        position: 'relative',
        background: 'linear-gradient(140deg, #1e1b4b 0%, #312e81 45%, #4338ca 100%)',
        overflow: 'hidden',
    },
    heroGlow1: {
        position: 'absolute', top: -100, right: -80, width: 340, height: 340,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(168,85,247,0.6), transparent 62%)',
        filter: 'blur(24px)',
        pointerEvents: 'none',
    },
    heroGlow2: {
        position: 'absolute', bottom: -130, left: -60, width: 300, height: 300,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(56,189,248,0.5), transparent 62%)',
        filter: 'blur(24px)',
        pointerEvents: 'none',
    },
    heroGrid: {
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        maskImage: 'radial-gradient(ellipse at top right, black 30%, transparent 70%)',
        WebkitMaskImage: 'radial-gradient(ellipse at top right, black 30%, transparent 70%)',
        pointerEvents: 'none',
    },
    heroContent: {
        position: 'relative', display: 'flex', gap: 16, marginBottom: 24,
    },
    heroAvatar: {
        width: 58, height: 58, borderRadius: 18,
        background: '#ffffff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', flexShrink: 0,
        boxShadow: '0 12px 32px -8px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.5)',
    },
    heroAvatarText: { fontSize: 20, fontWeight: 800, color: '#1e1b4b', letterSpacing: '-0.03em' },
    heroFrom: {
        display: 'inline-flex', alignItems: 'center', gap: 5,
        fontSize: 9.5, fontWeight: 800, letterSpacing: '0.16em',
        color: 'rgba(255,255,255,0.6)', marginBottom: 5,
    },
    heroBizName: {
        fontSize: 18, fontWeight: 800, color: '#ffffff',
        letterSpacing: '-0.02em', lineHeight: 1.15,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
    },
    heroStatus: {
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '6px 12px', borderRadius: 20,
        fontSize: 11, fontWeight: 800, flexShrink: 0,
        letterSpacing: '0.03em',
        boxShadow: '0 8px 20px -6px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.25)',
    },
    heroAmountWrap: { position: 'relative', textAlign: 'center' },
    heroAmountLabel: {
        fontSize: 10, fontWeight: 800, letterSpacing: '0.2em',
        color: 'rgba(255,255,255,0.55)', marginBottom: 10,
    },
    heroAmount: {
        fontWeight: 900, letterSpacing: '-0.035em', lineHeight: 1.05,
        color: '#ffffff',
        textShadow: '0 8px 32px rgba(139,92,246,0.45), 0 4px 12px rgba(0,0,0,0.3)',
    },
    heroMetaRow: { display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16, flexWrap: 'wrap' },
    heroMetaChip: {
        display: 'inline-flex', alignItems: 'center', gap: 5,
        fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.85)',
        background: 'rgba(255,255,255,0.12)',
        border: '1px solid rgba(255,255,255,0.18)',
        padding: '6px 11px', borderRadius: 20,
        backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
    },

    /* ── Panel body ── */
    panelBody: {},

    greetingCard: {
        display: 'flex', alignItems: 'center', gap: 13,
        padding: '14px 16px',
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        borderRadius: 16, marginBottom: 20,
        border: '1px solid #eef2f7',
    },
    greetingAvatar: {
        width: 44, height: 44, borderRadius: 13,
        background: 'linear-gradient(135deg, #4f46e5, #8b5cf6)',
        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14, fontWeight: 800, flexShrink: 0,
        boxShadow: '0 8px 22px -6px rgba(79,70,229,0.5)',
        letterSpacing: '-0.02em',
    },
    greetingLine: { fontSize: 15, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.01em', lineHeight: 1.3 },
    greetingSub: { fontSize: 12.5, color: '#64748b', marginTop: 4, lineHeight: 1.5 },

    tileGrid: { display: 'grid', gap: 10, marginBottom: 22 },
    tile: {
        display: 'flex', alignItems: 'center', gap: 11,
        padding: '13px 14px',
        background: '#ffffff',
        borderRadius: 14,
        border: '1px solid #eef2f7',
        boxShadow: '0 2px 8px -2px rgba(15,23,42,0.04)',
    },
    tileIcon: {
        width: 36, height: 36, borderRadius: 11,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
    },
    tileLabel: {
        fontSize: 9.5, fontWeight: 800, color: '#94a3b8',
        letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4,
    },
    tileValue: {
        fontSize: 13, fontWeight: 700, color: '#0f172a',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
    },
    tileCopy: {
        background: 'rgba(99,102,241,0.1)', border: 'none', borderRadius: 6,
        padding: 4, cursor: 'pointer', color: '#6366f1',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all .2s ease',
    },

    actionRow: { display: 'flex', gap: 10 },
    btnSecondary: {
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        background: '#ffffff', color: '#334155',
        border: '1.5px solid #e2e8f0',
        borderRadius: 13, padding: '14px 18px',
        fontSize: 13, fontWeight: 700, cursor: 'pointer',
        letterSpacing: '0.01em',
        boxShadow: '0 2px 8px -2px rgba(15,23,42,0.06)',
    },
    btnPrimary: {
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9,
        background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 45%, #8b5cf6 100%)',
        backgroundSize: '200% 200%',
        color: '#fff', border: 'none',
        borderRadius: 13, padding: '14px 20px',
        fontSize: 13, fontWeight: 800, cursor: 'pointer',
        letterSpacing: '0.015em',
        boxShadow: '0 14px 34px -10px rgba(79,70,229,0.7), 0 6px 16px -6px rgba(79,70,229,0.4), inset 0 1px 0 rgba(255,255,255,0.25)',
    },

    /* ── Side Rail ── */
    sideRail: {
        display: 'flex', flexDirection: 'column', gap: 12,
    },
    railCard: {
        background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderRadius: 20,
        padding: '18px 18px 16px',
        border: '1px solid rgba(255,255,255,0.9)',
        boxShadow: '0 12px 40px -12px rgba(15,23,42,0.12), 0 2px 8px -2px rgba(15,23,42,0.04)',
    },
    railCardHead: { display: 'flex', alignItems: 'center', gap: 11, marginBottom: 12 },
    railIcon: {
        width: 36, height: 36, borderRadius: 11,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
    },
    railTitle: { fontSize: 13, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em', lineHeight: 1.2 },
    railSub: { fontSize: 10.5, color: '#94a3b8', fontWeight: 600, marginTop: 2 },
    railText: { fontSize: 12, lineHeight: 1.6, color: '#64748b', marginBottom: 12 },
    railFeatures: { display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 12, borderTop: '1px dashed #e2e8f0' },
    railFeature: {
        display: 'flex', alignItems: 'center', gap: 9,
        fontSize: 11.5, fontWeight: 600, color: '#475569',
    },
    railFeatureDot: {
        width: 22, height: 22, borderRadius: 7,
        background: 'rgba(16,185,129,0.1)', color: '#059669',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
    },

    summaryList: { display: 'flex', flexDirection: 'column', gap: 10 },
    summaryRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    summaryLabel: { fontSize: 12, color: '#64748b', fontWeight: 500 },
    summaryValue: { fontSize: 12, color: '#0f172a', fontWeight: 700 },
    summaryDivider: { height: 1, background: 'linear-gradient(90deg, transparent, #e2e8f0, transparent)' },
    summaryGrand: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 2 },
    summaryGrandLabel: { fontSize: 11.5, color: '#4f46e5', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase' },
    summaryGrandValue: {
        fontSize: 16, fontWeight: 900, letterSpacing: '-0.02em',
        background: 'linear-gradient(135deg, #1e1b4b, #4f46e5 60%, #8b5cf6)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
    },

    miniCta: {
        display: 'flex', alignItems: 'center', gap: 8,
        width: '100%', padding: '13px 16px',
        background: '#0f172a', color: '#fff',
        border: 'none', borderRadius: 13,
        fontSize: 13, fontWeight: 700, cursor: 'pointer',
        letterSpacing: '0.01em',
        boxShadow: '0 10px 24px -8px rgba(15,23,42,0.5)',
    },
    railFoot: {
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        fontSize: 11, color: '#94a3b8', fontWeight: 500, paddingTop: 4,
    },

    /* ── Drawer ── */
    backdrop: {
        position: 'fixed', inset: 0, zIndex: 999,
        background: 'rgba(15,23,42,0.6)',
        backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
        animation: 'pdv-fadeIn .3s ease',
    },
    drawer: {
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: '100%',
        background: '#ffffff', zIndex: 1000,
        display: 'flex', flexDirection: 'column',
        boxShadow: '-32px 0 100px -24px rgba(15,23,42,0.45)',
        overflow: 'hidden',
    },
    drawerStrip: {
        height: 4, flexShrink: 0,
        background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899, #6366f1)',
        backgroundSize: '300% 100%',
        animation: 'pdv-gradientShift 6s ease infinite',
    },
    drawerHead: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 10,
        borderBottom: '1px solid #f1f5f9',
        flexShrink: 0,
        background: 'linear-gradient(180deg, #fafbff, #ffffff)',
    },
    drawerClose: {
        background: '#f1f5f9', border: '1px solid #e2e8f0',
        borderRadius: 10, cursor: 'pointer', color: '#64748b',
        padding: 8, display: 'flex', flexShrink: 0,
    },
    drawerTitle: {
        fontWeight: 800, fontSize: 14.5, color: '#0f172a',
        letterSpacing: '-0.015em', lineHeight: 1.15,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
    },
    drawerSub: { fontSize: 11, color: '#94a3b8', marginTop: 3, fontWeight: 600 },
    drawerBtn: {
        background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
        color: '#fff', border: 'none', borderRadius: 11,
        padding: '10px 14px', fontSize: 12.5, fontWeight: 800,
        display: 'flex', alignItems: 'center', gap: 6,
        boxShadow: '0 8px 22px -6px rgba(79,70,229,0.55)',
        cursor: 'pointer', letterSpacing: '0.02em',
        flexShrink: 0,
    },
    drawerBody: { flex: 1, overflowY: 'auto' },

    clientCard: {
        display: 'flex', alignItems: 'flex-start', gap: 13,
        padding: '16px 16px',
        background: 'linear-gradient(135deg, #f8fafc 0%, #eef2f7 100%)',
        borderRadius: 16, marginBottom: 16,
        border: '1px solid #e2e8f0',
    },
    clientAvatar: {
        width: 48, height: 48, borderRadius: 14,
        background: 'linear-gradient(135deg, #4f46e5 0%, #8b5cf6 100%)',
        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 15, fontWeight: 800, flexShrink: 0,
        boxShadow: '0 10px 26px -8px rgba(79,70,229,0.55)',
        letterSpacing: '-0.02em',
    },
    clientLabel: {
        fontSize: 9.5, fontWeight: 800, color: '#94a3b8',
        letterSpacing: '0.14em', marginBottom: 5,
    },
    clientName: { fontSize: 15, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.015em', marginBottom: 8 },
    clientMetaWrap: { display: 'flex', flexWrap: 'wrap', gap: 6 },
    clientChip: {
        display: 'inline-flex', alignItems: 'center', gap: 5,
        fontSize: 10.5, color: '#475569', fontWeight: 600,
        background: 'rgba(255,255,255,0.95)',
        border: '1px solid #e2e8f0',
        padding: '4px 8px', borderRadius: 8,
        wordBreak: 'break-all',
    },

    metaGrid: { display: 'grid', gap: 10, marginBottom: 20 },
    metaTile: {
        padding: '12px 13px', background: '#fafbfc',
        borderRadius: 13, border: '1px solid #f1f5f9',
    },
    metaTileHead: {
        display: 'flex', alignItems: 'center', gap: 6,
        fontSize: 9.5, fontWeight: 800, color: '#94a3b8',
        letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6,
    },
    metaTileLabel: { fontSize: 9.5 },
    metaTileValue: { fontSize: 13, fontWeight: 700, color: '#0f172a' },

    sectionHead: {
        display: 'flex', alignItems: 'center', gap: 8,
        fontSize: 13, fontWeight: 800, color: '#0f172a',
        letterSpacing: '-0.005em', marginBottom: 11,
    },
    sectionCount: {
        marginLeft: 'auto',
        fontSize: 10.5, fontWeight: 800, color: '#4f46e5',
        background: 'rgba(99,102,241,0.1)',
        padding: '3px 9px', borderRadius: 20,
        letterSpacing: '0.04em',
    },
    tableWrap: {
        overflowX: 'auto', borderRadius: 14,
        border: '1px solid #e2e8f0',
        background: '#fff',
        boxShadow: '0 4px 16px -8px rgba(15,23,42,0.08)',
    },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 520 },
    th: {
        padding: '11px 10px', fontWeight: 800, color: '#64748b',
        fontSize: 9.5, letterSpacing: '0.1em',
        background: '#fafbfc', borderBottom: '1px solid #e2e8f0',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
    },
    tr: { borderBottom: '1px solid #f1f5f9' },
    td: { padding: '13px 10px', fontSize: 12 },
    taxChip: {
        fontSize: 10, color: '#8b5cf6', marginTop: 3,
        fontWeight: 700, letterSpacing: '0.01em',
    },

    totalsBox: {
        position: 'relative',
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        borderRadius: 16, padding: '18px 18px',
        border: '1px solid #e2e8f0',
        display: 'flex', flexDirection: 'column', gap: 10,
        overflow: 'hidden', marginBottom: 14,
    },
    totalsBoxGlow: {
        position: 'absolute', top: -60, right: -60, width: 180, height: 180,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.22), transparent 70%)',
        filter: 'blur(12px)',
        pointerEvents: 'none',
    },
    totalRow: { position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    totalLabel: { fontSize: 12.5, color: '#64748b', fontWeight: 500 },
    totalValue: { fontSize: 12.5, color: '#0f172a', fontWeight: 700 },
    totalsDivider: {
        position: 'relative', height: 1,
        background: 'linear-gradient(90deg, transparent, #cbd5e1, transparent)',
    },
    totalsGrand: { position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 2 },
    totalsGrandLabel: { fontSize: 12.5, fontWeight: 800, color: '#0f172a' },
    totalsGrandValue: {
        fontSize: 20, fontWeight: 900, letterSpacing: '-0.025em',
        background: 'linear-gradient(135deg, #1e1b4b, #4f46e5 60%, #8b5cf6)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
    },

    finePrint: {
        display: 'flex', alignItems: 'center', gap: 8,
        fontSize: 10.5, color: '#94a3b8',
        padding: '10px 12px',
        background: '#fafbfc', borderRadius: 11,
        border: '1px dashed #e2e8f0',
        fontWeight: 500,
    },

    stateWrap: {
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 22,
        background: 'linear-gradient(135deg, #fafbff 0%, #f4f6fb 50%, #eef2ff 100%)',
    },
};
