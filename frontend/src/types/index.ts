// ============================================================
// LabLink — TypeScript type definitions
// ============================================================

export type EquipmentStatus = 'available' | 'in-use' | 'maintenance' | 'reserved';
export type BookingStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';
export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'completed';
export type ProjectStatus = 'active' | 'completed' | 'on-hold' | 'cancelled';
export type EquipmentCategory =
  | 'Computing'
  | 'AI-ML'
  | 'Electronics'
  | '3D-Printing'
  | 'Robotics'
  | 'IoT'
  | 'Research'
  | 'Mechanical';

export interface Equipment {
  id: string;
  name: string;
  category: EquipmentCategory;
  department: string;
  lab: string;
  description: string;
  specs: Record<string, string | number>;
  status: EquipmentStatus;
  hourlyRate: number;
  maxDuration: number; // minutes
  requiresApproval: boolean;
  imageKey?: string;
  demandScore: number;
  tags?: string[];
}

export interface Student {
  id: string;
  name: string;
  email: string;
  department: string;
  year: number;
  bookingCount: number;
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
  studentId: string;
  title: string;
  description: string;
  department: string;
  deadline: string;
  status: ProjectStatus;
  teamMembers: string[];
  progress: number;
  requiredEquipment: string[];
  createdAt: string;
}

export interface Booking {
  id: string;
  equipmentId: string;
  equipmentName?: string;
  studentId: string;
  studentName?: string;
  projectId?: string;
  projectTitle?: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  purpose: string;
  priority: 'low' | 'normal' | 'medium' | 'high' | 'critical';
  createdAt: string;
  updatedAt: string;
}

export interface LabRequest {
  id: string;
  bookingId: string;
  booking?: Booking;
  facultyId?: string;
  facultyName?: string;
  status: RequestStatus;
  notes?: string;
  suggestedSlot?: AlternativeSlot;
  studentName?: string;
  studentDepartment?: string;
  priority?: string;
  startTime?: string;
  endTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AlternativeSlot {
  equipmentId: string;
  equipmentName: string;
  startTime: string;
  endTime: string;
  score: number;
  reasons: string[];
  tradeoffs: string[];
  scoreBreakdown: ScoreBreakdown;
}

export interface ScoreBreakdown {
  timeCompatibility: number;
  equipmentMatch: number;
  labProximity: number;
  historicalSuccess: number;
  loadBalance: number;
}

export interface Notification {
  id: string;
  userId: string;
  userType: 'student' | 'faculty' | 'admin';
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  relatedId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface SchedulingRequest {
  studentId: string;
  equipmentId: string;
  preferredStartTime: string;
  duration: number;
  projectId?: string;
  priority: 'low' | 'normal' | 'medium' | 'high' | 'critical';
  deadline?: string;
}

export interface AnalyticsOverview {
  totalEquipment: number;
  availableNow: number;
  activeBookings: number;
  pendingApprovals: number;
  utilizationRate: number;
  avgDuration: number;
  approvalRate: number;
  conflictRate: number;
}

export interface UtilizationItem {
  id: string;
  name: string;
  category: string;
  utilizationRate: number;
  totalBookings: number;
  avgDuration: number;
}

export interface TrendPoint {
  date: string;
  bookings: number;
  approvals: number;
  conflicts: number;
}

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  equipment?: Equipment[];
  slots?: Array<{ startTime: string; endTime: string; equipmentId: string }>;
  timestamp: Date;
}

export interface Persona {
  id: string;
  name: string;
  role: 'student' | 'faculty' | 'admin';
  department: string;
  avatar: string;
  studentId?: string;
  facultyId?: string;
}

export const PERSONAS: Persona[] = [
  {
    id: 'student-alex',
    name: 'Alex Morgan',
    role: 'student',
    department: 'Computer Science',
    avatar: 'AM',
    studentId: 'st-001',
  },
  {
    id: 'faculty-sarah',
    name: 'Dr. Sarah Chen',
    role: 'faculty',
    department: 'Computer Science',
    avatar: 'SC',
    facultyId: 'fac-001',
  },
  {
    id: 'admin',
    name: 'Lab Admin',
    role: 'admin',
    department: 'Administration',
    avatar: 'LA',
  },
];
