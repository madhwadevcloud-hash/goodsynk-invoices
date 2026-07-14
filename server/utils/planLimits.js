const PLAN_LIMITS = {
    free:              { clients: 3,        documentsPerMonth: 10,       templates: ['template1', 'template2'] },
    growth:            { clients: 15,       documentsPerMonth: 50,       templates: 'all' },
    growth_yearly:     { clients: 15,       documentsPerMonth: 50,       templates: 'all' },
    enterprise:        { clients: Infinity, documentsPerMonth: Infinity, templates: 'all' },
    enterprise_yearly: { clients: Infinity, documentsPerMonth: Infinity, templates: 'all' },
};

// Backward-compat alias so existing code using invoicesPerMonth still works
Object.values(PLAN_LIMITS).forEach((p) => { p.invoicesPerMonth = p.documentsPerMonth; });

const getLimits = (plan) => PLAN_LIMITS[plan] || PLAN_LIMITS.free;

module.exports = { PLAN_LIMITS, getLimits };