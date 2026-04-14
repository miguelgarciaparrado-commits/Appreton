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
  handleGeofenceEnter,
  handleGeofenceExit,
} from '../data/notifications';

const PLACES_KEY = '@appreton_places';

async function lookupPlaceName(placeId) {
  // Primero mira en el cache local de places (Supabase)
  try {
    const raw = await storageGet(PLACES_KEY);
    if (raw) {
      const places = JSON.parse(raw);
      const hit = places.find((p) => p.id === placeId);
      if (hit && hit.name) return hit.name;
    }
  } catch {}
  // Después en el cache de Google Places (para sitios descubiertos de Google)
  try {
    const raw = await storageGet(GOOGLE_CACHE_KEY);
    if (raw) {
      const google = JSON.parse(raw);
      const hit = google.find((p) => p.id === placeId);
      if (hit && hit.name) return hit.name;
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
    const name = await lookupPlaceName(placeId);
    await handleGeofenceEnter(placeId, name);
  } else if (eventType === Location.GeofencingEventType.Exit) {
    await handleGeofenceExit(placeId);
  }
});
