import React from 'react';
import { Sparkles } from 'lucide-react';

interface QuickChipsProps {
  onSelect: (prompt: string) => void;
}

const DEFAULT_PROMPTS = [
  'Find available GPU workstations',
  'Recommend equipment for robotics',
  'Resolve my booking conflict',
  'Find slots before my deadline',
  "What's available in CS Lab?",
  'Equipment for computer vision',
];

export default function QuickChips({ onSelect }: QuickChipsProps) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
      <div className="flex items-center text-[10px] font-bold uppercase text-slate-400 gap-1 pl-1 flex-shrink-0">
        <Sparkles size={11} className="text-violet-500" /> Suggestions:
      </div>
      {DEFAULT_PROMPTS.map((prompt) => (
        <button
          key={prompt}
          type="button"
          onClick={() => onSelect(prompt)}
          className="text-xs px-3 py-1.5 rounded-full bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 border border-slate-200/60 whitespace-nowrap transition-colors flex-shrink-0"
        >
          {prompt}
        </button>
      ))}
    </div>
  );
}
