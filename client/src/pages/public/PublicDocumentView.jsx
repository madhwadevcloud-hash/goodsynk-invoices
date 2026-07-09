import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Download, ChevronRight, X, AlertCircle } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL; // e.g. http://localhost:5000/api

const fmtCurrency = (n, currency = 'INR') =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 2 }).format(n || 0);

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

export default function PublicDocumentView() {
    const { docType, token } = useParams(); // docType: 'invoice' | 'quotation'
    const [doc, setDoc] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [detailsOpen, setDetailsOpen] = useState(false);

    useEffect(() => {
        // Plain axios call, no auth headers/interceptors — this page is public
        axios.get(`${API_BASE}/public/${docType}/${token}`)
            .then((r) => setDoc(r.data.document))
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, [docType, token]);

    const handleDownload = () => {
        window.open(`${API_BASE}/public/${docType}/${token}/pdf`, '_blank');
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
        <div style={{ minHeight: '100vh', background: '#f4f5f7', fontFamily: '-apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif' }}>
            {/* Header banner */}
            <div style={{ background: 'linear-gradient(135deg, #e2e8f0, #f1f5f9)', height: 90, position: 'relative' }} />

            <div style={{ maxWidth: 480, margin: '-48px auto 0', padding: '0 16px' }}>
                {/* Business avatar */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 20 }}>
                    <div style={{
                        width: 88, height: 88, borderRadius: '50%', background: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.08)', overflow: 'hidden',
                    }}>
                        {doc.businessLogo
                            ? <img src={doc.businessLogo} alt={doc.businessName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <span style={{ fontSize: 26, fontWeight: 700, color: '#4A72D4' }}>{initials}</span>}
                    </div>
                    <h2 style={{ marginTop: 12, fontSize: 18, fontWeight: 700, color: '#0f172a' }}>{doc.businessName}</h2>
                </div>

                {/* Summary card */}
                <div style={{ background: '#fff', borderRadius: 14, padding: 28, boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                    <div style={{ textAlign: 'center', marginBottom: 20 }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
                            Hi, {doc.client?.name || 'there'}!
                        </div>
                        <div style={{ fontSize: 13.5, color: '#64748b', marginTop: 4 }}>
                            Here's your {doc.docLabel} from {doc.businessName}
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13.5 }}>
                        <Row label={`${doc.docLabel} #`} value={doc.number} />
                        <Row label="Date" value={fmtDate(doc.date)} />
                        <Row label="Status" value={<span style={{ textTransform: 'capitalize', color: '#d97706' }}>{doc.status}</span>} />
                    </div>

                    <div style={{ textAlign: 'center', margin: '22px 0' }}>
                        <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600, letterSpacing: '0.04em' }}>AMOUNT</div>
                        <div style={{ fontSize: 32, fontWeight: 800, color: '#0f172a', marginTop: 4 }}>
                            {fmtCurrency(doc.total, doc.currency)}
                        </div>
                        <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Thank you for your business!</div>
                    </div>

                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
                        <button
                            onClick={() => setDetailsOpen(true)}
                            style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: 4, color: '#475569', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', padding: 0 }}
                        >
                            View details <ChevronRight size={15} />
                        </button>
                        <button
                            onClick={handleDownload}
                            style={{ background: '#4A72D4', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontSize: 13.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                        >
                            <Download size={15} /> Download {doc.docLabel}
                        </button>
                    </div>
                </div>

                <div style={{ textAlign: 'center', fontSize: 11.5, color: '#94a3b8', margin: '20px 0 40px' }}>
                    Powered by Goodsynk Invoices
                </div>
            </div>

            {/* Details modal */}
            {detailsOpen && (
                <>
                    <div onClick={() => setDetailsOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 999 }} />
                    <div style={{
                        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                        zIndex: 1000, width: '92%', maxWidth: 560, maxHeight: '85vh', overflowY: 'auto',
                        background: '#fff', borderRadius: 14, boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid #e2e8f0' }}>
                            <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{doc.docLabel} #{doc.number}</div>
                            <button onClick={() => setDetailsOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                                <X size={18} />
                            </button>
                        </div>

                        <div style={{ padding: 24 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#4A72D4', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
                                    {clientInitials}
                                </div>
                                <div style={{ fontWeight: 700, fontSize: 14.5, color: '#0f172a' }}>{doc.client?.name || '—'}</div>
                            </div>
                            <div style={{ fontSize: 12.5, color: '#64748b', marginBottom: 14 }}>
                                {doc.docLabel} Date {fmtDate(doc.date)}{doc.dueDate ? `  •  Due Date ${fmtDate(doc.dueDate)}` : ''}
                            </div>
                            <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 20 }}>
                                {fmtCurrency(doc.total, doc.currency)}
                            </div>

                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                <thead>
                                    <tr style={{ color: '#94a3b8', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                                        <th style={{ padding: '6px 0', fontWeight: 600 }}>Product Name</th>
                                        <th style={{ padding: '6px 0', fontWeight: 600, textAlign: 'right' }}>Qty</th>
                                        <th style={{ padding: '6px 0', fontWeight: 600, textAlign: 'right' }}>Unit Price</th>
                                        <th style={{ padding: '6px 0', fontWeight: 600, textAlign: 'right' }}>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(doc.items || []).map((item, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '10px 0', color: '#0f172a' }}>{item.name}</td>
                                            <td style={{ padding: '10px 0', textAlign: 'right', color: '#334155' }}>{item.quantity}</td>
                                            <td style={{ padding: '10px 0', textAlign: 'right', color: '#334155' }}>{fmtCurrency(item.price, doc.currency)}</td>
                                            <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>{fmtCurrency(item.total, doc.currency)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13.5 }}>
                                <Row label="Taxable Amount" value={fmtCurrency(doc.subtotal, doc.currency)} />
                                <Row label="Tax Amount" value={fmtCurrency(doc.taxTotal, doc.currency)} />
                                <Row label="Total Amount" value={<strong>{fmtCurrency(doc.total, doc.currency)}</strong>} bold />
                            </div>
                        </div>
                    </div>
                </>
            )}
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