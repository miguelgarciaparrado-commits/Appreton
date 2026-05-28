import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { storageGet, storageSet } from './storage';
import { supabase } from './supabase';

export const GEOFENCE_TASK = 'appreton-geofence-task';
export const GOOGLE_CACHE_KEY = '@appreton_google_cache';
const NOTIFIED_KEY = '@appreton_notified_places';
const PENDING_KEY = '@appreton_pending_notifications';
const RECENT_WINDOW_MS = 24 * 60 * 60 * 1000;      // 24h — throttle de notificaciones
const REVIEW_COOLDOWN_MS = 60 * 24 * 60 * 60 * 1000; // 60 días — cooldown si ya opinó

export const DWELL_SECONDS = 300;
export const GEOFENCE_RADIUS_M = 100;
export const SPEED_THRESHOLD_MS = 1.5;
export const MAX_VERIFY_DISTANCE_M = 100;

// Silenciamos notificaciones del sistema en foreground: la app ya muestra banner interno.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// -------------- Permisos --------------

export async function setupNotificationChannel() {
  if (Platform.OS !== 'android') return;
  try {
    await Notifications.setNotificationChannelAsync('appreton-proximity', {
      name: 'Cercania a WC',
      description: 'Aviso cuando estas cerca de un WC para opinar',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#8B6914',
    });
  } catch (e) {
    console.error('[Appreton] setupNotificationChannel error:', e);
  }
}

export async function requestNotificationPermission() {
  try {
    await setupNotificationChannel();
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status } = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: false, allowSound: true },
    });
    return status === 'granted';
  } catch (e) {
    console.error('[Appreton] requestNotificationPermission error:', e);
    return false;
  }
}

export async function requestBackgroundLocationPermission() {
  try {
    const fg = await Location.requestForegroundPermissionsAsync();
    if (fg.status !== 'granted') return false;
    const bg = await Location.requestBackgroundPermissionsAsync();
    return bg.status === 'granted';
  } catch (e) {
    console.error('[Appreton] requestBackgroundLocationPermission error:', e);
    return false;
  }
}

// -------------- Throttle 24h por sitio (almacenamiento local) --------------

async function readNotified() {
  try {
    const raw = await storageGet(NOTIFIED_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

async function writeNotified(obj) {
  await storageSet(NOTIFIED_KEY, JSON.stringify(obj));
}

// -------------- Check Supabase: ¿ya opinó en los últimos 60 días? --------------

async function hasReviewedPlaceRecently(placeId) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      // Sin sesión: no podemos saber → permitir notificación por precaución
      return false;
    }

    const cutoffDate = new Date(Date.now() - REVIEW_COOLDOWN_MS)
      .toISOString()
      .split('T')[0]; // YYYY-MM-DD

    const { data, error } = await supabase
      .from('reviews')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('place_id', placeId)
      .gte('created_at', cutoffDate)
      .limit(1);

    if (error) {
      console.warn('[Appreton] hasReviewedPlaceRecently error:', error.message);
      return false; // En caso de error, no bloqueamos la notificación
    }

    const reviewed = data && data.length > 0;
    console.log('[Appreton] hasReviewedPlaceRecently →', { placeId, cutoffDate, reviewed });
    return reviewed;
  } catch (e) {
    console.warn('[Appreton] hasReviewedPlaceRecently exception:', e.message);
    return false;
  }
}

// -------------- Decisión de notificar --------------

export async function shouldNotifyForPlace(placeId) {
  // Check 1: throttle de 24h (evita spam de notificaciones)
  const obj = await readNotified();
  const last = obj[placeId];
  if (last && Date.now() - last < RECENT_WINDOW_MS) {
    console.log('[Appreton] shouldNotify → NO (throttle 24h)', placeId);
    return false;
  }

  // Check 2: ¿el usuario ya opinó sobre este sitio en los últimos 60 días?
  const alreadyReviewed = await hasReviewedPlaceRecently(placeId);
  if (alreadyReviewed) {
    console.log('[Appreton] shouldNotify → NO (opino en ultimos 60 dias)', placeId);
    return false;
  }

  console.log('[Appreton] shouldNotify → SI', placeId);
  return true;
}

