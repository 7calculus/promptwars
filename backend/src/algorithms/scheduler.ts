import db from '../database/schema';
import { Equipment, Booking, Alternative, SchedulingRequest, TimeSlot } from '../types';

const WEIGHTS = {
  deadlineFeasibility: 0.30,
  equipmentCompatibility: 0.25,
  availability: 0.20,
  fairness: 0.15,
  utilization: 0.10,
};

interface RawAlternative {
  equipment_id: string;
  equipment_name: string;
  equipment_category: string;
  start_time: string;
  end_time: string;
  type: 'time_shift' | 'equipment_swap' | 'combined';
}

export class SchedulingEngine {
  /**
   * Find conflicting bookings (approved or pending) for the given equipment & time window.
   */
  findConflicts(equipmentId: string, startTime: string, endTime: string): Booking[] {
    const rows = db.prepare(`
      SELECT * FROM bookings
      WHERE equipment_id = ?
        AND status IN ('approved', 'pending')
        AND start_time < ?
        AND end_time > ?
    `).all(equipmentId, endTime, startTime) as Booking[];
    return rows;
  }

  /**
   * Generate up to 3 scored alternatives when a conflict is detected.
   */
  generateAlternatives(request: SchedulingRequest): Alternative[] {
    const duration = this.durationMinutes(request.requested_start, request.requested_end);
    const raws: RawAlternative[] = [];

    // 1. Time-shift alternatives for the same equipment
    const timeSlots = this.findNextAvailableSlots(
      request.equipment_id,
      duration,
      request.requested_start,
      4
    );
    for (const slot of timeSlots) {
      raws.push({
        equipment_id: request.equipment_id,
        equipment_name: this.getEquipmentName(request.equipment_id),
        equipment_category: this.getEquipmentCategory(request.equipment_id),
        start_time: slot.start_time,
        end_time: slot.end_time,
        type: 'time_shift',
      });
    }

    // 2. Equivalent equipment alternatives at the originally requested time
    const equivalents = this.findEquivalentEquipment(request.equipment_id);
    for (const eq of equivalents.slice(0, 3)) {
      const conflicts = this.findConflicts(eq.id, request.requested_start, request.requested_end);
      if (conflicts.length === 0) {
        raws.push({
          equipment_id: eq.id,
          equipment_name: eq.name,
          equipment_category: eq.category,
          start_time: request.requested_start,
          end_time: request.requested_end,
          type: 'equipment_swap',
        });
      }
    }

    // Score every raw alternative
    const scored = raws.map((raw, idx) =>
      this.scoreAlternative(raw, request, idx)
    );

    // Sort descending by score, pick top 3
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 3);
  }

  scoreAlternative(raw: RawAlternative, request: SchedulingRequest, idx: number = 0): Alternative {
    const deadlineFeasibility = request.deadline
      ? this.calculateDeadlineFeasibility(raw.end_time, request.deadline)
      : 0.8;

    const equipmentCompatibility =
      raw.equipment_id === request.equipment_id ? 1.0 : 0.7;

    // Availability: earlier is better (within 7 days)
    const hoursUntil = this.hoursApart(request.requested_start, raw.start_time);
    const availability = Math.max(0, 1.0 - hoursUntil / (7 * 24));

    const fairness = this.calculateFairnessScore(request.student_id);
    const utilization = this.calculateUtilizationScore(raw.equipment_id);

    const score =
      WEIGHTS.deadlineFeasibility * deadlineFeasibility +
      WEIGHTS.equipmentCompatibility * equipmentCompatibility +
      WEIGHTS.availability * availability +
      WEIGHTS.fairness * fairness +
      WEIGHTS.utilization * utilization;

    const reasons: string[] = [];
    const tradeoffs: string[] = [];

    if (raw.type === 'time_shift') {
      reasons.push(`Same ${this.getEquipmentName(request.equipment_id)} available at ${this.formatTime(raw.start_time)}`);
      reasons.push('No equipment learning curve — identical hardware');
      if (hoursUntil > 24) tradeoffs.push(`${Math.round(hoursUntil)}h delay from original requested time`);
      if (request.deadline && deadlineFeasibility < 0.5) tradeoffs.push('May be tight relative to your project deadline');
    } else {
      reasons.push(`${raw.equipment_name} is equivalent and available at your requested time`);
      reasons.push(`Same category (${raw.equipment_category}) — compatible capabilities`);
      tradeoffs.push('Different hardware may require minor setup adjustments');
      const specsNote = this.getSpecsDiff(request.equipment_id, raw.equipment_id);
      if (specsNote) tradeoffs.push(specsNote);
    }

    if (fairness > 0.7) reasons.push('High fairness score — you have relatively few bookings');
    if (utilization > 0.6) reasons.push('Equipment is typically underutilized — good availability window');

    return {
      id: `alt-${idx + 1}`,
      score: Math.round(score * 100) / 100,
      type: raw.type,
      equipment_id: raw.equipment_id,
      equipment_name: raw.equipment_name,
      start_time: raw.start_time,
      end_time: raw.end_time,
      reasons,
      tradeoffs,
      metadata: {
        deadlineFeasibility,
        equipmentCompatibility,
        availability,
        fairness,
        utilization,
        weights: WEIGHTS,
      },
    };
  }

  findNextAvailableSlots(
    equipmentId: string,
    durationMinutes: number,
    afterTime: string,
    limit: number = 3
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const start = new Date(afterTime);
    // Clamp to now if afterTime is in the past
    const now = new Date();
    const cursor = start > now ? new Date(start) : new Date(now);

    // Round up to next hour
    cursor.setMinutes(0, 0, 0);
    cursor.setHours(cursor.getHours() + 1);

    const deadline = new Date(cursor.getTime() + 7 * 24 * 60 * 60 * 1000);

    while (cursor < deadline && slots.length < limit) {
      // Skip outside lab hours (8am–10pm)
      if (cursor.getHours() < 8 || cursor.getHours() >= 22) {
        cursor.setHours(8, 0, 0, 0);
        cursor.setDate(cursor.getDate() + (cursor.getHours() >= 22 ? 1 : 0));
        continue;
      }

      const slotEnd = new Date(cursor.getTime() + durationMinutes * 60 * 1000);
      if (slotEnd.getHours() > 22 || (slotEnd.getHours() === 22 && slotEnd.getMinutes() > 0)) {
        cursor.setHours(8, 0, 0, 0);
        cursor.setDate(cursor.getDate() + 1);
        continue;
      }

      const conflicts = this.findConflicts(
        equipmentId,
        cursor.toISOString(),
        slotEnd.toISOString()
      );

      if (conflicts.length === 0) {
        slots.push({
          start_time: cursor.toISOString(),
          end_time: slotEnd.toISOString(),
          equipment_id: equipmentId,
        });
        // Jump past this slot to find next non-overlapping one
        cursor.setTime(slotEnd.getTime() + 30 * 60 * 1000);
      } else {
        // Jump past the latest conflicting booking's end time
        const latestEnd = conflicts.reduce((max, c) =>
          new Date(c.end_time) > new Date(max) ? c.end_time : max,
          cursor.toISOString()
        );
        cursor.setTime(new Date(latestEnd).getTime() + 15 * 60 * 1000);
      }
    }

    return slots;
  }

  findEquivalentEquipment(equipmentId: string): Equipment[] {
    const eq = db.prepare('SELECT * FROM equipment WHERE id = ?').get(equipmentId) as Equipment | undefined;
    if (!eq) return [];

    const rows = db.prepare(`
      SELECT * FROM equipment
      WHERE category = ?
        AND id != ?
        AND status != 'maintenance'
      ORDER BY demand_score ASC
    `).all(eq.category, equipmentId) as Equipment[];

    return rows.map(r => ({
      ...r,
      specs: typeof r.specs === 'string' ? JSON.parse(r.specs) : r.specs,
      requires_approval: Boolean(r.requires_approval),
    }));
  }

  calculateFairnessScore(studentId: string): number {
    const student = db.prepare('SELECT booking_count FROM students WHERE id = ?').get(studentId) as { booking_count: number } | undefined;
    if (!student) return 0.5;
    // Fewer bookings → higher fairness score
    const count = student.booking_count;
    return Math.max(0, 1 - count / 20);
  }

  calculateUtilizationScore(equipmentId: string): number {
    const eq = db.prepare('SELECT demand_score FROM equipment WHERE id = ?').get(equipmentId) as { demand_score: number } | undefined;
    if (!eq) return 0.5;
    // Lower demand_score → higher utilization score (less utilized)
    return 1 - eq.demand_score;
  }

  calculateDeadlineFeasibility(slotEnd: string, deadline: string): number {
    const end = new Date(slotEnd).getTime();
    const dl = new Date(deadline).getTime();
    const diff = dl - end; // ms remaining after slot
    if (diff <= 0) return 0; // slot ends after deadline
    const hoursBefore = diff / (1000 * 60 * 60);
    // 1.0 if 24+ hours before deadline, linearly decreasing
    return Math.min(1.0, hoursBefore / 24);
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private durationMinutes(start: string, end: string): number {
    return (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60);
  }

  private hoursApart(a: string, b: string): number {
    return Math.abs(new Date(b).getTime() - new Date(a).getTime()) / (1000 * 60 * 60);
  }

  private getEquipmentName(id: string): string {
    const eq = db.prepare('SELECT name FROM equipment WHERE id = ?').get(id) as { name: string } | undefined;
    return eq?.name ?? id;
  }

  private getEquipmentCategory(id: string): string {
    const eq = db.prepare('SELECT category FROM equipment WHERE id = ?').get(id) as { category: string } | undefined;
    return eq?.category ?? '';
  }

  private formatTime(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleString('en-US', { weekday:'short', month:'short', day:'numeric', hour:'numeric', minute:'2-digit', hour12:true });
  }

  private getSpecsDiff(originalId: string, altId: string): string {
    const orig = db.prepare('SELECT specs FROM equipment WHERE id = ?').get(originalId) as { specs: string } | undefined;
    const alt  = db.prepare('SELECT specs FROM equipment WHERE id = ?').get(altId)      as { specs: string } | undefined;
    if (!orig || !alt) return '';
    try {
      const os = JSON.parse(orig.specs) as Record<string, string>;
      const as_ = JSON.parse(alt.specs) as Record<string, string>;
      const diffs: string[] = [];
      for (const k of Object.keys(os)) {
        if (as_[k] && as_[k] !== os[k]) diffs.push(`${k}: ${os[k]} → ${as_[k]}`);
      }
      return diffs.length ? `Spec differences: ${diffs.slice(0,2).join(', ')}` : '';
    } catch {
      return '';
    }
  }
}

export const schedulingEngine = new SchedulingEngine();
