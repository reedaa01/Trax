import clsx from 'clsx';
import { RequestStatus } from '@/types';

const statusConfig: Record<RequestStatus, { label: string; classes: string }> = {
  pending:     { label: 'Pending',     classes: 'bg-yellow-100 text-yellow-700' },
  accepted:    { label: 'Accepted',    classes: 'bg-blue-100 text-blue-700' },
  rejected:    { label: 'Rejected',    classes: 'bg-red-100 text-red-700' },
  in_progress: { label: 'In Progress', classes: 'bg-purple-100 text-purple-700' },
  completed:   { label: 'Completed',   classes: 'bg-green-100 text-green-700' },
  cancelled:   { label: 'Cancelled',   classes: 'bg-gray-100 text-gray-600' },
};

export default function StatusBadge({ status }: { status: RequestStatus }) {
  const config = statusConfig[status];
  return (
    <span className={clsx('badge', config.classes)}>
      {config.label}
    </span>
  );
}
