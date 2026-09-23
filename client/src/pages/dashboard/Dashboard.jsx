import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { invoiceAPI, quotationAPI } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import {
  FileText, DollarSign, TrendingUp, Plus, Clock,
  Search, Download, Calendar, X, Receipt, FileSpreadsheet,
  ArrowUpRight, ChevronDown, ChevronUp, Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import { isProfileComplete, getMissingProfileField } from '../../utils/profileValidation';

const formatINR = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

/* ---------- Small reusable subcomponents ---------- */

function StatusBadge({ status }) {
  const map = {
    paid: { bg: 'var(--success-bg)', color: 'var(--success)' },
    unpaid: { bg: 'var(--warning-bg)', color: 'var(--warning)' },
    pending: { bg: 'var(--warning-bg)', color: 'var(--warning)' },
    overdue: { bg: 'var(--danger-bg)', color: 'var(--danger)' },
    draft: { bg: 'var(--bg-hover)', color: 'var(--text-secondary)' },
    sent: { bg: 'var(--primary-bg)', color: 'var(--primary)' },
    accepted: { bg: 'var(--success-bg)', color: 'var(--success)' },
    rejected: { bg: 'var(--danger-bg)', color: 'var(--danger)' },
    expired: { bg: 'var(--danger-bg)', color: 'var(--danger)' },
  };
  const s = map[status] || map.draft;
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '3px 10px',
        borderRadius: 999,
        fontSize: '0.72rem',
        fontWeight: 600,
        textTransform: 'capitalize',
        background: s.bg,
        color: s.color,
        whiteSpace: 'nowrap',
      }}
    >
      {status}
    </span>
  );
}

function SearchBar({ value, onChange, placeholder }) {
  return (
    <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
      <Search
        size={16}
        style={{
          position: 'absolute',
          left: 12,
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'var(--text-secondary)',
          pointerEvents: 'none',
        }}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '10px 36px 10px 36px',
          borderRadius: 10,
          border: '1px solid var(--border)',
          background: 'var(--bg-card)',
          color: 'var(--text-primary)',
          fontSize: '0.85rem',
          outline: 'none',
          transition: 'border-color 0.15s, box-shadow 0.15s',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = 'var(--primary)';
          e.target.style.boxShadow = '0 0 0 3px var(--primary-bg)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = 'var(--border)';
          e.target.style.boxShadow = 'none';
        }}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          style={{
            position: 'absolute',
            right: 10,
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            display: 'flex',
            padding: 2,
          }}
          aria-label="Clear search"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

/* ---------- Export Modal ---------- */

