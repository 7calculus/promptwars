import React, { useEffect, useState } from 'react';
import {
  Layers,
  CheckCircle,
  Calendar,
  Clock,
  Sparkles,
  ArrowUpRight,
  Bot,
  Zap,
} from 'lucide-react';
import { useAppStore } from '../store/appStore';
import DonutChart from '../components/charts/DonutChart';
import StatusBadge from '../components/common/StatusBadge';
import {
  ANALYTICS_OVERVIEW,
  MOCK_BOOKINGS,
  MOCK_EQUIPMENT,
} from '../data/mockData';
import { analyticsAPI, bookingsAPI, equipmentAPI } from '../services/api';
import { Booking, Equipment } from '../types';
import { format } from 'date-fns';

export default function Dashboard() {
  const { state, dispatch } = useAppStore();
  const { currentPersona } = state;

  const [overview, setOverview] = useState(ANALYTICS_OVERVIEW);
  const [recentBookings, setRecentBookings] = useState<Booking[]>(MOCK_BOOKINGS);
  const [topEquipment, setTopEquipment] = useState<Equipment[]>(MOCK_EQUIPMENT.slice(0, 5));

  useEffect(() => {
    // Fetch live backend metrics if up
    analyticsAPI.getOverview().then((res) => {
      if (res.data) setOverview(res.data);
    }).catch(() => {});

    const filters: Record<string, string> = {};
    if (currentPersona.role === 'student' && currentPersona.studentId) {
      filters.studentId = currentPersona.studentId;
    }
    bookingsAPI.getAll(filters).then((res) => {
      setRecentBookings(res.data.slice(0, 5));
    }).catch(() => {});

    equipmentAPI.getAll().then((res) => {
      if (res.data && res.data.length > 0) {
        const sorted = [...res.data].sort((a: any, b: any) => b.demandScore - a.demandScore);
        setTopEquipment(sorted.slice(0, 5));
      }
    }).catch(() => {});
  }, [currentPersona]);

  const summaryCards = [
    {
      title: 'Total Equipment',
      value: overview.totalEquipment || 20,
      icon: Layers,
      color: 'bg-indigo-50 text-indigo-600',
      accent: 'text-indigo-600',
      trend: '+2 added this month',
    },
    {
      title: 'Available Now',
      value: overview.availableNow || 11,
      icon: CheckCircle,
      color: 'bg-emerald-50 text-emerald-600',
      accent: 'text-emerald-600',
      trend: 'Ready for booking',
    },
    {
      title: 'Active Bookings',
      value: overview.activeBookings || 8,
      icon: Calendar,
      color: 'bg-orange-50 text-orange-600',
      accent: 'text-orange-600',
      trend: '4 concluding soon',
    },
    {
      title: 'Pending Approvals',
      value: overview.pendingApprovals || 3,
      icon: Clock,
      color: 'bg-amber-50 text-amber-600',
      accent: 'text-amber-600',
      trend: 'Requires review',
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Welcome back, <span className="neon-text">{currentPersona.name.split(' ')[0]}</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {format(new Date(), 'EEEE, MMMM d, yyyy')} • Campus Laboratory Hub
          </p>
        </div>

        <button
          onClick={() => dispatch({ type: 'SET_PAGE', payload: 'booking' })}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm shadow-indigo-300 transition flex items-center justify-center gap-2 active:scale-95 self-start sm:self-auto"
        >
          <Sparkles size={14} />
          Book Lab Equipment
        </button>
      </div>

      {/* 2. Summary Cards (4) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex items-center justify-between"
            >
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {card.title}
                </p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">
                  {card.value}
                </h3>
                <span className="text-[11px] font-medium text-slate-500 mt-1 block">
                  {card.trend}
                </span>
              </div>
              <div className={`w-12 h-12 rounded-2xl ${card.color} flex items-center justify-center`}>
                <Icon size={24} />
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Row 2: Donut Chart + AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Availability Donut (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Resource Allocation Status
              </h3>
              <p className="text-xs text-slate-400">
                Live distribution across 8 campus engineering & science facilities
              </p>
            </div>
          </div>
          <DonutChart />
        </div>

        {/* AI Insights Panel (5 cols) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-violet-50/80 to-indigo-50/50 rounded-2xl p-6 border-l-4 border-l-violet-600 border border-violet-100 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-violet-600 text-white">
                <Bot size={16} />
              </div>
              <h3 className="text-base font-bold text-violet-950">
                AI Optimization Insights
              </h3>
            </div>

            <div className="space-y-3 mt-4 text-xs">
              <div className="p-3 bg-white/80 backdrop-blur-sm rounded-xl border border-violet-100">
                <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Zap size={13} className="text-amber-500 fill-amber-500" />
                  Peak GPU Workstation Demand
                </p>
                <p className="text-slate-600 mt-1 leading-relaxed">
                  NVIDIA DGX A100 is 95% utilized today. Consider reserving the RTX 4090 station during 14:00–16:00 to avoid bottlenecking.
                </p>
              </div>

              <div className="p-3 bg-white/80 backdrop-blur-sm rounded-xl border border-violet-100">
                <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Clock size={13} className="text-indigo-600" />
                  Off-Peak Fabrication Window
                </p>
                <p className="text-slate-600 mt-1 leading-relaxed">
                  3D printers & CNC Mini Mill experience 60% lower contention before 11:00 AM weekdays.
                </p>
              </div>

              <div className="p-3 bg-white/80 backdrop-blur-sm rounded-xl border border-violet-100">
                <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Sparkles size={13} className="text-violet-600" />
                  Upcoming Project Deadlines
                </p>
                <p className="text-slate-600 mt-1 leading-relaxed">
                  3 student teams have deliverables due in &lt;7 days; autonomous slot holds applied for priority requests.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => dispatch({ type: 'SET_PAGE', payload: 'assistant' })}
            className="mt-4 w-full py-2.5 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm shadow-violet-200"
          >
            Open AI Assistant <ArrowUpRight size={14} />
          </button>
        </div>
      </div>

      {/* 4. Row 3: Upcoming Bookings Table + Popular Equipment */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Bookings Table (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-800">Upcoming Reservations</h3>
            <button
              onClick={() => dispatch({ type: 'SET_PAGE', payload: 'requests' })}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              View all
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase font-bold text-slate-400 border-b border-slate-100 pb-2">
                <tr>
                  <th className="pb-3">Equipment</th>
                  <th className="pb-3">Date & Time</th>
                  <th className="pb-3">Student</th>
                  <th className="pb-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentBookings.map((b) => (
                  <tr
                    key={b.id}
                    onClick={() => dispatch({ type: 'SET_PAGE', payload: 'requests' })}
                    className="hover:bg-slate-50 cursor-pointer transition"
                  >
                    <td className="py-3 font-semibold text-slate-800 truncate max-w-[160px]">
                      {b.equipmentName || 'Equipment'}
                    </td>
                    <td className="py-3 text-slate-600 whitespace-nowrap">
                      {format(new Date(b.startTime), 'MMM d, h:mm a')}
                    </td>
                    <td className="py-3 text-slate-600">
                      {b.studentName || 'Alex Morgan'}
                    </td>
                    <td className="py-3 text-right">
                      <StatusBadge status={b.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Popular Equipment List (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-800">Most Demanded Equipment</h3>
            <button
              onClick={() => dispatch({ type: 'SET_PAGE', payload: 'explorer' })}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Explore all
            </button>
          </div>

          <div className="space-y-3.5">
            {topEquipment.map((eq) => (
              <div
                key={eq.id}
                onClick={() => dispatch({ type: 'SET_PAGE', payload: 'explorer' })}
                className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-slate-50 cursor-pointer transition"
              >
                <div className="overflow-hidden flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-800 truncate">{eq.name}</p>
                    <span className="text-[11px] font-bold text-slate-700">{eq.demandScore}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full"
                      style={{ width: `${eq.demandScore}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
