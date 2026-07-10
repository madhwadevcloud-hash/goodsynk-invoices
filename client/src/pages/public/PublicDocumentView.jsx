import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Download, ChevronRight, X, AlertCircle } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL; // e.g. http://localhost:5000/api

const fmtCurrency = (n, currency = 'INR') =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 2 }).format(n || 0);

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const fmtAmt = (n) => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);

export default function PublicDocumentView() {
    const { docType, token } = useParams(); // docType: 'invoice' | 'quotation'
    const [doc, setDoc] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        // Plain axios call, no auth headers/interceptors — this page is public
        axios.get(`${API_BASE}/public/${docType}/${token}`)
            .then((r) => setDoc(r.data.document))
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, [docType, token]);

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
            // Fallback: open in new tab
            window.open(`${API_BASE}/public/${docType}/${token}/pdf`, '_blank');
        } finally {
            setDownloading(false);
        }
    };

    if (loading) {
        return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading…</div>;
    }

    if (error || !doc) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: '#64748b' }}>
                <AlertCircle size={32} />
                <p>This link is invalid or has expired.</p>
            </div>
        );
    }

    const initials = (doc.businessName || 'B').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
    const clientInitials = (doc.client?.name || 'C').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

    return (
        <div style={{ minHeight: '100vh', background: '#eef0f5', fontFamily: '-apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif' }}>
            {/* Header banner — wavy SVG + avatar pinned to bottom center */}
            <div style={{ position: 'relative', width: '100%', height: 120, background: 'linear-gradient(155deg, #cdd8ed 0%, #dfe7f5 40%, #edf1f9 100%)' }}>
                <svg viewBox="0 0 1440 280" preserveAspectRatio="none"
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
                    <defs>
                        <linearGradient id="wg1" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#a8bcd8" stopOpacity="0.5" />
                            <stop offset="100%" stopColor="#d0dcf0" stopOpacity="0.2" />
                        </linearGradient>
                        <linearGradient id="wg2" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#b8cce6" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#dce8f8" stopOpacity="0.15" />
                        </linearGradient>
                    </defs>
                    <path d="M0,80 C300,200 600,20 900,100 C1150,165 1320,40 1440,80 L1440,280 L0,280 Z" fill="url(#wg1)" />
                    <path d="M0,140 C220,60 500,220 760,130 C1020,40 1260,180 1440,110 L1440,280 L0,280 Z" fill="url(#wg2)" />
                    <path d="M0,200 C160,160 400,250 640,200 C880,150 1160,230 1440,190 L1440,280 L0,280 Z" fill="rgba(235,240,252,0.35)" />
                </svg>

                {/* Avatar — absolute, bottom-center, half outside header */}
                <div style={{
                    position: 'absolute', bottom: -40, left: '50%', transform: 'translateX(-50%)',
                    width: 90, height: 90, borderRadius: '50%', background: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 8px 28px rgba(0,0,0,0.12)', overflow: 'hidden',
                    border: '4px solid #fff',
                    zIndex: 10,
                }}>
                    {doc.businessLogo
                        ? <img src={doc.businessLogo} alt={doc.businessName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span style={{ fontSize: 30, fontWeight: 800, color: '#1a1f5e' }}>{initials}</span>}
                </div>
            </div>

            {/* Content below header */}
            <div style={{ maxWidth: 540, margin: '0 auto', padding: '0 16px' }}>
                {/* Business name — spaced to clear the avatar */}
                <div style={{ textAlign: 'center', paddingTop: 50, marginBottom: 16 }}>
                    <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0f172a', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{doc.businessName}</h2>
                </div>

                {/* Summary card */}
                <div style={{ background: '#fff', borderRadius: 18, padding: '32px 36px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                    {/* Greeting */}
                    <div style={{ textAlign: 'center', marginBottom: 24 }}>
                        <div style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>
                            Hi, {doc.client?.name || 'there'}!
                        </div>
                        <div style={{ fontSize: 13.5, color: '#4A72D4', marginTop: 5, fontWeight: 500 }}>
                            Here's your {doc.docLabel} from {doc.businessName}
                        </div>
                    </div>

                    {/* Detail rows — label right-aligned, value left-aligned, centered as a block */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13.5, marginBottom: 24 }}>
                        <DetailRow label={`${doc.docLabel} #`} value={doc.number} />
                        <DetailRow label="Date" value={fmtDate(doc.date)} />
                        <DetailRow
                            label="Status"
                            value={
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#d97706', fontWeight: 600 }}>
                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                        <circle cx="7" cy="7" r="6.5" stroke="#d97706" strokeWidth="1.2" />
                                        <text x="7" y="10.5" textAnchor="middle" fontSize="8" fontWeight="700" fill="#d97706">i</text>
                                    </svg>
                                    <span style={{ textTransform: 'capitalize' }}>{doc.status}</span>
                                </span>
                            }
                        />
                    </div>

                    {/* Amount */}
                    <div style={{ textAlign: 'center', marginBottom: 28 }}>
                        <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, letterSpacing: '0.06em', marginBottom: 4 }}>Amount</div>
                        <div style={{ fontSize: 34, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>
                            {fmtCurrency(doc.total, doc.currency)}
                        </div>
                        <div style={{ fontSize: 13, color: '#64748b', marginTop: 6 }}>Thank you for your business!</div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
                        <button
                            onClick={() => setDetailsOpen(true)}
                            style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: 5, color: '#334155', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', padding: 0 }}
                        >
                            View details <ChevronRight size={15} />
                        </button>
                        <button
                            onClick={handleDownload}
                            disabled={downloading}
                            style={{ background: '#4A72D4', color: '#fff', border: 'none', borderRadius: 9, padding: '11px 20px', fontSize: 13.5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7, cursor: downloading ? 'wait' : 'pointer', letterSpacing: '0.01em', opacity: downloading ? 0.8 : 1 }}
                        >
                            <Download size={15} style={{ animation: downloading ? 'spin 1s linear infinite' : 'none' }} />
                            {downloading ? 'Preparing…' : `Download ${doc.docLabel}`}
                        </button>
                    </div>
                </div>

                <div style={{ textAlign: 'center', fontSize: 11.5, color: '#94a3b8', margin: '12px 0 12px' }}>
                    Powered by <span style={{ color: '#4A72D4' }}>Goodsynk Invoices</span>
                </div>
            </div>

            {/* Right-side details drawer */}
            {detailsOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        onClick={() => setDetailsOpen(false)}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 999 }}
                    />
                    {/* Drawer panel */}
                    <div style={{
                        position: 'fixed', top: 0, right: 0, bottom: 0,
                        width: '100%', maxWidth: 560,
                        background: '#fff', zIndex: 1000,
                        display: 'flex', flexDirection: 'column',
                        boxShadow: '-8px 0 40px rgba(0,0,0,0.18)',
                        animation: 'slideInRight 0.22s ease',
                    }}>
                        {/* Drawer header */}
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '16px 20px', borderBottom: '1px solid #e2e8f0', flexShrink: 0,
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <button
                                    onClick={() => setDetailsOpen(false)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 0, display: 'flex' }}
                                >
                                    <X size={18} />
                                </button>
                                <span style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>
                                    {doc.docLabel} #{doc.number}
                                </span>
                            </div>
                            <button
                                onClick={handleDownload}
                                disabled={downloading}
                                style={{
                                    background: '#4A72D4', color: '#fff', border: 'none', borderRadius: 8,
                                    padding: '9px 16px', fontSize: 13, fontWeight: 700,
                                    display: 'flex', alignItems: 'center', gap: 6,
                                    cursor: downloading ? 'wait' : 'pointer', opacity: downloading ? 0.8 : 1,
                                }}
                            >
                                <Download size={13} /> {downloading ? 'Preparing…' : `Download ${doc.docLabel}`}
                            </button>
                        </div>

                        {/* "Details" tab */}
                        <div style={{ padding: '0 20px', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
                            <div style={{
                                display: 'inline-block', padding: '12px 4px', fontSize: 13.5, fontWeight: 700,
                                color: '#4A72D4', borderBottom: '2.5px solid #4A72D4', marginBottom: -1,
                            }}>
                                Details
                            </div>
                        </div>

                        {/* Drawer body — scrollable */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 32px' }}>

                            {/* Client info row */}
                            <div style={{
                                display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                                padding: '14px 16px', background: '#f8fafc', borderRadius: 10, marginBottom: 16,
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{
                                        width: 38, height: 38, borderRadius: '50%', background: '#4A72D4',
                                        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 13, fontWeight: 700, flexShrink: 0,
                                    }}>
                                        {clientInitials}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{doc.client?.name || '—'}</div>
                                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>
                                            {doc.docLabel} Date&nbsp;
                                            <strong style={{ color: '#0f172a' }}>{fmtDate(doc.date)}</strong>
                                            {doc.dueDate && (
                                                <>&nbsp;&nbsp;Due Date&nbsp;<strong style={{ color: '#0f172a' }}>{fmtDate(doc.dueDate)}</strong></>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Total amount */}
                            <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 20, paddingLeft: 4 }}>
                                {fmtCurrency(doc.total, doc.currency)}
                            </div>

                            {/* Items table */}
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, minWidth: 400 }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                            <th style={{ padding: '8px 8px 8px 0', fontWeight: 600, color: '#64748b', textAlign: 'left', width: '40%' }}>Product Name</th>
                                            <th style={{ padding: '8px', fontWeight: 600, color: '#4A72D4', textAlign: 'center' }}>Quantity</th>
                                            <th style={{ padding: '8px', fontWeight: 600, color: '#4A72D4', textAlign: 'right' }}>Unit Price</th>
                                            <th style={{ padding: '8px', fontWeight: 600, color: '#4A72D4', textAlign: 'right' }}>
                                                <div>Net Amount</div>
                                                <div style={{ fontSize: 10.5, fontWeight: 500, color: '#94a3b8' }}>tax (%)</div>
                                            </th>
                                            <th style={{ padding: '8px 0 8px 8px', fontWeight: 700, color: '#0f172a', textAlign: 'right' }}>Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(doc.items || []).map((item, i) => {
                                            const taxAmt = (item.cgstAmount || 0) + (item.sgstAmount || 0) + (item.igstAmount || 0) + (item.vatAmount || 0);
                                            const taxRate = (item.cgstRate || 0) + (item.sgstRate || 0) + (item.igstRate || 0) + (item.vatRate || 0);
                                            const netAmt = item.taxableAmount || (item.price * item.quantity);
                                            return (
                                                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                    <td style={{ padding: '12px 8px 12px 0', color: '#0f172a', fontWeight: 600 }}>{item.name}</td>
                                                    <td style={{ padding: '12px 8px', textAlign: 'center', color: '#334155' }}>{item.quantity}</td>
                                                    <td style={{ padding: '12px 8px', textAlign: 'right', color: '#334155' }}>{fmtAmt(item.price)}</td>
                                                    <td style={{ padding: '12px 8px', textAlign: 'right', color: '#334155' }}>
                                                        <div>{fmtAmt(netAmt)}</div>
                                                        {taxAmt > 0 && (
                                                            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                                                                {fmtAmt(taxAmt)}({taxRate}%)
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '12px 0 12px 8px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>{fmtAmt(item.total)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Totals summary */}
                            <div style={{ marginTop: 16, borderTop: '1px solid #e2e8f0', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748b' }}>
                                    <span>Taxable Amount:</span>
                                    <span style={{ color: '#0f172a', fontWeight: 600 }}>{fmtCurrency(doc.subtotal, doc.currency)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748b' }}>
                                    <span>Tax Amount:</span>
                                    <span style={{ color: '#0f172a', fontWeight: 600 }}>{fmtCurrency(doc.taxTotal, doc.currency)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 800, color: '#0f172a', borderTop: '1px solid #e2e8f0', paddingTop: 10, marginTop: 4 }}>
                                    <span>Total Amount:</span>
                                    <span>{fmtCurrency(doc.total, doc.currency)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <style>{`
                        @keyframes slideInRight {
                            from { transform: translateX(100%); }
                            to { transform: translateX(0); }
                        }
                    `}</style>
                </>
            )}

        </div>
    );
}

function DetailRow({ label, value }) {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, alignItems: 'center' }}>
            <span style={{ textAlign: 'right', color: '#64748b', fontWeight: 500, fontSize: 13.5 }}>{label}</span>
            <span style={{ color: '#0f172a', fontWeight: 600, fontSize: 13.5 }}>{value}</span>
        </div>
    );
}

function Row({ label, value, bold }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', color: bold ? '#0f172a' : '#475569', fontWeight: bold ? 700 : 400 }}>
            <span>{label}</span>
            <span style={{ color: '#0f172a', fontWeight: 600 }}>{value}</span>
        </div>
    );
}