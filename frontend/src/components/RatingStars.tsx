import { Star } from 'lucide-react';

export default function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
      <span className="text-sm font-semibold text-gray-800">{rating.toFixed(1)}</span>
    </div>
  );
}
