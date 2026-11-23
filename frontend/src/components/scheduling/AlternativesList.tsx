import React from 'react';
import { AlternativeSlot } from '../../types';
import AlternativeCard from '../booking/AlternativeCard';
import { Layers } from 'lucide-react';

interface AlternativesListProps {
  alternatives: AlternativeSlot[];
  onAccept: (alt: AlternativeSlot) => void;
}

export default function AlternativesList({ alternatives, onAccept }: AlternativesListProps) {
  if (!alternatives || alternatives.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Layers size={18} className="text-violet-600" />
        <h3 className="font-bold text-slate-800 text-sm">
          Comparative Analysis of Top 3 Recommended Slots
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {alternatives.slice(0, 3).map((alt, index) => (
          <AlternativeCard
            key={`${alt.equipmentId}-${index}`}
            alternative={alt}
            isRecommended={index === 0}
            onAccept={onAccept}
          />
        ))}
      </div>
    </div>
  );
}
