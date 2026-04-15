import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import { addPlace } from '../data/store';
import { notifyNewSuggestion } from '../data/notifySuggestion';

const PLACE_TYPES = [
  { key: 'bar', label: '🍺 Bar / Cafeteria', color: '#E67E22' },
  { key: 'restaurante', label: '🍽️ Restaurante', color: '#E74C3C' },
  { key: 'gasolinera', label: '⛽ Gasolinera', color: '#3498DB' },
  { key: 'centro_comercial', label: '🛒 Centro Comercial', color: '#9B59B6' },
];

const TYPE_KEYWORDS = {
  bar: ['bar', 'pub', 'cerveceria', 'taberna', 'tasca', 'bodega', 'cocktail', 'cafeteria', 'cafe', 'café', 'coffee'],
  restaurante: ['restaurante', 'restaurant', 'asador', 'pizzeria', 'hamburgueseria', 'kebab', 'comida', 'mesón', 'meson', 'parrilla'],
  gasolinera: ['gasolinera', 'gasolina', 'estacion de servicio', 'repsol', 'cepsa', 'bp', 'shell', 'galp'],
  centro_comercial: ['centro comercial', 'comercial', 'mall', 'mercado', 'hipermercado', 'carrefour', 'mercadona', 'alcampo', 'el corte ingles', 'ikea', 'primark'],
};

function detectPlaceType(text) {
  const lower = text.toLowerCase();
  for (const [type, keywords] of Object.entries(TYPE_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) return type;
    }
  }
  return null;
}

