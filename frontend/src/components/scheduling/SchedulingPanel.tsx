import React, { useState } from 'react';
import { Sparkles, Calendar, Layers } from 'lucide-react';
import { AlternativeSlot } from '../../types';
import AlternativesList from './AlternativesList';
import { schedulingAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function SchedulingPanel() {
  const [loading, setLoading] = useState(false);
  const [alternatives, setAlternatives] = useState<AlternativeSlot[]>([]);

  const handleTestRecommendation = async () => {
    try {
      setLoading(true);
      const res = await schedulingAPI.recommend({
        studentId: 'st-001',
        equipmentId: 'eq-001',
        preferredStartTime: new Date(Date.now() + 86400000).toISOString(),
        duration: 120,
        priority: 'high',
      });
      if (res.data && res.data.alternatives) {
        setAlternatives(res.data.alternatives);
      }
      toast.success('Generated optimal scheduling recommendations!');
    } catch (e) {
      toast.error('Unable to fetch recommendations right now');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-6 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Sparkles size={22} className="text-violet-200" />
            Autonomous Scheduling Engine
          </h2>
          <p className="text-xs text-violet-100 mt-1 max-w-xl">
            Our multi-objective optimization algorithm cross-references real-time lab workloads, course deadlines, and maintenance windows to recommend zero-conflict reservation alternatives.
          </p>
        </div>
        <button
          onClick={handleTestRecommendation}
          disabled={loading}
          className="px-4 py-2.5 rounded-xl bg-white text-indigo-700 font-bold text-xs hover:bg-violet-50 transition shadow-sm active:scale-95 disabled:opacity-60 flex-shrink-0"
        >
          {loading ? 'Evaluating...' : 'Run Simulation'}
        </button>
      </div>

      {alternatives.length > 0 && (
        <AlternativesList
          alternatives={alternatives}
          onAccept={(alt) => toast.success(`Selected alternative for ${alt.equipmentName}`)}
        />
      )}
    </div>
  );
}
