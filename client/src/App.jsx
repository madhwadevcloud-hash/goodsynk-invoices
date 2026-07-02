import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// App pages
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/dashboard/Dashboard';
import InvoiceList from './pages/invoices/InvoiceList';
import InvoiceForm from './pages/invoices/InvoiceForm';
import InvoiceView from './pages/invoices/InvoiceView';
import QuotationList from './pages/quotations/QuotationList';
import ClientList from './pages/clients/ClientList';
import ClientForm from './pages/clients/ClientForm';
import ProductList from './pages/products/ProductList';
import ProductForm from './pages/products/ProductForm';
import ProfileEdit from './pages/profile/ProfileEdit';
import ProfileSetup from './pages/profile/ProfileSetup';
import Templates from './pages/settings/Templates';
import Home from './pages/home/Home';

// ── Guards ──────────────────────────────────────────────────────────────────

// Requires authentication
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loader"><div className="spinner" /></div>;
  return user ? children : <Navigate to="/" replace />;
};

// Public-only (redirect to /dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loader"><div className="spinner" /></div>;
  return !user ? children : <Navigate to="/dashboard" replace />;
};

// Requires authentication AND a complete profile (businessName set)
const ProfileGuard = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loader"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/" replace />;
  if (!user.businessName) return <Navigate to="/profile-setup" replace />;
  return children;
};

// ── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <Routes>

      {/* Homepage — always accessible */}
      <Route path="/" element={<Home />} />

      {/* Public auth routes */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      {/* Profile setup — requires token but not a complete profile */}
      <Route
        path="/profile-setup"
        element={<ProtectedRoute><ProfileSetup /></ProtectedRoute>}
      />

      {/* Protected app routes — requires auth AND complete profile */}
      <Route element={<ProfileGuard><AppLayout /></ProfileGuard>}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="profile" element={<ProfileEdit />} />
        <Route path="templates" element={<Templates />} />

        <Route path="invoices" element={<InvoiceList />} />
        <Route path="invoices/new" element={<InvoiceForm />} />
        <Route path="invoices/:id/edit" element={<InvoiceForm />} />
        <Route path="invoices/:id" element={<InvoiceView />} />

        <Route path="quotations" element={<QuotationList />} />
        <Route path="quotations/new" element={<InvoiceForm />} />
        <Route path="quotations/:id/edit" element={<InvoiceForm />} />
        <Route path="quotations/:id" element={<InvoiceView />} />

        <Route path="clients" element={<ClientList />} />
        <Route path="clients/new" element={<ClientForm />} />
        <Route path="clients/:id/edit" element={<ClientForm />} />

        <Route path="products" element={<ProductList />} />
        <Route path="products/new" element={<ProductForm />} />
        <Route path="products/:id/edit" element={<ProductForm />} />
      </Route>

      {/* Catch-all → Home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
