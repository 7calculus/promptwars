import db from '../database/schema';
import { Equipment, TimeSlot, AssistantResponse } from '../types';

interface ParsedIntent {
  intent: string;
  entities: Record<string, unknown>;
}

function parseIntent(query: string): ParsedIntent {
  const q = query.toLowerCase();

  // FIND_BY_SPEC — e.g. "16 GB VRAM", "24GB GPU memory"
  const specMatch = q.match(/(\d+)\s*(gb|mb|mhz|ghz|cores?|channels?|ghz|msa|tops?)\s+(vram|ram|memory|storage|bandwidth|channels?|clock)/i)
                 ?? q.match(/(vram|ram|memory)\s+(\d+)\s*(gb|mb)/i);
  if (specMatch) {
    return {
      intent: 'FIND_BY_SPEC',
      entities: { spec: specMatch[3] ?? specMatch[1], value: parseInt(specMatch[1] ?? specMatch[2]), unit: specMatch[2] ?? specMatch[3] },
    };
  }

  // SCHEDULE_BEFORE_DEADLINE — "deadline in 3 days", "due in 2 days"
  const deadlineMatch = q.match(/deadline\s+in\s+(\d+)\s+days?/i) ?? q.match(/due\s+in\s+(\d+)\s+days?/i);
  if (deadlineMatch) {
    return { intent: 'SCHEDULE_BEFORE_DEADLINE', entities: { daysLeft: parseInt(deadlineMatch[1]) } };
  }

  // RESOLVE_CONFLICT — "conflict at 2 PM", "booking conflict"
  if (q.includes('conflict')) {
    const timeMatch = q.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    return { intent: 'RESOLVE_CONFLICT', entities: timeMatch ? { time: timeMatch[0] } : {} };
  }

  // CHECK_AVAILABILITY — "available ... this week/today/tomorrow"
  const availMatch = q.match(/available\s+(.*?)\s+(this week|today|tomorrow|this month)/i)
                  ?? q.match(/(available|free)\s+(3d printer|gpu|lidar|oscilloscope|fpga)/i);
  if (availMatch || q.includes('available') || q.includes('free slot')) {
    const timeframe = q.includes('today') ? 'today'
                    : q.includes('tomorrow') ? 'tomorrow'
                    : q.includes('this week') ? 'this week'
                    : 'upcoming';
    const catMatch = q.match(/3d print|gpu|lidar|oscilloscope|fpga|robot|iot|vr|hpc|jetson|arduino/i);
    return { intent: 'CHECK_AVAILABILITY', entities: { timeframe, category: catMatch?.[0] ?? null } };
  }

  // RECOMMEND_FOR_PROJECT — "equipment for robotics project"
  const projectMatch = q.match(/(?:equipment|tools?)\s+for\s+(\w+)\s+project/i)
                    ?? q.match(/(?:working on|doing|building)\s+(.*?)\s+project/i);
  if (projectMatch) {
    return { intent: 'RECOMMEND_FOR_PROJECT', entities: { projectType: projectMatch[1] } };
  }

  // FIND_EQUIPMENT — "find GPU", "show me 3d printers", "list oscilloscopes"
  const categoryMap: Record<string, string> = {
    gpu: 'Computing', '3d print': '3D Printing', robot: 'Robotics',
    fpga: 'Electronics', oscilloscope: 'Electronics', arduino: 'Electronics',
    raspberry: 'IoT', jetson: 'AI/ML', realsense: 'AI/ML', lidar: 'Robotics',
    vr: 'Computing', hpc: 'Computing', 'spectrum analy': 'Research', thermal: 'Research',
  };
  for (const [kw, cat] of Object.entries(categoryMap)) {
    if (q.includes(kw)) {
      return { intent: 'FIND_EQUIPMENT', entities: { category: cat, keyword: kw } };
    }
  }

  // Generic search
  return { intent: 'GENERAL_SEARCH', entities: { query: query.trim() } };
}

