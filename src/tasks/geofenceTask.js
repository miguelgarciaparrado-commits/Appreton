// Background geofence task para Appreton.
//
// IMPORTANTE: Este archivo se importa desde App.js por efecto colateral.
// TaskManager.defineTask DEBE ejecutarse en el top level del módulo (no
// dentro de un efecto, hook ni handler), si no el sistema no la reconoce
// cuando el SO invoca la tarea desde background.

import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { storageGet } from '../data/storage';
import {
  GEOFENCE_TASK,
  GOOGLE_CACHE_KEY,
  SPEED_THRESHOLD_MS,
  MAX_VERIFY_DISTANCE_M,
  handleGeofenceEnter,
  handleGeofenceExit,
} from '../data/notifications';

const PLACES_KEY = '@appreton_places';

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

async function lookupPlaceInfo(placeId) {
  try {
    const raw = await storageGet(PLACES_KEY);
    if (raw) {
      const places = JSON.parse(raw);
      const hit = places.find((p) => p.id === placeId);
      if (hit) return hit;
    }
  } catch {}
  try {
    const raw = await storageGet(GOOGLE_CACHE_KEY);
    if (raw) {
      const google = JSON.parse(raw);
      const hit = google.find((p) => p.id === placeId);
      if (hit) return hit;
    }
  } catch {}
  return null;
}

TaskManager.defineTask(GEOFENCE_TASK, async ({ data, error }) => {
  if (error) {
    console.error('[Appreton] Geofence task error:', error);
    return;
  }
  if (!data) return;

  const { eventType, region } = data;
  const placeId = region?.identifier;
  if (!placeId) return;

  if (eventType === Location.GeofencingEventType.Enter) {
    const info = await lookupPlaceInfo(placeId);

    try {
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const speed = pos.coords.speed;
      if (speed != null && speed > SPEED_THRESHOLD_MS) return;

      if (info?.latitude && info?.longitude) {
        const dist = distanceMeters(
          pos.coords.latitude,
          pos.coords.longitude,
          info.latitude,
          info.longitude,
        );
        if (dist > MAX_VERIFY_DISTANCE_M) return;
      }
    } catch (e) {
      console.warn('[Appreton] GPS verify failed, proceeding anyway:', e.message);
    }

    await handleGeofenceEnter(placeId, info?.name || null);
  } else if (eventType === Location.GeofencingEventType.Exit) {
    await handleGeofenceExit(placeId);
  }
});
