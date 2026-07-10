import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../api/services';
import toast from 'react-hot-toast';
import SignaturePicker from '../../components/SignaturePicker';
import {
  Building2, Phone, FileText, MapPin, Lock, Save, Pencil, X,
  Camera, Mail, User, CheckCircle, Shield, Loader2, Trash2,
  AlertTriangle, Landmark, PenLine, Eye, EyeOff
} from 'lucide-react';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand',
  'West Bengal', 'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Puducherry', 'Chandigarh']
const checkImageHasBackground = (file) => {
  return new Promise((resolve) => {
    // Check for transparent pixels (background) for all supported image formats

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Resize if too large, max 500x500 to keep base64 size manageable
      const MAX_SIZE = 500;
      let width = img.width;
      let height = img.height;
      if (width > MAX_SIZE || height > MAX_SIZE) {
        const ratio = Math.min(MAX_SIZE / width, MAX_SIZE / height);
        width = width * ratio;
        height = height * ratio;
      }

      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(img, 0, 0, width, height);
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;

      let hasTransparentPixels = false;
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] < 255) {
          hasTransparentPixels = true;
          break;
        }
      }

      // Get base64 string
      const dataUrl = canvas.toDataURL('image/png');

      // If no transparent pixels are found, it has a solid background
      resolve({ hasBackground: !hasTransparentPixels, dataUrl });
    };

    img.onerror = () => resolve({ hasBackground: false, dataUrl: null });
    img.src = url;
  });
};