export default function AddPlaceScreen({ navigation }) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [type, setType] = useState('');
  const [coords, setCoords] = useState(null);
  const [locationStatus, setLocationStatus] = useState('loading');
  const [autoDetectedType, setAutoDetectedType] = useState(false);

  useEffect(() => {
    captureLocation();
  }, []);

  async function captureLocation() {
    try {
      setLocationStatus('loading');
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationStatus('error');
        return;
      }
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const newCoords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setCoords(newCoords);

      const geocode = await Location.reverseGeocodeAsync(newCoords);
      if (geocode && geocode.length > 0) {
        const place = geocode[0];
        const parts = [];
        if (place.street) parts.push(place.street);
        if (place.streetNumber) parts[0] = (parts[0] || '') + ' ' + place.streetNumber;
        if (place.city) parts.push(place.city);
        const fullAddress = parts.filter(Boolean).join(', ');
        if (fullAddress) setAddress(fullAddress);
      }
      setLocationStatus('ok');
    } catch {
      setLocationStatus('error');
    }
  }

  function handleNameChange(text) {
    setName(text);
    if (!autoDetectedType && text.length > 2) {
      const detected = detectPlaceType(text);
      if (detected) {
        setType(detected);
        setAutoDetectedType(true);
      }
    }
  }

  async function handleSubmit() {
    if (!name.trim()) {
      Alert.alert('Oops', 'Pon el nombre del sitio');
      return;
    }
    if (!address.trim()) {
      Alert.alert('Oops', 'Pon la dirección aproximada');
      return;
    }
    if (!type) {
      Alert.alert('Oops', 'Selecciona el tipo de local');
      return;
    }

    const placeData = {
      name: name.trim(),
      address: address.trim(),
      type,
      latitude: coords ? coords.latitude : 40.4168,
      longitude: coords ? coords.longitude : -3.7038,
    };

    const savedPlace = await addPlace(placeData);

    // Envia notificacion por email al admin (silencioso si falla)
    notifyNewSuggestion(savedPlace || placeData);

    setName('');
    setAddress('');
    setType('');
    setAutoDetectedType(false);

    Alert.alert(
      '¡Sugerencia enviada! 🚽',
      'Gracias por tu aportacion. Ya puedes añadir tu opinion sobre el WC.',
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container}>
          {/* Header informativo */}
          <View style={styles.infoCard}>
            <Text style={styles.infoEmoji}>💡</Text>
            <Text style={styles.infoTitle}>¿No aparece el sitio en Explorar?</Text>
            <Text style={styles.infoText}>
              Explorar usa Google Places para mostrarte establecimientos cercanos. Si hay un
              sitio con WC que no aparece ahi, sugierelo aqui y lo anadimos.
            </Text>
          </View>

          <Text style={styles.title}>💩 Sugerir sitio nuevo</Text>
          <Text style={styles.subtitle}>
            Sugiere un sitio con WC que no aparezca en el mapa de Explorar
          </Text>

          {/* Ubicación */}
          <View style={styles.locationCard}>
            {locationStatus === 'loading' ? (
              <View style={styles.locationRow}>
                <ActivityIndicator size="small" color="#8B6914" />
                <Text style={styles.locationLoadingText}>Detectando tu ubicación...</Text>
              </View>
            ) : locationStatus === 'ok' ? (
              <View style={styles.locationRow}>
                <Text style={styles.locationOkIcon}>📍</Text>
                <Text style={styles.locationOkText}>Ubicación detectada · dirección rellenada</Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.locationRow} onPress={captureLocation}>
                <Text>⚠️ </Text>
                <Text style={styles.locationErrorText}>No se pudo detectar la ubicación</Text>
                <Text style={styles.locationRetryText}>Reintentar</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Nombre del sitio</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Bar El Rincón"
              placeholderTextColor="#999"
              value={name}
              onChangeText={handleNameChange}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Dirección aproximada</Text>
            <TextInput
              style={[styles.input, address && locationStatus === 'ok' && styles.inputAutoFilled]}
              placeholder="Ej: Calle Mayor 12, Madrid"
              placeholderTextColor="#999"
              value={address}
              onChangeText={setAddress}
            />
            {address && locationStatus === 'ok' && (
              <Text style={styles.autoFilledHint}>📍 Rellenada automáticamente con tu GPS</Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Tipo de local</Text>
            {autoDetectedType && (
              <View style={styles.autoDetectedBanner}>
                <Text style={styles.autoDetectedText}>🎯 Tipo detectado automáticamente</Text>
              </View>
            )}
            <View style={styles.typesGrid}>
              {PLACE_TYPES.map((t) => (
                <TouchableOpacity
                  key={t.key}
                  style={[
                    styles.typeBtn,
                    type === t.key && { backgroundColor: t.color, borderColor: t.color },
                  ]}
                  onPress={() => { setType(t.key); setAutoDetectedType(false); }}
                >
                  <Text style={[styles.typeText, type === t.key && styles.typeTextActive]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
            <Text style={styles.submitText}>Sugerir sitio 🚽</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F0E1' },
  container: { padding: 20, paddingBottom: 40 },
  infoCard: {
    backgroundColor: '#EBF5FB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#3498DB',
    alignItems: 'flex-start',
  },
  infoEmoji: { fontSize: 28, marginBottom: 6 },
  infoTitle: { fontSize: 15, fontWeight: '700', color: '#2980B9', marginBottom: 4 },
  infoText: { fontSize: 13, color: '#555', lineHeight: 19 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#2C3E50' },
  subtitle: { fontSize: 14, color: '#666', marginTop: 4, marginBottom: 20 },
  locationCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#EEE',
    elevation: 1,
  },
  locationRow: { flexDirection: 'row', alignItems: 'center' },
  locationLoadingText: { marginLeft: 10, fontSize: 14, color: '#8B6914', fontWeight: '500' },
  locationOkIcon: { fontSize: 18, marginRight: 8 },
  locationOkText: { fontSize: 13, color: '#27AE60', fontWeight: '600' },
  locationErrorText: { fontSize: 14, color: '#E74C3C', flex: 1 },
  locationRetryText: { fontSize: 14, color: '#8B6914', fontWeight: '600' },
  section: { marginBottom: 20 },
  label: { fontSize: 15, fontWeight: '600', color: '#2C3E50', marginBottom: 8 },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  inputAutoFilled: { borderColor: '#27AE60', backgroundColor: '#F0FFF0' },
  autoFilledHint: { fontSize: 12, color: '#27AE60', marginTop: 4 },
  autoDetectedBanner: {
    backgroundColor: '#EBF5FB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 10,
  },
  autoDetectedText: { fontSize: 13, color: '#2980B9', fontWeight: '500' },
  typesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  typeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#DDD',
    backgroundColor: '#FFF',
    minWidth: '45%',
    alignItems: 'center',
  },
  typeText: { fontSize: 14, color: '#666' },
  typeTextActive: { color: '#FFF', fontWeight: '600' },
  submitBtn: {
    backgroundColor: '#8B6914',
    padding: 18,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 20,
    elevation: 3,
  },
  submitText: { color: '#FFF', fontSize: 17, fontWeight: 'bold' },
});
