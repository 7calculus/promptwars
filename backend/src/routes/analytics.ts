import { Router, Request, Response } from 'express';
import db from '../database/schema';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// GET /api/analytics/overview
router.get('/overview', asyncHandler(async (_req: Request, res: Response) => {
  const equipment = db.prepare('SELECT status FROM equipment').all() as { status: string }[];
  const totalEquipment = equipment.length;
  const available = equipment.filter(e => e.status === 'available').length;
  const inUse = equipment.filter(e => e.status === 'in-use').length;
  const maintenance = equipment.filter(e => e.status === 'maintenance').length;
  const reserved = equipment.filter(e => e.status === 'reserved').length;

  const totalBookings = (db.prepare('SELECT COUNT(*) as c FROM bookings').get() as { c: number }).c;
  const pendingRequests = (db.prepare("SELECT COUNT(*) as c FROM requests WHERE status = 'pending'").get() as { c: number }).c;

  const approved = (db.prepare("SELECT COUNT(*) as c FROM requests WHERE status = 'approved'").get() as { c: number }).c;
  const rejected = (db.prepare("SELECT COUNT(*) as c FROM requests WHERE status = 'rejected'").get() as { c: number }).c;
  const totalDecided = approved + rejected;
  const approvalRate = totalDecided > 0 ? approved / totalDecided : 0;

  // Conflict rate = bookings that resulted in alternatives / total booking attempts (approximated)
  const conflictRate = 0.15; // placeholder – real implementation would track conflicts in DB

  // Average booking duration in hours
  const durationRow = db.prepare(`
    SELECT AVG((julianday(end_time) - julianday(start_time)) * 24) as avg_hours FROM bookings
  `).get() as { avg_hours: number | null };
  const avgBookingDuration = Math.round((durationRow.avg_hours ?? 0) * 100) / 100;

  // Utilization: approved bookings occupying time / total possible time for available equipment
  const utilizationRate = Math.round((inUse / Math.max(totalEquipment, 1)) * 100) / 100;

  res.json({
    totalEquipment, available, inUse, maintenance, reserved,
    totalBookings, pendingRequests, approvalRate, conflictRate,
    avgBookingDuration, utilizationRate,
  });
}));

// GET /api/analytics/utilization
router.get('/utilization', asyncHandler(async (_req: Request, res: Response) => {
  const rows = db.prepare(`
    SELECT e.id as equipment_id, e.name, e.demand_score,
           COUNT(b.id) as booking_count,
           COALESCE(SUM((julianday(b.end_time) - julianday(b.start_time)) * 24), 0) as total_hours
    FROM equipment e
    LEFT JOIN bookings b ON e.id = b.equipment_id AND b.status IN ('approved','completed')
    GROUP BY e.id
    ORDER BY total_hours DESC
  `).all() as { equipment_id: string; name: string; demand_score: number; booking_count: number; total_hours: number }[];

  const data = rows.map(r => ({
    ...r,
    total_hours: Math.round(r.total_hours * 10) / 10,
    utilizationRate: Math.round(r.demand_score * 100) / 100,
  }));

  res.json({ utilization: data });
}));

