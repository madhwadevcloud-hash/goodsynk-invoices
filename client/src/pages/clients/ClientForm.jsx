import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { clientAPI, invoiceAPI } from '../../api/services';
import toast from 'react-hot-toast';
import { Save, ArrowLeft } from 'lucide-react';

const INDIA_STATES = ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Puducherry'];

export default function ClientForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isEdit = !!id;
  const returnTo = location.state?.returnTo; // e.g. '/quotations/new', set by InvoiceForm's "Create Client"
  const formDraft = location.state?.formDraft;
  const clientDraft = location.state?.clientDraft;

  const [saving, setSaving] = useState(false);
  const [checkingLimit, setCheckingLimit] = useState(false);
  const [form, setForm] = useState({
    name: clientDraft?.name || '',
    email: clientDraft?.email || '',
    phone: clientDraft?.phone || '',
    gstin: clientDraft?.gstin || '',
    pan: clientDraft?.pan || '',
    notes: clientDraft?.notes || '',
    address: {
      street: clientDraft?.address?.street || '',
      city: clientDraft?.address?.city || '',
      state: clientDraft?.address?.state || '',
      pincode: clientDraft?.address?.pincode || '',
      country: clientDraft?.address?.country || 'India',
    },
  });

  useEffect(() => {
    if (!isEdit) {
      setCheckingLimit(true);
      invoiceAPI.getUsage()
        .then((res) => {
          const { clients, clientsLimit, plan } = res.data.usage;
          if (clientsLimit !== null && clientsLimit !== undefined && clientsLimit !== Infinity) {
            if (clients >= clientsLimit) {
              toast.error(`Your ${plan} plan allows up to ${clientsLimit} clients per month. Upgrade to add more.`, { id: 'client-limit-toast' });
              navigate('/upgrade');
            }
          }
        })
        .catch((err) => {
          console.error('Failed to load usage limits:', err);
        })
        .finally(() => {
          setCheckingLimit(false);
        });
    }
  }, [isEdit, navigate]);

  useEffect(() => {
    if (isEdit) {
      clientAPI.getById(id).then((r) => setForm(r.data.client)).catch(() => { toast.error('Client not found'); navigate('/clients'); });
    } else if (clientDraft) {
      setForm((f) => ({
        ...f,
        ...clientDraft,
        address: { ...f.address, ...(clientDraft.address || {}) },
      }));
    }
  }, [id]);

  const setField = (key, val) => setForm((f) => ({ ...f, [key]: val }));
  const setAddr = (key, val) => setForm((f) => ({ ...f, address: { ...f.address, [key]: val } }));

  const goBack = () => navigate(returnTo || '/clients', returnTo ? { state: { formDraft } } : undefined);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) return toast.error('Client name is required');
    if (form.phone && !/^[0-9]{10}$/.test(form.phone)) {
      return toast.error('Phone number must be exactly 10 digits');
    }
    if (form.gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(form.gstin)) {
      return toast.error('Invalid GSTIN format (e.g. 29ABCDE1234F1Z5)');
    }
    if (form.pan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(form.pan)) {
      return toast.error('Invalid PAN format (e.g. ABCDE1234F)');
    }
    if (form.address?.pincode && !/^[0-9]{6}$/.test(form.address.pincode)) {
      return toast.error('Pincode must be exactly 6 digits');
    }
    setSaving(true);
    try {
      if (isEdit) {
        await clientAPI.update(id, form);
        toast.success('Client updated');
        navigate('/clients');
      } else {
        const res = await clientAPI.create(form);
        toast.success('Client added');
        if (returnTo) {
          // Send the new client back to the quotation/invoice form the user came from
          navigate(returnTo, {
            state: {
              newClientId: res.data.client._id,
              newClientName: res.data.client.name,
              formDraft,
            },
          });
        } else {
          navigate('/clients');
        }
      }
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.code === 'PLAN_LIMIT_CLIENTS') {
        toast.error(err.response.data.message, { id: 'client-limit-toast' });
        navigate('/upgrade');
        return;
      }
      toast.error(err.response?.data?.message || 'Failed to save client');
    }
    finally { setSaving(false); }
  };

  if (checkingLimit) {
    return <div className="page-loader"><div className="spinner" /></div>;
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="page-header">
        <div className="flex gap-3" style={{ alignItems: 'center' }}>
          <button type="button" className="btn btn-ghost btn-sm" onClick={goBack}><ArrowLeft size={16} /></button>
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
            <input className="form-control" value={form.phone} onChange={(e) => setField('phone', e.target.value.replace(/[^0-9]/g, '').slice(0, 10))} placeholder="9876543210" />
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
            <input className="form-control" value={form.address?.pincode} onChange={(e) => setAddr('pincode', e.target.value.replace(/[^0-9]/g, '').slice(0, 6))} placeholder="400001" />
          </div>
        </div>
      </div>

    </form>
  );
}