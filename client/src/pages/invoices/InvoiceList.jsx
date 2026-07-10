import { useEffect, useState } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { invoiceAPI } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Eye, Send, Mail, MessageCircle, Loader2 } from 'lucide-react';
import { DEFAULT_COLORS, resolveTemplateColors } from './InvoiceForm';
import { isProfileComplete, getMissingProfileField } from '../../utils/profileValidation';
import { getInvoiceMessage } from '../../utils/whatsappTemplates';
import EmailComposeModal from '../../components/EmailComposeModal';

const fmtCurrency = (n, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 2 }).format(n || 0);

export default function InvoiceList() {
  const { user } = useAuth();
  const { setShowProfilePrompt } = useOutletContext();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shareOpenId, setShareOpenId] = useState(null);
  const [shareDropdownPos, setShareDropdownPos] = useState(null);
  const [sendingId, setSendingId] = useState(null);
  const [whatsappModalData, setWhatsappModalData] = useState(null);
  const [emailModalData, setEmailModalData] = useState(null);
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

  const fetchInvoices = () => {
    setLoading(true);
    invoiceAPI.getAll().then((r) => setInvoices(r.data.invoices)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(fetchInvoices, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this invoice?')) return;
    try {
      await invoiceAPI.delete(id);
      toast.success('Invoice deleted');
      fetchInvoices();
    } catch {
      toast.error('Failed to delete invoice');
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

  // Builds the actual PDF as a File object, reusing the same renderer as InvoiceForm
  const buildInvoicePDFFile = async (invoiceId) => {
    const res = await invoiceAPI.getById(invoiceId);
    const inv = res.data.invoice;

    // Use the template stored on the invoice; fall back to the invoice owner's
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
      // Always pass the resolved template name so '' never slips through
      template: resolvedTpt,
      invoiceType: 'invoice',
      templateColors: resolveTemplateColors(resolvedTpt, inv.templateColors),
      _currency: inv.currency || 'INR',
      _taxType: inv.taxType,
    };

    const [{ pdf }, { default: TemplateResolver }] = await Promise.all([
      import('@react-pdf/renderer'),
      import('./templates/TemplateResolver'),
    ]);
    const blob = await pdf(<TemplateResolver invoice={invoiceForPDF} />).toBlob();
    const fileName = `Invoice-${inv.invoiceNumber}.pdf`;
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
      const { blob, fileName, inv } = await buildInvoicePDFFile(id);
      setEmailModalData({ inv, id, blob, fileName });
    } catch (err) {
      toast.error('Failed to prepare invoice for email');
    } finally {
      setSendingId(null);
    }
  };

  const handleSendEmail = async ({ to, cc, subject, body }) => {
    if (!emailModalData) return;
    const { id, blob, fileName, inv } = emailModalData;
    const viewUrl = `${window.location.origin}/share/invoice/${inv.shareToken}`;
    await invoiceAPI.sendEmail(id, { to, cc, subject, body, pdfBlob: blob, pdfFileName: fileName, viewUrl });
  };

  // 🟢 WHATSAPP — triggers modal to review/edit message before opening WhatsApp
  const shareViaWhatsapp = async (id) => {
    setShareOpenId(null);
    setSendingId(id);
    try {
      const { blob, fileName, inv } = await buildInvoicePDFFile(id);
      const shareUrl = `${window.location.origin}/share/invoice/${inv.shareToken}`;
      const text = getInvoiceMessage(inv, shareUrl, fmtCurrency);
      const phone = inv.client?.phone || '';

      setWhatsappModalData({
        phone,
        text,
        blob,
        fileName
      });
    } catch (err) {
      toast.error('Failed to prepare invoice for WhatsApp');
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Invoices</h1>
          <p className="page-subtitle">Manage all your invoices</p>
        </div>
        <Link to="/invoices/new" className="btn btn-primary" onClick={handleCreate}>
          <Plus size={16} /> New Invoice
        </Link>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="flex-center" style={{ padding: '60px' }}><div className="spinner" /></div>
        ) : invoices.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📄</div>
            <div className="empty-state-title">No invoices found</div>
            <div className="empty-state-desc">Create your first invoice to start billing clients</div>
            <Link to="/invoices/new" className="btn btn-primary" onClick={handleCreate}><Plus size={15} /> Create Invoice</Link>
          </div>
        ) : (
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 'var(--radius-lg)' }}>
            <table>
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Client</th>
                  <th>Issue Date</th>
                  <th>Due Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv._id}>
                    <td style={{ fontWeight: 600 }}>{inv.invoiceNumber}</td>
                    <td>{inv.client?.name || '—'}</td>
                    <td>{new Date(inv.issueDate).toLocaleDateString('en-IN')}</td>
                    <td>{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-IN') : '—'}</td>
                    <td className="font-semibold">{fmtCurrency(inv.total, inv.currency)}</td>
                    <td><span className={`badge badge-${inv.status}`}>{inv.status}</span></td>
                    <td>
                      <div className="flex gap-2">
                        <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/invoices/${inv._id}`)} title="View"><Eye size={14} /></button>
                        <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/invoices/${inv._id}/edit`)} title="Edit"><Pencil size={14} /></button>
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

      {/* Share dropdown — fixed position so it floats above the table, no clipping/overlap */}
      {shareOpenId && shareDropdownPos && (
        <>
          <div
            onClick={() => setShareOpenId(null)}
            style={{ position: 'fixed', inset: 0, zIndex: 999 }}
          />
          <div style={{
            position: 'fixed', top: shareDropdownPos.top, left: shareDropdownPos.left,
            zIndex: 1000, minWidth: 170,
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 10, boxShadow: 'var(--shadow)', overflow: 'hidden',
          }}>
            <button
              type="button"
              className="dropdown-row"
              onClick={() => shareViaEmail(shareOpenId)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'none', border: 'none', borderBottom: '1px solid var(--border)', cursor: 'pointer', fontSize: '0.82rem', color: 'var(--text-primary)', textAlign: 'left' }}
            >
              <Mail size={14} /> Email
            </button>
            <button
              type="button"
              className="dropdown-row"
              onClick={() => shareViaWhatsapp(shareOpenId)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.82rem', color: 'var(--text-primary)', textAlign: 'left' }}
            >
              <MessageCircle size={14} /> WhatsApp
            </button>
          </div>
        </>
      )}

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
          defaultSubject={`Invoice #${emailModalData.inv?.invoiceNumber || ''} from ${currentUser?.businessName || 'your business'}`}
          defaultBody={`Hello ${emailModalData.inv?.client?.name || 'Customer'},\n\nThank you for your business.\n\nInvoice Details\n• Invoice No: ${emailModalData.inv?.invoiceNumber || ''}\n• Invoice Date: ${emailModalData.inv?.issueDate ? new Date(emailModalData.inv.issueDate).toLocaleDateString('en-IN') : ''}\n• Due Date: ${emailModalData.inv?.dueDate ? new Date(emailModalData.inv.dueDate).toLocaleDateString('en-IN') : ''}\n• Amount Due: ${emailModalData.inv?.currency === 'INR' || !emailModalData.inv?.currency ? '₹' : (emailModalData.inv?.currency || '')}${Number(emailModalData.inv?.total || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}\n{{ViewInvoiceButton}}\nA PDF copy of your invoice is attached to this email.\n\nFor any questions regarding this invoice, please contact ${currentUser?.email || ''}.\n\nThank you for choosing ${currentUser?.businessName || 'your business'}.\n\nRegards,\n${currentUser?.businessName || 'Your Business'}`}
          pdfFileName={emailModalData.fileName}
          title="Invoice"
        />
      )}
    </div>
  );
}