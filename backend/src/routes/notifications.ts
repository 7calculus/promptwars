import { Router, Request, Response } from 'express';
import db from '../database/schema';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// GET /api/notifications?userId=&userType=&limit=
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { userId, userType, limit } = req.query as Record<string, string>;
  const maxRows = parseInt(limit ?? '20');

  if (!userId) {
    res.status(400).json({ error: 'userId query param is required' });
    return;
  }

  let sql = 'SELECT * FROM notifications WHERE user_id = ?';
  const params: (string | number)[] = [userId];

  if (userType) { sql += ' AND user_type = ?'; params.push(userType); }

  sql += ' ORDER BY created_at DESC LIMIT ?';
  params.push(maxRows);

  const rows = db.prepare(sql).all(...params) as any[];
  const notifications = rows.map((n) => ({
    ...n,
    userId: n.user_id,
    userType: n.user_type,
    isRead: Boolean(n.is_read),
    is_read: Boolean(n.is_read),
    relatedId: n.related_id,
    createdAt: n.created_at,
  }));
  const unreadCount = (db.prepare('SELECT COUNT(*) as c FROM notifications WHERE user_id = ? AND is_read = 0').get(userId) as { c: number }).c;

  res.json({ notifications, unreadCount, total: notifications.length });
}));

// PUT /api/notifications/:id/read
router.put('/:id/read', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT id FROM notifications WHERE id = ?').get(id);
  if (!existing) { res.status(404).json({ error: 'Notification not found' }); return; }
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(id);
  res.json({ id, is_read: true });
}));

// PUT /api/notifications/read-all
router.put('/read-all', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.body as { userId?: string };
  if (!userId) { res.status(400).json({ error: 'userId is required in request body' }); return; }
  const result = db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(userId);
  res.json({ updated: result.changes });
}));

export default router;
