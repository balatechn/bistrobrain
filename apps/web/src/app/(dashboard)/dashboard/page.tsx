'use client';

import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp, ShoppingBag, Clock, ChefHat,
  Package, AlertTriangle, DollarSign, Users,
} from 'lucide-react';
import { posApi } from '@/lib/api/pos';
import { formatCurrency } from '@/lib/utils';
import { SalesChart } from '@/components/dashboard/SalesChart';
import { ActiveOrdersTable } from '@/components/dashboard/ActiveOrdersTable';
import { TopItemsChart } from '@/components/dashboard/TopItemsChart';
import { useAuthStore } from '@/store/auth.store';

export default function DashboardPage() {
  const tenant = useAuthStore((s) => s.tenant);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => posApi.getDashboardStats(),
    refetchInterval: 30000,
  });

  const statCards = [
    {
      title: "Today's Sales",
      value: stats ? formatCurrency(stats.todaySales.amount, tenant?.currency) : '—',
      sub: `${stats?.todaySales.orders || 0} orders`,
      icon: DollarSign,
      color: 'text-green-400',
      bg: 'bg-green-400/10',
      border: 'border-green-400/20',
    },
    {
      title: 'Pending Orders',
      value: stats?.pendingOrders ?? '—',
      sub: 'Awaiting action',
      icon: Clock,
      color: 'text-yellow-400',
      bg: 'bg-yellow-400/10',
      border: 'border-yellow-400/20',
    },
    {
      title: 'Active Orders',
      value: stats?.activeOrders?.length ?? '—',
      sub: 'In progress',
      icon: ShoppingBag,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
      border: 'border-blue-400/20',
    },
    {
      title: 'Kitchen Queue',
      value: stats?.activeOrders?.filter((o: any) => o.status === 'IN_KITCHEN')?.length ?? '—',
      sub: 'In kitchen',
      icon: ChefHat,
      color: 'text-orange-400',
      bg: 'bg-orange-400/10',
      border: 'border-orange-400/20',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.title} className={`rounded-xl border ${card.border} ${card.bg} p-5`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-400">{card.title}</p>
                <p className={`text-2xl font-bold mt-1 ${card.color}`}>
                  {isLoading ? <span className="animate-pulse">...</span> : card.value}
                </p>
                <p className="text-xs text-slate-500 mt-1">{card.sub}</p>
              </div>
              <div className={`p-2.5 rounded-lg ${card.bg}`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-slate-800/50 border border-slate-700 rounded-xl p-5">
          <h3 className="text-base font-semibold text-white mb-4">Sales Overview (Last 7 Days)</h3>
          <SalesChart />
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
          <h3 className="text-base font-semibold text-white mb-4">Top Selling Items</h3>
          <TopItemsChart items={stats?.topItems || []} />
        </div>
      </div>

      {/* Active Orders */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-white">Active Orders</h3>
          <a href="/pos" className="text-sm text-brand-400 hover:text-brand-300">Open POS →</a>
        </div>
        <ActiveOrdersTable orders={stats?.activeOrders || []} isLoading={isLoading} />
      </div>
    </div>
  );
}
