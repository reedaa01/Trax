'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { adminService } from '@/lib/services';
import LoadingSpinner from '@/components/LoadingSpinner';
import StatusBadge from '@/components/StatusBadge';
import { ClipboardList } from 'lucide-react';

interface AdminRequest {
  id: number;
  client_id: number;
  driver_id?: number;
  departure_location: string;
  destination: string;
  scheduled_date: string;
  status: string;
  estimated_price: number;
  final_price?: number;
  created_at?: string;
  client_name?: string;
  driver_name?: string;
}

const STATUS_OPTIONS = ['', 'pending', 'accepted', 'in_progress', 'completed', 'rejected', 'cancelled'];

export default function AdminRequestsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<AdminRequest[]>([]);
  const [fetching, setFetching] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!loading && user?.role !== 'admin') router.replace('/auth/login');
  }, [user, loading, router]);

  const load = () => {
    setFetching(true);
    adminService.getRequests(statusFilter || undefined)
      .then(setRequests)
      .finally(() => setFetching(false));
  };

  useEffect(() => {
    if (user?.role === 'admin') load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, statusFilter]);

  const filtered = search
    ? requests.filter(r =>
        r.departure_location.toLowerCase().includes(search.toLowerCase()) ||
        r.destination.toLowerCase().includes(search.toLowerCase()) ||
        r.client_name?.toLowerCase().includes(search.toLowerCase()) ||
        r.driver_name?.toLowerCase().includes(search.toLowerCase())
      )
    : requests;

  if (loading || fetching) return <LoadingSpinner />;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-brand-100 rounded-xl">
          <ClipboardList className="h-6 w-6 text-brand-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Requests</h1>
          <p className="text-sm text-gray-500">{requests.length} transport requests</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search route, client or driver…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                statusFilter === s
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-brand-400'
              }`}
            >
              {s === '' ? 'All' : s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">ID</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Route</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Client</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Driver</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Price</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-400">#{r.id}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 truncate max-w-[180px]">
                      {r.departure_location}
                    </p>
                    <p className="text-xs text-gray-400 truncate max-w-[180px]">→ {r.destination}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{r.client_name ?? `#${r.client_id}`}</td>
                  <td className="px-4 py-3 text-gray-600">{r.driver_name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={r.status as any} />
                  </td>
                  <td className="px-4 py-3 text-gray-700 font-medium">
                    {r.final_price != null
                      ? `${r.final_price.toFixed(0)} MAD`
                      : `~${r.estimated_price.toFixed(0)} MAD`}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                    No requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
