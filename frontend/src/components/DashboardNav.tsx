'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Truck, LayoutDashboard, Search, ClipboardList,
  Settings, LogOut, Bell, ChevronDown, Menu, X,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import clsx from 'clsx';
import { useState, useEffect } from 'react';

const clientNav = [
  { href: '/dashboard/client',          label: 'Dashboard',      icon: LayoutDashboard },
  { href: '/dashboard/client/search',   label: 'Find Transport', icon: Search },
  { href: '/dashboard/client/requests', label: 'My Requests',    icon: ClipboardList },
];

const driverNav = [
  { href: '/dashboard/driver',           label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/driver/requests',  label: 'Requests',  icon: Bell },
  { href: '/dashboard/driver/jobs',      label: 'My Jobs',   icon: ClipboardList },
  { href: '/dashboard/driver/settings',  label: 'Settings',  icon: Settings },
];

export default function DashboardNav() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const navItems = user?.role === 'driver' ? driverNav : clientNav;

  // Close drawer on route change
  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  // Lock body scroll when drawer is open on mobile
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  const NavContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center justify-between gap-2.5 px-6 py-5 border-b border-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="bg-brand-600 p-1.5 rounded-lg">
            <Truck className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">
            Tra<span className="text-brand-400">X</span>
          </span>
        </div>
        {/* Close button – mobile only */}
        <button
          onClick={() => setDrawerOpen(false)}
          className="lg:hidden p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Role badge */}
      <div className="px-6 py-3 border-b border-gray-800">
        <span className={clsx(
          'badge text-xs',
          user?.role === 'driver'
            ? 'bg-amber-500/20 text-amber-400'
            : 'bg-brand-500/20 text-brand-400',
        )}>
          {user?.role === 'driver' ? '🚛 Driver' : '📦 Client'}
        </span>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setDrawerOpen(false)}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-brand-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User menu */}
      <div className="border-t border-gray-800 p-4">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-800 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
            {user?.full_name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.full_name}</p>
            <p className="text-gray-500 text-xs truncate">{user?.email}</p>
          </div>
          <ChevronDown className={clsx('h-4 w-4 text-gray-500 transition-transform', menuOpen && 'rotate-180')} />
        </button>
        {menuOpen && (
          <div className="mt-2 bg-gray-800 rounded-lg overflow-hidden">
            <button
              onClick={logout}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-gray-700 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* ── Mobile top bar ── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4">
        <button
          onClick={() => setDrawerOpen(true)}
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="text-lg font-bold text-white">
          Tra<span className="text-brand-400">X</span>
        </span>
        <div className="w-9 h-9 rounded-full bg-brand-600 flex items-center justify-center text-white text-sm font-bold">
          {user?.full_name?.[0]?.toUpperCase() || 'U'}
        </div>
      </header>

      {/* ── Mobile backdrop ── */}
      {drawerOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ── Mobile slide drawer ── */}
      <aside className={clsx(
        'lg:hidden fixed top-0 left-0 h-screen w-72 bg-gray-900 flex flex-col z-50 transition-transform duration-300',
        drawerOpen ? 'translate-x-0' : '-translate-x-full',
      )}>
        <NavContent />
      </aside>

      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:flex fixed top-0 left-0 h-screen w-64 bg-gray-900 flex-col z-40">
        <NavContent />
      </aside>
    </>
  );
}
