import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { quotationAPI } from '../../api/services';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Eye } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const fmtCurrency = (n, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 2 }).format(n || 0);

export default function QuotationList() {
  const { user } = useAuth();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const handleCreate = (e) => {
    if (!user?.businessName) {
      e.preventDefault();
      toast.error('Complete your profile to generate quotations');
    }
  };

  const fetchQuotations = () => {
    setLoading(true);
    quotationAPI.getAll()
      .then((r) => setQuotations(r.data.quotations || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(fetchQuotations, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this quotation?')) return;
    try {
      await quotationAPI.delete(id);
      toast.success('Quotation deleted');
      fetchQuotations();
    } catch {
      toast.error('Failed to delete quotation');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Quotations</h1>
          <p className="page-subtitle">Manage all your quotations</p>
        </div>
        <Link to="/quotations/new" className="btn btn-primary" onClick={handleCreate}>
          <Plus size={16} /> New Quotation
        </Link>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="flex-center" style={{ padding: '60px' }}><div className="spinner" /></div>
        ) : quotations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-title">No quotations found</div>
            <div className="empty-state-desc">Create your first quotation to share with clients</div>
            <Link to="/quotations/new" className="btn btn-primary" onClick={handleCreate}><Plus size={15} /> Create Quotation</Link>
          </div>
        ) : (
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 'var(--radius-lg)' }}>
            <table>
              <thead>
                <tr>
                  <th>Quotation #</th>
                  <th>Client</th>
                  <th>Issue Date</th>
                  <th>Valid Until</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {quotations.map((inv) => (
                  <tr key={inv._id}>
                    <td style={{ fontWeight: 600 }}>{inv.invoiceNumber}</td>
                    <td>{inv.client?.name || '—'}</td>
                    <td>{new Date(inv.issueDate).toLocaleDateString('en-IN')}</td>
                    <td>{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-IN') : '—'}</td>
                    <td className="font-semibold">{fmtCurrency(inv.total, inv.currency)}</td>
                    <td><span className={`badge badge-${inv.status}`}>{inv.status}</span></td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/quotations/${inv._id}`)} title="View"><Eye size={14} /></button>
                        <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/quotations/${inv._id}/edit`)} title="Edit"><Pencil size={14} /></button>
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
