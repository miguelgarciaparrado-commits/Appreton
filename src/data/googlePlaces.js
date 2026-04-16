import { GOOGLE_PLACES_API_KEY } from '../config';

// Dos grupos de tipos para hacer dos llamadas y no perder bares por el límite de 20
const TYPES_FOOD_DRINK = [
  'restaurant',
  'bar',
  'cafe',
  'night_club',
  'pub',
  'wine_bar',
  'sports_bar',
  'cocktail_bar',
  'coffee_shop',
  'fast_food_restaurant',
  'food_court',
];

const TYPES_OTHER = [
  'gas_station',
  'shopping_mall',
  'department_store',
];

function mapGoogleTypeToAppType(primaryType) {
  if (!primaryType) return null;
  if (['restaurant', 'meal_delivery', 'meal_takeaway', 'cafeteria', 'food_court', 'fast_food_restaurant', 'pizza_restaurant', 'hamburger_restaurant', 'seafood_restaurant', 'steak_house', 'sushi_restaurant', 'indian_restaurant', 'chinese_restaurant', 'mexican_restaurant', 'american_restaurant', 'italian_restaurant', 'japanese_restaurant'].includes(primaryType)) return 'restaurante';
  if (['bar', 'night_club', 'cafe', 'coffee_shop', 'bakery', 'pub'].includes(primaryType)) return 'bar';
  if (['gas_station', 'service_station'].includes(primaryType)) return 'gasolinera';
  if (['shopping_mall', 'department_store'].includes(primaryType)) return 'centro_comercial';
  return null; // tipo desconocido: se descarta
}

async function searchNearby(latitude, longitude, radiusMeters, includedTypes) {
  const response = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
      'X-Goog-FieldMask':
        'places.id,places.displayName,places.formattedAddress,places.location,places.primaryType,places.businessStatus',
    },
    body: JSON.stringify({
      locationRestriction: {
        circle: { center: { latitude, longitude }, radius: radiusMeters },
      },
      includedTypes,
      maxResultCount: 20,
    }),
  });
  const json = await response.json();
  return json.places || [];
}

const LOW_COST_GAS = [
  'ballenoil', 'plenoil', 'bonarea', 'bon area', 'petroprix',
  'gm oil', 'fast fuel', 'autonet', 'low cost', 'lowcost',
  'e.leclerc', 'leclerc', 'alcampo', 'carrefour', 'eroski',
  'makro', 'costco', 'esclat', 'bon preu',
];

function isLowCostGasStation(name, type) {
  if (type !== 'gasolinera') return false;
  const lower = (name || '').toLowerCase();
  return LOW_COST_GAS.some((brand) => lower.includes(brand));
}

function normalizePlace(p, latitude, longitude) {
  return {
    id: `g_${p.id}`,
    googlePlaceId: p.id,
    name: p.displayName?.text || 'Sin nombre',
    address: p.formattedAddress || '',
    latitude: p.location?.latitude ?? latitude,
    longitude: p.location?.longitude ?? longitude,
    type: mapGoogleTypeToAppType(p.primaryType || ''),
    avgRating: 0,
    reviewCount: 0,
    isGoogleOnly: true,
  };
}

export async function fetchNearbyPlaces(latitude, longitude, radiusMeters = 600) {
  if (!GOOGLE_PLACES_API_KEY || GOOGLE_PLACES_API_KEY === 'TU_CLAVE_API_AQUI') {
    return [];
  }

  try {
    // Dos llamadas en paralelo para no limitar bares por el máximo de 20 resultados
    const [foodResults, otherResults] = await Promise.all([
      searchNearby(latitude, longitude, radiusMeters, TYPES_FOOD_DRINK),
      searchNearby(latitude, longitude, radiusMeters, TYPES_OTHER),
    ]);

    const seen = new Set();
    const places = [];

    for (const p of [...foodResults, ...otherResults]) {
      if (p.businessStatus !== 'OPERATIONAL') continue;
      if (seen.has(p.id)) continue;
      const normalized = normalizePlace(p, latitude, longitude);
      if (!normalized.type) continue;
      if (isLowCostGasStation(normalized.name, normalized.type)) continue;
      seen.add(p.id);
      places.push(normalized);
    }

    return places;
  } catch {
    return [];
  }
}
