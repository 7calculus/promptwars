import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { validateAssistantQuery } from '../middleware/validation';
import { processAssistantQuery } from '../algorithms/assistant';

const router = Router();

// POST /api/assistant/query
router.post('/query', validateAssistantQuery, asyncHandler(async (req: Request, res: Response) => {
  const { query, studentId } = req.body as { query: string; studentId?: string };
  const response = processAssistantQuery(query, studentId);
  res.json(response);
}));

export default router;
