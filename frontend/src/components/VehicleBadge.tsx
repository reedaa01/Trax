import { VehicleType } from '@/types';

const labels: Record<VehicleType, string> = {
  pickup:     '🚗 Pickup',
  van:        '🚐 Van',
  truck:      '🚚 Truck',
  semi_truck: '🚛 Semi Truck',
  flatbed:    '🏗️ Flatbed',
};

export default function VehicleBadge({ type }: { type: VehicleType }) {
  return (
    <span className="badge bg-gray-100 text-gray-700 text-xs">
      {labels[type] ?? type}
    </span>
  );
}
