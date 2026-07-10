import { useNavigate, Link } from 'react-router-dom';
import { Receipt, FileText, Users, Package, Zap, ShieldCheck, TrendingUp, ArrowRight } from 'lucide-react';
import ThemeToggle from '../../components/layout/ThemeToggle';

const features = [
  {
    icon: FileText,
    color: 'var(--primary)',
    bg: 'var(--primary-bg)',
    title: 'Professional Invoices',
    desc: 'Create GST-compliant tax invoices in seconds with auto-calculated totals, CGST, SGST & IGST.',
  },
  {
    icon: Users,
    color: 'var(--success)',
    bg: 'var(--success-bg)',
    title: 'Client Management',
    desc: 'Store and manage all your client details, addresses, and GSTIN in one place.',
  },
  {
    icon: Package,
    color: 'var(--info)',
    bg: 'var(--info-bg)',
    title: 'Product Catalogue',
    desc: 'Build a reusable catalogue of products and services with HSN codes and pricing.',
  },
  {
    icon: TrendingUp,
    color: 'var(--warning)',
    bg: 'var(--warning-bg)',
    title: 'Business Analytics',
    desc: 'Track revenue, outstanding payments, and invoice statuses from a clean dashboard.',
  },
  {
    icon: Zap,
    color: '#a855f7',
    bg: 'rgba(168,85,247,0.1)',
    title: 'PDF Downloads',
    desc: 'Download any invoice as a formatted PDF with one click — ready to send to clients.',
  },
  {
    icon: ShieldCheck,
    color: 'var(--success)',
    bg: 'var(--success-bg)',
    title: 'Secure & Private',
    desc: 'Your data stays yours. JWT-based auth ensures only you can access your invoices.',
  },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text-primary)', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ── Navbar ── */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 48px',
        height: '64px',
        background: 'var(--sidebar-bg)',
        borderBottom: '1px solid var(--border)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        {/* Logo */}
        <Link to="/" className="sidebar-logo" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="sidebar-logo-icon">
            <Receipt size={18} />
          </div>
          <span className="sidebar-logo-text">Goodsynk</span>
        </Link>

        {/* Nav actions */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <ThemeToggle />
          <Link to="/login" className="btn btn-ghost btn-sm">Sign In</Link>
          <button onClick={() => navigate('/register')} className="btn btn-primary btn-sm">
            Get Started <ArrowRight size={14} />
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{
        textAlign: 'center',
        padding: '100px 24px 80px',
        background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.18) 0%, transparent 65%)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Glow blob */}
        <div style={{
          position: 'absolute', top: -80, left: '50%', transform: 'translateX(-50%)',
          width: 560, height: 560,
          background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'var(--primary-bg)', border: '1px solid rgba(99,102,241,0.3)',
          borderRadius: 20, padding: '5px 14px', marginBottom: 28,
          fontSize: '0.8rem', color: 'var(--primary-light)', fontWeight: 500,
        }}>
          <Zap size={13} /> Invoice smarter, get paid faster
        </div>

        <h1 style={{
          fontSize: 'clamp(2.2rem, 5vw, 3.6rem)',
          fontWeight: 800,
          lineHeight: 1.15,
          letterSpacing: '-0.02em',
          maxWidth: 720,
          margin: '0 auto 20px',
        }}>
          Create{' '}
          <span style={{
            background: 'linear-gradient(135deg, var(--primary-light), #818cf8)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Professional Invoices
          </span>
          {' '}in Seconds
        </h1>

        <p style={{
          fontSize: '1.1rem',
          color: 'var(--text-secondary)',
          maxWidth: 520,
          margin: '0 auto 40px',
          lineHeight: 1.7,
        }}>
          GST-compliant tax invoices, client management, product catalogue and business analytics — all in one place.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/register')} className="btn btn-primary btn-lg">
            Start for Free <ArrowRight size={16} />
          </button>
          <button onClick={() => navigate('/login')} className="btn btn-secondary btn-lg">
            Sign In
          </button>
        </div>

        {/* Stats strip */}
        <div style={{
          display: 'flex', gap: 40, justifyContent: 'center',
          marginTop: 64, flexWrap: 'wrap',
        }}>
          {[['GST Ready', 'CGST · SGST · IGST'], ['PDF Export', 'One-click download'], ['Multi-client', 'Unlimited clients']].map(([title, sub]) => (
            <div key={title} style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{title}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section style={{ padding: '72px 48px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 10 }}>Everything you need</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
            A complete toolkit for freelancers and small businesses to manage their billing.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 20,
        }}>
          {features.map(({ icon: Icon, color, bg, title, desc }) => (
            <div key={title} className="card" style={{
              display: 'flex', gap: 16, alignItems: 'flex-start',
              transition: 'border-color 0.2s, transform 0.2s',
              cursor: 'default',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = 'translateY(-3px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: bg, display: 'flex', alignItems: 'center',
                justifyContent: 'center', flexShrink: 0, color,
              }}>
                <Icon size={20} />
              </div>
              <div>
                <h3 style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 6 }}>{title}</h3>
                <p style={{ fontSize: '0.845rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section style={{ padding: '0 48px 80px' }}>
        <div style={{
          maxWidth: 1100, margin: '0 auto',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.18) 0%, rgba(129,140,248,0.1) 100%)',
          border: '1px solid rgba(99,102,241,0.25)',
          borderRadius: 'var(--radius-lg)',
          padding: '52px 40px',
          textAlign: 'center',
        }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: 12 }}>
            Ready to get started?
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 28, fontSize: '1rem' }}>
            Create your free account and send your first invoice in minutes.
          </p>
          <button onClick={() => navigate('/register')} className="btn btn-primary btn-lg">
            Create Free Account <ArrowRight size={16} />
          </button>
          <p style={{ marginTop: 16, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--primary-light)', fontWeight: 500 }}>Sign in</Link>
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '24px 48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28,
            background: 'linear-gradient(135deg, var(--primary), #818cf8)',
            borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
          }}>
            <Receipt size={14} />
          </div>
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Goodsynk</span>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          © {new Date().getFullYear()} Goodsynk. Built for Indian businesses.
        </p>
      </footer>

    </div>
  );
}