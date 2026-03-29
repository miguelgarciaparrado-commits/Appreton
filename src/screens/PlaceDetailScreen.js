import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getReviews } from '../data/store';
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

  useFocusEffect(
    useCallback(() => {
      loadReviews();
    }, [])
  );

  async function loadReviews() {
    const data = await getReviews(place.id);
    setReviews(data.sort((a, b) => new Date(b.date) - new Date(a.date)));
  }

  // Calculate amenities summary
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

  const renderHeader = () => (
    <View>
      <View style={styles.placeHeader}>
        <Text style={styles.type}>{TYPE_LABELS[place.type] || '🏢 Otro'}</Text>
        <Text style={styles.name}>{place.name}</Text>
        <Text style={styles.address}>{place.address}</Text>
        <View style={styles.ratingRow}>
          <PoopRating rating={place.avgRating} size={28} readonly />
          <Text style={styles.ratingText}>{place.avgRating.toFixed(1)}/5</Text>
        </View>
      </View>

      {totalReviews > 0 && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Resumen de equipamiento</Text>
          <AmenityBar label="🧻 Papel" percent={paperPercent} />
          <AmenityBar label="🧴 Jabon" percent={soapPercent} />
          <AmenityBar label="🪥 Escobilla" percent={brushPercent} />
        </View>
      )}

      <View style={styles.reviewsHeader}>
        <Text style={styles.reviewsTitle}>
          Opiniones ({totalReviews})
        </Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddReview', { place })}
        >
          <Text style={styles.addBtnText}>+ Opinar</Text>
        </TouchableOpacity>
      </View>
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
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Aun no hay opiniones</Text>
            <Text style={styles.emptySubtext}>Se el primero en opinar!</Text>
          </View>
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
              backgroundColor: percent >= 70 ? '#27AE60' : percent >= 40 ? '#F39C12' : '#E74C3C',
            },
          ]}
        />
      </View>
      <Text style={styles.amenityPercent}>{percent}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F5F0E1',
  },
  list: {
    paddingBottom: 40,
  },
  placeHeader: {
    backgroundColor: '#8B6914',
    padding: 20,
    paddingTop: 10,
  },
  type: {
    fontSize: 14,
    color: '#F5DEB3',
    marginBottom: 4,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  address: {
    fontSize: 14,
    color: '#F5DEB3',
    marginBottom: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginLeft: 10,
  },
  summaryCard: {
    backgroundColor: '#FFF',
    margin: 16,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 12,
  },
  amenityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  amenityLabel: {
    width: 90,
    fontSize: 13,
  },
  barBg: {
    flex: 1,
    height: 10,
    backgroundColor: '#EAECEE',
    borderRadius: 5,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 5,
  },
  amenityPercent: {
    width: 40,
    textAlign: 'right',
    fontSize: 13,
    fontWeight: '600',
    color: '#2C3E50',
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  reviewsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  addBtn: {
    backgroundColor: '#8B6914',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addBtnText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  reviewCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    padding: 14,
    elevation: 1,
  },
  reviewTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewDate: {
    fontSize: 12,
    color: '#999',
  },
  reviewComment: {
    fontSize: 14,
    color: '#2C3E50',
    marginTop: 8,
    lineHeight: 20,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
});
