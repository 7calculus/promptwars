import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import { errorHandler, notFound } from './middleware/errorHandler';
import { seedDatabase } from './database/seed';

import equipmentRoutes from './routes/equipment';
import bookingsRoutes from './routes/bookings';
import requestsRoutes from './routes/requests';
import analyticsRoutes from './routes/analytics';
import notificationsRoutes from './routes/notifications';
import schedulingRoutes from './routes/scheduling';
import assistantRoutes from './routes/assistant';
import projectsRoutes from './routes/projects';

const app = express();

app.disable('x-powered-by');
app.use(helmet({ crossOriginResourcePolicy: false }));

// In production, explicitly list the deployed frontend origin(s), comma-separated.
// Same-origin requests do not need CORS; local Vite origins remain available in development.
const allowedOrigins = new Set(
  (process.env.FRONTEND_ORIGIN ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
);
if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.add('http://localhost:5173');
  allowedOrigins.add('http://127.0.0.1:5173');
}
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error('Origin not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 600,
}));
app.use(express.json({ limit: '100kb', strict: true }));

// Normalization middleware: maps camelCase to snake_case for body fields
app.use((req, _res, next) => {
  if (req.body && typeof req.body === 'object') {
    if (req.body.equipmentId && !req.body.equipment_id) req.body.equipment_id = req.body.equipmentId;
    if (req.body.studentId && !req.body.student_id) req.body.student_id = req.body.studentId;
    if (req.body.projectId && !req.body.project_id) req.body.project_id = req.body.projectId;
    if (req.body.startTime && !req.body.start_time) req.body.start_time = req.body.startTime;
    if (req.body.endTime && !req.body.end_time) req.body.end_time = req.body.endTime;
    if (req.body.requestedStart && !req.body.requested_start) req.body.requested_start = req.body.requestedStart;
    if (req.body.requestedEnd && !req.body.requested_end) req.body.requested_end = req.body.requestedEnd;
    if (req.body.preferredStartTime && !req.body.requested_start) {
      req.body.requested_start = req.body.preferredStartTime;
      const durationMin = req.body.duration || 120;
      const start = new Date(req.body.preferredStartTime);
      const end = new Date(start.getTime() + durationMin * 60 * 1000);
      req.body.requested_end = end.toISOString();
    }
    // Frontend labels "medium"; the database/validation use "normal"
    if (req.body.priority === 'medium') req.body.priority = 'normal';
    // Approvals: accept `reason` as an alias of `notes`, and `slot` as `suggested_slot`
    if (req.body.reason && !req.body.notes) req.body.notes = req.body.reason;
    if (req.body.slot && !req.body.suggested_slot) {
      const sl = req.body.slot;
      req.body.suggested_slot = { start_time: sl.start_time ?? sl.startTime, end_time: sl.end_time ?? sl.endTime };
    }
    if (!req.body.purpose && req.path.includes('/bookings')) req.body.purpose = 'Laboratory resource reservation';
    if (!req.body.purpose && req.path.includes('/recommend')) req.body.purpose = 'Laboratory scheduling request';
  }
  next();
});

// Health Check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'LabLink Backend API',
    timestamp: new Date().toISOString(),
  });
});

// Demo Data Reset Endpoint
app.post('/api/reset-demo', (_req, res) => {
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_DEMO_RESET !== 'true') {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  try {
    seedDatabase();
    res.json({
      success: true,
      message: 'Demo database reset and seeded successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: 'Failed to reset demo data', details: message });
  }
});

// Mount Routes
app.use('/api/equipment', equipmentRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/requests', requestsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/scheduling', schedulingRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/projects', projectsRoutes);

// Serve frontend static files if available
const frontendDist = path.resolve(__dirname, '../../frontend/dist');
const publicDir = path.resolve(__dirname, '../public');
const staticPath = fs.existsSync(frontendDist) ? frontendDist : (fs.existsSync(publicDir) ? publicDir : null);

if (staticPath) {
  app.use(express.static(staticPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
      return next();
    }
    res.sendFile(path.join(staticPath, 'index.html'));
  });
}

// Catch-all 404 & error handler
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3001;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 LabLink Backend API listening on http://localhost:${PORT}`);
  });
}

export default app;
