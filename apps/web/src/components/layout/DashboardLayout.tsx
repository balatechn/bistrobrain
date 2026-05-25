'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import {
  LayoutDashboard, ShoppingCart, ChefHat, Package, ShoppingBag,
  DollarSign, Users, UserCircle, BarChart3, Bell, Settings,
  ChevronLeft, ChevronRight, LogOut, ChevronDown,
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard',   href: '/dashboard',   icon: LayoutDashboard, roles: ['all'] },
  { label: 'POS',         href: '/pos',          icon: ShoppingCart,     roles: ['all'] },
  { label: 'Kitchen',     href: '/kitchen',      icon: ChefHat,          roles: ['all'] },
  { label: 'Menu',        href: '/menu',          icon: UtensilsCrossed,  roles: ['OWNER','MANAGER'] },
  { label: 'Inventory',   href: '/inventory',    icon: Package,          roles: ['OWNER','MANAGER','INVENTORY_MANAGER'] },
  { label: 'Purchase',    href: '/purchase',     icon: ShoppingBag,      roles: ['OWNER','MANAGER','PURCHASE_MANAGER'] },
  { label: 'Finance',     href: '/finance',      icon: DollarSign,       roles: ['OWNER','ACCOUNTANT'] },
  { label: 'CRM',         href: '/crm',          icon: Users,             roles: ['OWNER','MANAGER'] },
  { label: 'HR',          href: '/hr',           icon: UserCircle,       roles: ['OWNER','HR_MANAGER'] },
  { label: 'Reports',     href: '/reports',      icon: BarChart3,        roles: ['OWNER','MANAGER','ACCOUNTANT'] },
  { label: 'Settings',    href: '/settings',     icon: Settings,         roles: ['OWNER'] },
];

function UtensilsCrossed({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8" />
      <path d="M15 15 3.3 3.3a4.2 4.2 0 0 0 0 6l7.3 7.3c.7.7 2 .7 2.8 0L15 15Zm0 0 7 7" />
      <path d="m2.1 21.8 6.4-6.3" />
      <path d="m19 5-7 7" />
    </svg>
  );
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, tenant, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  const filteredNav = navItems.filter(
    (item) => item.roles.includes('all') || item.roles.includes(user?.role || ''),
  );

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      {/* Sidebar */}
      <aside className={`flex flex-col bg-sidebar transition-all duration-300 ${collapsed ? 'w-16' : 'w-60'} border-r border-slate-800`}>
        {/* Logo */}
        <div className="flex items-center gap-3 p-4 border-b border-slate-800 min-h-[64px]">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <ChefHat className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="font-bold text-white text-sm truncate">{tenant?.name || 'Bistro Brain'}</p>
              <p className="text-xs text-slate-500 truncate capitalize">{tenant?.subscriptionPlan?.toLowerCase()} plan</p>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {filteredNav.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${
                  active
                    ? 'bg-brand-600/20 text-brand-400 border border-brand-600/30'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-brand-400' : ''}`} />
                {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User info */}
        <div className="border-t border-slate-800 p-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center flex-shrink-0 text-white text-sm font-semibold">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-slate-500 truncate capitalize">{user?.role?.replace('_', ' ').toLowerCase()}</p>
              </div>
            )}
            <button
              onClick={logout}
              className="text-slate-500 hover:text-red-400 transition-colors flex-shrink-0"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span>{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-950">
          {children}
        </main>
      </div>
    </div>
  );
}
