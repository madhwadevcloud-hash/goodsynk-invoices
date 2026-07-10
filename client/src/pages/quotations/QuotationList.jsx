import { useEffect, useState } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { quotationAPI } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Eye, Send, Mail, MessageCircle, Loader2 } from 'lucide-react';
import { DEFAULT_COLORS, resolveTemplateColors } from '../invoices/InvoiceForm';
import { isProfileComplete, getMissingProfileField } from '../../utils/profileValidation';
import { getQuotationMessage } from '../../utils/whatsappTemplates';
import EmailComposeModal from '../../components/EmailComposeModal';

const fmtCurrency = (n, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 2 }).format(n || 0);

export default function QuotationList() {
  const { user } = useAuth();
  const { setShowProfilePrompt } = useOutletContext();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shareOpenId, setShareOpenId] = useState(null);
  const [shareDropdownPos, setShareDropdownPos] = useState(null);
  const [sendingId, setSendingId] = useState(null);
  const [whatsappModalData, setWhatsappModalData] = useState(null);
  const [emailModalData, setEmailModalData] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const handleCreate = (e) => {
    if (!isProfileComplete(user)) {
      e.preventDefault();
      const missing = getMissingProfileField(user);
      toast.error(`${missing} is missing, fill that to complete the profile`);
      setShowProfilePrompt(true);
    }
  };

  const fetchQuotations = () => {
    setLoading(true);
    quotationAPI.getAll()
      .then((r) => setQuotations(r.data.quotations || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(fetchQuotations, []);

  const filteredQuotations = quotations.filter((q) => {
    const matchesSearch =
      q.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) ||
      q.client?.name?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      !statusFilter || q.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (id, status) => {
    try {
      await quotationAPI.updateStatus(id, { status });

      setQuotations((prev) =>
        prev.map((q) =>
          q._id === id ? { ...q, status } : q
        )
      );

      toast.success('Status updated');
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this quotation?')) return;
    try {
      await quotationAPI.delete(id);
      toast.success('Quotation deleted');
      fetchQuotations();
    } catch {
      toast.error('Failed to delete quotation');
    }
  };

  const toggleShare = (id, e) => {
    if (shareOpenId === id) {
      setShareOpenId(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setShareDropdownPos({ top: rect.bottom + 6, left: rect.right - 170 });
    setShareOpenId(id);
  };

  const buildQuotationPDFFile = async (quotationId) => {
    const res = await quotationAPI.getById(quotationId);
    const inv = res.data.invoice;

    // Use the template stored on the quotation; fall back to the quotation owner's
    // account default (inv.user.invoiceTemplate), NOT the currently logged-in
    // user's preference — so the selected template is always honoured.
    const resolvedTpt = (inv.template || inv.user?.invoiceTemplate || currentUser?.invoiceTemplate || 'template1').toLowerCase();
    let userForPdf = currentUser;
    if (currentUser?.businessLogo) {
      try {
        const jpgUrl = currentUser.businessLogo.includes('cloudinary.com')
          ? currentUser.businessLogo.replace('/upload/', '/upload/f_jpg/')
          : currentUser.businessLogo;
        const logoRes = await fetch(jpgUrl);
        const blob = await logoRes.blob();
        const base64Logo = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
        userForPdf = { ...currentUser, businessLogo: base64Logo };
      } catch (e) { /* logo fetch is best-effort */ }
    }

    const invoiceForPDF = {
      ...inv,
      user: userForPdf,
      template: resolvedTpt,
      invoiceType: 'quotation',
      templateColors: resolveTemplateColors(resolvedTpt, inv.templateColors),
      _currency: inv.currency || 'INR',
      _taxType: inv.taxType,
    };

    const [{ pdf }, { default: TemplateResolver }] = await Promise.all([
      import('@react-pdf/renderer'),
      import('../invoices/templates/TemplateResolver'),
    ]);
    const blob = await pdf(<TemplateResolver invoice={invoiceForPDF} />).toBlob();
    const fileName = `Quotation-${inv.invoiceNumber}.pdf`;
    return { file: new File([blob], fileName, { type: 'application/pdf' }), blob, fileName, inv };
  };

  const downloadBlob = (blob, fileName) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 🟢 EMAIL — opens custom compose modal
  const shareViaEmail = async (id) => {
    setShareOpenId(null);
    setSendingId(id);
    try {
      const { blob, fileName, inv } = await buildQuotationPDFFile(id);
      setEmailModalData({ inv, id, blob, fileName });
    } catch (err) {
      toast.error('Failed to prepare quotation for email');
    } finally {
      setSendingId(null);
    }
  };

  const handleSendEmail = async ({ to, cc, subject, body }) => {
    if (!emailModalData) return;
    const { id, blob, fileName, inv } = emailModalData;
    const viewUrl = `${window.location.origin}/share/quotation/${inv.shareToken}`;
    await quotationAPI.sendEmail(id, { to, cc, subject, body, pdfBlob: blob, pdfFileName: fileName, viewUrl });
  };

  // 🟢 WHATSAPP — triggers modal to review/edit message before opening WhatsApp
  const shareViaWhatsapp = async (id) => {
    setShareOpenId(null);
    setSendingId(id);
    try {
      const { blob, fileName, inv } = await buildQuotationPDFFile(id);
      const shareUrl = `${window.location.origin}/share/quotation/${inv.shareToken}`;
      const text = getQuotationMessage(inv, shareUrl, fmtCurrency);
      const phone = inv.client?.phone || '';

      setWhatsappModalData({
        phone,
        text,
        blob,
        fileName
      });
    } catch (err) {
      toast.error('Failed to prepare quotation for WhatsApp');
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Quotations</h1>
          <p className="page-subtitle">Manage all your quotations</p>
        </div>
        <Link to="/quotations/new" className="btn btn-primary" onClick={handleCreate}>
          <Plus size={16} /> New Quotation
        </Link>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div
          style={{
            display: 'flex',
            gap: '16px',
            padding: '16px',
            alignItems: 'center'
          }}
        >
          <input
            type="text"
            placeholder="Search quotation or client..."
            className="form-control"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: '350px' }}
          />

          <select
            className="form-control"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ maxWidth: '180px' }}
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="accepted">Accepted</option>
          </select>
        </div>
        {loading ? (
          <div className="flex-center" style={{ padding: '60px' }}><div className="spinner" /></div>
        ) : filteredQuotations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-title">
              {statusFilter
                ? `No ${statusFilter} quotations found`
                : 'No quotations found'}
            </div>

            <div className="empty-state-desc">
              {statusFilter
                ? 'No quotations match the selected filter'
                : 'Create your first quotation to share with clients'}
            </div>
            {!statusFilter && (
              <Link
                to="/quotations/new"
                className="btn btn-primary"
                onClick={handleCreate}
              >
                <Plus size={15} />
                Create Quotation
              </Link>
            )}
          </div>
        ) : (
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 'var(--radius-lg)' }}>
            <table>
              <thead>
                <tr>
                  <th>Quotation #</th>
                  <th>Client</th>
                  <th>Issue Date</th>
                  <th>Valid Until</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuotations.map((inv) => (
                  <tr key={inv._id}>
                    <td style={{ fontWeight: 600 }}>{inv.invoiceNumber}</td>
                    <td>{inv.client?.name || '—'}</td>
                    <td>{new Date(inv.issueDate).toLocaleDateString('en-IN')}</td>
                    <td>{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-IN') : '—'}</td>
                    <td className="font-semibold">{fmtCurrency(inv.total, inv.currency)}</td>
                    <td>
                      <select
                        value={inv.status}
                        onChange={(e) =>
                          handleStatusChange(inv._id, e.target.value)
                        }
                        className="form-control"
                        style={{
                          width: '130px',
                          fontWeight: 600,
                          color:
                            inv.status === 'accepted'
                              ? '#22c55e'
                              : '#9ca3af',

                          border:
                            inv.status === 'accepted'
                              ? '1px solid rgba(34,197,94,.35)'
                              : '1px solid rgba(107,114,128,.35)',

                          background:
                            inv.status === 'accepted'
                              ? 'rgba(34,197,94,.12)'
                              : 'rgba(107,114,128,.12)',
                        }}
                      >
                        <option value="draft">Draft</option>
                        <option value="accepted">Accepted</option>
                      </select>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/quotations/${inv._id}`)} title="View"><Eye size={14} /></button>
                        <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/quotations/${inv._id}/edit`)} title="Edit"><Pencil size={14} /></button>
                        <button
                          className="btn btn-ghost btn-sm"
                          title="Send"
                          disabled={sendingId === inv._id}
                          onClick={(e) => toggleShare(inv._id, e)}
                        >
                          {sendingId === inv._id ? <Loader2 size={14} className="spinner" /> : <Send size={14} />}
                        </button>
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(inv._id)} title="Delete"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Share dropdown */}
      {shareOpenId && shareDropdownPos && (() => {
        const inv = quotations.find((q) => q._id === shareOpenId);
        if (!inv) return null;
        return (
          <>
            <div onClick={() => setShareOpenId(null)} style={{ position: 'fixed', inset: 0, zIndex: 999 }} />
            <div style={{
              position: 'fixed', top: shareDropdownPos.top, left: shareDropdownPos.left,
              zIndex: 1000, minWidth: 170,
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 10, boxShadow: 'var(--shadow)', overflow: 'hidden',
            }}>
              <button type="button" className="dropdown-row" onClick={() => shareViaEmail(inv._id)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'none', border: 'none', borderBottom: '1px solid var(--border)', cursor: 'pointer', fontSize: '0.82rem', color: 'var(--text-primary)', textAlign: 'left' }}>
                <Mail size={14} /> Email
              </button>
              <button type="button" className="dropdown-row" onClick={() => shareViaWhatsapp(inv._id)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.82rem', color: 'var(--text-primary)', textAlign: 'left' }}>
                <MessageCircle size={14} /> WhatsApp
              </button>
            </div>
          </>
        );
      })()}

      {/* WhatsApp customization modal */}
      {whatsappModalData && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1100,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(4px)'
        }}>
          <div className="card" style={{
            width: '90%', maxWidth: '500px', padding: '24px',
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '8px', fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Customize WhatsApp Message
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px', lineHeight: '1.4' }}>
              Review and edit the message template before sending it to WhatsApp. The PDF will also download automatically.
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                Recipient Phone Number
              </label>
              <input
                type="text"
                value={whatsappModalData.phone}
                onChange={(e) => setWhatsappModalData({ ...whatsappModalData, phone: e.target.value })}
                placeholder="e.g. 919876543210"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  outline: 'none',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                Message Text
              </label>
              <textarea
                rows={6}
                value={whatsappModalData.text}
                onChange={(e) => setWhatsappModalData({ ...whatsappModalData, text: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  outline: 'none',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setWhatsappModalData(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  // Trigger PDF download
                  downloadBlob(whatsappModalData.blob, whatsappModalData.fileName);

                  // Open WhatsApp
                  const phone = whatsappModalData.phone.replace(/[^0-9]/g, '');
                  const base = phone ? `https://wa.me/${phone}` : 'https://wa.me/';
                  const waUrl = `${base}?text=${encodeURIComponent(whatsappModalData.text)}`;
                  window.open(waUrl, '_blank');

                  // Close modal
                  setWhatsappModalData(null);
                }}
              >
                Send & Download
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email compose modal */}
      {emailModalData && (
        <EmailComposeModal
          isOpen={!!emailModalData}
          onClose={() => setEmailModalData(null)}
          onSend={handleSendEmail}
          defaultTo={emailModalData.inv?.client?.email || ''}
          defaultCc={currentUser?.email || ''}
          defaultSubject={`Quotation #${emailModalData.inv?.invoiceNumber || ''} from ${currentUser?.businessName || 'your business'} is Ready`}
          defaultBody={`Hello ${emailModalData.inv?.client?.name || 'Customer'},\n\nThank you for choosing ${currentUser?.businessName || 'your business'}.\n\nQuotation Details\n• Quotation No: ${emailModalData.inv?.invoiceNumber || ''}\n• Quotation Date: ${emailModalData.inv?.issueDate ? new Date(emailModalData.inv.issueDate).toLocaleDateString('en-IN') : ''}\n• Valid Until: ${emailModalData.inv?.dueDate ? new Date(emailModalData.inv.dueDate).toLocaleDateString('en-IN') : ''}\n• Amount: ${emailModalData.inv?.currency === 'INR' || !emailModalData.inv?.currency ? '₹' : (emailModalData.inv?.currency || '')}${Number(emailModalData.inv?.total || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}\n{{ViewQuotationButton}}\nA PDF copy of your quotation is attached to this email for your convenience.\n\nFor any queries regarding this quotation, please contact ${currentUser?.email || ''}.\n\nThank you for your business.\n\nRegards,\n${currentUser?.businessName || 'Your Business'}`}
          pdfFileName={emailModalData.fileName}
          title="Quotation"
        />
      )}
    </div>
  );
}