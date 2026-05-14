// Moroccan cities with coordinates (lat, lng)
export interface MoroccanCity {
  name: string;
  lat: number;
  lng: number;
  region: string;
}

export const MOROCCAN_CITIES: MoroccanCity[] = [
  { name: 'Casablanca',    lat: 33.5731,  lng: -7.5898,  region: 'Casablanca-Settat' },
  { name: 'Rabat',         lat: 34.0209,  lng: -6.8416,  region: 'Rabat-Salé-Kénitra' },
  { name: 'Marrakech',     lat: 31.6295,  lng: -7.9811,  region: 'Marrakech-Safi' },
  { name: 'Fès',           lat: 34.0181,  lng: -5.0078,  region: 'Fès-Meknès' },
  { name: 'Tanger',        lat: 35.7595,  lng: -5.8340,  region: 'Tanger-Tétouan-Al Hoceïma' },
  { name: 'Agadir',        lat: 30.4278,  lng: -9.5981,  region: 'Souss-Massa' },
  { name: 'Meknès',        lat: 33.8935,  lng: -5.5473,  region: 'Fès-Meknès' },
  { name: 'Oujda',         lat: 34.6814,  lng: -1.9086,  region: 'Oriental' },
  { name: 'Kenitra',       lat: 34.2610,  lng: -6.5802,  region: 'Rabat-Salé-Kénitra' },
  { name: 'Tétouan',       lat: 35.5785,  lng: -5.3684,  region: 'Tanger-Tétouan-Al Hoceïma' },
  { name: 'Safi',          lat: 32.2994,  lng: -9.2372,  region: 'Marrakech-Safi' },
  { name: 'Mohammedia',    lat: 33.6861,  lng: -7.3836,  region: 'Casablanca-Settat' },
  { name: 'Khouribga',     lat: 32.8811,  lng: -6.9063,  region: 'Béni Mellal-Khénifra' },
  { name: 'El Jadida',     lat: 33.2316,  lng: -8.5007,  region: 'Casablanca-Settat' },
  { name: 'Béni Mellal',   lat: 32.3373,  lng: -6.3498,  region: 'Béni Mellal-Khénifra' },
  { name: 'Nador',         lat: 35.1740,  lng: -2.9287,  region: 'Oriental' },
  { name: 'Taza',          lat: 34.2100,  lng: -4.0100,  region: 'Fès-Meknès' },
  { name: 'Settat',        lat: 33.0011,  lng: -7.6197,  region: 'Casablanca-Settat' },
  { name: 'Sidi Kacem',    lat: 34.2237,  lng: -5.7099,  region: 'Rabat-Salé-Kénitra' },
  { name: 'Khémisset',     lat: 33.8243,  lng: -6.0656,  region: 'Rabat-Salé-Kénitra' },
  { name: 'Guelmim',       lat: 28.9870,  lng: -10.0574, region: 'Guelmim-Oued Noun' },
  { name: 'Laâyoune',      lat: 27.1536,  lng: -13.2033, region: 'Laâyoune-Sakia El Hamra' },
  { name: 'Dakhla',        lat: 23.6848,  lng: -15.9572, region: 'Dakhla-Oued Ed-Dahab' },
  { name: 'Ouarzazate',    lat: 30.9335,  lng: -6.9370,  region: 'Drâa-Tafilalet' },
  { name: 'Errachidia',    lat: 31.9314,  lng: -4.4249,  region: 'Drâa-Tafilalet' },
  { name: 'Zagora',        lat: 30.3300,  lng: -5.8380,  region: 'Drâa-Tafilalet' },
  { name: 'Ifrane',        lat: 33.5228,  lng: -5.1128,  region: 'Fès-Meknès' },
  { name: 'Al Hoceïma',    lat: 35.2517,  lng: -3.9372,  region: 'Tanger-Tétouan-Al Hoceïma' },
  { name: 'Larache',       lat: 35.1932,  lng: -6.1561,  region: 'Tanger-Tétouan-Al Hoceïma' },
  { name: 'Essaouira',     lat: 31.5084,  lng: -9.7595,  region: 'Marrakech-Safi' },
];

// Morocco bounding box for map restriction
export const MOROCCO_BOUNDS: [[number, number], [number, number]] = [
  [20.7, -17.5], // SW corner
  [36.1,  -0.9], // NE corner
];

// Morocco center
export const MOROCCO_CENTER: [number, number] = [31.7917, -7.0926];
export const MOROCCO_DEFAULT_ZOOM = 5;

/** Calculate distance between two lat/lng points (Haversine formula) in km */
export function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
