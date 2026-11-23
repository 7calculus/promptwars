import React from 'react';
import { AlertTriangle, Sparkles } from 'lucide-react';
import { AlternativeSlot } from '../../types';
import AlternativeCard from './AlternativeCard';

interface ConflictAlertProps {
  message?: string;
  alternatives: AlternativeSlot[];
  onAcceptAlternative: (alt: AlternativeSlot) => void;
  onDismiss?: () => void;
}

export default function ConflictAlert({
  message = 'The requested equipment or time slot has a scheduling conflict with existing bookings.',
  alternatives,
  onAcceptAlternative,
  onDismiss,
}: ConflictAlertProps) {
  return (
    <div className="rounded-2xl border border-orange-200 bg-orange-50/60 p-6 space-y-5">
      {/* Warning Banner */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={22} />
          </div>
          <div>
            <h3 className="text-base font-bold text-orange-950 flex items-center gap-2">
              Scheduling Conflict Detected
            </h3>
            <p className="text-xs text-orange-800 mt-1 leading-relaxed max-w-2xl">
              {message} Our AI scheduling engine evaluated real-time lab workloads, project deadlines, and equipment compatibility to find optimal alternative slots:
            </p>
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-xs font-semibold text-orange-700 hover:text-orange-900 px-3 py-1.5 rounded-lg border border-orange-200 hover:bg-orange-100 transition"
          >
            Adjust Search
          </button>
        )}
      </div>

      {/* Alternative Cards Grid */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={16} className="text-violet-600" />
          <h4 className="text-sm font-bold text-slate-800">
            AI Recommended Alternatives ({alternatives.length})
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {alternatives.map((alt, index) => (
            <AlternativeCard
              key={`${alt.equipmentId}-${alt.startTime}-${index}`}
              alternative={alt}
              isRecommended={index === 0}
              onAccept={onAcceptAlternative}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
