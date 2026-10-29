import { useState, useEffect } from 'react';
import { X, Send, Paperclip, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const animationStyles = `
@keyframes emailDrawerSlideIn {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}
@keyframes emailDrawerFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
`;

/**
 * EmailComposeModal (Slide-in Drawer from Right)
 */
export default function EmailComposeModal({
    isOpen,
    onClose,
    onSend,
    onUndo,
    defaultTo = '',
    defaultCc = '',
    defaultSubject = '',
    defaultBody = '',
    pdfFileName = 'document.pdf',
    title = 'Invoice',
}) {
    const [to, setTo] = useState(defaultTo);
    const [cc, setCc] = useState(defaultCc);
    const [extraTo, setExtraTo] = useState([]);
    const [extraCc, setExtraCc] = useState([]);
    const [subject, setSubject] = useState(defaultSubject);
    const [body, setBody] = useState(defaultBody);
    const [sending, setSending] = useState(false);

    // Sync state when defaults change
    useEffect(() => {
        if (isOpen) {
            setTo(defaultTo);
            setCc(defaultCc);
            setExtraTo([]);
            setExtraCc([]);
            setSubject(defaultSubject);
            setBody(defaultBody);
        }
    }, [isOpen, defaultTo, defaultCc, defaultSubject, defaultBody]);

    if (!isOpen) return null;

    const handleSend = async (e) => {
        e.preventDefault();
        const recipients = [to, ...extraTo].flatMap((value) => value.split(/[;,\n]+/)).map((email) => email.trim()).filter(Boolean);
        const ccRecipients = [cc, ...extraCc].flatMap((value) => value.split(/[;,\n]+/)).map((email) => email.trim()).filter(Boolean);
        const isEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        if (!recipients.length) {
            toast.error('Please enter a recipient email');
            return;
        }
        if ([...recipients, ...ccRecipients].some((email) => !isEmail(email))) {
            toast.error('Please enter valid email addresses separated by commas');
            return;
        }
        setSending(true);
        try {
            const response = await onSend({
                to: recipients,
                cc: ccRecipients,
                subject, 
                body 
            });
            const emailId = response?.data?.id;
            toast.custom((toastItem) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 10, boxShadow: 'var(--shadow-lg)' }}>
                    <span>{title} email is sending…</span>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={async () => {
                        try {
                            await onUndo(emailId);
                            toast.dismiss(toastItem.id);
                            toast.success('Email canceled');
                        } catch (err) {
                            toast.dismiss(toastItem.id);
                            toast.error(err?.response?.data?.message || 'The email can no longer be undone');
                        }
                    }}>Undo</button>
                </div>
            ), { duration: response?.data?.undoWindowMs || 10000 });
            onClose();
        } catch (err) {
            toast.error(err?.response?.data?.message || err?.message || `Failed to send ${title.toLowerCase()}`);
        } finally {
            setSending(false);
        }
    };

    return (
        <>
            <style>{animationStyles}</style>
            
            {/* Backdrop */}
            <div
                onClick={!sending ? onClose : undefined}
                style={{
                    position: 'fixed', inset: 0, zIndex: 1999,
                    background: 'rgba(0,0,0,0.4)',
                    backdropFilter: 'blur(2px)',
                    animation: 'emailDrawerFadeIn 0.2s ease-out'
                }}
            />

            {/* Slide-in Drawer Container */}
            <div
                style={{
                    position: 'fixed', top: 0, right: 0, bottom: 0,
                    zIndex: 2000, width: '100%', maxWidth: 500,
                    height: '100vh',
                    background: 'var(--bg-card)',
                    borderLeft: '1px solid var(--border)',
                    boxShadow: '-10px 0 30px rgba(0,0,0,0.15)',
                    display: 'flex', flexDirection: 'column',
                    animation: 'emailDrawerSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    overflow: 'hidden'
                }}
            >
                {/* Header */}
                <div
                    style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '18px 24px',
                        borderBottom: '1px solid var(--border)',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Send size={16} style={{ color: 'var(--primary)' }} />
                        <span style={{ fontWeight: 600, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                            Send {title}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={sending}
                        style={{
                            background: 'none', border: 'none', cursor: sending ? 'not-allowed' : 'pointer',
                            color: 'var(--text-muted)', padding: 4, display: 'flex', alignItems: 'center'
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form Wrapper */}
                <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                    
                    {/* Scrollable Form Content */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                        {/* To */}
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>To</label>
                            <input
                                type="text"
                                placeholder="client@example.com, accounts@example.com"
                                value={to}
                                onChange={(e) => setTo(e.target.value)}
                                required
                                disabled={sending}
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
                            {extraTo.map((email, index) => (
                                <div key={`to-${index}`} style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                                    <input type="text" aria-label={`Additional recipient ${index + 1}`} placeholder="another@example.com" value={email} onChange={(e) => setExtraTo((values) => values.map((value, i) => i === index ? e.target.value : value))} disabled={sending} style={{ flex: 1, minWidth: 0, padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '0.9rem', fontFamily: 'inherit' }} />
                                    <button type="button" aria-label="Remove recipient" className="btn btn-ghost btn-sm" onClick={() => setExtraTo((values) => values.filter((_, i) => i !== index))} disabled={sending}><X size={16} /></button>
                                </div>
                            ))}
                            <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 6, paddingLeft: 0, color: 'var(--primary)' }} onClick={() => setExtraTo((values) => [...values, ''])} disabled={sending}>+ Add recipient</button>
                        </div>

                        {/* Cc */}
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>Cc</label>
                            <input
                                type="text"
                                placeholder="company@example.com, manager@example.com"
                                value={cc}
                                onChange={(e) => setCc(e.target.value)}
                                disabled={sending}
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
                            {extraCc.map((email, index) => (
                                <div key={`cc-${index}`} style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                                    <input type="text" aria-label={`Additional Cc recipient ${index + 1}`} placeholder="another@example.com" value={email} onChange={(e) => setExtraCc((values) => values.map((value, i) => i === index ? e.target.value : value))} disabled={sending} style={{ flex: 1, minWidth: 0, padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-card)', color: 'var(--text-primary)', fontSize: '0.9rem', fontFamily: 'inherit' }} />
                                    <button type="button" aria-label="Remove Cc recipient" className="btn btn-ghost btn-sm" onClick={() => setExtraCc((values) => values.filter((_, i) => i !== index))} disabled={sending}><X size={16} /></button>
                                </div>
                            ))}
                            <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 6, paddingLeft: 0, color: 'var(--primary)' }} onClick={() => setExtraCc((values) => [...values, ''])} disabled={sending}>+ Add Cc</button>
                        </div>

                        {/* Subject */}
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>Subject</label>
                            <input
                                type="text"
                                placeholder="Subject"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                disabled={sending}
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

                        {/* Body */}
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>Message (Body)</label>
                            <textarea
                                rows={6}
                                placeholder="Thank you for your business!"
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                disabled={sending}
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

                        {/* Attachment indicator */}
                        <div
                            style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                padding: '10px 14px',
                                background: 'var(--bg-card)',
                                borderRadius: 8,
                                border: '1px solid var(--border)',
                                fontSize: '0.82rem',
                                color: 'var(--text-secondary)',
                            }}
                        >
                            <Paperclip size={14} style={{ color: 'var(--primary)' }} />
                            <span style={{ flex: 1, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{pdfFileName}</span>
                            <span style={{
                                fontSize: '0.7rem', padding: '2px 6px', borderRadius: 4,
                                background: 'var(--primary, #4A72D4)', color: '#fff', fontWeight: 600
                            }}>attached</span>
                        </div>
                    </div>

                    {/* Fixed Footer */}
                    <div
                        style={{
                            padding: '16px 24px',
                            borderTop: '1px solid var(--border)',
                            background: 'var(--bg-card)',
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '12px'
                        }}
                    >
                        <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={onClose}
                            disabled={sending}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={sending}
                            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                            {sending ? (
                                <><Loader2 size={16} className="spinner" /> Sending…</>
                            ) : (
                                <><Send size={14} /> Send Email</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}
