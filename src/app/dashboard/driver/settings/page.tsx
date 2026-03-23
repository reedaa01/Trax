'use client';

import { useEffect, useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { driverService } from '@/lib/services';
import { DriverProfile, VehicleType } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Loader2, Save, Settings } from 'lucide-react';

const schema = z.object({
  vehicle_type: z.string(),
  vehicle_plate: z.string().min(2),
  vehicle_capacity_tons: z.coerce.number().min(0.1),
  phone: z.string().optional(),
});

type SettingsFormValues = z.infer<typeof schema>;

export default function DriverSettingsPage() {
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<SettingsFormValues>({ resolver: zodResolver(schema) as Resolver<SettingsFormValues> });

  useEffect(() => {
    driverService.getProfile()      .then((p) => {
        setProfile(p);
        reset({
          vehicle_type: p.vehicle_type,
          vehicle_plate: p.vehicle_plate,
          vehicle_capacity_tons: p.vehicle_capacity_tons,
          phone: p.phone,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [reset]);
  const onSubmit = async (data: SettingsFormValues) => {    try {
      const updated = await driverService.updateProfile(data as Partial<DriverProfile>);
      setProfile(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // update failed silently
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="h-6 w-6 text-brand-500" />
          Driver Settings
        </h1>
        <p className="text-gray-500 mt-1">Update your vehicle and profile information</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
            <input {...register('phone')} type="tel" className="input-field" placeholder="+1 555 000 0000" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Vehicle Type</label>
            <select {...register('vehicle_type')} className="input-field">
              {(['pickup', 'van', 'truck', 'semi_truck', 'flatbed'] as VehicleType[]).map((v) => (
                <option key={v} value={v}>
                  {v.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                </option>
              ))}
            </select>
            {errors.vehicle_type && <p className="text-red-500 text-xs mt-1">{String(errors.vehicle_type.message)}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Vehicle Plate</label>
            <input {...register('vehicle_plate')} className="input-field" placeholder="e.g. ABC-1234" />
            {errors.vehicle_plate && <p className="text-red-500 text-xs mt-1">{String(errors.vehicle_plate.message)}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Capacity (tons)</label>
            <input
              {...register('vehicle_capacity_tons')}
              type="number"
              step="0.5"
              min="0.1"
              className="input-field"
              placeholder="e.g. 5"
            />
            {errors.vehicle_capacity_tons && <p className="text-red-500 text-xs mt-1">{String(errors.vehicle_capacity_tons.message)}</p>}
          </div>

          {saved && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm">
              ✅ Profile updated successfully!
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Changes
          </button>
        </form>
      </div>

      {/* Current info */}
      {profile && (
        <div className="card mt-4">
          <h3 className="font-medium text-gray-900 mb-3 text-sm">Current Profile</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Rating</p>
              <p className="font-bold text-gray-900">⭐ {profile.rating.toFixed(1)}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Jobs Done</p>
              <p className="font-bold text-gray-900">{profile.total_jobs}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
