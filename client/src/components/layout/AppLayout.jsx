import { Outlet, NavLink, useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  FileText,
  Users,
  Package,
  LogOut,
  Receipt,
  UserCircle2,
  ClipboardList,
  Palette,
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/invoices', icon: FileText, label: 'Invoices' },
  { to: '/quotations', icon: ClipboardList, label: 'Quotations' },
  { to: '/clients', icon: Users, label: 'Clients' },
  { to: '/products', icon: Package, label: 'Products & Services' },
  { to: '/templates', icon: Palette, label: 'Invoice Templates' },
  { to: '/profile', icon: UserCircle2, label: 'My Profile' },
];

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/invoices': 'Invoices',
  '/invoices/new': 'New Invoice',
  '/quotations': 'Quotations',
  '/quotations/new': 'New Quotation',
  '/clients': 'Clients',
  '/clients/new': 'New Client',
  '/products': 'Products & Services',
  '/products/new': 'New Product',
  '/templates': 'Invoice Templates',
  '/profile': 'My Profile',
};

export default function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/'); };

  const title =
    Object.entries(pageTitles).find(([k]) => location.pathname.startsWith(k))?.[1] || 'Invoice Generator';

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <Link to="/" className="sidebar-logo" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="sidebar-logo-icon">
            <Receipt size={18} />
          </div>
          <span className="sidebar-logo-text">InvoiceGen</span>
        </Link>

        <nav className="sidebar-nav">
          <span className="nav-section-label">Main Menu</span>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-card">
            <div className="user-avatar">{initials}</div>
            <div className="user-info">
              <div className="user-name">{user?.businessName || user?.name}</div>
              <div className="user-email">{user?.email}</div>
            </div>
          </div>
          <button
            className="btn btn-ghost w-full mt-2"
            style={{ justifyContent: 'flex-start', gap: '8px', padding: '8px 10px' }}
            onClick={handleLogout}
          >
            <LogOut size={15} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="main-content">
        <header className="topbar">
          <span className="topbar-title">{title}</span>
          <ThemeToggle />
        </header>
        <main className="page-container">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
