'use client';

import { useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import dynamic from 'next/dynamic';
import {
  Search, MapPin, Calendar, Loader2,
  Truck, CheckCircle, Weight, Navigation, Building2,
} from 'lucide-react';
import { searchService, requestService } from '@/lib/services';
import { DriverSearchResult, VehicleType, SearchParams } from '@/types';
import VehicleBadge from '@/components/VehicleBadge';
import RatingStars from '@/components/RatingStars';
import CityAutocomplete from '@/components/CityAutocomplete';
import type { MapSelection } from '@/components/MoroccoMap';
import { haversineDistance } from '@/lib/moroccan-cities';

const MoroccoMap = dynamic(() => import('@/components/MoroccoMap'), { ssr: false });

const schema = z.object({
  departure_location: z.string().min(2, 'Enter departure location'),
  destination:        z.string().min(2, 'Enter destination'),
  scheduled_date:     z.string().min(1, 'Pick a date'),
  vehicle_type:       z.string().optional(),
  load_weight_tons:   z.string().optional(),
});

type SearchFormValues = z.infer<typeof schema>;

export default function SearchPage() {
  const [results,      setResults]      = useState<DriverSearchResult[]>([]);
  const [searched,     setSearched]     = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [requesting,   setRequesting]   = useState<number | null>(null);
  const [success,      setSuccess]      = useState<number | null>(null);
  const [searchData,   setSearchData]   = useState<SearchFormValues | null>(null);
  const [mapSelection, setMapSelection] = useState<MapSelection>({
    departure: null, destination: null, distanceKm: null,
  });

  const { register, handleSubmit, setValue, watch, formState: { errors } } =
    useForm<SearchFormValues>({ resolver: zodResolver(schema) });

  const watchedDep  = watch('departure_location');
  const watchedDest = watch('destination');

  const handleMapSelection = (sel: MapSelection) => {
    setMapSelection(sel);
    if (sel.departure)   setValue('departure_location', sel.departure.name,   { shouldValidate: true });
    if (sel.destination) setValue('destination',        sel.destination.name, { shouldValidate: true });
  };

  const onSearch = async (data: SearchFormValues) => {
    setLoading(true);
    setSearched(false);
    setSearchData(data);
    try {
      const params: SearchParams = {
        departure_location: data.departure_location,
        destination:        data.destination,
        scheduled_date:     data.scheduled_date,
        vehicle_type:       data.vehicle_type,
        load_weight_tons:   data.load_weight_tons ? parseFloat(data.load_weight_tons) : undefined,
        // Pass real map coordinates so the ML model gets accurate distances
        departure_lat:   mapSelection.departure?.lat   ?? undefined,
        departure_lng:   mapSelection.departure?.lng   ?? undefined,
        destination_lat: mapSelection.destination?.lat ?? undefined,
        destination_lng: mapSelection.destination?.lng ?? undefined,
        distance_km:     mapSelection.distanceKm       ?? undefined,
      };
      const res = await searchService.searchDrivers(params);
      setResults(res);
    } catch {
      setResults([]);
    } finally {
      setSearched(true);
      setLoading(false);
    }
  };

  const sendRequest = async (r: DriverSearchResult) => {
    if (!searchData) return;
    setRequesting(r.driver.id);
    try {
      await requestService.create({
        driver_id:             r.driver.id,
        departure_location:    searchData.departure_location,
        destination:           searchData.destination,
        scheduled_date:        searchData.scheduled_date,
        vehicle_type_required: (searchData.vehicle_type as VehicleType) || r.driver.vehicle_type,
        load_weight_tons:      searchData.load_weight_tons ? parseFloat(searchData.load_weight_tons) : 1,
        estimated_price:       r.estimated_price,
        load_description:      `Shipment from ${searchData.departure_location} to ${searchData.destination}`,
        departure_lat:   mapSelection.departure?.lat   ?? 0,
        departure_lng:   mapSelection.departure?.lng   ?? 0,
        destination_lat: mapSelection.destination?.lat ?? 0,
        destination_lng: mapSelection.destination?.lng ?? 0,
      });
      setSuccess(r.driver.id);
    } catch {
      // request failed silently
    } finally {
      setRequesting(null);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Find Transport</h1>
        <p className="text-gray-500 mt-1">Search available drivers for your Moroccan route</p>
      </div>

      {/* Interactive Morocco Map */}
      <div className="card mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-brand-500" />
          Select Route on Map
        </h2>
        <MoroccoMap
          onSelectionChange={handleMapSelection}
          initialDeparture={watchedDep}
          initialDestination={watchedDest}
        />
        {mapSelection.distanceKm !== null && (
          <div className="mt-3 flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
            <Navigation className="h-4 w-4 shrink-0" />
            Estimated route distance: <strong className="ml-1">{mapSelection.distanceKm} km</strong>
            <span className="text-emerald-500 text-xs">(straight line)</span>
          </div>
        )}
      </div>

      {/* Search form */}
      <div className="card mb-8">
        <form onSubmit={handleSubmit(onSearch)} className="space-y-4">
          {/* Row 1 - departure / destination */}
          <div className="grid sm:grid-cols-2 gap-4">
            <CityAutocomplete
              label="Departure"
              pinColor="blue"
              placeholder="e.g. Casablanca"
              value={watchedDep ?? ''}
              onChange={(v) => setValue('departure_location', v, { shouldValidate: true })}
              onCitySelect={(city) => {
                setValue('departure_location', city.name, { shouldValidate: true });
                const dest = mapSelection.destination;
                const dist = dest
                  ? Math.round(haversineDistance(city.lat, city.lng, dest.lat, dest.lng))
                  : null;
                setMapSelection((prev) => ({ ...prev, departure: city, distanceKm: dist }));
              }}
              error={errors.departure_location?.message}
              name="departure_location"
            />
            <CityAutocomplete
              label="Destination"
              pinColor="red"
              placeholder="e.g. Marrakech"
              value={watchedDest ?? ''}
              onChange={(v) => setValue('destination', v, { shouldValidate: true })}
              onCitySelect={(city) => {
                setValue('destination', city.name, { shouldValidate: true });
                const dep = mapSelection.departure;
                const dist = dep
                  ? Math.round(haversineDistance(dep.lat, dep.lng, city.lat, city.lng))
                  : null;
                setMapSelection((prev) => ({ ...prev, destination: city, distanceKm: dist }));
              }}
              error={errors.destination?.message}
              name="destination"
            />
          </div>

          {/* Row 2 - date / vehicle / weight */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Calendar className="inline h-4 w-4 mr-1 text-blue-500" />
                Date
              </label>
              <input
                {...register('scheduled_date')}
                type="date"
                min={today}
                className="input-field"
              />
              {errors.scheduled_date && (
                <p className="text-red-500 text-xs mt-1">{errors.scheduled_date.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Truck className="inline h-4 w-4 mr-1 text-blue-500" />
                Vehicle
              </label>
              <select {...register('vehicle_type')} className="input-field">
                <option value="">Any</option>
                <option value="pickup">Pickup</option>
                <option value="van">Van</option>
                <option value="truck">Truck</option>
                <option value="semi_truck">Semi Truck</option>
                <option value="flatbed">Flatbed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Weight className="inline h-4 w-4 mr-1 text-blue-500" />
                Load (tons)
              </label>
              <input
                {...register('load_weight_tons')}
                type="number"
                step="0.1"
                min="0.1"
                className="input-field"
                placeholder="e.g. 2.5"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full justify-center gap-2"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            {loading ? 'Searching...' : 'Search Available Drivers'}
          </button>
        </form>
      </div>

      {/* Results */}
      {searched && (
        <div>
          <h2 className="font-semibold text-gray-900 mb-4">
            {results.length > 0
              ? `${results.length} driver${results.length !== 1 ? 's' : ''} found`
              : 'No drivers found for this route'}
          </h2>

          {results.length === 0 && (
            <div className="card text-center py-12">
              <Truck className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No available drivers match your criteria.</p>
              <p className="text-sm text-gray-400 mt-1">Try a different date or vehicle type.</p>
            </div>
          )}

          <div className="space-y-4">
            {results.map((r) => (
              <div key={r.driver.id} className="card">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
                      {r.driver.full_name[0]}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{r.driver.full_name}</h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <RatingStars rating={r.driver.rating} />
                        <VehicleBadge type={r.driver.vehicle_type} />
                        <span className="text-xs text-gray-500">{r.driver.total_jobs} jobs</span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-gray-500">
                        {r.driver.city && (
                          <span className="flex items-center gap-1 text-brand-600 font-medium">
                            <Building2 className="h-3 w-3" />
                            {r.driver.city}
                          </span>
                        )}
                        <span>{r.estimated_distance_km.toFixed(0)} km</span>
                        <span>{r.driver.vehicle_capacity_tons}t max</span>
                        <span>{r.driver.vehicle_plate}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-0.5 justify-end text-emerald-600 mb-0.5">
                      <span className="text-xl font-bold">{r.estimated_price.toFixed(0)}</span>
                      <span className="text-sm font-semibold ml-1">MAD</span>
                    </div>
                    <p className="text-xs text-gray-400 mb-2">Est. price</p>
                    {success === r.driver.id ? (
                      <span className="flex items-center gap-1 text-emerald-600 text-sm font-medium">
                        <CheckCircle className="h-4 w-4" /> Sent!
                      </span>
                    ) : (
                      <button
                        onClick={() => sendRequest(r)}
                        disabled={requesting === r.driver.id}
                        className="btn-primary text-sm gap-2"
                      >
                        {requesting === r.driver.id && (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        )}
                        Send Request
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">Match score</span>
                    <span className="font-medium text-blue-600">
                      {(r.recommendation_score * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${r.recommendation_score * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}