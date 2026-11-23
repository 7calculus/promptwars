import React from 'react';
import {
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface BarData {
  name: string;
  utilization: number;
  category?: string;
}

interface BarChartProps {
  data?: BarData[];
  height?: number;
  layout?: 'horizontal' | 'vertical';
}

const DEFAULT_DATA: BarData[] = [
  { name: 'NVIDIA DGX A100', utilization: 94, category: 'AI-ML' },
  { name: 'RTX 4090 Workstation', utilization: 88, category: 'AI-ML' },
  { name: 'Spot Robot', utilization: 84, category: 'Robotics' },
  { name: 'Velodyne Lidar', utilization: 80, category: 'Robotics' },
  { name: 'HPC Cluster', utilization: 78, category: 'Computing' },
  { name: 'UR10e Robot Arm', utilization: 72, category: 'Robotics' },
  { name: 'Ultimaker S5 3D', utilization: 68, category: '3D-Printing' },
  { name: 'FEI SEM Microscope', utilization: 62, category: 'Research' },
  { name: 'Haas Mini Mill CNC', utilization: 55, category: 'Mechanical' },
  { name: 'Tektronix MSO64', utilization: 48, category: 'Electronics' },
];

export default function BarChart({
  data = DEFAULT_DATA,
  height = 340,
  layout = 'vertical',
}: BarChartProps) {
  if (layout === 'vertical') {
    return (
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 70, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
            <XAxis
              type="number"
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: '#64748b' }}
              unit="%"
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 11, fill: '#334155' }}
              width={100}
            />
            <Tooltip
              formatter={(value: any) => [`${value}% Utilization`, 'Rate']}
              contentStyle={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                fontSize: '12px',
              }}
            />
            <Bar dataKey="utilization" fill="#6366f1" radius={[0, 6, 6, 0]} barSize={16} />
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: '#64748b' }}
            angle={-25}
            textAnchor="end"
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: '#64748b' }}
            unit="%"
          />
          <Tooltip
            formatter={(value: any) => [`${value}%`, 'Utilization']}
            contentStyle={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              fontSize: '12px',
            }}
          />
          <Bar dataKey="utilization" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={24} />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
