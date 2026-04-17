import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  getReviews,
  ensurePlaceExists,
  getUserReviewForPlace,
  likeReview,
  unlikeReview,
  getLikedReviewsMap,
} from '../data/store';
import PoopRating from '../components/PoopRating';
import AmenitiesBadges from '../components/AmenitiesBadges';
import { logBanoVisualizado, logComoLlegar, logLikeOpinion } from '../data/analytics';

const TYPE_LABELS = {
  bar: '🍺 Bar',
  restaurante: '🍽️ Restaurante',
  gasolinera: '⛽ Gasolinera',
  centro_comercial: '🛒 Centro Comercial',
  wc_publico: '🚻 WC Publico',
};

function openDirections(latitude, longitude) {
  const url = Platform.select({
    ios: `maps:0,0?daddr=${latitude},${longitude}`,
    android: `google.navigation:q=${latitude},${longitude}`,
  });
  Linking.openURL(url).catch(() => {
    Linking.openURL(
      `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
    );
  });
}

export default function PlaceDetailScreen({ route, navigation }) {
  const { place } = route.params;
  logBanoVisualizado(place.id, place.name);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [userHasReview, setUserHasReview] = useState(false);
  const [likedMap, setLikedMap] = useState({}); // { reviewId: timestamp }

  useFocusEffect(
    useCallback(() => {
      loadReviews();
      checkUserReview();
      loadLikedMap();
    }, [])
  );

  async function loadReviews() {
    setLoading(true);
    const data = await getReviews(place.id);
    setReviews(data.sort((a, b) => new Date(b.date) - new Date(a.date)));
    setLoading(false);
  }

  async function loadLikedMap() {
    try {
      const map = await getLikedReviewsMap();
      setLikedMap(map);
    } catch {}
  }

  async function handleLike(reviewId) {
    const alreadyLiked = !!likedMap[reviewId];
    if (!alreadyLiked) logLikeOpinion(reviewId);
    const delta = alreadyLiked ? -1 : 1;

    // Actualizacion optimista
    if (alreadyLiked) {
      setLikedMap((m) => { const cp = { ...m }; delete cp[reviewId]; return cp; });
    } else {
      setLikedMap((m) => ({ ...m, [reviewId]: Date.now() }));
    }
    setReviews((list) =>
      list.map((r) =>
        r.id === reviewId ? { ...r, likes: Math.max(0, (r.likes || 0) + delta) } : r
      )
    );

    try {
      if (alreadyLiked) {
        await unlikeReview(reviewId);
      } else {
        await likeReview(reviewId);
      }
    } catch (e) {
      // Revertir
      if (alreadyLiked) {
        setLikedMap((m) => ({ ...m, [reviewId]: Date.now() }));
      } else {
        setLikedMap((m) => { const cp = { ...m }; delete cp[reviewId]; return cp; });
      }
      setReviews((list) =>
        list.map((r) =>
          r.id === reviewId ? { ...r, likes: Math.max(0, (r.likes || 0) - delta) } : r
        )
      );
      console.error('[Appreton] like/unlike error', e);
    }
  }

  async function checkUserReview() {
    try {
      const existing = await getUserReviewForPlace(place.id);
      setUserHasReview(!!existing);
    } catch {
      setUserHasReview(false);
    }
  }

  async function handleOpinar() {
    // Si el sitio viene de Google y aún no existe en nuestra BD, lo creamos
    if (place.isGoogleOnly) {
      setCreating(true);
      try {
        await ensurePlaceExists(place);
      } catch (e) {
        setCreating(false);
        Alert.alert(
          'No se pudo crear el sitio',
          e.message || 'Revisa las policies RLS de Supabase y vuelve a intentarlo.',
        );
        return;
      }
      setCreating(false);
    }
    navigation.navigate('AddReview', { place });
  }

  const totalReviews = reviews.length;
  // Calcular rating real desde las reviews cargadas (no el dato estatico del lugar)
  const avgRating = totalReviews
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / totalReviews) * 10) / 10
    : 0;

  const paperPercent = totalReviews
    ? Math.round((reviews.filter((r) => r.hasPaper).length / totalReviews) * 100)
    : 0;
  const soapPercent = totalReviews
    ? Math.round((reviews.filter((r) => r.hasSoap).length / totalReviews) * 100)
    : 0;
  const brushPercent = totalReviews
    ? Math.round((reviews.filter((r) => r.hasBrush).length / totalReviews) * 100)
    : 0;
  const orderReviews = reviews.filter((r) => r.requiredOrder != null);
  const orderPercent = orderReviews.length
    ? Math.round((orderReviews.filter((r) => r.requiredOrder).length / orderReviews.length) * 100)
    : null;

  const renderHeader = () => (
    <View>
      <View style={styles.placeHeader}>
        <Text style={styles.type}>{TYPE_LABELS[place.type] || '🏢 Otro'}</Text>
        <Text style={styles.name}>{place.name}</Text>
        <Text style={styles.address}>{place.address}</Text>
        {place.latitude && place.longitude && (
          <TouchableOpacity
            style={styles.directionsBtn}
            onPress={() => { logComoLlegar(place.id, place.name); openDirections(place.latitude, place.longitude); }}
            activeOpacity={0.8}
          >
            <Text style={styles.directionsBtnText}>🧭 Cómo llegar</Text>
          </TouchableOpacity>
        )}
        {totalReviews > 0 ? (
          <View style={styles.ratingRow}>
            <PoopRating rating={avgRating} size={28} readonly />
            <Text style={styles.ratingText}>{avgRating.toFixed(1)}/5</Text>
          </View>
        ) : (
          <Text style={styles.noRatingText}>Sin opiniones aún</Text>
        )}
      </View>

      {/* CTA prominente cuando no hay opiniones */}
      {totalReviews === 0 && !loading && (
        <TouchableOpacity
          style={styles.firstReviewCard}
          onPress={handleOpinar}
          disabled={creating}
          activeOpacity={0.85}
        >
          {creating ? (
            <ActivityIndicator color="#8B6914" />
          ) : (
            <>
              <Text style={styles.firstReviewEmoji}>💩</Text>
              <Text style={styles.firstReviewTitle}>¡Sé el primero en opinar!</Text>
              <Text style={styles.firstReviewSubtitle}>
                Cuentanos como esta el WC de este sitio
              </Text>
              <View style={styles.firstReviewBtn}>
                <Text style={styles.firstReviewBtnText}>+ Añadir opinión</Text>
              </View>
            </>
          )}
        </TouchableOpacity>
      )}

      {totalReviews > 0 && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Resumen de equipamiento</Text>
          <AmenityBar label="🧻 Papel" percent={paperPercent} />
          <AmenityBar label="🧴 Jabón" percent={soapPercent} />
          <AmenityBar label="🪥 Escobilla" percent={brushPercent} />
          {orderPercent != null && (
            <AmenityBar label="🍺 Piden consumir" percent={orderPercent} />
          )}
        </View>
      )}

      {totalReviews > 0 && (
        <View style={styles.reviewsHeader}>
          <Text style={styles.reviewsTitle}>Opiniones ({totalReviews})</Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={handleOpinar}
            disabled={creating}
          >
            {creating ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.addBtnText}>
                {userHasReview ? '✏️ Editar' : '+ Opinar'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderReview = ({ item }) => {
    const isLiked = !!likedMap[item.id];
    const likeCount = item.likes || 0;
    const genderIcon = item.gender === 'hombre' ? '👨' : item.gender === 'mujer' ? '👩' : null;
    return (
      <View style={styles.reviewCard}>
        <View style={styles.reviewAuthorRow}>
          <Text style={styles.reviewAuthor} numberOfLines={1}>
            {genderIcon ? `${genderIcon} ` : ''}{item.authorName || 'Anonimo'}
          </Text>
          <Text style={styles.reviewDate}>{item.date}</Text>
        </View>
        <View style={styles.reviewTop}>
          <PoopRating rating={item.rating} size={18} readonly />
        </View>
        <Text style={styles.reviewComment}>{item.comment}</Text>
        <AmenitiesBadges review={item} />
        <View style={styles.reviewFooter}>
          <TouchableOpacity
            style={[styles.likeBtn, isLiked && styles.likeBtnActive]}
            onPress={() => handleLike(item.id)}
            activeOpacity={0.7}
          >
            <Text style={[styles.likeIcon, isLiked && styles.likeIconActive]}>
              {isLiked ? '❤️' : '🤍'}
            </Text>
            <Text style={[styles.likeCount, isLiked && styles.likeCountActive]}>
              {likeCount}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={reviews}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        renderItem={renderReview}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color="#8B6914" style={{ marginTop: 20 }} />
          ) : null
        }
      />
    </SafeAreaView>
  );
}

function AmenityBar({ label, percent }) {
  return (
    <View style={styles.amenityRow}>
      <Text style={styles.amenityLabel}>{label}</Text>
      <View style={styles.barBg}>
        <View
          style={[
            styles.barFill,
            {
              width: `${percent}%`,
              backgroundColor:
                percent >= 70 ? '#27AE60' : percent >= 40 ? '#F39C12' : '#E74C3C',
            },
          ]}
        />
      </View>
      <Text style={styles.amenityPercent}>{percent}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F0E1' },
  list: { paddingBottom: 40 },
  placeHeader: {
    backgroundColor: '#8B6914',
    padding: 20,
    paddingTop: 10,
  },
  type: { fontSize: 14, color: '#F5DEB3', marginBottom: 4 },
  name: { fontSize: 24, fontWeight: 'bold', color: '#FFF', marginBottom: 4 },
  address: { fontSize: 14, color: '#F5DEB3', marginBottom: 8 },
  directionsBtn: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    marginBottom: 10,
  },
  directionsBtnText: { color: '#FFF', fontWeight: '600', fontSize: 13 },
  ratingRow: { flexDirection: 'row', alignItems: 'center' },
  ratingText: { fontSize: 20, fontWeight: 'bold', color: '#FFF', marginLeft: 10 },
  noRatingText: { fontSize: 14, color: '#F5DEB3', fontStyle: 'italic' },
  // Primera opinión CTA
  firstReviewCard: {
    backgroundColor: '#FFF',
    margin: 16,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    elevation: 3,
    borderWidth: 2,
    borderColor: '#F0D060',
    borderStyle: 'dashed',
  },
  firstReviewEmoji: { fontSize: 56 },
  firstReviewTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginTop: 12,
    textAlign: 'center',
  },
  firstReviewSubtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 6,
    textAlign: 'center',
  },
  firstReviewBtn: {
    backgroundColor: '#8B6914',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 30,
    marginTop: 20,
    elevation: 2,
  },
  firstReviewBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  // Summary
  summaryCard: {
    backgroundColor: '#FFF',
    margin: 16,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
  },
  summaryTitle: { fontSize: 16, fontWeight: 'bold', color: '#2C3E50', marginBottom: 12 },
  amenityRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  amenityLabel: { width: 110, fontSize: 13 },
  barBg: { flex: 1, height: 10, backgroundColor: '#EAECEE', borderRadius: 5, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 5 },
  amenityPercent: { width: 40, textAlign: 'right', fontSize: 13, fontWeight: '600', color: '#2C3E50' },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  reviewsTitle: { fontSize: 18, fontWeight: 'bold', color: '#2C3E50' },
  addBtn: {
    backgroundColor: '#8B6914',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  addBtnText: { color: '#FFF', fontWeight: '600', fontSize: 14 },
  reviewCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    padding: 14,
    elevation: 1,
  },
  reviewAuthorRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  reviewAuthor: { fontSize: 13, fontWeight: '700', color: '#8B6914', flex: 1, marginRight: 8 },
  reviewTop: { flexDirection: 'row', alignItems: 'center' },
  reviewDate: { fontSize: 12, color: '#999' },
  reviewComment: { fontSize: 14, color: '#2C3E50', marginTop: 8, lineHeight: 20 },
  reviewFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  likeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F8F8F8',
    gap: 6,
  },
  likeBtnActive: {
    backgroundColor: '#FDEDEC',
  },
  likeIcon: { fontSize: 16 },
  likeIconActive: {},
  likeCount: { fontSize: 13, color: '#888', fontWeight: '700' },
  likeCountActive: { color: '#E74C3C' },
});
