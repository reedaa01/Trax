'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { adminService } from '@/lib/services';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Truck, ToggleLeft, ToggleRight, Star } from 'lucide-react';

interface AdminDriver {
  id: number;
  user_id: number;
  email: string;
  full_name: string;
  phone?: string;
  city?: string;
  vehicle_type: string;
  vehicle_plate?: string;
  vehicle_capacity_tons: number;
  is_available: boolean;
  rating: number;
  total_jobs: number;
  created_at?: string;
}

const VEHICLE_LABELS: Record<string, string> = {
  pickup:     'Pickup',
  van:        'Van',
  truck:      'Truck',
  semi_truck: 'Semi-Truck',
  flatbed:    'Flatbed',
};

export default function AdminDriversPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [drivers, setDrivers] = useState<AdminDriver[]>([]);
  const [fetching, setFetching] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!loading && user?.role !== 'admin') router.replace('/auth/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.role === 'admin') {
      adminService.getDrivers()
        .then(setDrivers)
        .finally(() => setFetching(false));
    }
  }, [user]);

  const handleToggle = async (driverId: number) => {
    const res = await adminService.toggleDriverAvailability(driverId);
    setDrivers(prev =>
      prev.map(d => d.id === driverId ? { ...d, is_available: res.is_available } : d)
    );
  };

  const filtered = search
    ? drivers.filter(d =>
        d.full_name.toLowerCase().includes(search.toLowerCase()) ||
        d.city?.toLowerCase().includes(search.toLowerCase()) ||
        d.email.toLowerCase().includes(search.toLowerCase())
      )
    : drivers;

  if (loading || fetching) return <LoadingSpinner />;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-amber-100 rounded-xl">
          <Truck className="h-6 w-6 text-amber-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Drivers</h1>
          <p className="text-sm text-gray-500">
            {drivers.filter(d => d.is_available).length} active · {drivers.length} total
          </p>
        </div>
      </div>

      <input
        type="text"
        placeholder="Search driver, city or email…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full max-w-sm border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
      />

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Driver</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">City</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Vehicle</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Capacity</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Rating</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Jobs</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Available</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(d => (
                <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{d.full_name}</p>
                    <p className="text-xs text-gray-400">{d.email}</p>
                    {d.vehicle_plate && (
                      <p className="text-xs text-gray-400 font-mono">{d.vehicle_plate}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{d.city || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                      {VEHICLE_LABELS[d.vehicle_type] ?? d.vehicle_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{d.vehicle_capacity_tons} t</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-amber-500 font-medium">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      {d.rating.toFixed(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{d.total_jobs}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggle(d.id)}
                      className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
                        d.is_available
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {d.is_available
                        ? <><ToggleRight className="h-3.5 w-3.5" /> Available</>
                        : <><ToggleLeft  className="h-3.5 w-3.5" /> Offline</>
                      }
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                    No drivers found.
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
