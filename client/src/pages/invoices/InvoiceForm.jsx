import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { invoiceAPI, clientAPI, productAPI, quotationAPI } from '../../api/services';
import toast from 'react-hot-toast';
import { Plus, Trash2, Save, Download, Loader2, X, ChevronDown, Percent, Tag } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { pdf } from '@react-pdf/renderer';
import InvoicePDF from './InvoicePDF';

const defaultItem = () => ({
  name: '', description: '', hsn: '', quantity: 1, unit: 'pcs',
  price: 0, discount: 0, cgstRate: 0, sgstRate: 0, igstRate: 0, vatRate: 0,
});

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand',
  'West Bengal', 'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Puducherry', 'Chandigarh', 'Other Territory',
];

const CURRENCIES = [
  { code: 'INR', symbol: '₹', label: 'Indian Rupee (INR, ₹)' },
  { code: 'USD', symbol: '$', label: 'US Dollar (USD, $)' },
  { code: 'EUR', symbol: '€', label: 'Euro (EUR, €)' },
  { code: 'GBP', symbol: '£', label: 'British Pound (GBP, £)' },
  { code: 'AED', symbol: 'د.إ', label: 'UAE Dirham (AED, د.إ)' },
  { code: 'SGD', symbol: 'S$', label: 'Singapore Dollar (SGD, S$)' },
];

const UNITS = [
  'pcs', 'nos', 'kg', 'g', 'mg', 'l', 'ml',
  'm', 'cm', 'mm', 'ft', 'inch',
  'box', 'set', 'pair', 'dozen', 'pack',
  'hr', 'day', 'month', 'job', 'sqft', 'sqm',
];

export const DEFAULT_COLORS = {
  template1: { primary: '#4A72D4' },
  template2: { primary: '#000000' },
  template3: { primary: '#1a3a6b', secondary: '#F0F4F8' },
  template4: { primary: '#1C2541', secondary: '#d4af37' }, // Navy, Gold
  template5: { primary: '#0A66C2' },
  template6: { primary: '#E8662B', secondary: '#1C2541' }, // Orange, Navy
};

