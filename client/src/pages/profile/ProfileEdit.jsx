import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../api/services';
import toast from 'react-hot-toast';
import SignaturePicker from '../../components/SignaturePicker';
import {
  Building2, Phone, FileText, MapPin, Lock, Save, Pencil, X,
  Camera, Mail, User, CheckCircle, Shield, Loader2, Trash2, AlertTriangle, Landmark, PenLine
} from 'lucide-react';

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand',
  'West Bengal','Delhi','Jammu & Kashmir','Ladakh','Puducherry','Chandigarh',
];

/* ── Small helper: info row in view mode ── */
function InfoRow({ icon: Icon, label, value }) {
  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '11px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
        <Icon size={15} style={{ color: 'var(--primary-light)' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{label}</p>
        <p style={{ fontSize: '0.875rem', color: value ? 'var(--text-primary)' : 'var(--text-muted)', fontStyle: value ? 'normal' : 'italic' }}>
          {value || 'Not set'}
        </p>
      </div>
    </div>
  );
}

/* ── Section heading in edit mode ── */
function SectionHeading({ icon: Icon, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '20px 0 14px' }}>
      <Icon size={14} style={{ color: 'var(--primary-light)' }} />
      <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>{label}</span>
    </div>
  );
}

export default function ProfileEdit() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(user?.businessLogo || null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [pwdOpen, setPwdOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [deleting, setDeleting] = useState(false);
  const fileRef = useRef();
  const [signatureImg, setSignatureImg] = useState(user?.businessSignature || '');

  /* ── Save signature immediately ── */
  const handleSignatureSave = async (dataUrl) => {
    try {
      const { data } = await authAPI.updateMe({ businessSignature: dataUrl });
      updateUser(data.user);
      setSignatureImg(dataUrl);
      toast.success(dataUrl ? 'Signature saved!' : 'Signature removed.');
    } catch {
      toast.error('Failed to save signature.');
    }
  };

  /* ── Profile form ── */
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      name:         user?.name         || '',
      businessName: user?.businessName || '',
      phone:        user?.phone        || '',
      gstin:        user?.gstin        || '',
      street:       user?.address?.street  || '',
      city:         user?.address?.city    || '',
      state:        user?.address?.state   || '',
      pincode:      user?.address?.pincode || '',
      bankName:     user?.bankDetails?.bankName || '',
      accountName:  user?.bankDetails?.accountName || '',
      accountNumber:user?.bankDetails?.accountNumber || '',
      ifscCode:     user?.bankDetails?.ifscCode || '',
      swiftCode:    user?.bankDetails?.swiftCode || '',
      branch:       user?.bankDetails?.branch || '',
    },
  });

  /* ── Handle avatar upload → Cloudinary ── */
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Image must be less than 2 MB'); return; }
    // Optimistic local preview
    const localUrl = URL.createObjectURL(file);
    setAvatarPreview(localUrl);
    setAvatarUploading(true);
    try {
      const { data } = await authAPI.uploadAvatar(file);
      setAvatarPreview(data.url);
      updateUser(data.user);
      toast.success('Profile picture updated!');
    } catch {
      toast.error('Upload failed. Please try again.');
      setAvatarPreview(user?.businessLogo || null); // revert
    } finally {
      setAvatarUploading(false);
    }
  };

  /* ── Save profile ── */
  const onSubmit = async (values) => {
    try {
      const payload = {
        name:         values.name,
        businessName: values.businessName,
        phone:        values.phone,
        gstin:        values.gstin,
        businessLogo: avatarPreview || '',
        address: {
          street:  values.street,
          city:    values.city,
          state:   values.state,
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
      };
      const { data } = await authAPI.updateMe(payload);
      updateUser(data.user);
      toast.success('Profile updated!');
      setEditing(false);
    } catch {
      toast.error('Failed to update profile.');
    }
  };

  /* ── Handle account deletion ── */
  const handleDeleteAccount = async () => {
    if (deleteInput !== 'DELETE') return;
    setDeleting(true);
    try {
      await authAPI.deleteAccount();
      toast.success('Account deleted.');
      logout();
      navigate('/');
    } catch {
      toast.error('Failed to delete account.');
      setDeleting(false);
    }
  };

  /* Cancel edit — reset form back to user values */
  const handleCancel = () => {
    reset({
      name:         user?.name         || '',
      businessName: user?.businessName || '',
      phone:        user?.phone        || '',
      gstin:        user?.gstin        || '',
      street:       user?.address?.street  || '',
      city:         user?.address?.city    || '',
      state:        user?.address?.state   || '',
      pincode:      user?.address?.pincode || '',
      bankName:     user?.bankDetails?.bankName || '',
      accountName:  user?.bankDetails?.accountName || '',
      accountNumber:user?.bankDetails?.accountNumber || '',
      ifscCode:     user?.bankDetails?.ifscCode || '',
      swiftCode:    user?.bankDetails?.swiftCode || '',
      branch:       user?.bankDetails?.branch || '',
    });
    setAvatarPreview(user?.businessLogo || null);
    setEditing(false);
  };

  /* ── Password form ── */
  const { register: rp, handleSubmit: hp, reset: rpr, watch: wp, formState: { errors: pe, isSubmitting: ps } } = useForm();
  const onChangePwd = async (v) => {
    try {
      await authAPI.changePassword({ currentPassword: v.current, newPassword: v.newPwd });
      toast.success('Password changed!');
      rpr();
      setPwdOpen(false);
    } catch {
      toast.error('Incorrect current password.');
    }
  };

  /* ── Derived display values ── */
  const initials = (user?.businessName || user?.name || '?')
    .split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
  const addr = [user?.address?.street, user?.address?.city, user?.address?.state, user?.address?.pincode]
    .filter(Boolean).join(', ');

  return (
    <div>
      {/* ── Page header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">Manage your business information and account settings.</p>
        </div>
        {!editing && (
          <button className="btn btn-primary" onClick={() => setEditing(true)}>
            <Pencil size={15} /> Edit Profile
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24, alignItems: 'start' }}>

        {/* ── LEFT: Avatar card ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ textAlign: 'center', padding: '32px 24px' }}>
            {/* Avatar */}
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: 16 }}>
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Profile"
                  style={{ width: 140, height: 100, borderRadius: '8px', objectFit: 'contain', border: '2px solid var(--primary)', display: 'block', backgroundColor: '#fff' }}
                />
              ) : (
                <div style={{
                  width: 140, height: 100, borderRadius: '8px',
                  background: 'linear-gradient(135deg, var(--primary), #818cf8)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '2rem', fontWeight: 700, color: '#fff', margin: '0 auto',
                }}>
                  {initials}
                </div>
              )}
              {/* Camera overlay — only in edit mode */}
              {editing && (
                <button
                  type="button"
                  onClick={() => !avatarUploading && fileRef.current?.click()}
                  disabled={avatarUploading}
                  title="Change photo"
                  style={{
                    position: 'absolute', bottom: -10, right: -10,
                    width: 32, height: 32, borderRadius: '50%',
                    background: avatarUploading ? 'var(--bg-elevated)' : 'var(--primary)',
                    border: '3px solid var(--bg-card)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', cursor: avatarUploading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {avatarUploading
                    ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                    : <Camera size={14} />}
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
            </div>

            <h2 style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: 4 }}>{user?.businessName || user?.name}</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user?.email}</p>

            {/* Status badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              marginTop: 14, padding: '4px 12px', borderRadius: 20,
              background: 'var(--success-bg)', color: 'var(--success)', fontSize: '0.75rem', fontWeight: 600,
            }}>
              <CheckCircle size={12} /> Active Account
            </div>

            {editing && (
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 12 }}>
                Click the camera icon to change photo.<br />Max 2 MB.
              </p>
            )}
          </div>

          {/* ── Account info mini-card ── */}
          <div className="card" style={{ padding: '16px 20px' }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 12 }}>Account</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { icon: Mail,  label: 'Email',   val: user?.email },
                { icon: User,  label: 'Name',    val: user?.name  },
              ].map(({ icon: Icon, label, val }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Icon size={14} style={{ color: 'var(--primary-light)', flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{label}</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{val || '—'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Info / Edit panel ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {editing ? (
            /* ════ EDIT MODE ════ */
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>Edit Information</h3>
                <button type="button" className="btn btn-ghost btn-sm" onClick={handleCancel}>
                  <X size={15} /> Cancel
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)}>
                <SectionHeading icon={User} label="Personal" />
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Full Name <span style={{ color: 'var(--danger)' }}>*</span></label>
                    <input className={`form-control${errors.name ? ' error' : ''}`}
                      {...register('name', { required: 'Required' })} />
                    {errors.name && <p className="form-error">{errors.name.message}</p>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input className="form-control" value={user?.email || ''} disabled
                      style={{ opacity: 0.45, cursor: 'not-allowed' }} />
                  </div>
                </div>

                <SectionHeading icon={Building2} label="Business" />
                <div className="form-group">
                  <label className="form-label">Business Name <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <input className={`form-control${errors.businessName ? ' error' : ''}`}
                    placeholder="Acme Solutions Pvt. Ltd."
                    {...register('businessName', { required: 'Required' })} />
                  {errors.businessName && <p className="form-error">{errors.businessName.message}</p>}
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input className="form-control" placeholder="+91 98765 43210" {...register('phone')} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">GSTIN</label>
                    <input className="form-control" placeholder="22AAAAA0000A1Z5"
                      style={{ textTransform: 'uppercase' }}
                      {...register('gstin', {
                        pattern: { value: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, message: 'Invalid GSTIN' }
                      })} />
                    {errors.gstin && <p className="form-error">{errors.gstin.message}</p>}
                  </div>
                </div>

                <SectionHeading icon={MapPin} label="Address" />
                <div className="form-group">
                  <label className="form-label">Street / Area</label>
                  <input className="form-control" placeholder="123, MG Road" {...register('street')} />
                </div>
                <div className="form-grid-3">
                  <div className="form-group">
                    <label className="form-label">City</label>
                    <input className="form-control" placeholder="Bengaluru" {...register('city')} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Pincode</label>
                    <input className="form-control" placeholder="560001" {...register('pincode')} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">State</label>
                    <select className="form-control" {...register('state')}>
                      <option value="">Select state</option>
                      {INDIAN_STATES.map((st) => <option key={st} value={st}>{st}</option>)}
                    </select>
                  </div>
                </div>

                <SectionHeading icon={Landmark} label="Banking Information" />
                <div className="form-group">
                  <label className="form-label">Bank Name</label>
                  <input className="form-control" placeholder="e.g. HDFC Bank" {...register('bankName')} />
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Account Name</label>
                    <input className="form-control" placeholder="Acme Solutions" {...register('accountName')} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Account Number</label>
                    <input className="form-control" placeholder="50100XXXXXXX" {...register('accountNumber')} />
                  </div>
                </div>
                <div className="form-grid-3">
                  <div className="form-group">
                    <label className="form-label">IFSC Code</label>
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

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                  <button type="button" className="btn btn-ghost" onClick={handleCancel}><X size={15} /> Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                    <Save size={15} /> {isSubmitting ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>

          ) : (
            /* ════ VIEW MODE ════ */
            <>
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>Business Information</h3>
                  <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>
                    <Pencil size={13} /> Edit
                  </button>
                </div>
                <InfoRow icon={Building2} label="Business Name" value={user?.businessName} />
                <InfoRow icon={Phone}     label="Phone"         value={user?.phone} />
                <InfoRow icon={FileText}  label="GSTIN"         value={user?.gstin} />
                <InfoRow icon={MapPin}    label="Address"       value={addr || null} />
                
                <div style={{ marginTop: 24, padding: '20px 20px 10px', background: 'var(--bg-elevated)', borderRadius: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <div style={{ width: 28, height: 28, background: 'var(--primary-bg)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Landmark size={14} style={{ color: 'var(--primary)' }} />
                    </div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Banking Details</h4>
                  </div>
                  {user?.bankDetails?.accountNumber ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px 24px' }}>
                      <div>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Bank Name</p>
                        <p style={{ fontWeight: 600, fontSize: '0.85rem' }}>{user.bankDetails.bankName || '—'}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Account Name</p>
                        <p style={{ fontWeight: 600, fontSize: '0.85rem' }}>{user.bankDetails.accountName || '—'}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Account Number</p>
                        <p style={{ fontWeight: 600, fontSize: '0.85rem', fontFamily: 'monospace' }}>{user.bankDetails.accountNumber}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>IFSC</p>
                        <p style={{ fontWeight: 600, fontSize: '0.85rem' }}>{user.bankDetails.ifscCode || '—'}</p>
                      </div>
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      No bank details added yet.
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ── Signature Card (always visible) ── */}
          <SignaturePicker
            currentSignature={signatureImg}
            onSave={handleSignatureSave}
          />

          {/* ── Change Password card ── */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Shield size={16} style={{ color: 'var(--danger)' }} />
                </div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>Password & Security</p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Change your account password</p>
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setPwdOpen((o) => !o)}>
                {pwdOpen ? <><X size={14} /> Close</> : <><Lock size={14} /> Change Password</>}
              </button>
            </div>

            {pwdOpen && (
              <form onSubmit={hp(onChangePwd)} style={{ marginTop: 20, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                <div className="form-grid-3">
                  <div className="form-group">
                    <label className="form-label">Current Password</label>
                    <input type="password" className={`form-control${pe.current ? ' error' : ''}`}
                      placeholder="••••••••" {...rp('current', { required: 'Required' })} />
                    {pe.current && <p className="form-error">{pe.current.message}</p>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">New Password</label>
                    <input type="password" className={`form-control${pe.newPwd ? ' error' : ''}`}
                      placeholder="••••••••"
                      {...rp('newPwd', { required: 'Required', minLength: { value: 6, message: 'Min 6 chars' } })} />
                    {pe.newPwd && <p className="form-error">{pe.newPwd.message}</p>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Confirm Password</label>
                    <input type="password" className={`form-control${pe.confirm ? ' error' : ''}`}
                      placeholder="••••••••"
                      {...rp('confirm', { required: 'Required', validate: (v) => v === wp('newPwd') || 'Passwords do not match' })} />
                    {pe.confirm && <p className="form-error">{pe.confirm.message}</p>}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn btn-secondary" disabled={ps}>
                    <Lock size={15} /> {ps ? 'Updating…' : 'Update Password'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* ── Delete Account ── */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              className="btn btn-ghost btn-sm"
              style={{ color: 'var(--danger)', fontSize: '0.8rem' }}
              onClick={() => { setDeleteConfirm(true); setDeleteInput(''); }}
            >
              <Trash2 size={13} /> Delete Account
            </button>
          </div>

        </div>
      </div>

      {/* ── Delete Confirmation Modal ── */}
      {deleteConfirm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(4px)',
        }}>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid rgba(239,68,68,0.4)',
            borderRadius: 'var(--radius-lg)', padding: '32px 28px',
            maxWidth: 440, width: '100%', boxShadow: 'var(--shadow)',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--danger-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <AlertTriangle size={22} style={{ color: 'var(--danger)' }} />
              </div>
              <div>
                <h3 style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--danger)', marginBottom: 2 }}>Delete Account</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>This action is permanent and cannot be undone.</p>
              </div>
            </div>

            {/* Warning list */}
            <div style={{ background: 'var(--danger-bg)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '12px 14px', marginBottom: 20 }}>
              <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--danger)', marginBottom: 8 }}>This will permanently delete:</p>
              {['Your account and login credentials', 'All your invoices and data', 'All your clients and products', 'Your business profile and logo'].map((item) => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--danger)', flexShrink: 0 }} />
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{item}</p>
                </div>
              ))}
            </div>

            {/* Confirmation input */}
            <div className="form-group">
              <label className="form-label" style={{ color: 'var(--text-secondary)' }}>
                Type <strong style={{ color: 'var(--danger)' }}>DELETE</strong> to confirm
              </label>
              <input
                className="form-control"
                style={{ borderColor: deleteInput === 'DELETE' ? 'var(--danger)' : undefined }}
                placeholder="Type DELETE here"
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                autoFocus
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <button
                className="btn btn-ghost"
                onClick={() => { setDeleteConfirm(false); setDeleteInput(''); }}
                disabled={deleting}
              >
                <X size={15} /> Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleDeleteAccount}
                disabled={deleteInput !== 'DELETE' || deleting}
                style={{ opacity: deleteInput !== 'DELETE' ? 0.45 : 1 }}
              >
                <Trash2 size={15} />
                {deleting ? 'Deleting…' : 'Delete My Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
