'use client';

interface TopItemsChartProps {
  items: Array<{ name: string; _sum: { quantity: number; totalAmount: number } }>;
}

export function TopItemsChart({ items }: TopItemsChartProps) {
  const mockItems = items.length > 0 ? items : [
    { name: 'Butter Chicken', _sum: { quantity: 45, totalAmount: 16000 } },
    { name: 'Dal Makhani', _sum: { quantity: 38, totalAmount: 9500 } },
    { name: 'Paneer Tikka', _sum: { quantity: 30, totalAmount: 10500 } },
    { name: 'Naan', _sum: { quantity: 80, totalAmount: 4000 } },
    { name: 'Biryani', _sum: { quantity: 22, totalAmount: 11000 } },
  ];

  const max = Math.max(...mockItems.map((i) => i._sum.quantity));

  return (
    <div className="space-y-3">
      {mockItems.slice(0, 5).map((item, i) => (
        <div key={item.name} className="flex items-center gap-3">
          <span className="text-xs text-slate-500 w-4 text-right">{i + 1}</span>
          <div className="flex-1">
            <div className="flex justify-between mb-1">
              <span className="text-xs font-medium text-slate-300 truncate">{item.name}</span>
              <span className="text-xs text-slate-500 ml-2">{item._sum.quantity} pcs</span>
            </div>
            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-500 rounded-full transition-all"
                style={{ width: `${(item._sum.quantity / max) * 100}%` }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
