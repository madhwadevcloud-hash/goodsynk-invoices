import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { productAPI } from '../../api/services';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n || 0);

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchProducts = () => {
    setLoading(true);
    productAPI.getAll().then((r) => setProducts(r.data.products)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(fetchProducts, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    try {
      await productAPI.delete(id);
      toast.success('Product deleted');
      fetchProducts();
    } catch { toast.error('Failed to delete product'); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Products & Services</h1>
          <p className="page-subtitle">Reusable items for your invoices</p>
        </div>
        <Link to="/products/new" className="btn btn-primary"><Plus size={16} /> New Product</Link>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="flex-center" style={{ padding: '60px' }}><div className="spinner" /></div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📦</div>
            <div className="empty-state-title">No products yet</div>
            <div className="empty-state-desc">Add products or services for quick invoice line items</div>
            <Link to="/products/new" className="btn btn-primary"><Plus size={15} /> Add Product</Link>
          </div>
        ) : (
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 'var(--radius-lg)' }}>
            <table>
              <thead>
                <tr><th>Name</th><th>Type</th><th>Price</th><th>Unit</th><th>CGST%</th><th>SGST%</th><th>IGST%</th><th>HSN/SAC</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p._id}>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td><span className={`badge ${p.isService ? 'badge-sent' : 'badge-paid'}`}>{p.isService ? 'Service' : 'Goods'}</span></td>
                    <td>{fmt(p.price)}</td>
                    <td className="text-muted">{p.unit}</td>
                    <td>{p.cgstRate}%</td>
                    <td>{p.sgstRate}%</td>
                    <td>{p.igstRate}%</td>
                    <td className="text-muted">{p.hsn || '—'}</td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/products/${p._id}/edit`)}><Pencil size={14} /></button>
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(p._id)}><Trash2 size={14} /></button>
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
