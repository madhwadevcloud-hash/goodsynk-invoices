import { usePDF } from '@react-pdf/renderer';
import { Loader2 } from 'lucide-react';
import InvoicePDF from './InvoicePDF';

/**
 * Renders the invoice as an embedded PDF iframe.
 * This component is lazy-loaded by InvoiceView so that @react-pdf/renderer
 * (a large library) is only downloaded when the user opens an invoice.
 */
export default function PdfPane({ invoice }) {
  const [instance] = usePDF({ document: <InvoicePDF invoice={invoice} /> });

  if (instance.loading) return (
    <div className="flex-center" style={{ height: '100%', flexDirection: 'column', gap: 10 }}>
      <Loader2 size={28} className="spin" style={{ color: 'var(--primary)' }} />
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Generating PDF…</p>
    </div>
  );

  if (instance.error) return (
    <div className="flex-center" style={{ height: '100%' }}>
      <p style={{ color: 'var(--danger)' }}>Failed to render PDF.</p>
    </div>
  );

  return (
    <iframe
      src={`${instance.url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
      title="Invoice PDF"
      width="100%"
      height="100%"
      style={{ border: 'none', display: 'block', background: '#525659' }}
    />
  );
}
