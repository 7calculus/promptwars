import React from 'react';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function HeatMap() {
  // Generate representative campus lab usage distribution
  const getIntensity = (dayIdx: number, hour: number) => {
    // Weekdays higher
    if (dayIdx < 5) {
      if (hour >= 10 && hour <= 12) return 0.95; // peak morning
      if (hour >= 14 && hour <= 17) return 0.85; // peak afternoon
      if (hour >= 9 && hour <= 19) return 0.65;
      if (hour >= 20 && hour <= 23) return 0.35;
      return 0.05;
    }
    // Weekends lower
    if (hour >= 12 && hour <= 18) return 0.45;
    return 0.02;
  };

  const getColor = (intensity: number) => {
    if (intensity < 0.1) return 'bg-slate-100 text-transparent';
    if (intensity < 0.3) return 'bg-indigo-100 text-indigo-900';
    if (intensity < 0.6) return 'bg-indigo-300 text-indigo-900';
    if (intensity < 0.8) return 'bg-indigo-500 text-white';
    return 'bg-indigo-700 text-white font-bold';
  };

  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="min-w-[640px]">
        {/* Hour Header */}
        <div className="flex items-center text-[10px] text-slate-400 mb-2">
          <div className="w-12 text-right pr-2">Day</div>
          <div className="grid grid-cols-24 flex-1 gap-1">
            {HOURS.map((h) => (
              <div key={h} className="text-center font-mono">
                {h % 3 === 0 ? `${h}h` : ''}
              </div>
            ))}
          </div>
        </div>

        {/* Days and Heat Cells */}
        <div className="space-y-1.5">
          {DAYS.map((day, dIdx) => (
            <div key={day} className="flex items-center">
              <span className="w-12 text-xs font-semibold text-slate-600 text-right pr-2">
                {day}
              </span>
              <div className="grid grid-cols-24 flex-1 gap-1">
                {HOURS.map((h) => {
                  const val = getIntensity(dIdx, h);
                  const colorClass = getColor(val);
                  return (
                    <div
                      key={h}
                      title={`${day} @ ${h}:00 — ${Math.round(val * 100)}% Utilization`}
                      className={`h-6 rounded-md ${colorClass} transition-all duration-150 hover:scale-125 hover:z-10 cursor-pointer shadow-xs`}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-end gap-2 mt-4 text-xs text-slate-500">
          <span>Less Busy</span>
          <div className="flex gap-1">
            <span className="w-3.5 h-3.5 rounded bg-slate-100" />
            <span className="w-3.5 h-3.5 rounded bg-indigo-100" />
            <span className="w-3.5 h-3.5 rounded bg-indigo-300" />
            <span className="w-3.5 h-3.5 rounded bg-indigo-500" />
            <span className="w-3.5 h-3.5 rounded bg-indigo-700" />
          </div>
          <span>Peak Congestion</span>
        </div>
      </div>
    </div>
  );
}
