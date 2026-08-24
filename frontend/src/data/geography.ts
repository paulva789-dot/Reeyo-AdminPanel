// Where reeyo operates: the ten regions of Cameroon, the cities inside them,
// and the delivery zones inside those.
//
// Zones are neighbourhoods a rider actually works — the five Buea ones the
// console started with are still here, now under Southwest. Everything that
// carries a zone can therefore be rolled up to a city and a region without
// storing the same fact three times.

export const REGIONS = [
  'Adamawa',
  'Centre',
  'East',
  'Far North',
  'Littoral',
  'North',
  'Northwest',
  'South',
  'Southwest',
  'West',
] as const;

export type Region = (typeof REGIONS)[number];

interface CityDef {
  name: string;
  zones: readonly string[];
}

export const GEOGRAPHY: Record<Region, readonly CityDef[]> = {
  Adamawa: [
    { name: 'Ngaoundéré', zones: ['Baladji', 'Dang'] },
  ],
  Centre: [
    { name: 'Yaoundé', zones: ['Bastos', 'Mvan', 'Nlongkak', 'Mvog-Mbi'] },
    { name: 'Mbalmayo', zones: ['Nkolngok'] },
  ],
  East: [
    { name: 'Bertoua', zones: ['Nkolbikon'] },
  ],
  'Far North': [
    { name: 'Maroua', zones: ['Domayo', 'Djarengol'] },
  ],
  Littoral: [
    { name: 'Douala', zones: ['Akwa', 'Bonanjo', 'Deido', 'Bonabéri', 'Makepe'] },
    { name: 'Nkongsamba', zones: ['Quartier Haoussa'] },
  ],
  North: [
    { name: 'Garoua', zones: ['Poumpoumré', 'Roumdé Adjia'] },
  ],
  Northwest: [
    { name: 'Bamenda', zones: ['Commercial Avenue', 'Nkwen', 'Bambili'] },
  ],
  South: [
    { name: 'Kribi', zones: ['Mboa Manga'] },
    { name: 'Ebolowa', zones: ['Angalé'] },
  ],
  Southwest: [
    // The zones the console launched with.
    { name: 'Buea', zones: ['Molyko', 'Bonduma', 'Great Soppo', 'Mile 16', 'Muea'] },
    { name: 'Limbe', zones: ['Down Beach', 'Mile 4'] },
  ],
  West: [
    { name: 'Bafoussam', zones: ['Kamkop', 'Tamdja'] },
    { name: 'Dschang', zones: ['Foto'] },
  ],
};

/** Every zone name, flattened. */
export const ZONES: string[] = Object.values(GEOGRAPHY)
  .flatMap((cities) => cities.flatMap((c) => [...c.zones]));

export const CITIES: string[] = Object.values(GEOGRAPHY)
  .flatMap((cities) => cities.map((c) => c.name));

type Placement = { region: Region; city: string };

const ZONE_INDEX: Record<string, Placement> = (() => {
  const index: Record<string, Placement> = {};
  for (const region of REGIONS) {
    for (const city of GEOGRAPHY[region]) {
      for (const zone of city.zones) {
        index[zone.toLowerCase()] = { region, city: city.name };
      }
    }
  }
  return index;
})();

const CITY_INDEX: Record<string, Region> = (() => {
  const index: Record<string, Region> = {};
  for (const region of REGIONS) {
    for (const city of GEOGRAPHY[region]) index[city.name.toLowerCase()] = region;
  }
  return index;
})();

/** The region a zone belongs to, or null when the name is not one of ours. */
export function regionOfZone(zone: string): Region | null {
  return ZONE_INDEX[zone.trim().toLowerCase()]?.region ?? null;
}

export function cityOfZone(zone: string): string | null {
  return ZONE_INDEX[zone.trim().toLowerCase()]?.city ?? null;
}

export function regionOfCity(city: string): Region | null {
  return CITY_INDEX[city.trim().toLowerCase()] ?? null;
}

export function zonesInRegion(region: Region): string[] {
  return GEOGRAPHY[region].flatMap((c) => [...c.zones]);
}

export function citiesInRegion(region: Region): string[] {
  return GEOGRAPHY[region].map((c) => c.name);
}

export function isRegion(value: string): value is Region {
  return (REGIONS as readonly string[]).includes(value);
}

/** Resolves whatever the API gave us to a region, preferring the most specific. */
export function resolveRegion(
  region?: string | null,
  city?: string | null,
  zone?: string | null,
): Region | null {
  if (region) {
    const direct = REGIONS.find((r) => r.toLowerCase() === region.trim().toLowerCase());
    if (direct) return direct;
  }
  if (zone) {
    const fromZone = regionOfZone(zone);
    if (fromZone) return fromZone;
  }
  if (city) {
    const fromCity = regionOfCity(city);
    if (fromCity) return fromCity;
  }
  return null;
}

/** The sentinel the topbar uses for "do not scope to anywhere". */
export const ALL_REGIONS = 'all' as const;
export type RegionScope = Region | typeof ALL_REGIONS;
