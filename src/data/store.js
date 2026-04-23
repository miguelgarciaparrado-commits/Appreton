import { storageGet, storageSet } from './storage';
import { supabase, triggerExtraction } from './supabase';
import {
  addXpToUser,
  getCurrentUser,
  calculateReviewXp,
  computeDailyProgress,
  countTodayXpHits,
} from './auth';

const PLACES_KEY = '@appreton_places';
const REVIEWS_KEY = '@appreton_reviews';

const SAMPLE_PLACES = [
  { id: '1', name: 'Bar El Rincon', type: 'bar', address: 'Calle Mayor 12, Madrid', latitude: 40.4168, longitude: -3.7038, avgRating: 3.5, reviewCount: 2 },
  { id: '2', name: 'Gasolinera Repsol A-6', type: 'gasolinera', address: 'Autovia A-6 km 23, Madrid', latitude: 40.4500, longitude: -3.7500, avgRating: 4.0, reviewCount: 1 },
  { id: '3', name: 'Centro Comercial La Vaguada', type: 'centro_comercial', address: 'Av. de Monforte de Lemos 36, Madrid', latitude: 40.4800, longitude: -3.7100, avgRating: 4.5, reviewCount: 3 },
  { id: '4', name: 'Restaurante Casa Paco', type: 'restaurante', address: 'Plaza Puerta Cerrada 11, Madrid', latitude: 40.4130, longitude: -3.7090, avgRating: 2.0, reviewCount: 1 },
];

const SAMPLE_REVIEWS = [
  { id: 'r1', placeId: '1', rating: 4, comment: 'Bastante limpio para ser un bar.', hasPaper: true, hasSoap: true, hasBrush: false, extras: [], date: '2026-03-15' },
  { id: 'r2', placeId: '1', rating: 3, comment: 'Normal, podria estar mas limpio.', hasPaper: true, hasSoap: false, hasBrush: false, extras: [], date: '2026-03-20' },
  { id: 'r3', placeId: '2', rating: 4, comment: 'Muy limpio para ser una gasolinera.', hasPaper: true, hasSoap: true, hasBrush: true, extras: ['Secador de manos'], date: '2026-03-18' },
  { id: 'r4', placeId: '3', rating: 5, comment: 'Impecable, como siempre.', hasPaper: true, hasSoap: true, hasBrush: true, extras: ['Cambiador de bebes', 'Secador de manos'], date: '2026-03-10' },
  { id: 'r5', placeId: '3', rating: 4, comment: 'Bien mantenido, aunque a veces falta papel.', hasPaper: false, hasSoap: true, hasBrush: true, extras: ['Secador de manos'], date: '2026-03-22' },
  { id: 'r6', placeId: '3', rating: 4.5, comment: 'De los mejores banos publicos.', hasPaper: true, hasSoap: true, hasBrush: true, extras: ['Secador de manos'], date: '2026-03-25' },
  { id: 'r7', placeId: '4', rating: 2, comment: 'Bastante sucio, necesita limpieza.', hasPaper: false, hasSoap: false, hasBrush: false, extras: [], date: '2026-03-12' },
];

function rowToPlace(row) {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
    avgRating: row.avg_rating ?? 0,
    reviewCount: row.review_count ?? 0,
  };
}

function rowToReview(row) {
  return {
    id: row.id,
    placeId: row.place_id,
    userId: row.user_id,
    rating: row.rating,
    comment: row.comment,
    hasPaper: row.has_paper,
    hasSoap: row.has_soap,
    hasBrush: row.has_brush,
    requiredOrder: row.required_order,
    extras: row.extras || [],
    date: row.date,
    createdAt: row.created_at || row.date,
    likes: row.likes || 0,
    gender: row.gender || null,
    authorName: row.author_name || null,
    extractionStatus: row.extraction_status || null,
    extractionTags: row.structured_extraction?.tags || [],
    extractionSentiment: row.structured_extraction?.overall_sentiment || null,
  };
}

async function seedSupabaseIfEmpty() {
  try {
    const { data } = await supabase.from('places').select('id').limit(1);
    if (data && data.length === 0) {
      await supabase.from('places').insert(
        SAMPLE_PLACES.map((p) => ({
          id: p.id, name: p.name, type: p.type, address: p.address,
          latitude: p.latitude, longitude: p.longitude,
          avg_rating: p.avgRating, review_count: p.reviewCount,
        }))
      );
      await supabase.from('reviews').insert(
        SAMPLE_REVIEWS.map((r) => ({
          id: r.id, place_id: r.placeId, user_id: null,
          rating: r.rating, comment: r.comment,
          has_paper: r.hasPaper, has_soap: r.hasSoap, has_brush: r.hasBrush,
          required_order: null, extras: r.extras, date: r.date,
        }))
      );
    }
  } catch {}
}

