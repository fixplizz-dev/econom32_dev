import axios from 'axios';

const API_URL = typeof window !== 'undefined' 
  ? 'http://localhost:3002' 
  : process.env.API_URL || 'http://localhost:3002';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== 'undefined' && error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

// API functions
export const newsApi = {
  getAll: (params?: { page?: number; limit?: number; published?: boolean }) =>
    api.get('/news', { params }),
  getById: (id: string) => api.get(`/news/${id}`),
  create: (data: unknown) => api.post('/news', data),
  update: (id: string, data: unknown) => api.put(`/news/${id}`, data),
  delete: (id: string) => api.delete(`/news/${id}`),
};

export const pagesApi = {
  getAll: (published?: boolean) => api.get('/pages', { params: { published } }),
  getBySlug: (slug: string) => api.get(`/pages/${slug}`),
  create: (data: unknown) => api.post('/pages', data),
  update: (id: string, data: unknown) => api.put(`/pages/${id}`, data),
  delete: (id: string) => api.delete(`/pages/${id}`),
};

export const departmentsApi = {
  getAll: (params?: { search?: string; activity?: string }) => 
    api.get('/departments', { params }),
  getById: (id: string) => api.get(`/departments/${id}`),
  create: (data: unknown) => api.post('/departments', data),
  update: (id: string, data: unknown) => api.put(`/departments/${id}`, data),
  delete: (id: string) => api.delete(`/departments/${id}`),
};

export const employeesApi = {
  getAll: (params?: { departmentId?: string; search?: string; activity?: string }) => 
    api.get('/employees', { params }),
  getById: (id: string) => api.get(`/employees/${id}`),
  create: (data: unknown) => api.post('/employees', data),
  update: (id: string, data: unknown) => api.put(`/employees/${id}`, data),
  delete: (id: string) => api.delete(`/employees/${id}`),
};

export const appealsApi = {
  submit: (data: unknown) => api.post('/appeals', data),
  getByTicket: (ticketNumber: string) => 
    api.get(`/appeals/ticket/${ticketNumber}`),
  getAll: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get('/appeals', { params }),
  respond: (id: string, data: unknown) => api.put(`/appeals/${id}/respond`, data),
};

export const bannersApi = {
  getAll: () => api.get('/banners'),
  getAllAdmin: () => api.get('/banners/admin'),
  create: (data: unknown) => api.post('/banners', data),
  update: (id: string, data: unknown) => api.put(`/banners/${id}`, data),
  delete: (id: string) => api.delete(`/banners/${id}`),
};

export const filesApi = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadMultiple: (files: File[]) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    return api.post('/files/upload-multiple', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getInfo: (id: string) => api.get(`/files/${id}/info`),
  delete: (id: string) => api.delete(`/files/${id}`),
};

export const tagsApi = {
  getAll: () => api.get('/tags'),
  getById: (id: string) => api.get(`/tags/${id}`),
  create: (data: unknown) => api.post('/tags', data),
  update: (id: string, data: unknown) => api.put(`/tags/${id}`, data),
  delete: (id: string) => api.delete(`/tags/${id}`),
};

export const categoriesApi = {
  getAll: () => api.get('/categories'),
  getById: (id: string) => api.get(`/categories/${id}`),
  create: (data: unknown) => api.post('/categories', data),
  update: (id: string, data: unknown) => api.put(`/categories/${id}`, data),
  delete: (id: string) => api.delete(`/categories/${id}`),
};

export const commentsApi = {
  getByNewsId: (newsId: string) => api.get(`/comments/news/${newsId}`),
  create: (data: unknown) => api.post('/comments', data),
  getAll: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get('/comments', { params }),
  moderate: (id: string, status: 'APPROVED' | 'REJECTED') => 
    api.put(`/comments/${id}/moderate`, { status }),
  delete: (id: string) => api.delete(`/comments/${id}`),
};

export const rssApi = {
  getNewsFeed: () => api.get('/rss/news', { 
    headers: { 'Accept': 'application/rss+xml' } 
  }),
};

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: unknown) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
};

// Notifications API
export const notificationsApi = {
  getAll: () => api.get('/notifications'),
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/mark-all-read'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  delete: (id: string) => api.delete(`/notifications/${id}`),
};

// Analytics API
export const analyticsApi = {
  track: (data: { page: string; referrer?: string }) => api.post('/analytics/track', data),
  getStats: (startDate?: string, endDate?: string) => api.get('/analytics/stats', {
    params: { startDate, endDate }
  }),
  getRealTime: () => api.get('/analytics/realtime'),
  getDashboard: () => api.get('/analytics/dashboard'),
};