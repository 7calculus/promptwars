import React from 'react';
import AssistantChat from '../components/assistant/AssistantChat';
import { useAppStore } from '../store/appStore';
import { MOCK_EQUIPMENT } from '../data/mockData';
import StatusBadge from '../components/common/StatusBadge';
import { Sparkles, Zap, ShieldCheck } from 'lucide-react';

export default function AIAssistant() {
  const { dispatch } = useAppStore();

  const handleBook = (equipmentId: string) => {
    dispatch({ type: 'SELECT_EQUIPMENT', payload: equipmentId });
    dispatch({ type: 'SET_PAGE', payload: 'booking' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          LabLink AI Assistant
          <span className="text-xs bg-violet-100 text-violet-700 px-2.5 py-0.5 rounded-full font-bold">
            Autonomous Co-Pilot
          </span>
        </h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Natural language resource discovery, intelligent conflict resolution, and schedule optimization
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Chat (8 cols) */}
        <div className="lg:col-span-8">
          <AssistantChat onBookEquipment={handleBook} />
        </div>

        {/* Context & Capabilities Panel (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-3">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
              <Sparkles size={15} className="text-violet-600" />
              Assistant Capabilities
            </h3>
            <ul className="text-xs text-slate-600 space-y-2">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-600 mt-1.5 flex-shrink-0" />
                <span>Understand complex technical specifications across 8 laboratory categories</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-600 mt-1.5 flex-shrink-0" />
                <span>Multi-factor slot arbitration that solves contention without human intervention</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-600 mt-1.5 flex-shrink-0" />
                <span>Synchronized with academic deadlines to protect critical path research milestones</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
            <h3 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-1.5">
              <Zap size={15} className="text-amber-500" />
              Quick Reservation Status
            </h3>
            <div className="space-y-2">
              {MOCK_EQUIPMENT.slice(0, 4).map((eq) => (
                <div key={eq.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                  <div className="truncate pr-2">
                    <p className="font-semibold text-slate-800 truncate">{eq.name}</p>
                    <p className="text-[11px] text-slate-400">{eq.lab}</p>
                  </div>
                  <StatusBadge status={eq.status} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
