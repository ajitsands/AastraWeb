const API_BASE = import.meta.env.VITE_API_BASE || '';

export function resolveAssetUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  if (url.startsWith('/brand/') || url.startsWith('/samples/')) {
    return url;
  }
  return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
}

async function request(path, options = {}) {
  const token = localStorage.getItem('aastra_admin_token');
  const headers = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({
    success: false,
    error: `HTTP ${res.status} ${res.statusText}`,
  }));

  if (!res.ok || data.success === false) {
    const err = new Error(data.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }

  return data.data;
}

export const api = {
  // Auth
  login: (email, password) =>
    request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  me: () => request('/api/auth/me'),
  changePassword: (current_password, new_password) =>
    request('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ current_password, new_password }),
    }),

  // Dashboard
  getDashboardStats: () => request('/api/dashboard/stats'),

  // Categories
  getCategories: (all = false) => request(`/api/categories${all ? '?all=1' : ''}`),
  getCategory: (idOrSlug) => request(`/api/categories/${encodeURIComponent(idOrSlug)}`),
  createCategory: (payload) =>
    request('/api/categories', { method: 'POST', body: JSON.stringify(payload) }),
  updateCategory: (id, payload) =>
    request(`/api/categories/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteCategory: (id) => request(`/api/categories/${id}`, { method: 'DELETE' }),

  // Sub Categories
  getSubCategories: (params = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.set(k, v);
    });
    const qStr = qs.toString();
    return request(`/api/sub-categories${qStr ? `?${qStr}` : ''}`);
  },
  createSubCategory: (payload) =>
    request('/api/sub-categories', { method: 'POST', body: JSON.stringify(payload) }),
  updateSubCategory: (id, payload) =>
    request(`/api/sub-categories/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteSubCategory: (id) => request(`/api/sub-categories/${id}`, { method: 'DELETE' }),

  // Finishes
  getFinishes: (all = false) => request(`/api/finishes${all ? '?all=1' : ''}`),
  getFinish: (idOrSlug) => request(`/api/finishes/${encodeURIComponent(idOrSlug)}`),
  createFinish: (payload) =>
    request('/api/finishes', { method: 'POST', body: JSON.stringify(payload) }),
  updateFinish: (id, payload) =>
    request(`/api/finishes/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteFinish: (id) => request(`/api/finishes/${id}`, { method: 'DELETE' }),

  // Items
  getItems: (params = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.set(k, v);
    });
    const qStr = qs.toString();
    return request(`/api/items${qStr ? `?${qStr}` : ''}`);
  },
  getItem: (idOrSlug) => request(`/api/items/${encodeURIComponent(idOrSlug)}`),
  createItem: (payload) =>
    request('/api/items', { method: 'POST', body: JSON.stringify(payload) }),
  updateItem: (id, payload) =>
    request(`/api/items/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteItem: (id) => request(`/api/items/${id}`, { method: 'DELETE' }),

  // Catalogue PDF Page Groups
  getGroups: (params = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.set(k, v);
    });
    const qStr = qs.toString();
    return request(`/api/groups${qStr ? `?${qStr}` : ''}`);
  },
  getGroup: (idOrCode) => request(`/api/groups/${encodeURIComponent(idOrCode)}`),
  createGroup: (payload) =>
    request('/api/groups', { method: 'POST', body: JSON.stringify(payload) }),
  updateGroup: (id, payload) =>
    request(`/api/groups/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteGroup: (id) => request(`/api/groups/${id}`, { method: 'DELETE' }),

  // Upload
  uploadImage: (file) => {
    const form = new FormData();
    form.append('file', file);
    return request('/api/upload', { method: 'POST', body: form });
  },

  // Enquiries
  submitEnquiry: (payload) =>
    request('/api/enquiries', { method: 'POST', body: JSON.stringify(payload) }),
  getEnquiries: () => request('/api/enquiries'),
  updateEnquiryStatus: (id, status) =>
    request(`/api/enquiries/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }),

  // Analytics & PDF Download Tracking
  trackEvent: (payload) =>
    request('/api/analytics/track', { method: 'POST', body: JSON.stringify(payload) }).catch(() => {}),
  getAnalyticsSummary: (days = 30) => request(`/api/analytics/summary?days=${days}`),
  getAnalyticsLogs: (params = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.set(k, v);
    });
    const qStr = qs.toString();
    return request(`/api/analytics/logs${qStr ? `?${qStr}` : ''}`);
  },
};
