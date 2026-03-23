'use client';

import { useEffect, useState } from 'react';
import { driverService, requestService } from '@/lib/services';
import { TransportRequest } from '@/types';
import StatusBadge from '@/components/StatusBadge';
import LoadingSpinner from '@/components/LoadingSpinner';
import { ClipboardList, MapPin, Calendar, Star, Navigation, Loader2 } from 'lucide-react';

export default function DriverJobsPage() {
  const [jobs, setJobs] = useState<TransportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [arriving, setArriving] = useState<number | null>(null);

  useEffect(() => {    driverService.getMyJobs()
      .then(setJobs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const markArrived = async (id: number) => {
    setArriving(id);    try {
      const updated = await requestService.arrived(id);
      setJobs((prev) => prev.map((j) => (j.id === id ? updated : j)));
    } catch {
      // mark-arrived failed silently
    } finally {
      setArriving(null);
    }
  };

  const active = jobs.filter((j) => ['accepted', 'in_progress'].includes(j.status));
  const completed = jobs.filter((j) => j.status === 'completed');

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Jobs</h1>
        <p className="text-gray-500 mt-1">Assigned and completed transport jobs</p>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : jobs.length === 0 ? (
        <div className="card text-center py-16">
          <ClipboardList className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No jobs yet. Accept requests to get started.</p>
        </div>
      ) : (
        <>          {active.length > 0 && (
            <section className="mb-8">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                🚛 Active Jobs
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">{active.length}</span>
              </h2>
              <div className="space-y-4">
                {active.map((j) => (
                  <JobCard
                    key={j.id}
                    job={j}
                    onMarkArrived={j.status === 'accepted' ? () => markArrived(j.id) : undefined}
                    arriving={arriving === j.id}
                  />
                ))}
              </div>
            </section>
          )}

          {completed.length > 0 && (
            <section>
              <h2 className="font-semibold text-gray-900 mb-4">✅ Completed</h2>
              <div className="space-y-3">
                {completed.map((j) => <JobCard key={j.id} job={j} compact />)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function JobCard({
  job: j,
  compact = false,
  onMarkArrived,
  arriving = false,
}: {
  job: TransportRequest;
  compact?: boolean;
  onMarkArrived?: () => void;
  arriving?: boolean;
}) {
  return (
    <div className={`card ${compact ? '' : 'border-l-4 border-l-blue-400'}`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="h-4 w-4 text-brand-500 shrink-0" />
            <span className="font-semibold text-gray-900 text-sm">
              {j.departure_location} → {j.destination}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(j.scheduled_date).toLocaleDateString()}
            </span>
            <span>{j.load_weight_tons} tons</span>
          </div>
          {j.load_description && !compact && (
            <p className="text-xs text-gray-400 mt-1.5 italic">&ldquo;{j.load_description}&rdquo;</p>
          )}
          {/* Show client review if present */}
          {j.review_rating && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 shrink-0" />
              <span className="font-semibold">{j.review_rating.toFixed(1)}</span>
              {j.review_comment && (
                <span className="text-gray-500 truncate max-w-[200px]">&ldquo;{j.review_comment}&rdquo;</span>
              )}
            </div>
          )}
        </div>
        <div className="text-right shrink-0 ml-4">
          <div className="flex items-center gap-1 text-emerald-600 font-bold justify-end mb-1">
            <span>{j.estimated_price.toFixed(0)}</span>
            <span className="text-xs font-semibold">MAD</span>
          </div>
          <StatusBadge status={j.status} />
        </div>
      </div>

      {/* Mark Arrived button for accepted jobs */}
      {onMarkArrived && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <button
            onClick={onMarkArrived}
            disabled={arriving}
            className="btn-primary text-sm flex items-center gap-2 w-full justify-center"
          >
            {arriving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Navigation className="h-4 w-4" />
            )}
            Mark as Arrived
          </button>
        </div>
      )}
    </div>
  );
}
