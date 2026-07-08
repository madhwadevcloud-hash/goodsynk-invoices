import { useState } from 'react';
import { X, Send, Paperclip, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * EmailComposeModal
 *
 * Props:
 *   isOpen        – boolean
 *   onClose       – () => void
 *   onSend        – ({ to, subject, body, pdfBlob, pdfFileName }) => Promise<void>
 *   defaultTo     – pre-filled recipient email
 *   defaultSubject– pre-filled subject line
 *   defaultBody   – pre-filled body text
 *   pdfBlob       – Blob of the generated PDF
 *   pdfFileName   – name of the PDF file
 *   title         – "Invoice" or "Quotation"
 */
export default function EmailComposeModal({
    isOpen,
    onClose,
    onSend,
    defaultTo = '',
    defaultSubject = '',
    defaultBody = '',
    pdfBlob,
    pdfFileName,
    title = 'Invoice',
}) {
    const [to, setTo] = useState(defaultTo);
    const [subject, setSubject] = useState(defaultSubject);
    const [body, setBody] = useState(defaultBody);
    const [sending, setSending] = useState(false);

    // Reset fields when modal opens with new defaults
    if (isOpen && to !== defaultTo && !sending) {
        // Only resets if the modal was re-opened for a different invoice
        if (to !== defaultTo) {
            setTo(defaultTo);
            setSubject(defaultSubject);
            setBody(defaultBody);
        }
    }

    if (!isOpen) return null;

    const handleSend = async (e) => {
        e.preventDefault();
        if (!to.trim()) {
            toast.error('Please enter a recipient email');
            return;
        }
        setSending(true);
        try {
            await onSend({ to: to.trim(), subject, body, pdfBlob, pdfFileName });
            toast.success(`${title} sent successfully!`);
            onClose();
        } catch (err) {
            toast.error(err?.message || `Failed to send ${title.toLowerCase()}`);
        } finally {
            setSending(false);
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={!sending ? onClose : undefined}
                style={{
                    position: 'fixed', inset: 0, zIndex: 1999,
                    background: 'rgba(0,0,0,0.5)',
                }}
            />

            {/* Modal */}
            <div
                style={{
                    position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    zIndex: 2000, width: '92%', maxWidth: 500,
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 14,
                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                    overflow: 'hidden',
                }}
            >
                {/* Header */}
                <div
                    style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '16px 20px',
                        borderBottom: '1px solid var(--border)',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Paperclip size={15} style={{ color: 'var(--primary)' }} />
                        <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                            Send {title} via Email
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={sending}
                        style={{
                            background: 'none', border: 'none', cursor: sending ? 'not-allowed' : 'pointer',
                            color: 'var(--text-muted)', padding: 4,
                        }}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSend} style={{ padding: '20px' }}>
                    {/* To */}
                    <div className="form-group" style={{ marginBottom: 14 }}>
                        <label className="form-label" style={{ fontSize: '0.8rem' }}>To</label>
                        <input
                            className="form-control"
                            type="email"
                            placeholder="client@example.com"
                            value={to}
                            onChange={(e) => setTo(e.target.value)}
                            required
                            disabled={sending}
                        />
                    </div>

                    {/* Subject */}
                    <div className="form-group" style={{ marginBottom: 14 }}>
                        <label className="form-label" style={{ fontSize: '0.8rem' }}>Subject</label>
                        <input
                            className="form-control"
                            placeholder="Subject"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            disabled={sending}
                        />
                    </div>

                    {/* Body */}
                    <div className="form-group" style={{ marginBottom: 14 }}>
                        <label className="form-label" style={{ fontSize: '0.8rem' }}>Message</label>
                        <textarea
                            className="form-control"
                            rows={5}
                            placeholder="Write your message..."
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            disabled={sending}
                            style={{ resize: 'vertical', fontFamily: 'inherit' }}
                        />
                    </div>

                    {/* Attachment indicator */}
                    <div
                        style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '8px 12px', marginBottom: 16,
                            background: 'var(--bg)',
                            borderRadius: 8,
                            border: '1px solid var(--border)',
                            fontSize: '0.82rem',
                            color: 'var(--text-secondary)',
                        }}
                    >
                        <Paperclip size={14} style={{ color: 'var(--primary)' }} />
                        <span style={{ flex: 1 }}>{pdfFileName || 'document.pdf'}</span>
                        <span style={{
                            fontSize: '0.7rem', padding: '2px 6px', borderRadius: 4,
                            background: 'var(--primary)', color: '#fff',
                        }}>attached</span>
                    </div>

                    {/* Send button */}
                    <button
                        type="submit"
                        className="btn btn-primary w-full"
                        disabled={sending}
                        style={{ justifyContent: 'center', gap: 6 }}
                    >
                        {sending ? (
                            <><Loader2 size={16} className="spinner" /> Sending…</>
                        ) : (
                            <><Send size={16} /> Send {title}</>
                        )}
                    </button>
                </form>
            </div>
        </>
    );
}