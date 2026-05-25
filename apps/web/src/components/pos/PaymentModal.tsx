'use client';

import { useState } from 'react';
import { X, CreditCard, Banknote, Smartphone, QrCode } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface PaymentModalProps {
  total: number;
  currency: string;
  onConfirm: (data: { method: string; amount: number; change: number }) => void;
  onClose: () => void;
}

const PAYMENT_METHODS = [
  { id: 'CASH', label: 'Cash', icon: Banknote, color: 'text-green-400' },
  { id: 'CARD', label: 'Card', icon: CreditCard, color: 'text-blue-400' },
  { id: 'UPI', label: 'UPI', icon: Smartphone, color: 'text-purple-400' },
  { id: 'QR', label: 'QR Code', icon: QrCode, color: 'text-yellow-400' },
];

export function PaymentModal({ total, currency, onConfirm, onClose }: PaymentModalProps) {
  const [method, setMethod] = useState('CASH');
  const [cashTendered, setCashTendered] = useState(total.toFixed(2));

  const change = Math.max(0, parseFloat(cashTendered || '0') - total);

  const handleConfirm = () => {
    onConfirm({ method, amount: total, change });
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">Process Payment</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Total */}
          <div className="bg-slate-900 rounded-xl p-4 text-center">
            <p className="text-slate-400 text-sm">Amount Due</p>
            <p className="text-4xl font-bold text-brand-400 mt-1">{formatCurrency(total, currency)}</p>
          </div>

          {/* Payment Methods */}
          <div>
            <p className="text-sm font-medium text-slate-300 mb-3">Payment Method</p>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                    method === m.id
                      ? 'border-brand-500 bg-brand-500/10'
                      : 'border-slate-700 bg-slate-700/50 hover:border-slate-500'
                  }`}
                >
                  <m.icon className={`w-5 h-5 ${m.color}`} />
                  <span className="text-sm font-medium text-white">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Cash tendered */}
          {method === 'CASH' && (
            <div>
              <label className="text-sm font-medium text-slate-300 block mb-2">Cash Tendered</label>
              <input
                type="number"
                value={cashTendered}
                onChange={(e) => setCashTendered(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white text-xl font-bold text-center focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              {change > 0 && (
                <div className="mt-2 p-3 bg-green-500/10 border border-green-500/30 rounded-xl">
                  <p className="text-center text-green-400 font-semibold">
                    Change: {formatCurrency(change, currency)}
                  </p>
                </div>
              )}

              {/* Quick amounts */}
              <div className="grid grid-cols-4 gap-2 mt-3">
                {[total, Math.ceil(total / 50) * 50, Math.ceil(total / 100) * 100, Math.ceil(total / 500) * 500].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setCashTendered(amt.toFixed(2))}
                    className="py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs rounded-lg transition-colors"
                  >
                    ₹{amt.toFixed(0)}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleConfirm}
            className="w-full py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg"
          >
            <CreditCard className="w-5 h-5" />
            Confirm Payment — {formatCurrency(total, currency)}
          </button>
        </div>
      </div>
    </div>
  );
}
