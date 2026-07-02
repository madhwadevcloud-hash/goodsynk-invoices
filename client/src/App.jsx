import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Auth pages
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));

// App pages
const AppLayout = lazy(() => import('./components/layout/AppLayout'));
const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'));
const InvoiceList = lazy(() => import('./pages/invoices/InvoiceList'));
const InvoiceForm = lazy(() => import('./pages/invoices/InvoiceForm'));
const InvoiceView = lazy(() => import('./pages/invoices/InvoiceView'));
const QuotationList = lazy(() => import('./pages/quotations/QuotationList'));
const ClientList = lazy(() => import('./pages/clients/ClientList'));
const ClientForm = lazy(() => import('./pages/clients/ClientForm'));
const ProductList = lazy(() => import('./pages/products/ProductList'));
const ProductForm = lazy(() => import('./pages/products/ProductForm'));
const ProfileEdit = lazy(() => import('./pages/profile/ProfileEdit'));
const ProfileSetup = lazy(() => import('./pages/profile/ProfileSetup'));
const Templates = lazy(() => import('./pages/settings/Templates'));
const Home = lazy(() => import('./pages/home/Home'));

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

// Shared fallback shown while any lazy chunk is loading
const PageFallback = () => <div className="page-loader"><div className="spinner" /></div>;

// ── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <Suspense fallback={<PageFallback />}>
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
    </Suspense>
  );
}
