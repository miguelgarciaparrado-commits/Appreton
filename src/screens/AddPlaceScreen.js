import React, { useState } from 'react';
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
  { key: 'bar', label: '🍺 Bar', color: '#E67E22' },
  { key: 'restaurante', label: '🍽️ Restaurante', color: '#E74C3C' },
  { key: 'gasolinera', label: '⛽ Gasolinera', color: '#3498DB' },
  { key: 'centro_comercial', label: '🛒 Centro Comercial', color: '#9B59B6' },
  { key: 'cafeteria', label: '☕ Cafeteria', color: '#1ABC9C' },
  { key: 'otro', label: '🏢 Otro', color: '#95A5A6' },
];

export default function AddPlaceScreen({ navigation }) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [type, setType] = useState('');
  const [useLocation, setUseLocation] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [coords, setCoords] = useState(null);

  async function captureLocation() {
    try {
      setGettingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitamos tu ubicacion para marcar el sitio en el mapa');
        return;
      }
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setCoords({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      setUseLocation(true);
    } catch {
      Alert.alert('Error', 'No se pudo obtener la ubicacion');
    } finally {
      setGettingLocation(false);
    }
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

          <View style={styles.section}>
            <Text style={styles.label}>Nombre del sitio</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Bar El Rincon"
              placeholderTextColor="#999"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Direccion</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Calle Mayor 12, Madrid"
              placeholderTextColor="#999"
              value={address}
              onChangeText={setAddress}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Tipo de local</Text>
            <View style={styles.typesGrid}>
              {PLACE_TYPES.map((t) => (
                <TouchableOpacity
                  key={t.key}
                  style={[
                    styles.typeBtn,
                    type === t.key && { backgroundColor: t.color, borderColor: t.color },
                  ]}
                  onPress={() => setType(t.key)}
                >
                  <Text style={[styles.typeText, type === t.key && styles.typeTextActive]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Location button */}
          <View style={styles.section}>
            <Text style={styles.label}>Ubicacion</Text>
            <TouchableOpacity
              style={[styles.locationBtn, useLocation && styles.locationBtnActive]}
              onPress={captureLocation}
              disabled={gettingLocation}
            >
              {gettingLocation ? (
                <ActivityIndicator size="small" color="#8B6914" />
              ) : (
                <Text style={styles.locationBtnText}>
                  {useLocation
                    ? '📍 Ubicacion capturada!'
                    : '📍 Usar mi ubicacion actual'}
                </Text>
              )}
            </TouchableOpacity>
            <Text style={styles.locationHint}>
              Pulsa para guardar la ubicacion exacta del sitio
            </Text>
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
    marginBottom: 24,
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
  locationBtn: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#8B6914',
    borderStyle: 'dashed',
  },
  locationBtnActive: {
    backgroundColor: '#D5F5E3',
    borderColor: '#27AE60',
    borderStyle: 'solid',
  },
  locationBtnText: {
    fontSize: 16,
    color: '#2C3E50',
    fontWeight: '600',
  },
  locationHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 6,
    textAlign: 'center',
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
