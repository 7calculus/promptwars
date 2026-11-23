import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  details?: unknown;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode ?? 500;
  const isServerError = statusCode >= 500;
  const message = isServerError ? 'Internal Server Error' : (err.message ?? 'Request failed');

  // Keep implementation details in server logs, never in public API responses.
  console.error(`[ERROR] ${statusCode} — ${err.message ?? 'Unknown error'}`, err.stack ?? '');
  res.status(statusCode).json({
    error: message,
    ...(!isServerError && err.details !== undefined ? { details: err.details } : {}),
  });
}

export function notFound(req: Request, _res: Response, next: NextFunction): void {
  const err: AppError = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  err.statusCode = 404;
  next(err);
}

export function asyncHandler<T extends Request = Request>(
  fn: (req: T, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: T, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
