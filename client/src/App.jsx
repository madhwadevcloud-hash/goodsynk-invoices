import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { isProfileComplete } from './utils/profileValidation';

const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));

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
const UpgradePage = lazy(() => import('./pages/upgrade/UpgradePage'));

const PublicDocumentView = lazy(() => import('./pages/public/PublicDocumentView'));

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="page-loader"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/" replace />;
  if (location.pathname !== '/login' && location.pathname !== '/register' && location.pathname !== '/profile-setup') {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loader"><div className="spinner" /></div>;
  if (user) {
    if (!user.businessName) return <Navigate to="/profile-setup" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

const ProfileGuard = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loader"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/" replace />;
  return children;
};

const RequireProfile = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loader"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/" replace />;
  if (!isProfileComplete(user)) return <Navigate to="/profile" replace />;
  return children;
};

const PageFallback = () => <div className="page-loader"><div className="spinner" /></div>;

export default function App() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/share/:docType/:token" element={<PublicDocumentView />} />

        <Route
          path="/profile-setup"
          element={<ProtectedRoute><ProfileSetup /></ProtectedRoute>}
        />

        <Route element={<ProfileGuard><AppLayout /></ProfileGuard>}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="profile" element={<ProfileEdit />} />
          <Route path="templates" element={<Templates />} />
          <Route path="upgrade" element={<UpgradePage />} />

          <Route path="invoices" element={<InvoiceList />} />
          <Route path="invoices/new" element={<RequireProfile><InvoiceForm /></RequireProfile>} />
          <Route path="invoices/:id/edit" element={<RequireProfile><InvoiceForm /></RequireProfile>} />
          <Route path="invoices/:id" element={<InvoiceView />} />

          <Route path="quotations" element={<QuotationList />} />
          <Route path="quotations/new" element={<RequireProfile><InvoiceForm /></RequireProfile>} />
          <Route path="quotations/:id/edit" element={<RequireProfile><InvoiceForm /></RequireProfile>} />
          <Route path="quotations/:id" element={<InvoiceView />} />

          <Route path="clients" element={<ClientList />} />
          <Route path="clients/new" element={<ClientForm />} />
          <Route path="clients/:id/edit" element={<ClientForm />} />

          <Route path="products" element={<ProductList />} />
          <Route path="products/new" element={<ProductForm />} />
          <Route path="products/:id/edit" element={<ProductForm />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}