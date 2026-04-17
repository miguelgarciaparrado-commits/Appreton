import { storageGet, storageSet } from './storage';

const OSM_CACHE_KEY = '@appreton_osm_cache';
const OSM_CACHE_TTL = 24 * 60 * 60 * 1000;
const OSM_CACHE_DISTANCE_THRESHOLD = 500;
const OVERPASS_URLS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

function distanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (x) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function normalizeOSMPlace(node) {
  const tags = node.tags || {};
  const name =
    tags.name ||
    tags.description ||
    (tags.fee === 'yes' ? 'WC publico (de pago)' : 'WC publico');

  return {
    id: `o_${node.id}`,
    name,
    address: tags['addr:street']
      ? `${tags['addr:street']} ${tags['addr:housenumber'] || ''}`.trim()
      : `${node.lat.toFixed(4)}, ${node.lon.toFixed(4)}`,
    latitude: node.lat,
    longitude: node.lon,
    type: 'wc_publico',
    avgRating: 0,
    reviewCount: 0,
    isOSM: true,
    osmTags: {
      fee: tags.fee || null,
      wheelchair: tags.wheelchair || null,
      opening_hours: tags.opening_hours || null,
      access: tags.access || null,
    },
  };
}

async function queryOverpass(latitude, longitude, radiusMeters) {
  const query = `[out:json][timeout:10];(node["amenity"="toilets"](around:${radiusMeters},${latitude},${longitude}););out body;`;
  const body = `data=${encodeURIComponent(query)}`;

  for (const url of OVERPASS_URLS) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12000);
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!response.ok) continue;
      const json = await response.json();
      return (json.elements || []).filter((e) => e.type === 'node' && e.lat && e.lon);
    } catch {
      continue;
    }
  }
  return [];
}

async function getCache() {
  try {
    const raw = await storageGet(OSM_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function setCache(latitude, longitude, places) {
  await storageSet(
    OSM_CACHE_KEY,
    JSON.stringify({ lat: latitude, lon: longitude, ts: Date.now(), places }),
  );
}

function isCacheValid(cache, latitude, longitude) {
  if (!cache || !cache.ts || !cache.places) return false;
  if (Date.now() - cache.ts > OSM_CACHE_TTL) return false;
  if (distanceMeters(cache.lat, cache.lon, latitude, longitude) > OSM_CACHE_DISTANCE_THRESHOLD) {
    return false;
  }
  return true;
}

export async function fetchNearbyToiletsOSM(latitude, longitude, radiusMeters = 600) {
  try {
    const cache = await getCache();
    if (isCacheValid(cache, latitude, longitude)) {
      return cache.places;
    }

    const nodes = await queryOverpass(latitude, longitude, radiusMeters);
    const places = nodes.map(normalizeOSMPlace);
    await setCache(latitude, longitude, places);
    return places;
  } catch (e) {
    console.warn('[Appreton] OSM fetch failed:', e.message);
    const cache = await getCache();
    return cache?.places || [];
  }
}