function searchEquipment(intent: string, entities: Record<string, unknown>): Equipment[] {
  let rows: Equipment[] = [];

  switch (intent) {
    case 'FIND_EQUIPMENT':
    case 'CHECK_AVAILABILITY': {
      const cat = entities.category as string | undefined;
      const kw  = (entities.keyword as string | undefined) ?? '';
      rows = db.prepare(`
        SELECT * FROM equipment
        WHERE (? IS NULL OR category = ?)
          AND (name LIKE ? OR description LIKE ? OR specs LIKE ?)
        ORDER BY demand_score DESC
        LIMIT 10
      `).all(cat ?? null, cat ?? null, `%${kw}%`, `%${kw}%`, `%${kw}%`) as Equipment[];
      if (rows.length === 0 && cat) {
        rows = db.prepare('SELECT * FROM equipment WHERE category = ? ORDER BY demand_score DESC LIMIT 5').all(cat) as Equipment[];
      }
      break;
    }
    case 'FIND_BY_SPEC': {
      const spec = (entities.spec as string | '').toLowerCase();
      const val  = entities.value as number;
      rows = db.prepare(`
        SELECT * FROM equipment WHERE specs LIKE ? LIMIT 10
      `).all(`%${spec}%`) as Equipment[];
      // Filter by value if numeric
      if (val) {
        rows = rows.filter(eq => {
          try {
            const specs = JSON.parse(eq.specs as unknown as string) as Record<string, string>;
            return Object.values(specs).some(v => parseInt(v) >= val);
          } catch { return false; }
        });
      }
      break;
    }
    case 'RECOMMEND_FOR_PROJECT': {
      const pt = ((entities.projectType as string) ?? '').toLowerCase();
      const catMap: Record<string, string[]> = {
        robotics: ['Robotics', 'AI/ML'], drone: ['AI/ML', 'Robotics', 'Computing'],
        iot: ['IoT', 'Electronics'], ai: ['Computing', 'AI/ML'], ml: ['Computing', 'AI/ML'],
        embedded: ['Electronics', 'IoT'], '3d': ['3D Printing'],
      };
      const cats = Object.entries(catMap).find(([k]) => pt.includes(k))?.[1] ?? ['Computing'];
      rows = db.prepare(`SELECT * FROM equipment WHERE category IN (${cats.map(() => '?').join(',')}) ORDER BY demand_score DESC LIMIT 6`).all(...cats) as Equipment[];
      break;
    }
    case 'RESOLVE_CONFLICT':
    case 'SCHEDULE_BEFORE_DEADLINE':
    default: {
      rows = db.prepare('SELECT * FROM equipment WHERE status = ? ORDER BY demand_score DESC LIMIT 5').all('available') as Equipment[];
    }
  }

  return rows.map(r => ({
    ...r,
    specs: typeof r.specs === 'string' ? JSON.parse(r.specs as unknown as string) : r.specs,
    requires_approval: Boolean(r.requires_approval),
  }));
}

function buildMessage(intent: string, entities: Record<string, unknown>, equipment: Equipment[]): string {
  const count = equipment.length;
  switch (intent) {
    case 'FIND_EQUIPMENT':
      return count > 0
        ? `Found ${count} ${entities.category ?? ''} equipment item${count !== 1 ? 's' : ''}. ${equipment[0].name} is the most in-demand option.`
        : `No equipment found matching your query. Try browsing all categories.`;
    case 'CHECK_AVAILABILITY':
      return count > 0
        ? `Showing availability for ${entities.timeframe ?? 'upcoming period'}. ${equipment.filter(e => e.status === 'available').length} of ${count} items currently available.`
        : `No equipment found for that category. Try a different search term.`;
    case 'FIND_BY_SPEC':
      return count > 0
        ? `Found ${count} equipment item${count !== 1 ? 's' : ''} with ${entities.spec} ≥ ${entities.value}${entities.unit}.`
        : `No equipment matches ${entities.spec} = ${entities.value}${entities.unit}. Consider lowering the threshold.`;
    case 'RECOMMEND_FOR_PROJECT':
      return count > 0
        ? `Recommended equipment for your ${entities.projectType} project. These are the top options available.`
        : `No equipment recommendations found for that project type.`;
    case 'RESOLVE_CONFLICT':
      return 'I can help resolve your booking conflict. Use the scheduling engine to find alternative time slots or equivalent equipment.';
    case 'SCHEDULE_BEFORE_DEADLINE':
      return `With ${entities.daysLeft} days until your deadline, here are available equipment slots that fit your timeline.`;
    default:
      return count > 0
        ? `Here are ${count} equipment items that might match your query.`
        : `I didn't find specific equipment for that query. Try terms like "find GPU", "available 3D printer", or "equipment for robotics project".`;
  }
}

function buildSuggestions(intent: string, equipment: Equipment[]): string[] {
  const base: string[] = [
    'Show available GPU workstations',
    'Find 3D printers available this week',
    'Equipment for robotics project',
    'Check LiDAR availability',
    'Show all Computing equipment',
  ];

  switch (intent) {
    case 'FIND_EQUIPMENT':
      return ['Check availability for today', 'Find similar equipment', 'Book this equipment', ...base.slice(0, 2)];
    case 'CHECK_AVAILABILITY':
      return ['Book the first available slot', 'Find equivalent equipment', 'Show my bookings', ...base.slice(0, 2)];
    case 'RECOMMEND_FOR_PROJECT':
      return ['Book recommended equipment', 'Show project timeline', 'Check conflicts', ...base.slice(0, 2)];
    default:
      return base.slice(0, 5);
  }
}

export function processAssistantQuery(query: string, _studentId?: string): AssistantResponse {
  const { intent, entities } = parseIntent(query);
  const equipment = searchEquipment(intent, entities);
  const message = buildMessage(intent, entities, equipment);
  const suggestions = buildSuggestions(intent, equipment);

  return {
    intent,
    entities,
    equipment,
    slots: [],
    message,
    suggestions,
  };
}
