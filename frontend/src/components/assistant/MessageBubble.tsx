import React from 'react';
import { User, Bot, Clock } from 'lucide-react';
import { AssistantMessage } from '../../types';
import EquipmentResult from './EquipmentResult';
import { format } from 'date-fns';

interface MessageBubbleProps {
  message: AssistantMessage;
  onBookEquipment?: (equipmentId: string) => void;
}

export default function MessageBubble({ message, onBookEquipment }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar Icon */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white shadow-xs ${
          isUser
            ? 'bg-indigo-600'
            : 'bg-gradient-to-tr from-violet-600 to-indigo-600'
        }`}
      >
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>

      {/* Bubble Content */}
      <div className={`max-w-[85%] sm:max-w-[75%] space-y-2`}>
        <div
          className={`p-4 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? 'bg-indigo-600 text-white rounded-tr-none'
              : 'bg-white text-slate-800 border border-slate-200/90 shadow-sm rounded-tl-none'
          }`}
        >
          <div className="whitespace-pre-line">{message.content}</div>

          {/* If the message returned recommended equipment */}
          {message.equipment && message.equipment.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
              <p className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                Matching Lab Resources
              </p>
              <div className="space-y-2">
                {message.equipment.map((eq) => (
                  <EquipmentResult
                    key={eq.id}
                    equipment={eq}
                    onBook={() => onBookEquipment?.(eq.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* If available slots are listed */}
          {message.slots && message.slots.length > 0 && (
            <div className="mt-3 pt-2 border-t border-slate-100">
              <p className="text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-1.5">
                Suggested Windows
              </p>
              <div className="flex flex-wrap gap-1.5">
                {message.slots.map((s, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-medium"
                  >
                    <Clock size={12} />
                    {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(s.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <span className={`block text-[10px] text-slate-400 ${isUser ? 'text-right' : 'text-left'} px-1`}>
          {format(new Date(message.timestamp), 'h:mm a')}
        </span>
      </div>
    </div>
  );
}
