import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { clientAPI, invoiceAPI } from '../../api/services';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';

export default function ClientList() {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [usage, setUsage] = useState(null);
  const navigate = useNavigate();

  const fetchClients = () => {
    setLoading(true);
    clientAPI.getAll().then((r) => setClients(r.data.clients)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchClients();
    invoiceAPI.getUsage()
      .then((res) => setUsage(res.data.usage))
      .catch(console.error);
  }, []);

  const handleAddClient = (e) => {
    if (usage && usage.clientsLimit !== null && usage.clientsLimit !== undefined && usage.clientsLimit !== Infinity) {
      if (usage.clients >= usage.clientsLimit) {
        e.preventDefault();
        toast.error(`Your ${usage.plan} plan allows up to ${usage.clientsLimit} clients per month. Upgrade to add more.`, { id: 'client-limit-toast' });
        navigate('/upgrade');
      }
    }
  };

  const filteredClients = clients.filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );

  const handleDelete = async (id) => {
    if (!confirm('Delete this client?')) return;
    try {
      await clientAPI.delete(id);
      toast.success('Client deleted');
      fetchClients();
    } catch { toast.error('Failed to delete client'); }
  };

  return (
    <div>
      {/* Mobile-only styles */}
      <style>{`
        .mobile-client-list { display: none; }
        @media (max-width: 768px) {
          .desktop-client-table { display: none !important; }
          .mobile-client-list { display: block; }
          .page-header { flex-direction: column; align-items: flex-start !important; gap: 12px; }
          .page-header .btn { width: 100%; justify-content: center; }
          .client-search-row input { width: 100% !important; }
        }
      `}</style>

      <div className="page-header">
        <div>
          <h1 className="page-title">Clients</h1>
          <p className="page-subtitle">Manage your client directory</p>
        </div>
        <Link to="/clients/new" onClick={handleAddClient} className="btn btn-primary"><Plus size={16} /> New Client</Link>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div
          className="client-search-row"
          style={{
            padding: '16px',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <input
            type="text"
            className="form-control"
            placeholder="Search client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '350px' }}
          />
        </div>
        {loading ? (
          <div className="flex-center" style={{ padding: '60px' }}><div className="spinner" /></div>
        ) : filteredClients.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <div className="empty-state-title">
              No clients found
            </div>

            <div className="empty-state-desc">
              No clients match your search
            </div>
            <Link to="/clients/new" onClick={handleAddClient} className="btn btn-primary"><Plus size={15} /> Add Client</Link>
          </div>
        ) : (
          <>
            {/* Desktop table view */}
            <div className="table-wrapper desktop-client-table" style={{ border: 'none', borderRadius: 'var(--radius-lg)' }}>
              <table>
                <thead>
                  <tr><th>Name</th><th>Email</th><th>Phone</th><th>GSTIN</th><th>City</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {filteredClients.map((c) => (
                    <tr key={c._id}>
                      <td style={{ fontWeight: 600 }}>{c.name}</td>
                      <td className="text-muted">{c.email || '—'}</td>
                      <td className="text-muted">{c.phone || '—'}</td>
                      <td className="text-muted">{c.gstin || '—'}</td>
                      <td className="text-muted">{c.address?.city || '—'}</td>
                      <td>
                        <div className="flex gap-2">
                          <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/clients/${c._id}/edit`)}><Pencil size={14} /></button>
                          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(c._id)}><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card view */}
            <div className="mobile-client-list">
              {filteredClients.map((c) => (
                <div
                  key={c._id}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '16px',
                    margin: '12px',
                    background: 'var(--bg-card)',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  {/* Top row: name */}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                      {c.name}
                    </div>
                  </div>

                  {/* Details */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    fontSize: '0.82rem',
                    marginBottom: 14,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Email</span>
                      <span style={{ fontWeight: 500, color: 'var(--text-primary)', textAlign: 'right', wordBreak: 'break-all' }}>
                        {c.email || '—'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Phone</span>
                      <span style={{ fontWeight: 500, color: 'var(--text-primary)', textAlign: 'right' }}>
                        {c.phone || '—'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>GSTIN</span>
                      <span style={{ fontWeight: 500, color: 'var(--text-primary)', textAlign: 'right', wordBreak: 'break-all' }}>
                        {c.gstin || '—'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>City</span>
                      <span style={{ fontWeight: 500, color: 'var(--text-primary)', textAlign: 'right' }}>
                        {c.address?.city || '—'}
                      </span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div style={{
                    display: 'flex',
                    gap: 8,
                    borderTop: '1px solid var(--border)',
                    paddingTop: 12,
                  }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => navigate(`/clients/${c._id}/edit`)}
                      style={{ flex: 1, justifyContent: 'center', gap: 4 }}
                    >
                      <Pencil size={14} /> Edit
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--danger)', flex: 1, justifyContent: 'center', gap: 4 }}
                      onClick={() => handleDelete(c._id)}
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
