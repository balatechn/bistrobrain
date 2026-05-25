'use client';

import { Clock, Loader2 } from 'lucide-react';

interface ActiveOrdersTableProps {
  orders: any[];
  isLoading: boolean;
}

const statusBadge: Record<string, string> = {
  PENDING: 'bg-yellow-500/20 text-yellow-400',
  CONFIRMED: 'bg-blue-500/20 text-blue-400',
  IN_KITCHEN: 'bg-orange-500/20 text-orange-400',
  READY: 'bg-green-500/20 text-green-400',
};

export function ActiveOrdersTable({ orders, isLoading }: ActiveOrdersTableProps) {
  if (isLoading) return (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
    </div>
  );

  if (orders.length === 0) return (
    <p className="text-center text-slate-500 py-8 text-sm">No active orders right now</p>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-slate-500 border-b border-slate-700">
            <th className="pb-2 font-medium">Order #</th>
            <th className="pb-2 font-medium">Table</th>
            <th className="pb-2 font-medium">Items</th>
            <th className="pb-2 font-medium">Amount</th>
            <th className="pb-2 font-medium">Status</th>
            <th className="pb-2 font-medium">Time</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {orders.map((order) => (
            <tr key={order.id} className="text-slate-300 hover:bg-slate-800/50 transition-colors">
              <td className="py-3 font-medium text-white">{order.orderNumber}</td>
              <td className="py-3">{order.table?.name || order.orderType}</td>
              <td className="py-3">{order.orderItems?.length} items</td>
              <td className="py-3">₹{Number(order.totalAmount).toLocaleString('en-IN')}</td>
              <td className="py-3">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge[order.status] || 'bg-slate-700 text-slate-400'}`}>
                  {order.status.replace('_', ' ')}
                </span>
              </td>
              <td className="py-3 text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
