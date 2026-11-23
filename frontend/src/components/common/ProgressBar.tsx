import React from 'react';

interface ProgressBarProps {
  value: number; // 0-100
  color?: string;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

export default function ProgressBar({ value, color = 'bg-indigo-500', size = 'sm', showLabel = false }: ProgressBarProps) {
  const h = size === 'sm' ? 'h-1.5' : 'h-2.5';
  return (
    <div className="flex items-center gap-2 w-full">
      <div className={`flex-1 bg-slate-100 rounded-full ${h} overflow-hidden`}>
        <div
          className={`${h} ${color} rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-slate-600 w-8 text-right">{value}%</span>
      )}
    </div>
  );
}
