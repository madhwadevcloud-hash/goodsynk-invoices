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
  const [filter, setFilter] = useState('all');
  const [showNewMenu, setShowNewMenu] = useState(false);
  const navigate = useNavigate();

  const fetchProducts = () => {
    setLoading(true);
    productAPI.getAll().then((r) => setProducts(r.data.products)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(fetchProducts, []);

  const filteredProducts = products.filter((p) => {
    const matchesType =
      filter === 'all'
        ? true
        : filter === 'products'
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
    <div className="product-list-page">
      <style>{`
        .product-list-page {
          width: 100%;
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 16px 32px;
          box-sizing: border-box;
        }

        .product-list-page .page-header {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .product-list-page .page-title {
          font-size: clamp(1.15rem, 2.5vw, 1.6rem);
          margin: 0;
          word-break: break-word;
        }

        .product-list-page .page-subtitle {
          font-size: clamp(0.75rem, 1.5vw, 0.9rem);
          margin: 2px 0 0;
        }

        .product-list-page .new-menu-wrapper {
          position: relative;
          flex-shrink: 0;
        }

        .product-list-page .new-menu-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 8px;
          min-width: 150px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 12px;
          overflow: hidden;
          z-index: 1000;
          box-shadow: var(--shadow);
          padding: 4px 0;
        }

        .product-list-page .new-menu-item {
          width: 100%;
          padding: 10px 14px;
          background: transparent;
          border: none;
          color: var(--text-primary);
          text-align: left;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.85rem;
          display: block;
        }

        /* Filter bar */
        .product-list-page .product-filter-bar {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 14px 16px;
          border-bottom: 1px solid var(--border);
        }

        .product-list-page .product-search-input {
          width: 100%;
          box-sizing: border-box;
          font-size: 0.95rem;
        }

        .product-list-page .product-filter-tabs {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .product-list-page .product-filter-tabs .btn {
          flex: 1 1 auto;
          min-width: 80px;
          justify-content: center;
          white-space: nowrap;
        }

        /* Table wrapper */
        .product-list-page .table-wrapper {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          border-radius: var(--radius-lg);
        }

        .product-list-page table {
          width: 100%;
          min-width: 720px;
          border-collapse: collapse;
        }

        .product-list-page th,
        .product-list-page td {
          padding: 12px 14px;
          white-space: nowrap;
          font-size: 0.9rem;
          text-align: left;
        }

        .product-list-page th {
          font-size: 0.78rem;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          font-weight: 700;
        }

        /* Mobile card view for products */
        .product-list-page .mobile-cards {
          display: none;
          flex-direction: column;
          gap: 12px;
          padding: 12px;
        }

        .product-list-page .mobile-card {
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 14px;
          background: var(--bg-card);
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .product-list-page .mobile-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 10px;
        }

        .product-list-page .mobile-card-name {
          font-weight: 700;
          font-size: 1rem;
          word-break: break-word;
          flex: 1;
          min-width: 0;
        }

        .product-list-page .mobile-card-price {
          font-size: 1.05rem;
          font-weight: 700;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .product-list-page .mobile-card-meta {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px 12px;
          font-size: 0.82rem;
        }

        .product-list-page .mobile-card-meta-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        .product-list-page .mobile-card-meta-label {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: var(--text-muted);
          font-weight: 600;
        }

        .product-list-page .mobile-card-meta-value {
          font-weight: 500;
          word-break: break-word;
        }

        .product-list-page .mobile-card-actions {
          display: flex;
          gap: 8px;
          padding-top: 8px;
          border-top: 1px solid var(--border);
        }

        .product-list-page .mobile-card-actions .btn {
          flex: 1;
          justify-content: center;
          gap: 6px;
        }

        /* Mobile (default: show cards, hide table) */
        @media (max-width: 767px) {
          .product-list-page {
            padding: 0 10px 24px;
          }

          .product-list-page .page-header {
            flex-direction: column;
            align-items: stretch;
          }

          .product-list-page .new-menu-wrapper {
            width: 100%;
          }

          .product-list-page .new-menu-wrapper > .btn {
            width: 100%;
            justify-content: center;
          }

          .product-list-page .new-menu-dropdown {
            left: 0;
            right: 0;
            width: 100%;
          }

          .product-list-page .product-search-input {
            font-size: 16px; /* Prevent iOS zoom */
          }

          .product-list-page .table-wrapper {
            display: none;
          }

          .product-list-page .mobile-cards {
            display: flex;
          }
        }

        /* Tablet / Desktop: show table, hide cards */
        @media (min-width: 768px) {
          .product-list-page .product-filter-bar {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
          }

          .product-list-page .product-search-input {
            max-width: 380px;
          }

          .product-list-page .product-filter-tabs {
            flex-wrap: nowrap;
          }

          .product-list-page .product-filter-tabs .btn {
            flex: 0 0 auto;
          }
        }

        /* Small mobile adjustments */
        @media (max-width: 380px) {
          .product-list-page .mobile-card-meta {
            grid-template-columns: 1fr;
          }
        }

        /* Desktop enhancements */
        @media (min-width: 1024px) {
          .product-list-page {
            padding: 0 32px 40px;
          }

          .product-list-page .page-header {
            margin-bottom: 28px;
          }

          .product-list-page th,
          .product-list-page td {
            padding: 14px 16px;
          }

          .product-list-page .product-search-input {
            max-width: 440px;
          }
        }

        @media (min-width: 1440px) {
          .product-list-page {
            max-width: 1500px;
          }
        }
      `}</style>

      <div className="page-header">
        <div>
          <h1 className="page-title">Products &amp; Services</h1>
          <p className="page-subtitle">Reusable items for your invoices</p>
        </div>
        <div className="new-menu-wrapper">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowNewMenu(!showNewMenu)}
          >
            <Plus size={16} />
            {' '}New
          </button>

          {showNewMenu && (
            <div className="new-menu-dropdown">
              <button
                type="button"
                className="new-menu-item"
                onClick={() => { setShowNewMenu(false); navigate('/products/new?type=product'); }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-elevated)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                Product
              </button>

              <button
                type="button"
                className="new-menu-item"
                onClick={() => { setShowNewMenu(false); navigate('/products/new?type=service'); }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-elevated)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                Service
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="product-filter-bar">
          <input
            type="text"
            placeholder="Search products or services..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-control product-search-input"
          />

          <div className="product-filter-tabs">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className="btn btn-sm"
              style={{
                background: filter === 'all' ? 'var(--primary)' : 'transparent',
                color: filter === 'all' ? 'white' : 'var(--text-primary)'
              }}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilter('products')}
              className="btn btn-sm"
              style={{
                background: filter === 'products' ? 'var(--primary)' : 'transparent',
                color: filter === 'products' ? 'white' : 'var(--text-primary)'
              }}
            >
              Products
            </button>

            <button
              type="button"
              onClick={() => setFilter('services')}
              className="btn btn-sm"
              style={{
                background: filter === 'services' ? 'var(--primary)' : 'transparent',
                color: filter === 'services' ? 'white' : 'var(--text-primary)'
              }}
            >
              Services
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex-center" style={{ padding: '60px' }}>
            <div className="spinner" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="empty-state" style={{ padding: '80px 20px' }}>
            <div className="empty-state-icon">📦</div>
            <div className="empty-state-title">
              {search || filter !== 'all'
                ? 'No items match your search'
                : 'No items found'}
            </div>

            <div className="empty-state-desc">
              {search || filter !== 'all'
                ? 'Try changing the search text or filter'
                : 'Add products or services for quick invoice line items'}
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() =>
                navigate(
                  filter === 'services'
                    ? '/products/new?type=service'
                    : '/products/new?type=product'
                )
              }
            >
              <Plus size={15} />
              {filter === 'services'
                ? ' Add Service'
                : filter === 'products'
                  ? ' Add Product'
                  : ' Add Item'}
            </button>
          </div>
        ) : (
          <>
            {/* Desktop / tablet table */}
            <div className="table-wrapper" style={{ border: 'none', borderRadius: 'var(--radius-lg)' }}>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
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
                      <td style={{ fontWeight: 600, whiteSpace: 'normal', minWidth: '140px' }}>{p.name}</td>
                      <td>
                        <span className={`badge ${p.isService ? 'badge-sent' : 'badge-paid'}`}>
                          {p.isService ? 'Service' : 'Product'}
                        </span>
                      </td>
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
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => navigate(`/products/${p._id}/edit`)}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--danger)' }}
                            onClick={() => handleDelete(p._id)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card view */}
            <div className="mobile-cards">
              {filteredProducts.map((p) => (
                <div key={p._id} className="mobile-card">
                  <div className="mobile-card-header">
                    <div className="mobile-card-name">{p.name}</div>
                    <div className="mobile-card-price">{fmt(p.price)}</div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <span className={`badge ${p.isService ? 'badge-sent' : 'badge-paid'}`}>
                      {p.isService ? 'Service' : 'Product'}
                    </span>
                    {!p.isService && p.unit && (
                      <span className="badge" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                        {p.unit}
                      </span>
                    )}
                  </div>

                  <div className="mobile-card-meta">
                    <div className="mobile-card-meta-item">
                      <span className="mobile-card-meta-label">CGST</span>
                      <span className="mobile-card-meta-value">{p.cgstRate || 0}%</span>
                    </div>
                    <div className="mobile-card-meta-item">
                      <span className="mobile-card-meta-label">SGST</span>
                      <span className="mobile-card-meta-value">{p.sgstRate || 0}%</span>
                    </div>
                    <div className="mobile-card-meta-item">
                      <span className="mobile-card-meta-label">IGST</span>
                      <span className="mobile-card-meta-value">{p.igstRate || 0}%</span>
                    </div>
                    <div className="mobile-card-meta-item">
                      <span className="mobile-card-meta-label">
                        {p.isService ? 'SAC' : 'HSN'}
                      </span>
                      <span className="mobile-card-meta-value">{p.hsn || '—'}</span>
                    </div>
                  </div>

                  <div className="mobile-card-actions">
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => navigate(`/products/${p._id}/edit`)}
                    >
                      <Pencil size={14} /> Edit
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--danger)' }}
                      onClick={() => handleDelete(p._id)}
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
