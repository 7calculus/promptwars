import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database/schema';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

interface RequestRow {
  id: string;
  booking_id: string;
  faculty_id: string | null;
  status: string;
  notes: string | null;
  suggested_slot: string | null;
  created_at: string;
  updated_at: string;
}

// GET /api/requests?status=&facultyId=
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { status, facultyId } = req.query as Record<string, string>;

  let sql = `
    SELECT r.*, b.equipment_id, b.student_id, b.start_time, b.end_time, b.purpose,
           e.name as equipment_name, s.name as student_name, f.name as faculty_name
    FROM requests r
    JOIN bookings b ON r.booking_id = b.id
    JOIN equipment e ON b.equipment_id = e.id
    JOIN students s ON b.student_id = s.id
    LEFT JOIN faculty f ON r.faculty_id = f.id
    WHERE 1=1
  `;
  const params: string[] = [];

  if (status)    { sql += ' AND r.status = ?';     params.push(status); }
  if (facultyId) { sql += ' AND r.faculty_id = ?'; params.push(facultyId); }

  sql += ' ORDER BY r.created_at DESC';

  const rows = db.prepare(sql).all(...params) as any[];
  const requests = rows.map((r) => ({
    ...r,
    bookingId: r.booking_id,
    facultyId: r.faculty_id,
    facultyName: r.faculty_name,
    studentName: r.student_name,
    studentId: r.student_id,
    equipmentName: r.equipment_name,
    equipmentId: r.equipment_id,
    startTime: r.start_time,
    endTime: r.end_time,
    suggestedSlot: typeof r.suggested_slot === 'string' ? JSON.parse(r.suggested_slot) : r.suggested_slot,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    booking: {
      id: r.booking_id,
      equipmentId: r.equipment_id,
      equipmentName: r.equipment_name,
      studentId: r.student_id,
      studentName: r.student_name,
      startTime: r.start_time,
      endTime: r.end_time,
      purpose: r.purpose,
      status: r.status,
    },
  }));
  res.json({ requests, total: requests.length });
}));

// PUT /api/requests/:id/approve
router.put('/:id/approve', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { notes } = req.body as { notes?: string };
  const now = new Date().toISOString();

  const reqRow = db.prepare('SELECT * FROM requests WHERE id = ?').get(id) as RequestRow | undefined;
  if (!reqRow) { res.status(404).json({ error: 'Request not found' }); return; }
  if (reqRow.status !== 'pending') {
    res.status(400).json({ error: `Request is already ${reqRow.status}` });
    return;
  }

  // Update request
  db.prepare("UPDATE requests SET status = 'approved', notes = COALESCE(?, notes), updated_at = ? WHERE id = ?")
    .run(notes ?? null, now, id);

  // Update booking
  db.prepare("UPDATE bookings SET status = 'approved', updated_at = ? WHERE id = ?")
    .run(now, reqRow.booking_id);

  // Get booking details for notifications
  const booking = db.prepare(`
    SELECT b.*, e.name as equipment_name, e.demand_score
    FROM bookings b JOIN equipment e ON b.equipment_id = e.id
    WHERE b.id = ?
  `).get(reqRow.booking_id) as { student_id: string; equipment_id: string; equipment_name: string; demand_score: number } | undefined;

  if (booking) {
    // Increment demand_score slightly
    const newScore = Math.min(1.0, (booking.demand_score ?? 0.5) + 0.01);
    db.prepare('UPDATE equipment SET demand_score = ? WHERE id = ?').run(newScore, booking.equipment_id);

    // Increment student booking_count
    db.prepare('UPDATE students SET booking_count = booking_count + 1 WHERE id = ?').run(booking.student_id);

    // Notify student
    const notifId = `notif-${uuidv4().slice(0, 8)}`;
    db.prepare(`
      INSERT INTO notifications (id, user_id, user_type, title, message, type, related_id, created_at)
      VALUES (?, ?, 'student', 'Booking Approved', ?, 'booking_approved', ?, ?)
    `).run(notifId, booking.student_id, `Your booking for ${booking.equipment_name} has been approved.`, reqRow.booking_id, now);
  }

  res.json({ id, status: 'approved', booking_id: reqRow.booking_id });
}));

// PUT /api/requests/:id/reject
router.put('/:id/reject', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { notes } = req.body as { notes?: string };
  const now = new Date().toISOString();

  const reqRow = db.prepare('SELECT * FROM requests WHERE id = ?').get(id) as RequestRow | undefined;
  if (!reqRow) { res.status(404).json({ error: 'Request not found' }); return; }

  db.prepare("UPDATE requests SET status = 'rejected', notes = COALESCE(?, notes), updated_at = ? WHERE id = ?")
    .run(notes ?? null, now, id);

  db.prepare("UPDATE bookings SET status = 'rejected', updated_at = ? WHERE id = ?")
    .run(now, reqRow.booking_id);

  // Notify student
  const booking = db.prepare(`
    SELECT b.student_id, e.name as equipment_name FROM bookings b JOIN equipment e ON b.equipment_id = e.id WHERE b.id = ?
  `).get(reqRow.booking_id) as { student_id: string; equipment_name: string } | undefined;

  if (booking) {
    const notifId = `notif-${uuidv4().slice(0, 8)}`;
    db.prepare(`
      INSERT INTO notifications (id, user_id, user_type, title, message, type, related_id, created_at)
      VALUES (?, ?, 'student', 'Booking Rejected', ?, 'booking_rejected', ?, ?)
    `).run(notifId, booking.student_id, `Your booking for ${booking.equipment_name} was rejected. ${notes ?? ''}`.trim(), reqRow.booking_id, now);
  }

  res.json({ id, status: 'rejected', booking_id: reqRow.booking_id });
}));

// PUT /api/requests/:id/suggest
router.put('/:id/suggest', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { suggested_slot, notes } = req.body as { suggested_slot: { start_time: string; end_time: string }; notes?: string };
  const now = new Date().toISOString();

  if (!suggested_slot?.start_time || !suggested_slot?.end_time) {
    res.status(400).json({ error: 'suggested_slot with start_time and end_time is required' });
    return;
  }

  const reqRow = db.prepare('SELECT * FROM requests WHERE id = ?').get(id) as RequestRow | undefined;
  if (!reqRow) { res.status(404).json({ error: 'Request not found' }); return; }

  db.prepare(`
    UPDATE requests SET status = 'suggested', suggested_slot = ?, notes = COALESCE(?, notes), updated_at = ? WHERE id = ?
  `).run(JSON.stringify(suggested_slot), notes ?? null, now, id);

  // Notify student
  const booking = db.prepare(`
    SELECT b.student_id, e.name as equipment_name FROM bookings b JOIN equipment e ON b.equipment_id = e.id WHERE b.id = ?
  `).get(reqRow.booking_id) as { student_id: string; equipment_name: string } | undefined;

  if (booking) {
    const notifId = `notif-${uuidv4().slice(0, 8)}`;
    db.prepare(`
      INSERT INTO notifications (id, user_id, user_type, title, message, type, related_id, created_at)
      VALUES (?, ?, 'student', 'Alternative Slot Suggested', ?, 'alternative_suggested', ?, ?)
    `).run(
      notifId, booking.student_id,
      `Faculty suggested an alternative slot for ${booking.equipment_name}: ${suggested_slot.start_time} – ${suggested_slot.end_time}`,
      reqRow.booking_id, now
    );
  }

  res.json({ id, status: 'suggested', suggested_slot });
}));

export default router;