/* ── Small helper: info row in view mode ── */
function InfoRow({ icon: Icon, label, value }) {
  const isMissing = !value;
  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '11px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: isMissing ? 'rgba(239, 68, 68, 0.1)' : 'var(--primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
        <Icon size={15} style={{ color: isMissing ? 'var(--danger)' : 'var(--primary-light)' }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '0.7rem', color: isMissing ? 'var(--danger)' : 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{label}</p>
        <p style={{ fontSize: '0.875rem', color: isMissing ? 'var(--danger)' : 'var(--text-primary)', fontStyle: isMissing ? 'italic' : 'normal', fontWeight: isMissing ? 600 : 400 }}>
          {value || 'Not set (Missing)'}
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


const emptyBankAccount = () => ({
  label: '', bankName: '', accountName: '', accountNumber: '', ifscCode: '', swiftCode: '', branch: '', isPrimary: false,
});

const normalizeBankAccounts = (user) => {
  const accounts = Array.isArray(user?.bankAccounts) ? user.bankAccounts.filter(Boolean) : [];
  if (accounts.length) return accounts.map((account, index) => ({ ...emptyBankAccount(), ...account, isPrimary: account.isPrimary || index === 0 }));
  const legacy = user?.bankDetails;
  if (legacy && (legacy.bankName || legacy.accountName || legacy.accountNumber || legacy.ifscCode)) {
    return [{ ...emptyBankAccount(), label: 'Primary', ...legacy, isPrimary: true }];
  }
  return [];
};

function BankCard({ bank, index, editing, onEdit, onDelete, onPrimary }) {
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 14, background: 'var(--bg-card)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <strong>{bank.label || bank.bankName || `Bank ${index + 1}`}</strong>
            {bank.isPrimary && <span style={{ fontSize: '0.65rem', background: 'var(--primary-bg)', color: 'var(--primary)', padding: '2px 7px', borderRadius: 999 }}>⭐ Primary</span>}
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{bank.bankName || 'Bank name not set'}</p>
        </div>
        {editing && (
          <div style={{ display: 'flex', gap: 6 }}>
            {!bank.isPrimary && <button type="button" className="btn btn-ghost btn-sm" onClick={() => onPrimary(index)}>Make Primary</button>}
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onEdit(index)}><Pencil size={13} /></button>
            <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => onDelete(index)}><Trash2 size={13} /></button>
          </div>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px 18px', fontSize: '0.8rem' }}>
        <div><p style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>Account Name</p><p style={{ fontWeight: 600 }}>{bank.accountName || '—'}</p></div>
        <div><p style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>Account Number</p><p style={{ fontWeight: 600, fontFamily: 'monospace' }}>{bank.accountNumber || '—'}</p></div>
        <div><p style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>IFSC</p><p style={{ fontWeight: 600 }}>{bank.ifscCode || '—'}</p></div>
        <div><p style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>Branch</p><p style={{ fontWeight: 600 }}>{bank.branch || '—'}</p></div>
      </div>
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
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [deleting, setDeleting] = useState(false);
  const fileRef = useRef();
  const [signatureImg, setSignatureImg] = useState(user?.businessSignature || '');
  const [bankAccounts, setBankAccounts] = useState(() => normalizeBankAccounts(user));
  const [bankModal, setBankModal] = useState({ open: false, index: null, draft: emptyBankAccount() });

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
  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      name: user?.name || '',
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

  const formValues = watch();

  useEffect(() => {
    if (!editing) return;
    const handler = setTimeout(() => {
      // Auto-save silently
      handleSubmit((vals) => handleSave(vals, false))();
    }, 1500); // 1.5s debounce
    return () => clearTimeout(handler);
  }, [formValues, editing]);

  /* ── Handle avatar upload → Base64 ── */
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Image must be less than 2 MB'); return; }

    // Allow PNG and JPEG formats
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) { toast.error('Only PNG or JPEG images are allowed'); return; }

    const { hasBackground, dataUrl } = await checkImageHasBackground(file);
    if (hasBackground) {
      toast.error('Image contains background, so remove background and upload');
      if (fileRef.current) fileRef.current.value = '';
      return;
    }
    if (!dataUrl) {
      toast.error('Failed to process image');
      return;
    }

    // Optimistic preview
    setAvatarPreview(dataUrl);
    setAvatarUploading(true);
    try {
      const { data } = await authAPI.updateMe({ businessLogo: dataUrl });
      updateUser(data.user);
      toast.success('Profile picture updated!');
    } catch {
      toast.error('Upload failed. Please try again.');
      setAvatarPreview(user?.businessLogo || null);
    } finally {
      setAvatarUploading(false);
    }

    if (!dataUrl) {
      toast.error('Failed to process image');
      return;
    }

    // Optimistic local preview
    setAvatarPreview(dataUrl);
    setAvatarUploading(true);
    try {
      const { data } = await authAPI.updateMe({ businessLogo: dataUrl });
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
  const handleSave = async (values, isManual = true) => {
    try {
      const normalizedBanks = bankAccounts.length
        ? bankAccounts.map((bank, index) => ({ ...bank, isPrimary: bank.isPrimary || (!bankAccounts.some((b) => b.isPrimary) && index === 0) }))
        : (values.bankName || values.accountNumber ? [{
          label: 'Primary', bankName: values.bankName, accountName: values.accountName,
          accountNumber: values.accountNumber, ifscCode: values.ifscCode,
          swiftCode: values.swiftCode, branch: values.branch, isPrimary: true,
        }] : []);
      const primaryBank = normalizedBanks.find((bank) => bank.isPrimary) || normalizedBanks[0] || emptyBankAccount();
      const payload = {
        name: values.name,
        businessName: values.businessName,
        phone: values.phone,
        gstin: values.gstin,
        businessLogo: avatarPreview || '',
        address: {
          street: values.street,
          city: values.city,
          state: values.state,
          pincode: values.pincode,
          country: 'India',
        },
        bankDetails: {
          bankName: primaryBank.bankName,
          accountName: primaryBank.accountName,
          accountNumber: primaryBank.accountNumber,
          ifscCode: primaryBank.ifscCode,
          swiftCode: primaryBank.swiftCode,
          branch: primaryBank.branch,
        },
        bankAccounts: normalizedBanks,
      };
      const { data } = await authAPI.updateMe(payload);
      updateUser(data.user);

      if (isManual) {
        toast.success('Profile updated!');
        setEditing(false);
      } else {
        toast.success('Changes auto-saved', { id: 'autosave', icon: '💾' });
      }
    } catch {
      toast.error('Failed to update profile.', { id: 'autosave' });
    }
  };

  const onSubmit = (values) => handleSave(values, true);


  const persistBankAccounts = async (nextAccounts) => {
    const normalized = nextAccounts.map((bank, index) => ({ ...bank, isPrimary: bank.isPrimary || (!nextAccounts.some((b) => b.isPrimary) && index === 0) }));
    const primary = normalized.find((bank) => bank.isPrimary) || normalized[0] || emptyBankAccount();
    setBankAccounts(normalized);
    try {
      const { data } = await authAPI.updateMe({
        bankAccounts: normalized,
        bankDetails: {
          bankName: primary.bankName,
          accountName: primary.accountName,
          accountNumber: primary.accountNumber,
          ifscCode: primary.ifscCode,
          swiftCode: primary.swiftCode,
          branch: primary.branch,
        },
      });
      updateUser(data.user);
      toast.success('Bank accounts updated');
    } catch {
      toast.error('Failed to update bank accounts');
    }
  };

  const openBankModal = (index = null) => setBankModal({ open: true, index, draft: index === null ? emptyBankAccount() : { ...emptyBankAccount(), ...bankAccounts[index] } });
  const closeBankModal = () => setBankModal({ open: false, index: null, draft: emptyBankAccount() });
  const saveBankModal = () => {
    if (!bankModal.draft.bankName && !bankModal.draft.accountNumber) return toast.error('Bank name or account number is required');
    const rawNext = bankModal.index === null ? [...bankAccounts, bankModal.draft] : bankAccounts.map((bank, index) => index === bankModal.index ? bankModal.draft : bank);
    const next = bankModal.draft.isPrimary
      ? rawNext.map((bank, index) => ({ ...bank, isPrimary: index === (bankModal.index === null ? rawNext.length - 1 : bankModal.index) }))
      : rawNext;
    const withPrimary = next.some((bank) => bank.isPrimary) ? next : next.map((bank, index) => ({ ...bank, isPrimary: index === 0 }));
    closeBankModal();
    persistBankAccounts(withPrimary);
  };
  const deleteBank = (index) => persistBankAccounts(bankAccounts.filter((_, i) => i !== index).map((bank, i) => ({ ...bank, isPrimary: i === 0 ? true : bank.isPrimary })));
  const makePrimaryBank = (index) => persistBankAccounts(bankAccounts.map((bank, i) => ({ ...bank, isPrimary: i === index })));

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
      name: user?.name || '',
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
    });
    setAvatarPreview(user?.businessLogo || null);
    setEditing(false);
  };

  /* ── Password form ── */
  const { register: rp, handleSubmit: hp, reset: rpr, watch: wp, formState: { errors: pe, isSubmitting: ps } } = useForm();
  const onChangePwd = async (v) => {
    try {
      const { data } = await authAPI.changePassword({ currentPassword: v.current, newPassword: v.newPwd });
      // Store the new JWT token after password change
      if (data?.token) {
        localStorage.setItem('token', data.token);
      }
      toast.success('Password changed!');
      rpr();
      setPwdOpen(false);
    } catch (err) {
      const message = err?.response?.data?.message || 'Incorrect current password.';
      toast.error(message);
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
        <div>
          {!editing ? (
            <>
              <button className="btn btn-primary" onClick={() => setEditing(true)}>
                <Pencil size={15} /> Edit Profile
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="btn btn-ghost" onClick={handleCancel}>
                <X size={15} /> Cancel
              </button>
              <button type="submit" form="profile-form" className="btn btn-primary" disabled={isSubmitting}>
                <Save size={15} /> {isSubmitting ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
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
                  onClick={() => {
                    if (!avatarUploading) {
                      const confirmUpload = window.confirm("Images should not contain background. Do you want to proceed?");
                      if (confirmUpload) {
                        fileRef.current?.click();
                      }
                    }
                  }}
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
              <input ref={fileRef} type="file" accept="image/png, image/jpeg" style={{ display: 'none' }} onChange={handleAvatarChange} />
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
                Click the camera icon to change photo.<br />Max 2 MB.<br />Allowed formats: PNG, JPEG.
              </p>
            )}
          </div>

          {/* ── Account info mini-card ── */}
          <div className="card" style={{ padding: '16px 20px' }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 12 }}>Account</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { icon: Mail, label: 'Email', val: user?.email },
                { icon: User, label: 'Name', val: user?.name },
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

              <form id="profile-form" onSubmit={handleSubmit(onSubmit)}>
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
                    <label className="form-label">Phone <span style={{ color: 'var(--danger)' }}>*</span></label>
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
                  <label className="form-label">Street / Area <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <input className="form-control" placeholder="123, MG Road" {...register('street')} />
                </div>
                <div className="form-grid-3">
                  <div className="form-group">
                    <label className="form-label">City <span style={{ color: 'var(--danger)' }}>*</span></label>
                    <input className="form-control" placeholder="Bengaluru" {...register('city')} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Pincode <span style={{ color: 'var(--danger)' }}>*</span></label>
                    <input className="form-control" placeholder="560001" {...register('pincode')} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">State <span style={{ color: 'var(--danger)' }}>*</span></label>
                    <select className="form-control" {...register('state')}>
                      <option value="">Select state</option>
                      {INDIAN_STATES.map((st) => <option key={st} value={st}>{st}</option>)}
                    </select>
                  </div>
                </div>

                <SectionHeading icon={Landmark} label="Banking Information" />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Manage multiple bank accounts. The primary account is mirrored to legacy bank details.</p>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => openBankModal()}><Landmark size={14} /> Add Bank Account</button>
                </div>
                {bankAccounts.length ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
                    {bankAccounts.map((bank, index) => (
                      <BankCard key={`${bank.accountNumber || bank.bankName}-${index}`} bank={bank} index={index} editing onEdit={openBankModal} onDelete={deleteBank} onPrimary={makePrimaryBank} />
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: 18, border: '1px dashed var(--border)', borderRadius: 12, textAlign: 'center', color: 'var(--text-muted)' }}>
                    No bank accounts added yet.
                  </div>
                )}

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
                <InfoRow icon={Phone} label="Phone" value={user?.phone} />
                <InfoRow icon={FileText} label="GSTIN" value={user?.gstin} />
                <InfoRow icon={MapPin} label="Address" value={addr || null} />

                <div style={{ marginTop: 24, padding: '20px', background: 'var(--bg-elevated)', borderRadius: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 28, height: 28, background: 'var(--primary-bg)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Landmark size={14} style={{ color: 'var(--primary)' }} />
                      </div>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Banking Details</h4>
                    </div>
                    <button className="btn btn-secondary btn-sm" onClick={() => { setEditing(true); openBankModal(); }}><Landmark size={13} /> Add Bank Account</button>
                  </div>
                  {bankAccounts.length ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
                      {bankAccounts.map((bank, index) => (
                        <BankCard key={`${bank.accountNumber || bank.bankName}-${index}`} bank={bank} index={index} editing={false} />
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.8rem', color: 'var(--danger)', fontStyle: 'italic', fontWeight: 600 }}>
                      No bank accounts added yet. (Missing)
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
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        className={`form-control${pe.current ? ' error' : ''}`}
                        placeholder="••••••••"
                        style={{ paddingRight: '45px' }}
                        {...rp('current', { required: 'Required' })}
                      />

                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
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
                        {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {pe.current && <p className="form-error">{pe.current.message}</p>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">New Password</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        className={`form-control${pe.newPwd ? ' error' : ''}`}
                        placeholder="••••••••"
                        style={{ paddingRight: '45px' }}
                        {...rp('newPwd', {
                          required: 'Required',
                          minLength: { value: 6, message: 'Min 6 chars' }
                        })}
                      />

                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
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
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {pe.newPwd && <p className="form-error">{pe.newPwd.message}</p>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Confirm Password</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        className={`form-control${pe.confirm ? ' error' : ''}`}
                        placeholder="••••••••"
                        style={{ paddingRight: '45px' }}
                        {...rp('confirm', {
                          required: 'Required',
                          validate: (v) => v === wp('newPwd') || 'Passwords do not match'
                        })}
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
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
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

      {/* ── Bank Account Modal ── */}
      {bankModal.open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24, width: 560, maxWidth: '96vw', boxShadow: 'var(--shadow)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>{bankModal.index === null ? 'Add Bank Account' : 'Edit Bank Account'}</h3>
              <button type="button" className="btn btn-ghost btn-sm" onClick={closeBankModal}><X size={15} /></button>
            </div>
            <div className="form-grid">
              <div className="form-group"><label className="form-label">Nick name / Label</label><input className="form-control" value={bankModal.draft.label} onChange={(e) => setBankModal((m) => ({ ...m, draft: { ...m.draft, label: e.target.value } }))} placeholder="Primary / Savings / USD" /></div>
              <div className="form-group"><label className="form-label">Bank Name</label><input className="form-control" value={bankModal.draft.bankName} onChange={(e) => setBankModal((m) => ({ ...m, draft: { ...m.draft, bankName: e.target.value } }))} placeholder="HDFC Bank" /></div>
              <div className="form-group"><label className="form-label">Account Name</label><input className="form-control" value={bankModal.draft.accountName} onChange={(e) => setBankModal((m) => ({ ...m, draft: { ...m.draft, accountName: e.target.value } }))} placeholder="Acme Solutions" /></div>
              <div className="form-group"><label className="form-label">Account Number</label><input className="form-control" value={bankModal.draft.accountNumber} onChange={(e) => setBankModal((m) => ({ ...m, draft: { ...m.draft, accountNumber: e.target.value } }))} placeholder="50100XXXXXXX" /></div>
              <div className="form-group"><label className="form-label">IFSC Code</label><input className="form-control" style={{ textTransform: 'uppercase' }} value={bankModal.draft.ifscCode} onChange={(e) => setBankModal((m) => ({ ...m, draft: { ...m.draft, ifscCode: e.target.value.toUpperCase() } }))} placeholder="HDFC0001234" /></div>
              <div className="form-group"><label className="form-label">SWIFT Code</label><input className="form-control" style={{ textTransform: 'uppercase' }} value={bankModal.draft.swiftCode} onChange={(e) => setBankModal((m) => ({ ...m, draft: { ...m.draft, swiftCode: e.target.value.toUpperCase() } }))} placeholder="Optional" /></div>
              <div className="form-group"><label className="form-label">Branch</label><input className="form-control" value={bankModal.draft.branch} onChange={(e) => setBankModal((m) => ({ ...m, draft: { ...m.draft, branch: e.target.value } }))} placeholder="Koramangala" /></div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 28, cursor: 'pointer' }}>
                <input type="checkbox" checked={!!bankModal.draft.isPrimary} onChange={(e) => setBankModal((m) => ({ ...m, draft: { ...m.draft, isPrimary: e.target.checked } }))} style={{ accentColor: 'var(--primary)' }} />
                Mark as primary
              </label>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <button type="button" className="btn btn-ghost" onClick={closeBankModal}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={saveBankModal}>Save Bank Account</button>
            </div>
          </div>
        </div>
      )}

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
