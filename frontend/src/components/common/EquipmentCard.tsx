import React from 'react';
import { MapPin, Zap } from 'lucide-react';
import { Equipment } from '../../types';
import StatusBadge from './StatusBadge';
import { CATEGORY_GRADIENTS } from '../../data/mockData';

interface EquipmentCardProps {
  equipment: Equipment;
  onSelect?: (equipment: Equipment) => void;
  onBook?: (equipment: Equipment) => void;
  viewMode?: 'grid' | 'list';
}

export default function EquipmentCard({
  equipment,
  onSelect,
  onBook,
  viewMode = 'grid',
}: EquipmentCardProps) {
  const gradient = CATEGORY_GRADIENTS[equipment.category] || 'from-indigo-500 to-purple-600';

  if (viewMode === 'list') {
    return (
      <div 
        onClick={() => onSelect?.(equipment)}
        className="bg-white rounded-xl border border-slate-200/80 p-4 hover:shadow-md transition duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer group"
      >
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-xs shadow-sm flex-shrink-0`}>
            {equipment.category.slice(0, 3).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">
                {equipment.name}
              </h3>
              <StatusBadge status={equipment.status} />
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
              <span className="font-medium text-slate-600">{equipment.category}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin size={12} /> {equipment.lab}
              </span>
              <span>•</span>
              <span>${equipment.hourlyRate}/hr</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
          <div className="text-right hidden md:block">
            <div className="flex items-center gap-1 justify-end text-xs text-slate-500">
              <Zap size={12} className="text-amber-500 fill-amber-500" />
              <span>Demand: {equipment.demandScore}%</span>
            </div>
            <div className="w-20 bg-slate-100 h-1.5 rounded-full mt-1 overflow-hidden">
              <div 
                className="bg-indigo-600 h-full rounded-full" 
                style={{ width: `${equipment.demandScore}%` }} 
              />
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onBook?.(equipment);
            }}
            disabled={equipment.status === 'maintenance'}
            className="px-4 py-1.5 rounded-lg text-sm font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {equipment.requiresApproval ? 'Request Access' : 'Book Now'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => onSelect?.(equipment)}
      className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200 flex flex-col group cursor-pointer"
    >
      {/* Card Header Gradient Placeholder */}
      <div className={`h-28 bg-gradient-to-br ${gradient} p-4 flex flex-col justify-between relative overflow-hidden`}>
        <div className="absolute right-0 top-0 bottom-0 opacity-15 pointer-events-none flex items-center justify-center pr-2 font-black text-6xl text-white select-none">
          {equipment.category.charAt(0)}
        </div>
        <div className="flex justify-between items-start z-10">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-md">
            {equipment.category}
          </span>
          <StatusBadge status={equipment.status} />
        </div>
        <div className="z-10 flex items-center gap-1 text-white/90 text-xs">
          <MapPin size={12} />
          <span className="truncate">{equipment.lab}</span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-semibold text-slate-800 group-hover:text-indigo-600 transition line-clamp-1">
            {equipment.name}
          </h3>
          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
            {equipment.description}
          </p>

          <div className="mt-3 flex flex-wrap gap-1">
            {equipment.tags?.slice(0, 3).map((tag) => (
              <span key={tag} className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-medium">
                #{tag}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Demand Score</span>
            <span className="font-semibold text-slate-700">{equipment.demandScore}%</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-indigo-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${equipment.demandScore}%` }}
            />
          </div>

          <div className="flex items-center justify-between mt-1">
            <span className="text-sm font-bold text-slate-800">
              ${equipment.hourlyRate} <span className="text-xs font-normal text-slate-500">/hr</span>
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onBook?.(equipment);
              }}
              disabled={equipment.status === 'maintenance'}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-indigo-200"
            >
              {equipment.requiresApproval ? 'Request Access' : 'Book Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
