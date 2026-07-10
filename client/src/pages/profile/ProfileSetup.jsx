import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../api/services';
import toast from 'react-hot-toast';
import { Receipt, Building2, Phone, FileText, MapPin, ChevronRight, Landmark } from 'lucide-react';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand',
  'West Bengal', 'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Puducherry', 'Chandigarh',
];

export default function ProfileSetup() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      businessName: user?.businessName || '',
      phone: user?.phone || '',
      gstin: user?.gstin || '',
      street: user?.address?.street || '',
      city: user?.address?.city || '',
      state: user?.address?.state || '',
      pincode: user?.address?.pincode || '',
      bankName: user?.bankDetails?.bankName || '',
      accountName: user?.bankDetails?.accountName || '',
      accountNumber: user?.bankDetails?.accountNumber || '',
      ifscCode: user?.bankDetails?.ifscCode || '',
      swiftCode: user?.bankDetails?.swiftCode || '',
      branch: user?.bankDetails?.branch || '',
    },
  });

  const onSubmit = async (values) => {
    try {
      const payload = {
        businessName: values.businessName,
        phone: values.phone,
        gstin: values.gstin,
        address: {
          street: values.street,
          city: values.city,
          state: values.state,
          pincode: values.pincode,
          country: 'India',
        },
        bankDetails: {
          bankName: values.bankName,
          accountName: values.accountName,
          accountNumber: values.accountNumber,
          ifscCode: values.ifscCode,
          swiftCode: values.swiftCode,
          branch: values.branch,
        },
        bankAccounts: values.accountNumber || values.bankName ? [{
          label: 'Primary',
          bankName: values.bankName,
          accountName: values.accountName,
          accountNumber: values.accountNumber,
          ifscCode: values.ifscCode,
          swiftCode: values.swiftCode,
          branch: values.branch,
          isPrimary: true,
        }] : [],
      };
      const { data } = await authAPI.updateMe(payload);
      updateUser(data.user);
      toast.success('Profile saved! Welcome aboard 🎉');
      navigate('/dashboard');
    } catch {
      toast.error('Failed to save profile. Please try again.');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px 40px',
      fontFamily: 'Inter, system-ui, sans-serif',
      position: 'relative'
    }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%', marginBottom: '20px' }}>
        <button
          onClick={() => navigate('/dashboard')}
          className="btn btn-ghost"
          style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}
        >
          Skip for now <ChevronRight size={16} />
        </button>
      </div>

      {/* Content */}
      <div style={{
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <div style={{
            width: 40, height: 40,
            background: 'linear-gradient(135deg, var(--primary), #818cf8)',
            borderRadius: 10, display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: '#fff',
          }}>
            <Receipt size={18} />
          </div>
          <span style={{
            fontSize: '1.1rem', fontWeight: 700,
            background: 'linear-gradient(135deg, var(--primary-light), #fff)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>Goodsynk Invoices</span>
        </div>

        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 6 }}>Complete your profile</h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 28 }}>
          Tell us about your business so your invoices look professional.
        </p>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Section: Business */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Building2 size={15} style={{ color: 'var(--primary-light)' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>
              Business Details
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Business Name <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input
              className={`form-control${errors.businessName ? ' error' : ''}`}
              placeholder="e.g. Acme Solutions Pvt. Ltd."
              {...register('businessName', { required: 'Business name is required' })}
            />
            {errors.businessName && <p className="form-error">{errors.businessName.message}</p>}
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Phone size={12} /> Phone <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input className="form-control" placeholder="+91 98765 43210" {...register('phone')} />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <FileText size={12} /> GSTIN
              </label>
              <input
                className="form-control"
                placeholder="22AAAAA0000A1Z5"
                style={{ textTransform: 'uppercase' }}
                {...register('gstin', {
                  pattern: { value: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, message: 'Invalid GSTIN format' }
                })}
              />
              {errors.gstin && <p className="form-error">{errors.gstin.message}</p>}
            </div>
          </div>

          {/* Section: Address */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '8px 0 14px' }}>
            <MapPin size={15} style={{ color: 'var(--primary-light)' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>
              Business Address
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Street / Area <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input className="form-control" placeholder="123, MG Road" {...register('street')} />
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">City <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input className="form-control" placeholder="Bengaluru" {...register('city')} />
            </div>
            <div className="form-group">
              <label className="form-label">Pincode <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input className="form-control" placeholder="560001" {...register('pincode')} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">State <span style={{ color: 'var(--danger)' }}>*</span></label>
            <select className="form-control" {...register('state')}>
              <option value="">Select state</option>
              {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Section: Banking */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '24px 0 14px' }}>
            <Landmark size={15} style={{ color: 'var(--primary-light)' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>
              Banking Information (Optional)
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Bank Name <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input className="form-control" placeholder="e.g. HDFC Bank" {...register('bankName')} />
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Account Name <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input className="form-control" placeholder="Acme Solutions" {...register('accountName')} />
            </div>
            <div className="form-group">
              <label className="form-label">Account Number <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input className="form-control" placeholder="50100XXXXXXX" {...register('accountNumber')} />
            </div>
          </div>

          <div className="form-grid-3">
            <div className="form-group">
              <label className="form-label">IFSC Code <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input className="form-control" placeholder="HDFC0001234" style={{ textTransform: 'uppercase' }} {...register('ifscCode')} />
            </div>
            <div className="form-group">
              <label className="form-label">SWIFT Code</label>
              <input className="form-control" placeholder="(Optional)" style={{ textTransform: 'uppercase' }} {...register('swiftCode')} />
            </div>
            <div className="form-group">
              <label className="form-label">Branch</label>
              <input className="form-control" placeholder="Koramangala" {...register('branch')} />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full btn-lg"
            style={{ marginTop: 8, justifyContent: 'center' }}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving…' : <>Save & Continue <ChevronRight size={16} /></>}
          </button>

        </form>
      </div>
    </div>
  );
}
