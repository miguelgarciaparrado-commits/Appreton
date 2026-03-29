import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import { getPlaces } from '../data/store';
import PlaceCard from '../components/PlaceCard';

const FILTERS = [
  { key: 'todos', label: '🚽 Todos' },
  { key: 'bar', label: '🍺 Bares' },
  { key: 'restaurante', label: '🍽️ Restaurantes' },
  { key: 'gasolinera', label: '⛽ Gasolineras' },
  { key: 'centro_comercial', label: '🛒 Centros' },
  { key: 'cafeteria', label: '☕ Cafeterias' },
];

const SORT_OPTIONS = [
  { key: 'distance', label: '📍 Cercanos' },
  { key: 'rating', label: '⭐ Mejor valorados' },
];

// Haversine formula - distance in km between two coordinates
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

function formatDistance(km) {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export default function HomeScreen({ navigation }) {
  const [places, setPlaces] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('todos');
  const [sortBy, setSortBy] = useState('distance');
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState(null);

  useFocusEffect(
    useCallback(() => {
      loadPlaces();
      getUserLocation();
    }, [])
  );

  async function getUserLocation() {
    try {
      setLocationLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Permiso de ubicacion denegado');
        setLocationLoading(false);
        return;
      }
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      setLocationError(null);
    } catch {
      setLocationError('No se pudo obtener la ubicacion');
    } finally {
      setLocationLoading(false);
    }
  }

  async function loadPlaces() {
    const data = await getPlaces();
    setPlaces(data);
  }

  // Add distance to each place
  const placesWithDistance = places.map((p) => {
    if (userLocation && p.latitude && p.longitude) {
      const dist = getDistanceKm(
        userLocation.latitude,
        userLocation.longitude,
        p.latitude,
        p.longitude
      );
      return { ...p, distance: dist, distanceText: formatDistance(dist) };
    }
    return { ...p, distance: null, distanceText: null };
  });

  const filtered = placesWithDistance
    .filter((p) => filter === 'todos' || p.type === filter)
    .filter(
      (p) =>
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.address.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'distance' && a.distance != null && b.distance != null) {
        return a.distance - b.distance;
      }
      return b.avgRating - a.avgRating;
    });

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor="#8B6914" barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.logo}>💩 Appreton</Text>
        <Text style={styles.subtitle}>Encuentra el bano perfecto</Text>
      </View>

      {/* Location status */}
      <View style={styles.locationBar}>
        {locationLoading ? (
          <View style={styles.locationRow}>
            <ActivityIndicator size="small" color="#8B6914" />
            <Text style={styles.locationText}>Buscando tu ubicacion...</Text>
          </View>
        ) : locationError ? (
          <TouchableOpacity style={styles.locationRow} onPress={getUserLocation}>
            <Text style={styles.locationIcon}>📍</Text>
            <Text style={styles.locationTextError}>{locationError}</Text>
            <Text style={styles.locationRetry}>Reintentar</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.locationRow}>
            <Text style={styles.locationIcon}>📍</Text>
            <Text style={styles.locationTextOk}>Ubicacion activada - mostrando sitios cercanos</Text>
          </View>
        )}
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.search}
          placeholder="Buscar bares, gasolineras..."
          placeholderTextColor="#999"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Sort options */}
      <View style={styles.sortContainer}>
        {SORT_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.key}
            style={[styles.sortBtn, sortBy === opt.key && styles.sortActive]}
            onPress={() => setSortBy(opt.key)}
          >
            <Text style={[styles.sortText, sortBy === opt.key && styles.sortTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FILTERS}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.filters}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterBtn, filter === item.key && styles.filterActive]}
              onPress={() => setFilter(item.key)}
            >
              <Text style={[styles.filterText, filter === item.key && styles.filterTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PlaceCard
            place={item}
            onPress={() => navigation.navigate('PlaceDetail', { place: item })}
          />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🚽</Text>
            <Text style={styles.emptyText}>No se encontraron sitios</Text>
            <Text style={styles.emptySubtext}>Anade uno con el boton +</Text>
          </View>
        }
      />
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
    paddingTop: 16,
    paddingBottom: 12,
    paddingHorizontal: 20,
  },
  logo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#F5DEB3',
    marginTop: 2,
  },
  locationBar: {
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  locationText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 8,
  },
  locationTextOk: {
    fontSize: 13,
    color: '#27AE60',
  },
  locationTextError: {
    fontSize: 13,
    color: '#E74C3C',
    flex: 1,
  },
  locationRetry: {
    fontSize: 13,
    color: '#8B6914',
    fontWeight: '600',
    marginLeft: 8,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#8B6914',
  },
  search: {
    backgroundColor: '#FFF',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 10,
    fontSize: 15,
    elevation: 2,
  },
  sortContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 8,
    backgroundColor: '#F5F0E1',
  },
  sortBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  sortActive: {
    backgroundColor: '#2C3E50',
    borderColor: '#2C3E50',
  },
  sortText: {
    fontSize: 13,
    color: '#666',
  },
  sortTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  filtersContainer: {
    backgroundColor: '#F5F0E1',
  },
  filters: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  filterActive: {
    backgroundColor: '#8B6914',
    borderColor: '#8B6914',
  },
  filterText: {
    fontSize: 13,
    color: '#666',
  },
  filterTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  list: {
    paddingVertical: 8,
    paddingBottom: 100,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyIcon: {
    fontSize: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
});
