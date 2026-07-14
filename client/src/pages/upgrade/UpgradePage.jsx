import { useEffect, useState } from 'react';
import { Check, Minus, ArrowRight, Feather, Sparkles, Crown, Users, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI, clientAPI, invoiceAPI } from '../../api/services';
import { useAuth } from '../../context/AuthContext';

const PLANS = [
    {
        id: 'free',
        tag: 'Starter',
        name: 'Free Trial',
        icon: Feather,
        price: 0,
        priceLabel: '₹0',
        priceSuffix: 'forever',
        blurb: 'Enough to send your first invoices.',
        color: 'var(--text-muted)',
        bg: 'var(--bg-elevated)',
        clientsLimit: 3,
        invoicesLimit: 10,
        features: [
            { label: '3 clients', included: true },
            { label: '10 invoices & quotations / month', included: true },
            { label: 'Classic Blue & Minimalist templates', included: true },
            { label: 'Up to 5 note points per document', included: true },
            { label: 'All 6 templates + custom colors', included: false },
            { label: 'Multiple bank accounts', included: true },

        ],
        cta: 'Stay on Free Trial',
    },
    {
        id: 'growth',
        tag: 'Growth',
        name: 'Growth',
        icon: Sparkles,
        price: 199,
        priceLabel: '₹199',
        priceSuffix: '/ month',
        blurb: "For a business that's outgrown the trial.",
        color: 'var(--primary)',
        bg: 'var(--primary-bg)',
        popular: true,
        clientsLimit: 15,
        invoicesLimit: 50,
        features: [
            { label: '15 clients', included: true },
            { label: '50 invoices & quotations / month', included: true },
            { label: 'All 6 templates + custom colors', included: true },
            { label: 'Unlimited note points', included: true },
            { label: 'Multiple bank accounts', included: true },

        ],
        cta: 'Upgrade to Growth',
    },
    {
        id: 'growth_yearly',
        tag: 'Growth',
        name: 'Growth (Yearly)',
        icon: Sparkles,
        price: 2388,
        priceLabel: '₹2,388',
        priceSuffix: '/ year',
        blurb: "Annual plan with a discount.",
        color: 'var(--primary)',
        bg: 'var(--primary-bg)',
        popular: false,
        clientsLimit: 15,
        invoicesLimit: 50,
        features: [
            { label: '15 clients', included: true },
            { label: '50 invoices & quotations / month', included: true },
            { label: 'All 6 templates + custom colors', included: true },
            { label: 'Unlimited note points', included: true },
            { label: 'Multiple bank accounts', included: true },

        ],
        cta: 'Upgrade to Growth (Yearly)',
    },
    {
        id: 'enterprise',
        tag: 'Scale',
        name: 'Enterprise',
        icon: Crown,
        price: 1000,
        priceLabel: '₹1,000',
        priceSuffix: '/ month',
        blurb: 'No ledger left behind — everything, unmetered.',
        color: 'var(--warning)',
        bg: 'var(--warning-bg)',
        clientsLimit: Infinity,
        invoicesLimit: Infinity,
        features: [
            { label: 'Unlimited clients', included: true },
            { label: 'Unlimited invoices & quotations', included: true },
            { label: 'All 6 templates + custom colors', included: true },
            { label: 'Unlimited note points', included: true },
            { label: 'Multiple bank accounts', included: true },

        ],
        cta: 'Go Enterprise',
    },
    {
        id: 'enterprise_yearly',
        tag: 'Scale',
        name: 'Enterprise (Yearly)',
        icon: Crown,
        price: 12000,
        priceLabel: '₹12,000',
        priceSuffix: '/ year',
        blurb: 'Annual enterprise plan with unlimited features.',
        color: 'var(--warning)',
        bg: 'var(--warning-bg)',
        clientsLimit: Infinity,
        invoicesLimit: Infinity,
        features: [
            { label: 'Unlimited clients', included: true },
            { label: 'Unlimited invoices & quotations', included: true },
            { label: 'All 6 templates + custom colors', included: true },
            { label: 'Unlimited note points', included: true },
            { label: 'Multiple bank accounts', included: true },

        ],
        cta: 'Upgrade to Enterprise (Yearly)',
    },
];

const COMPARISON_ROWS = [
    ['Clients', ['3', '15', '15', 'Unlimited', 'Unlimited']],
    ['Invoices & quotations / month', ['10', '50', '50', 'Unlimited', 'Unlimited']],
    ['Templates', ['2 (Classic Blue, Minimalist)', 'All 6 + colors', 'All 6 + colors', 'All 6 + colors', 'All 6 + colors']],
    ['Note points per document', ['5', 'Unlimited', 'Unlimited', 'Unlimited', 'Unlimited']],
    ['Multiple bank accounts', [true, true, true, true, true]],

];

