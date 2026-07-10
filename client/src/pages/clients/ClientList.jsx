import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { clientAPI } from '../../api/services';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';

export default function ClientList() {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchClients = () => {
    setLoading(true);
    clientAPI.getAll().then((r) => setClients(r.data.clients)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(fetchClients, []);

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
      <div className="page-header">
        <div>
          <h1 className="page-title">Clients</h1>
          <p className="page-subtitle">Manage your client directory</p>
        </div>
        <Link to="/clients/new" className="btn btn-primary"><Plus size={16} /> New Client</Link>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div
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
            <Link to="/clients/new" className="btn btn-primary"><Plus size={15} /> Add Client</Link>
          </div>
        ) : (
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 'var(--radius-lg)' }}>
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
        )}
      </div>
    </div>
  );
}
