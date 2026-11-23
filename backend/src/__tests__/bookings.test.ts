import request from 'supertest';
import app from '../index';
import { seedDatabase } from '../database/seed';

describe('Bookings API Integration Tests', () => {
  beforeEach(() => {
    seedDatabase();
  });

  // 1. POST /api/bookings creates booking when slot is free
  test('1. POST /api/bookings creates booking when slot is free', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .send({
        equipment_id: 'eq-002',
        student_id: 'st-001',
        start_time: '2026-11-28T09:00:00',
        end_time: '2026-11-28T11:00:00',
        purpose: 'Deep learning inference experiment',
        priority: 'normal',
      });

    expect(res.status).toBe(201);
    expect(res.body.booking).toBeDefined();
    expect(res.body.booking.equipment_id).toBe('eq-002');
    expect(res.body.booking.status).toBe('approved');
  });

  // 2. POST /api/bookings returns 409 with alternatives when slot is taken
  test('2. POST /api/bookings returns 409 with alternatives when slot is taken', async () => {
    // bk-001 takes eq-001 on 2026-11-23 14:00 to 17:00
    const res = await request(app)
      .post('/api/bookings')
      .send({
        equipment_id: 'eq-001',
        student_id: 'st-004',
        start_time: '2026-11-23T14:00:00',
        end_time: '2026-11-23T17:00:00',
        purpose: 'AI Waste classification model training',
        priority: 'high',
      });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Booking conflict detected');
    expect(res.body.conflicts).toBeDefined();
    expect(res.body.conflicts.length).toBeGreaterThan(0);
    expect(res.body.alternatives).toBeDefined();
    expect(res.body.alternatives.length).toBeGreaterThan(0);
  });

  // 3. POST /api/bookings validates required fields
  test('3. POST /api/bookings validates required fields', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .send({
        student_id: 'st-001',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
    expect(res.body.details).toBeDefined();
  });

  // 4. PUT /api/bookings/:id/cancel changes status to cancelled
  test('4. PUT /api/bookings/:id/cancel changes status to cancelled', async () => {
    // bk-001 is an approved booking
    const res = await request(app)
      .put('/api/bookings/bk-001/cancel');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('cancelled');

    // Verify in GET
    const getRes = await request(app).get('/api/bookings?studentId=st-005');
    const cancelledBooking = getRes.body.bookings.find((b: { id: string }) => b.id === 'bk-001');
    expect(cancelledBooking.status).toBe('cancelled');
  });

  // 5. GET /api/bookings returns filtered results by studentId
  test('5. GET /api/bookings returns filtered results by studentId', async () => {
    const res = await request(app)
      .get('/api/bookings?studentId=st-001');

    expect(res.status).toBe(200);
    expect(res.body.bookings).toBeDefined();
    expect(res.body.bookings.length).toBeGreaterThan(0);
    for (const b of res.body.bookings) {
      expect(b.student_id).toBe('st-001');
    }
  });
});
