import React, { useState, useCallback, useRef } from 'react';
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
import { getPlaces } from '../data/store';
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

export default function MapScreen({ navigation }) {
  const [userLocation, setUserLocation] = useState(null);
  const [places, setPlaces] = useState([]);
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

      // Carga establecimientos: app DB + Google Places
      const [appPlaces, googlePlaces] = await Promise.all([
        getPlaces(),
        fetchNearbyPlaces(coords.latitude, coords.longitude, 600),
      ]);
      const appIds = new Set(appPlaces.map((p) => p.id));
      const merged = [...appPlaces, ...googlePlaces.filter((gp) => !appIds.has(gp.id))];
      setPlaces(merged.filter((p) => p.latitude && p.longitude));
    } catch {
      setLocationError('No se pudo obtener la ubicacion');
    } finally {
      setLoading(false);
    }
  }

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
        {places.map((place) => (
          <Marker
            key={place.id}
            coordinate={{ latitude: place.latitude, longitude: place.longitude }}
            pinColor={TYPE_COLOR[place.type] || '#8B6914'}
          >
            <Callout
              onPress={() => navigation.navigate('Explorar', {
                screen: 'PlaceDetail',
                params: { place },
              })}
              style={styles.callout}
            >
              <View style={styles.calloutContent}>
                <Text style={styles.calloutEmoji}>{TYPE_EMOJI[place.type] || '🚽'}</Text>
                <View style={styles.calloutInfo}>
                  <Text style={styles.calloutName} numberOfLines={2}>{place.name}</Text>
                  <Text style={styles.calloutRating}>
                    {place.reviewCount > 0
                      ? `${'💩'.repeat(Math.round(place.avgRating))} (${place.reviewCount})`
                      : 'Sin valorar'}
                  </Text>
                </View>
              </View>
              <Text style={styles.calloutTap}>Toca para ver detalle</Text>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* Boton centrar */}
      <TouchableOpacity style={styles.centerBtn} onPress={centerOnUser}>
        <Text style={styles.centerBtnText}>📍</Text>
      </TouchableOpacity>

      {/* Contador */}
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{places.length} WC cercanos</Text>
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
  callout: { width: 220 },
  calloutContent: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  calloutEmoji: { fontSize: 24 },
  calloutInfo: { flex: 1 },
  calloutName: { fontSize: 14, fontWeight: '700', color: '#2C3E50' },
  calloutRating: { fontSize: 12, color: '#8B6914', marginTop: 2 },
  calloutTap: { fontSize: 11, color: '#999', marginTop: 6, textAlign: 'center' },
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
