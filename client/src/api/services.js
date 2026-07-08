import api from './axios';

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateMe: (data) => api.put('/auth/me', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  deleteAccount: () => api.delete('/auth/me'),
  uploadAvatar: (file) => {
    const form = new FormData();
    form.append('avatar', file);
    return api.post('/auth/upload-avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// ─── Invoices ─────────────────────────────────────────────────────────────────
export const invoiceAPI = {
  getAll: (params) => api.get('/invoices', { params }),
  getById: (id) => api.get(`/invoices/${id}`),
  create: (data) => api.post('/invoices', data),
  update: (id, data) => api.put(`/invoices/${id}`, data),
  updateStatus: (id, data) => api.patch(`/invoices/${id}/status`, data),
  delete: (id) => api.delete(`/invoices/${id}`),
  getStats: () => api.get('/invoices/stats'),


  sendEmail: (id, { to, subject, body, pdfBlob, pdfFileName }) => {
    const form = new FormData();
    form.append('to', to);
    form.append('subject', subject);
    form.append('body', body);
    form.append('pdf', pdfBlob, pdfFileName);
    return api.post(`/invoices/${id}/send-email`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

};

// ─── Quotations ───────────────────────────────────────────────────────────────
export const quotationAPI = {
  getAll: (params) => api.get('/quotations', { params }),
  getById: (id) => api.get(`/quotations/${id}`),
  create: (data) => api.post('/quotations', data),
  update: (id, data) => api.put(`/quotations/${id}`, data),
  updateStatus: (id, data) => api.patch(`/quotations/${id}/status`, data),
  delete: (id) => api.delete(`/quotations/${id}`),
  convert: (id) => api.post(`/quotations/${id}/convert`),

  sendEmail: (id, { to, subject, body, pdfBlob, pdfFileName }) => {
    const form = new FormData();
    form.append('to', to);
    form.append('subject', subject);
    form.append('body', body);
    form.append('pdf', pdfBlob, pdfFileName);
    return api.post(`/quotations/${id}/send-email`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

};

// ─── Clients ──────────────────────────────────────────────────────────────────
export const clientAPI = {
  getAll: () => api.get('/clients'),
  getById: (id) => api.get(`/clients/${id}`),
  create: (data) => api.post('/clients', data),
  update: (id, data) => api.put(`/clients/${id}`, data),
  delete: (id) => api.delete(`/clients/${id}`),
};

// ─── Products ─────────────────────────────────────────────────────────────────
export const productAPI = {
  getAll: () => api.get('/products'),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
};
