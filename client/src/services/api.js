const BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

export const getAuthToken = () => localStorage.getItem('token');
export const setAuthToken = (token) => {
  if (token) localStorage.setItem('token', token);
  else localStorage.removeItem('token');
};

async function request(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || data.message || `Request failed with status ${response.status}`);
  }

  return data;
}

export const api = {
  auth: {
    login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
    register: (userData) => request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
    verifyEmail: (data) => request('/auth/verify-email', { method: 'POST', body: JSON.stringify(data) }),
    resendOtp: (data) => request('/auth/resend-otp', { method: 'POST', body: JSON.stringify(data) }),
    forgotPassword: (data) => request('/auth/forgot-password', { method: 'POST', body: JSON.stringify(data) }),
    resetPassword: (data) => request('/auth/reset-password', { method: 'POST', body: JSON.stringify(data) }),
    getMe: () => request('/auth/me'),
    logout: () => request('/auth/logout', { method: 'POST' }).catch(() => ({})),
  },

  posts: {
    getFeed: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/posts${query ? `?${query}` : ''}`);
    },
    getPost: (id) => request(`/posts/${id}`),
    createPost: (postData) => request('/posts', { method: 'POST', body: JSON.stringify(postData) }),
    updatePost: (id, postData) => request(`/posts/${id}`, { method: 'PUT', body: JSON.stringify(postData) }),
    deletePost: (id) => request(`/posts/${id}`, { method: 'DELETE' }),
    toggleLike: (id) => request(`/posts/${id}/like`, { method: 'POST' }),
    getComments: (id) => request(`/posts/${id}/comments`),
    addComment: (id, content) => request(`/posts/${id}/comments`, { method: 'POST', body: JSON.stringify({ content }) }),
    deleteComment: (postId, commentId) => request(`/posts/${postId}/comments/${commentId}`, { method: 'DELETE' }),
  },

  ai: {
    generatePost: (params) => request('/ai/generate', { method: 'POST', body: JSON.stringify(params) }),
    improvePost: (params) => request('/ai/improve', { method: 'POST', body: JSON.stringify(params) }),
    summarize: (params) => request('/ai/summarize', { method: 'POST', body: JSON.stringify(params) }),
    getSmartReplies: (content) => request('/ai/smart-replies', { method: 'POST', body: JSON.stringify({ content }) }),
    moderate: (content) => request('/ai/moderate', { method: 'POST', body: JSON.stringify({ content }) }),
    chat: (messages) => request('/ai/chat', { method: 'POST', body: JSON.stringify({ messages }) }),
  },

  admin: {
    getStats: () => request('/admin/stats'),
    getUsers: () => request('/admin/users'),
    updateUser: (userId, data) => request(`/admin/users/${userId}`, { method: 'PUT', body: JSON.stringify(data) }),
    getPosts: (flaggedOnly = false) => request(`/admin/posts?flagged=${flaggedOnly}`),
    dismissFlag: (postId) => request(`/admin/posts/${postId}/dismiss-flag`, { method: 'POST' }),
    getActivity: () => request('/admin/activity'),
  },

  notifications: {
    getNotifications: () => request('/notifications'),
    markAllRead: () => request('/notifications/read', { method: 'POST' }),
  },

  users: {
    getProfile: (userIdOrUsername) => request(`/users/${userIdOrUsername}`),
    updateProfile: (profileData) => request('/users/profile', { method: 'PUT', body: JSON.stringify(profileData) }),
  }
};
