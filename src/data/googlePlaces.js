import { GOOGLE_PLACES_API_KEY } from '../config';

// Tipos de establecimientos que pueden tener retrete
const INCLUDED_TYPES = [
  'restaurant',
  'bar',
  'cafe',
  'gas_station',
  'shopping_mall',
  'lodging',
  'pharmacy',
  'supermarket',
  'convenience_store',
  'night_club',
  'movie_theater',
  'gym',
  'hospital',
  'bakery',
  'department_store',
  'food_court',
  'sports_complex',
  'tourist_attraction',
  'transit_station',
];

function mapGoogleTypeToAppType(primaryType) {
  if (!primaryType) return 'otro';
  if (['restaurant', 'meal_delivery', 'meal_takeaway', 'cafeteria', 'food_court', 'fast_food_restaurant', 'pizza_restaurant', 'hamburger_restaurant', 'seafood_restaurant', 'steak_house', 'sushi_restaurant', 'indian_restaurant', 'chinese_restaurant', 'mexican_restaurant', 'american_restaurant', 'italian_restaurant', 'japanese_restaurant'].includes(primaryType)) return 'restaurante';
  if (['bar', 'night_club', 'cafe', 'coffee_shop', 'bakery', 'pub'].includes(primaryType)) return 'bar';
  if (['gas_station', 'service_station'].includes(primaryType)) return 'gasolinera';
  if (['shopping_mall', 'department_store', 'supermarket', 'grocery_store', 'convenience_store', 'clothing_store', 'furniture_store', 'hardware_store', 'home_goods_store'].includes(primaryType)) return 'centro_comercial';
  return 'otro';
}

export async function fetchNearbyPlaces(latitude, longitude, radiusMeters = 600) {
  if (!GOOGLE_PLACES_API_KEY || GOOGLE_PLACES_API_KEY === 'TU_CLAVE_API_AQUI') {
    return [];
  }

  try {
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
          circle: {
            center: { latitude, longitude },
            radius: radiusMeters,
          },
        },
        includedTypes: INCLUDED_TYPES,
        maxResultCount: 20,
      }),
    });

    const json = await response.json();
    if (!json.places) return [];

    return json.places
      .filter((p) => p.businessStatus !== 'CLOSED_PERMANENTLY')
      .map((p) => ({
        // Prefijo g_ para identificar origen Google
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
      }));
  } catch {
    return [];
  }
}
