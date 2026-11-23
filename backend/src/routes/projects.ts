import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database/schema';
import { asyncHandler } from '../middleware/errorHandler';
import { validateProject } from '../middleware/validation';
import { Project } from '../types';

const router = Router();

// GET /api/projects?studentId=
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { studentId } = req.query as { studentId?: string };

  let sql = 'SELECT * FROM projects';
  const params: string[] = [];

  if (studentId) {
    sql += ' WHERE student_id = ?';
    params.push(studentId);
  }

  sql += ' ORDER BY deadline ASC';

  const rows = db.prepare(sql).all(...params) as (Project & { team_members: string; required_equipment: string })[];
  const projects = rows.map((p: any) => {
    const tm = typeof p.team_members === 'string' ? JSON.parse(p.team_members) : p.team_members;
    const re = typeof p.required_equipment === 'string' ? JSON.parse(p.required_equipment) : p.required_equipment;
    return {
      ...p,
      studentId: p.student_id,
      teamMembers: tm,
      team_members: tm,
      requiredEquipment: re,
      required_equipment: re,
      createdAt: p.created_at,
    };
  });

  res.json({ projects, total: projects.length });
}));

// POST /api/projects
router.post('/', validateProject, asyncHandler(async (req: Request, res: Response) => {
  const {
    student_id,
    title,
    description = '',
    department,
    deadline,
    team_members = [],
    required_equipment = [],
  } = req.body;

  const id = `proj-${uuidv4().slice(0, 8)}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO projects (id, student_id, title, description, department, deadline, status, team_members, progress, required_equipment, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 'active', ?, 0.0, ?, ?)
  `).run(
    id,
    student_id,
    title,
    description,
    department,
    deadline,
    JSON.stringify(team_members),
    JSON.stringify(required_equipment),
    now
  );

  const created = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as Project & { team_members: string; required_equipment: string };
  res.status(201).json({
    ...created,
    team_members: JSON.parse(created.team_members),
    required_equipment: JSON.parse(created.required_equipment),
  });
}));

// GET /api/projects/:id
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id) as (Project & { team_members: string; required_equipment: string }) | undefined;
  if (!row) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  res.json({
    ...row,
    team_members: typeof row.team_members === 'string' ? JSON.parse(row.team_members) : row.team_members,
    required_equipment: typeof row.required_equipment === 'string' ? JSON.parse(row.required_equipment) : row.required_equipment,
  });
}));

// PUT /api/projects/:id
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as Project | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  const { title, description, department, deadline, status, progress, team_members, required_equipment } = req.body;

  db.prepare(`
    UPDATE projects SET
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      department = COALESCE(?, department),
      deadline = COALESCE(?, deadline),
      status = COALESCE(?, status),
      progress = COALESCE(?, progress),
      team_members = COALESCE(?, team_members),
      required_equipment = COALESCE(?, required_equipment)
    WHERE id = ?
  `).run(
    title ?? null,
    description ?? null,
    department ?? null,
    deadline ?? null,
    status ?? null,
    progress ?? null,
    team_members ? JSON.stringify(team_members) : null,
    required_equipment ? JSON.stringify(required_equipment) : null,
    id
  );

  const updated = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as Project & { team_members: string; required_equipment: string };
  res.json({
    ...updated,
    team_members: JSON.parse(updated.team_members),
    required_equipment: JSON.parse(updated.required_equipment),
  });
}));

// POST /api/projects/:id/equipment
router.post('/:id/equipment', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { equipment_id } = req.body as { equipment_id: string };

  if (!equipment_id) {
    res.status(400).json({ error: 'equipment_id is required' });
    return;
  }

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as (Project & { required_equipment: string }) | undefined;
  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  const currentEquipment: string[] = typeof project.required_equipment === 'string'
    ? JSON.parse(project.required_equipment)
    : project.required_equipment;

  if (!currentEquipment.includes(equipment_id)) {
    currentEquipment.push(equipment_id);
    db.prepare('UPDATE projects SET required_equipment = ? WHERE id = ?').run(JSON.stringify(currentEquipment), id);
  }

  res.json({ id, required_equipment: currentEquipment });
}));

export default router;
