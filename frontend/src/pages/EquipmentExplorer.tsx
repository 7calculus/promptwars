import React, { useState, useEffect } from 'react';
import { LayoutGrid, List, Filter, MapPin, Sparkles, X, Calendar } from 'lucide-react';
import EquipmentCard from '../components/common/EquipmentCard';
import SearchBar from '../components/common/SearchBar';
import FilterChip from '../components/common/FilterChip';
import Modal from '../components/common/Modal';
import StatusBadge from '../components/common/StatusBadge';
import { MOCK_EQUIPMENT } from '../data/mockData';
import { equipmentAPI } from '../services/api';
import { Equipment, EquipmentCategory } from '../types';
import { useAppStore } from '../store/appStore';

const CATEGORIES: (EquipmentCategory | 'All')[] = [
  'All',
  'AI-ML',
  'Robotics',
  '3D-Printing',
  'Electronics',
  'Computing',
  'IoT',
  'Mechanical',
  'Research',
];

export default function EquipmentExplorer() {
  const { dispatch } = useAppStore();

  const [equipmentList, setEquipmentList] = useState<Equipment[]>(MOCK_EQUIPMENT);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'demand' | 'name' | 'rate'>('demand');

  // Modal State
  const [detailEquipment, setDetailEquipment] = useState<Equipment | null>(null);

  useEffect(() => {
    equipmentAPI.getAll().then((res) => {
      if (res.data && res.data.length > 0) setEquipmentList(res.data);
    }).catch(() => {});
  }, []);

  const filteredEquipment = equipmentList
    .filter((eq) => {
      const matchCat = selectedCategory === 'All' || eq.category === selectedCategory;
      const matchSearch =
        eq.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        eq.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        eq.lab.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'demand') return b.demandScore - a.demandScore;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return a.hourlyRate - b.hourlyRate;
    });

  const handleBookNow = (equipment: Equipment) => {
    dispatch({ type: 'SET_PAGE', payload: 'booking' });
  };

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Equipment Explorer
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Browse and reserve 20+ specialized lab instruments across academic departments
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search equipment, labs, specs..."
            className="w-full md:w-72"
          />

          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-xs">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'grid' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Grid View"
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'list' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600'
              }`}
              title="List View"
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Category Pills & Sort Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 overflow-x-auto pb-1">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <FilterChip
              key={cat}
              label={cat}
              active={selectedCategory === cat}
              onClick={() => setSelectedCategory(cat)}
            />
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 flex-shrink-0 self-end sm:self-auto">
          <span>Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-400"
          >
            <option value="demand">Highest Demand</option>
            <option value="name">Name (A-Z)</option>
            <option value="rate">Lowest Rate</option>
          </select>
        </div>
      </div>

      {/* Equipment List / Grid */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEquipment.map((eq) => (
            <EquipmentCard
              key={eq.id}
              equipment={eq}
              onSelect={setDetailEquipment}
              onBook={handleBookNow}
              viewMode="grid"
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEquipment.map((eq) => (
            <EquipmentCard
              key={eq.id}
              equipment={eq}
              onSelect={setDetailEquipment}
              onBook={handleBookNow}
              viewMode="list"
            />
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <Modal
        open={!!detailEquipment}
        onClose={() => setDetailEquipment(null)}
        title={detailEquipment?.name}
        size="lg"
      >
        {detailEquipment && (
          <div className="p-6 space-y-5">
            <div className="flex flex-wrap items-center gap-3 justify-between">
              <div className="flex items-center gap-2">
                <StatusBadge status={detailEquipment.status} />
                <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 font-semibold text-slate-600">
                  {detailEquipment.category}
                </span>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <MapPin size={13} /> {detailEquipment.lab}
                </span>
              </div>
              <div className="text-lg font-black text-slate-800">
                ${detailEquipment.hourlyRate} <span className="text-xs font-normal text-slate-500">/hr</span>
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              {detailEquipment.description}
            </p>

            {/* Technical Specs */}
            <div className="p-4 bg-slate-50 rounded-xl space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Technical Specifications
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {Object.entries(detailEquipment.specs || {}).map(([key, val]) => (
                  <div key={key} className="flex justify-between p-1.5 bg-white rounded-lg border border-slate-100">
                    <span className="font-medium text-slate-500">{key}:</span>
                    <span className="font-bold text-slate-800">{String(val)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Availability Slots Calendar preview */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Calendar size={13} />
                Next Available Windows (Next 3 Days)
              </h4>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-center font-medium">
                  Tomorrow 09:00 - 11:00
                </div>
                <div className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-center font-medium">
                  Tomorrow 14:00 - 16:00
                </div>
                <div className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-center font-medium">
                  Friday 10:00 - 12:00
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDetailEquipment(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setDetailEquipment(null);
                  handleBookNow(detailEquipment);
                }}
                disabled={detailEquipment.status === 'maintenance'}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-300 transition disabled:opacity-50"
              >
                {detailEquipment.requiresApproval ? 'Request Faculty Approval' : 'Proceed to Reservation'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
