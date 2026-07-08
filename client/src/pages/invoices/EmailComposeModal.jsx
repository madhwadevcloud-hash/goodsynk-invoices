import { useState, useEffect } from 'react';
import { X, Send, Paperclip, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * EmailComposeModal — sends entirely client-side, no backend/API key needed.
 *
 * Props:
 *   isOpen, onClose
 *   onSend        – optional ({ to, subject, body }) => void|Promise, fired after the
 *                    share sheet / mailto is triggered (e.g. to mark status as "sent")
 *   defaultTo / defaultSubject / defaultBody
 *   pdfBlob, pdfFileName
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

    // Re-sync fields whenever the modal is (re)opened for a different document
    useEffect(() => {
        if (isOpen) {
            setTo(defaultTo);
            setSubject(defaultSubject);
            setBody(defaultBody);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, defaultTo, defaultSubject, defaultBody]);

    if (!isOpen) return null;

    const handleSend = async (e) => {
        e.preventDefault();
        if (!to.trim()) {
            toast.error('Please enter a recipient email');
            return;
        }
        setSending(true);
        try {
            const file = pdfBlob
                ? new File([pdfBlob], pdfFileName || 'document.pdf', { type: 'application/pdf' })
                : null;

            if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
                // Native share sheet — PDF genuinely attached, user picks the email app
                await navigator.share({
                    title: subject || title,
                    text: body,
                    files: [file],
                });
                toast.success(`Share sheet opened — pick your email app to send the ${title.toLowerCase()}.`);
            } else {
                // Desktop fallback: download PDF, then open a pre-filled mailto draft.
                // mailto: can never carry attachments (browser limitation) —
                // user attaches the file that was just downloaded.
                if (pdfBlob) {
                    const url = URL.createObjectURL(pdfBlob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = pdfFileName || 'document.pdf';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                }

                const mailto = `mailto:${encodeURIComponent(to.trim())}?subject=${encodeURIComponent(subject || '')}&body=${encodeURIComponent(body || '')}`;
                window.location.href = mailto;

                toast.success('PDF downloaded — attach it in the email draft that just opened.', { duration: 5000 });
            }

            if (onSend) await onSend({ to: to.trim(), subject, body });
            onClose();
        } catch (err) {
            // AbortError = user closed the native share sheet without picking anything — not a real failure
            if (err?.name !== 'AbortError') {
                toast.error(err?.message || `Failed to send ${title.toLowerCase()}`);
            }
        } finally {
            setSending(false);
        }
    };

    return (
        <>
            <div
                onClick={!sending ? onClose : undefined}
                style={{ position: 'fixed', inset: 0, zIndex: 1999, background: 'rgba(0,0,0,0.5)' }}
            />

            <div
                style={{
                    position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    zIndex: 2000, width: '92%', maxWidth: 500,
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: 14, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden',
                }}
            >
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px 20px', borderBottom: '1px solid var(--border)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Paperclip size={15} style={{ color: 'var(--primary)' }} />
                        <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Send {title} via Email</span>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={sending}
                        style={{ background: 'none', border: 'none', cursor: sending ? 'not-allowed' : 'pointer', color: 'var(--text-muted)', padding: 4 }}
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSend} style={{ padding: '20px' }}>
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

                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '8px 12px', marginBottom: 16,
                        background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)',
                        fontSize: '0.82rem', color: 'var(--text-secondary)',
                    }}>
                        <Paperclip size={14} style={{ color: 'var(--primary)' }} />
                        <span style={{ flex: 1 }}>{pdfFileName || 'document.pdf'}</span>
                        <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: 4, background: 'var(--primary)', color: '#fff' }}>attached</span>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary w-full"
                        disabled={sending}
                        style={{ justifyContent: 'center', gap: 6 }}
                    >
                        {sending ? (<><Loader2 size={16} className="spinner" /> Sending…</>) : (<><Send size={16} /> Send {title}</>)}
                    </button>
                </form>
            </div>
        </>
    );
}