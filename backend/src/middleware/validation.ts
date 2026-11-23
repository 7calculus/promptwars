import { body, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export function handleValidationErrors(req: Request, res: Response, next: NextFunction): void {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ error: 'Validation failed', details: errors.array() });
    return;
  }
  next();
}

export const validateBooking = [
  body('equipment_id').isString().trim().notEmpty().isLength({ max: 100 }).withMessage('equipment_id is required'),
  body('student_id').isString().trim().notEmpty().isLength({ max: 100 }).withMessage('student_id is required'),
  body('start_time').isString().notEmpty().isISO8601({ strict: true }).withMessage('start_time must be a valid ISO 8601 datetime'),
  body('end_time').isString().notEmpty().isISO8601({ strict: true }).withMessage('end_time must be a valid ISO 8601 datetime'),
  body('purpose').isString().trim().notEmpty().isLength({ max: 1000 }).withMessage('purpose is required'),
  body('priority').optional().isIn(['low', 'normal', 'high', 'critical']).withMessage('priority must be low|normal|high|critical'),
  handleValidationErrors,
];

export const validateProject = [
  body('student_id').isString().trim().notEmpty().isLength({ max: 100 }).withMessage('student_id is required'),
  body('title').notEmpty().withMessage('title is required'),
  body('department').notEmpty().withMessage('department is required'),
  body('deadline').notEmpty().isISO8601().withMessage('deadline must be a valid ISO 8601 date'),
  handleValidationErrors,
];

export const validateSchedulingRequest = [
  body('equipment_id').isString().trim().notEmpty().isLength({ max: 100 }).withMessage('equipment_id is required'),
  body('student_id').isString().trim().notEmpty().isLength({ max: 100 }).withMessage('student_id is required'),
  body('requested_start').notEmpty().isISO8601().withMessage('requested_start must be valid ISO 8601'),
  body('requested_end').notEmpty().isISO8601().withMessage('requested_end must be valid ISO 8601'),
  body('purpose').isString().trim().notEmpty().isLength({ max: 1000 }).withMessage('purpose is required'),
  handleValidationErrors,
];

export const validateAssistantQuery = [
  body('query').notEmpty().withMessage('query is required'),
  handleValidationErrors,
];

export const paginationQuery = [
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt(),
];
