import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { invoiceAPI } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import { FileText, Users, DollarSign, TrendingUp, Plus, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { isProfileComplete, getMissingProfileField } from '../../utils/profileValidation';

const formatINR = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [stats, setStats] = useState(null);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([invoiceAPI.getStats(), invoiceAPI.getAll({ limit: 5 })])
      .then(([statsRes, invRes]) => {
        setStats(statsRes.data.stats);
        setRecentInvoices(invRes.data.invoices);
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

  const statCards = [
    { label: 'Total Invoices', value: stats?.totalInvoices ?? 0, icon: FileText, color: 'var(--primary)', bg: 'var(--primary-bg)' },
    { label: 'Total Revenue', value: formatINR(stats?.totalRevenue), icon: DollarSign, color: 'var(--success)', bg: 'var(--success-bg)' },
    { label: 'Outstanding', value: formatINR(stats?.outstanding), icon: TrendingUp, color: 'var(--warning)', bg: 'var(--warning-bg)' },
    { label: 'Overdue', value: stats?.overdue ?? 0, icon: Clock, color: 'var(--danger)', bg: 'var(--danger-bg)' },
  ];

  const statusBadge = (s) => <span className={`badge badge-${s}`}>{s}</span>;

  return (<>
    <div>
      {/* Welcome */}
      <div className="mb-4">
        <h1 className="page-title">👋 Welcome, {user?.name?.split(' ')[0]}!</h1>
        <p className="page-subtitle">Here's an overview of your business activity.</p>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div className="stat-card" key={label}>
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

      {/* Recent Invoices */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Recent Invoices</h2>
          <button type="button" className="btn btn-primary btn-sm" onClick={handleNewInvoice}>
            <Plus size={14} /> New Invoice
          </button>
        </div>
        {loading ? (
          <div className="flex-center" style={{ padding: '40px' }}><div className="spinner" /></div>
        ) : recentInvoices.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📄</div>
            <div className="empty-state-title">No invoices yet</div>
            <div className="empty-state-desc">Create your first invoice to get started</div>
            <button type="button" className="btn btn-primary" onClick={handleNewInvoice}>
              <Plus size={15} /> Create Invoice
            </button>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Client</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices.map((inv) => (
                  <tr key={inv._id}>
                    <td>
                      <Link to={`/invoices/${inv._id}`} style={{ color: 'var(--primary-light)', fontWeight: 600 }}>
                        {inv.invoiceNumber}
                      </Link>
                    </td>
                    <td>{inv.client?.name || '—'}</td>
                    <td>{new Date(inv.issueDate).toLocaleDateString('en-IN')}</td>
                    <td className="font-semibold">{formatINR(inv.total)}</td>
                    <td>{statusBadge(inv.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
    {showProfileModal && (
      <div className="modal-backdrop" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
        <div className="modal" style={{ background: "var(--bg-card)", color: "var(--text-primary)", padding: "24px", borderRadius: "8px", maxWidth: "400px", width: "100%", boxShadow: "var(--shadow)" }}>
          <h2 className="modal-title" style={{ marginBottom: "12px", fontSize: "1.25rem", fontWeight: "bold" }}>Complete Your Profile</h2>
          <p className="modal-message" style={{ marginBottom: "20px", color: "var(--text-secondary)" }}>
            Please complete your business profile before creating an invoice.
          </p>
          <div className="modal-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <button className="btn btn-primary" onClick={() => { setShowProfileModal(false); navigate('/profile'); }}>
              Go to Profile
            </button>
            <button className="btn btn-ghost" onClick={() => setShowProfileModal(false)}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    )}
  </>)
};
