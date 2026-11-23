import { Router, Request, Response } from 'express';
import db from '../database/schema';
import { asyncHandler } from '../middleware/errorHandler';
import { Equipment } from '../types';

const router = Router();

// GET /api/equipment?category=&department=&status=&search=&sort=
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { category, department, status, search, sort } = req.query as Record<string, string>;

  let sql = 'SELECT * FROM equipment WHERE 1=1';
  const params: (string | number)[] = [];

  if (category) { sql += ' AND category = ?'; params.push(category); }
  if (department) { sql += ' AND department = ?'; params.push(department); }
  if (status) { sql += ' AND status = ?'; params.push(status); }
  if (search) {
    sql += ' AND (name LIKE ? OR description LIKE ? OR category LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  const sortMap: Record<string, string> = {
    name: 'name ASC',
    demand: 'demand_score DESC',
    hourly_rate: 'hourly_rate ASC',
    status: 'status ASC',
  };
  sql += ` ORDER BY ${sortMap[sort] ?? 'demand_score DESC'}`;

  const rows = db.prepare(sql).all(...params) as Equipment[];
  const equipment = rows.map((e: any) => ({
    ...e,
    demandScore: e.demand_score ?? e.demandScore,
    hourlyRate: e.hourly_rate ?? e.hourlyRate,
    maxDuration: e.max_duration ?? e.maxDuration,
    requiresApproval: Boolean(e.requires_approval),
    requires_approval: Boolean(e.requires_approval),
    specs: typeof e.specs === 'string' ? JSON.parse(e.specs as string) : e.specs,
  }));

  res.json({ equipment, total: equipment.length });
}));

// GET /api/equipment/:id
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const row = db.prepare('SELECT * FROM equipment WHERE id = ?').get(req.params.id) as any;
  if (!row) { res.status(404).json({ error: 'Equipment not found' }); return; }
  res.json({
    ...row,
    demandScore: row.demand_score ?? row.demandScore,
    hourlyRate: row.hourly_rate ?? row.hourlyRate,
    maxDuration: row.max_duration ?? row.maxDuration,
    requiresApproval: Boolean(row.requires_approval),
    requires_approval: Boolean(row.requires_approval),
    specs: typeof row.specs === 'string' ? JSON.parse(row.specs as string) : row.specs,
  });
}));

// GET /api/equipment/:id/availability?date=&duration=
router.get('/:id/availability', asyncHandler(async (req: Request, res: Response) => {
  const { date, duration } = req.query as Record<string, string>;
  const equipmentId = req.params.id;

  // Check equipment exists
  const eq = db.prepare('SELECT * FROM equipment WHERE id = ?').get(equipmentId);
  if (!eq) { res.status(404).json({ error: 'Equipment not found' }); return; }

  // Build date range: default to today if no date given
  const targetDate = date ? new Date(date) : new Date();
  const dayStart = new Date(targetDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(targetDate);
  dayEnd.setHours(23, 59, 59, 999);

  const bookings = db.prepare(`
    SELECT * FROM bookings
    WHERE equipment_id = ?
      AND status IN ('approved', 'pending')
      AND start_time < ?
      AND end_time > ?
    ORDER BY start_time
  `).all(equipmentId, dayEnd.toISOString(), dayStart.toISOString());

  const durationMin = parseInt(duration ?? '60');
  const freeSlots: { start: string; end: string }[] = [];
  let cursor = new Date(dayStart);
  cursor.setHours(8, 0, 0, 0); // lab opens at 8am

  for (const booking of bookings as { start_time: string; end_time: string }[]) {
    const bStart = new Date(booking.start_time);
    if (bStart > cursor && (bStart.getTime() - cursor.getTime()) >= durationMin * 60 * 1000) {
      freeSlots.push({ start: cursor.toISOString(), end: bStart.toISOString() });
    }
    const bEnd = new Date(booking.end_time);
    if (bEnd > cursor) cursor = bEnd;
  }

  // After last booking until 10pm
  const labClose = new Date(targetDate);
  labClose.setHours(22, 0, 0, 0);
  if (cursor < labClose && (labClose.getTime() - cursor.getTime()) >= durationMin * 60 * 1000) {
    freeSlots.push({ start: cursor.toISOString(), end: labClose.toISOString() });
  }

  res.json({ equipment_id: equipmentId, date: dayStart.toISOString().split('T')[0], bookings, free_slots: freeSlots });
}));

// GET /api/equipment/:id/similar
router.get('/:id/similar', asyncHandler(async (req: Request, res: Response) => {
  const eq = db.prepare('SELECT * FROM equipment WHERE id = ?').get(req.params.id) as Equipment | undefined;
  if (!eq) { res.status(404).json({ error: 'Equipment not found' }); return; }

  const similar = db.prepare(`
    SELECT * FROM equipment WHERE category = ? AND id != ? ORDER BY demand_score DESC LIMIT 5
  `).all(eq.category, eq.id) as Equipment[];

  res.json(similar.map(e => ({
    ...e,
    specs: typeof e.specs === 'string' ? JSON.parse(e.specs as unknown as string) : e.specs,
    requires_approval: Boolean(e.requires_approval),
  })));
}));

export default router;
