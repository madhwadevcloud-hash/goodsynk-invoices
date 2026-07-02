import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { invoiceAPI } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import { FileText, Users, DollarSign, TrendingUp, Plus, Clock } from 'lucide-react';

const formatINR = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

export default function Dashboard() {
  const { user } = useAuth();
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

  const statCards = [
    { label: 'Total Invoices', value: stats?.totalInvoices ?? 0, icon: FileText, color: 'var(--primary)', bg: 'var(--primary-bg)' },
    { label: 'Total Revenue', value: formatINR(stats?.totalRevenue), icon: DollarSign, color: 'var(--success)', bg: 'var(--success-bg)' },
    { label: 'Outstanding', value: formatINR(stats?.outstanding), icon: TrendingUp, color: 'var(--warning)', bg: 'var(--warning-bg)' },
    { label: 'Overdue', value: stats?.overdue ?? 0, icon: Clock, color: 'var(--danger)', bg: 'var(--danger-bg)' },
  ];

  const statusBadge = (s) => <span className={`badge badge-${s}`}>{s}</span>;

  return (
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
          <Link to="/invoices/new" className="btn btn-primary btn-sm">
            <Plus size={14} /> New Invoice
          </Link>
        </div>
        {loading ? (
          <div className="flex-center" style={{ padding: '40px' }}><div className="spinner" /></div>
        ) : recentInvoices.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📄</div>
            <div className="empty-state-title">No invoices yet</div>
            <div className="empty-state-desc">Create your first invoice to get started</div>
            <Link to="/invoices/new" className="btn btn-primary">
              <Plus size={15} /> Create Invoice
            </Link>
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
  );
}
