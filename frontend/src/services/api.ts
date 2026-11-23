import axios from 'axios';

const api = axios.create({ baseURL: '/api', timeout: 10000 });

export const equipmentAPI = {
  getAll: (filters?: Record<string, string>) =>
    api.get('/equipment', { params: filters }).then((res) => {
      const data = Array.isArray(res.data) ? res.data : (res.data?.equipment || []);
      return { ...res, data };
    }),
  getById: (id: string) => api.get(`/equipment/${id}`),
  getAvailability: (id: string, date: string, duration: number) =>
    api.get(`/equipment/${id}/availability`, { params: { date, duration } }),
};

export const bookingsAPI = {
  getAll: (filters?: Record<string, string>) =>
    api.get('/bookings', { params: filters }).then((res) => {
      const data = Array.isArray(res.data) ? res.data : (res.data?.bookings || []);
      return { ...res, data };
    }),
  create: (data: unknown) => api.post('/bookings', data),
  cancel: (id: string) => api.put(`/bookings/${id}/cancel`),
};

export const schedulingAPI = {
  recommend: (request: unknown) => api.post('/scheduling/recommend', request),
  checkConflicts: (data: unknown) => api.post('/scheduling/conflicts', data),
};

export const assistantAPI = {
  query: (query: string, studentId?: string) =>
    api.post('/assistant/query', { query, studentId }),
};

export const requestsAPI = {
  getAll: (filters?: Record<string, string>) =>
    api.get('/requests', { params: filters }).then((res) => {
      const data = Array.isArray(res.data) ? res.data : (res.data?.requests || []);
      return { ...res, data };
    }),
  approve: (id: string, notes?: string) => api.put(`/requests/${id}/approve`, { notes }),
  reject: (id: string, reason: string) => api.put(`/requests/${id}/reject`, { reason }),
  suggestAlternative: (id: string, slot: unknown) =>
    api.put(`/requests/${id}/suggest`, { slot }),
};

export const analyticsAPI = {
  getOverview: () => api.get('/analytics/overview'),
  getUtilization: () => api.get('/analytics/utilization'),
  getTrends: () => api.get('/analytics/trends'),
  getInsights: () => api.get('/analytics/insights'),
};

export const notificationsAPI = {
  getAll: (userId: string) =>
    api.get('/notifications', { params: { userId } }).then((res) => {
      const data = Array.isArray(res.data) ? res.data : (res.data?.notifications || []);
      return { ...res, data };
    }),
  markRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllRead: (userId: string) => api.put('/notifications/read-all', { userId }),
};

export const projectsAPI = {
  getAll: (studentId?: string) =>
    api.get('/projects', { params: { studentId } }).then((res) => {
      const data = Array.isArray(res.data) ? res.data : (res.data?.projects || []);
      return { ...res, data };
    }),
  getById: (id: string) => api.get(`/projects/${id}`),
  create: (data: unknown) => api.post('/projects', data),
  update: (id: string, data: unknown) => api.put(`/projects/${id}`, data),
};

export const demoAPI = {
  reset: () => api.post('/reset-demo'),
};

export default api;
