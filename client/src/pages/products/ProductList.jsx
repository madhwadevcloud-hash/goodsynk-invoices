import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { productAPI } from '../../api/services';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2 } from 'lucide-react';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n || 0);

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('products');
  const [showNewMenu, setShowNewMenu] = useState(false);
  const navigate = useNavigate();

  const fetchProducts = () => {
    setLoading(true);
    productAPI.getAll().then((r) => setProducts(r.data.products)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(fetchProducts, []);
  const filteredProducts = products.filter((p) => {
    const matchesType =
      filter === 'products'
        ? !p.isService
        : p.isService;

    const matchesSearch =
      p.name?.toLowerCase().includes(search.toLowerCase());

    return matchesType && matchesSearch;
  });

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
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowNewMenu(!showNewMenu)}
          >
            <Plus size={16} />
            {' '}New
          </button>

          {showNewMenu && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '8px',
                minWidth: '160px',
                background: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                overflow: 'hidden',
                zIndex: 1000,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }}
            >
              <button
                type="button"
                className="btn btn-ghost"
                style={{
                  width: '100%',
                  justifyContent: 'flex-start',
                  borderRadius: 0
                }}
                onClick={() => navigate('/products/new?type=product')}
              >
                Product
              </button>

              <button
                type="button"
                className="btn btn-ghost"
                style={{
                  width: '100%',
                  justifyContent: 'flex-start',
                  borderRadius: 0
                }}
                onClick={() => navigate('/products/new?type=service')}
              >
                Service
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            marginBottom: '16px',
            flexWrap: 'wrap'
          }}
        >
          <input
            type="text"
            placeholder={
              filter === 'products'
                ? 'Search products...'
                : 'Search services...'
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-control"
            style={{
              width: '420px'
            }}
          />

          <div
            style={{
              display: 'flex',
              borderRadius: '10px',
              padding: '4px',
              background: 'var(--bg-secondary)'
            }}
          >
            <button
              type="button"
              onClick={() => setFilter('products')}
              className="btn btn-sm"
              style={{
                background:
                  filter === 'products'
                    ? 'var(--primary)'
                    : 'transparent',
                color:
                  filter === 'products'
                    ? 'white'
                    : 'var(--text-primary)'
              }}
            >
              Products
            </button>

            <button
              type="button"
              onClick={() => setFilter('services')}
              className="btn btn-sm"
              style={{
                background:
                  filter === 'services'
                    ? 'var(--primary)'
                    : 'transparent',
                color:
                  filter === 'services'
                    ? 'white'
                    : 'var(--text-primary)'
              }}
            >
              Services
            </button>
          </div>
        </div>
        {loading ? (
          <div className="flex-center" style={{ padding: '60px' }}><div className="spinner" /></div>
        ) : filteredProducts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📦</div>
            <div className="empty-state-title">
              No {filter} found
            </div>
            <div className="empty-state-desc">Add products or services for quick invoice line items</div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() =>
                navigate(
                  filter === 'products'
                    ? '/products/new?type=product'
                    : '/products/new?type=service'
                )
              }
            >
              <Plus size={15} />
              {filter === 'products' ? ' Add Product' : ' Add Service'}
            </button>
          </div>
        ) : (
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 'var(--radius-lg)' }}>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Price</th>
                  <th>Unit</th>
                  <th>CGST%</th>
                  <th>SGST%</th>
                  <th>IGST%</th>
                  <th>HSN/SAC</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => (
                  <tr key={p._id}>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td>{fmt(p.price)}</td>
                    <td className="text-muted">
                      {p.isService ? '—' : p.unit}
                    </td>
                    <td>{p.cgstRate || 0}%</td>
                    <td>{p.sgstRate || 0}%</td>
                    <td>{p.igstRate || 0}%</td>
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
