import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { logComoLlegar } from '../data/analytics';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import { getPlaces, getReviews } from '../data/store';
import { fetchNearbyPlaces } from '../data/googlePlaces';
import { fetchNearbyToiletsOSM } from '../data/osmPlaces';

const TYPE_COLOR = {
  bar: '#E67E22',
  restaurante: '#E74C3C',
  gasolinera: '#3498DB',
  centro_comercial: '#9B59B6',
  wc_publico: '#16A085',
};

const TYPE_EMOJI = {
  bar: '🍺',
  restaurante: '🍽️',
  gasolinera: '⛽',
  centro_comercial: '🛒',
  wc_publico: '🚻',
};

const RADIUS_M = 600;

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

function distanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (v) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function MapScreen({ navigation }) {
  const [userLocation, setUserLocation] = useState(null);
  const [rawPlaces, setRawPlaces] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const mapRef = useRef(null);

  useFocusEffect(
    useCallback(() => {
      init();
    }, [])
  );

  async function init() {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Activa la ubicacion para ver el mapa');
        setLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setUserLocation(coords);
      setLocationError(null);

      // Carga en paralelo: sitios y TODAS las reviews (para calcular medias)
      const [appPlaces, googlePlaces, osmToilets, allReviews] = await Promise.all([
        getPlaces(),
        fetchNearbyPlaces(coords.latitude, coords.longitude, RADIUS_M),
        fetchNearbyToiletsOSM(coords.latitude, coords.longitude, RADIUS_M),
        getReviews(),
      ]);

      const appIds = new Set(appPlaces.map((p) => p.id));
      const googleOnly = googlePlaces.filter((gp) => !appIds.has(gp.id));
      const knownIds = new Set([...appIds, ...googleOnly.map((g) => g.id)]);
      const osmOnly = osmToilets.filter((op) => !knownIds.has(op.id));
      const merged = [...appPlaces, ...googleOnly, ...osmOnly];
      setRawPlaces(merged.filter((p) => p.latitude && p.longitude));
      setReviews(allReviews);
    } catch {
      setLocationError('No se pudo obtener la ubicacion');
    } finally {
      setLoading(false);
    }
  }

  // Mapa de reviews agrupadas por placeId para calcular medias en cliente
  // (misma logica que HomeScreen — asi el mapa muestra la misma media que
  // el listado y el detalle, sin depender de places.avg_rating).
  const reviewsByPlace = useMemo(() => {
    const map = new Map();
    for (const r of reviews) {
      if (!map.has(r.placeId)) map.set(r.placeId, []);
      map.get(r.placeId).push(r);
    }
    const result = {};
    for (const [pid, list] of map.entries()) {
      const avg = list.reduce((s, r) => s + r.rating, 0) / list.length;
      result[pid] = {
        avgRating: Math.round(avg * 10) / 10,
        reviewCount: list.length,
      };
    }
    return result;
  }, [reviews]);

  // Places filtrados: dentro del radio de 600m del usuario y con rating computado
  const places = useMemo(() => {
    if (!userLocation) return [];
    return rawPlaces
      .map((p) => {
        const stats = reviewsByPlace[p.id];
        return {
          ...p,
          avgRating: stats?.avgRating ?? p.avgRating ?? 0,
          reviewCount: stats?.reviewCount ?? p.reviewCount ?? 0,
          _dist: distanceMeters(
            userLocation.latitude,
            userLocation.longitude,
            p.latitude,
            p.longitude
          ),
        };
      })
      .filter((p) => p._dist <= RADIUS_M);
  }, [rawPlaces, reviewsByPlace, userLocation]);

  function centerOnUser() {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.008,
        longitudeDelta: 0.008,
      }, 600);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#8B6914" />
        <Text style={styles.loadingText}>Cargando mapa...</Text>
      </SafeAreaView>
    );
  }

  if (locationError) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorIcon}>📍</Text>
        <Text style={styles.errorText}>{locationError}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={init}>
          <Text style={styles.retryText}>Reintentar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#8B6914" barStyle="light-content" />
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.008,
          longitudeDelta: 0.008,
        }}
        showsUserLocation
        showsMyLocationButton={false}
        onPress={() => setSelectedPlace(null)}
      >
        {places.map((p) => {
          const typeColor = TYPE_COLOR[p.type] || '#8B6914';
          const emoji = TYPE_EMOJI[p.type] || '🚽';
          const isSelected = selectedPlace?.id === p.id;
          const ratingLabel = p.reviewCount > 0
            ? `💩${p.avgRating.toFixed(1)}`
            : '?';
          return (
            <Marker
              key={p.id}
              coordinate={{ latitude: p.latitude, longitude: p.longitude }}
              tracksViewChanges={false}
              anchor={{ x: 0.5, y: 1 }}
              onPress={() => setSelectedPlace(p)}
            >
              <View style={styles.markerWrap}>
                <View style={[
                  styles.markerCircle,
                  { backgroundColor: typeColor },
                  isSelected && styles.markerSelected,
                ]}>
                  <Text style={styles.markerEmoji}>{emoji}</Text>
                </View>
                <View style={styles.markerRating}>
                  <Text style={styles.markerRatingText}>{ratingLabel}</Text>
                </View>
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* Boton centrar */}
      <TouchableOpacity style={styles.centerBtn} onPress={centerOnUser}>
        <Text style={styles.centerBtnText}>📍</Text>
      </TouchableOpacity>

      {/* Contador real (basado en lo que se dibuja) */}
      <View style={styles.badge}>
        <Text style={styles.badgeText}>
          {places.length} WC en {RADIUS_M} m
        </Text>
      </View>

      {/* Tarjeta del sitio seleccionado */}
      {selectedPlace && (
        <View style={styles.placeCard}>
          <View style={styles.placeCardHeader}>
            <Text style={styles.placeCardEmoji}>
              {TYPE_EMOJI[selectedPlace.type] || '🚽'}
            </Text>
            <View style={styles.placeCardInfo}>
              <Text style={styles.placeCardName} numberOfLines={1}>
                {selectedPlace.name}
              </Text>
              <Text style={styles.placeCardRating}>
                {selectedPlace.reviewCount > 0
                  ? `${'💩'.repeat(Math.round(selectedPlace.avgRating))} ${selectedPlace.avgRating.toFixed(1)} (${selectedPlace.reviewCount})`
                  : 'Sin valorar'}
              </Text>
            </View>
          </View>
          <View style={styles.placeCardButtons}>
            <TouchableOpacity
              style={styles.placeCardBtn}
              onPress={() => { logComoLlegar(selectedPlace.id, selectedPlace.name); openDirections(selectedPlace.latitude, selectedPlace.longitude); }}
              activeOpacity={0.8}
            >
              <Text style={styles.placeCardBtnEmoji}>🧭</Text>
              <Text style={styles.placeCardBtnLabel}>Cómo llegar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.placeCardBtn, styles.placeCardBtnPrimary]}
              onPress={() => {
                setSelectedPlace(null);
                navigation.navigate('Explorar', {
                  screen: 'PlaceDetail',
                  params: { place: selectedPlace },
                });
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.placeCardBtnEmoji}>💩</Text>
              <Text style={[styles.placeCardBtnLabel, styles.placeCardBtnLabelPrimary]}>
                Ver opiniones
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F0E1',
    padding: 32,
  },
  loadingText: { marginTop: 12, fontSize: 15, color: '#666' },
  errorIcon: { fontSize: 48 },
  errorText: { fontSize: 16, color: '#666', marginTop: 12, textAlign: 'center' },
  retryBtn: {
    marginTop: 20,
    backgroundColor: '#8B6914',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 20,
  },
  retryText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  // ── Marker custom ─────────────────────────────────────
  markerWrap: {
    alignItems: 'center',
  },
  markerCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  markerEmoji: { fontSize: 20, lineHeight: 22 },
  markerRating: {
    marginTop: -6,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#FFF',
    backgroundColor: '#5D4E37',
    alignItems: 'center',
  },
  markerRatingText: { fontSize: 10, color: '#FFF', fontWeight: '700' },
  markerSelected: { borderWidth: 3, borderColor: '#F0D060' },
  // ── Tarjeta de sitio seleccionado ────────────────────
  placeCard: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 14,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  placeCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  placeCardEmoji: { fontSize: 28 },
  placeCardInfo: { flex: 1 },
  placeCardName: { fontSize: 15, fontWeight: '700', color: '#2C3E50' },
  placeCardRating: { fontSize: 12, color: '#8B6914', marginTop: 2 },
  placeCardButtons: { flexDirection: 'row', gap: 10 },
  placeCardBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F5F0E1',
  },
  placeCardBtnPrimary: { backgroundColor: '#8B6914' },
  placeCardBtnEmoji: { fontSize: 16 },
  placeCardBtnLabel: { fontSize: 13, fontWeight: '600', color: '#2C3E50' },
  placeCardBtnLabelPrimary: { color: '#FFF' },
  // ── Botones y badge ──────────────────────────────────
  centerBtn: {
    position: 'absolute',
    bottom: 90,
    right: 16,
    backgroundColor: '#FFF',
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  centerBtnText: { fontSize: 22 },
  badge: {
    position: 'absolute',
    top: 16,
    alignSelf: 'center',
    backgroundColor: 'rgba(139,105,20,0.9)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
});
