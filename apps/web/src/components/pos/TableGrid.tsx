'use client';

interface TableGridProps {
  tables: Array<{ id: string; name: string; capacity: number; status: string }>;
  selected: any;
  onSelect: (table: any) => void;
}

const statusColors: Record<string, string> = {
  AVAILABLE: 'border-green-500 bg-green-500/10 text-green-400',
  OCCUPIED: 'border-red-500 bg-red-500/10 text-red-400',
  RESERVED: 'border-yellow-500 bg-yellow-500/10 text-yellow-400',
  CLEANING: 'border-blue-500 bg-blue-500/10 text-blue-400',
};

export function TableGrid({ tables, selected, onSelect }: TableGridProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {tables.map((table) => (
        <button
          key={table.id}
          onClick={() => table.status === 'AVAILABLE' ? onSelect(table) : undefined}
          disabled={table.status === 'OCCUPIED'}
          className={`flex-shrink-0 w-16 h-16 rounded-xl border-2 flex flex-col items-center justify-center transition-all text-xs font-medium
            ${statusColors[table.status] || 'border-slate-600 bg-slate-700 text-slate-400'}
            ${selected?.id === table.id ? 'ring-2 ring-brand-500 ring-offset-2 ring-offset-slate-900' : ''}
            ${table.status === 'OCCUPIED' ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-105'}`}
        >
          <span className="font-bold text-sm">{table.name}</span>
          <span className="text-[10px] opacity-70">{table.capacity}P</span>
        </button>
      ))}
      {tables.length === 0 && <p className="text-xs text-slate-500 py-2">No tables configured</p>}
    </div>
  );
}
