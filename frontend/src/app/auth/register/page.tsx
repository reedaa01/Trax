'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Truck, User, Loader2, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { RegisterRequest, UserRole } from '@/types';
import CityAutocomplete from '@/components/CityAutocomplete';
import { MOROCCAN_CITIES } from '@/lib/moroccan-cities';

const schema = z.object({
  full_name:             z.string().min(2, 'Name must be at least 2 characters'),
  email:                 z.string().email('Invalid email address'),
  password:              z.string().min(8, 'Password must be at least 8 characters'),
  phone:                 z.string().min(10, 'Enter a valid phone number'),
  role:                  z.enum(['client', 'driver']),
  vehicle_type:          z.string().optional(),
  vehicle_plate:         z.string().optional(),
  vehicle_capacity_tons: z.string().optional(),
}).superRefine((val, ctx) => {
  if (val.role === 'driver') {
    if (!val.vehicle_type)  ctx.addIssue({ path: ['vehicle_type'],  code: 'custom', message: 'Select a vehicle type' });
    if (!val.vehicle_plate) ctx.addIssue({ path: ['vehicle_plate'], code: 'custom', message: 'Enter your vehicle plate' });
  }
});

type FormValues = z.infer<typeof schema>;

function RegisterForm() {
  const { register: registerUser } = useAuth();
  const params = useSearchParams();
  const defaultRole = (params.get('role') as UserRole) || 'client';
  const [apiError, setApiError] = useState('');
  const [driverCity, setDriverCity] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: { role: defaultRole, phone: '+212' },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: FormValues) => {
    setApiError('');
    try {
      const payload: RegisterRequest = {
        full_name: data.full_name,
        email:     data.email,
        password:  data.password,
        phone:     data.phone,
        role:      data.role,
        ...(data.role === 'driver' && {
          vehicle_type:          data.vehicle_type,
          vehicle_plate:         data.vehicle_plate,
          vehicle_capacity_tons: data.vehicle_capacity_tons
            ? parseFloat(data.vehicle_capacity_tons)
            : 5.0,
          ...(driverCity && (() => {
            const city = MOROCCAN_CITIES.find((c) => c.name === driverCity);
            return city
              ? { city: city.name, city_lat: city.lat, city_lng: city.lng }
              : { city: driverCity };
          })()),
        }),
      };
      await registerUser(payload);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setApiError(e?.response?.data?.detail || 'Registration failed. Try again.');
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="card shadow-xl">
        <div className="flex items-center gap-2 mb-8">
          <div className="bg-brand-600 p-2 rounded-xl">
            <Truck className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-bold">Tra<span className="text-brand-600">X</span></span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">Create your account</h1>
        <p className="text-gray-500 text-sm mb-6">Join TraX - it is free to get started</p>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {(['client', 'driver'] as UserRole[]).map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setValue('role', role)}
              className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-sm font-medium ${
                selectedRole === role
                  ? 'border-brand-500 bg-brand-50 text-brand-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'
              }`}
            >
              {role === 'client' ? <User className="h-4 w-4" /> : <Truck className="h-4 w-4" />}
              {role === 'client' ? "I'm a Client" : "I'm a Driver"}
              {selectedRole === role && <CheckCircle className="h-4 w-4 ml-auto text-brand-600" />}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register('role')} />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
            <input {...register('full_name')} className="input-field" placeholder="Youssef El Amrani" />
            {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input {...register('email')} type="email" className="input-field" placeholder="you@example.ma" />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Phone number <span className="text-red-500">*</span>
            </label>
            <input {...register('phone')} type="tel" className="input-field" placeholder="+212 6XX XXX XXX" />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <input {...register('password')} type="password" className="input-field" placeholder="........" />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          {selectedRole === 'driver' && (
            <div className="space-y-4 pt-2 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                <Truck className="h-3.5 w-3.5" /> Vehicle Information
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Vehicle type</label>
                <select {...register('vehicle_type')} className="input-field">
                  <option value="">Select type...</option>
                  <option value="pickup">Pickup</option>
                  <option value="van">Van</option>
                  <option value="truck">Truck</option>
                  <option value="semi_truck">Semi-truck</option>
                  <option value="flatbed">Flatbed</option>
                </select>
                {errors.vehicle_type && <p className="text-red-500 text-xs mt-1">{errors.vehicle_type.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Vehicle plate</label>
                <input {...register('vehicle_plate')} className="input-field" placeholder="e.g. 12345-A-1" />
                {errors.vehicle_plate && <p className="text-red-500 text-xs mt-1">{errors.vehicle_plate.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Home city <span className="text-red-500">*</span>
                  <span className="text-gray-400 font-normal ml-1 text-xs">(used to match nearby clients)</span>
                </label>
                <CityAutocomplete
                  value={driverCity}
                  onChange={setDriverCity}
                  placeholder="Search your city..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Capacity (tons)</label>
                <input
                  {...register('vehicle_capacity_tons')}
                  type="number" min="0.5" max="40" step="0.5"
                  className="input-field" placeholder="e.g. 10"
                />
              </div>
            </div>
          )}

          {apiError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {apiError}
            </div>
          )}

          <button type="submit" disabled={isSubmitting} className="btn-primary w-full flex items-center justify-center gap-2">
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Create Account
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-brand-600 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="w-full max-w-md card shadow-xl h-96 animate-pulse" />}>
      <RegisterForm />
    </Suspense>
  );
}