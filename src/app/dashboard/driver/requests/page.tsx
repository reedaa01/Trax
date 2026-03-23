'use client';

import { useEffect, useState } from 'react';
import { driverService, requestService } from '@/lib/services';
import { TransportRequest } from '@/types';
import StatusBadge from '@/components/StatusBadge';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Bell, CheckCircle2, XCircle, MapPin, Calendar, Loader2, Weight, Navigation } from 'lucide-react';

export default function DriverRequestsPage() {
  const [requests, setRequests] = useState<TransportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<number | null>(null);
  const [arriving, setArriving] = useState<number | null>(null);

  useEffect(() => {    driverService.getIncomingRequests()
      .then(setRequests)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const markArrived = async (id: number) => {
    setArriving(id);    try {
      const updated = await requestService.arrived(id);
      setRequests((prev) => prev.map((r) => (r.id === id ? updated : r)));
    } catch {
      // mark-arrived failed silently
    } finally {
      setArriving(null);
    }
  };

  const respond = async (id: number, action: 'accept' | 'reject') => {
    setActing(id);    try {
      const updated = await requestService.respond(id, action);
      setRequests((prev) => prev.map((r) => (r.id === id ? updated : r)));
    } catch {
      // respond failed silently
    } finally {
      setActing(null);
    }
  };

  const pending = requests.filter((r) => r.status === 'pending');
  const others = requests.filter((r) => r.status !== 'pending');

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Transport Requests</h1>
        <p className="text-gray-500 mt-1">Accept or reject incoming jobs</p>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          {/* Pending Requests */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="h-5 w-5 text-amber-500" />
              <h2 className="font-semibold text-gray-900">Pending</h2>
              {pending.length > 0 && (
                <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  {pending.length}
                </span>
              )}
            </div>

            {pending.length === 0 ? (
              <div className="card text-center py-10 text-gray-400">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No pending requests</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pending.map((r) => (
                  <div key={r.id} className="card border-l-4 border-l-amber-400">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <MapPin className="h-4 w-4 text-brand-500 shrink-0" />
                          <span className="font-semibold text-gray-900 text-sm">
                            {r.departure_location} → {r.destination}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1.5">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(r.scheduled_date).toLocaleDateString('en-US', {
                              weekday: 'short', month: 'short', day: 'numeric',
                            })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Weight className="h-3.5 w-3.5" />
                            {r.load_weight_tons} tons
                          </span>
                        </div>
                        {r.load_description && (
                          <p className="text-xs text-gray-500 mt-1.5 italic">&ldquo;{r.load_description}&rdquo;</p>
                        )}
                      </div>
                      <div className="text-right shrink-0">                        <div className="flex items-center gap-1 text-emerald-600 font-bold justify-end">
                          <span className="text-xl">{r.estimated_price.toFixed(0)}</span>
                          <span className="text-sm font-semibold">MAD</span>
                        </div>
                        <StatusBadge status={r.status} />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => respond(r.id, 'accept')}
                        disabled={acting === r.id}
                        className="btn-success text-sm flex items-center gap-2 flex-1 justify-center"
                      >
                        {acting === r.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                        Accept Job
                      </button>
                      <button
                        onClick={() => respond(r.id, 'reject')}
                        disabled={acting === r.id}
                        className="btn-danger text-sm flex items-center gap-2 flex-1 justify-center"
                      >
                        <XCircle className="h-4 w-4" />
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>          {/* Other Requests */}
          {others.length > 0 && (
            <section>
              <h2 className="font-semibold text-gray-900 mb-4">History</h2>
              <div className="space-y-3">
                {others.map((r) => (
                  <div key={r.id} className={`card ${r.status === 'accepted' ? 'border-l-4 border-l-blue-400' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {r.departure_location} → {r.destination}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {new Date(r.scheduled_date).toLocaleDateString()} · {r.estimated_price.toFixed(0)} MAD
                        </p>
                      </div>
                      <StatusBadge status={r.status} />
                    </div>
                    {r.status === 'accepted' && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <button
                          onClick={() => markArrived(r.id)}
                          disabled={arriving === r.id}
                          className="btn-primary text-sm flex items-center gap-2 w-full justify-center"
                        >
                          {arriving === r.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Navigation className="h-4 w-4" />
                          )}
                          Mark as Arrived
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
