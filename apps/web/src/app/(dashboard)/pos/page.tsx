'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import {
  Plus, Minus, Trash2, Search, ChevronRight,
  CreditCard, UtensilsCrossed, Printer, RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { posApi } from '@/lib/api/pos';
import { formatCurrency } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { TableGrid } from '@/components/pos/TableGrid';
import { MenuItemCard } from '@/components/pos/MenuItemCard';
import { PaymentModal } from '@/components/pos/PaymentModal';

interface CartItem {
  menuItemId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  notes?: string;
  variantId?: string;
}

export default function POSPage() {
  const { tenant, user } = useAuthStore();
  const qc = useQueryClient();
  const socketRef = useRef<Socket | null>(null);

  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [orderType, setOrderType] = useState<'DINE_IN' | 'TAKEAWAY' | 'DELIVERY'>('DINE_IN');

  const { data: categories } = useQuery({ queryKey: ['menu-categories'], queryFn: posApi.getCategories });
  const { data: menuItems } = useQuery({
    queryKey: ['menu-items', activeCategory, searchQuery],
    queryFn: () => posApi.getMenuItems({ categoryId: activeCategory, search: searchQuery }),
  });
  const { data: tables } = useQuery({
    queryKey: ['tables'],
    queryFn: posApi.getTables,
    refetchInterval: 15000,
  });

  // Real-time socket connection
  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4002';
    socketRef.current = io(`${wsUrl}/pos`);
    socketRef.current.emit('joinBranch', { tenantId: tenant?.id, branchId: user?.branchId });

    socketRef.current.on('table:update', () => qc.invalidateQueries({ queryKey: ['tables'] }));
    socketRef.current.on('order:completed', () => { qc.invalidateQueries({ queryKey: ['tables'] }); });

    return () => { socketRef.current?.disconnect(); };
  }, [tenant?.id, user?.branchId]);

  const createOrderMutation = useMutation({
    mutationFn: (data: any) => posApi.createOrder(data),
    onSuccess: (order) => {
      toast.success(`Order ${order.orderNumber} created!`);
      setCart([]);
      setSelectedTable(null);
      qc.invalidateQueries({ queryKey: ['tables'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create order'),
  });

  const addToCart = useCallback((item: any) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItemId === item.id);
      if (existing) return prev.map((c) => c.menuItemId === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { menuItemId: item.id, name: item.name, unitPrice: Number(item.basePrice), quantity: 1 }];
    });
  }, []);

  const updateQty = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev.map((c) => c.menuItemId === itemId ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c)
          .filter((c) => c.quantity > 0),
    );
  };

  const subtotal = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const tax = subtotal * 0.05;
  const total = subtotal + tax;

  const handlePlaceOrder = () => {
    if (cart.length === 0) { toast.error('Cart is empty'); return; }
    if (orderType === 'DINE_IN' && !selectedTable) { toast.error('Select a table for dine-in'); return; }
    setShowPayment(true);
  };

  const handlePaymentComplete = async (paymentData: any) => {
    createOrderMutation.mutate({
      tableId: selectedTable?.id,
      orderType,
      items: cart.map((c) => ({ menuItemId: c.menuItemId, quantity: c.quantity, notes: c.notes })),
      paymentMethod: paymentData.method,
      source: 'POS',
    });
    setShowPayment(false);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-0 bg-slate-950 -mx-6 -my-6 overflow-hidden">
      {/* Left: Menu */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Order Type Tabs */}
        <div className="flex gap-2 p-3 bg-slate-900 border-b border-slate-800">
          {(['DINE_IN', 'TAKEAWAY', 'DELIVERY'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setOrderType(type)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                orderType === type ? 'bg-brand-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {type.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Table Selection */}
        {orderType === 'DINE_IN' && (
          <div className="p-3 bg-slate-900 border-b border-slate-800">
            <TableGrid tables={tables?.tables || []} selected={selectedTable} onSelect={setSelectedTable} />
          </div>
        )}

        {/* Search */}
        <div className="p-3 bg-slate-900 border-b border-slate-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-2 p-3 overflow-x-auto bg-slate-900 border-b border-slate-800 scrollbar-hide">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${!activeCategory ? 'bg-brand-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
          >
            All
          </button>
          {categories?.map((cat: any) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${activeCategory === cat.id ? 'bg-brand-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Menu Items Grid */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="menu-grid">
            {menuItems?.items?.map((item: any) => (
              <MenuItemCard key={item.id} item={item} onAdd={() => addToCart(item)} />
            ))}
          </div>
          {menuItems?.items?.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <UtensilsCrossed className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No items found</p>
            </div>
          )}
        </div>
      </div>

      {/* Right: Cart / Bill */}
      <div className="w-80 xl:w-96 flex flex-col bg-slate-900 border-l border-slate-800">
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white">
              {selectedTable ? `Table ${selectedTable.name}` : 'Current Order'}
            </h3>
            {cart.length > 0 && (
              <button onClick={() => setCart([])} className="text-xs text-red-400 hover:text-red-300">Clear</button>
            )}
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <ShoppingBagIcon className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">Cart is empty</p>
              <p className="text-xs mt-1">Add items from the menu</p>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {cart.map((item) => (
                <div key={item.menuItemId} className="flex items-center gap-3 bg-slate-800 rounded-xl p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{item.name}</p>
                    <p className="text-xs text-slate-400">{formatCurrency(item.unitPrice, tenant?.currency)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQty(item.menuItemId, -1)} className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center hover:bg-slate-600 transition-colors">
                      <Minus className="w-3 h-3 text-slate-300" />
                    </button>
                    <span className="text-sm font-medium text-white w-5 text-center">{item.quantity}</span>
                    <button onClick={() => updateQty(item.menuItemId, 1)} className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center hover:bg-slate-600 transition-colors">
                      <Plus className="w-3 h-3 text-slate-300" />
                    </button>
                    <button onClick={() => setCart((p) => p.filter((c) => c.menuItemId !== item.menuItemId))} className="w-7 h-7 rounded-lg bg-red-500/20 flex items-center justify-center hover:bg-red-500/30 transition-colors ml-1">
                      <Trash2 className="w-3 h-3 text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bill Summary */}
        {cart.length > 0 && (
          <div className="border-t border-slate-800 p-4 space-y-3">
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm text-slate-400">
                <span>Subtotal ({cart.reduce((s, i) => s + i.quantity, 0)} items)</span>
                <span>{formatCurrency(subtotal, tenant?.currency)}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-400">
                <span>Tax (5%)</span>
                <span>{formatCurrency(tax, tenant?.currency)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-white border-t border-slate-700 pt-2 mt-2">
                <span>Total</span>
                <span className="text-brand-400">{formatCurrency(total, tenant?.currency)}</span>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={createOrderMutation.isPending}
              className="w-full py-3.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-900/50"
            >
              <CreditCard className="w-5 h-5" />
              Place Order & Pay
            </button>
            <button
              onClick={() => createOrderMutation.mutate({
                tableId: selectedTable?.id, orderType,
                items: cart.map((c) => ({ menuItemId: c.menuItemId, quantity: c.quantity })),
                source: 'POS',
              })}
              disabled={createOrderMutation.isPending}
              className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Send to Kitchen (KOT)
            </button>
          </div>
        )}
      </div>

      {showPayment && (
        <PaymentModal
          total={total}
          currency={tenant?.currency || 'INR'}
          onConfirm={handlePaymentComplete}
          onClose={() => setShowPayment(false)}
        />
      )}
    </div>
  );
}

function ShoppingBagIcon({ className }: { className?: string }) {
  return <UtensilsCrossed className={className} />;
}
