const API_BASE_URL = window.location.origin.includes('localhost') 
  ? 'http://localhost:5000/api' 
  : '/api';

/**
 * Get the JWT token from local storage
 */
const getToken = () => localStorage.getItem('slidepaw_admin_token');

/**
 * Perform an HTTP request with automatic token injection and error handling.
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const fetchOptions = {
    method: options.method || 'GET',
    headers,
    ...options
  };

  if (options.body) {
    fetchOptions.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, fetchOptions);
    
    // Automatically handle session expiry
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem('slidepaw_admin_token');
      localStorage.removeItem('slidepaw_admin_user');
      if (!window.location.pathname.endsWith('/login')) {
        window.location.href = '/login';
      }
      throw new Error('Session expired or unauthorized.');
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Something went wrong.');
    }
    
    return data;
  } catch (error) {
    console.error(`API Error in ${endpoint}:`, error);
    throw error;
  }
}

const api = {
  // Authentication
  login: async (username, password) => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: { username, password }
    });
  },

  // Stats & Dashboard
  getStats: async () => {
    return apiRequest('/admin/dashboard/stats');
  },

  getLogs: async (limit = 50) => {
    return apiRequest(`/admin/dashboard/logs?limit=${limit}`);
  },

  // Settings
  getSettings: async () => {
    return apiRequest('/admin/settings');
  },

  updateSettings: async (settings) => {
    return apiRequest('/admin/settings', {
      method: 'POST',
      body: settings
    });
  },

  // User Management
  getUsers: async (search = '', filter = 'all', page = 1) => {
    return apiRequest(`/users?search=${encodeURIComponent(search)}&filter=${filter}&page=${page}`);
  },

  banUser: async (id, ban) => {
    return apiRequest(`/users/${id}/ban`, {
      method: 'POST',
      body: { ban }
    });
  },

  deleteUser: async (id) => {
    return apiRequest(`/users/${id}`, {
      method: 'DELETE'
    });
  },

  getUserActivity: async (id) => {
    return apiRequest(`/users/${id}/activity`);
  },

  // Presentation Management
  getPresentations: async (search = '', page = 1) => {
    return apiRequest(`/presentations?search=${encodeURIComponent(search)}&page=${page}`);
  },

  getPresentationDetails: async (id) => {
    return apiRequest(`/presentations/${id}`);
  },

  deletePresentation: async (id) => {
    return apiRequest(`/presentations/${id}`, {
      method: 'DELETE'
    });
  }
};

export default api;
export { API_BASE_URL };
