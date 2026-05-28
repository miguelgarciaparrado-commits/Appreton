import AsyncStorage from '@react-native-async-storage/async-storage';
import { addXpToUser, getCurrentUser } from './auth';
import { supabase } from './supabase';

const PLACES_KEY = '@appreton_places';
const REVIEWS_KEY = '@appreton_reviews';

// Sample data for initial load
const SAMPLE_PLACES = [
  {
    id: '1',
    name: 'Bar El Rincon',
    type: 'bar',
    address: 'Calle Mayor 12, Madrid',
    latitude: 40.4168,
    longitude: -3.7038,
    avgRating: 3.5,
    reviewCount: 2,
  },
  {
    id: '2',
    name: 'Gasolinera Repsol A-6',
    type: 'gasolinera',
    address: 'Autovia A-6 km 23, Madrid',
    latitude: 40.4500,
    longitude: -3.7500,
    avgRating: 4.0,
    reviewCount: 1,
  },
  {
    id: '3',
    name: 'Centro Comercial La Vaguada',
    type: 'centro_comercial',
    address: 'Av. de Monforte de Lemos 36, Madrid',
    latitude: 40.4800,
    longitude: -3.7100,
    avgRating: 4.5,
    reviewCount: 3,
  },
  {
    id: '4',
    name: 'Restaurante Casa Paco',
    type: 'restaurante',
    address: 'Plaza Puerta Cerrada 11, Madrid',
    latitude: 40.4130,
    longitude: -3.7090,
    avgRating: 2.0,
    reviewCount: 1,
  },
];

const SAMPLE_REVIEWS = [
  {
    id: 'r1',
    placeId: '1',
    rating: 4,
    comment: 'Bastante limpio para ser un bar, buen mantenimiento.',
    hasPaper: true,
    hasSoap: true,
    hasBrush: false,
    extras: ['Ambientador'],
    date: '2026-03-15',
  },
  {
    id: 'r2',
    placeId: '1',
    rating: 3,
    comment: 'Normal, podria estar mas limpio.',
    hasPaper: true,
    hasSoap: false,
    hasBrush: false,
    extras: [],
    date: '2026-03-20',
  },
  {
    id: 'r3',
    placeId: '2',
    rating: 4,
    comment: 'Muy limpio para ser una gasolinera, sorprendente.',
    hasPaper: true,
    hasSoap: true,
    hasBrush: true,
    extras: ['Secador de manos'],
    date: '2026-03-18',
  },
  {
    id: 'r4',
    placeId: '3',
    rating: 5,
    comment: 'Impecable, como siempre en este centro comercial.',
    hasPaper: true,
    hasSoap: true,
    hasBrush: true,
    extras: ['Cambiador de bebes', 'Secador de manos'],
    date: '2026-03-10',
  },
  {
    id: 'r5',
    placeId: '3',
    rating: 4,
    comment: 'Bien mantenido, aunque a veces falta papel.',
    hasPaper: false,
    hasSoap: true,
    hasBrush: true,
    extras: ['Secador de manos'],
    date: '2026-03-22',
  },
  {
    id: 'r6',
    placeId: '3',
    rating: 4.5,
    comment: 'De los mejores banos publicos que he visto.',
    hasPaper: true,
    hasSoap: true,
    hasBrush: true,
    extras: ['Secador de manos', 'Papelera con tapa'],
    date: '2026-03-25',
  },
  {
    id: 'r7',
    placeId: '4',
    rating: 2,
    comment: 'Bastante sucio, necesita una limpieza urgente.',
    hasPaper: false,
    hasSoap: false,
    hasBrush: false,
    extras: [],
    date: '2026-03-12',
  },
];

export async function getPlaces() {
  try {
    const data = await AsyncStorage.getItem(PLACES_KEY);
    if (data) return JSON.parse(data);
    // Initialize with sample data
    await AsyncStorage.setItem(PLACES_KEY, JSON.stringify(SAMPLE_PLACES));
    return SAMPLE_PLACES;
  } catch {
    return SAMPLE_PLACES;
  }
}

