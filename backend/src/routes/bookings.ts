import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database/schema';
import { asyncHandler } from '../middleware/errorHandler';
import { validateBooking } from '../middleware/validation';
import { schedulingEngine } from '../algorithms/scheduler';
import { Booking, Equipment } from '../types';

const router = Router();

// GET /api/bookings?studentId=&status=&equipmentId=
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { studentId, status, equipmentId } = req.query as Record<string, string>;

  let sql = `
    SELECT b.*, e.name as equipment_name, e.category, e.lab,
           s.name as student_name, p.title as project_title
    FROM bookings b
    JOIN equipment e ON b.equipment_id = e.id
    LEFT JOIN students s ON b.student_id = s.id
    LEFT JOIN projects p ON b.project_id = p.id
    WHERE 1=1
  `;
  const params: string[] = [];

  if (studentId)   { sql += ' AND b.student_id = ?';   params.push(studentId); }
  if (status)      { sql += ' AND b.status = ?';        params.push(status); }
  if (equipmentId) { sql += ' AND b.equipment_id = ?';  params.push(equipmentId); }

  sql += ' ORDER BY b.created_at DESC, b.start_time DESC';

  const rows = db.prepare(sql).all(...params) as any[];
  const bookings = rows.map((b) => ({
    ...b,
    equipmentId: b.equipment_id,
    equipmentName: b.equipment_name,
    studentId: b.student_id,
    studentName: b.student_name,
    projectId: b.project_id,
    projectTitle: b.project_title,
    startTime: b.start_time,
    endTime: b.end_time,
    createdAt: b.created_at,
    updatedAt: b.updated_at,
  }));
  res.json({ bookings, total: bookings.length });
}));

