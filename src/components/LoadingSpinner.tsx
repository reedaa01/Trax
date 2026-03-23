import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      <p className="text-gray-500 text-sm">{text}</p>
    </div>
  );
}
