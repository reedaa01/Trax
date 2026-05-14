'use client';

import { useState } from 'react';
import { Star, X, Loader2, Send } from 'lucide-react';
import { requestService } from '@/lib/services';
import { TransportRequest } from '@/types';

interface ReviewModalProps {
  request: TransportRequest;
  onClose: () => void;
  onSubmitted: (updated: TransportRequest) => void;
}

export default function ReviewModal({ request: r, onClose, onSubmitted }: ReviewModalProps) {
  const [rating,    setRating]    = useState(0);
  const [hovered,   setHovered]   = useState(0);
  const [comment,   setComment]   = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');

  const active = hovered || rating;

  const labels: Record<number, string> = {
    1: 'Poor',
    2: 'Fair',
    3: 'Good',
    4: 'Very good',
    5: 'Excellent',
  };

  const handleSubmit = async () => {
    if (rating === 0) { setError('Please select a star rating.'); return; }
    setError('');
    setLoading(true);
    try {
      const updated = await requestService.review(r.id, rating, comment || undefined);
      onSubmitted(updated);
      onClose();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setError(e?.response?.data?.detail || 'Failed to submit review.');
    } finally {
      setLoading(false);
    }
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      {/* Panel */}
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="mb-5">
          <h2 className="text-lg font-bold text-gray-900">Rate your trip</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {r.departure_location} → {r.destination}
            {r.driver && (
              <span className="ml-2 font-medium text-gray-700">· {r.driver.full_name}</span>
            )}
          </p>
        </div>

        {/* Stars */}
        <div className="flex items-center justify-center gap-2 mb-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHovered(n)}
              onMouseLeave={() => setHovered(0)}
              className="transition-transform hover:scale-110 focus:outline-none"
            >
              <Star
                className={`h-9 w-9 transition-colors ${
                  n <= active
                    ? 'fill-amber-400 text-amber-400'
                    : 'fill-gray-100 text-gray-300'
                }`}
              />
            </button>
          ))}
        </div>
        <p className="text-center text-sm font-semibold text-amber-600 h-5 mb-4">
          {active > 0 ? labels[active] : ''}
        </p>

        {/* Comment */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Comment <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            rows={3}
            maxLength={400}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share details about your experience…"
            className="input-field resize-none"
          />
          <p className="text-xs text-gray-400 text-right mt-1">{comment.length}/400</p>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || rating === 0}
            className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Submit review
          </button>
        </div>
      </div>
    </div>
  );
}
