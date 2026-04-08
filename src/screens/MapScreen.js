import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import { getPlaces } from '../data/store';

const MAX_DISTANCE_KM = 0.6;

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
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const TYPE_EMOJI = {
  bar: '🍺',
  restaurante: '🍽️',
  gasolinera: '⛽',
  centro_comercial: '🛒',
  otro: '📍',
};

export default function NearbyScreen({ navigation }) {
  const [places, setPlaces] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState(null);

  useFocusEffect(
    useCallback(() => {
      init();
    }, [])
  );

  async function init() {
    setLoading(true);
    await Promise.all([getUserLocation(), loadPlaces()]);
    setLoading(false);
  }

  async function getUserLocation() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Permiso de ubicacion denegado');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      setLocationError(null);
    } catch {
      setLocationError('No se pudo obtener la ubicacion');
    }
  }

  async function loadPlaces() {
    const data = await getPlaces();
    setPlaces(data);
  }

  const nearby = places
    .filter((p) => p.latitude && p.longitude)
    .map((p) => {
      if (!userLocation) return { ...p, distance: null };
      const dist = getDistanceKm(userLocation.latitude, userLocation.longitude, p.latitude, p.longitude);
      return { ...p, distance: dist };
    })
    .filter((p) => !userLocation || (p.distance !== null && p.distance <= MAX_DISTANCE_KM))
    .sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999));

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#8B6914" />
        <Text style={styles.loadingText}>Buscando WC cercanos...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor="#8B6914" barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📍 Cerca de ti</Text>
        <Text style={styles.headerSub}>
          {locationError
            ? locationError
            : `${nearby.length} WC en menos de 600 m`}
        </Text>
      </View>

      <FlatList
        data={nearby}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🚽</Text>
            <Text style={styles.emptyText}>No hay WC valorados a menos de 600 m</Text>
            <Text style={styles.emptySubtext}>Prueba a añadir uno con el botón +</Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('Explorar', { screen: 'PlaceDetail', params: { place: item } })}
            activeOpacity={0.8}
          >
            <View style={styles.rankBadge}>
              <Text style={styles.rankText}>{index + 1}</Text>
            </View>
            <View style={styles.cardBody}>
              <View style={styles.cardTop}>
                <Text style={styles.cardEmoji}>{TYPE_EMOJI[item.type] || '📍'}</Text>
                <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
              </View>
              <Text style={styles.cardAddress} numberOfLines={1}>{item.address}</Text>
              <View style={styles.cardBottom}>
                <Text style={styles.cardRating}>
                  {'💩'.repeat(Math.round(item.avgRating || 0)) || 'Sin valorar'}
                </Text>
                <Text style={styles.cardReviews}>
                  {item.reviewCount || 0} opinion{(item.reviewCount || 0) !== 1 ? 'es' : ''}
                </Text>
              </View>
            </View>
            <View style={styles.distanceBadge}>
              <Text style={styles.distanceText}>
                {item.distance !== null ? `${Math.round(item.distance * 1000)} m` : '—'}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F0E1' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F0E1' },
  loadingText: { marginTop: 12, fontSize: 15, color: '#666' },
  header: {
    backgroundColor: '#8B6914',
    paddingTop: 16,
    paddingBottom: 14,
    paddingHorizontal: 20,
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFF' },
  headerSub: { fontSize: 13, color: '#F5DEB3', marginTop: 2 },
  list: { padding: 12, paddingBottom: 80 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginBottom: 10,
    padding: 14,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#8B6914',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  cardBody: { flex: 1 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  cardEmoji: { fontSize: 16 },
  cardName: { fontSize: 15, fontWeight: '700', color: '#2C3E50', flex: 1 },
  cardAddress: { fontSize: 12, color: '#999', marginBottom: 4 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardRating: { fontSize: 14 },
  cardReviews: { fontSize: 11, color: '#AAA' },
  distanceBadge: {
    backgroundColor: '#FFF9E6',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginLeft: 10,
    borderWidth: 1,
    borderColor: '#E8D9A0',
  },
  distanceText: { fontSize: 13, fontWeight: '700', color: '#8B6914' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 60 },
  emptyText: { fontSize: 17, color: '#666', marginTop: 16 },
  emptySubtext: { fontSize: 13, color: '#999', marginTop: 6 },
});