export async function getReviews(placeId) {
  try {
    const data = await AsyncStorage.getItem(REVIEWS_KEY);
    let reviews = data ? JSON.parse(data) : SAMPLE_REVIEWS;
    if (!data) {
      await AsyncStorage.setItem(REVIEWS_KEY, JSON.stringify(SAMPLE_REVIEWS));
    }
    if (placeId) reviews = reviews.filter((r) => r.placeId === placeId);

    // T6 — excluir reviews de usuarios bloqueados
    const blockedIds = await getBlockedUserIds();
    if (blockedIds.length > 0) {
      reviews = reviews.filter((r) => !blockedIds.includes(r.userId));
    }

    return reviews;
  } catch {
    return SAMPLE_REVIEWS.filter((r) => !placeId || r.placeId === placeId);
  }
}

export async function addPlace(place) {
  const places = await getPlaces();
  const newPlace = {
    ...place,
    id: Date.now().toString(),
    avgRating: 0,
    reviewCount: 0,
  };
  places.push(newPlace);
  await AsyncStorage.setItem(PLACES_KEY, JSON.stringify(places));
  return newPlace;
}

export async function addReview(review) {
  const reviews = await getReviews();
  const currentUser = await getCurrentUser();
  const newReview = {
    ...review,
    id: Date.now().toString(),
    date: new Date().toISOString().split('T')[0],
    userId: currentUser ? currentUser.id : null,
  };
  reviews.push(newReview);
  await AsyncStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));

  // Update place average rating
  const places = await getPlaces();
  const placeIndex = places.findIndex((p) => p.id === review.placeId);
  if (placeIndex !== -1) {
    const placeReviews = reviews.filter((r) => r.placeId === review.placeId);
    const avg =
      placeReviews.reduce((sum, r) => sum + r.rating, 0) / placeReviews.length;
    places[placeIndex].avgRating = Math.round(avg * 10) / 10;
    places[placeIndex].reviewCount = placeReviews.length;
    await AsyncStorage.setItem(PLACES_KEY, JSON.stringify(places));
  }

  // Award XP to the current user
  await addXpToUser();

  return newReview;
}

// ─────────────────────────────────────────────────────────────────────────────
// T2 — Reportar opinión
// ─────────────────────────────────────────────────────────────────────────────

export async function reportReview(reviewId, reason) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Debes iniciar sesion para reportar');

  const { error } = await supabase.from('review_reports').insert({
    review_id: reviewId,
    reporter_id: session.user.id,
    reason,
  });

  if (error) {
    if (error.code === '23505') throw new Error('Ya has reportado esta opinion');
    throw new Error(error.message);
  }

  // Auto-moderar: 3 reportes → pending_review
  const { data: reports } = await supabase
    .from('review_reports')
    .select('id')
    .eq('review_id', reviewId);

  if (reports && reports.length >= 3) {
    await supabase
      .from('reviews')
      .update({ moderation_status: 'pending_review' })
      .eq('id', reviewId);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// T5 — Bloquear / desbloquear usuario
// ─────────────────────────────────────────────────────────────────────────────

export async function blockUser(blockedId) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Debes iniciar sesion');
  if (session.user.id === blockedId) throw new Error('No puedes bloquearte a ti mismo');

  const { error } = await supabase.from('blocked_users').insert({
    blocker_id: session.user.id,
    blocked_id: blockedId,
  });

  if (error && error.code !== '23505') throw new Error(error.message);
}

export async function unblockUser(blockedId) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  await supabase
    .from('blocked_users')
    .delete()
    .eq('blocker_id', session.user.id)
    .eq('blocked_id', blockedId);
}

export async function getBlockedUserIds() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return [];

  const { data } = await supabase
    .from('blocked_users')
    .select('blocked_id')
    .eq('blocker_id', session.user.id);

  return data ? data.map((r) => r.blocked_id) : [];
}
