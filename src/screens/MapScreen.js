import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import { getPlaces, getReviews } from '../data/store';
import { fetchNearbyPlaces } from '../data/googlePlaces';

const TYPE_COLOR = {
  bar: '#E67E22',
  restaurante: '#E74C3C',
  gasolinera: '#3498DB',
  centro_comercial: '#9B59B6',
};

const TYPE_EMOJI = {
  bar: '🍺',
  restaurante: '🍽️',
  gasolinera: '⛽',
  centro_comercial: '🛒',
};

const RADIUS_M = 600;

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

// Color del badge del rating (verde/ambar/rojo/gris)
function getRatingColor(rating, reviewCount) {
  if (!reviewCount) return '#9E9E9E'; // gris sin valoraciones
  if (rating >= 4) return '#27AE60'; // verde
  if (rating >= 3) return '#F39C12'; // naranja
  return '#E74C3C'; // rojo
}

export default function MapScreen({ navigation }) {
  const [userLocation, setUserLocation] = useState(null);
  const [rawPlaces, setRawPlaces] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState(null);
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
      const [appPlaces, googlePlaces, allReviews] = await Promise.all([
        getPlaces(),
        fetchNearbyPlaces(coords.latitude, coords.longitude, RADIUS_M),
        getReviews(),
      ]);

      // Dedupe por id
      const appIds = new Set(appPlaces.map((p) => p.id));
      const merged = [
        ...appPlaces,
        ...googlePlaces.filter((gp) => !appIds.has(gp.id)),
      ];
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
      >
        {places.map((place) => {
          const typeColor = TYPE_COLOR[place.type] || '#8B6914';
          const emoji = TYPE_EMOJI[place.type] || '🚽';
          const ratingColor = getRatingColor(place.avgRating, place.reviewCount);
          return (
            <Marker
              key={place.id}
              coordinate={{ latitude: place.latitude, longitude: place.longitude }}
              tracksViewChanges={false}
              anchor={{ x: 0.5, y: 1 }}
            >
              <View style={styles.markerWrap}>
                <View style={[styles.markerCircle, { backgroundColor: typeColor }]}>
                  <Text style={styles.markerEmoji}>{emoji}</Text>
                </View>
                <View style={[styles.markerRating, { backgroundColor: ratingColor }]}>
                  <Text style={styles.markerRatingText}>
                    {place.reviewCount > 0 ? place.avgRating.toFixed(1) : '?'}
                  </Text>
                </View>
              </View>
              <Callout
                onPress={() =>
                  navigation.navigate('Explorar', {
                    screen: 'PlaceDetail',
                    params: { place },
                  })
                }
                style={styles.callout}
              >
                <View style={styles.calloutContent}>
                  <Text style={styles.calloutEmoji}>{emoji}</Text>
                  <View style={styles.calloutInfo}>
                    <Text style={styles.calloutName} numberOfLines={2}>
                      {place.name}
                    </Text>
                    <Text style={styles.calloutRating}>
                      {place.reviewCount > 0
                        ? `${'💩'.repeat(Math.round(place.avgRating))} ${place.avgRating.toFixed(1)} (${place.reviewCount})`
                        : 'Sin valorar'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.calloutTap}>Toca para ver detalle</Text>
              </Callout>
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
    marginTop: -8,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#FFF',
    minWidth: 28,
    alignItems: 'center',
  },
  markerRatingText: { fontSize: 11, fontWeight: '800', color: '#FFF' },
  // ── Callout ──────────────────────────────────────────
  callout: { width: 220 },
  calloutContent: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  calloutEmoji: { fontSize: 24 },
  calloutInfo: { flex: 1 },
  calloutName: { fontSize: 14, fontWeight: '700', color: '#2C3E50' },
  calloutRating: { fontSize: 12, color: '#8B6914', marginTop: 2 },
  calloutTap: { fontSize: 11, color: '#999', marginTop: 6, textAlign: 'center' },
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
