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
    <form onSubmit={handleSubmit} className="product-form">
      <style>{`
        .product-form {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 16px 32px;
          box-sizing: border-box;
        }

        .product-form .page-header {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .product-form .page-header-left {
          display: flex;
          gap: 12px;
          align-items: center;
          min-width: 0;
          flex: 1 1 auto;
        }

        .product-form .page-title {
          font-size: clamp(1.1rem, 2.5vw, 1.5rem);
          margin: 0;
          word-break: break-word;
        }

        .product-form .page-subtitle {
          font-size: clamp(0.75rem, 1.5vw, 0.875rem);
          margin: 2px 0 0;
        }

        .product-form .form-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }

        .product-form .form-grid-3 {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }

        .product-form .form-row-responsive {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
          margin-top: 0;
        }

        .product-form .form-group {
          min-width: 0;
        }

        .product-form .form-label {
          display: block;
          margin-bottom: 6px;
          font-size: 0.85rem;
          font-weight: 500;
          word-break: break-word;
        }

        .product-form .form-control {
          width: 100%;
          box-sizing: border-box;
          font-size: 0.95rem;
          padding: 10px 12px;
          min-height: 42px;
        }

        .product-form textarea.form-control {
          min-height: 120px;
          resize: vertical;
          line-height: 1.5;
        }

        .product-form .card {
          padding: 16px;
          margin-bottom: 16px;
          box-sizing: border-box;
        }

        .product-form .card-title {
          font-size: clamp(1rem, 2vw, 1.25rem);
        }

        .product-form .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .product-form .save-btn-mobile {
          width: 100%;
          justify-content: center;
        }

        /* Small mobile adjustments */
        @media (max-width: 480px) {
          .product-form {
            padding: 0 10px 24px;
          }

          .product-form .page-header {
            flex-direction: column;
            align-items: stretch;
          }

          .product-form .page-header-left {
            width: 100%;
          }

          .product-form .btn-primary {
            width: 100%;
            justify-content: center;
            padding: 12px 16px;
          }

          .product-form .card {
            padding: 14px 12px;
            border-radius: 10px;
          }

          .product-form .form-control {
            font-size: 16px; /* Prevents iOS zoom on focus */
            padding: 10px 12px;
          }

          .product-form textarea.form-control {
            min-height: 140px;
          }
        }

        /* Tablet / small desktop */
        @media (min-width: 640px) {
          .product-form {
            padding: 0 20px 32px;
          }

          .product-form .form-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .product-form .form-grid-3 {
            grid-template-columns: repeat(3, 1fr);
          }

          .product-form .form-row-responsive {
            grid-template-columns: repeat(2, 1fr);
          }

          .product-form .card {
            padding: 20px;
            margin-bottom: 20px;
          }
        }

        /* Desktop */
        @media (min-width: 1024px) {
          .product-form {
            padding: 0 32px 40px;
          }

          .product-form .page-header {
            margin-bottom: 28px;
          }

          .product-form .card {
            padding: 28px;
            margin-bottom: 24px;
          }

          .product-form .form-grid {
            gap: 20px;
          }

          .product-form .form-grid-3 {
            gap: 20px;
          }

          .product-form .form-row-responsive {
            gap: 20px;
          }

          .product-form textarea.form-control {
            min-height: 160px;
          }

          .product-form .form-control {
            padding: 12px 14px;
            min-height: 46px;
          }

          .product-form .form-label {
            font-size: 0.9rem;
          }
        }

        /* Very large screens - constrain width for readability */
        @media (min-width: 1440px) {
          .product-form {
            max-width: 1280px;
          }

          .product-form textarea.form-control {
            min-height: 180px;
          }
        }

        /* Dynamic columns based on product/service type */
        .product-form .form-row-dynamic {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }

        @media (min-width: 640px) {
          .product-form .form-row-dynamic.cols-5 {
            grid-template-columns: repeat(2, 1fr);
          }
          .product-form .form-row-dynamic.cols-3 {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .product-form .form-row-dynamic.cols-5 {
            grid-template-columns: repeat(5, 1fr);
          }
        }
      `}</style>

      <div className="page-header">
        <div className="page-header-left">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => navigate('/products')}
          >
            <ArrowLeft size={16} />
          </button>
          <div style={{ minWidth: 0 }}>
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
        <button
          type="submit"
          className="btn btn-primary"
          disabled={saving}
        >
          <Save size={16} />
          {saving
            ? 'Saving...'
            : form.isService
              ? 'Save Service'
              : 'Save Product'}
        </button>
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

        <div className="form-group" style={{ marginTop: '16px' }}>
          <label className="form-label">Description</label>
          <textarea
            className="form-control"
            rows={6}
            value={form.description}
            onChange={(e) => setField('description', e.target.value)}
            placeholder="Enter a detailed description..."
          />
        </div>

        <div
          className={`form-row-dynamic ${form.isService ? 'cols-3' : 'cols-5'}`}
          style={{ marginTop: '16px' }}
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
                  onChange={(e) => setField('qty', e.target.value)}
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
              onChange={(e) => setField('price', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Discount Type</label>
            <select
              className="form-control"
              value={form.discountType}
              onChange={(e) => setField('discountType', e.target.value)}
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
              onChange={(e) => setField('discountValue', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title" style={{ marginBottom: '16px' }}>
          Default GST Rates
        </h2>
        <p
          className="text-sm text-muted"
          style={{ marginBottom: '14px' }}
        >
          These will be auto-filled when this product is added to an invoice.
        </p>
        <div className="form-grid-3">
          <div className="form-group">
            <label className="form-label">CGST % (intrastate)</label>
            <input
              type="number"
              className="form-control"
              value={form.cgstRate}
              min={0}
              max={50}
              onChange={(e) => setField('cgstRate', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">SGST % (intrastate)</label>
            <input
              type="number"
              className="form-control"
              value={form.sgstRate}
              min={0}
              max={50}
              onChange={(e) => setField('sgstRate', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">IGST % (interstate)</label>
            <input
              type="number"
              className="form-control"
              value={form.igstRate}
              min={0}
              max={50}
              onChange={(e) => setField('igstRate', e.target.value)}
            />
          </div>
        </div>
      </div>
    </form>
  );
}
