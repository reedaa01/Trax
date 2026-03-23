'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { requestService } from '@/lib/services';
import { TransportRequest } from '@/types';
import StatusBadge from '@/components/StatusBadge';
import VehicleBadge from '@/components/VehicleBadge';
import LoadingSpinner from '@/components/LoadingSpinner';
import { ClipboardList, MapPin, Calendar, Loader2, XCircle, Map, Star, PackageCheck, Phone } from 'lucide-react';
import ReviewModal from '@/components/ReviewModal';

const MoroccoMap = dynamic(() => import('@/components/MoroccoMap'), { ssr: false });

export default function ClientRequestsPage() {  const [requests, setRequests] = useState<TransportRequest[]>([]);
  const [loading, setLoading] = useState(true);  const [cancelling, setCancelling] = useState<number | null>(null);
  const [confirming, setConfirming] = useState<number | null>(null);
  const [expandedMap, setExpandedMap] = useState<number | null>(null);
  const [reviewingId, setReviewingId] = useState<number | null>(null);

  const fetchRequests = () => {
    setLoading(true);    requestService.getMyRequests()
      .then(setRequests)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchRequests(); }, []);
  const handleCancel = async (id: number) => {
    setCancelling(id);    try {
      const updated = await requestService.cancel(id);
      setRequests((prev) => prev.map((r) => (r.id === id ? updated : r)));
    } catch {
      // cancel failed silently — request state unchanged
    } finally {
      setCancelling(null);
    }
  };

  const handleConfirmDelivery = async (id: number) => {
    setConfirming(id);    try {
      const updated = await requestService.confirmDelivery(id);
      setRequests((prev) => prev.map((r) => (r.id === id ? updated : r)));
      // Auto-open review modal right after confirming
      setReviewingId(id);
    } catch {
      // confirm failed silently — request state unchanged
    } finally {
      setConfirming(null);
    }
  };
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Requests</h1>
        <p className="text-gray-500 mt-1">Track all your transport requests</p>
      </div>

      {/* Review modal */}
      {reviewingId !== null && (() => {
        const req = requests.find((r) => r.id === reviewingId);
        return req ? (
          <ReviewModal
            request={req}
            onClose={() => setReviewingId(null)}
            onSubmitted={(updated) => {
              setRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
              setReviewingId(null);
            }}
          />
        ) : null;
      })()}

      {loading ? (
        <LoadingSpinner />
      ) : requests.length === 0 ? (
        <div className="card text-center py-16">
          <ClipboardList className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">You haven&apos;t made any requests yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => (
            <div key={r.id} className="card hover:shadow-md transition-shadow">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="h-4 w-4 text-brand-500 shrink-0" />
                    <span className="font-semibold text-gray-900 text-sm">
                      {r.departure_location}
                    </span>
                    <span className="text-gray-400">→</span>
                    <span className="font-semibold text-gray-900 text-sm">{r.destination}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(r.scheduled_date).toLocaleDateString('en-US', {
                        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
                      })}
                    </span>
                    <VehicleBadge type={r.vehicle_type_required} />
                    <span>{r.load_weight_tons} tons</span>
                  </div>
                </div>
                <StatusBadge status={r.status} />
              </div>              {/* Driver Info */}
              {r.driver && (
                <div className="bg-gray-50 rounded-xl p-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-brand-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {r.driver.full_name[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900">{r.driver.full_name}</p>
                      <p className="text-xs text-gray-500">{r.driver.vehicle_plate}</p>
                    </div>
                    <span className="text-xs text-gray-400 hidden sm:block shrink-0">Assigned Driver</span>
                  </div>
                  {r.driver.phone && (
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                      <span className="text-xs text-gray-500 mr-auto font-medium">{r.driver.phone}</span>
                      {/* WhatsApp */}
                      <a
                        href={`https://wa.me/${r.driver.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs font-semibold text-white bg-[#25D366] hover:bg-[#1ebe59] transition-colors rounded-full px-3 py-1.5"
                      >
                        <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        WhatsApp
                      </a>
                      {/* Call */}
                      <a
                        href={`tel:${r.driver.phone}`}
                        className="flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 border border-brand-200 hover:border-brand-400 transition-colors rounded-full px-3 py-1.5"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        Call
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Review comment (if submitted) */}
              {r.review_rating && r.review_comment && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 mb-4 flex gap-2">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-amber-700 mb-0.5">Your review · {r.review_rating.toFixed(1)} stars</p>
                    <p className="text-sm text-gray-700 italic">&ldquo;{r.review_comment}&rdquo;</p>
                  </div>
                </div>
              )}

              {/* Expandable Route Map */}
              {expandedMap === r.id && (
                <div className="mb-4 rounded-xl overflow-hidden border border-gray-100">
                  <MoroccoMap
                    readonly
                    initialDeparture={r.departure_location}
                    initialDestination={r.destination}
                  />
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">                  <div className="flex items-center gap-1 text-emerald-600 font-bold">
                    <span>{r.estimated_price.toFixed(0)}</span>
                    <span className="text-xs font-semibold">MAD</span>
                    <span className="text-xs font-normal text-gray-400 ml-1">estimated</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExpandedMap(expandedMap === r.id ? null : r.id)}
                    className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium border border-brand-200 hover:border-brand-400 rounded-full px-2.5 py-1 transition-all"
                  >
                    <Map className="h-3.5 w-3.5" />
                    {expandedMap === r.id ? 'Hide map' : 'View map'}
                  </button>
                </div>                {r.status === 'pending' && (
                  <button
                    onClick={() => handleCancel(r.id)}
                    disabled={cancelling === r.id}
                    className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    {cancelling === r.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5" />
                    )}
                    Cancel
                  </button>
                )}

                {/* Confirm Delivery: in_progress */}
                {r.status === 'in_progress' && (
                  <button
                    onClick={() => handleConfirmDelivery(r.id)}
                    disabled={confirming === r.id}
                    className="flex items-center gap-1.5 text-sm text-emerald-600 hover:text-emerald-700 font-semibold border border-emerald-200 hover:border-emerald-400 rounded-full px-3 py-1 transition-all"
                  >
                    {confirming === r.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <PackageCheck className="h-3.5 w-3.5" />
                    )}
                    Confirm Delivery
                  </button>
                )}

                {/* Review: completed + not yet reviewed */}
                {r.status === 'completed' && !r.review_rating && (
                  <button
                    onClick={() => setReviewingId(r.id)}
                    className="flex items-center gap-1.5 text-sm text-amber-600 hover:text-amber-700 font-medium border border-amber-200 hover:border-amber-400 rounded-full px-3 py-1 transition-all"
                  >
                    <Star className="h-3.5 w-3.5" />
                    Write a review
                  </button>
                )}

                {/* Already reviewed badge */}
                {r.review_rating !== undefined && r.review_rating !== null && (
                  <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-full px-2.5 py-1">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <span className="font-semibold">{r.review_rating.toFixed(1)}</span>
                    <span className="text-amber-400 font-normal ml-0.5">· Reviewed</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
