import { SchedulingEngine } from '../algorithms/scheduler';
import { seedDatabase } from '../database/seed';
import db from '../database/schema';

describe('SchedulingEngine', () => {
  let engine: SchedulingEngine;

  beforeAll(() => {
    seedDatabase();
    engine = new SchedulingEngine();
  });

  afterAll(() => {
    // clean up or keep as needed
  });

  // 1. No conflict when slot is free
  test('1. No conflict when slot is free', () => {
    // There is no booking on eq-002 on 2026-11-23 00:00 to 02:00
    const conflicts = engine.findConflicts('eq-002', '2026-11-23T00:00:00', '2026-11-23T02:00:00');
    expect(conflicts.length).toBe(0);
  });

  // 2. Conflict detected when slot overlaps approved booking
  test('2. Conflict detected when slot overlaps approved booking', () => {
    // bk-001 is eq-001 on 2026-11-23 14:00 to 17:00
    const conflicts = engine.findConflicts('eq-001', '2026-11-23T15:00:00', '2026-11-23T16:00:00');
    expect(conflicts.length).toBeGreaterThan(0);
    expect(conflicts[0].equipment_id).toBe('eq-001');
  });

  // 3. Conflict NOT detected for cancelled/rejected bookings
  test('3. Conflict NOT detected for cancelled/rejected bookings', () => {
    // Insert a cancelled booking on eq-005
    db.prepare(`
      INSERT INTO bookings (id, equipment_id, student_id, start_time, end_time, status, purpose, priority)
      VALUES ('bk-cancelled-test', 'eq-005', 'st-001', '2026-11-23T10:00:00', '2026-11-23T12:00:00', 'cancelled', 'test', 'normal')
    `).run();

    const conflicts = engine.findConflicts('eq-005', '2026-11-23T10:30:00', '2026-11-23T11:30:00');
    expect(conflicts.length).toBe(0);
  });

  // 4. Alternative generation returns exactly 3 options
  test('4. Alternative generation returns exactly 3 options', () => {
    const alternatives = engine.generateAlternatives({
      equipment_id: 'eq-001',
      student_id: 'st-004',
      requested_start: '2026-11-23T14:00:00',
      requested_end: '2026-11-23T17:00:00',
      purpose: 'Deep learning training',
      priority: 'high',
      deadline: '2026-12-01T00:00:00',
    });
    expect(alternatives.length).toBe(3);
  });

  // 5. Alternatives are sorted by score descending
  test('5. Alternatives are sorted by score descending', () => {
    const alternatives = engine.generateAlternatives({
      equipment_id: 'eq-001',
      student_id: 'st-004',
      requested_start: '2026-11-23T14:00:00',
      requested_end: '2026-11-23T17:00:00',
      purpose: 'Deep learning training',
      priority: 'high',
      deadline: '2026-12-01T00:00:00',
    });

    for (let i = 0; i < alternatives.length - 1; i++) {
      expect(alternatives[i].score).toBeGreaterThanOrEqual(alternatives[i + 1].score);
    }
  });

  // 6. Deadline feasibility score = 1.0 when slot ends 24h before deadline
  test('6. Deadline feasibility score = 1.0 when slot ends 24h before deadline', () => {
    const slotEnd = '2026-11-24T12:00:00Z';
    const deadline = '2026-11-25T15:00:00Z'; // 27 hours later (> 24h)
    const score = engine.calculateDeadlineFeasibility(slotEnd, deadline);
    expect(score).toBe(1.0);
  });

  // 7. Deadline feasibility score = 0.0 when slot ends after deadline
  test('7. Deadline feasibility score = 0.0 when slot ends after deadline', () => {
    const slotEnd = '2026-11-26T12:00:00Z';
    const deadline = '2026-11-25T12:00:00Z'; // slot ends 24h after deadline
    const score = engine.calculateDeadlineFeasibility(slotEnd, deadline);
    expect(score).toBe(0.0);
  });

  // 8. Fairness score higher for student with fewer bookings
  test('8. Fairness score higher for student with fewer bookings', () => {
    // st-006 has 1 booking, st-010 has 8 bookings
    const scoreFew = engine.calculateFairnessScore('st-006');
    const scoreMany = engine.calculateFairnessScore('st-010');
    expect(scoreFew).toBeGreaterThan(scoreMany);
  });

  // 9. Utilization score higher for equipment with lower demand_score
  test('9. Utilization score higher for equipment with lower demand_score', () => {
    // eq-015 demand_score 0.35, eq-001 demand_score 0.92
    const scoreLowDemand = engine.calculateUtilizationScore('eq-015');
    const scoreHighDemand = engine.calculateUtilizationScore('eq-001');
    expect(scoreLowDemand).toBeGreaterThan(scoreHighDemand);
  });

  // 10. Equipment compatibility: same equipment = 1.0, same category = 0.7
  test('10. Equipment compatibility: same equipment = 1.0, same category = 0.7', () => {
    const request = {
      equipment_id: 'eq-001',
      student_id: 'st-001',
      requested_start: '2026-11-24T10:00:00',
      requested_end: '2026-11-24T12:00:00',
      purpose: 'test',
      priority: 'normal' as const,
    };

    const sameAlt = engine.scoreAlternative({
      equipment_id: 'eq-001',
      equipment_name: 'NVIDIA RTX 4090 GPU Workstation',
      equipment_category: 'Computing',
      start_time: '2026-11-24T14:00:00',
      end_time: '2026-11-24T16:00:00',
      type: 'time_shift',
    }, request);

    const diffAlt = engine.scoreAlternative({
      equipment_id: 'eq-002',
      equipment_name: 'NVIDIA RTX 3080 GPU Workstation',
      equipment_category: 'Computing',
      start_time: '2026-11-24T10:00:00',
      end_time: '2026-11-24T12:00:00',
      type: 'equipment_swap',
    }, request);

    expect(sameAlt.metadata.equipmentCompatibility).toBe(1.0);
    expect(diffAlt.metadata.equipmentCompatibility).toBe(0.7);
  });
});