export default function UpgradePage() {
    const { user, updateUser } = useAuth();
    const currentPlan = user?.plan || 'free';

    const [usage, setUsage] = useState({ clients: null, invoices: null });
    const [loadingUsage, setLoadingUsage] = useState(true);
    const [upgradingId, setUpgradingId] = useState(null);

    useEffect(() => {
        invoiceAPI.getUsage()
            .then(({ data }) => {
                setUsage({
                    clients: data.usage.clients,
                    invoices: data.usage.documentsThisMonth,
                });
            })
            .catch((err) => {
                console.error('Failed to load plan usage:', err.response?.data || err.message);
                setUsage({ clients: 0, invoices: 0 });
            })
            .finally(() => setLoadingUsage(false));
    }, []);
    const activePlanConfig = PLANS.find((p) => p.id === currentPlan) || PLANS[0];
    const clientPct = activePlanConfig.clientsLimit === Infinity ? 0 : Math.min(100, ((usage.clients || 0) / activePlanConfig.clientsLimit) * 100);
    const nearLimit = clientPct >= 80;

    const handleSelect = async (plan) => {
        if (plan.id === currentPlan) return;
        setUpgradingId(plan.id);
        try {
            const { data } = await authAPI.upgradePlan(plan.id);
            updateUser(data.user);
            toast.success(`Upgraded to ${plan.name}`);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to upgrade plan');
        } finally {
            setUpgradingId(null);
        }
    };

    return (
        <div>
            <div className="mb-4">
                <h1 className="page-title">Upgrade plan</h1>
                <p className="page-subtitle">You're currently on {activePlanConfig.name}. Changes apply immediately.</p>
            </div>

            {!loadingUsage && nearLimit && activePlanConfig.clientsLimit !== Infinity && (
                <div className="card mb-4" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                    <div className="flex gap-3" style={{ alignItems: 'center' }}>
                        <div className="stat-icon" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}>
                            <Users size={18} />
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>You're near your client limit</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                {usage.clients} of {activePlanConfig.clientsLimit} clients used on {activePlanConfig.name}
                            </div>
                        </div>
                    </div>
                    <span className="badge badge-warning">Consider upgrading</span>
                </div>
            )}

            <div className="stats-grid mb-4">
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--primary-bg)', color: 'var(--primary)' }}>
                        <Users size={20} />
                    </div>
                    <div className="stat-body">
                        <div className="stat-label">Clients (per month)</div>
                        <div className="stat-value">
                            {loadingUsage ? '—' : `${usage.clients} / ${activePlanConfig.clientsLimit === Infinity ? '∞' : activePlanConfig.clientsLimit}`}
                        </div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
                        <FileText size={20} />
                    </div>
                    <div className="stat-body">
                        <div className="stat-label">Invoices (per month)</div>
                        <div className="stat-value">
                            {loadingUsage ? '—' : `${usage.invoices} / ${activePlanConfig.invoicesLimit === Infinity ? '∞' : activePlanConfig.invoicesLimit}`}
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: '32px' }}>
                {PLANS.map((plan) => {
                    const Icon = plan.icon;
                    const isCurrent = plan.id === currentPlan;
                    return (
                        <div
                            key={plan.id}
                            className="card"
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                border: plan.popular && !isCurrent ? '1.5px solid var(--primary)' : undefined,
                                boxShadow: plan.popular && !isCurrent ? '0 0 0 3px var(--primary-bg)' : undefined,
                                position: 'relative',
                            }}
                        >
                            {(plan.popular || isCurrent) && (
                                <span
                                    className={`badge ${isCurrent ? '' : 'badge-primary'}`}
                                    style={{
                                        position: 'absolute', top: -11, left: 20,
                                        background: isCurrent ? 'var(--text-muted)' : 'var(--primary)',
                                        color: '#fff', fontWeight: 700,
                                    }}
                                >
                                    {isCurrent ? 'Current plan' : 'Recommended'}
                                </span>
                            )}

                            <div className="flex gap-3" style={{ alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                                <div>
                                    <h3 className="card-title" style={{ marginBottom: 3 }}>{plan.name}</h3>
                                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>{plan.blurb}</p>
                                </div>
                                <div className="stat-icon" style={{ background: plan.bg, color: plan.color }}>
                                    <Icon size={18} />
                                </div>
                            </div>

                            <div className="flex gap-2" style={{ alignItems: 'baseline', marginBottom: 4 }}>
                                <span style={{ fontSize: '1.7rem', fontWeight: 800 }}>{plan.priceLabel}</span>
                                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{plan.priceSuffix}</span>
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 18 }}>
                                {plan.clientsLimit === Infinity ? 'Unlimited' : plan.clientsLimit} clients · {plan.invoicesLimit === Infinity ? 'unlimited' : plan.invoicesLimit} invoices & quotations/month
                            </div>

                            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', display: 'flex', flexDirection: 'column', gap: 9, flex: 1 }}>
                                {plan.features.map((f) => (
                                    <li key={f.label} style={{ display: 'flex', gap: 8, fontSize: '0.82rem', color: f.included ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                                        {f.included
                                            ? <Check size={15} color={plan.color} style={{ flexShrink: 0, marginTop: 1 }} />
                                            : <Minus size={15} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: 1 }} />}
                                        {f.label}
                                    </li>
                                ))}
                            </ul>

                            <button
                                type="button"
                                className={isCurrent ? 'btn btn-ghost' : 'btn btn-primary'}
                                disabled={isCurrent || upgradingId === plan.id}
                                onClick={() => handleSelect(plan)}
                                style={!isCurrent ? { background: plan.color } : undefined}
                            >
                                {isCurrent
                                    ? 'Currently active'
                                    : upgradingId === plan.id
                                        ? 'Upgrading…'
                                        : <>{plan.cta} <ArrowRight size={14} /></>}
                            </button>
                        </div>
                    );
                })}
            </div>

            <div className="card">
                <h2 className="card-title mb-4" style={{ marginBottom: 16 }}>Compare every line item</h2>
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Feature</th>
                                {PLANS.map((p) => <th key={p.id}>{p.name}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {COMPARISON_ROWS.map(([label, values]) => (
                                <tr key={label}>
                                    <td>{label}</td>
                                    {values.map((v, i) => (
                                        <td key={i}>
                                            {typeof v === 'boolean'
                                                ? (v ? <Check size={15} color={PLANS[i].color} /> : <Minus size={15} color="var(--text-muted)" />)
                                                : v}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}