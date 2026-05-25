'use client';

import { useEffect, useState } from 'react';
import { Users, Building2, CreditCard, TrendingUp, Activity } from 'lucide-react';

export default function AdminDashboard() {
  const stats = [
    { label: 'Total Tenants', value: '—', icon: Building2, color: 'text-blue-400' },
    { label: 'Active Subscriptions', value: '—', icon: CreditCard, color: 'text-green-400' },
    { label: 'Total Users', value: '—', icon: Users, color: 'text-purple-400' },
    { label: 'MRR', value: '—', icon: TrendingUp, color: 'text-brand-400' },
  ];

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Activity className="w-8 h-8 text-brand-500" />
          <div>
            <h1 className="text-2xl font-bold text-white">Bistro Brain</h1>
            <p className="text-slate-400 text-sm">Super Admin Panel</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((s) => (
            <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-slate-400">{s.label}</p>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <p className="text-3xl font-bold text-white">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Tenants</h2>
          <p className="text-slate-500 text-sm">No tenants registered yet.</p>
        </div>
      </div>
    </main>
  );
}