// Busca un place por id en Supabase; si falla, mira en el cache local
// (places y cache de Google). Devuelve null si no lo encuentra.
export async function getPlaceById(id) {
  if (!id) return null;
  try {
    const { data, error } = await supabase.from('places').select('*').eq('id', id).maybeSingle();
    if (!error && data) return rowToPlace(data);
  } catch {}
  try {
    const cached = await storageGet(PLACES_KEY);
    if (cached) {
      const arr = JSON.parse(cached);
      const hit = arr.find((p) => p.id === id);
      if (hit) return hit;
    }
  } catch {}
  try {
    const cachedG = await storageGet('@appreton_google_cache');
    if (cachedG) {
      const arr = JSON.parse(cachedG);
      const hit = arr.find((p) => p.id === id);
      if (hit) return { ...hit, isGoogleOnly: true, avgRating: 0, reviewCount: 0 };
    }
  } catch {}
  return null;
}

export async function getPlaces() {
  try {
    const { data, error } = await supabase.from('places').select('*');
    if (!error && data) {
      const places = data.map(rowToPlace);
      await storageSet(PLACES_KEY, JSON.stringify(places));
      return places;
    }
  } catch {}

  try {
    const cached = await storageGet(PLACES_KEY);
    if (cached) return JSON.parse(cached);
  } catch {}
  return [];
}

export async function getReviews(placeId) {
  try {
    let query = supabase.from('reviews').select('*')
      .or('moderation_status.eq.visible,moderation_status.is.null');
    if (placeId) query = query.eq('place_id', placeId);
    // Ordenar por date (columna que insertamos nosotros, created_at puede no existir)
    const { data, error } = await query.order('date', { ascending: false });
    if (!error && data) {
      const reviews = data.map(rowToReview);
      // Merge con caché existente para no perder reviews de otros lugares
      try {
        const cached = await storageGet(REVIEWS_KEY);
        const all = cached ? JSON.parse(cached) : [];
        const others = placeId ? all.filter((r) => r.placeId !== placeId) : [];
        await storageSet(REVIEWS_KEY, JSON.stringify([...others, ...reviews]));
      } catch {}
      return reviews;
    }
  } catch {}

  try {
    const cached = await storageGet(REVIEWS_KEY);
    const all = cached ? JSON.parse(cached) : [];
    return placeId ? all.filter((r) => r.placeId === placeId) : all;
  } catch {}
  return [];
}

// Crea un lugar en la BD si no existe (idempotente)
// Usado cuando un sitio de Google recibe su primera opinión
export async function ensurePlaceExists(place) {
  const id = place.id; // ya tiene el prefijo g_ si viene de Google

  // Comprobar si ya existe en Supabase (maybeSingle no tira si no hay fila)
  const { data: existing, error: selectError } = await supabase
    .from('places').select('id').eq('id', id).maybeSingle();
  if (selectError) {
    console.error('[Appreton] ensurePlaceExists select error:', selectError);
  }
  if (existing) return; // ya existe

  // No miramos el caché local para decidir si hace falta crear en Supabase:
  // el sitio DEBE estar en Supabase para que la FK de reviews no falle.
  // Crear el lugar en Supabase
  await addPlace({ ...place, id });
}

export async function addPlace(place) {
  const newPlace = {
    ...place,
    id: place.id || Date.now().toString(),
    avgRating: 0,
    reviewCount: 0,
  };

  const { error } = await supabase.from('places').insert({
    id: newPlace.id, name: newPlace.name, type: newPlace.type,
    address: newPlace.address, latitude: newPlace.latitude,
    longitude: newPlace.longitude, avg_rating: 0, review_count: 0,
  });

  if (error) {
    console.error('[Appreton] addPlace error:', error);
    // Si es una violación de unique (ya existe), lo tratamos como éxito
    if (error.code !== '23505') {
      throw new Error(`No se pudo guardar el sitio: ${error.message}`);
    }
  }

  // También cachear localmente para lectura offline
  try {
    const cached = await storageGet(PLACES_KEY);
    const places = cached ? JSON.parse(cached) : [];
    if (!places.find((p) => p.id === newPlace.id)) {
      places.push(newPlace);
      await storageSet(PLACES_KEY, JSON.stringify(places));
    }
  } catch {}

  return newPlace;
}

// Da "me gusta" a una opinion concreta. Incrementa el contador en Supabase
// y guarda en AsyncStorage que el usuario ya le dio like a esta review (para
// evitar que el mismo dispositivo puntue el mismo mensaje varias veces).
// Devuelve el nuevo valor de likes.
const LIKED_REVIEWS_KEY = '@appreton_liked_reviews';

