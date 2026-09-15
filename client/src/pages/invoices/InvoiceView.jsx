import { useEffect, useState, useCallback, lazy, Suspense } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { invoiceAPI, quotationAPI } from '../../api/services';
import toast from 'react-hot-toast';
import { Pencil, ArrowLeft, CheckCircle, Send, Download, FileText, Loader2 } from 'lucide-react';
import { DEFAULT_COLORS } from './InvoiceForm';

import { useAuth } from '../../context/AuthContext';

const PdfPane = lazy(() => import('./PdfPane'));

const PdfPaneFallback = () => (
  <div className="flex-center" style={{ height: '100%', flexDirection: 'column', gap: 10 }}>
    <Loader2 size={28} className="spin" style={{ color: 'var(--primary)' }} />
    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading PDF renderer…</p>
  </div>
);

export default function InvoiceView() {
  const { user: currentUser } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isQuotation = location.pathname.startsWith('/quotations');
  const docAPI = isQuotation ? quotationAPI : invoiceAPI;
  const docLabel = isQuotation ? 'Quotation' : 'Invoice';
  const basePath = isQuotation ? '/quotations' : '/invoices';

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logoBase64, setLogoBase64] = useState(null);
  const [converting, setConverting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Responsive detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const fetchLogoAsBase64 = useCallback(async (url) => {
    if (!url) return;
    try {
      const jpgUrl = url.includes('cloudinary.com')
        ? url.replace('/upload/', '/upload/f_jpg/')
        : url;
      const res = await fetch(jpgUrl);
      const blob = await res.blob();
      const reader = new FileReader();
      reader.onloadend = () => setLogoBase64(reader.result);
      reader.readAsDataURL(blob);
    } catch {
      // logo fetch failed — renders without it
    }
  }, []);

  useEffect(() => {
    docAPI.getById(id)
      .then((r) => {
        setInvoice(r.data.invoice);
        fetchLogoAsBase64(r.data.invoice?.user?.businessLogo);
      })
      .catch(() => { toast.error(`${docLabel} not found`); navigate(basePath); })
      .finally(() => setLoading(false));
  }, [id]);

  const updateStatus = async (status) => {
    try {
      const r = await docAPI.updateStatus(id, { status });
      setInvoice(r.data.invoice);
      toast.success(`Marked as ${status}`);
    } catch { toast.error('Failed to update status'); }
  };

  const handleConvert = async () => {
    if (!confirm('Convert this quotation to an invoice? The quotation will be marked as accepted.')) return;
    setConverting(true);
    try {
      const r = await quotationAPI.convert(id);
      toast.success(`Invoice ${r.data.invoiceNumber} created!`);
      navigate(`/invoices/${r.data.invoiceId}`);
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.code === 'PLAN_LIMIT_DOCUMENTS') {
        toast.error(err.response.data.message);
        navigate('/upgrade');
        return;
      }
      toast.error('Failed to convert quotation');
    } finally {
      setConverting(false);
    }
  };

  if (loading) return (
    <div className="flex-center" style={{ minHeight: '60vh', flexDirection: 'column', gap: 12 }}>
      <div className="spinner" />
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading…</p>
    </div>
  );
  if (!invoice) return null;

  const currency = invoice.currency || 'INR';
  const effectiveTemplate = invoice.template || (isQuotation ? invoice.user?.quotationTemplate : invoice.user?.invoiceTemplate) || 'template1';
  const colors = invoice.templateColors ||
    (invoice.template ? (DEFAULT_COLORS[invoice.template.toLowerCase()] || null) : (isQuotation ? invoice.user?.quotationTemplateColors : invoice.user?.invoiceTemplateColors)) ||
    DEFAULT_COLORS[(effectiveTemplate || 'template1').toLowerCase()];

  const userForPDF = {
    ...currentUser,
    ...invoice.user,
    ...(logoBase64 ? { businessLogo: logoBase64 } : {}),
    businessSeal: invoice.user?.businessSeal || currentUser?.businessSeal || '',
  };

  const invoiceForPDF = {
    ...invoice,
    invoiceType: isQuotation ? 'quotation' : 'invoice',
    _currency: currency,
    template: effectiveTemplate,
    templateColors: colors,
    user: userForPDF
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: isMobile ? 'auto' : 'calc(100vh - 64px)',
      height: isMobile ? 'auto' : 'calc(100vh - 64px)',
      padding: isMobile ? '12px' : '0',
      boxSizing: 'border-box',
    }}>

      {/* ── Top bar ── */}
      <div className="page-header" style={{
        flexShrink: 0,
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'stretch' : 'center',
        justifyContent: 'space-between',
        gap: isMobile ? 12 : 0,
        padding: isMobile ? '12px 0' : undefined,
        flexWrap: 'wrap',
      }}>
        {/* Left: back + title + badge */}
        <div className="flex gap-3" style={{
          alignItems: 'center',
          width: isMobile ? '100%' : 'auto',
          minWidth: 0,
        }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(basePath)} style={{ flexShrink: 0 }}>
            <ArrowLeft size={16} />
          </button>
          <div style={{ minWidth: 0, overflow: 'hidden' }}>
            <h1 className="page-title" style={{
              fontSize: isMobile ? '1rem' : undefined,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              margin: 0,
            }}>
              {invoice.invoiceNumber || invoice.quotationNumber}
            </h1>
            <span className={`badge badge-${invoice.status}`}>{invoice.status}</span>
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex gap-2" style={{
          flexWrap: 'wrap',
          width: isMobile ? '100%' : 'auto',
          justifyContent: isMobile ? 'flex-start' : 'flex-end',
          gap: isMobile ? 8 : undefined,
        }}>
          {isQuotation ? (
            invoice.status !== 'accepted' && (
              <button
                className="btn btn-primary"
                disabled={converting}
                onClick={handleConvert}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  flex: isMobile ? '1 1 auto' : undefined,
                  justifyContent: 'center',
                  fontSize: isMobile ? '0.8rem' : undefined,
                  padding: isMobile ? '8px 12px' : undefined,
                  whiteSpace: 'nowrap',
                }}
              >
                <FileText size={15} />
                {converting ? 'Converting…' : 'Convert to Invoice'}
              </button>
            )
          ) : (
            <>
              {invoice.status === 'draft' && (
                <button
                  className="btn btn-secondary"
                  onClick={() => updateStatus('pending')}
                  style={{
                    flex: isMobile ? '1 1 auto' : undefined,
                    justifyContent: 'center',
                    fontSize: isMobile ? '0.8rem' : undefined,
                    padding: isMobile ? '8px 12px' : undefined,
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Send size={15} /> Mark Pending
                </button>
              )}
              {invoice.status === 'pending' && (
                <button
                  className="btn btn-secondary"
                  style={{
                    color: 'var(--success)',
                    flex: isMobile ? '1 1 auto' : undefined,
                    justifyContent: 'center',
                    fontSize: isMobile ? '0.8rem' : undefined,
                    padding: isMobile ? '8px 12px' : undefined,
                    whiteSpace: 'nowrap',
                  }}
                  onClick={() => updateStatus('paid')}
                >
                  <CheckCircle size={15} /> Mark Paid
                </button>
              )}
            </>
          )}

          {/* Download — triggers native save from the blob URL */}
          <a
            href={invoiceForPDF ? undefined : '#'}
            id="pdf-download-btn"
            className="btn btn-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              textDecoration: 'none',
              flex: isMobile ? '1 1 auto' : undefined,
              justifyContent: 'center',
              fontSize: isMobile ? '0.8rem' : undefined,
              padding: isMobile ? '8px 12px' : undefined,
              whiteSpace: 'nowrap',
            }}
            onClick={async (e) => {
              e.preventDefault();
              try {
                const [{ pdf }, { default: TemplateResolver }] = await Promise.all([
                  import('@react-pdf/renderer'),
                  import('./templates/TemplateResolver'),
                ]);
                const blob = await pdf(<TemplateResolver invoice={invoiceForPDF} />).toBlob();
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `${docLabel}-${invoice.invoiceNumber || invoice.quotationNumber}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
              } catch {
                toast.error('Failed to generate PDF');
              }
            }}
          >
            <Download size={15} /> Download PDF
          </a>

          <Link
            to={`${basePath}/${id}/edit`}
            className="btn btn-primary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              textDecoration: 'none',
              flex: isMobile ? '1 1 auto' : undefined,
              justifyContent: 'center',
              fontSize: isMobile ? '0.8rem' : undefined,
              padding: isMobile ? '8px 12px' : undefined,
              whiteSpace: 'nowrap',
            }}
          >
            <Pencil size={15} /> Edit
          </Link>
        </div>
      </div>

      {/* ── PDF embed — responsive ── */}
      <div style={{
        flex: isMobile ? 'none' : 1,
        minHeight: isMobile ? '70vh' : 0,
        height: isMobile ? '70vh' : 'auto',
        borderRadius: 12,
        overflow: 'hidden',
        border: '1px solid var(--border)',
        background: '#525659',
        width: isMobile ? '100%' : '60%',
        maxWidth: isMobile ? '100%' : 900,
        margin: isMobile ? '0' : '0 auto',
        boxSizing: 'border-box',
      }}>
        <Suspense fallback={<PdfPaneFallback />}>
          <PdfPane invoice={invoiceForPDF} />
        </Suspense>
      </div>
    </div>
  );
}
