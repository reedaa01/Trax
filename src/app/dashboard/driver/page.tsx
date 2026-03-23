'use client';

import { useEffect, useState } from 'react';
import { driverService } from '@/lib/services';
import { DriverProfile, TransportRequest } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Truck, Bell, CheckCircle2, Clock, ToggleLeft, ToggleRight, TrendingUp } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import RatingStars from '@/components/RatingStars';
import VehicleBadge from '@/components/VehicleBadge';
import LoadingSpinner from '@/components/LoadingSpinner';
import Link from 'next/link';

export default function DriverDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [requests, setRequests] = useState<TransportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    Promise.all([
      driverService.getProfile(),
      driverService.getIncomingRequests(),
    ])      .then(([p, r]) => { setProfile(p); setRequests(r); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleAvailability = async () => {
    if (!profile) return;
    setToggling(true);    try {
      const updated = await driverService.setAvailability(!profile.is_available);
      setProfile(updated);
    } catch {
      // toggle failed silently — availability unchanged
    } finally {
      setToggling(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const pendingRequests = requests.filter((r) => r.status === 'pending');

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.full_name?.split(' ')[0]} 🚛
        </h1>
        <p className="text-gray-500 mt-1">Your driver control center</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Profile & availability */}
        <div className="space-y-4">
          <div className="card">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-full bg-brand-600 flex items-center justify-center text-white font-bold text-xl">
                {user?.full_name?.[0]}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{user?.full_name}</h3>
                {profile && <RatingStars rating={profile.rating} />}
              </div>
            </div>

            {profile && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Vehicle</span>
                  <VehicleBadge type={profile.vehicle_type} />
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Plate</span>
                  <span className="font-medium">{profile.vehicle_plate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Capacity</span>
                  <span className="font-medium">{profile.vehicle_capacity_tons} tons</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Jobs</span>
                  <span className="font-medium">{profile.total_jobs}</span>
                </div>
              </div>
            )}
          </div>

          {/* Availability Toggle */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3">Availability</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-semibold ${profile?.is_available ? 'text-emerald-600' : 'text-gray-500'}`}>
                  {profile?.is_available ? '🟢 Online' : '🔴 Offline'}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {profile?.is_available ? 'Accepting new requests' : 'Not accepting requests'}
                </p>
              </div>
              <button
                onClick={toggleAvailability}
                disabled={toggling}
                className={`transition-colors ${toggling ? 'opacity-50' : ''}`}
              >
                {profile?.is_available ? (
                  <ToggleRight className="h-9 w-9 text-emerald-500" />
                ) : (
                  <ToggleLeft className="h-9 w-9 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-brand-500" />
              <h3 className="font-semibold text-gray-900">Quick Stats</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-brand-50 rounded-xl p-3">
                <p className="text-2xl font-bold text-brand-700">{profile?.total_jobs ?? 0}</p>
                <p className="text-xs text-brand-600 mt-0.5">Jobs Done</p>
              </div>
              <div className="bg-amber-50 rounded-xl p-3">
                <p className="text-2xl font-bold text-amber-700">{pendingRequests.length}</p>
                <p className="text-xs text-amber-600 mt-0.5">Pending</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Incoming Requests */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-brand-500" />
                <h2 className="font-semibold text-gray-900">Incoming Requests</h2>
                {pendingRequests.length > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {pendingRequests.length}
                  </span>
                )}
              </div>
              <Link href="/dashboard/driver/requests" className="text-sm text-brand-600 hover:underline">
                View all
              </Link>
            </div>

            {pendingRequests.length === 0 ? (
              <div className="text-center py-12">
                <Truck className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No pending requests right now.</p>
                <p className="text-xs text-gray-400 mt-1">
                  {profile?.is_available ? 'Waiting for new jobs...' : 'Enable availability to receive requests.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRequests.slice(0, 4).map((r) => (
                  <RequestCard key={r.id} request={r} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function RequestCard({ request: r }: { request: TransportRequest }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-medium text-gray-900 text-sm">
            {r.departure_location} → {r.destination}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            <Clock className="inline h-3 w-3 mr-1" />
            {new Date(r.scheduled_date).toLocaleDateString()} · {r.load_weight_tons} tons
          </p>
        </div>
        <div className="text-right">
          <p className="text-emerald-600 font-bold text-sm">{r.estimated_price.toFixed(0)} MAD</p>
          <StatusBadge status={r.status} />
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <Link
          href="/dashboard/driver/requests"
          className="btn-success text-xs py-1.5 flex items-center gap-1"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          Respond
        </Link>
      </div>
    </div>
  );
}
