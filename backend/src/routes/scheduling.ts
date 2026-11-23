import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { validateSchedulingRequest } from '../middleware/validation';
import { schedulingEngine } from '../algorithms/scheduler';
import { SchedulingRequest } from '../types';

const router = Router();

// POST /api/scheduling/recommend
router.post('/recommend', validateSchedulingRequest, asyncHandler(async (req: Request, res: Response) => {
  const schedulingRequest = req.body as SchedulingRequest;
  const conflicts = schedulingEngine.findConflicts(
    schedulingRequest.equipment_id,
    schedulingRequest.requested_start,
    schedulingRequest.requested_end
  );

  const alternatives = schedulingEngine.generateAlternatives(schedulingRequest);

  res.json({
    hasConflict: conflicts.length > 0,
    conflicts,
    alternatives,
    recommended: alternatives.length > 0 ? alternatives[0] : null,
  });
}));

// POST /api/scheduling/conflicts
router.post('/conflicts', asyncHandler(async (req: Request, res: Response) => {
  const { equipmentId, startTime, endTime } = req.body as {
    equipmentId: string;
    startTime: string;
    endTime: string;
  };

  if (!equipmentId || !startTime || !endTime) {
    res.status(400).json({ error: 'equipmentId, startTime, and endTime are required' });
    return;
  }

  const conflicts = schedulingEngine.findConflicts(equipmentId, startTime, endTime);
  res.json({
    hasConflict: conflicts.length > 0,
    conflicts,
  });
}));

// GET /api/scheduling/alternatives?equipmentId=&startTime=&endTime=&studentId=&deadline=
router.get('/alternatives', asyncHandler(async (req: Request, res: Response) => {
  const { equipmentId, startTime, endTime, studentId = 'st-001', deadline } = req.query as Record<string, string>;

  if (!equipmentId || !startTime || !endTime) {
    res.status(400).json({ error: 'equipmentId, startTime, and endTime query parameters are required' });
    return;
  }

  const alternatives = schedulingEngine.generateAlternatives({
    equipment_id: equipmentId,
    student_id: studentId,
    requested_start: startTime,
    requested_end: endTime,
    purpose: 'Alternative slot search',
    priority: 'normal',
    deadline,
  });

  res.json({ alternatives });
}));

export default router;
