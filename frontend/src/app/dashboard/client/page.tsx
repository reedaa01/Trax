'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ClipboardList, Search, Truck, TrendingUp, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { requestService } from '@/lib/services';
import { TransportRequest } from '@/types';
import StatusBadge from '@/components/StatusBadge';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function ClientDashboard() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<TransportRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {    requestService.getMyRequests()
      .then(setRequests)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats = {
    total: requests.length,
    active: requests.filter((r) => ['accepted', 'in_progress'].includes(r.status)).length,
    completed: requests.filter((r) => r.status === 'completed').length,
    pending: requests.filter((r) => r.status === 'pending').length,
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Good morning, {user?.full_name?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-500 mt-1">Here&apos;s an overview of your transport activity.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Requests', value: stats.total, icon: ClipboardList, color: 'bg-brand-50 text-brand-600' },
          { label: 'Active Jobs',    value: stats.active, icon: Truck,         color: 'bg-blue-50 text-blue-600' },
          { label: 'Completed',      value: stats.completed, icon: TrendingUp, color: 'bg-emerald-50 text-emerald-600' },
          { label: 'Pending',        value: stats.pending, icon: Search,       color: 'bg-amber-50 text-amber-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} mb-3`}>
              <Icon className="h-5 w-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <Link
          href="/dashboard/client/search"
          className="card hover:shadow-md transition-all border-2 border-dashed border-brand-200 hover:border-brand-400 flex items-center gap-4 group"
        >
          <div className="bg-brand-100 group-hover:bg-brand-600 p-3 rounded-xl transition-colors">
            <Search className="h-6 w-6 text-brand-600 group-hover:text-white" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Find a Driver</p>
            <p className="text-sm text-gray-500">Search available trucks for your route</p>
          </div>
          <ArrowRight className="h-5 w-5 text-gray-400 ml-auto" />
        </Link>
        <Link
          href="/dashboard/client/requests"
          className="card hover:shadow-md transition-all flex items-center gap-4 group"
        >
          <div className="bg-gray-100 group-hover:bg-gray-900 p-3 rounded-xl transition-colors">
            <ClipboardList className="h-6 w-6 text-gray-600 group-hover:text-white" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">View All Requests</p>
            <p className="text-sm text-gray-500">Track status of your shipments</p>
          </div>
          <ArrowRight className="h-5 w-5 text-gray-400 ml-auto" />
        </Link>
      </div>

      {/* Recent Requests */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-gray-900">Recent Requests</h2>
          <Link href="/dashboard/client/requests" className="text-sm text-brand-600 hover:underline">
            View all
          </Link>
        </div>
        {loading ? (
          <LoadingSpinner text="Loading requests..." />
        ) : requests.length === 0 ? (
          <div className="text-center py-10">
            <Truck className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No requests yet.</p>
            <Link href="/dashboard/client/search" className="btn-primary text-sm mt-4 inline-block">
              Create your first request
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.slice(0, 5).map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">
                    {r.departure_location} → {r.destination}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(r.scheduled_date).toLocaleDateString()} · {r.estimated_price.toFixed(0)} MAD
                  </p>
                </div>
                <StatusBadge status={r.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
