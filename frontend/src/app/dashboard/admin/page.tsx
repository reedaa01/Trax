'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { adminService } from '@/lib/services';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
  Users, Truck, ClipboardList, CheckCircle2, Clock, Shield,
} from 'lucide-react';

interface Stats {
  total_users: number;
  total_clients: number;
  total_drivers: number;
  total_requests: number;
  pending_requests: number;
  completed_requests: number;
  active_drivers: number;
}

function StatCard({
  label, value, sub, icon: Icon, color,
}: {
  label: string; value: number | string; sub?: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4 shadow-sm">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm font-medium text-gray-700">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function AdminOverviewPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && user?.role !== 'admin') router.replace('/auth/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.role === 'admin') {
      adminService.getStats()
        .then(setStats)
        .finally(() => setFetching(false));
    }
  }, [user]);

  if (loading || fetching) return <LoadingSpinner />;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-red-100 rounded-xl">
          <Shield className="h-6 w-6 text-red-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Overview</h1>
          <p className="text-sm text-gray-500">Platform-wide analytics</p>
        </div>
      </div>

      {/* Stats grid */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard label="Total Users" value={stats.total_users} icon={Users}
            color="bg-blue-100 text-blue-600"
            sub={`${stats.total_clients} clients · ${stats.total_drivers} drivers`} />
          <StatCard label="Active Drivers" value={stats.active_drivers} icon={Truck}
            color="bg-amber-100 text-amber-600"
            sub={`Out of ${stats.total_drivers} registered`} />
          <StatCard label="Total Requests" value={stats.total_requests} icon={ClipboardList}
            color="bg-brand-100 text-brand-600" />
          <StatCard label="Pending Requests" value={stats.pending_requests} icon={Clock}
            color="bg-yellow-100 text-yellow-600" />
          <StatCard label="Completed" value={stats.completed_requests} icon={CheckCircle2}
            color="bg-green-100 text-green-600"
            sub={stats.total_requests > 0
              ? `${Math.round((stats.completed_requests / stats.total_requests) * 100)}% completion rate`
              : undefined} />
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { href: '/dashboard/admin/users',    label: 'Manage Users',    desc: 'View and moderate all user accounts' },
          { href: '/dashboard/admin/drivers',  label: 'Manage Drivers',  desc: 'Monitor driver profiles and availability' },
          { href: '/dashboard/admin/requests', label: 'All Requests',    desc: 'Browse every transport request' },
        ].map(({ href, label, desc }) => (
          <a
            key={href}
            href={href}
            className="block p-5 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-brand-400 hover:shadow-md transition-all"
          >
            <p className="font-semibold text-gray-900">{label}</p>
            <p className="text-sm text-gray-500 mt-1">{desc}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
