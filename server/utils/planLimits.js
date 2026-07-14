const PLAN_LIMITS = {
    free: { clients: 3, invoicesPerMonth: 10, templates: ['template1', 'template2'] },
    growth: { clients: 15, invoicesPerMonth: 50, templates: 'all' },
    enterprise: { clients: Infinity, invoicesPerMonth: Infinity, templates: 'all' },
};

const getLimits = (plan) => PLAN_LIMITS[plan] || PLAN_LIMITS.free;

module.exports = { PLAN_LIMITS, getLimits };