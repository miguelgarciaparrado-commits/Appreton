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
  'supermarket',
  'department_store',
  'movie_theater',
  'gym',
];

function mapGoogleTypeToAppType(primaryType) {
  if (!primaryType) return 'otro';
  if (['restaurant', 'meal_delivery', 'meal_takeaway', 'cafeteria', 'food_court', 'fast_food_restaurant', 'pizza_restaurant', 'hamburger_restaurant', 'seafood_restaurant', 'steak_house', 'sushi_restaurant', 'indian_restaurant', 'chinese_restaurant', 'mexican_restaurant', 'american_restaurant', 'italian_restaurant', 'japanese_restaurant'].includes(primaryType)) return 'restaurante';
  if (['bar', 'night_club', 'cafe', 'coffee_shop', 'bakery', 'pub'].includes(primaryType)) return 'bar';
  if (['gas_station', 'service_station'].includes(primaryType)) return 'gasolinera';
  if (['shopping_mall', 'department_store', 'supermarket', 'grocery_store', 'convenience_store', 'clothing_store', 'furniture_store', 'hardware_store', 'home_goods_store'].includes(primaryType)) return 'centro_comercial';
  return 'otro';
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
      // Solo establecimientos operativos (excluye barrios, áreas, cerrados)
      if (p.businessStatus !== 'OPERATIONAL') continue;
      if (seen.has(p.id)) continue;
      seen.add(p.id);
      places.push(normalizePlace(p, latitude, longitude));
    }

    return places;
  } catch {
    return [];
  }
}
