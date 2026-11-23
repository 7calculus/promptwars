import React, { useState } from 'react';
import { Equipment, Project } from '../../types';
import BookingCalendar from './BookingCalendar';
import { Sparkles, Calendar, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface BookingFormData {
  equipmentId: string;
  projectId: string;
  date: Date;
  timeSlot: string;
  purpose: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface BookingFormProps {
  equipmentList: Equipment[];
  projectsList: Project[];
  initialEquipmentId?: string;
  onSubmit: (data: BookingFormData) => void;
  isLoading?: boolean;
}

export default function BookingForm({
  equipmentList,
  projectsList,
  initialEquipmentId = '',
  onSubmit,
  isLoading = false,
}: BookingFormProps) {
  const [equipmentId, setEquipmentId] = useState(initialEquipmentId || (equipmentList[0]?.id ?? ''));
  const [projectId, setProjectId] = useState(projectsList[0]?.id ?? '');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<string | null>('10:00 - 12:00');
  const [purpose, setPurpose] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');

  const selectedEquipment = equipmentList.find((e) => e.id === equipmentId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;
    onSubmit({
      equipmentId,
      projectId,
      date: selectedDate,
      timeSlot: selectedSlot,
      purpose,
      priority,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Step 1: Equipment Selection */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Select Lab Equipment
          </label>
          <select
            value={equipmentId}
            onChange={(e) => setEquipmentId(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 font-medium focus:ring-2 focus:ring-indigo-300 focus:outline-none"
          >
            {equipmentList.map((eq) => (
              <option key={eq.id} value={eq.id}>
                {eq.name} — {eq.lab} (${eq.hourlyRate}/hr) {eq.status !== 'available' ? `[${eq.status}]` : ''}
              </option>
            ))}
          </select>
        </div>

        {selectedEquipment && (
          <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-center justify-between text-xs">
            <div>
              <span className="font-semibold text-indigo-900">{selectedEquipment.name}</span>
              <p className="text-indigo-700/80 mt-0.5">{selectedEquipment.lab} • {selectedEquipment.category}</p>
            </div>
            {selectedEquipment.requiresApproval && (
              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-semibold text-[11px]">
                Requires Faculty Approval
              </span>
            )}
          </div>
        )}
      </div>

      {/* Step 2: Date & Slot Picker */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <BookingCalendar
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          selectedSlot={selectedSlot}
          onSelectSlot={setSelectedSlot}
        />
      </div>

      {/* Step 3: Project & Purpose */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Associated Research Project
          </label>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 font-medium focus:ring-2 focus:ring-indigo-300 focus:outline-none"
          >
            <option value="">No Project / Independent Work</option>
            {projectsList.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} ({p.department})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Priority Level
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 font-medium focus:ring-2 focus:ring-indigo-300 focus:outline-none"
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
              <option value="critical">Critical (Imminent Deadline)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Work Session Purpose
            </label>
            <input
              type="text"
              placeholder="e.g. Model inference benchmark or prototyping"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 font-medium focus:ring-2 focus:ring-indigo-300 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading || !selectedSlot}
        className="w-full py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-bold text-sm shadow-md shadow-indigo-300 transition duration-150 flex items-center justify-center gap-2 disabled:opacity-50"
      >
        <Sparkles size={18} />
        {isLoading ? 'Verifying Conflict-Free Slot...' : 'Confirm Lab Reservation'}
      </button>
    </form>
  );
}
