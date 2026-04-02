import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import { getPlaces } from '../data/store';

const MAX_DISTANCE_KM = 0.6; // 600 metros

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

function ratingColor(rating) {
  if (!rating || rating === 0) return '#999';
  if (rating >= 4) return '#27AE60';
  if (rating >= 3) return '#F39C12';
  return '#E74C3C';
}

export default function MapScreen({ navigation }) {
  const [userLocation, setUserLocation] = useState(null);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);

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
      setUserLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      setLocationError(null);
    } catch {
      setLocationError('No se pudo obtener la ubicacion');
    }
  }

  async function loadPlaces() {
    const data = await getPlaces();
    setPlaces(data);
  }

  const nearbyPlaces = userLocation
    ? places.filter((p) => {
        if (!p.latitude || !p.longitude) return false;
        return getDistanceKm(userLocation.latitude, userLocation.longitude, p.latitude, p.longitude) <= MAX_DISTANCE_KM;
      })
    : [];

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
        <Text style={styles.errorEmoji}>📍</Text>
        <Text style={styles.errorText}>{locationError}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={init}>
          <Text style={styles.retryText}>Reintentar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const initialRegion = userLocation
    ? {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.012,
        longitudeDelta: 0.012,
      }
    : null;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor="#8B6914" barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🗺️ Mapa de banos</Text>
        <Text style={styles.headerSub}>
          {nearbyPlaces.length} bano{nearbyPlaces.length !== 1 ? 's' : ''} en 600 m
        </Text>
      </View>

      {initialRegion && (
        <MapView
          style={styles.map}
          initialRegion={initialRegion}
          showsUserLocation
          showsMyLocationButton
        >
          {/* Radio de 600m */}
          <Circle
            center={userLocation}
            radius={600}
            strokeColor="rgba(139,105,20,0.5)"
            fillColor="rgba(139,105,20,0.08)"
            strokeWidth={2}
          />

          {/* Marcadores de sitios */}
          {nearbyPlaces.map((place) => (
            <Marker
              key={place.id}
              coordinate={{ latitude: place.latitude, longitude: place.longitude }}
              onPress={() => setSelectedPlace(place)}
            >
              <View style={[styles.markerBubble, { borderColor: ratingColor(place.avgRating) }]}>
                <Text style={styles.markerEmoji}>
                  {TYPE_EMOJI[place.type] || '📍'}
                </Text>
              </View>
            </Marker>
          ))}
        </MapView>
      )}

      {/* Info card del sitio seleccionado */}
      {selectedPlace && (
        <View style={styles.infoCard}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedPlace(null)}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.infoName}>{selectedPlace.name}</Text>
          <Text style={styles.infoAddress}>{selectedPlace.address}</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoRating}>
              {'💩'.repeat(Math.round(selectedPlace.avgRating || 0)) || 'Sin valorar'}
            </Text>
            <Text style={styles.infoReviews}>
              {selectedPlace.reviewCount || 0} opinion{(selectedPlace.reviewCount || 0) !== 1 ? 'es' : ''}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.detailBtn}
            onPress={() => {
              setSelectedPlace(null);
              navigation.navigate('Explorar', {
                screen: 'PlaceDetail',
                params: { place: selectedPlace },
              });
            }}
          >
            <Text style={styles.detailBtnText}>Ver detalles</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F5F0E1',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F0E1',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#666',
  },
  errorEmoji: {
    fontSize: 50,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 15,
    color: '#E74C3C',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryBtn: {
    backgroundColor: '#8B6914',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 20,
  },
  retryText: {
    color: '#FFF',
    fontWeight: '700',
  },
  header: {
    backgroundColor: '#8B6914',
    paddingTop: 16,
    paddingBottom: 12,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
  },
  headerSub: {
    fontSize: 13,
    color: '#F5DEB3',
    marginTop: 2,
  },
  map: {
    flex: 1,
  },
  markerBubble: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 6,
    borderWidth: 2,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  markerEmoji: {
    fontSize: 20,
  },
  infoCard: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 18,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 14,
    padding: 4,
  },
  closeText: {
    fontSize: 16,
    color: '#999',
    fontWeight: '700',
  },
  infoName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginRight: 24,
  },
  infoAddress: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoRating: {
    fontSize: 18,
  },
  infoReviews: {
    fontSize: 13,
    color: '#999',
  },
  detailBtn: {
    backgroundColor: '#8B6914',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  detailBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 15,
  },
});
