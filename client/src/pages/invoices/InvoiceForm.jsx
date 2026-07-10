import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { invoiceAPI, clientAPI, productAPI, quotationAPI } from '../../api/services';
import toast from 'react-hot-toast';
import { Plus, Trash2, Save, Download, Loader2, X, ChevronDown, Percent, Tag, Lock, Landmark } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const defaultItem = () => ({
  productId: null, itemType: 'Product', name: '', description: '', hsn: '', quantity: 1, unit: 'pcs',
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


const normalizeBankAccounts = (user) => {
  const accounts = Array.isArray(user?.bankAccounts) ? user.bankAccounts.filter(Boolean) : [];
  if (accounts.length) return accounts;
  const legacy = user?.bankDetails;
  if (legacy && (legacy.bankName || legacy.accountName || legacy.accountNumber || legacy.ifscCode)) {
    return [{ label: 'Primary', ...legacy, isPrimary: true }];
  }
  return [];
};

const serializeNotes = (points) => points.join('\n');
const parseNotes = (notes) => (notes || '').split('\n').map((point) => point.trim()).filter(Boolean);

export const DEFAULT_COLORS = {
  template1: { primary: '#4A72D4' },
  template2: { primary: '#000000' },
  template3: { primary: '#1a3a6b', secondary: '#F0F4F8' },
  template4: { primary: '#1C2541', secondary: '#d4af37' }, // Navy, Gold
  template5: { primary: '#0A66C2' },
  template6: { primary: '#E8662B', secondary: '#1C2541' }, // Orange, Navy
};


export function resolveTemplateColors(templateKey, storedColors) {
  const key = (templateKey || 'template1').toLowerCase();
  const defaults = DEFAULT_COLORS[key] || DEFAULT_COLORS.template1;
  if (!storedColors) return defaults;
  const expectsSecondary = !!defaults.secondary;
  const hasSecondary = !!storedColors.secondary;
  if (expectsSecondary !== hasSecondary) return defaults;
  return storedColors;
}



// Templates available on the free plan — everything else shows an "Upgrade" lock
const FREE_TEMPLATES = ['template1', 'template2'];

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
  const [lineSearchQuery, setLineSearchQuery] = useState('');
  const [lineSearchOpen, setLineSearchOpen] = useState(false);
  const [addItemMenuOpen, setAddItemMenuOpen] = useState(false);
  const [newItemType, setNewItemType] = useState(null);
  const [newItemDraft, setNewItemDraft] = useState(defaultItem());
  const [discountInputModes, setDiscountInputModes] = useState({});
  const [bankSwitchOpen, setBankSwitchOpen] = useState(false);

  // ── Client search-select state
  const [clientQuery, setClientQuery] = useState('');
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);

  // ── Product typeahead state (per line item, keyed by index)
  const [productQueries, setProductQueries] = useState({});
  const [openProductIdx, setOpenProductIdx] = useState(null);
  const [productDropdownPos, setProductDropdownPos] = useState({}); // { [idx]: {top, left, width} }

  // ── Configure Tax modal state
  const [taxModal, setTaxModal] = useState(false);
  const [taxDraft, setTaxDraft] = useState({ taxType: 'gst_india', placeOfSupply: 'Other Territory', gstType: 'cgst_sgst', reverseCharge: false });

  const [newClientModal, setNewClientModal] = useState(false);
  const [newClientForm, setNewClientForm] = useState({ name: '', email: '', phone: '', gstin: '' });
  const [creatingClient, setCreatingClient] = useState(false);

  const openNewClientModal = () => {
    setNewClientForm({ name: clientQuery && !form.client ? clientQuery : '', email: '', phone: '', gstin: '' });
    setClientDropdownOpen(false);
    setNewClientModal(true);
  };

  const openFullClientForm = (draft = null) => {
    setClientDropdownOpen(false);
    setNewClientModal(false);
    navigate('/clients/new', {
      state: {
        returnTo: location.pathname,
        formDraft: form,
        clientDraft: draft || {
          name: clientQuery && !form.client ? clientQuery : '',
          email: '',
          phone: '',
          gstin: '',
        },
      },
    });
  };

  const handleCreateClientSubmit = async () => {
    if (!newClientForm.name) return toast.error('Client name is required');
    setCreatingClient(true);
    try {
      const res = await clientAPI.create(newClientForm);
      const created = res.data.client;
      setClients((c) => [...c, created]);
      setField('client', created._id);
      setClientQuery(created.name);
      toast.success('Client added');
      setNewClientModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create client');
    } finally {
      setCreatingClient(false);
    }
  };


  // ── Configure Discount modal state
  const [discModal, setDiscModal] = useState(false);
  const [discConfig, setDiscConfig] = useState({
    mode: 'item', // 'item' | 'overall'
    lines: [{ name: 'Discount', type: 'percent', value: 0 }],
  });
  const [discDraft, setDiscDraft] = useState(discConfig);

  const [discAmtDraft, setDiscAmtDraft] = useState({});

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
    currency: currentUser?.currency || 'INR',
    roundOff: false,
    selectedBankIndex: 0,
    paymentInfo: '',
    template: '',
    templateColors: null, // { primary, secondary }
    items: [],
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
        const loadedTpt = (inv.template || currentUser?.invoiceTemplate || 'template1').toLowerCase();
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
          currency: inv.currency || currentUser?.currency || 'INR',
          roundOff: inv.roundOff || false,
          selectedBankIndex: inv.selectedBankIndex || 0,
          paymentInfo: inv.paymentInfo || '',
          template: inv.template || '',
          templateColors: inv.template ? resolveTemplateColors(loadedTpt, inv.templateColors) : (inv.templateColors || null),
          items: inv.items?.length ? inv.items : [defaultItem()],
        });
        setClientQuery(inv.client?.name || '');
      }).catch(() => toast.error('Failed to load invoice'))
        .finally(() => setLoading(false));
    } else if (currentUser) {
      const tptKey = (currentUser.invoiceTemplate || 'template1').toLowerCase();
      setForm(f => ({
        ...f,
        template: currentUser.invoiceTemplate || 'template1',
        templateColors: resolveTemplateColors(tptKey, currentUser.invoiceTemplateColors),
        currency: currentUser.currency || 'INR',
      }));
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [id, currentUser]);

  // ── Restore form + newly-created client after returning from /clients/new
  useEffect(() => {
    if (location.state?.newClientId) {
      setForm(f => ({ ...(location.state.formDraft || f), client: location.state.newClientId }));
      setClientQuery(location.state.newClientName || '');
      clientAPI.getAll().then((r) => setClients(r.data.clients)).catch(() => { });
      // Clear the navigation state so a refresh doesn't re-trigger this
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setField = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const setItem = (idx, key, val) =>
    setForm((f) => ({ ...f, items: f.items.map((item, i) => i === idx ? { ...item, [key]: val } : item) }));

  const addItem = () => setForm((f) => ({ ...f, items: [...f.items, defaultItem()] }));
  const removeItem = (idx) => {
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
    setProductQueries((q) => { const c = { ...q }; delete c[idx]; return c; });
  };

  const fillFromProduct = (idx, productId) => {
    const p = products.find((pr) => pr._id === productId);
    if (!p) return;
    setForm((f) => ({
      ...f, items: f.items.map((item, i) =>
        i === idx ? { ...item, productId: p._id, itemType: p.isService ? 'Service' : 'Product', name: p.name, description: p.description, price: p.price, unit: p.isService ? 'hr' : (p.unit || 'pcs'), hsn: p.hsn, cgstRate: p.cgstRate, sgstRate: p.sgstRate, igstRate: p.igstRate } : item
      ),
    }));
  };


  const appendProductLine = (product) => {
    if (!product) return;
    const line = {
      ...defaultItem(),
      productId: product._id,
      itemType: product.isService ? 'Service' : 'Product',
      name: product.name || '',
      description: product.description || '',
      price: product.price || 0,
      unit: product.isService ? 'hr' : (product.unit || 'pcs'),
      hsn: product.hsn || '',
      cgstRate: product.cgstRate || 0,
      sgstRate: product.sgstRate || 0,
      igstRate: product.igstRate || 0,
      vatRate: product.vatRate || 0,
    };
    setForm((f) => {
      return {
        ...f,
        items: [...f.items, line]
      };
    });
    setLineSearchQuery('');
    setLineSearchOpen(false);
  };

  const openNewItemPanel = (type) => {
    setNewItemType(type);
    setNewItemDraft({ ...defaultItem(), itemType: type, unit: type === 'Service' ? 'hr' : 'pcs' });
    setAddItemMenuOpen(false);
  };

  const commitNewItem = () => {
    if (!newItemDraft.name.trim()) return toast.error('Item name is required');
    setForm((f) => {
      return {
        ...f,
        items: [...f.items, newItemDraft]
      };
    });
    setNewItemType(null);
    setNewItemDraft(defaultItem());
    toast.success(`${newItemType} added`);
  };

  const setDiscountForItem = (idx, rawValue, mode = discountInputModes[idx] || 'percent') => {
    const item = form.items[idx];
    const subtotal = (item?.price || 0) * (item?.quantity || 0);
    const value = rawValue === '' ? 0 : parseFloat(rawValue) || 0;
    const percent = mode === 'flat' ? (subtotal > 0 ? Math.min((value / subtotal) * 100, 100) : 0) : Math.min(value, 100);
    setItem(idx, 'discount', percent);
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
      rawTotal: taxableAfterDisc + base.tax,
      roundOffDiff: form.roundOff ? Math.round(taxableAfterDisc + base.tax) - (taxableAfterDisc + base.tax) : 0,
      total: form.roundOff ? Math.round(taxableAfterDisc + base.tax) : taxableAfterDisc + base.tax,
    };
  })();

  const generateAndDownloadPDF = async (invoiceData) => {
    try {
      const docTpt = (invoiceData.template || form.template || '').toLowerCase();
      const resolvedTpt = (docTpt || currentUser?.invoiceTemplate || 'template1').toLowerCase();

      let invoiceForPDF = {
        ...invoiceData,
        template: resolvedTpt,
        user: { ...currentUser, bankDetails: normalizeBankAccounts(currentUser)[invoiceData.selectedBankIndex ?? form.selectedBankIndex ?? 0] || currentUser?.bankDetails },
        invoiceType: docType,
        templateColors: resolveTemplateColors(
          resolvedTpt,
          form.templateColors || invoiceData.templateColors
        ),
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
          invoiceForPDF.user = { ...invoiceForPDF.user, businessLogo: base64Logo };
        } catch (e) {
          console.error("Logo fetch failed", e);
        }
      }

      const [{ pdf }, { default: TemplateResolver }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('./templates/TemplateResolver'),
      ]);
      const blob = await pdf(<TemplateResolver invoice={invoiceForPDF} />).toBlob();
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
    if (!form.dueDate) return toast.error('Please select a validity date');

    setSaving(true);
    if (shouldDownload) setDownloading(true);

    const body = {
      ...form,
      notes: serializeNotes(parseNotes(form.notes)),
      selectedBankIndex: Number(form.selectedBankIndex || 0),
      items: form.items.map(({ itemType, ...item }) => item),
    };

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


  const filteredClients = clients.filter((c) =>
    c.name?.toLowerCase().includes(clientQuery.toLowerCase()) ||
    c.email?.toLowerCase().includes(clientQuery.toLowerCase()) ||
    c.gstin?.toLowerCase().includes(clientQuery.toLowerCase())
  );

  // Resolve banking details from the logged-in user's profile
  const bankAccounts = normalizeBankAccounts(currentUser);
  const selectedBankIndex = Math.min(Number(form.selectedBankIndex || 0), Math.max(bankAccounts.length - 1, 0));
  const bank = bankAccounts[selectedBankIndex] || currentUser?.bankDetails || {};
  const hasBankDetails = bank && (bank.bankName || bank.accountName || bank.accountNumber || bank.ifscCode);
  const filteredLineProducts = lineSearchQuery.trim()
    ? products.filter((p) => {
      const q = lineSearchQuery.toLowerCase();

      return (
        p.name?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.hsn?.toLowerCase().includes(q)
      );
    })
    : products;

  const displayedProducts = filteredLineProducts.slice(0, 8);
  const notePoints = form.notes ? form.notes.split('\n') : [];

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
            <label className="form-label">Validity <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input type="date" className="form-control" required value={form.dueDate} onChange={(e) => setField('dueDate', e.target.value)} />
          </div>
        </div>

        <div className="form-grid">
          {/* ── Client search-select ── */}
          <div className="form-group" style={{ position: 'relative' }}>
            <label className="form-label">Client *</label>
            <input
              className="form-control"
              placeholder="Search customers by name, company, GSTIN, tags…"
              value={clientQuery}
              onChange={(e) => {
                setClientQuery(e.target.value);
                setField('client', '');
                setClientDropdownOpen(true);
              }}
              onFocus={() => setClientDropdownOpen(true)}
              onBlur={() => setTimeout(() => setClientDropdownOpen(false), 150)}
            />
            {clientDropdownOpen && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 30,
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 10, marginTop: 4, maxHeight: 280, overflowY: 'auto',
                boxShadow: 'var(--shadow)',
              }}>
                {filteredClients.length === 0 ? (
                  <div style={{ padding: '12px 14px', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                    No clients found{clientQuery ? ` for "${clientQuery}"` : ''}
                  </div>
                ) : (
                  filteredClients.map((c) => (
                    <div
                      key={c._id}
                      className="dropdown-row"
                      onMouseDown={() => {
                        setField('client', c._id);
                        setClientQuery(c.name);
                        setClientDropdownOpen(false);
                      }}
                      style={{ padding: '10px 14px', cursor: 'pointer', fontSize: '0.85rem', borderBottom: '1px solid var(--border)' }}
                    >
                      <div style={{ fontWeight: 600 }}>{c.name}</div>
                      {(c.email || c.gstin) && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {[c.email, c.gstin].filter(Boolean).join(' · ')}
                        </div>
                      )}
                    </div>
                  ))
                )}
                <button
                  type="button"
                  onMouseDown={openNewClientModal}
                  style={{
                    width: '100%', textAlign: 'center', padding: '12px 14px',
                    background: 'var(--bg-elevated)', border: 'none', borderTop: '1px solid var(--border)',
                    cursor: 'pointer', color: 'var(--primary)', fontWeight: 700,
                    fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}
                >
                  <Plus size={14} /> Create Client
                </button>
              </div>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">{docLabel} #</label>
            <input
              className="form-control"
              placeholder="Auto-generated on save"
              value={form.invoiceNumber}
              disabled
              readOnly
              style={{ opacity: 0.7, cursor: 'not-allowed' }}
            />
          </div>
        </div>
        {/* ── Configure Tax / Currency / Format toolbar ── */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>

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
          <div className="flex gap-2" style={{ position: 'relative' }}>
            {!showHsn && (
              <button type="button" className="btn btn-ghost btn-sm" style={{ fontSize: '0.75rem' }} onClick={() => setShowHsn(true)}>+ HSN</button>
            )}
            <button type="button" className="btn btn-primary btn-sm" onClick={() => setAddItemMenuOpen((o) => !o)}><Plus size={14} /> Add Item <ChevronDown size={12} /></button>
            {addItemMenuOpen && (
              <div style={{ position: 'absolute', right: 0, top: '100%', zIndex: 40, marginTop: 6, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, boxShadow: 'var(--shadow)', minWidth: 150, overflow: 'hidden' }}>
                {['Product', 'Service'].map((type) => (
                  <button key={type} type="button" onMouseDown={() => openNewItemPanel(type)} style={{ width: '100%', padding: '10px 14px', background: 'transparent', border: 'none', color: 'var(--text-primary)', textAlign: 'left', cursor: 'pointer', fontWeight: 600 }}>
                    {type}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ position: 'relative', marginBottom: 14 }}>
          <input
            className="form-control"
            placeholder="Search products/services and press select to add a line item…"
            value={lineSearchQuery}
            onChange={(e) => { setLineSearchQuery(e.target.value); setLineSearchOpen(true); }}
            onFocus={() => setLineSearchOpen(true)}
            onBlur={() => setTimeout(() => setLineSearchOpen(false), 150)}
          />
          {lineSearchOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                zIndex: 35,
                marginTop: 6,
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                maxHeight: 320,
                overflowY: 'auto',
                boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
                backdropFilter: 'blur(12px)',
              }}
            >
              {filteredLineProducts.length === 0 ? (
                <div style={{ padding: '12px 14px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>No products/services found.</div>
              ) : displayedProducts.map((p) => (
                <button
                  key={p._id}
                  type="button"
                  onMouseDown={() => appendProductLine(p)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--bg-elevated)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                  style={{
                    width: '100%',
                    border: 'none',
                    background: 'transparent',
                    padding: '12px 16px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    borderBottom: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                    }}
                  >
                    {p.name}
                  </div>
                  <div
                    style={{
                      fontSize: '0.72rem',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {[p.description, p.hsn, fmt(p.price)].filter(Boolean).join(' · ')}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {newItemType && (
          <div style={{ border: '1px solid var(--border)', background: 'var(--bg-elevated)', borderRadius: 12, padding: 14, marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <strong>Add {newItemType}</strong>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setNewItemType(null)}><X size={14} /></button>
            </div>
            <div className="form-grid-3">
              <input className="form-control" placeholder="Name" value={newItemDraft.name} onChange={(e) => setNewItemDraft((d) => ({ ...d, name: e.target.value }))} />
              <input className="form-control" placeholder="Description" value={newItemDraft.description} onChange={(e) => setNewItemDraft((d) => ({ ...d, description: e.target.value }))} />
              <input className="form-control" value={newItemType} disabled style={{ opacity: 0.7 }} />
              <input type="number" className="form-control" placeholder="Qty" value={newItemDraft.quantity} onChange={(e) => setNewItemDraft((d) => ({ ...d, quantity: parseFloat(e.target.value) || 0 }))} />
              <select className="form-control" value={newItemDraft.unit} onChange={(e) => setNewItemDraft((d) => ({ ...d, unit: e.target.value }))}>{UNITS.map((u) => <option key={u} value={u}>{u}</option>)}</select>
              <input type="number" className="form-control" placeholder="Price" value={newItemDraft.price || ''} onChange={(e) => setNewItemDraft((d) => ({ ...d, price: parseFloat(e.target.value) || 0 }))} />
              <input className="form-control" placeholder={newItemType === 'Service' ? 'SAC' : 'HSN'} value={newItemDraft.hsn} onChange={(e) => setNewItemDraft((d) => ({ ...d, hsn: e.target.value }))} />
              <input type="number" className="form-control" placeholder="CGST %" value={newItemDraft.cgstRate || ''} onChange={(e) => setNewItemDraft((d) => ({ ...d, cgstRate: parseFloat(e.target.value) || 0 }))} />
              <input type="number" className="form-control" placeholder="SGST %" value={newItemDraft.sgstRate || ''} onChange={(e) => setNewItemDraft((d) => ({ ...d, sgstRate: parseFloat(e.target.value) || 0 }))} />
              <input type="number" className="form-control" placeholder="IGST %" value={newItemDraft.igstRate || ''} onChange={(e) => setNewItemDraft((d) => ({ ...d, igstRate: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setNewItemType(null)}>Cancel</button>
              <button type="button" className="btn btn-primary btn-sm" onClick={commitNewItem}>Add {newItemType}</button>
            </div>
          </div>
        )}

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr>
                <th style={{ padding: '8px 6px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>Name</th>
                <th style={{ padding: '8px 6px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>Description</th>
                {showHsn && (
                  <th style={{ padding: '8px 6px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>
                    HSN
                    <button type="button" onClick={() => setShowHsn(false)} title="Hide HSN column" style={{ marginLeft: 4, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, verticalAlign: 'middle', lineHeight: 1 }}>✕</button>
                  </th>
                )}
                <th style={{ padding: '8px 6px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>Qty</th>
                <th style={{ padding: '8px 6px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>Unit</th>
                <th style={{ padding: '8px 6px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>Price</th>
                {discConfig.mode === 'item' && (
                  <>
                    <th style={{ padding: '8px 6px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>Disc</th>
                  </>
                )}
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
                const line = computeLine(item, form.isInterstate, form.taxType, discConfig.mode);
                const lineSubtotal = (item.price || 0) * (item.quantity || 0);
                const computedAmt = Number(((lineSubtotal * (item.discount || 0)) / 100).toFixed(2));
                const amtDisplayValue = discAmtDraft[idx] !== undefined ? discAmtDraft[idx] : computedAmt; const productFilterQuery = productQueries[idx];
                const selectedProductName = products.find((p) => p._id === item.productId)?.name;
                const filteredProducts = products.filter((p) =>
                  p.name.toLowerCase().includes((productFilterQuery ?? '').toLowerCase())
                ).slice(0, 8);

                return (
                  <tr key={idx}>
                    <td style={{ padding: '6px 4px' }}>
                      <input className="form-control" style={{ minWidth: '150px', padding: '6px 8px' }} placeholder="Item name" value={item.name} onChange={(e) => setItem(idx, 'name', e.target.value)} />
                    </td>
                    <td style={{ padding: '6px 4px' }}>
                      <input className="form-control" style={{ minWidth: '170px', padding: '6px 8px' }} placeholder="Description" value={item.description || ''} onChange={(e) => setItem(idx, 'description', e.target.value)} />
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
                      <input
                        type="number"
                        className="form-control"
                        style={{ width: '90px', padding: '6px 8px' }}
                        value={item.price === 0 ? '' : item.price}
                        min={0}
                        placeholder="0"
                        onChange={(e) => setItem(idx, 'price', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                      />
                    </td>
                    {discConfig.mode === 'item' && (
                      <td style={{ padding: '6px 4px' }}>
                        <div style={{ display: 'flex', width: 130 }}>
                          <input
                            type="number"
                            className="form-control"
                            placeholder="0"
                            style={{ width: 76, padding: '6px 8px', borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
                            value={(discountInputModes[idx] || 'percent') === 'flat' ? (discAmtDraft[idx] ?? (computedAmt || '')) : (item.discount === 0 ? '' : Number(item.discount.toFixed(2)))}
                            min={0}
                            max={(discountInputModes[idx] || 'percent') === 'percent' ? 100 : undefined}
                            onChange={(e) => {
                              const mode = discountInputModes[idx] || 'percent';
                              if (mode === 'flat') setDiscAmtDraft((d) => ({ ...d, [idx]: e.target.value }));
                              setDiscountForItem(idx, e.target.value, mode);
                            }}
                            onBlur={() => {
                              if ((discountInputModes[idx] || 'percent') === 'flat') setDiscAmtDraft((d) => { const c = { ...d }; delete c[idx]; return c; });
                            }}
                          />
                          <select
                            className="form-control"
                            value={discountInputModes[idx] || 'percent'}
                            onChange={(e) => {
                              const next = e.target.value;
                              setDiscountInputModes((m) => ({ ...m, [idx]: next }));
                              setDiscAmtDraft((d) => { const c = { ...d }; delete c[idx]; return c; });
                            }}
                            style={{ width: 54, padding: '6px 4px', borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                          >
                            <option value="percent">%</option>
                            <option value="flat">₹</option>
                          </select>
                        </div>
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
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Subtotal</span>
              <span>{fmt(totals.subtotal)}</span>
            </div>
            {discConfig.mode === 'item' && totals.itemDiscount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Item Discount</span>
                <span style={{ color: 'var(--danger)' }}>- {fmt(totals.itemDiscount)}</span>
              </div>
            )}
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
            {totals.tax > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Tax</span>
                <span>{fmt(totals.tax)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingTop: 4 }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Round off</span>
              <button
                type="button"
                onClick={() => setField('roundOff', !form.roundOff)}
                aria-pressed={!!form.roundOff}
                style={{
                  width: 46, height: 24, borderRadius: 999, border: 'none', padding: 2,
                  background: form.roundOff ? 'var(--primary)' : 'var(--border)',
                  cursor: 'pointer', transition: 'background 0.15s ease',
                }}
              >
                <span style={{ display: 'block', width: 20, height: 20, borderRadius: '50%', background: '#fff', transform: form.roundOff ? 'translateX(22px)' : 'translateX(0)', transition: 'transform 0.15s ease', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
              </button>
            </div>
            {form.roundOff && Math.abs(totals.roundOffDiff) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Round Off</span>
                <span>{totals.roundOffDiff >= 0 ? '+' : '-'} {fmt(Math.abs(totals.roundOffDiff))}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '8px', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
              <span>Grand Total</span>
              <span>{fmt(totals.total)}</span>
            </div>
          </div>
        </div>
      </div>


      {/* Banking Details (from profile) */}
      {isQuotation && hasBankDetails && (
        <div className="card mb-4">
          <div className="flex gap-2" style={{ alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div className="flex gap-2" style={{ alignItems: 'center' }}>
              <div style={{ padding: 8, background: 'var(--primary-bg)', borderRadius: 8, color: 'var(--primary)' }}>
                <Landmark size={18} />
              </div>
              <h2 className="card-title" style={{ margin: 0 }}>Banking Details</h2>
            </div>
            {bankAccounts.length > 1 && (
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setBankSwitchOpen((open) => !open)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Landmark size={13} /> Switch Account <ChevronDown size={13} />
                </button>
                {bankSwitchOpen && (
                  <>
                    <div onClick={() => setBankSwitchOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 39 }} />
                    <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 6, zIndex: 40, width: 280, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
                      {bankAccounts.map((account, idx) => (
                        <button
                          key={`${account.accountNumber || account.bankName}-${idx}`}
                          type="button"
                          onClick={() => { setField('selectedBankIndex', idx); setBankSwitchOpen(false); }}
                          style={{
                            width: '100%', padding: '11px 14px', border: 'none', borderBottom: '1px solid var(--border)',
                            background: idx === selectedBankIndex ? 'var(--primary-bg)' : 'transparent',
                            color: 'var(--text-primary)', textAlign: 'left', cursor: 'pointer',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontWeight: 700 }}>
                            <span>{account.label || account.bankName || `Bank ${idx + 1}`}</span>
                            {idx === selectedBankIndex && <span style={{ color: 'var(--primary)', fontSize: '0.72rem' }}>Selected</span>}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 3 }}>
                            {[account.bankName, account.accountNumber].filter(Boolean).join(' · ')}
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          <div className="form-grid">
            {bank.bankName && <div><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Bank Name</div><div style={{ fontWeight: 600, marginTop: 4 }}>{bank.bankName}</div></div>}
            {bank.accountName && <div><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Account Name</div><div style={{ fontWeight: 600, marginTop: 4 }}>{bank.accountName}</div></div>}
            {bank.accountNumber && <div><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Account Number</div><div style={{ fontWeight: 600, marginTop: 4 }}>{bank.accountNumber}</div></div>}
            {bank.ifscCode && <div><div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>IFSC</div><div style={{ fontWeight: 600, marginTop: 4 }}>{bank.ifscCode}</div></div>}
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="card">
        <h2 className="card-title mb-4" style={{ marginBottom: '16px' }}>Additional Info</h2>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Notes</label>
            <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 10, background: 'var(--bg-elevated)' }}>
              {notePoints.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: 8 }}>Add bullet-point notes for this {docLabel.toLowerCase()}.</p>}
              {notePoints.map((point, noteIdx) => (
                <div key={noteIdx} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ color: 'var(--primary)', fontWeight: 700 }}>•</span>
                  <input
                    className="form-control"
                    value={point}
                    onChange={(e) => {
                      const next = [...notePoints];
                      next[noteIdx] = e.target.value;
                      setField('notes', serializeNotes(next));
                    }}
                    placeholder={`Point ${noteIdx + 1}`}
                  />
                  <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => setField('notes', serializeNotes(notePoints.filter((_, i) => i !== noteIdx)))}><X size={14} /></button>
                </div>
              ))}
              {notePoints.length < 5 ? (
                <button type="button" className="btn btn-primary btn-sm" onClick={() => setField('notes', serializeNotes([...notePoints, 'New note']))}><Plus size={14} /> Add point</button>
              ) : (
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => toast('Upgrade your plan to add more than 5 note points', { icon: '🔒' })}><Lock size={14} /> Upgrade to add more</button>
              )}
            </div>
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
                  const isLocked = t.id && !FREE_TEMPLATES.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        if (isLocked) {
                          toast('Upgrade your plan to unlock this template', { icon: '🔒' });
                          return;
                        }
                        setField('template', t.id);
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
                        opacity: isLocked ? 0.85 : 1,
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
                        {isLocked && (
                          <div style={{
                            position: 'absolute', inset: 0, background: 'rgba(20,20,30,0.45)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <span style={{
                              display: 'flex', alignItems: 'center', gap: 4,
                              background: '#fff', color: '#111',
                              fontSize: '0.62rem', fontWeight: 700,
                              padding: '3px 8px', borderRadius: 20,
                            }}>
                              <Lock size={10} /> Upgrade
                            </span>
                          </div>
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

            <div className="form-group">
              <label className="form-label"><strong>1. Select Tax Type</strong> <span style={{ color: 'var(--danger)' }}>*</span></label>
              <select className="form-control" value={taxDraft.taxType} onChange={(e) => setTaxDraft(d => ({ ...d, taxType: e.target.value }))}>
                <option value="gst_india">GST (India)</option>
                <option value="vat">VAT</option>
                <option value="none">No Tax</option>
              </select>
            </div>

            {taxDraft.taxType === 'gst_india' && (
              <div className="form-group">
                <label className="form-label"><strong>2. Place of Supply</strong> <span style={{ color: 'var(--danger)' }}>*</span></label>
                <select className="form-control" value={taxDraft.placeOfSupply} onChange={(e) => setTaxDraft(d => ({ ...d, placeOfSupply: e.target.value }))}>
                  {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}

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

            <div className="form-group">
              <label className="form-label"><strong>Discount Type</strong></label>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                {[
                  ['item', 'Item-wise', 'Disc % / Amt columns per line item'],
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

      {/* ══ Create Client Modal ══ */}
      {newClientModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(3px)' }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: '28px 28px 20px', width: 440, maxWidth: '95vw', boxShadow: 'var(--shadow)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>Create Client</h3>
              <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setNewClientModal(false)}><X size={18} /></button>
            </div>

            <div className="form-group">
              <label className="form-label">Client / Business Name *</label>
              <input className="form-control" autoFocus value={newClientForm.name} onChange={(e) => setNewClientForm((f) => ({ ...f, name: e.target.value }))} placeholder="Acme Corp" />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="form-control" value={newClientForm.email} onChange={(e) => setNewClientForm((f) => ({ ...f, email: e.target.value }))} placeholder="client@example.com" />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-control" value={newClientForm.phone} onChange={(e) => setNewClientForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+91 9876543210" />
            </div>
            <div className="form-group">
              <label className="form-label">GSTIN</label>
              <input className="form-control" value={newClientForm.gstin} onChange={(e) => setNewClientForm((f) => ({ ...f, gstin: e.target.value.toUpperCase() }))} placeholder="22AAAAA0000A1Z5" />
            </div>

            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: -6, marginBottom: 4 }}>
              You can add address, PAN and notes from the{' '}
              <button
                type="button"
                onClick={() => openFullClientForm(newClientForm)}
                style={{
                  background: 'none', border: 'none', padding: 0, margin: 0,
                  color: 'var(--primary)', fontWeight: 700, cursor: 'pointer',
                  textDecoration: 'underline', fontSize: '0.72rem',
                }}
              >
                Clients page
              </button>

            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setNewClientModal(false)}>Cancel</button>
              <button type="button" className="btn btn-primary" disabled={creatingClient} onClick={handleCreateClientSubmit}>
                {creatingClient ? 'Creating…' : 'Create Client'}
              </button>
            </div>
          </div>
        </div>
      )}


    </form>
  );
}