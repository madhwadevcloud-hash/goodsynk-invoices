import { useEffect, useState } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { invoiceAPI } from '../../api/services';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Eye } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const fmtCurrency = (n, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 2 }).format(n || 0);

export default function InvoiceList() {
  const { user } = useAuth();
  const { setShowProfilePrompt } = useOutletContext();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const handleCreate = (e) => {
    if (!user?.businessName) {
      e.preventDefault();
      setShowProfilePrompt(true);
    }
  };

  const fetchInvoices = () => {
    setLoading(true);
    invoiceAPI.getAll().then((r) => setInvoices(r.data.invoices)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(fetchInvoices, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this invoice?')) return;
    try {
      await invoiceAPI.delete(id);
      toast.success('Invoice deleted');
      fetchInvoices();
    } catch {
      toast.error('Failed to delete invoice');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Invoices</h1>
          <p className="page-subtitle">Manage all your invoices</p>
        </div>
        <Link to="/invoices/new" className="btn btn-primary" onClick={handleCreate}>
          <Plus size={16} /> New Invoice
        </Link>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="flex-center" style={{ padding: '60px' }}><div className="spinner" /></div>
        ) : invoices.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📄</div>
            <div className="empty-state-title">No invoices found</div>
            <div className="empty-state-desc">Create your first invoice to start billing clients</div>
            <Link to="/invoices/new" className="btn btn-primary" onClick={handleCreate}><Plus size={15} /> Create Invoice</Link>
          </div>
        ) : (
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 'var(--radius-lg)' }}>
            <table>
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Client</th>
                  <th>Issue Date</th>
                  <th>Due Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv._id}>
                    <td style={{ fontWeight: 600 }}>{inv.invoiceNumber}</td>
                    <td>{inv.client?.name || '—'}</td>
                    <td>{new Date(inv.issueDate).toLocaleDateString('en-IN')}</td>
                    <td>{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-IN') : '—'}</td>
                    <td className="font-semibold">{fmtCurrency(inv.total, inv.currency)}</td>
                    <td><span className={`badge badge-${inv.status}`}>{inv.status}</span></td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/invoices/${inv._id}`)} title="View"><Eye size={14} /></button>
                        <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/invoices/${inv._id}/edit`)} title="Edit"><Pencil size={14} /></button>
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(inv._id)} title="Delete"><Trash2 size={14} /></button>
                      </div>
                    </td>
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