export default function InvoiceForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isEdit = !!id;
  const isQuotation = location.pathname.startsWith('/quotations');
  const docType = isQuotation ? 'quotation' : 'invoice';
  const docLabel = isQuotation ? 'Quotation' : 'Invoice';
  const basePath = isQuotation ? '/quotations' : '/invoices';
  const docAPI = isQuotation ? quotationAPI : invoiceAPI;

  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const { user: currentUser } = useAuth();
  const [showHsn, setShowHsn] = useState(true);

  // ── Configure Tax modal state
  const [taxModal, setTaxModal] = useState(false);
  const [taxDraft, setTaxDraft] = useState({ taxType: 'gst_india', placeOfSupply: 'Other Territory', gstType: 'cgst_sgst', reverseCharge: false });

  // ── Number & Currency Format modal state — removed

  // ── Configure Discount modal state
  const [discModal, setDiscModal] = useState(false);
  const [discConfig, setDiscConfig] = useState({
    mode: 'item', // 'item' | 'overall'
    lines: [{ name: 'Discount', type: 'percent', value: 0 }],
  });
  const [discDraft, setDiscDraft] = useState(discConfig);

  const openDiscModal = () => { setDiscDraft(JSON.parse(JSON.stringify(discConfig))); setDiscModal(true); };
  const saveDiscConfig = () => { setDiscConfig(discDraft); setDiscModal(false); };
  const addDiscLine = () => setDiscDraft(d => ({ ...d, lines: [...d.lines, { name: 'Discount', type: 'percent', value: 0 }] }));
  const removeDiscLine = (i) => setDiscDraft(d => ({ ...d, lines: d.lines.filter((_, idx) => idx !== i) }));
  const setDiscLine = (i, key, val) => setDiscDraft(d => ({ ...d, lines: d.lines.map((l, idx) => idx === i ? { ...l, [key]: val } : l) }));

  const openTaxModal = () => {
    setTaxDraft({
      taxType: 'gst_india',
      placeOfSupply: form.placeOfSupply || 'Other Territory',
      gstType: form.isInterstate ? 'igst' : 'cgst_sgst',
      reverseCharge: false,
    });
    setTaxModal(true);
  };

  const saveTaxConfig = () => {
    setField('isInterstate', taxDraft.gstType === 'igst');
    setField('placeOfSupply', taxDraft.placeOfSupply);
    setField('taxType', taxDraft.taxType);
    // If switching to No Tax, clear all tax rates
    if (taxDraft.taxType === 'none') {
      setForm(f => ({ ...f, items: f.items.map(item => ({ ...item, cgstRate: 0, sgstRate: 0, igstRate: 0, vatRate: 0 })) }));
    }
    setTaxModal(false);
  };


  const [form, setForm] = useState({
    client: '',
    invoiceType: docType,
    invoiceNumber: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    isInterstate: false,
    taxType: 'gst_india',
    notes: '',
    termsAndConditions: '',
    paymentInfo: '',
    template: '',
    templateColors: null, // { primary, secondary }
    items: [defaultItem()],
  });

  useEffect(() => {
    setLoading(true);
    Promise.all([clientAPI.getAll(), productAPI.getAll()])
      .then(([cRes, pRes]) => {
        setClients(cRes.data.clients);
        setProducts(pRes.data.products);
      })
      .catch(console.error);

    if (isEdit) {
      docAPI.getById(id).then((r) => {
        const inv = r.data.invoice;
        setForm({
          client: inv.client?._id || '',
          invoiceType: inv.invoiceType || docType,
          invoiceNumber: inv.invoiceNumber || '',
          issueDate: inv.issueDate ? new Date(inv.issueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          dueDate: inv.dueDate ? new Date(inv.dueDate).toISOString().split('T')[0] : '',
          isInterstate: inv.isInterstate || false,
          taxType: inv.taxType || 'gst_india',
          notes: inv.notes || '',
          termsAndConditions: inv.termsAndConditions || '',
          paymentInfo: inv.paymentInfo || '',
          template: inv.template || '',
          templateColors: inv.templateColors || null,
          items: inv.items?.length ? inv.items : [defaultItem()],
        });
      }).catch(() => toast.error('Failed to load invoice'))
        .finally(() => setLoading(false));
    } else if (currentUser) {
      setForm(f => ({
        ...f,
        template: currentUser.invoiceTemplate || 'template1',
        templateColors: currentUser.invoiceTemplateColors || DEFAULT_COLORS[currentUser.invoiceTemplate || 'template1'] || null,
      }));
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [id, currentUser]);

  const setField = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const setItem = (idx, key, val) =>
    setForm((f) => ({ ...f, items: f.items.map((item, i) => i === idx ? { ...item, [key]: val } : item) }));

  const addItem = () => setForm((f) => ({ ...f, items: [...f.items, defaultItem()] }));
  const removeItem = (idx) => setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));

  const fillFromProduct = (idx, productId) => {
    const p = products.find((pr) => pr._id === productId);
    if (!p) return;
    setForm((f) => ({
      ...f, items: f.items.map((item, i) =>
        i === idx ? { ...item, name: p.name, description: p.description, price: p.price, unit: p.unit, hsn: p.hsn, cgstRate: p.cgstRate, sgstRate: p.sgstRate, igstRate: p.igstRate } : item
      ),
    }));
  };

  // Compute line total based on taxType and discountMode
  const computeLine = (item, isInterstate, taxType = 'gst_india', discountMode = 'item') => {
    const lineSubtotal = (item.price || 0) * (item.quantity || 0);
    const discAmt = discountMode === 'item' ? (lineSubtotal * (item.discount || 0)) / 100 : 0;
    const taxable = lineSubtotal - discAmt;
    if (taxType === 'none') return { taxable, cgst: 0, sgst: 0, igst: 0, vat: 0, total: taxable };
    if (taxType === 'vat') {
      const vat = (taxable * (item.vatRate || 0)) / 100;
      return { taxable, cgst: 0, sgst: 0, igst: 0, vat, total: taxable + vat };
    }
    // GST India
    const cgst = isInterstate ? 0 : (taxable * (item.cgstRate || 0)) / 100;
    const sgst = isInterstate ? 0 : (taxable * (item.sgstRate || 0)) / 100;
    const igst = isInterstate ? (taxable * (item.igstRate || 0)) / 100 : 0;
    return { taxable, cgst, sgst, igst, vat: 0, total: taxable + cgst + sgst + igst };
  };

  const toggleCol = (col) => { }; // no-op — columns are always visible

  const totals = (() => {
    const base = form.items.reduce(
      (acc, item) => {
        const c = computeLine(item, form.isInterstate, form.taxType, discConfig.mode);
        return { subtotal: acc.subtotal + (item.price || 0) * (item.quantity || 0), itemDiscount: acc.itemDiscount + ((item.price || 0) * (item.quantity || 0) * (item.discount || 0)) / 100, tax: acc.tax + c.cgst + c.sgst + c.igst + c.vat, taxableTotal: acc.taxableTotal + c.taxable };
      },
      { subtotal: 0, itemDiscount: 0, tax: 0, taxableTotal: 0 }
    );
    // Apply overall discounts to (subtotal - item discounts)
    const afterItemDisc = discConfig.mode === 'item' ? base.subtotal - base.itemDiscount : base.subtotal;
    let overallDiscTotal = 0;
    if (discConfig.mode === 'overall') {
      let running = base.subtotal;
      discConfig.lines.forEach(l => {
        const amt = l.type === 'percent' ? (running * (l.value || 0)) / 100 : (l.value || 0);
        overallDiscTotal += amt;
        running -= amt;
      });
    }
    const taxableAfterDisc = afterItemDisc - overallDiscTotal;
    return {
      subtotal: base.subtotal,
      itemDiscount: base.itemDiscount,
      overallDiscTotal,
      tax: base.tax,
      total: taxableAfterDisc + base.tax,
    };
  })();

  const generateAndDownloadPDF = async (invoiceData) => {
    try {
      const docTpt = (invoiceData.template || form.template || '').toLowerCase();
      const resolvedTpt = (docTpt || currentUser?.invoiceTemplate || 'template1').toLowerCase();
      
      let invoiceForPDF = {
        ...invoiceData,
        user: currentUser,
        invoiceType: docType,
        templateColors: form.templateColors || 
                        invoiceData.templateColors || 
                        (docTpt ? (DEFAULT_COLORS[docTpt] || null) : currentUser?.invoiceTemplateColors) || 
                        DEFAULT_COLORS[resolvedTpt],
        _discConfig: discConfig,
        _currency: form.currency || 'INR',
        _taxType: form.taxType,
      };

      if (currentUser?.businessLogo) {
        try {
          const jpgUrl = currentUser.businessLogo.includes('cloudinary.com')
            ? currentUser.businessLogo.replace('/upload/', '/upload/f_jpg/')
            : currentUser.businessLogo;
          const res = await fetch(jpgUrl);
          const blob = await res.blob();
          const base64Logo = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          });
          invoiceForPDF.user = { ...currentUser, businessLogo: base64Logo };
        } catch (e) {
          console.error("Logo fetch failed", e);
        }
      }

      const blob = await pdf(<InvoicePDF invoice={invoiceForPDF} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${docLabel}-${invoiceData.invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("PDF generation failed", error);
      toast.error("Failed to generate PDF");
    }
  };

  const handleSubmit = async (e, shouldDownload = false) => {
    e.preventDefault();
    if (!form.client) return toast.error('Please select a client');

    setSaving(true);
    if (shouldDownload) setDownloading(true);

    const body = { ...form };

    try {
      let savedInvoice;
      if (isEdit) {
        const res = await docAPI.update(id, body);
        savedInvoice = res.data.invoice;
        toast.success(`${docLabel} updated`);
      }
      else {
        const res = await docAPI.create(body);
        savedInvoice = res.data.invoice;
        toast.success(`${docLabel} created`);
      }

      if (shouldDownload) {
        await generateAndDownloadPDF(savedInvoice);
        toast.success(`${docLabel} saved & downloaded!`);
      }

      navigate(`${basePath}/${savedInvoice._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save invoice');
    } finally {
      setSaving(false);
      setDownloading(false);
    }
  };

  const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: form.currency || 'INR', maximumFractionDigits: 2 }).format(n || 0);

  if (loading) return <div className="flex-center" style={{ minHeight: '60vh' }}><div className="spinner" /></div>;

  return (
    <form onSubmit={handleSubmit}>
      <div className="page-header">
        <div>
          <h1 className="page-title">{isEdit ? `Edit ${docLabel}` : `New ${docLabel}`}</h1>
          <p className="page-subtitle">{isEdit ? `Editing ${form.invoiceNumber}` : `Fill in the details to create a ${docLabel.toLowerCase()}`}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="btn btn-secondary"
            disabled={saving || downloading}
            onClick={(e) => handleSubmit(e, false)}
          >
            {saving && !downloading ? <Loader2 size={16} className="spinner" /> : <Save size={16} />}
            {saving && !downloading ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={saving || downloading}
            onClick={(e) => handleSubmit(e, true)}
          >
            {downloading ? <Loader2 size={16} className="spinner" /> : <Download size={16} />}
            {downloading ? 'Downloading…' : 'Save & Download'}
          </button>
        </div>
      </div>

      {/* Header info */}
      <div className="card mb-4">
        <h2 className="card-title mb-4" style={{ marginBottom: '16px' }}>{docLabel} Details</h2>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Issue Date *</label>
            <input type="date" className="form-control" value={form.issueDate} onChange={(e) => setField('issueDate', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Due Date</label>
            <input type="date" className="form-control" value={form.dueDate} onChange={(e) => setField('dueDate', e.target.value)} />
          </div>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Client *</label>
            <select className="form-control" value={form.client} onChange={(e) => setField('client', e.target.value)}>
              <option value="">— Select a client —</option>
              {clients.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">{docLabel} # (auto-generated if blank)</label>
            <input className="form-control" placeholder="INV-0001" value={form.invoiceNumber} onChange={(e) => setField('invoiceNumber', e.target.value)} />
          </div>
        </div>

        {/* ── Configure Tax / Currency / Format toolbar ── */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>

          {/* Configure Tax */}
          <button
            type="button"
            onClick={openTaxModal}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '7px 14px', borderRadius: 8,
              border: '1.5px solid var(--border)', background: 'var(--bg-elevated)',
              color: 'var(--text-primary)', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
            }}
          >
            <Percent size={14} style={{ color: 'var(--primary-light)' }} />
            Configure Tax
            {form.taxType === 'vat'
              ? <span style={{ fontSize: '0.7rem', color: 'var(--primary-light)', marginLeft: 2 }}>(VAT)</span>
              : form.taxType === 'none'
                ? <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: 2 }}>(No Tax)</span>
                : form.isInterstate
                  ? <span style={{ fontSize: '0.7rem', color: 'var(--primary-light)', marginLeft: 2 }}>(IGST)</span>
                  : <span style={{ fontSize: '0.7rem', color: 'var(--primary-light)', marginLeft: 2 }}>(CGST+SGST)</span>}
          </button>

          {/* Currency Selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Currency <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <select
                className="form-control"
                style={{ paddingRight: 28, appearance: 'none', minWidth: 200 }}
                value={form.currency || 'INR'}
                onChange={(e) => setField('currency', e.target.value)}
              >
                {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
              </select>
              <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
            </div>
          </div>

          {/* Configure Discount */}
          <button
            type="button"
            onClick={openDiscModal}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '7px 14px', borderRadius: 8,
              border: '1.5px solid var(--border)', background: 'var(--bg-elevated)',
              color: 'var(--text-primary)', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
            }}
          >
            <Tag size={14} style={{ color: 'var(--primary-light)' }} />
            Configure Discount
            <span style={{ fontSize: '0.7rem', color: 'var(--primary-light)', marginLeft: 2 }}>
              ({discConfig.mode === 'none' ? 'None' : discConfig.mode === 'item' ? 'Item-wise' : `${discConfig.lines.length} overall`})
            </span>
          </button>

        </div>
      </div>

      {/* Line Items */}
      <div className="card mb-4">
        <div className="card-header" style={{ position: 'relative' }}>
          <h2 className="card-title">Line Items</h2>
          <div className="flex gap-2">
            {!showHsn && (
              <button type="button" className="btn btn-ghost btn-sm" style={{ fontSize: '0.75rem' }} onClick={() => setShowHsn(true)}>+ HSN</button>
            )}
            <button type="button" className="btn btn-secondary btn-sm" onClick={addItem}><Plus size={14} /> Add Item</button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr>
                <th style={{ padding: '8px 6px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>Product</th>
                <th style={{ padding: '8px 6px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>Name / Description</th>
                {showHsn && (
                  <th style={{ padding: '8px 6px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>
                    HSN
                    <button type="button" onClick={() => setShowHsn(false)} title="Hide HSN column" style={{ marginLeft: 4, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, verticalAlign: 'middle', lineHeight: 1 }}>✕</button>
                  </th>
                )}
                <th style={{ padding: '8px 6px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>Qty</th>
                <th style={{ padding: '8px 6px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>Unit</th>
                <th style={{ padding: '8px 6px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>Price</th>
                {/* Only show Disc% column in item-wise mode */}
                {discConfig.mode === 'item' && (
                  <th style={{ padding: '8px 6px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>Disc %</th>
                )}
                {/* No Discount mode: no Disc% column at all */}
                {form.taxType !== 'none' && (
                  form.taxType === 'vat' ? (
                    <th style={{ padding: '8px 6px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>VAT%</th>
                  ) : form.isInterstate ? (
                    <th style={{ padding: '8px 6px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>IGST%</th>
                  ) : (
                    <>
                      <th style={{ padding: '8px 6px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>CGST%</th>
                      <th style={{ padding: '8px 6px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>SGST%</th>
                    </>
                  )
                )}
                <th style={{ padding: '8px 6px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>Total</th>
                <th style={{ padding: '8px 6px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}></th>
              </tr>
            </thead>
            <tbody>
              {form.items.map((item, idx) => {
                const line = computeLine(item, form.isInterstate, form.taxType);
                return (
                  <tr key={idx}>
                    <td style={{ padding: '6px 4px' }}>
                      <select className="form-control" style={{ minWidth: '120px', padding: '6px 8px' }}
                        onChange={(e) => fillFromProduct(idx, e.target.value)} defaultValue="">
                        <option value="">— Pick —</option>
                        {products.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: '6px 4px' }}>
                      <input className="form-control" style={{ minWidth: '150px', padding: '6px 8px' }} placeholder="Item name" value={item.name} onChange={(e) => setItem(idx, 'name', e.target.value)} />
                    </td>
                    {showHsn && (
                      <td style={{ padding: '6px 4px' }}>
                        <input className="form-control" style={{ width: '80px', padding: '6px 8px' }} placeholder="HSN" value={item.hsn} onChange={(e) => setItem(idx, 'hsn', e.target.value)} />
                      </td>
                    )}
                    <td style={{ padding: '6px 4px' }}>
                      <input type="number" className="form-control" style={{ width: '70px', padding: '6px 8px' }} value={item.quantity} min={0} onChange={(e) => setItem(idx, 'quantity', parseFloat(e.target.value) || 0)} />
                    </td>
                    <td style={{ padding: '6px 4px' }}>
                      <div style={{ position: 'relative' }}>
                        <select
                          className="form-control"
                          style={{ width: '90px', padding: '6px 24px 6px 8px', appearance: 'none' }}
                          value={UNITS.includes(item.unit) ? item.unit : '__custom__'}
                          onChange={(e) => {
                            if (e.target.value !== '__custom__') setItem(idx, 'unit', e.target.value);
                          }}
                        >
                          {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                          {!UNITS.includes(item.unit) && <option value="__custom__">{item.unit || 'custom'}</option>}
                        </select>
                        <ChevronDown size={12} style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
                      </div>
                    </td>
                    <td style={{ padding: '6px 4px' }}>
                      <input type="number" className="form-control" style={{ width: '90px', padding: '6px 8px' }} value={item.price} min={0} onChange={(e) => setItem(idx, 'price', parseFloat(e.target.value) || 0)} />
                    </td>
                    {discConfig.mode === 'item' && (
                      <td style={{ padding: '6px 4px' }}>
                        <input type="number" className="form-control" style={{ width: '70px', padding: '6px 8px' }} value={item.discount} min={0} max={100} onChange={(e) => setItem(idx, 'discount', parseFloat(e.target.value) || 0)} />
                      </td>
                    )}
                    {form.taxType !== 'none' && (
                      form.taxType === 'vat' ? (
                        <td style={{ padding: '6px 4px' }}>
                          <input type="number" className="form-control" style={{ width: '65px', padding: '6px 8px' }} value={item.vatRate} min={0} onChange={(e) => setItem(idx, 'vatRate', parseFloat(e.target.value) || 0)} />
                        </td>
                      ) : form.isInterstate ? (
                        <td style={{ padding: '6px 4px' }}>
                          <input type="number" className="form-control" style={{ width: '65px', padding: '6px 8px' }} value={item.igstRate} min={0} onChange={(e) => setItem(idx, 'igstRate', parseFloat(e.target.value) || 0)} />
                        </td>
                      ) : (
                        <>
                          <td style={{ padding: '6px 4px' }}>
                            <input type="number" className="form-control" style={{ width: '65px', padding: '6px 8px' }} value={item.cgstRate} min={0} onChange={(e) => setItem(idx, 'cgstRate', parseFloat(e.target.value) || 0)} />
                          </td>
                          <td style={{ padding: '6px 4px' }}>
                            <input type="number" className="form-control" style={{ width: '65px', padding: '6px 8px' }} value={item.sgstRate} min={0} onChange={(e) => setItem(idx, 'sgstRate', parseFloat(e.target.value) || 0)} />
                          </td>
                        </>
                      )
                    )}
                    <td style={{ padding: '6px 8px', fontWeight: 600, whiteSpace: 'nowrap' }}>{fmt(line.total)}</td>
                    <td style={{ padding: '6px 4px' }}>
                      {form.items.length > 1 && (
                        <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => removeItem(idx)}><Trash2 size={14} /></button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totals summary */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
          <div style={{ minWidth: '280px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Subtotal */}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Subtotal</span>
              <span>{fmt(totals.subtotal)}</span>
            </div>
            {/* Item-wise discount total (informational) */}
            {discConfig.mode === 'item' && totals.itemDiscount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Item Discount</span>
                <span style={{ color: 'var(--danger)' }}>- {fmt(totals.itemDiscount)}</span>
              </div>
            )}
            {/* Overall discount lines */}
            {discConfig.mode === 'overall' && discConfig.lines.map((l, i) => {
              const base = i === 0 ? totals.subtotal : totals.subtotal - discConfig.lines.slice(0, i).reduce((acc, prev) => acc + (prev.type === 'percent' ? (totals.subtotal * (prev.value || 0)) / 100 : (prev.value || 0)), 0);
              const amt = l.type === 'percent' ? (base * (l.value || 0)) / 100 : (l.value || 0);
              return (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{l.name + '(' + l.value + '%)' || 'Discount'}</span>
                  <span style={{ color: 'var(--danger)' }}>- {fmt(amt)}</span>
                </div>
              );
            })}
            {/* Tax */}
            {totals.tax > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Tax</span>
                <span>{fmt(totals.tax)}</span>
              </div>
            )}
            {/* Grand Total */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '8px', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
              <span>Grand Total</span>
              <span>{fmt(totals.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="card">
        <h2 className="card-title mb-4" style={{ marginBottom: '16px' }}>Additional Info</h2>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-control" rows={3} placeholder="Thank you for your business!" value={form.notes} onChange={(e) => setField('notes', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Terms & Conditions</label>
            <textarea className="form-control" rows={3} placeholder="Payment due within 30 days..." value={form.termsAndConditions} onChange={(e) => setField('termsAndConditions', e.target.value)} />
          </div>
        </div>

        <div className="form-group" style={{ marginTop: '16px' }}>
          <label className="form-label">Template <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 400 }}>(uses account default if none selected)</span></label>
          {(() => {
            const TEMPLATE_IMGS = {
              template1: '/templates/t1.png',
              template2: '/templates/t2.png',
              template3: '/templates/t3.png',
              template4: '/templates/t4.png',
              template5: '/templates/t5.png',
              template6: '/templates/t6.png',
            };
            const defaultKey = (currentUser?.invoiceTemplate || 'template1').toLowerCase();
            const defaultImg = TEMPLATE_IMGS[defaultKey] || '/templates/t1.png';
            const TEMPLATES = [
              { id: '', name: 'Account Default', img: defaultImg },
              { id: 'template1', name: 'Classic Blue', img: '/templates/t1.png' },
              { id: 'template2', name: 'Minimalist', img: '/templates/t2.png' },
              { id: 'template3', name: 'Modern Wave', img: '/templates/t3.png' },
              { id: 'template4', name: 'Elegant Navy', img: '/templates/t4.png' },
              { id: 'template5', name: 'Corporate Bright', img: '/templates/t5.png' },
              { id: 'template6', name: 'Angular Orange', img: '/templates/t6.png' },
            ];
            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: 8 }}>
                {TEMPLATES.map((t) => {
                  const isSelected = (form.template || '') === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setField('template', t.id);
                        // If choosing 'Account Default', clear invoice colors so it inherits business defaults.
                        // If choosing a specific template, start with its own default colors for isolated styling.
                        if (!t.id) {
                          setField('templateColors', null);
                        } else {
                          setField('templateColors', DEFAULT_COLORS[t.id.toLowerCase()]);
                        }
                      }}
                      style={{
                        border: isSelected ? '2px solid var(--primary)' : '2px solid var(--border)',
                        borderRadius: 8,
                        padding: 0,
                        background: '#fff',
                        cursor: 'pointer',
                        overflow: 'hidden',
                        boxShadow: isSelected ? '0 0 0 3px rgba(var(--primary-rgb, 59,130,246),0.18)' : 'none',
                        transition: 'border 0.15s, box-shadow 0.15s',
                      }}
                    >
                      <div style={{ position: 'relative' }}>
                        <img
                          src={t.img}
                          alt={t.name}
                          style={{ width: '100%', aspectRatio: '3/4', objectFit: 'contain', display: 'block', background: '#fff' }}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        {t.id === '' && (
                          <span style={{
                            position: 'absolute', top: 4, left: 4,
                            background: 'var(--primary)', color: '#fff',
                            fontSize: '0.6rem', fontWeight: 700,
                            padding: '2px 5px', borderRadius: 4,
                          }}>DEFAULT</span>
                        )}
                      </div>
                      <div style={{
                        padding: '5px 6px',
                        fontSize: '0.72rem',
                        fontWeight: isSelected ? 700 : 500,
                        color: isSelected ? 'var(--primary)' : 'var(--text-primary)',
                        textAlign: 'center',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        background: 'var(--bg-card)',
                      }}>
                        {t.name}
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })()}

          {/* Color Customization */}
          {(() => {
            const effectiveTemplate = (form.template || currentUser?.invoiceTemplate || 'template1').toLowerCase();
            return (
              <div style={{ marginTop: 24, padding: 16, border: '1px solid var(--border)', borderRadius: 12, background: 'var(--bg-elevated)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <div style={{ padding: 8, background: 'var(--primary-bg)', borderRadius: 8, color: 'var(--primary)' }}>
                    <Tag size={18} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 700, margin: 0 }}>Customize Template Colors</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                      {form.template 
                        ? 'Tailor this specific invoice' 
                        : `Using ${effectiveTemplate} Account Defaults`}
                    </p>
                  </div>
                </div>

                <div style={{ 
                  display: 'flex', 
                  gap: 24, 
                  flexWrap: 'wrap',
                  opacity: form.template ? 1 : 0.6,
                  pointerEvents: form.template ? 'auto' : 'none'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Primary Color</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="color"
                        value={form.templateColors?.primary || DEFAULT_COLORS[effectiveTemplate]?.primary || '#000000'}
                        onChange={(e) => setField('templateColors', { ...(form.templateColors || DEFAULT_COLORS[effectiveTemplate]), primary: e.target.value })}
                        style={{ width: 40, height: 40, padding: 0, border: 'none', borderRadius: 8, cursor: 'pointer', background: 'none' }}
                      />
                      <span style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                        {form.templateColors?.primary || DEFAULT_COLORS[effectiveTemplate]?.primary}
                      </span>
                    </div>
                  </div>

                  {DEFAULT_COLORS[effectiveTemplate]?.secondary && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Secondary Color</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input
                          type="color"
                          value={form.templateColors?.secondary || DEFAULT_COLORS[effectiveTemplate]?.secondary || '#000000'}
                          onChange={(e) => setField('templateColors', { ...(form.templateColors || DEFAULT_COLORS[effectiveTemplate]), secondary: e.target.value })}
                          style={{ width: 40, height: 40, padding: 0, border: 'none', borderRadius: 8, cursor: 'pointer', background: 'none' }}
                        />
                        <span style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                          {form.templateColors?.secondary || DEFAULT_COLORS[effectiveTemplate]?.secondary}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {!form.template ? (
                    <div style={{ marginTop: 'auto', marginBottom: 6, fontSize: '0.7rem', fontStyle: 'italic', color: 'var(--primary)' }}>
                      Inherited from account settings
                    </div>
                  ) : (
                    <button 
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ marginTop: 'auto', marginBottom: 6, fontSize: '0.7rem' }}
                      onClick={() => setField('templateColors', DEFAULT_COLORS[effectiveTemplate])}
                    >
                      Reset Defaults
                    </button>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* ══ Configure Tax Modal ══ */}
      {taxModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(3px)' }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: '28px 28px 20px', width: 420, maxWidth: '95vw', boxShadow: 'var(--shadow)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>Configure Tax</h3>
              <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setTaxModal(false)}><X size={18} /></button>
            </div>

            {/* 1. Tax Type */}
            <div className="form-group">
              <label className="form-label"><strong>1. Select Tax Type</strong> <span style={{ color: 'var(--danger)' }}>*</span></label>
              <select className="form-control" value={taxDraft.taxType} onChange={(e) => setTaxDraft(d => ({ ...d, taxType: e.target.value }))}>
                <option value="gst_india">GST (India)</option>
                <option value="vat">VAT</option>
                <option value="none">No Tax</option>
              </select>
            </div>

            {/* 2. Place of Supply — only for GST */}
            {taxDraft.taxType === 'gst_india' && (
              <div className="form-group">
                <label className="form-label"><strong>2. Place of Supply</strong> <span style={{ color: 'var(--danger)' }}>*</span></label>
                <select className="form-control" value={taxDraft.placeOfSupply} onChange={(e) => setTaxDraft(d => ({ ...d, placeOfSupply: e.target.value }))}>
                  {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}

            {/* 3. GST Type — only for GST */}
            {taxDraft.taxType === 'gst_india' && (
              <div className="form-group">
                <label className="form-label"><strong>3. GST Type</strong> <span style={{ color: 'var(--danger)' }}>*</span></label>
                <div style={{ display: 'flex', gap: 24, marginTop: 8 }}>
                  {[['igst', 'IGST'], ['cgst_sgst', 'CGST & SGST']].map(([val, label]) => (
                    <label key={val} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.875rem' }}>
                      <input
                        type="radio"
                        name="gstType"
                        value={val}
                        checked={taxDraft.gstType === val}
                        onChange={() => setTaxDraft(d => ({ ...d, gstType: val }))}
                        style={{ accentColor: 'var(--primary)' }}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Other Options */}
            <div className="form-group">
              <label className="form-label"><strong>4. Other Options</strong></label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, cursor: 'pointer', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                <input
                  type="checkbox"
                  checked={taxDraft.reverseCharge}
                  onChange={(e) => setTaxDraft(d => ({ ...d, reverseCharge: e.target.checked }))}
                  style={{ accentColor: 'var(--primary)' }}
                />
                Is Reverse Charge Applicable?
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setTaxModal(false)}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={saveTaxConfig}>Save Changes</button>
            </div>
          </div>
        </div>
      )}


      {/* ══ Configure Discount Modal ══ */}
      {discModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(3px)' }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: '28px 28px 20px', width: 500, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--shadow)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>Configure Discount</h3>
              <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setDiscModal(false)}><X size={18} /></button>
            </div>

            {/* Mode */}
            <div className="form-group">
              <label className="form-label"><strong>Discount Type</strong></label>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                {[
                  ['item', 'Item-wise', 'Disc % column per line item'],
                  ['overall', 'Subtotal Discount', 'One or more discounts after subtotal'],
                  ['none', 'No Discount', 'No discount applied — column hidden'],
                ].map(([val, title, desc]) => (
                  <label key={val} onClick={() => setDiscDraft(d => ({ ...d, mode: val }))} style={{
                    flex: 1, padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                    border: `1.5px solid ${discDraft.mode === val ? 'var(--primary)' : 'var(--border)'}`,
                    background: discDraft.mode === val ? 'var(--primary-bg)' : 'var(--bg-elevated)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <input type="radio" checked={discDraft.mode === val} onChange={() => { }} style={{ accentColor: 'var(--primary)' }} />
                      <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{title}</span>
                    </div>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: 20 }}>{desc}</p>
                  </label>
                ))}
              </div>
            </div>

            {/* Discount lines — only in overall mode */}
            {discDraft.mode === 'overall' && (
              <div className="form-group">
                <label className="form-label" style={{ marginBottom: 8 }}><strong>Discount Lines</strong></label>
                {discDraft.lines.map((l, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                    <input className="form-control" placeholder="Name (e.g. Early Payment)" value={l.name}
                      onChange={(e) => setDiscLine(i, 'name', e.target.value)} style={{ flex: 2, padding: '7px 10px' }} />
                    <select className="form-control" value={l.type}
                      onChange={(e) => setDiscLine(i, 'type', e.target.value)} style={{ flex: 1, padding: '7px 8px' }}>
                      <option value="percent">%</option>
                      <option value="flat">Flat</option>
                    </select>
                    <input type="number" className="form-control" placeholder="0" value={l.value} min={0}
                      onChange={(e) => setDiscLine(i, 'value', parseFloat(e.target.value) || 0)} style={{ flex: 1, padding: '7px 10px' }} />
                    {discDraft.lines.length > 1 && (
                      <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: 4 }} onClick={() => removeDiscLine(i)}>
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={addDiscLine}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontSize: '0.82rem', fontWeight: 600, padding: 0, marginTop: 4 }}>
                  <Plus size={14} /> Add Discount Line
                </button>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setDiscModal(false)}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={saveDiscConfig}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

