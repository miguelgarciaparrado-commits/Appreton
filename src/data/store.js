import { supabase } from './supabase';
import { addXpToUser, getCurrentUser } from './auth';

// Get all places from Supabase
export async function getPlaces() {
  try {
    const { data, error } = await supabase
      .from('places')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.log('Error fetching places:', error.message);
      return [];
    }

    return (data || []).map(mapDbPlace);
  } catch {
    return [];
  }
}

// Get reviews for a place (or all reviews)
export async function getReviews(placeId) {
  try {
    let query = supabase
      .from('reviews')
      .select('*, users(display_name, avatar_type)')
      .order('created_at', { ascending: false });

    if (placeId) {
      query = query.eq('place_id', placeId);
    }

    const { data, error } = await query;

    if (error) {
      console.log('Error fetching reviews:', error.message);
      return [];
    }

    return (data || []).map(mapDbReview);
  } catch {
    return [];
  }
}

// Add a new place
export async function addPlace(place) {
  const currentUser = await getCurrentUser();

  const { data, error } = await supabase
    .from('places')
    .insert({
      name: place.name,
      type: place.type,
      address: place.address || '',
      latitude: place.latitude || null,
      longitude: place.longitude || null,
      avg_rating: 0,
      review_count: 0,
      created_by: currentUser ? currentUser.id : null,
    })
    .select()
    .single();

  if (error) throw new Error('Error al anadir el lugar: ' + error.message);

  return mapDbPlace(data);
}

// Add a new review
export async function addReview(review) {
  const currentUser = await getCurrentUser();

  const { data, error } = await supabase
    .from('reviews')
    .insert({
      place_id: review.placeId,
      user_id: currentUser ? currentUser.id : null,
      rating: review.rating,
      comment: review.comment || '',
      has_paper: review.hasPaper || false,
      has_soap: review.hasSoap || false,
      has_brush: review.hasBrush || false,
      extras: review.extras || [],
      required_order: review.requiredOrder != null ? review.requiredOrder : null,
    })
    .select()
    .single();

  if (error) throw new Error('Error al guardar la opinion: ' + error.message);

  // Update place average rating
  await updatePlaceRating(review.placeId);

  // Award XP
  await addXpToUser();

  return mapDbReview(data);
}

// Recalculate and update place average rating
async function updatePlaceRating(placeId) {
  try {
    const { data: reviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('place_id', placeId);

    if (reviews && reviews.length > 0) {
      const avg = reviews.reduce((sum, r) => sum + Number(r.rating), 0) / reviews.length;
      await supabase
        .from('places')
        .update({
          avg_rating: Math.round(avg * 10) / 10,
          review_count: reviews.length,
        })
        .eq('id', placeId);
    }
  } catch {
    // ignore
  }
}

// Map database row to app place object
function mapDbPlace(row) {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    address: row.address || '',
    latitude: row.latitude,
    longitude: row.longitude,
    avgRating: Number(row.avg_rating) || 0,
    reviewCount: row.review_count || 0,
    createdBy: row.created_by,
  };
}

// Map database row to app review object
function mapDbReview(row) {
  return {
    id: row.id,
    placeId: row.place_id,
    userId: row.user_id,
    rating: Number(row.rating),
    comment: row.comment || '',
    hasPaper: row.has_paper,
    hasSoap: row.has_soap,
    hasBrush: row.has_brush,
    extras: row.extras || [],
    requiredOrder: row.required_order,
    date: row.date || row.created_at,
    userName: row.users?.display_name || 'Anonimo',
    userAvatar: row.users?.avatar_type || 'poop_1',
  };
}
