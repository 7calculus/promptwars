import React, { useState, useEffect } from 'react';
import {
  Activity,
  Clock,
  CheckCircle,
  AlertOctagon,
  Sparkles,
  TrendingUp,
  BarChart2,
  Calendar,
} from 'lucide-react';
import BarChart from '../components/charts/BarChart';
import LineChart from '../components/charts/LineChart';
import DonutChart from '../components/charts/DonutChart';
import HeatMap from '../components/charts/HeatMap';
import { ANALYTICS_OVERVIEW, BOOKING_TRENDS, MOCK_EQUIPMENT } from '../data/mockData';
import { analyticsAPI } from '../services/api';

export default function Analytics() {
  const [overview, setOverview] = useState(ANALYTICS_OVERVIEW);
  const [trends, setTrends] = useState(BOOKING_TRENDS);

  useEffect(() => {
    analyticsAPI.getOverview().then((res) => {
      if (res.data) setOverview(res.data);
    }).catch(() => {});

    analyticsAPI.getTrends().then((res) => {
      if (res.data && res.data.length > 0) setTrends(res.data);
    }).catch(() => {});
  }, []);

  const metricCards = [
    {
      title: 'Overall Utilization Rate',
      value: `${overview.utilizationRate}%`,
      subtitle: '+4.2% vs previous week',
      icon: Activity,
      color: 'bg-indigo-50 text-indigo-600',
    },
    {
      title: 'Avg Session Duration',
      value: `${overview.avgDuration} hrs`,
      subtitle: 'Consistent with target 4h cap',
      icon: Clock,
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      title: 'Faculty Approval Rate',
      value: `${overview.approvalRate}%`,
      subtitle: 'Avg response time: 2.1h',
      icon: CheckCircle,
      color: 'bg-cyan-50 text-cyan-600',
    },
    {
      title: 'Conflict Resolution Rate',
      value: '94%',
      subtitle: `${overview.conflictRate}% initial conflict frequency`,
      icon: AlertOctagon,
      color: 'bg-orange-50 text-orange-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Resource & Facility Analytics
        </h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Real-time metrics on equipment contention, weekly temporal patterns, and load balancing
        </p>
      </div>

      {/* Row 1: 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {card.title}
                </span>
                <div className={`w-8 h-8 rounded-lg ${card.color} flex items-center justify-center`}>
                  <Icon size={18} />
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mt-2">{card.value}</h3>
              <p className="text-[11px] font-medium text-slate-500 mt-1">{card.subtitle}</p>
            </div>
          );
        })}
      </div>

      {/* Row 2: Equipment Utilization Bar Chart */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-800">
              Equipment Contention & Utilization Distribution
            </h3>
            <p className="text-xs text-slate-400">
              Ranked by total booked hours against weekly lab availability
            </p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg">
            Active 20 Assets
          </span>
        </div>
        <BarChart height={340} layout="vertical" />
      </div>

      {/* Row 3: Booking Trends Line Chart + Department Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800">Booking & Approval Trajectory</h3>
              <p className="text-xs text-slate-400">7-day volume comparison</p>
            </div>
          </div>
          <LineChart data={trends} height={260} />
        </div>

        <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs">
          <h3 className="text-base font-bold text-slate-800 mb-1">Status Proportions</h3>
          <p className="text-xs text-slate-400 mb-4">Current grid state</p>
          <DonutChart height={200} />
        </div>
      </div>

      {/* Row 4: Peak Hours Heat Map */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-800">
              Campus Weekly Temporal Heat Map (Peak Demand Hours)
            </h3>
            <p className="text-xs text-slate-400">
              Heat intensity indicates equipment reservation density across 24h operational cycles
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Calendar size={13} className="text-slate-400" />
            <span>Real-time aggregation</span>
          </div>
        </div>
        <HeatMap />
      </div>

      {/* Row 5: AI Insights Panel for Lab Admin */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-md">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={18} className="text-violet-400" />
          <h3 className="text-base font-bold">Autonomous Facility Recommendations</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 bg-white/10 rounded-xl border border-white/10">
            <p className="font-bold text-indigo-200">Rebalance GPU Compute Node</p>
            <p className="text-slate-300 mt-1 leading-relaxed">
              DGX A100 is exceeding 90% contention. Routing queued inference jobs to RTX 4090 will reduce queue latency by 45%.
            </p>
          </div>
          <div className="p-3.5 bg-white/10 rounded-xl border border-white/10">
            <p className="font-bold text-emerald-200">Preventative Maintenance Window</p>
            <p className="text-slate-300 mt-1 leading-relaxed">
              Tektronix Oscilloscope scheduled for recalibration during Sunday low-utilization window (02:00–06:00).
            </p>
          </div>
          <div className="p-3.5 bg-white/10 rounded-xl border border-white/10">
            <p className="font-bold text-cyan-200">High-Impact Research Prioritization</p>
            <p className="text-slate-300 mt-1 leading-relaxed">
              Senior capstone teams with &lt;14 day deadlines have been automatically given reservation priority.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
