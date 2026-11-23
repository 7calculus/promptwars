import React from 'react';
import { ScoreBreakdown as IScoreBreakdown } from '../../types';
import ProgressBar from '../common/ProgressBar';

interface ScoreBreakdownProps {
  score: number;
  breakdown: IScoreBreakdown;
}

export default function ScoreBreakdown({ score, breakdown }: ScoreBreakdownProps) {
  const metrics = [
    { label: 'Time Window Fit', value: breakdown.timeCompatibility, color: 'bg-emerald-500' },
    { label: 'Equipment Specs Match', value: breakdown.equipmentMatch, color: 'bg-indigo-500' },
    { label: 'Lab Proximity', value: breakdown.labProximity, color: 'bg-cyan-500' },
    { label: 'Historical Reliability', value: breakdown.historicalSuccess, color: 'bg-violet-500' },
    { label: 'Cluster Load Balance', value: breakdown.loadBalance, color: 'bg-amber-500' },
  ];

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Compatibility Score
        </span>
        <span className="text-lg font-black text-violet-600">{Math.round(score)}%</span>
      </div>

      <div className="space-y-2">
        {metrics.map((m) => (
          <div key={m.label}>
            <div className="flex justify-between text-xs text-slate-600 mb-0.5">
              <span>{m.label}</span>
              <span className="font-semibold">{m.value}%</span>
            </div>
            <ProgressBar value={m.value} color={m.color} />
          </div>
        ))}
      </div>
    </div>
  );
}
