// API configuration
const API_URL = import.meta.env.VITE_API_URL || 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3005/api'
    : `http://${window.location.hostname}:3005/api`);

// Helper function for API calls
async function apiCall(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return response.json();
}

export const api = {
  // Accounts
  accounts: {
    getAll: () => apiCall('/accounts'),
    getById: (id: number) => apiCall(`/accounts/${id}`),
    create: (data: any) => apiCall('/accounts', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: any) => apiCall(`/accounts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => apiCall(`/accounts/${id}`, { method: 'DELETE' }),
  },

  // Categories
  categories: {
    getAll: () => apiCall('/categories'),
    getById: (id: number) => apiCall(`/categories/${id}`),
    create: (data: any) => apiCall('/categories', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: any) => apiCall(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => apiCall(`/categories/${id}`, { method: 'DELETE' }),
  },

  // Transactions
  transactions: {
    getAll: () => apiCall('/transactions'),
    getById: (id: number) => apiCall(`/transactions/${id}`),
    create: (data: any) => apiCall('/transactions', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: any) => apiCall(`/transactions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => apiCall(`/transactions/${id}`, { method: 'DELETE' }),
  },

  // Budgets
  budgets: {
    getAll: () => apiCall('/budgets'),
    getById: (id: number) => apiCall(`/budgets/${id}`),
    create: (data: any) => apiCall('/budgets', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: any) => apiCall(`/budgets/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => apiCall(`/budgets/${id}`, { method: 'DELETE' }),
  },

  // Sync
  sync: {
    pull: (since?: string) => apiCall(`/sync${since ? `?since=${since}` : ''}`),
    push: (data: any) => apiCall('/sync/push', { method: 'POST', body: JSON.stringify(data) }),
  },

  // Health check
  health: () => apiCall('/health'),
};
