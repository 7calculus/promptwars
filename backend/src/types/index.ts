export interface Equipment {
  id: string;
  name: string;
  category: string;
  department: string;
  lab: string;
  description: string;
  specs: Record<string, string | number>;
  status: 'available' | 'in-use' | 'maintenance' | 'reserved';
  hourly_rate: number;
  max_duration: number; // minutes
  requires_approval: boolean;
  image_key?: string;
  demand_score: number;
  created_at: string;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  department: string;
  year: string;
  booking_count: number;
}

export interface Faculty {
  id: string;
  name: string;
  email: string;
  department: string;
  title: string;
}

export interface Project {
  id: string;
  student_id: string;
  title: string;
  description: string;
  department: string;
  deadline: string;
  status: 'active' | 'completed' | 'paused';
  team_members: string[];
  progress: number;
  required_equipment: string[];
  created_at: string;
}

export interface Booking {
  id: string;
  equipment_id: string;
  student_id: string;
  project_id?: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';
  purpose: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  created_at: string;
  updated_at: string;
}

export interface BookingRequest {
  id: string;
  booking_id: string;
  faculty_id?: string;
  status: 'pending' | 'approved' | 'rejected' | 'suggested';
  notes?: string;
  suggested_slot?: { start_time: string; end_time: string };
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  user_type: 'student' | 'faculty';
  title: string;
  message: string;
  type: 'booking_created' | 'booking_approved' | 'booking_rejected' | 'booking_cancelled' | 'request_pending' | 'alternative_suggested' | 'system';
  related_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface TimeSlot {
  start_time: string;
  end_time: string;
  equipment_id?: string;
  equipment_name?: string;
}

export interface Alternative {
  id: string;
  score: number;
  type: 'time_shift' | 'equipment_swap' | 'combined';
  equipment_id: string;
  equipment_name: string;
  start_time: string;
  end_time: string;
  reasons: string[];
  tradeoffs: string[];
  metadata: Record<string, unknown>;
}

export interface SchedulingRequest {
  equipment_id: string;
  student_id: string;
  project_id?: string;
  requested_start: string;
  requested_end: string;
  purpose: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  deadline?: string;
}

export interface AssistantQuery {
  query: string;
  studentId?: string;
}

export interface AssistantResponse {
  intent: string;
  entities: Record<string, unknown>;
  equipment: Equipment[];
  slots: TimeSlot[];
  message: string;
  suggestions: string[];
}

export interface ConflictResponse {
  hasConflict: boolean;
  conflicts: Booking[];
  alternatives: Alternative[];
}

export interface AnalyticsOverview {
  totalEquipment: number;
  available: number;
  inUse: number;
  maintenance: number;
  reserved: number;
  totalBookings: number;
  pendingRequests: number;
  approvalRate: number;
  conflictRate: number;
  avgBookingDuration: number;
  utilizationRate: number;
}
