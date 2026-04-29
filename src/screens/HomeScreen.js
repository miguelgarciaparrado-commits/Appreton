import React, { useState, useCallback, useEffect, useRef } from 'react';
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
import { getPlaces, getReviews } from '../data/store';
import { getCurrentUser } from '../data/auth';
import { fetchNearbyPlaces } from '../data/googlePlaces';
import { fetchNearbyToiletsOSM } from '../data/osmPlaces';
import PlaceCard from '../components/PlaceCard';
import { getPinColor, formatAgo } from '../data/freshness';
import NearbyPrompt from '../components/NearbyPrompt';
import {
  cacheGooglePlacesForTask,
  startGeofencingForPlaces,
  DWELL_SECONDS,
  shouldNotifyForPlace,
  markPlaceNotified,
} from '../data/notifications';
import { logBusquedaBano, logFiltroAplicado } from '../data/analytics';

const PROXIMITY_RADIUS_M = 30; // a qué distancia consideramos "dentro"

const FILTERS = [
  { key: 'todos', label: '🚽 Todos' },
  { key: 'wc_publico', label: '🚻 WC Publicos' },
  { key: 'bar', label: '🍺 Bares' },
  { key: 'restaurante', label: '🍽️ Restaurantes' },
  { key: 'gasolinera', label: '⛽ Gasolineras' },
  { key: 'centro_comercial', label: '🛒 Centros' },
];

const SORT_OPTIONS = [
  { key: 'distance', label: '📍 Cercanos' },
  { key: 'rating', label: '⭐ Mejor valorados' },
];

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

