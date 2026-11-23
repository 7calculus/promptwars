import React from 'react';
import {
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

interface TrendPoint {
  date: string;
  bookings: number;
  approvals: number;
  conflicts: number;
}

interface LineChartProps {
  data?: TrendPoint[];
  height?: number;
}

const DEFAULT_TRENDS: TrendPoint[] = [
  { date: 'Mon', bookings: 12, approvals: 10, conflicts: 2 },
  { date: 'Tue', bookings: 18, approvals: 15, conflicts: 3 },
  { date: 'Wed', bookings: 24, approvals: 20, conflicts: 4 },
  { date: 'Thu', bookings: 20, approvals: 18, conflicts: 2 },
  { date: 'Fri', bookings: 28, approvals: 24, conflicts: 4 },
  { date: 'Sat', bookings: 10, approvals: 9, conflicts: 1 },
  { date: 'Sun', bookings: 6, approvals: 6, conflicts: 0 },
];

export default function LineChart({ data = DEFAULT_TRENDS, height = 280 }: LineChartProps) {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#26262b" />
          <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#9a9aa4' }} />
          <YAxis tick={{ fontSize: 12, fill: '#9a9aa4' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0e0e11', color: '#ececf0',
              borderRadius: '12px',
              border: '1px solid #6b3208',
              fontSize: '12px',
            }}
          />
          <Legend
            verticalAlign="top"
            height={36}
            iconType="circle"
            formatter={(value) => <span className="text-xs text-slate-600 font-medium capitalize">{value}</span>}
          />
          <Line
            type="monotone"
            dataKey="bookings"
            stroke="#ff6a00"
            strokeWidth={3}
            dot={{ r: 4, fill: '#ff6a00' }}
            activeDot={{ r: 6 }}
            name="Bookings"
          />
          <Line
            type="monotone"
            dataKey="approvals"
            stroke="#ffc233"
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={{ r: 3, fill: '#ffc233' }}
            name="Approvals"
          />
          <Line
            type="monotone"
            dataKey="conflicts"
            stroke="#ef4444"
            strokeWidth={2}
            dot={{ r: 3, fill: '#ef4444' }}
            name="Conflicts"
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}
