import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getReviews, ensurePlaceExists } from '../data/store';
import PoopRating from '../components/PoopRating';
import AmenitiesBadges from '../components/AmenitiesBadges';

const TYPE_LABELS = {
  bar: '🍺 Bar',
  restaurante: '🍽️ Restaurante',
  gasolinera: '⛽ Gasolinera',
  centro_comercial: '🛒 Centro Comercial',
  otro: '🏢 Otro',
};

export default function PlaceDetailScreen({ route, navigation }) {
  const { place } = route.params;
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadReviews();
    }, [])
  );

  async function loadReviews() {
    setLoading(true);
    const data = await getReviews(place.id);
    setReviews(data.sort((a, b) => new Date(b.date) - new Date(a.date)));
    setLoading(false);
  }

  async function handleOpinar() {
    // Si el sitio viene de Google y aún no existe en nuestra BD, lo creamos
    if (place.isGoogleOnly) {
      setCreating(true);
      try {
        await ensurePlaceExists(place);
      } finally {
        setCreating(false);
      }
    }
    navigation.navigate('AddReview', { place });
  }

  const totalReviews = reviews.length;
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
        {totalReviews > 0 ? (
          <View style={styles.ratingRow}>
            <PoopRating rating={place.avgRating} size={28} readonly />
            <Text style={styles.ratingText}>{place.avgRating.toFixed(1)}/5</Text>
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
              <Text style={styles.addBtnText}>+ Opinar</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderReview = ({ item }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewTop}>
        <PoopRating rating={item.rating} size={18} readonly />
        <Text style={styles.reviewDate}>{item.date}</Text>
      </View>
      <Text style={styles.reviewComment}>{item.comment}</Text>
      <AmenitiesBadges review={item} />
    </View>
  );

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
  address: { fontSize: 14, color: '#F5DEB3', marginBottom: 12 },
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
  reviewTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewDate: { fontSize: 12, color: '#999' },
  reviewComment: { fontSize: 14, color: '#2C3E50', marginTop: 8, lineHeight: 20 },
});
