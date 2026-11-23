import React from 'react';
import { format, addDays, startOfToday, isSameDay } from 'date-fns';
import { Clock, Calendar as CalendarIcon, Check } from 'lucide-react';

interface BookingCalendarProps {
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
  selectedSlot: string | null;
  onSelectSlot: (slot: string) => void;
  unavailableSlots?: string[];
}

const TIME_SLOTS = [
  '08:00 - 10:00',
  '10:00 - 12:00',
  '12:00 - 14:00',
  '14:00 - 16:00',
  '16:00 - 18:00',
  '18:00 - 20:00',
];

export default function BookingCalendar({
  selectedDate,
  onSelectDate,
  selectedSlot,
  onSelectSlot,
  unavailableSlots = ['12:00 - 14:00'],
}: BookingCalendarProps) {
  const today = startOfToday();
  const next7Days = Array.from({ length: 7 }, (_, i) => addDays(today, i));

  return (
    <div className="space-y-4">
      {/* Date Picker Bar */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
          Select Date
        </label>
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {next7Days.map((day) => {
            const isSelected = isSameDay(day, selectedDate);
            const isToday = isSameDay(day, today);

            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => onSelectDate(day)}
                className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center gap-0.5 ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-700 font-bold ring-2 ring-indigo-200'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                }`}
              >
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  {format(day, 'EEE')}
                </span>
                <span className="text-lg font-black">{format(day, 'd')}</span>
                {isToday && (
                  <span className="text-[9px] bg-slate-100 text-slate-600 px-1 rounded font-semibold">
                    Today
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Time Slot Picker Grid */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center justify-between">
          <span>Available Time Slots</span>
          <span className="text-[11px] font-normal text-slate-400">2-hour reservation blocks</span>
        </label>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {TIME_SLOTS.map((slot) => {
            const isSelected = selectedSlot === slot;
            const isUnavailable = unavailableSlots.includes(slot);

            return (
              <button
                key={slot}
                type="button"
                disabled={isUnavailable}
                onClick={() => onSelectSlot(slot)}
                className={`py-2.5 px-3 rounded-xl text-xs font-semibold border flex items-center justify-between transition ${
                  isUnavailable
                    ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed opacity-60 line-through'
                    : isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Clock size={13} className={isSelected ? 'text-white' : 'text-slate-400'} />
                  {slot}
                </span>
                {isSelected && <Check size={14} />}
                {isUnavailable && <span className="text-[10px] text-slate-400">Booked</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