function ExportModal({ open, onClose, onExport, title }) {
  const today = new Date().toISOString().slice(0, 10);
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .slice(0, 10);

  const [mode, setMode] = useState('all'); // 'all' | 'range'
  const [from, setFrom] = useState(firstOfMonth);
  const [to, setTo] = useState(today);

  useEffect(() => {
    if (open) {
      setMode('all');
      setFrom(firstOfMonth);
      setTo(today);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const handleExport = () => {
    if (mode === 'range') {
      if (!from || !to) {
        toast.error('Please select both start and end dates');
        return;
      }
      if (new Date(from) > new Date(to)) {
        toast.error('Start date cannot be after end date');
        return;
      }
    }
    onExport(mode === 'all' ? null : { from, to });
    onClose();
  };

  return (
    <div
      className="modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-card)',
          color: 'var(--text-primary)',
          padding: 24,
          borderRadius: 16,
          maxWidth: 460,
          width: '100%',
          boxShadow: '0 24px 60px -12px rgba(0,0,0,0.4)',
          border: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Download size={18} /> Export {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              display: 'flex',
              padding: 4,
              borderRadius: 6,
            }}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 18 }}>
          Download a CSV copy of your {title.toLowerCase()}. Filtering uses the <b>issue date</b>.
        </p>

        {/* Mode toggle */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            background: 'var(--bg-hover, rgba(255,255,255,0.05))',
            padding: 4,
            borderRadius: 10,
            marginBottom: 18,
          }}
        >
          {[
            { id: 'all', label: 'All Records', icon: FileSpreadsheet },
            { id: 'range', label: 'Custom Date', icon: Calendar },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setMode(id)}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '9px 10px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 600,
                background: mode === id ? 'var(--primary)' : 'transparent',
                color: mode === id ? '#fff' : 'var(--text-secondary)',
                transition: 'all 0.15s',
              }}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        {mode === 'range' && (
          <>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: '0.72rem',
                color: 'var(--primary)',
                background: 'var(--primary-bg)',
                padding: '6px 10px',
                borderRadius: 8,
                marginBottom: 12,
                fontWeight: 600,
              }}
            >
              <Sparkles size={12} /> Filtering by <b>Issue Date</b>
            </div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  From (Issue Date)
                </label>
                <input
                  type="date"
                  value={from}
                  max={to}
                  onChange={(e) => setFrom(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 10px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    outline: 'none',
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  To (Issue Date)
                </label>
                <input
                  type="date"
                  value={to}
                  min={from}
                  onChange={(e) => setTo(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 10px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    outline: 'none',
                  }}
                />
              </div>
            </div>
          </>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={handleExport}>
            <Download size={14} /> Download CSV
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Main Dashboard ---------- */

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [stats, setStats] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search + section state
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [quotationSearch, setQuotationSearch] = useState('');
  const [activeTab, setActiveTab] = useState('invoices'); // 'invoices' | 'quotations'
  const [invoiceCollapsed, setInvoiceCollapsed] = useState(false);
  const [quotationCollapsed, setQuotationCollapsed] = useState(false);

  // Export modal
  const [exportModal, setExportModal] = useState({ open: false, type: 'invoice' });

  useEffect(() => {
    Promise.allSettled([
      invoiceAPI.getStats(),
      invoiceAPI.getAll({ limit: 50 }),
      quotationAPI.getAll({ limit: 50 }),
    ])
      .then(([statsRes, invRes, quoRes]) => {
        if (statsRes.status === 'fulfilled') setStats(statsRes.value.data.stats);
        if (invRes.status === 'fulfilled') setInvoices(invRes.value.data.invoices || []);
        if (quoRes.status === 'fulfilled') setQuotations(quoRes.value.data.quotations || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleNewInvoice = () => {
    if (!isProfileComplete(user)) {
      const missing = getMissingProfileField(user);
      toast.error(`${missing} is missing, fill that to complete the profile`);
      setShowProfileModal(true);
      return;
    }
    navigate('/invoices/new');
  };

  const handleNewQuotation = () => {
    if (!isProfileComplete(user)) {
      const missing = getMissingProfileField(user);
      toast.error(`${missing} is missing, fill that to complete the profile`);
      setShowProfileModal(true);
      return;
    }
    navigate('/quotations/new');
  };

  /* ---------- Filtering ---------- */

  const matchesSearch = (item, query, numberKey) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase().trim();
    const clientName = (item.client?.name || '').toLowerCase();
    const number = (item[numberKey] || '').toLowerCase();
    const issueDate = item.issueDate ? new Date(item.issueDate) : null;
    const dateStr = issueDate ? issueDate.toLocaleDateString('en-IN').toLowerCase() : '';
    const dateIso = issueDate ? issueDate.toISOString().slice(0, 10) : '';
    const status = (item.status || '').toLowerCase();

    return (
      clientName.includes(q) ||
      number.includes(q) ||
      dateStr.includes(q) ||
      dateIso.includes(q) ||
      status.includes(q)
    );
  };

  const filteredInvoices = useMemo(
    () => invoices.filter((i) => matchesSearch(i, invoiceSearch, 'invoiceNumber')),
    [invoices, invoiceSearch]
  );

  const filteredQuotations = useMemo(
    () => quotations.filter((q) => matchesSearch(q, quotationSearch, 'quotationNumber')),
    [quotations, quotationSearch]
  );

  /* ---------- CSV export (ALWAYS by ISSUE DATE) ---------- */

  const toCSV = (rows, headers) => {
    const escape = (val) => {
      if (val === null || val === undefined) return '';
      const s = String(val);
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };
    const lines = [headers.join(',')];
    rows.forEach((r) => lines.push(r.map(escape).join(',')));
    return lines.join('\n');
  };

  const triggerDownload = (filename, csvContent) => {
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExport = (type, range) => {
    const isInvoice = type === 'invoice';
    const source = isInvoice ? invoices : quotations;
    const numberKey = isInvoice ? 'invoiceNumber' : 'quotationNumber';

    let rows = source;
    if (range) {
      // ✅ Filter strictly by ISSUE DATE
      const fromTime = new Date(range.from).setHours(0, 0, 0, 0);
      const toTime = new Date(range.to).setHours(23, 59, 59, 999);
      rows = source.filter((item) => {
        if (!item.issueDate) return false;
        const d = new Date(item.issueDate).getTime();
        return d >= fromTime && d <= toTime;
      });
    }

    if (rows.length === 0) {
      toast.error(
        `No ${type}s found for the selected ${range ? 'issue-date range' : 'criteria'}`
      );
      return;
    }

    const headers = [
      isInvoice ? 'Invoice Number' : 'Quotation Number',
      'Client Name',
      'Client Email',
      'Client Phone',
      'Issue Date',
      isInvoice ? 'Due Date' : 'Valid Until',
      'Status',
      'Subtotal',
      'Tax',
      'Discount',
      'Total',
    ];

    const data = rows.map((r) => [
      r[numberKey] || '',
      r.client?.name || '',
      r.client?.email || '',
      r.client?.phone || '',
      r.issueDate ? new Date(r.issueDate).toISOString().slice(0, 10) : '',
      (isInvoice ? r.dueDate : r.validUntil)
        ? new Date(isInvoice ? r.dueDate : r.validUntil).toISOString().slice(0, 10)
        : '',
      r.status || '',
      r.subtotal ?? 0,
      r.taxTotal ?? r.tax ?? 0,
      r.discount ?? 0,
      r.total ?? 0,
    ]);

    const csv = toCSV(data, headers);
    const rangeLabel = range ? `_issued_${range.from}_to_${range.to}` : '_all';
    const filename = `${type}s${rangeLabel}.csv`;
    triggerDownload(filename, csv);
    toast.success(`Exported ${rows.length} ${type}${rows.length > 1 ? 's' : ''} by issue date`);
  };

  /* ---------- Stat cards ---------- */

  const statCards = [
    {
      label: 'Total Invoices',
      value: stats?.totalInvoices ?? invoices.length,
      icon: FileText,
      color: 'var(--primary)',
      bg: 'var(--primary-bg)',
      accent: '#6366f1',
    },
    {
      label: 'Total Revenue',
      value: formatINR(stats?.totalRevenue),
      icon: DollarSign,
      color: 'var(--success)',
      bg: 'var(--success-bg)',
      accent: '#10b981',
    },
    {
      label: 'Outstanding',
      value: formatINR(stats?.outstanding),
      icon: TrendingUp,
      color: 'var(--warning)',
      bg: 'var(--warning-bg)',
      accent: '#f59e0b',
    },
    {
      label: 'Overdue',
      value: stats?.overdue ?? 0,
      icon: Clock,
      color: 'var(--danger)',
      bg: 'var(--danger-bg)',
      accent: '#ef4444',
    },
  ];

  /* ---------- Row renderers ---------- */

  const renderInvoiceRow = (inv) => (
    <tr key={inv._id} style={{ transition: 'background 0.15s' }}>
      <td>
        <Link
          to={`/invoices/${inv._id}`}
          style={{
            color: 'var(--primary-light)',
            fontWeight: 600,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          {inv.invoiceNumber}
          <ArrowUpRight size={12} style={{ opacity: 0.6 }} />
        </Link>
      </td>
      <td>{inv.client?.name || '—'}</td>
      <td style={{ whiteSpace: 'nowrap' }}>{formatDate(inv.issueDate)}</td>
      <td className="font-semibold" style={{ whiteSpace: 'nowrap' }}>{formatINR(inv.total)}</td>
      <td><StatusBadge status={inv.status} /></td>
    </tr>
  );

  const renderQuotationRow = (q) => (
    <tr key={q._id} style={{ transition: 'background 0.15s' }}>
      <td>
        <Link
          to={`/quotations/${q._id}`}
          style={{
            color: 'var(--primary-light)',
            fontWeight: 600,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          {q.quotationNumber}
          <ArrowUpRight size={12} style={{ opacity: 0.6 }} />
        </Link>
      </td>
      <td>{q.client?.name || '—'}</td>
      <td style={{ whiteSpace: 'nowrap' }}>{formatDate(q.issueDate)}</td>
      <td className="font-semibold" style={{ whiteSpace: 'nowrap' }}>{formatINR(q.total)}</td>
      <td><StatusBadge status={q.status} /></td>
    </tr>
  );

  const renderMobileCard = (item, numberKey, linkPrefix) => (
    <div
      key={item._id}
      style={{
        border: '1px solid var(--border)',
        borderRadius: 14,
        padding: '14px',
        margin: '12px',
        background: 'var(--bg-card)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <Link
          to={`${linkPrefix}/${item._id}`}
          style={{ color: 'var(--primary-light)', fontWeight: 700, fontSize: '0.95rem', textDecoration: 'none' }}
        >
          {item[numberKey]}
        </Link>
        <StatusBadge status={item.status} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.82rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <span style={{ color: 'var(--text-secondary)' }}>Client</span>
          <span style={{ fontWeight: 500, textAlign: 'right' }}>{item.client?.name || '—'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <span style={{ color: 'var(--text-secondary)' }}>Date</span>
          <span style={{ fontWeight: 500, textAlign: 'right' }}>{formatDate(item.issueDate)}</span>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            paddingTop: 6,
            borderTop: '1px solid var(--border)',
            marginTop: 4,
          }}
        >
          <span style={{ color: 'var(--text-secondary)' }}>Amount</span>
          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{formatINR(item.total)}</span>
        </div>
      </div>
    </div>
  );

  const hasInvoices = filteredInvoices.length > 0;
  const hasQuotations = filteredQuotations.length > 0;

  return (
    <>
      <div>
        {/* ---------- Styles ---------- */}
        <style>{`
          .dash-hero {
            background: linear-gradient(135deg, rgba(99,102,241,0.16) 0%, rgba(139,92,246,0.10) 50%, rgba(16,185,129,0.10) 100%);
            border: 1px solid var(--border);
            border-radius: 20px;
            padding: 26px 28px;
            margin-bottom: 22px;
            position: relative;
            overflow: hidden;
          }
          .dash-hero::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -8%;
            width: 320px;
            height: 320px;
            background: radial-gradient(circle, rgba(99,102,241,0.28), transparent 70%);
            pointer-events: none;
          }
          .dash-hero::after {
            content: '';
            position: absolute;
            bottom: -40%;
            left: -6%;
            width: 260px;
            height: 260px;
            background: radial-gradient(circle, rgba(16,185,129,0.18), transparent 70%);
            pointer-events: none;
          }
          .dash-hero-actions {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            margin-top: 16px;
            position: relative;
            z-index: 1;
          }
          .dash-quick-btn {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            padding: 10px 16px;
            border-radius: 10px;
            font-size: 0.82rem;
            font-weight: 600;
            cursor: pointer;
            border: 1px solid transparent;
            transition: all 0.18s ease;
            white-space: nowrap;
          }
          .dash-quick-btn.primary {
            background: var(--primary);
            color: #fff;
            box-shadow: 0 8px 20px -6px rgba(99,102,241,0.55);
          }
          .dash-quick-btn.primary:hover {
            transform: translateY(-1px);
            box-shadow: 0 12px 26px -6px rgba(99,102,241,0.7);
          }
          .dash-quick-btn.success {
            background: var(--success);
            color: #fff;
            box-shadow: 0 8px 20px -6px rgba(16,185,129,0.55);
          }
          .dash-quick-btn.success:hover {
            transform: translateY(-1px);
            box-shadow: 0 12px 26px -6px rgba(16,185,129,0.7);
          }
          .dash-quick-btn.outline {
            background: rgba(255,255,255,0.06);
            color: var(--text-primary);
            border-color: var(--border);
            backdrop-filter: blur(6px);
          }
          .dash-quick-btn.outline:hover {
            background: rgba(255,255,255,0.12);
            border-color: var(--primary);
            color: var(--primary-light);
            transform: translateY(-1px);
          }
          .dash-stat-card {
            position: relative;
            overflow: hidden;
            transition: transform 0.18s ease, box-shadow 0.18s ease;
          }
          .dash-stat-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 16px 30px -10px rgba(0,0,0,0.22);
          }
          .dash-stat-card::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: var(--accent);
            opacity: 0.9;
          }
          .dash-section {
            border: 1px solid var(--border);
            border-radius: 16px;
            overflow: hidden;
            background: var(--bg-card);
            margin-bottom: 22px;
            box-shadow: 0 4px 20px -12px rgba(0,0,0,0.15);
          }
          .dash-section-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 16px 20px;
            border-bottom: 1px solid var(--border);
            background: linear-gradient(180deg, rgba(255,255,255,0.04), transparent);
            flex-wrap: wrap;
          }
          .dash-section-title {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 1.02rem;
            font-weight: 700;
            margin: 0;
          }
          .dash-toolbar {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 14px 20px;
            border-bottom: 1px solid var(--border);
            flex-wrap: wrap;
            background: var(--bg-card);
          }
          .dash-icon-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            padding: 8px 12px;
            border-radius: 9px;
            border: 1px solid var(--border);
            background: var(--bg-card);
            color: var(--text-secondary);
            font-size: 0.78rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.15s;
          }
          .dash-icon-btn:hover {
            background: var(--bg-hover, rgba(255,255,255,0.05));
            border-color: var(--primary);
            color: var(--primary-light);
          }
          .dash-export-btn {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            padding: 9px 16px;
            border-radius: 10px;
            border: none;
            background: linear-gradient(135deg, var(--primary) 0%, #8b5cf6 100%);
            color: #fff;
            font-size: 0.82rem;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.18s ease;
            box-shadow: 0 6px 16px -4px rgba(99,102,241,0.5);
            white-space: nowrap;
          }
          .dash-export-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 10px 22px -4px rgba(99,102,241,0.7);
          }
          .dash-export-btn:active {
            transform: translateY(0);
          }
          .dash-tabs {
            display: flex;
            gap: 4px;
            padding: 4px;
            background: var(--bg-hover, rgba(255,255,255,0.05));
            border-radius: 12px;
          }
          .dash-tab {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            padding: 8px 16px;
            border-radius: 9px;
            border: none;
            background: transparent;
            color: var(--text-secondary);
            font-size: 0.82rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.15s;
            white-space: nowrap;
          }
          .dash-tab.active {
            background: var(--primary);
            color: #fff;
            box-shadow: 0 6px 16px -4px rgba(99,102,241,0.5);
          }
          .dash-tab-badge {
            background: rgba(255,255,255,0.25);
            border-radius: 999px;
            padding: 1px 8px;
            font-size: 0.68rem;
            font-weight: 700;
          }
          .dash-tab:not(.active) .dash-tab-badge {
            background: var(--bg-card);
            color: var(--text-secondary);
          }
          .dash-table tr:hover td {
            background: var(--bg-hover, rgba(255,255,255,0.04));
          }
          .dash-mobile-list { display: none; }
          @media (max-width: 768px) {
            .dash-desktop-table { display: none !important; }
            .dash-mobile-list { display: block; }
            .dash-hero { padding: 20px 18px; border-radius: 16px; }
            .dash-hero-actions { gap: 8px; }
            .dash-quick-btn { flex: 1 1 calc(50% - 4px); justify-content: center; padding: 10px 12px; }
            .dash-section-header { flex-direction: column; align-items: stretch !important; }
            .dash-toolbar { padding: 12px; }
            .dash-export-btn { width: 100%; justify-content: center; }
          }
          @media (max-width: 420px) {
            .dash-quick-btn { flex: 1 1 100%; }
          }
        `}</style>

        {/* ---------- Hero / Welcome + Quick Actions ---------- */}
        <div className="dash-hero">
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h1 className="page-title" style={{ marginBottom: 4 }}>
              👋 Welcome back, {user?.name?.split(' ')[0] || 'there'}!
            </h1>
            <p className="page-subtitle" style={{ margin: 0, maxWidth: 620 }}>
              Track invoices, quotations and revenue — all in one place. Use the quick actions below to get started.
            </p>

            {/* Quick action buttons */}
            <div className="dash-hero-actions">
              <button
                type="button"
                className="dash-quick-btn primary"
                onClick={handleNewInvoice}
              >
                <Plus size={15} /> New Invoice
              </button>
              <button
                type="button"
                className="dash-quick-btn success"
                onClick={handleNewQuotation}
              >
                <Plus size={15} /> New Quotation
              </button>
              <button
                type="button"
                className="dash-quick-btn outline"
                onClick={() => setExportModal({ open: true, type: 'invoice' })}
              >
                <Download size={15} /> Export Invoices
              </button>
              <button
                type="button"
                className="dash-quick-btn outline"
                onClick={() => setExportModal({ open: true, type: 'quotation' })}
              >
                <Download size={15} /> Export Quotations
              </button>
            </div>
          </div>
        </div>

        {/* ---------- Stat Cards ---------- */}
        <div className="stats-grid" style={{ marginBottom: 22 }}>
          {statCards.map(({ label, value, icon: Icon, color, bg, accent }) => (
            <div
              className="stat-card dash-stat-card"
              key={label}
              style={{ ['--accent']: accent }}
            >
              <div className="stat-icon" style={{ background: bg, color }}>
                <Icon size={20} />
              </div>
              <div className="stat-body">
                <div className="stat-label">{label}</div>
                <div className="stat-value">{loading ? '—' : value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ---------- Tabs (quick switch) ---------- */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            marginBottom: 14,
            flexWrap: 'wrap',
          }}
        >
          <div className="dash-tabs">
            <button
              className={`dash-tab ${activeTab === 'invoices' ? 'active' : ''}`}
              onClick={() => setActiveTab('invoices')}
            >
              <Receipt size={14} /> Invoices
              <span className="dash-tab-badge">{invoices.length}</span>
            </button>
            <button
              className={`dash-tab ${activeTab === 'quotations' ? 'active' : ''}`}
              onClick={() => setActiveTab('quotations')}
            >
              <FileSpreadsheet size={14} /> Quotations
              <span className="dash-tab-badge">{quotations.length}</span>
            </button>
          </div>
        </div>

        {/* ---------- INVOICES SECTION ---------- */}
        <div
          className="dash-section"
          style={{ display: activeTab === 'invoices' ? 'block' : 'none' }}
        >
          <div className="dash-section-header">
            <h2 className="dash-section-title">
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 32,
                  height: 32,
                  borderRadius: 9,
                  background: 'var(--primary-bg)',
                  color: 'var(--primary)',
                }}
              >
                <Receipt size={17} />
              </span>
              Invoices
              <span
                style={{
                  fontSize: '0.7rem',
                  background: 'var(--bg-hover, rgba(255,255,255,0.06))',
                  color: 'var(--text-secondary)',
                  padding: '2px 9px',
                  borderRadius: 999,
                  fontWeight: 700,
                }}
              >
                {filteredInvoices.length}
              </span>
            </h2>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                type="button"
                className="dash-export-btn"
                onClick={() => setExportModal({ open: true, type: 'invoice' })}
              >
                <Download size={14} /> Export
              </button>
              <button
                type="button"
                className="dash-icon-btn"
                onClick={() => setInvoiceCollapsed((v) => !v)}
                aria-label={invoiceCollapsed ? 'Expand' : 'Collapse'}
              >
                {invoiceCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
              </button>
            </div>
          </div>

          {!invoiceCollapsed && (
            <>
              <div className="dash-toolbar">
                <SearchBar
                  value={invoiceSearch}
                  onChange={setInvoiceSearch}
                  placeholder="Search by client, invoice #, issue date or status…"
                />
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleNewInvoice}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  <Plus size={14} /> New Invoice
                </button>
              </div>

              {loading ? (
                <div className="flex-center" style={{ padding: 40 }}>
                  <div className="spinner" />
                </div>
              ) : !hasInvoices ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📄</div>
                  <div className="empty-state-title">
                    {invoiceSearch ? 'No matching invoices' : 'No invoices yet'}
                  </div>
                  <div className="empty-state-desc">
                    {invoiceSearch
                      ? 'Try a different search term.'
                      : 'Create your first invoice to get started'}
                  </div>
                  {!invoiceSearch && (
                    <button type="button" className="btn btn-primary" onClick={handleNewInvoice}>
                      <Plus size={15} /> Create Invoice
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="table-wrapper dash-desktop-table">
                    <table className="dash-table">
                      <thead>
                        <tr>
                          <th>Invoice #</th>
                          <th>Client</th>
                          <th>Issue Date</th>
                          <th>Amount</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>{filteredInvoices.map(renderInvoiceRow)}</tbody>
                    </table>
                  </div>

                  <div className="dash-mobile-list">
                    {filteredInvoices.map((inv) => renderMobileCard(inv, 'invoiceNumber', '/invoices'))}
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* ---------- QUOTATIONS SECTION ---------- */}
        <div
          className="dash-section"
          style={{ display: activeTab === 'quotations' ? 'block' : 'none' }}
        >
          <div className="dash-section-header">
            <h2 className="dash-section-title">
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 32,
                  height: 32,
                  borderRadius: 9,
                  background: 'var(--primary-bg)',
                  color: 'var(--primary)',
                }}
              >
                <FileSpreadsheet size={17} />
              </span>
              Quotations
              <span
                style={{
                  fontSize: '0.7rem',
                  background: 'var(--bg-hover, rgba(255,255,255,0.06))',
                  color: 'var(--text-secondary)',
                  padding: '2px 9px',
                  borderRadius: 999,
                  fontWeight: 700,
                }}
              >
                {filteredQuotations.length}
              </span>
            </h2>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                type="button"
                className="dash-export-btn"
                onClick={() => setExportModal({ open: true, type: 'quotation' })}
              >
                <Download size={14} /> Export
              </button>
              <button
                type="button"
                className="dash-icon-btn"
                onClick={() => setQuotationCollapsed((v) => !v)}
                aria-label={quotationCollapsed ? 'Expand' : 'Collapse'}
              >
                {quotationCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
              </button>
            </div>
          </div>

          {!quotationCollapsed && (
            <>
              <div className="dash-toolbar">
                <SearchBar
                  value={quotationSearch}
                  onChange={setQuotationSearch}
                  placeholder="Search by client, quotation #, issue date or status…"
                />
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleNewQuotation}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  <Plus size={14} /> New Quotation
                </button>
              </div>

              {loading ? (
                <div className="flex-center" style={{ padding: 40 }}>
                  <div className="spinner" />
                </div>
              ) : !hasQuotations ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📋</div>
                  <div className="empty-state-title">
                    {quotationSearch ? 'No matching quotations' : 'No quotations yet'}
                  </div>
                  <div className="empty-state-desc">
                    {quotationSearch
                      ? 'Try a different search term.'
                      : 'Create your first quotation to get started'}
                  </div>
                  {!quotationSearch && (
                    <button type="button" className="btn btn-primary" onClick={handleNewQuotation}>
                      <Plus size={15} /> Create Quotation
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="table-wrapper dash-desktop-table">
                    <table className="dash-table">
                      <thead>
                        <tr>
                          <th>Quotation #</th>
                          <th>Client</th>
                          <th>Issue Date</th>
                          <th>Amount</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>{filteredQuotations.map(renderQuotationRow)}</tbody>
                    </table>
                  </div>

                  <div className="dash-mobile-list">
                    {filteredQuotations.map((q) =>
                      renderMobileCard(q, 'quotationNumber', '/quotations')
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* ---------- Profile Modal ---------- */}
      {showProfileModal && (
        <div
          className="modal-backdrop"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16,
          }}
        >
          <div
            className="modal"
            style={{
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              padding: 24,
              borderRadius: 14,
              maxWidth: 400,
              width: '100%',
              boxShadow: 'var(--shadow)',
              border: '1px solid var(--border)',
            }}
          >
            <h2 className="modal-title" style={{ marginBottom: 12, fontSize: '1.25rem', fontWeight: 700 }}>
              Complete Your Profile
            </h2>
            <p className="modal-message" style={{ marginBottom: 20, color: 'var(--text-secondary)' }}>
              Please complete your business profile before creating an invoice or quotation.
            </p>
            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setShowProfileModal(false);
                  navigate('/profile');
                }}
              >
                Go to Profile
              </button>
              <button className="btn btn-ghost" onClick={() => setShowProfileModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- Export Modal ---------- */}
      <ExportModal
        open={exportModal.open}
        onClose={() => setExportModal({ open: false, type: 'invoice' })}
        onExport={(range) => handleExport(exportModal.type, range)}
        title={exportModal.type === 'invoice' ? 'Invoices' : 'Quotations'}
      />
    </>
  );
}
