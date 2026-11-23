import React from 'react';
import { Sparkles, Calendar, Clock, MapPin, CheckCircle, AlertTriangle } from 'lucide-react';
import { AlternativeSlot } from '../../types';
import ProgressBar from '../common/ProgressBar';
import { format } from 'date-fns';

interface AlternativeCardProps {
  alternative: AlternativeSlot;
  isRecommended?: boolean;
  onAccept: (alt: AlternativeSlot) => void;
}

export default function AlternativeCard({
  alternative,
  isRecommended = false,
  onAccept,
}: AlternativeCardProps) {
  const startDate = new Date(alternative.startTime);
  const endDate = new Date(alternative.endTime);

  const formattedDate = format(startDate, 'EEE, MMM d');
  const formattedTime = `${format(startDate, 'h:mm a')} – ${format(endDate, 'h:mm a')}`;

  const breakdown = alternative.scoreBreakdown || {
    timeCompatibility: 90,
    equipmentMatch: 95,
    labProximity: 85,
    historicalSuccess: 80,
    loadBalance: 88,
  };

  return (
    <div
      className={`rounded-2xl p-5 border transition-all duration-200 flex flex-col justify-between relative bg-white ${
        isRecommended
          ? 'border-violet-400 ring-2 ring-violet-200 shadow-md'
          : 'border-slate-200/90 hover:border-slate-300 shadow-sm'
      }`}
    >
      {isRecommended && (
        <div className="absolute -top-3 left-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
          <Sparkles size={11} />
          Best AI Match
        </div>
      )}

      <div>
        <div className="flex items-start justify-between gap-3 mt-1">
          <div>
            <h4 className="font-bold text-slate-800 text-base leading-tight">
              {alternative.equipmentName}
            </h4>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Calendar size={13} className="text-slate-400" />
                {formattedDate}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock size={13} className="text-slate-400" />
                {formattedTime}
              </span>
            </div>
          </div>

          {/* Overall Match Score */}
          <div className="text-right flex-shrink-0">
            <div className="text-2xl font-black text-violet-700 leading-none">
              {Math.round(alternative.score)}%
            </div>
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
              Match Score
            </span>
          </div>
        </div>

        {/* Score Breakdown (5 Mini Bars with Labels) */}
        <div className="mt-4 p-3 bg-slate-50 rounded-xl space-y-2">
          <p className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
            Match Breakdown
          </p>
          <div className="space-y-1.5 text-xs">
            <div>
              <div className="flex justify-between text-[11px] text-slate-600 mb-0.5">
                <span>Time Fit</span>
                <span className="font-semibold">{breakdown.timeCompatibility}%</span>
              </div>
              <ProgressBar value={breakdown.timeCompatibility} color="bg-emerald-500" />
            </div>
            <div>
              <div className="flex justify-between text-[11px] text-slate-600 mb-0.5">
                <span>Spec Match</span>
                <span className="font-semibold">{breakdown.equipmentMatch}%</span>
              </div>
              <ProgressBar value={breakdown.equipmentMatch} color="bg-indigo-500" />
            </div>
            <div>
              <div className="flex justify-between text-[11px] text-slate-600 mb-0.5">
                <span>Lab Proximity</span>
                <span className="font-semibold">{breakdown.labProximity}%</span>
              </div>
              <ProgressBar value={breakdown.labProximity} color="bg-cyan-500" />
            </div>
            <div>
              <div className="flex justify-between text-[11px] text-slate-600 mb-0.5">
                <span>Success Rate</span>
                <span className="font-semibold">{breakdown.historicalSuccess}%</span>
              </div>
              <ProgressBar value={breakdown.historicalSuccess} color="bg-violet-500" />
            </div>
            <div>
              <div className="flex justify-between text-[11px] text-slate-600 mb-0.5">
                <span>Load Balance</span>
                <span className="font-semibold">{breakdown.loadBalance}%</span>
              </div>
              <ProgressBar value={breakdown.loadBalance} color="bg-amber-500" />
            </div>
          </div>
        </div>

        {/* Reasons Bullet Points */}
        {alternative.reasons && alternative.reasons.length > 0 && (
          <div className="mt-3 space-y-1">
            {alternative.reasons.map((reason, idx) => (
              <div key={idx} className="flex items-start gap-1.5 text-xs text-slate-700">
                <CheckCircle size={13} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                <span>{reason}</span>
              </div>
            ))}
          </div>
        )}

        {/* Tradeoffs */}
        {alternative.tradeoffs && alternative.tradeoffs.length > 0 && (
          <div className="mt-2.5 p-2 bg-amber-50 rounded-lg space-y-1">
            {alternative.tradeoffs.map((t, idx) => (
              <div key={idx} className="flex items-start gap-1.5 text-[11px] text-amber-800">
                <AlertTriangle size={12} className="text-amber-500 mt-0.5 flex-shrink-0" />
                <span>{t}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Button */}
      <div className="mt-5 pt-3 border-t border-slate-100">
        <button
          onClick={() => onAccept(alternative)}
          className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition duration-150 flex items-center justify-center gap-1.5 ${
            isRecommended
              ? 'bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-200'
              : 'bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700'
          }`}
        >
          Accept Recommendation
        </button>
      </div>
    </div>
  );
}
