import React from 'react';

interface AvatarProps {
  initials: string;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

const SIZE_MAP = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-12 h-12 text-base' };
const COLORS = [
  'bg-indigo-500', 'bg-violet-500', 'bg-cyan-500', 'bg-emerald-500',
  'bg-orange-500', 'bg-pink-500', 'bg-teal-500', 'bg-amber-500',
];

export default function Avatar({ initials, size = 'md', color }: AvatarProps) {
  const bg = color || COLORS[initials.charCodeAt(0) % COLORS.length];
  return (
    <div className={`${SIZE_MAP[size]} ${bg} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0`}>
      {initials}
    </div>
  );
}