function formatDistance(km) {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export default function HomeScreen({ navigation }) {
  const [appPlaces, setAppPlaces] = useState([]);
  const [googlePlaces, setGooglePlaces] = useState([]);
  const [osmPlaces, setOsmPlaces] = useState([]);
  const [allReviews, setAllReviews] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('todos');
  const [sortBy, setSortBy] = useState('distance');
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [streak, setStreak] = useState(0);
  const [hasReviewedToday, setHasReviewedToday] = useState(false);
  // Dwell detection en foreground:
  // - nearbyCandidate: sitio al que estamos cerca ahora mismo
  // - nearbySince: timestamp de cuándo empezamos a estar cerca
  // - nearbyPlace: sitio ya "confirmado" (pasó el dwell) y mostrando banner
  // - dismissedIds: sitios que el usuario ha descartado con "Ahora no"
  const nearbyCandidateRef = useRef(null);
  const nearbySinceRef = useRef(0);
  const [nearbyPlace, setNearbyPlace] = useState(null);
  const nearbyPlaceRef = useRef(null);
  const dismissedIdsRef = useRef(new Set());
  const locationSubRef = useRef(null);
  const filteredRef = useRef([]);

  useEffect(() => { nearbyPlaceRef.current = nearbyPlace; }, [nearbyPlace]);

  useFocusEffect(
    useCallback(() => {
      loadAppPlaces();
      getUserLocation();
      loadStreak();
    }, [])
  );

  async function loadStreak() {
    try {
      const user = await getCurrentUser();
      if (!user) return;
      const today = new Date().toISOString().split('T')[0];
      const last = user.lastReviewDate;
      // La racha solo sigue viva si la ultima opinion fue hoy o ayer.
      // Un hueco mayor la rompe aunque la BD aun guarde el valor antiguo.
      let liveStreak = 0;
      if (last) {
        const diffDays = Math.floor(
          (new Date(today) - new Date(last)) / 86400000
        );
        if (diffDays <= 1) liveStreak = user.currentStreak || 0;
      }
      setStreak(liveStreak);
      setHasReviewedToday(last === today);
    } catch {}
  }

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
      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setUserLocation(coords);
      setLocationError(null);
      setLocationLoading(false);
      // Fetch Google Places once we have the location
      loadGooglePlaces(coords.latitude, coords.longitude);
    } catch {
      setLocationError('No se pudo obtener la ubicacion');
      setLocationLoading(false);
    }
  }

  async function loadAppPlaces() {
    const [data, reviews] = await Promise.all([getPlaces(), getReviews()]);
    setAppPlaces(data);
    setAllReviews(reviews);
  }

  async function loadGooglePlaces(lat, lon) {
    setGoogleLoading(true);
    try {
      const [places, toilets] = await Promise.all([
        fetchNearbyPlaces(lat, lon, 800),
        fetchNearbyToiletsOSM(lat, lon, 800),
      ]);
      logBusquedaBano('auto');
      setGooglePlaces(places);
      setOsmPlaces(toilets);
      // Cachea para que la geofence task pueda buscar nombres
      await cacheGooglePlacesForTask(places);
      // Registra los 20 más cercanos como regiones de geofence
      const withDist = places
        .filter((p) => p.latitude && p.longitude)
        .map((p) => ({
          ...p,
          _d: getDistanceKm(lat, lon, p.latitude, p.longitude),
        }))
        .sort((a, b) => a._d - b._d);
      await startGeofencingForPlaces(withDist);
    } finally {
      setGoogleLoading(false);
    }
  }

  // Agrupa reviews por placeId y calcula media/conteo en cliente
  // Así el Explorar muestra la misma media que el detalle sin depender
  // de places.avg_rating de Supabase (puede quedar desactualizada)
  const reviewsByPlace = React.useMemo(() => {
    const map = new Map();
    for (const r of allReviews) {
      if (!map.has(r.placeId)) map.set(r.placeId, []);
      map.get(r.placeId).push(r);
    }
    const result = {};
    for (const [pid, list] of map.entries()) {
      const avg = list.reduce((s, r) => s + r.rating, 0) / list.length;
      const latest = list.reduce((a, b) => {
        const da = new Date(a.createdAt || a.date);
        const db = new Date(b.createdAt || b.date);
        return da > db ? a : b;
      });
      result[pid] = {
        avgRating: Math.round(avg * 10) / 10,
        reviewCount: list.length,
        lastReviewDate: latest.createdAt || latest.date,
      };
    }
    return result;
  }, [allReviews]);

  function withComputedRating(p) {
    const stats = reviewsByPlace[p.id];
    if (!stats) return p;
    return {
      ...p,
      avgRating: stats.avgRating,
      reviewCount: stats.reviewCount,
      lastReviewDate: stats.lastReviewDate,
    };
  }

  // --- Foreground dwell detection (banner in-app) ---
  // Vigila la ubicación mientras la pantalla está enfocada y, cuando el
  // usuario lleva DWELL_SECONDS segundos dentro del radio de un sitio,
  // muestra el NearbyPrompt.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      async function start() {
        try {
          if (locationSubRef.current) return;
          const { status } = await Location.getForegroundPermissionsAsync();
          if (status !== 'granted') return;
          locationSubRef.current = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.High,
              distanceInterval: 5,
              timeInterval: 5000,
            },
            (loc) => {
              if (cancelled) return;
              evaluateProximity(loc.coords);
            }
          );
        } catch (e) {
          console.error('[Appreton] watchPosition error:', e);
        }
      }
      start();
      return () => {
        cancelled = true;
        if (locationSubRef.current) {
          try { locationSubRef.current.remove(); } catch {}
          locationSubRef.current = null;
        }
      };
    }, [])
  );

  async function evaluateProximity(coords) {
    const list = filteredRef.current || [];
    let best = null;
    let bestDist = Infinity;
    for (const p of list) {
      if (dismissedIdsRef.current.has(p.id)) continue;
      if (!p.latitude || !p.longitude) continue;
      const d = getDistanceKm(coords.latitude, coords.longitude, p.latitude, p.longitude) * 1000;
      if (d <= PROXIMITY_RADIUS_M && d < bestDist) {
        best = p;
        bestDist = d;
      }
    }

    const currentCandidate = nearbyCandidateRef.current;

    if (!best) {
      // Salimos de la zona: reseteamos el candidato
      if (currentCandidate || nearbyPlaceRef.current) {
        nearbyCandidateRef.current = null;
        nearbySinceRef.current = 0;
        setNearbyPlace(null);
      }
      return;
    }

    // Cambiamos de sitio (p.ej. andando entre bares)
    if (!currentCandidate || currentCandidate.id !== best.id) {
      nearbyCandidateRef.current = best;
      nearbySinceRef.current = Date.now();
      return;
    }

    // Mismo sitio: comprobamos si ya llevamos el dwell completo
    if (!nearbyPlaceRef.current && Date.now() - nearbySinceRef.current >= DWELL_SECONDS * 1000) {
      // Throttle 24h: no insistir con el mismo sitio
      const canNotify = await shouldNotifyForPlace(best.id);
      if (canNotify) {
        setNearbyPlace(best);
        await markPlaceNotified(best.id);
      } else {
        dismissedIdsRef.current.add(best.id);
      }
    }
  }

  function handleNearbyOpinar() {
    const place = nearbyPlace;
    setNearbyPlace(null);
    dismissedIdsRef.current.add(place.id);
    navigation.navigate('PlaceDetail', { place });
  }

  function handleNearbyDismiss() {
    if (nearbyPlace) dismissedIdsRef.current.add(nearbyPlace.id);
    setNearbyPlace(null);
  }

  // Merge Google Places with app places
  // App places (including those created from Google results) take priority
  const mergedPlaces = React.useMemo(() => {
    const appIds = new Set(appPlaces.map((p) => p.id));
    const googleOnly = googlePlaces.filter((gp) => !appIds.has(gp.id));
    const knownIds = new Set([...appIds, ...googleOnly.map((g) => g.id)]);
    const osmOnly = osmPlaces.filter((op) => !knownIds.has(op.id));
    return [...appPlaces, ...googleOnly, ...osmOnly].map(withComputedRating);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appPlaces, googlePlaces, osmPlaces, reviewsByPlace]);

  // Add distance, filter to 600 m
  const placesWithDistance = mergedPlaces
    .map((p) => {
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
    })
    .filter((p) => !userLocation || p.distance === null || p.distance <= 0.8);

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

  // Sincroniza filteredRef para que evaluateProximity vea la última lista
  useEffect(() => {
    filteredRef.current = filtered;
  }, [filtered]);

  const isLoading = locationLoading || googleLoading;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor="#8B6914" barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.logo}>💩 Appreton</Text>
        <Text style={styles.subtitle}>Te cagas? abreme</Text>
      </View>

      {/* Banner de racha */}
      {streak > 0 && (
        <View style={styles.streakBanner}>
          <Text style={styles.streakText}>
            🔥 Racha de {streak} {streak === 1 ? 'dia' : 'dias'}
            {hasReviewedToday ? ' — ¡hoy ya opinaste!' : ' — opina hoy para no perderla'}
          </Text>
        </View>
      )}

      {/* Banner de dwell detection: aparece cuando llevas >DWELL_SECONDS cerca de un sitio */}
      {nearbyPlace && (
        <NearbyPrompt
          place={nearbyPlace}
          onOpinar={handleNearbyOpinar}
          onDismiss={handleNearbyDismiss}
        />
      )}

      {/* Location / Google status */}
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
        ) : googleLoading ? (
          <View style={styles.locationRow}>
            <ActivityIndicator size="small" color="#4285F4" />
            <Text style={styles.locationText}>Cargando establecimientos cercanos...</Text>
          </View>
        ) : (
          <View style={styles.locationRow}>
            <Text style={styles.locationIcon}>📍</Text>
            <Text style={styles.locationTextOk}>
              {googlePlaces.length > 0
                ? `${filtered.length} sitios en 800 m — Google Places activo`
                : 'Ubicacion activa · Añade tu clave Google para más sitios'}
            </Text>
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
              onPress={() => { setFilter(item.key); logFiltroAplicado(item.key); }}
            >
              <Text style={[styles.filterText, filter === item.key && styles.filterTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {locationLoading ? (
        <View style={styles.empty}>
          <ActivityIndicator size="large" color="#8B6914" style={{ marginTop: 40 }} />
          <Text style={styles.locationText}>Obteniendo tu ubicación...</Text>
        </View>
      ) : (
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
            googleLoading ? (
              <View style={styles.empty}>
                <ActivityIndicator size="large" color="#4285F4" style={{ marginTop: 40 }} />
                <Text style={styles.locationText}>Cargando establecimientos cercanos...</Text>
              </View>
            ) : (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>🚽</Text>
                <Text style={styles.emptyText}>
                  {locationError ? 'Activa la ubicación para ver sitios cercanos' : 'No se encontraron sitios en 800 m'}
                </Text>
                <Text style={styles.emptySubtext}>Sugiere uno en la pestaña Sugerir</Text>
              </View>
            )
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F0E1' },
  header: {
    backgroundColor: '#8B6914',
    paddingTop: 16,
    paddingBottom: 12,
    paddingHorizontal: 20,
  },
  logo: { fontSize: 28, fontWeight: 'bold', color: '#FFF' },
  subtitle: { fontSize: 14, color: '#F5DEB3', marginTop: 2 },
  streakBanner: {
    backgroundColor: '#FFF3E0',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#FFE0B2',
  },
  streakText: { fontSize: 13, color: '#E65100', fontWeight: '600', textAlign: 'center' },
  locationBar: {
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  locationRow: { flexDirection: 'row', alignItems: 'center' },
  locationIcon: { fontSize: 16, marginRight: 8 },
  locationText: { fontSize: 13, color: '#666', marginLeft: 8 },
  locationTextOk: { fontSize: 13, color: '#27AE60', flexShrink: 1 },
  locationTextError: { fontSize: 13, color: '#E74C3C', flex: 1 },
  locationRetry: { fontSize: 13, color: '#8B6914', fontWeight: '600', marginLeft: 8 },
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
  sortActive: { backgroundColor: '#2C3E50', borderColor: '#2C3E50' },
  sortText: { fontSize: 13, color: '#666' },
  sortTextActive: { color: '#FFF', fontWeight: '600' },
  filtersContainer: { backgroundColor: '#F5F0E1' },
  filters: { paddingHorizontal: 12, paddingVertical: 10 },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  filterActive: { backgroundColor: '#8B6914', borderColor: '#8B6914' },
  filterText: { fontSize: 13, color: '#666' },
  filterTextActive: { color: '#FFF', fontWeight: '600' },
  list: { paddingVertical: 8, paddingBottom: 100 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 60 },
  emptyText: { fontSize: 18, color: '#666', marginTop: 16, textAlign: 'center', paddingHorizontal: 20 },
  emptySubtext: { fontSize: 14, color: '#999', marginTop: 4 },
});
