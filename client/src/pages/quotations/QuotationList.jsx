import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { quotationAPI } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Eye, Send, Mail, MessageCircle, Loader2 } from 'lucide-react';
import { DEFAULT_COLORS } from '../invoices/InvoiceForm';
import EmailComposeModal from '../invoices/EmailComposeModal';

const fmtCurrency = (n, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 2 }).format(n || 0);

export default function QuotationList() {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shareOpenId, setShareOpenId] = useState(null);
  const [shareDropdownPos, setShareDropdownPos] = useState(null);
  const [sendingId, setSendingId] = useState(null);
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  // Email modal state
  const [emailModal, setEmailModal] = useState({
    open: false,
    to: '',
    subject: '',
    body: '',
    pdfBlob: null,
    pdfFileName: '',
    quotationId: null,
  });

  const fetchQuotations = () => {
    setLoading(true);
    quotationAPI.getAll()
      .then((r) => setQuotations(r.data.quotations || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(fetchQuotations, []);

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

  // Builds the actual PDF as a File object, reusing the same renderer as InvoiceForm
  const buildQuotationPDFFile = async (quotationId) => {
    const res = await quotationAPI.getById(quotationId);
    const inv = res.data.invoice;

    const resolvedTpt = (inv.template || currentUser?.invoiceTemplate || 'template1').toLowerCase();
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
      invoiceType: 'quotation',
      templateColors: inv.templateColors || DEFAULT_COLORS[resolvedTpt],
      _currency: inv.currency || 'INR',
      _taxType: inv.taxType,
    };

    const [{ pdf }, { default: InvoicePDF }] = await Promise.all([
      import('@react-pdf/renderer'),
      import('../invoices/InvoicePDF'),
    ]);
    const blob = await pdf(<InvoicePDF invoice={invoiceForPDF} />).toBlob();
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

  // 🟢 EMAIL — Opens the compose modal with PDF attached (no download needed)
  const shareViaEmail = async (inv, id) => {
    setShareOpenId(null);
    setSendingId(id);
    try {
      const { blob, fileName, inv: fullInv } = await buildQuotationPDFFile(id);
      const subject = `Quotation ${fullInv.invoiceNumber}`;
      const body = `Hi ${fullInv.client?.name || ''},\n\nPlease find attached your quotation ${fullInv.invoiceNumber} for ${fmtCurrency(fullInv.total, fullInv.currency)}.\n\nThank you.`;

      setEmailModal({
        open: true,
        to: fullInv.client?.email || '',
        subject,
        body,
        pdfBlob: blob,
        pdfFileName: fileName,
        quotationId: id,
      });
    } catch (err) {
      if (err?.name !== 'AbortError') toast.error('Failed to prepare quotation');
    } finally {
      setSendingId(null);
    }
  };

  // 🟢 Send email via backend API
  const handleSendEmail = async ({ to, subject, body, pdfBlob, pdfFileName }) => {
    await quotationAPI.sendEmail(emailModal.quotationId, { to, subject, body, pdfBlob, pdfFileName });
  };

  // 🟢 WHATSAPP — Opens WhatsApp directly with pre-filled text
  const shareViaWhatsapp = async (id) => {
    setShareOpenId(null);
    setSendingId(id);

    try {
      const { file, fileName, inv } = await buildQuotationPDFFile(id);
      const text = `Hi ${inv.client?.name || ''}, here's your quotation ${inv.invoiceNumber} for ${fmtCurrency(inv.total, inv.currency)}.`;

      // Real attachment — only works where the OS share sheet supports files
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ title: text, text, files: [file] });
        return;
      }

      // Fallback: wa.me only accepts prefilled text, never files —
      // this is a WhatsApp link limitation, not something any code can work around.
      const phone = (inv.client?.phone || '').replace(/[^0-9]/g, '');
      const base = phone ? `https://wa.me/${phone}` : 'https://wa.me/';
      const waUrl = `${base}?text=${encodeURIComponent(text)}`;
      window.open(waUrl, '_blank');
    } catch (err) {
      if (err?.name !== 'AbortError') toast.error('Failed to prepare quotation for WhatsApp');
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
        <Link to="/quotations/new" className="btn btn-primary">
          <Plus size={16} /> New Quotation
        </Link>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="flex-center" style={{ padding: '60px' }}><div className="spinner" /></div>
        ) : quotations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-title">No quotations found</div>
            <div className="empty-state-desc">Create your first quotation to share with clients</div>
            <Link to="/quotations/new" className="btn btn-primary"><Plus size={15} /> Create Quotation</Link>
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
                {quotations.map((inv) => (
                  <tr key={inv._id}>
                    <td style={{ fontWeight: 600 }}>{inv.invoiceNumber}</td>
                    <td>{inv.client?.name || '—'}</td>
                    <td>{new Date(inv.issueDate).toLocaleDateString('en-IN')}</td>
                    <td>{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-IN') : '—'}</td>
                    <td className="font-semibold">{fmtCurrency(inv.total, inv.currency)}</td>
                    <td><span className={`badge badge-${inv.status}`}>{inv.status}</span></td>
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

      {/* Share dropdown — fixed position so it floats above the table, no clipping/overlap */}
      {shareOpenId && shareDropdownPos && (() => {
        const inv = quotations.find((q) => q._id === shareOpenId);
        if (!inv) return null;
        return (
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
                onClick={() => shareViaEmail(inv, inv._id)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 14px', background: 'none', border: 'none',
                  borderBottom: '1px solid var(--border)', cursor: 'pointer',
                  fontSize: '0.82rem', color: 'var(--text-primary)', textAlign: 'left',
                }}
              >
                <Mail size={14} /> Email
              </button>
              <button
                type="button"
                className="dropdown-row"
                onClick={() => shareViaWhatsapp(inv._id)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 14px', background: 'none', border: 'none',
                  cursor: 'pointer', fontSize: '0.82rem', color: 'var(--text-primary)', textAlign: 'left',
                }}
              >
                <MessageCircle size={14} /> WhatsApp
              </button>
            </div>
          </>
        );
      })()}

      {/* Email Compose Modal */}
      <EmailComposeModal
        isOpen={emailModal.open}
        onClose={() => setEmailModal({ ...emailModal, open: false })}
        onSend={handleSendEmail}
        defaultTo={emailModal.to}
        defaultSubject={emailModal.subject}
        defaultBody={emailModal.body}
        pdfBlob={emailModal.pdfBlob}
        pdfFileName={emailModal.pdfFileName}
        title="Quotation"
      />
    </div>
  );
}