export async function markPlaceNotified(placeId) {
  const obj = await readNotified();
  obj[placeId] = Date.now();
  // Limpieza de entradas muy viejas (>7 días)
  const now = Date.now();
  const clean = {};
  for (const [k, v] of Object.entries(obj)) {
    if (now - v < RECENT_WINDOW_MS * 7) clean[k] = v;
  }
  await writeNotified(clean);
}

// -------------- Pendientes (para cancelar si sale antes del dwell) --------------

async function readPending() {
  try {
    const raw = await storageGet(PENDING_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

async function writePending(obj) {
  await storageSet(PENDING_KEY, JSON.stringify(obj));
}

// -------------- Handlers para la task de geofence --------------

// Al entrar en una región: programa notificación diferida DWELL_SECONDS después.
// Si el usuario sigue dentro cuando dispare, recibe el aviso.
// Si sale antes, handleGeofenceExit cancela la notificación programada.
export async function handleGeofenceEnter(placeId, placeName) {
  try {
    if (!(await shouldNotifyForPlace(placeId))) return;

    // Cancela cualquier pendiente previo para el mismo sitio
    const pending = await readPending();
    if (pending[placeId]?.notificationId) {
      try { await Notifications.cancelScheduledNotificationAsync(pending[placeId].notificationId); } catch {}
    }

    const notifId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `Estas en ${placeName || 'un sitio cercano'}?`,
        body: 'Cuentanos como esta su WC 💩',
        data: { placeId, type: 'proximity' },
      },
      trigger: { seconds: DWELL_SECONDS, channelId: 'appreton-proximity' },
    });

    pending[placeId] = { notificationId: notifId, enterTime: Date.now() };
    await writePending(pending);
  } catch (e) {
    console.error('[Appreton] handleGeofenceEnter error:', e);
  }
}

// Al salir de una región: cancela la notificación programada si no llegó al dwell.
export async function handleGeofenceExit(placeId) {
  try {
    const pending = await readPending();
    const p = pending[placeId];
    if (!p) return;
    if (p.notificationId) {
      try { await Notifications.cancelScheduledNotificationAsync(p.notificationId); } catch {}
    }
    delete pending[placeId];
    await writePending(pending);
  } catch (e) {
    console.error('[Appreton] handleGeofenceExit error:', e);
  }
}

// -------------- Geofencing lifecycle --------------

export async function cacheGooglePlacesForTask(places) {
  try {
    const minimal = (places || []).map((p) => ({
      id: p.id,
      name: p.name,
      latitude: p.latitude,
      longitude: p.longitude,
      type: p.type,
      address: p.address,
    }));
    await storageSet(GOOGLE_CACHE_KEY, JSON.stringify(minimal));
  } catch (e) {
    console.error('[Appreton] cacheGooglePlacesForTask error:', e);
  }
}

export async function startGeofencingForPlaces(places) {
  if (!Array.isArray(places) || places.length === 0) {
    try { await Location.stopGeofencingAsync(GEOFENCE_TASK); } catch {}
    return;
  }

  const regions = places
    .filter((p) => p && p.latitude && p.longitude)
    .slice(0, 20)
    .map((p) => ({
      identifier: p.id,
      latitude: p.latitude,
      longitude: p.longitude,
      radius: GEOFENCE_RADIUS_M,
      notifyOnEnter: true,
      notifyOnExit: true,
    }));

  if (regions.length === 0) return;

  try { await Location.stopGeofencingAsync(GEOFENCE_TASK); } catch {}

  try {
    await Location.startGeofencingAsync(GEOFENCE_TASK, regions);
  } catch (e) {
    console.error('[Appreton] startGeofencingAsync error:', e);
  }
}
