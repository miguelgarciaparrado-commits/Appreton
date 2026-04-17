import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import { getPlaces } from '../data/store';
import PoopRating from '../components/PoopRating';

// Haversine formula - distance in km
function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function RankingScreen({ navigation }) {
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState(null);

  useFocusEffect(
    useCallback(() => {
      loadNearbyRanking();
    }, [])
  );

  async function loadNearbyRanking() {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Activa la ubicacion para ver el ranking cercano');
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const userLat = location.coords.latitude;
      const userLon = location.coords.longitude;

      const allPlaces = await getPlaces();

      // Distancia, filtro ≤ 800 m, orden por mejor valoracion primero
      const nearby = allPlaces
        .map((p) => {
          const distKm = getDistanceKm(userLat, userLon, p.latitude, p.longitude);
          const distMeters = Math.round(distKm * 1000);
          return { ...p, distMeters };
        })
        .filter((p) => p.distMeters <= 800)
        .filter((p) => p.reviewCount > 0)
        .sort((a, b) => {
          // Primero por nota, luego por distancia como desempate
          if (b.avgRating !== a.avgRating) return b.avgRating - a.avgRating;
          return a.distMeters - b.distMeters;
        });

      setNearbyPlaces(nearby);
      setLocationError(null);
    } catch {
      setLocationError('No se pudo obtener la ubicacion');
    } finally {
      setLoading(false);
    }
  }

  const renderItem = ({ item, index }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => navigation.navigate('Explorar', {
        screen: 'PlaceDetail',
        params: { place: item },
      })}
    >
      <View style={styles.rank}>
        <Text style={styles.rankText}>
          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
        </Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.address}>{item.address}</Text>
        <PoopRating rating={item.avgRating} size={16} readonly />
      </View>
      <View style={styles.scoreColumn}>
        <View style={styles.score}>
          <Text style={styles.scoreText}>{item.avgRating.toFixed(1)}</Text>
          <Text style={styles.scoreLabel}>💩</Text>
        </View>
        <View style={styles.distanceBadge}>
          <Text style={styles.distanceText}>{item.distMeters} m</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>🏆 Ranking cercano</Text>
        <Text style={styles.subtitle}>Los mejores WC a menos de 800 m</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B6914" />
          <Text style={styles.loadingText}>Buscando WC cerca de ti...</Text>
        </View>
      ) : locationError ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📍</Text>
          <Text style={styles.emptyText}>{locationError}</Text>
        </View>
      ) : (
        <FlatList
          data={nearbyPlaces}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🚽</Text>
              <Text style={styles.emptyText}>No hay WC valorados a menos de 800 m</Text>
              <Text style={styles.emptySubtext}>Opina sobre los sitios cercanos en Explorar</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F5F0E1',
  },
  header: {
    backgroundColor: '#8B6914',
    padding: 20,
    paddingTop: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#F5DEB3',
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#8B6914',
  },
  list: {
    paddingVertical: 10,
    paddingBottom: 100,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginVertical: 5,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    elevation: 2,
  },
  rank: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F0E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B6914',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  address: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  scoreColumn: {
    alignItems: 'center',
    marginLeft: 8,
  },
  score: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#8B6914',
  },
  scoreLabel: {
    fontSize: 14,
    marginLeft: 2,
  },
  distanceBadge: {
    backgroundColor: '#EBF5FB',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 4,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2980B9',
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyIcon: {
    fontSize: 50,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
    paddingHorizontal: 30,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
});
