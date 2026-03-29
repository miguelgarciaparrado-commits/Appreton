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

const PLACE_TYPES = [
  { key: 'bar', label: '🍺 Bar / Cafeteria', color: '#E67E22' },
  { key: 'restaurante', label: '🍽️ Restaurante', color: '#E74C3C' },
  { key: 'gasolinera', label: '⛽ Gasolinera', color: '#3498DB' },
  { key: 'centro_comercial', label: '🛒 Centro Comercial', color: '#9B59B6' },
  { key: 'otro', label: '🏢 Otro', color: '#95A5A6' },
];

// Keywords to auto-detect place type from address/name of nearby places
const TYPE_KEYWORDS = {
  bar: ['bar', 'pub', 'cerveceria', 'taberna', 'tasca', 'bodega', 'cocktail', 'cafeteria', 'cafe', 'café', 'coffee', 'starbucks', 'pasteler'],
  restaurante: ['restaurante', 'restaurant', 'asador', 'pizzeria', 'hamburgueseria', 'kebab', 'comida', 'mesón', 'meson', 'parrilla', 'wok', 'sushi'],
  gasolinera: ['gasolinera', 'gasolina', 'estacion de servicio', 'repsol', 'cepsa', 'bp', 'shell', 'galp', 'petrol'],
  centro_comercial: ['centro comercial', 'comercial', 'mall', 'mercado', 'hipermercado', 'carrefour', 'mercadona', 'alcampo', 'el corte ingles', 'ikea', 'primark', 'plaza'],
};

function detectPlaceType(text) {
  const lower = text.toLowerCase();
  for (const [type, keywords] of Object.entries(TYPE_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        return type;
      }
    }
  }
  return null;
}

