// Helpers de notificaciones y geofencing para Appreton (Android + iOS).
//
// Estrategia anti-spam:
// - No notificamos al ENTRAR en un sitio, solo si la persona permanece
//   dentro del radio durante DWELL_SECONDS segundos (ej: 2 min). Así no
//   se dispara un aviso al pasar por delante de un bar.
// - Una vez avisado un sitio, hay un throttle de 24h por placeId: aunque
//   vuelvas varias veces no te insistimos.
// - Solo 1 sitio "en curso" a la vez: si pasas del Bar A al Bar B antes
//   del dwell, el pendiente de A se cancela automáticamente.

import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { storageGet, storageSet } from './storage';

export const GEOFENCE_TASK = 'appreton-geofence-task';
export const GOOGLE_CACHE_KEY = '@appreton_google_cache';
const NOTIFIED_KEY = '@appreton_notified_places';
const PENDING_KEY = '@appreton_pending_notifications';
const RECENT_WINDOW_MS = 24 * 60 * 60 * 1000; // 24h de throttle por sitio

// Tiempo que tiene que pasar el usuario dentro del establecimiento antes
// de dispararle el aviso. Exportado para que el banner foreground use el
// mismo valor y la experiencia sea consistente.
export const DWELL_SECONDS = 120; // 2 minutos

// Configuración del handler de notificaciones cuando la app está en foreground.
// Silenciamos las notificaciones del sistema en foreground porque ya mostramos
// un banner dentro de la app (evita duplicar el aviso).
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

// -------------- Throttle 24h por sitio --------------

async function readNotified() {
  try {
    const raw = await storageGet(NOTIFIED_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}
async function writeNotified(obj) {
  await storageSet(NOTIFIED_KEY, JSON.stringify(obj));
}

export async function shouldNotifyForPlace(placeId) {
  const obj = await readNotified();
  const last = obj[placeId];
  if (!last) return true;
  return Date.now() - last >= RECENT_WINDOW_MS;
}

export async function markPlaceNotified(placeId) {
  const obj = await readNotified();
  obj[placeId] = Date.now();
  // Limpieza de entradas muy viejas
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

// Al entrar en una región: programamos una notificación diferida DWELL_SECONDS
// después. Si la persona sigue dentro cuando dispare, recibe el aviso. Si sale
// antes, handleGeofenceExit cancela la notificación programada.
export async function handleGeofenceEnter(placeId, placeName) {
  try {
    // Si ya está throttled, ni siquiera programamos nada
    if (!(await shouldNotifyForPlace(placeId))) return;

    // Cancela cualquier pendiente previo para el mismo sitio (por si acaso)
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

// Al salir de una región: si teníamos una notificación programada para ese
// sitio, la cancelamos (no llegó al dwell, fue paso fugaz).
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

// Cacheamos la lista de places de Google (y app) para que la task en background
// pueda buscar el nombre del sitio por id cuando dispare el enter/exit.
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

// Inicia geofencing con hasta 20 regiones (límite iOS). Se registra enter
// Y exit porque ambos se necesitan para cancelar pendientes fallidos.
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
      radius: 50,
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
