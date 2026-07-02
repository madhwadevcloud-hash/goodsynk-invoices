import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { UserPlus, Receipt } from 'lucide-react';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return toast.error('Name, email and password are required');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created! Complete your profile to get started.');
      navigate('/profile-setup');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon"><Receipt size={24} /></div>
          <span className="auth-logo-text">InvoiceGen</span>
        </div>

        <h1 className="auth-heading">Create account</h1>
        <p className="auth-subtext">Start managing your invoices today</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
              <label className="form-label">Your Name *</label>
              <input name="name" className="form-control" placeholder="John Doe" value={form.name} onChange={handleChange} />
            </div>

          <div className="form-group">
            <label className="form-label">Email Address *</label>
            <input name="email" type="email" className="form-control" placeholder="you@example.com" value={form.email} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label className="form-label">Password *</label>
            <input name="password" type="password" className="form-control" placeholder="Min. 6 characters" value={form.password} onChange={handleChange} />
          </div>

          <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
            <UserPlus size={16} />
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="text-sm text-muted mt-4" style={{ textAlign: 'center' }}>
          Already have an account?{' '}
          <Link to="/login" className="auth-link">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
