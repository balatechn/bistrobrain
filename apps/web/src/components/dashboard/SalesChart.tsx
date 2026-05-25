'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const mockData = [
  { day: 'Mon', sales: 12400 }, { day: 'Tue', sales: 18200 }, { day: 'Wed', sales: 15800 },
  { day: 'Thu', sales: 22100 }, { day: 'Fri', sales: 28500 }, { day: 'Sat', sales: 35200 },
  { day: 'Sun', sales: 31800 },
];

export function SalesChart() {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={mockData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
        <Tooltip
          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }}
          formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Sales']}
        />
        <Bar dataKey="sales" fill="#f97316" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
