import { useState, useEffect } from 'react';
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
import { isProfileComplete } from '../../utils/profileValidation';

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
  const [showProfilePrompt, setShowProfilePrompt] = useState(false);

  // Removed aggressive auto-popup on mount to avoid annoying users on every page load
  // useEffect(() => {
  //   if (user && !isProfileComplete(user)) {
  //     setShowProfilePrompt(true);
  //   } else {
  //     setShowProfilePrompt(false);
  //   }
  // }, [user]);

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
          <span className="sidebar-logo-text">Goodsynk Invoices</span>
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
          <Outlet context={{ setShowProfilePrompt }} />
        </main>
      </div>

      {/* Profile Completion Popup */}
      {showProfilePrompt && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            padding: '30px',
            borderRadius: 'var(--radius-lg)',
            maxWidth: '450px',
            textAlign: 'center',
            boxShadow: 'var(--shadow)',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowProfilePrompt(false)}
              style={{
                position: 'absolute', top: '10px', right: '15px',
                background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer',
                color: 'var(--text-muted)'
              }}
            >&times;</button>
            <div style={{
              width: 50, height: 50, borderRadius: '50%', background: 'rgba(99,102,241,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px', color: 'var(--primary)'
            }}>
              <UserCircle2 size={24} />
            </div>
            <h3 style={{ marginBottom: '15px', fontSize: '1.25rem' }}>Complete your profile</h3>
            <p style={{ marginBottom: '25px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              Complete your company details to be able to generate quotations and invoices.
            </p>
            <button className="btn btn-primary w-full btn-lg" style={{ justifyContent: 'center' }} onClick={() => {
              setShowProfilePrompt(false);
              navigate('/profile');
            }}>
              Complete Profile
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