export async function hasLikedReview(reviewId) {
  try {
    const raw = await storageGet(LIKED_REVIEWS_KEY);
    const map = raw ? JSON.parse(raw) : {};
    return !!map[reviewId];
  } catch {
    return false;
  }
}

export async function getLikedReviewsMap() {
  try {
    const raw = await storageGet(LIKED_REVIEWS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function likeReview(reviewId) {
  // Evita duplicar desde el mismo dispositivo
  if (await hasLikedReview(reviewId)) {
    // Devuelve el valor actual leyendo de Supabase
    const { data } = await supabase.from('reviews').select('likes').eq('id', reviewId).maybeSingle();
    return data?.likes ?? 0;
  }

  // Lee el contador actual e incrementa
  const { data: row, error: selErr } = await supabase
    .from('reviews').select('likes').eq('id', reviewId).maybeSingle();
  if (selErr) {
    console.error('[Appreton] likeReview select error:', selErr);
    throw new Error(selErr.message);
  }

  const current = row?.likes || 0;
  const next = current + 1;
  const { error: updErr } = await supabase
    .from('reviews').update({ likes: next }).eq('id', reviewId);
  if (updErr) {
    console.error('[Appreton] likeReview update error:', updErr);
    throw new Error(updErr.message);
  }

  // Marcar como liked en AsyncStorage
  try {
    const map = await getLikedReviewsMap();
    map[reviewId] = Date.now();
    await storageSet(LIKED_REVIEWS_KEY, JSON.stringify(map));
  } catch {}

  return next;
}

export async function unlikeReview(reviewId) {
  const { data: row, error: selErr } = await supabase
    .from('reviews').select('likes').eq('id', reviewId).maybeSingle();
  if (selErr) throw new Error(selErr.message);

  const next = Math.max(0, (row?.likes || 1) - 1);
  const { error: updErr } = await supabase
    .from('reviews').update({ likes: next }).eq('id', reviewId);
  if (updErr) throw new Error(updErr.message);

  try {
    const map = await getLikedReviewsMap();
    delete map[reviewId];
    await storageSet(LIKED_REVIEWS_KEY, JSON.stringify(map));
  } catch {}

  return next;
}

// Busca la opinion del usuario actual para un sitio concreto (si existe).
// Devuelve la review completa o null.
export async function getUserReviewForPlace(placeId) {
  const user = await getCurrentUser();
  if (!user) return null;
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('user_id', user.id)
      .eq('place_id', placeId)
      .maybeSingle();
    if (!error && data) return rowToReview(data);
  } catch {}
  return null;
}

async function refreshPlaceAggregates(placeId) {
  const { data: allReviews } = await supabase
    .from('reviews').select('rating').eq('place_id', placeId)
    .or('moderation_status.eq.visible,moderation_status.is.null');
  if (allReviews && allReviews.length > 0) {
    const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
    await supabase.from('places').update({
      avg_rating: Math.round(avg * 10) / 10,
      review_count: allReviews.length,
    }).eq('id', placeId);
  } else if (allReviews) {
    await supabase.from('places').update({
      avg_rating: 0,
      review_count: 0,
    }).eq('id', placeId);
  }
}

// Distancia Haversine en metros
function distanceMeters(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return Infinity;
  const R = 6371000;
  const toRad = (x) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Upsert de opinion. Si el usuario ya opino este sitio, actualiza la
// existente SIN dar XP. Si es nueva, inserta y calcula XP con bonuses.
//
// Devuelve: { wasEdit, xpGained, leveledUp, levelInfo, reviewId }
//
// El parametro `context` puede incluir `userCoords` para el bonus "estaba en
// el sitio" y cualquier dato extra que la UI quiera pasar.
export async function upsertReview(review, context = {}) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    throw new Error('Tienes que iniciar sesion para opinar');
  }

  const userId = currentUser.id;
  const placeId = review.placeId;
  const today = new Date().toISOString().split('T')[0];

  // 1) Comprobar si el usuario ya tiene opinion en este sitio
  let existing = null;
  try {
    const { data } = await supabase
      .from('reviews')
      .select('id')
      .eq('user_id', userId)
      .eq('place_id', placeId)
      .maybeSingle();
    existing = data;
  } catch {}

  // --- MODO EDICION ---
  if (existing) {
    const { error: updErr } = await supabase.from('reviews').update({
      rating: review.rating,
      comment: review.comment,
      has_paper: review.hasPaper,
      has_soap: review.hasSoap,
      has_brush: review.hasBrush,
      required_order: review.requiredOrder ?? null,
      extras: review.extras || [],
      gender: currentUser.gender || null,
      author_name: currentUser.displayName || null,
    }).eq('id', existing.id);

    if (updErr) {
      console.error('[Appreton] upsertReview update error:', updErr);
      throw new Error(`No se pudo actualizar la opinion: ${updErr.message}`);
    }

    triggerExtraction(existing.id);
    await refreshPlaceAggregates(placeId);

    // Caché local
    try {
      const cached = await storageGet(REVIEWS_KEY);
      const reviews = cached ? JSON.parse(cached) : [];
      const idx = reviews.findIndex((r) => r.id === existing.id);
      if (idx !== -1) {
        reviews[idx] = { ...reviews[idx], ...review };
        await storageSet(REVIEWS_KEY, JSON.stringify(reviews));
      }
    } catch {}

    return {
      wasEdit: true,
      xpGained: 0,
      leveledUp: false,
      levelInfo: null,
      reviewId: existing.id,
    };
  }

  // --- MODO INSERT (nueva opinion) ---
  const newId = Date.now().toString();
  const newReview = {
    ...review,
    id: newId,
    date: today,
    userId,
  };

  const { error: insertError } = await supabase.from('reviews').insert({
    id: newId, place_id: placeId, user_id: userId,
    rating: review.rating, comment: review.comment,
    has_paper: review.hasPaper, has_soap: review.hasSoap,
    has_brush: review.hasBrush, required_order: review.requiredOrder ?? null,
    extras: review.extras || [], date: today,
    created_at: new Date().toISOString(),
    gender: currentUser.gender || null,
    author_name: currentUser.displayName || null,
  });

  if (insertError) {
    console.error('[Appreton] upsertReview insert error:', insertError);
    // Si se cuela por race y devuelve unique violation, reintentamos como update
    if (insertError.code === '23505') {
      return upsertReview(review, context);
    }
    throw new Error(`No se pudo guardar la opinion: ${insertError.message}`);
  }

  triggerExtraction(newId);
  await refreshPlaceAggregates(placeId);

  // --- Calcular XP ---
  // ¿Es la primera opinion del sitio?
  let isFirstOnPlace = false;
  try {
    const { data: count } = await supabase
      .from('reviews').select('id').eq('place_id', placeId);
    isFirstOnPlace = (count?.length || 0) === 1;
  } catch {}

  // ¿Comentario largo?
  const hasLongComment = (review.comment || '').trim().length >= 100;

  // ¿Estaba en el sitio al opinar? (GPS <50m)
  let isOnSite = false;
  try {
    if (context.userCoords) {
      const { data: placeRow } = await supabase
        .from('places').select('latitude,longitude').eq('id', placeId).maybeSingle();
      if (placeRow) {
        const d = distanceMeters(
          context.userCoords.latitude,
          context.userCoords.longitude,
          placeRow.latitude,
          placeRow.longitude
        );
        isOnSite = d <= 50;
      }
    }
  } catch {}

  // Cooldown diario: a partir de la 11a opinion del dia, 0 XP
  const todayHits = await countTodayXpHits(currentUser);
  const dailyCapHit = todayHits >= 10; // antes del insert actual había >=10 con XP

  let xpGained = 0;
  let dailyProgress = null;
  if (!dailyCapHit) {
    dailyProgress = computeDailyProgress(currentUser);
    xpGained = calculateReviewXp({
      isFirstOnPlace,
      hasLongComment,
      isOnSite,
      isFirstOfDay: dailyProgress.isFirstOfDay,
      currentStreak: dailyProgress.newStreak,
    });
  }

  // Cache local (fallback)
  try {
    const cached = await storageGet(REVIEWS_KEY);
    const reviews = cached ? JSON.parse(cached) : [];
    reviews.push(newReview);
    await storageSet(REVIEWS_KEY, JSON.stringify(reviews));

    const placesCached = await storageGet(PLACES_KEY);
    if (placesCached) {
      const places = JSON.parse(placesCached);
      const idx = places.findIndex((p) => p.id === placeId);
      if (idx !== -1) {
        const placeReviews = reviews.filter((r) => r.placeId === placeId);
        const avg = placeReviews.reduce((s, r) => s + r.rating, 0) / placeReviews.length;
        places[idx].avgRating = Math.round(avg * 10) / 10;
        places[idx].reviewCount = placeReviews.length;
        await storageSet(PLACES_KEY, JSON.stringify(places));
      }
    }
  } catch {}

  const result = await addXpToUser(xpGained, dailyProgress);

  return {
    wasEdit: false,
    xpGained,
    leveledUp: !!result?.leveledUp,
    levelInfo: result?.levelInfo || null,
    reviewId: newId,
    dailyCapHit,
    bonuses: { isFirstOnPlace, hasLongComment, isOnSite },
  };
}

// Alias para compatibilidad con código antiguo.
export const addReview = upsertReview;
