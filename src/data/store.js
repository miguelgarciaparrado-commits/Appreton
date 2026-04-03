import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { addXpToUser, getCurrentUser } from './auth';

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

export async function getPlaces() {
  try {
    await seedSupabaseIfEmpty();
    const { data, error } = await supabase.from('places').select('*');
    if (!error && data && data.length > 0) {
      const places = data.map(rowToPlace);
      await AsyncStorage.setItem(PLACES_KEY, JSON.stringify(places));
      return places;
    }
  } catch {}

  try {
    const cached = await AsyncStorage.getItem(PLACES_KEY);
    if (cached) return JSON.parse(cached);
  } catch {}
  await AsyncStorage.setItem(PLACES_KEY, JSON.stringify(SAMPLE_PLACES));
  return SAMPLE_PLACES;
}

export async function getReviews(placeId) {
  try {
    let query = supabase.from('reviews').select('*');
    if (placeId) query = query.eq('place_id', placeId);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (!error && data) {
      const reviews = data.map(rowToReview);
      await AsyncStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
      return reviews;
    }
  } catch {}

  try {
    const cached = await AsyncStorage.getItem(REVIEWS_KEY);
    const all = cached ? JSON.parse(cached) : SAMPLE_REVIEWS;
    return placeId ? all.filter((r) => r.placeId === placeId) : all;
  } catch {}
  return placeId ? SAMPLE_REVIEWS.filter((r) => r.placeId === placeId) : SAMPLE_REVIEWS;
}

export async function addPlace(place) {
  const newPlace = { ...place, id: Date.now().toString(), avgRating: 0, reviewCount: 0 };

  try {
    await supabase.from('places').insert({
      id: newPlace.id, name: newPlace.name, type: newPlace.type,
      address: newPlace.address, latitude: newPlace.latitude,
      longitude: newPlace.longitude, avg_rating: 0, review_count: 0,
    });
  } catch {}

  try {
    const cached = await AsyncStorage.getItem(PLACES_KEY);
    const places = cached ? JSON.parse(cached) : [];
    places.push(newPlace);
    await AsyncStorage.setItem(PLACES_KEY, JSON.stringify(places));
  } catch {}

  return newPlace;
}

export async function addReview(review) {
  const currentUser = await getCurrentUser();
  const newReview = {
    ...review,
    id: Date.now().toString(),
    date: new Date().toISOString().split('T')[0],
    userId: currentUser ? currentUser.id : null,
  };

  try {
    await supabase.from('reviews').insert({
      id: newReview.id, place_id: newReview.placeId, user_id: newReview.userId,
      rating: newReview.rating, comment: newReview.comment,
      has_paper: newReview.hasPaper, has_soap: newReview.hasSoap,
      has_brush: newReview.hasBrush, required_order: newReview.requiredOrder ?? null,
      extras: newReview.extras || [], date: newReview.date,
    });

    const { data: allReviews } = await supabase
      .from('reviews').select('rating').eq('place_id', newReview.placeId);
    if (allReviews && allReviews.length > 0) {
      const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
      await supabase.from('places').update({
        avg_rating: Math.round(avg * 10) / 10,
        review_count: allReviews.length,
      }).eq('id', newReview.placeId);
    }
  } catch {}

  try {
    const cached = await AsyncStorage.getItem(REVIEWS_KEY);
    const reviews = cached ? JSON.parse(cached) : [];
    reviews.push(newReview);
    await AsyncStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));

    const placesCached = await AsyncStorage.getItem(PLACES_KEY);
    if (placesCached) {
      const places = JSON.parse(placesCached);
      const idx = places.findIndex((p) => p.id === newReview.placeId);
      if (idx !== -1) {
        const placeReviews = reviews.filter((r) => r.placeId === newReview.placeId);
        const avg = placeReviews.reduce((s, r) => s + r.rating, 0) / placeReviews.length;
        places[idx].avgRating = Math.round(avg * 10) / 10;
        places[idx].reviewCount = placeReviews.length;
        await AsyncStorage.setItem(PLACES_KEY, JSON.stringify(places));
      }
    }
  } catch {}

  await addXpToUser();
  return newReview;
}