// POST /api/bookings — create with conflict check
router.post('/', validateBooking, asyncHandler(async (req: Request, res: Response) => {
  const { equipment_id, student_id, project_id, start_time, end_time, purpose, priority = 'normal' } = req.body as {
    equipment_id: string; student_id: string; project_id?: string;
    start_time: string; end_time: string; purpose: string; priority?: string;
  };

  // Validate start < end
  const startMs = Date.parse(start_time);
  const endMs = Date.parse(end_time);
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || startMs >= endMs) {
    res.status(400).json({ error: 'A valid start_time before end_time is required' });
    return;
  }
  if (endMs <= Date.now()) {
    res.status(400).json({ error: 'Bookings must end in the future' });
    return;
  }

  // Check equipment exists
  const equipment = db.prepare('SELECT * FROM equipment WHERE id = ?').get(equipment_id) as Equipment | undefined;
  if (!equipment) { res.status(404).json({ error: 'Equipment not found' }); return; }
  if (equipment.status === 'maintenance') {
    res.status(409).json({ error: 'Equipment is currently under maintenance' });
    return;
  }
  if ((endMs - startMs) / 60000 > equipment.max_duration) {
    res.status(400).json({ error: `Booking exceeds the maximum duration of ${equipment.max_duration} minutes` });
    return;
  }

  // Make conflict detection and insertion atomic so simultaneous requests cannot
  // both reserve the same equipment/time window.
  const createBooking = db.transaction(() => {
    const conflicts = schedulingEngine.findConflicts(equipment_id, start_time, end_time);
    if (conflicts.length > 0) {
      const alternatives = schedulingEngine.generateAlternatives({
        equipment_id, student_id, project_id, requested_start: start_time,
        requested_end: end_time, purpose, priority: priority as 'low' | 'normal' | 'high' | 'critical',
      });
      return { conflicts, alternatives } as const;
    }

    const bookingId = `bk-${uuidv4().slice(0, 8)}`;
    const now = new Date().toISOString();
    const requiresApproval = Boolean(equipment.requires_approval);
    const bookingStatus = requiresApproval ? 'pending' : 'approved';

    db.prepare(`
      INSERT INTO bookings (id, equipment_id, student_id, project_id, start_time, end_time, status, purpose, priority, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(bookingId, equipment_id, student_id, project_id ?? null, start_time, end_time, bookingStatus, purpose, priority, now, now);

    if (requiresApproval) {
      const reqId = `req-${uuidv4().slice(0, 8)}`;
      db.prepare(`
        INSERT INTO requests (id, booking_id, faculty_id, status, notes, created_at, updated_at)
        VALUES (?, ?, NULL, 'pending', ?, ?, ?)
      `).run(reqId, bookingId, `Booking for ${equipment.name} requires faculty approval.`, now, now);
    }

    const notifId = `notif-${uuidv4().slice(0, 8)}`;
    const notifTitle = requiresApproval ? 'Booking Submitted — Pending Approval' : 'Booking Confirmed';
    const notifMsg = requiresApproval
      ? `Your booking for ${equipment.name} on ${start_time} is pending faculty approval.`
      : `Your booking for ${equipment.name} on ${start_time} has been confirmed.`;
    db.prepare(`
      INSERT INTO notifications (id, user_id, user_type, title, message, type, related_id, created_at)
      VALUES (?, ?, 'student', ?, ?, ?, ?, ?)
    `).run(notifId, student_id, notifTitle, notifMsg, requiresApproval ? 'request_pending' : 'booking_created', bookingId, now);

    const row = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId) as any;
    return {
      booking: {
        ...row,
        equipmentId: row.equipment_id,
        equipmentName: equipment.name,
        studentId: row.student_id,
        projectId: row.project_id,
        startTime: row.start_time,
        endTime: row.end_time,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
      requiresApproval,
    } as const;
  });

  const result = createBooking();
  if ('conflicts' in result) {
    res.status(409).json({
      error: 'Booking conflict detected',
      conflicts: result.conflicts,
      alternatives: result.alternatives,
      message: `This equipment is already booked during ${start_time}–${end_time}. ${result.alternatives.length} alternative(s) found.`,
    });
    return;
  }
  res.status(201).json({
    booking: result.booking,
    requires_approval: result.requiresApproval,
    requiresApproval: result.requiresApproval,
  });
}));

// PUT /api/bookings/:id
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id) as Booking | undefined;
  if (!existing) { res.status(404).json({ error: 'Booking not found' }); return; }

  const { purpose, priority, start_time, end_time, status } = req.body as Partial<Booking>;
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE bookings SET
      purpose = COALESCE(?, purpose),
      priority = COALESCE(?, priority),
      start_time = COALESCE(?, start_time),
      end_time = COALESCE(?, end_time),
      status = COALESCE(?, status),
      updated_at = ?
    WHERE id = ?
  `).run(purpose ?? null, priority ?? null, start_time ?? null, end_time ?? null, status ?? null, now, id);

  res.json(db.prepare('SELECT * FROM bookings WHERE id = ?').get(id));
}));

// PUT /api/bookings/:id/cancel
router.put('/:id/cancel', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id) as Booking | undefined;
  if (!existing) { res.status(404).json({ error: 'Booking not found' }); return; }
  if (['cancelled', 'completed'].includes(existing.status)) {
    res.status(400).json({ error: `Cannot cancel a booking with status "${existing.status}"` });
    return;
  }

  const now = new Date().toISOString();
  db.prepare("UPDATE bookings SET status = 'cancelled', updated_at = ? WHERE id = ?").run(now, id);

  // Notify student
  const notifId = `notif-${uuidv4().slice(0, 8)}`;
  db.prepare(`
    INSERT INTO notifications (id, user_id, user_type, title, message, type, related_id, created_at)
    VALUES (?, ?, 'student', 'Booking Cancelled', ?, 'booking_cancelled', ?, ?)
  `).run(notifId, existing.student_id, `Your booking (${id}) has been cancelled.`, id, now);

  res.json({ id, status: 'cancelled' });
}));

// DELETE /api/bookings/:id
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT id FROM bookings WHERE id = ?').get(id);
  if (!existing) { res.status(404).json({ error: 'Booking not found' }); return; }
  db.prepare('DELETE FROM requests WHERE booking_id = ?').run(id);
  db.prepare('DELETE FROM bookings WHERE id = ?').run(id);
  res.json({ id, deleted: true });
}));

export default router;
