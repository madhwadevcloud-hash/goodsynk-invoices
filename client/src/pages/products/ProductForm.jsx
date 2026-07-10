import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { productAPI } from '../../api/services';
import toast from 'react-hot-toast';
import { Save, ArrowLeft } from 'lucide-react';

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const isEdit = !!id;
  const formType = searchParams.get('type');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    qty: 1,
    unit: 'pcs',
    discountType: 'percentage',
    discountValue: '',
    cgstRate: '',
    sgstRate: '',
    igstRate: '',
    hsn: '',
    isService: formType === 'service',
  });

  useEffect(() => {
    if (isEdit) {
      productAPI.getById(id).then((r) => setForm(r.data.product)).catch(() => { toast.error('Product not found'); navigate('/products'); });
    }
  }, [id]);

  const setField = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) return toast.error('Product name is required');
    setSaving(true);
    try {
      if (isEdit) { await productAPI.update(id, form); toast.success('Product updated'); }
      else { await productAPI.create(form); toast.success('Product added'); }
      navigate('/products');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save product'); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="page-header">
        <div className="flex gap-3" style={{ alignItems: 'center' }}>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate('/products')}><ArrowLeft size={16} /></button>
          <div>
            <h1 className="page-title">
              {isEdit
                ? (form.isService ? 'Edit Service' : 'Edit Product')
                : (form.isService ? 'New Service' : 'New Product')}
            </h1>
            <p className="page-subtitle">
              {isEdit
                ? 'Update details'
                : form.isService
                  ? 'Add a service for quick use in invoices'
                  : 'Add a product for quick use in invoices'}
            </p>
          </div>
        </div>
        <button type="submit" className="btn btn-primary" disabled={saving}><Save size={16} />{saving
          ? 'Saving...'
          : form.isService
            ? 'Save Service'
            : 'Save Product'}</button>
      </div>

      <div className="card mb-4">
        <h2 className="card-title" style={{ marginBottom: '16px' }}>
          {form.isService ? 'Service Details' : 'Product Details'}
        </h2>

        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">
              {form.isService ? 'Service Name *' : 'Product Name *'}
            </label>
            <input
              className="form-control"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              {form.isService ? 'SAC Code' : 'HSN Code'}
            </label>
            <input
              className="form-control"
              value={form.hsn}
              onChange={(e) => setField('hsn', e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea
            className="form-control"
            rows={2}
            value={form.description}
            onChange={(e) => setField('description', e.target.value)}
          />
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: form.isService
              ? '1fr 1fr 1fr'
              : '1fr 1fr 1fr 1fr 1fr',
            gap: '16px'
          }}
        >
          {!form.isService && (
            <>
              <div className="form-group">
                <label className="form-label">Qty</label>
                <input
                  type="number"
                  className="form-control"
                  min={1}
                  value={form.qty}
                  onChange={(e) =>
                    setField('qty', e.target.value)
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">Unit</label>
                <select
                  className="form-control"
                  value={form.unit}
                  onChange={(e) => setField('unit', e.target.value)}
                >
                  {['pcs', 'hrs', 'days', 'kg', 'm', 'ft', 'ltr', 'box', 'set']
                    .map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                </select>
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label">Price (₹)</label>
            <input
              type="number"
              className="form-control"
              value={form.price}
              min={0}
              onChange={(e) =>
                setField('price', e.target.value)
              }
            />
          </div>

          <div className="form-group">
            <label className="form-label">Discount Type</label>
            <select
              className="form-control"
              value={form.discountType}
              onChange={(e) =>
                setField('discountType', e.target.value)
              }
            >
              <option value="percentage">Percentage (%)</option>
              <option value="amount">Amount (₹)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              {form.discountType === 'percentage'
                ? 'Discount %'
                : 'Discount Amount'}
            </label>
            <input
              type="number"
              className="form-control"
              value={form.discountValue}
              min={0}
              onChange={(e) =>
                setField('discountValue', e.target.value)
              }
            />
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title" style={{ marginBottom: '16px' }}>Default GST Rates</h2>
        <p className="text-sm text-muted mb-4" style={{ marginBottom: '14px' }}>These will be auto-filled when this product is added to an invoice.</p>
        <div className="form-grid-3">
          <div className="form-group">
            <label className="form-label">CGST % (intrastate)</label>
            <input type="number" className="form-control" value={form.cgstRate} min={0} max={50} onChange={(e) => setField('cgstRate', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">SGST % (intrastate)</label>
            <input type="number" className="form-control" value={form.sgstRate} min={0} max={50} onChange={(e) => setField('sgstRate', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">IGST % (interstate)</label>
            <input type="number" className="form-control" value={form.igstRate} min={0} max={50} onChange={(e) => setField('igstRate', e.target.value)} />
          </div>
        </div>
      </div>
    </form>
  );
}
