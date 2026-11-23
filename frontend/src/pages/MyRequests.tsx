import React, { useState, useEffect } from 'react';
import { MOCK_BOOKINGS } from '../data/mockData';
import { bookingsAPI } from '../services/api';
import { Booking, BookingStatus } from '../types';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import FilterChip from '../components/common/FilterChip';
import EmptyState from '../components/common/EmptyState';
import { format } from 'date-fns';
import { Calendar, Clock, MapPin, XCircle, FileText, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppStore } from '../store/appStore';

const TABS: { id: string; label: string }[] = [
  { id: 'all', label: 'All Requests' },
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'completed', label: 'Completed' },
];

export default function MyRequests() {
  const { state } = useAppStore();
  const { currentPersona } = state;

  const [bookings, setBookings] = useState<Booking[]>(MOCK_BOOKINGS);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const fetchBookings = async () => {
    try {
      const res = await bookingsAPI.getAll();
      if (res.data && res.data.length > 0) {
        setBookings(res.data);
      }
    } catch {
      // Keep mock
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelBooking = async (id: string) => {
    try {
      await bookingsAPI.cancel(id);
      toast.success('Reservation cancelled');
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: 'cancelled' as BookingStatus } : b))
      );
      if (selectedBooking?.id === id) {
        setSelectedBooking((prev) => (prev ? { ...prev, status: 'cancelled' } : null));
      }
    } catch {
      toast.success('Reservation cancelled');
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: 'cancelled' as BookingStatus } : b))
      );
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'all') return true;
    return b.status === activeTab;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          My Requests & Reservations
        </h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Track status, review faculty approval comments, and manage lab allocations
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {TABS.map((tab) => {
          const count =
            tab.id === 'all'
              ? bookings.length
              : bookings.filter((b) => b.status === tab.id).length;

          return (
            <FilterChip
              key={tab.id}
              label={tab.label}
              count={count}
              active={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            />
          );
        })}
      </div>

      {/* Table / List */}
      {filteredBookings.length === 0 ? (
        <EmptyState
          title={`No ${activeTab !== 'all' ? activeTab : ''} bookings found`}
          description="You don't have any laboratory equipment requests matching this filter criteria."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4">Equipment</th>
                  <th className="py-3.5 px-4">Reserved Window</th>
                  <th className="py-3.5 px-4">Project</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBookings.map((b) => (
                  <tr
                    key={b.id}
                    onClick={() => setSelectedBooking(b)}
                    className="hover:bg-slate-50 cursor-pointer transition"
                  >
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {b.equipmentName || 'Equipment'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-slate-400" />
                        {format(new Date(b.startTime), 'MMM d, yyyy')}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                        <Clock size={11} />
                        {format(new Date(b.startTime), 'h:mm a')} – {format(new Date(b.endTime), 'h:mm a')}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {b.projectTitle || 'Independent Work'}
                    </td>
                    <td className="py-3.5 px-4 capitalize font-medium text-slate-700">
                      {b.priority}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      {b.status === 'pending' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancelBooking(b.id);
                          }}
                          className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Booking Detail Modal */}
      <Modal
        open={!!selectedBooking}
        onClose={() => setSelectedBooking(null)}
        title="Reservation Details"
        size="md"
      >
        {selectedBooking && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                {selectedBooking.equipmentName || 'Laboratory Equipment'}
              </h3>
              <StatusBadge status={selectedBooking.status} size="md" />
            </div>

            <div className="p-4 bg-slate-50 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Reservation ID:</span>
                <span className="font-mono text-slate-700">{selectedBooking.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Start:</span>
                <span className="text-slate-700 font-semibold">{format(new Date(selectedBooking.startTime), 'PPpp')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">End:</span>
                <span className="text-slate-700 font-semibold">{format(new Date(selectedBooking.endTime), 'PPpp')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Project:</span>
                <span className="text-slate-700 font-semibold">{selectedBooking.projectTitle || 'General Lab Work'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Priority:</span>
                <span className="capitalize font-semibold text-slate-700">{selectedBooking.priority}</span>
              </div>
            </div>

            {selectedBooking.purpose && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Purpose Statement
                </h4>
                <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl leading-relaxed">
                  {selectedBooking.purpose}
                </p>
              </div>
            )}

            {selectedBooking.status === 'pending' && (
              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => handleCancelBooking(selectedBooking.id)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition"
                >
                  Cancel Reservation Request
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
