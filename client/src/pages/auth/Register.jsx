import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { UserPlus, Receipt, Eye, EyeOff } from 'lucide-react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../../config/firebase';

export default function Register() {
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !form.confirmPassword) return toast.error('All fields are required');
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match');
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

  const handleGoogleRegister = async () => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      await loginWithGoogle({
        name: user.displayName,
        email: user.email,
        googleId: user.uid,
      });
      toast.success('Account created! Welcome.');
      navigate('/profile-setup');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Google registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon"><Receipt size={24} /></div>
          <span className="auth-logo-text">Goodsynk</span>
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
            <div style={{ position: 'relative' }}>
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={handleChange}
                style={{ paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', padding: 0,
                  display: 'flex', alignItems: 'center'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password *</label>

            <div style={{ position: 'relative' }}>
              <input
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                className="form-control"
                placeholder="Confirm your password"
                value={form.confirmPassword}
                onChange={handleChange}
                style={{ paddingRight: '40px' }}
              />

              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: '#888',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showConfirmPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
            <UserPlus size={16} />
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <div className="mt-4" style={{ display: 'flex', alignItems: 'center', margin: '20px 0' }}>
          <hr style={{ flex: 1, borderColor: '#eee' }} />
          <span style={{ padding: '0 10px', color: '#888', fontSize: '14px' }}>OR</span>
          <hr style={{ flex: 1, borderColor: '#eee' }} />
        </div>

        <button
          type="button"
          className="btn w-full btn-lg"
          onClick={handleGoogleRegister}
          disabled={loading}
          style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', border: '1px solid #ddd', backgroundColor: '#fff', color: '#333' }}
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google logo" style={{ width: '18px', height: '18px' }} />
          Sign in with Google
        </button>

        <p className="text-sm text-muted mt-4" style={{ textAlign: 'center' }}>
          Already have an account?{' '}
          <Link to="/login" className="auth-link">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
