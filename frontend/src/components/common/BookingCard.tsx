import React from 'react';
import { Calendar, Clock, MapPin, User, AlertCircle } from 'lucide-react';
import { Booking } from '../../types';
import StatusBadge from './StatusBadge';
import { format } from 'date-fns';

interface BookingCardProps {
  booking: Booking;
  onCancel?: (bookingId: string) => void;
  onView?: (booking: Booking) => void;
}

export default function BookingCard({ booking, onCancel, onView }: BookingCardProps) {
  const startDate = new Date(booking.startTime);
  const endDate = new Date(booking.endTime);

  const formattedDate = format(startDate, 'MMM d, yyyy');
  const formattedTime = `${format(startDate, 'h:mm a')} - ${format(endDate, 'h:mm a')}`;

  const priorityColors = {
    low: 'text-slate-500 bg-slate-50',
    medium: 'text-blue-600 bg-blue-50',
    high: 'text-orange-600 bg-orange-50',
    critical: 'text-red-600 bg-red-50',
  };

  return (
    <div 
      onClick={() => onView?.(booking)}
      className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer flex flex-col justify-between"
    >
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${priorityColors[booking.priority] || priorityColors.medium}`}>
            {booking.priority} priority
          </span>
          <StatusBadge status={booking.status} />
        </div>

        <h4 className="font-semibold text-slate-800 line-clamp-1">
          {booking.equipmentName || 'Equipment'}
        </h4>

        {booking.projectTitle && (
          <p className="text-xs font-medium text-indigo-600 mt-0.5 line-clamp-1">
            Proj: {booking.projectTitle}
          </p>
        )}

        <div className="mt-3 space-y-1.5 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Calendar size={13} className="text-slate-400" />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={13} className="text-slate-400" />
            <span>{formattedTime}</span>
          </div>
          {booking.studentName && (
            <div className="flex items-center gap-1.5">
              <User size={13} className="text-slate-400" />
              <span>{booking.studentName}</span>
            </div>
          )}
        </div>

        {booking.purpose && (
          <p className="mt-3 text-xs text-slate-600 bg-slate-50 p-2 rounded-lg line-clamp-2">
            "{booking.purpose}"
          </p>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[11px] text-slate-400">
          ID: {booking.id.slice(0, 8)}
        </span>

        {booking.status === 'pending' && onCancel && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCancel(booking.id);
            }}
            className="text-xs font-medium text-red-600 hover:text-red-700 hover:underline"
          >
            Cancel Request
          </button>
        )}
      </div>
    </div>
  );
}
