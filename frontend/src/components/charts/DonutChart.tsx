import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

interface DonutData {
  name: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data?: DonutData[];
  title?: string;
  subtitle?: string;
  height?: number;
}

const DEFAULT_DATA: DonutData[] = [
  { name: 'Available', value: 11, color: '#10b981' }, // emerald-500
  { name: 'In Use', value: 4, color: '#f97316' },     // orange-500
  { name: 'Reserved', value: 3, color: '#3b82f6' },   // blue-500
  { name: 'Maintenance', value: 2, color: '#ef4444' } // red-500
];

export default function DonutChart({
  data = DEFAULT_DATA,
  title,
  subtitle,
  height = 240,
}: DonutChartProps) {
  const total = data.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="w-full flex flex-col items-center">
      {(title || subtitle) && (
        <div className="w-full mb-2 text-left">
          {title && <h4 className="text-sm font-bold text-slate-800">{title}</h4>}
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
      )}

      <div style={{ width: '100%', height }} className="relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: any, name: any) => [`${value} units`, name]}
              contentStyle={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e2e8f0',
                fontSize: '12px',
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center Total Count */}
        <div className="absolute pointer-events-none flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-slate-800">{total}</span>
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Units</span>
        </div>
      </div>

      {/* Custom Legend */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2 w-full max-w-xs">
        {data.map((item) => (
          <div key={item.name} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 truncate">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-slate-600 truncate">{item.name}</span>
            </div>
            <span className="font-bold text-slate-800 ml-1">
              {item.value} <span className="text-[10px] font-normal text-slate-400">({Math.round((item.value / total) * 100)}%)</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
