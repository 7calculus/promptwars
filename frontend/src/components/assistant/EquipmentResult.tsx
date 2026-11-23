import React from 'react';
import { MapPin, ArrowRight } from 'lucide-react';
import { Equipment } from '../../types';
import StatusBadge from '../common/StatusBadge';

interface EquipmentResultProps {
  equipment: Equipment;
  onBook: () => void;
}

export default function EquipmentResult({ equipment, onBook }: EquipmentResultProps) {
  return (
    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-indigo-300 transition flex items-center justify-between gap-3">
      <div className="overflow-hidden">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-xs text-slate-800 truncate">
            {equipment.name}
          </span>
          <StatusBadge status={equipment.status} />
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
          <span className="flex items-center gap-0.5">
            <MapPin size={11} /> {equipment.lab}
          </span>
          <span>•</span>
          <span>${equipment.hourlyRate}/hr</span>
        </div>
      </div>

      <button
        type="button"
        onClick={onBook}
        className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold flex items-center gap-1 transition flex-shrink-0"
      >
        Book <ArrowRight size={12} />
      </button>
    </div>
  );
}
