import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { clientAPI } from '../../api/services';
import toast from 'react-hot-toast';
import { Save, ArrowLeft } from 'lucide-react';

const INDIA_STATES = ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi','Jammu & Kashmir','Ladakh','Puducherry'];

export default function ClientForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', gstin: '', pan: '', notes: '',
    address: { street: '', city: '', state: '', pincode: '', country: 'India' },
  });

  useEffect(() => {
    if (isEdit) {
      clientAPI.getById(id).then((r) => setForm(r.data.client)).catch(() => { toast.error('Client not found'); navigate('/clients'); });
    }
  }, [id]);

  const setField = (key, val) => setForm((f) => ({ ...f, [key]: val }));
  const setAddr = (key, val) => setForm((f) => ({ ...f, address: { ...f.address, [key]: val } }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) return toast.error('Client name is required');
    setSaving(true);
    try {
      if (isEdit) { await clientAPI.update(id, form); toast.success('Client updated'); }
      else { await clientAPI.create(form); toast.success('Client added'); }
      navigate('/clients');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save client'); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="page-header">
        <div className="flex gap-3" style={{ alignItems: 'center' }}>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate('/clients')}><ArrowLeft size={16} /></button>
          <div>
            <h1 className="page-title">{isEdit ? 'Edit Client' : 'New Client'}</h1>
            <p className="page-subtitle">{isEdit ? 'Update client details' : 'Add a new client to your directory'}</p>
          </div>
        </div>
        <button type="submit" className="btn btn-primary" disabled={saving}><Save size={16} />{saving ? 'Saving…' : 'Save Client'}</button>
      </div>

      <div className="card mb-4">
        <h2 className="card-title" style={{ marginBottom: '16px' }}>Basic Info</h2>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Client / Business Name *</label>
            <input className="form-control" value={form.name} onChange={(e) => setField('name', e.target.value)} placeholder="Acme Corp" />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" className="form-control" value={form.email} onChange={(e) => setField('email', e.target.value)} placeholder="client@example.com" />
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input className="form-control" value={form.phone} onChange={(e) => setField('phone', e.target.value)} placeholder="+91 9876543210" />
          </div>
          <div className="form-group">
            <label className="form-label">GSTIN</label>
            <input className="form-control" value={form.gstin} onChange={(e) => setField('gstin', e.target.value.toUpperCase())} placeholder="22AAAAA0000A1Z5" />
          </div>
          <div className="form-group">
            <label className="form-label">PAN</label>
            <input className="form-control" value={form.pan} onChange={(e) => setField('pan', e.target.value.toUpperCase())} placeholder="AAAAA0000A" />
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <h2 className="card-title" style={{ marginBottom: '16px' }}>Address</h2>
        <div className="form-group">
          <label className="form-label">Street / Building</label>
          <input className="form-control" value={form.address?.street} onChange={(e) => setAddr('street', e.target.value)} placeholder="123 MG Road" />
        </div>
        <div className="form-grid-3">
          <div className="form-group">
            <label className="form-label">City</label>
            <input className="form-control" value={form.address?.city} onChange={(e) => setAddr('city', e.target.value)} placeholder="Mumbai" />
          </div>
          <div className="form-group">
            <label className="form-label">State</label>
            <select className="form-control" value={form.address?.state} onChange={(e) => setAddr('state', e.target.value)}>
              <option value="">— Select —</option>
              {INDIA_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Pincode</label>
            <input className="form-control" value={form.address?.pincode} onChange={(e) => setAddr('pincode', e.target.value)} placeholder="400001" />
          </div>
        </div>
      </div>

    </form>
  );
}
