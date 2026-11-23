import axios from 'axios';
import type { AlternativeSlot } from '../types';

const api = axios.create({ baseURL: '/api', timeout: 10000 });

/**
 * The backend returns alternatives in snake_case with a 0–1 score and a
 * `metadata` block. The UI works with camelCase, a 0–100 score and a
 * 5-part breakdown, so convert once here.
 */
export function normalizeAlternative(raw: any): AlternativeSlot {
  const m = raw.metadata || {};
  const pct = (v: unknown, fallback: number) =>
    typeof v === 'number' ? Math.round(v * 100) : fallback;
  const score = typeof raw.score === 'number' ? (raw.score <= 1 ? raw.score * 100 : raw.score) : 80;
  return {
    equipmentId: raw.equipmentId ?? raw.equipment_id,
    equipmentName: raw.equipmentName ?? raw.equipment_name ?? 'Lab Equipment',
    startTime: raw.startTime ?? raw.start_time,
    endTime: raw.endTime ?? raw.end_time,
    score: Math.round(score),
    reasons: raw.reasons ?? [],
    tradeoffs: raw.tradeoffs ?? [],
    scoreBreakdown: raw.scoreBreakdown ?? {
      timeCompatibility: pct(m.deadlineFeasibility, 85),
      equipmentMatch: pct(m.equipmentCompatibility, 90),
      labProximity: pct(m.availability, 85),
      historicalSuccess: pct(m.fairness, 80),
      loadBalance: pct(m.utilization, 80),
    },
  };
}

export const equipmentAPI = {
  getAll: (filters?: Record<string, string>) =>
    api.get('/equipment', { params: filters }).then((res) => {
      const list = Array.isArray(res.data) ? res.data : (res.data?.equipment || []);
      // Backend stores demand as 0–1; the UI shows it as a percentage
      const data = list.map((e: any) => ({
        ...e,
        demandScore: e.demandScore <= 1 ? Math.round(e.demandScore * 100) : e.demandScore,
      }));
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
  getOverview: () =>
    api.get('/analytics/overview').then((res) => {
      const d = res.data || {};
      // Map the backend's field names / 0–1 ratios to what the dashboard expects
      const data = {
        totalEquipment: d.totalEquipment,
        availableNow: d.availableNow ?? d.available,
        activeBookings: d.activeBookings ?? d.inUse,
        pendingApprovals: d.pendingApprovals ?? d.pendingRequests,
        utilizationRate: Math.round((d.utilizationRate ?? 0) * 100),
        avgDuration: d.avgDuration ?? d.avgBookingDuration ?? 0,
        approvalRate: Math.round((d.approvalRate ?? 0) * 100),
        conflictRate: Math.round((d.conflictRate ?? 0) * 100),
      };
      return { ...res, data };
    }),
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
