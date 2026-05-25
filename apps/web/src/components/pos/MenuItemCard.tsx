'use client';

import { UtensilsCrossed, Coffee, Leaf } from 'lucide-react';

interface MenuItemCardProps {
  item: { id: string; name: string; basePrice: number; image?: string; foodType: string; isAvailable: boolean; preparationTime?: number };
  onAdd: () => void;
}

export function MenuItemCard({ item, onAdd }: MenuItemCardProps) {
  const foodTypeIcon = item.foodType === 'VEG' ? '🟢' : item.foodType === 'NON_VEG' ? '🔴' : '🟡';

  return (
    <button
      onClick={onAdd}
      disabled={!item.isAvailable}
      className={`pos-button text-left relative ${!item.isAvailable ? 'opacity-40 cursor-not-allowed' : ''}`}
    >
      {item.image ? (
        <img src={item.image} alt={item.name} className="w-full h-20 object-cover rounded-lg mb-2" />
      ) : (
        <div className="w-full h-20 bg-slate-700 rounded-lg mb-2 flex items-center justify-center">
          <UtensilsCrossed className="w-8 h-8 text-slate-500" />
        </div>
      )}
      <div className="w-full">
        <div className="flex items-start gap-1">
          <span className="text-xs">{foodTypeIcon}</span>
          <p className="text-xs font-medium text-white leading-tight flex-1">{item.name}</p>
        </div>
        <p className="text-sm font-bold text-brand-400 mt-1">₹{Number(item.basePrice).toFixed(0)}</p>
        {item.preparationTime && <p className="text-xs text-slate-500">{item.preparationTime} min</p>}
      </div>
      {!item.isAvailable && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/70 rounded-xl">
          <span className="text-xs text-slate-400 font-medium">Unavailable</span>
        </div>
      )}
    </button>
  );
}
