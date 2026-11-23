import React from 'react';
import { BookingStatus, EquipmentStatus, RequestStatus } from '../../types';

const STATUS_STYLES: Record<string, string> = {
  available: 'bg-emerald-100 text-emerald-700',
  'in-use': 'bg-orange-100 text-orange-700',
  maintenance: 'bg-red-100 text-red-700',
  reserved: 'bg-blue-100 text-blue-700',
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  cancelled: 'bg-slate-100 text-slate-500',
  completed: 'bg-slate-100 text-slate-600',
  active: 'bg-cyan-100 text-cyan-700',
  'on-hold': 'bg-yellow-100 text-yellow-700',
};

const STATUS_LABELS: Record<string, string> = {
  'in-use': 'In Use',
  'on-hold': 'On Hold',
  'AI-ML': 'AI/ML',
  '3D-Printing': '3D Printing',
};

interface StatusBadgeProps {
  status: BookingStatus | EquipmentStatus | RequestStatus | string;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const style = STATUS_STYLES[status] || 'bg-slate-100 text-slate-600';
  const label = STATUS_LABELS[status] || status.charAt(0).toUpperCase() + status.slice(1);
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClass} ${style}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  );
}