export default function AddPlaceScreen({ navigation }) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [type, setType] = useState('');
  const [coords, setCoords] = useState(null);
  const [locationStatus, setLocationStatus] = useState('loading'); // 'loading' | 'ok' | 'error'
  const [detectedName, setDetectedName] = useState('');
  const [autoDetectedType, setAutoDetectedType] = useState(false);

  useEffect(() => {
    captureLocationAuto();
  }, []);

  async function captureLocationAuto() {
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

      // Reverse geocoding to get address
      const geocode = await Location.reverseGeocodeAsync({
        latitude: newCoords.latitude,
        longitude: newCoords.longitude,
      });

      if (geocode && geocode.length > 0) {
        const place = geocode[0];
        // Build address string
        const parts = [];
        if (place.street) parts.push(place.street);
        if (place.streetNumber) parts[0] = (parts[0] || '') + ' ' + place.streetNumber;
        if (place.city) parts.push(place.city);
        if (place.region && place.region !== place.city) parts.push(place.region);
        const fullAddress = parts.filter(Boolean).join(', ');
        if (fullAddress) setAddress(fullAddress);

        // Try to detect place name from geocoding
        if (place.name && place.name !== place.street) {
          setDetectedName(place.name);
        }

        // Try to auto-detect type from all available text
        const allText = [
          place.name || '',
          place.street || '',
          place.district || '',
          place.subregion || '',
        ].join(' ');

        const detected = detectPlaceType(allText);
        if (detected) {
          setType(detected);
          setAutoDetectedType(true);
        }
      }

      setLocationStatus('ok');
    } catch {
      setLocationStatus('error');
    }
  }

  // Also try to detect type when user types the name
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

  function handleTypeSelect(key) {
    setType(key);
    setAutoDetectedType(false); // User manually chose, stop auto-detecting
  }

  async function handleSubmit() {
    if (!name.trim()) {
      Alert.alert('Oops', 'Pon el nombre del sitio');
      return;
    }
    if (!address.trim()) {
      Alert.alert('Oops', 'Pon la direccion del sitio');
      return;
    }
    if (!type) {
      Alert.alert('Oops', 'Selecciona el tipo de local');
      return;
    }

    await addPlace({
      name: name.trim(),
      address: address.trim(),
      type,
      latitude: coords ? coords.latitude : 40.4168 + (Math.random() - 0.5) * 0.1,
      longitude: coords ? coords.longitude : -3.7038 + (Math.random() - 0.5) * 0.1,
    });

    // Reset form
    setName('');
    setAddress('');
    setType('');
    setAutoDetectedType(false);
    setDetectedName('');

    Alert.alert('Sitio anadido! 🚽', 'Ya puedes dejar tu opinion', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>💩 Anadir sitio nuevo</Text>
          <Text style={styles.subtitle}>
            Anade un bar, gasolinera o cualquier sitio con bano publico
          </Text>

          {/* Location status */}
          <View style={styles.locationCard}>
            {locationStatus === 'loading' ? (
              <View style={styles.locationRow}>
                <ActivityIndicator size="small" color="#8B6914" />
                <Text style={styles.locationLoadingText}>
                  Detectando tu ubicacion...
                </Text>
              </View>
            ) : locationStatus === 'ok' ? (
              <View>
                <View style={styles.locationRow}>
                  <Text style={styles.locationOkIcon}>📍</Text>
                  <Text style={styles.locationOkText}>Ubicacion detectada</Text>
                </View>
                {detectedName ? (
                  <TouchableOpacity
                    style={styles.detectedNameBtn}
                    onPress={() => {
                      setName(detectedName);
                      const detected = detectPlaceType(detectedName);
                      if (detected) {
                        setType(detected);
                        setAutoDetectedType(true);
                      }
                    }}
                  >
                    <Text style={styles.detectedNameText}>
                      Estas en: <Text style={styles.detectedNameBold}>{detectedName}</Text>?
                    </Text>
                    <Text style={styles.detectedNameHint}>Pulsa para usar este nombre</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : (
              <TouchableOpacity style={styles.locationRow} onPress={captureLocationAuto}>
                <Text style={styles.locationErrorIcon}>⚠️</Text>
                <Text style={styles.locationErrorText}>No se pudo detectar la ubicacion</Text>
                <Text style={styles.locationRetryText}>Reintentar</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Name */}
          <View style={styles.section}>
            <Text style={styles.label}>Nombre del sitio</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Bar El Rincon"
              placeholderTextColor="#999"
              value={name}
              onChangeText={handleNameChange}
            />
          </View>

          {/* Address */}
          <View style={styles.section}>
            <Text style={styles.label}>Direccion</Text>
            <TextInput
              style={[styles.input, address && locationStatus === 'ok' && styles.inputAutoFilled]}
              placeholder="Ej: Calle Mayor 12, Madrid"
              placeholderTextColor="#999"
              value={address}
              onChangeText={setAddress}
            />
            {address && locationStatus === 'ok' && (
              <Text style={styles.autoFilledHint}>📍 Rellenada automaticamente con tu GPS</Text>
            )}
          </View>

          {/* Place type */}
          <View style={styles.section}>
            <Text style={styles.label}>Tipo de local</Text>
            {autoDetectedType && (
              <View style={styles.autoDetectedBanner}>
                <Text style={styles.autoDetectedText}>
                  🎯 Tipo detectado automaticamente
                </Text>
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
                  onPress={() => handleTypeSelect(t.key)}
                >
                  <Text style={[styles.typeText, type === t.key && styles.typeTextActive]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
            <Text style={styles.submitText}>Anadir sitio 🚽</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F5F0E1',
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    marginBottom: 20,
  },
  locationCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#EEE',
    elevation: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationLoadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#8B6914',
    fontWeight: '500',
  },
  locationOkIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  locationOkText: {
    fontSize: 14,
    color: '#27AE60',
    fontWeight: '600',
  },
  locationErrorIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  locationErrorText: {
    fontSize: 14,
    color: '#E74C3C',
    flex: 1,
  },
  locationRetryText: {
    fontSize: 14,
    color: '#8B6914',
    fontWeight: '600',
  },
  detectedNameBtn: {
    marginTop: 10,
    backgroundColor: '#FFF9E6',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F0D060',
  },
  detectedNameText: {
    fontSize: 14,
    color: '#2C3E50',
  },
  detectedNameBold: {
    fontWeight: 'bold',
    color: '#8B6914',
  },
  detectedNameHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  inputAutoFilled: {
    borderColor: '#27AE60',
    backgroundColor: '#F0FFF0',
  },
  autoFilledHint: {
    fontSize: 12,
    color: '#27AE60',
    marginTop: 4,
  },
  autoDetectedBanner: {
    backgroundColor: '#EBF5FB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 10,
  },
  autoDetectedText: {
    fontSize: 13,
    color: '#2980B9',
    fontWeight: '500',
  },
  typesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  typeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#DDD',
    backgroundColor: '#FFF',
    minWidth: '45%',
    alignItems: 'center',
  },
  typeText: {
    fontSize: 15,
    color: '#666',
  },
  typeTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: '#8B6914',
    padding: 18,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 20,
    elevation: 3,
  },
  submitText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