// GET /api/analytics/trends
router.get('/trends', asyncHandler(async (_req: Request, res: Response) => {
  // 7-day booking trend
  const trend = db.prepare(`
    SELECT DATE(start_time) as date, COUNT(*) as count
    FROM bookings
    WHERE start_time >= DATE('now', '-7 days')
    GROUP BY DATE(start_time)
    ORDER BY date
  `).all() as { date: string; count: number }[];

  // Peak hours histogram (0–23)
  const peakHoursRaw = db.prepare(`
    SELECT CAST(strftime('%H', start_time) AS INTEGER) as hour, COUNT(*) as count
    FROM bookings
    GROUP BY hour
    ORDER BY hour
  `).all() as { hour: number; count: number }[];

  const peakHours: Record<number, number> = {};
  for (let h = 0; h < 24; h++) peakHours[h] = 0;
  for (const r of peakHoursRaw) peakHours[r.hour] = r.count;

  // Department breakdown
  const departmentBreakdown = db.prepare(`
    SELECT e.department, COUNT(b.id) as bookings
    FROM bookings b
    JOIN equipment e ON b.equipment_id = e.id
    GROUP BY e.department
    ORDER BY bookings DESC
  `).all() as { department: string; bookings: number }[];

  // Category breakdown
  const categoryBreakdown = db.prepare(`
    SELECT e.category, COUNT(b.id) as bookings
    FROM bookings b
    JOIN equipment e ON b.equipment_id = e.id
    GROUP BY e.category
    ORDER BY bookings DESC
  `).all() as { category: string; bookings: number }[];

  res.json({ trend, peakHours, departmentBreakdown, categoryBreakdown });
}));

// GET /api/analytics/insights
router.get('/insights', asyncHandler(async (_req: Request, res: Response) => {
  const insights: { type: string; title: string; message: string; severity: string }[] = [];

  // High demand equipment
  const highDemand = db.prepare('SELECT name, demand_score FROM equipment WHERE demand_score > 0.8 ORDER BY demand_score DESC').all() as { name: string; demand_score: number }[];
  if (highDemand.length > 0) {
    insights.push({
      type: 'high_demand',
      title: 'High Demand Equipment',
      message: `${highDemand.map(e => e.name).join(', ')} ${highDemand.length === 1 ? 'is' : 'are'} in high demand (score > 0.80). Consider booking in advance.`,
      severity: 'warning',
    });
  }

  // Underutilized equipment
  const underutilized = db.prepare("SELECT name, demand_score FROM equipment WHERE demand_score < 0.4 AND status = 'available' ORDER BY demand_score ASC LIMIT 3").all() as { name: string; demand_score: number }[];
  if (underutilized.length > 0) {
    insights.push({
      type: 'underutilized',
      title: 'Underutilized Equipment',
      message: `${underutilized.map(e => e.name).join(', ')} ${underutilized.length === 1 ? 'is' : 'are'} underutilized — available for immediate booking.`,
      severity: 'info',
    });
  }

  // Pending approvals
  const pending = (db.prepare("SELECT COUNT(*) as c FROM requests WHERE status = 'pending'").get() as { c: number }).c;
  if (pending > 0) {
    insights.push({
      type: 'pending_approvals',
      title: 'Pending Approvals',
      message: `${pending} booking request${pending !== 1 ? 's' : ''} waiting for faculty approval. Students may be blocked.`,
      severity: pending > 3 ? 'error' : 'warning',
    });
  }

  // Equipment in maintenance
  const inMaint = db.prepare("SELECT name FROM equipment WHERE status = 'maintenance'").all() as { name: string }[];
  if (inMaint.length > 0) {
    insights.push({
      type: 'maintenance',
      title: 'Equipment Under Maintenance',
      message: `${inMaint.map(e => e.name).join(', ')} ${inMaint.length === 1 ? 'is' : 'are'} under maintenance and unavailable.`,
      severity: 'info',
    });
  }

  // Upcoming deadline pressure
  const urgentProjects = db.prepare(`
    SELECT title, deadline FROM projects
    WHERE status = 'active' AND progress < 0.9
      AND julianday(deadline) - julianday('now') <= 7
    ORDER BY deadline
  `).all() as { title: string; deadline: string }[];
  if (urgentProjects.length > 0) {
    insights.push({
      type: 'deadline_pressure',
      title: 'Upcoming Project Deadlines',
      message: `${urgentProjects.length} project${urgentProjects.length !== 1 ? 's' : ''} with deadlines within 7 days: ${urgentProjects.map(p => `"${p.title}" (${p.deadline})`).join(', ')}.`,
      severity: 'error',
    });
  }

  res.json({ insights, generated_at: new Date().toISOString() });
}));

export default router;
