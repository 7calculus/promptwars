import React from 'react';

interface FilterChipProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
  count?: number;
}

export default function FilterChip({ label, active = false, onClick, count }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
        active
          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
          : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
      }`}
    >
      {label}
      {count !== undefined && (
        <span className={`text-xs px-1 rounded-full ${active ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>
          {count}
        </span>
      )}
    </button>
  );
}
