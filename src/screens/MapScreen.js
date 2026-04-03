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
import { WebView } from 'react-native-webview';
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

function buildMapHtml(userLat, userLon, places) {
  const markers = places
    .map((p) => {
      const emoji = TYPE_EMOJI[p.type] || '📍';
      const rating = p.avgRating ? `${'💩'.repeat(Math.round(p.avgRating))} (${p.avgRating})` : 'Sin valorar';
      return `
        var marker_${p.id} = L.marker([${p.latitude}, ${p.longitude}])
          .addTo(map)
          .bindPopup('<b>${p.name.replace(/'/g, "\\'")}</b><br>${p.address.replace(/'/g, "\\'")}<br>${rating}');
      `;
    })
    .join('\n');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    body { margin: 0; padding: 0; }
    #map { width: 100vw; height: 100vh; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map').setView([${userLat}, ${userLon}], 16);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Circulo de 600m
    L.circle([${userLat}, ${userLon}], {
      radius: 600,
      color: '#8B6914',
      fillColor: '#8B6914',
      fillOpacity: 0.08,
      weight: 2
    }).addTo(map);

    // Marcador usuario
    var userIcon = L.divIcon({
      html: '<div style="background:#8B6914;width:14px;height:14px;border-radius:50%;border:3px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.4)"></div>',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
      className: ''
    });
    L.marker([${userLat}, ${userLon}], {icon: userIcon}).addTo(map).bindPopup('Tu estas aqui');

    ${markers}
  </script>
</body>
</html>`;
}

export default function MapScreen() {
  const [userLocation, setUserLocation] = useState(null);
  const [places, setPlaces] = useState([]);
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
    ? places.filter(
        (p) =>
          p.latitude &&
          p.longitude &&
          getDistanceKm(userLocation.latitude, userLocation.longitude, p.latitude, p.longitude) <= MAX_DISTANCE_KM
      )
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

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor="#8B6914" barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🗺️ Mapa de banos</Text>
        <Text style={styles.headerSub}>
          {nearbyPlaces.length} bano{nearbyPlaces.length !== 1 ? 's' : ''} en 600 m
        </Text>
      </View>
      {userLocation && (
        <WebView
          style={styles.map}
          originWhitelist={['*']}
          source={{ html: buildMapHtml(userLocation.latitude, userLocation.longitude, nearbyPlaces) }}
          javaScriptEnabled
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F0E1' },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F0E1',
    padding: 24,
  },
  loadingText: { marginTop: 12, fontSize: 15, color: '#666' },
  errorEmoji: { fontSize: 50, marginBottom: 12 },
  errorText: { fontSize: 15, color: '#E74C3C', textAlign: 'center', marginBottom: 20 },
  retryBtn: { backgroundColor: '#8B6914', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 20 },
  retryText: { color: '#FFF', fontWeight: '700' },
  header: {
    backgroundColor: '#8B6914',
    paddingTop: 16,
    paddingBottom: 12,
    paddingHorizontal: 20,
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFF' },
  headerSub: { fontSize: 13, color: '#F5DEB3', marginTop: 2 },
  map: { flex: 1 },
});
