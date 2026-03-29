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
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { getCurrentUser, saveUserProfile } from '../data/auth';
import PoopAvatar, { getAllPoopAvatars } from '../components/PoopAvatar';

export default function ProfileSetupScreen({ onComplete }) {
  const [displayName, setDisplayName] = useState('');
  const [avatarType, setAvatarType] = useState('poop_1');
  const [customAvatarUri, setCustomAvatarUri] = useState(null);

  const poopAvatars = getAllPoopAvatars();

  useEffect(() => {
    loadExisting();
  }, []);

  async function loadExisting() {
    const user = await getCurrentUser();
    if (user) {
      if (user.displayName) setDisplayName(user.displayName);
      if (user.avatarType) setAvatarType(user.avatarType);
      if (user.customAvatarUri) setCustomAvatarUri(user.customAvatarUri);
    }
  }

  async function pickImage() {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitamos acceso a tu galeria');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setCustomAvatarUri(result.assets[0].uri);
        setAvatarType('custom');
      }
    } catch {
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  }

  async function takePhoto() {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitamos acceso a tu camara');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setCustomAvatarUri(result.assets[0].uri);
        setAvatarType('custom');
      }
    } catch {
      Alert.alert('Error', 'No se pudo tomar la foto');
    }
  }

  async function handleSave() {
    if (!displayName.trim()) {
      Alert.alert('Oops', 'Elige un nombre de usuario');
      return;
    }
    if (displayName.trim().length < 3) {
      Alert.alert('Oops', 'El nombre debe tener al menos 3 caracteres');
      return;
    }

    await saveUserProfile({
      displayName: displayName.trim(),
      avatarType,
      customAvatarUri: avatarType === 'custom' ? customAvatarUri : null,
      profileCompleted: true,
    });

    onComplete();
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>{'\uD83D\uDCA9'} Configura tu perfil</Text>
          <Text style={styles.subtitle}>
            Elige como te veran los demas Appretoneros
          </Text>

          {/* Current avatar preview */}
          <View style={styles.previewSection}>
            <PoopAvatar
              type={avatarType}
              customUri={customAvatarUri}
              size={100}
            />
            <Text style={styles.previewLabel}>Tu avatar</Text>
          </View>

          {/* Display name */}
          <View style={styles.section}>
            <Text style={styles.label}>Nombre de usuario</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: CacaMaster2000"
              placeholderTextColor="#999"
              value={displayName}
              onChangeText={setDisplayName}
              maxLength={20}
              autoCapitalize="none"
            />
            <Text style={styles.hint}>{displayName.length}/20 caracteres</Text>
          </View>

          {/* Custom photo options */}
          <View style={styles.section}>
            <Text style={styles.label}>Foto personalizada</Text>
            <View style={styles.photoButtons}>
              <TouchableOpacity style={styles.photoBtn} onPress={takePhoto}>
                <Text style={styles.photoBtnIcon}>{'\uD83D\uDCF8'}</Text>
                <Text style={styles.photoBtnText}>Camara</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.photoBtn} onPress={pickImage}>
                <Text style={styles.photoBtnIcon}>{'\uD83D\uDDBC\uFE0F'}</Text>
                <Text style={styles.photoBtnText}>Galeria</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Poop avatar presets */}
          <View style={styles.section}>
            <Text style={styles.label}>O elige un avatar de caca</Text>
            <View style={styles.avatarGrid}>
              {poopAvatars.map((avatar) => (
                <TouchableOpacity
                  key={avatar.key}
                  style={[
                    styles.avatarOption,
                    avatarType === avatar.key && styles.avatarOptionSelected,
                  ]}
                  onPress={() => {
                    setAvatarType(avatar.key);
                    setCustomAvatarUri(null);
                  }}
                >
                  <PoopAvatar type={avatar.key} size={60} />
                  <Text style={styles.avatarLabel}>{avatar.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Save button */}
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>Guardar perfil {'\uD83D\uDCA9'}</Text>
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
    fontSize: 26,
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  previewSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  previewLabel: {
    fontSize: 13,
    color: '#999',
    marginTop: 8,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    textAlign: 'right',
  },
  photoButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  photoBtn: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#8B6914',
    borderStyle: 'dashed',
  },
  photoBtnIcon: {
    fontSize: 30,
  },
  photoBtnText: {
    fontSize: 14,
    color: '#8B6914',
    fontWeight: '600',
    marginTop: 6,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  avatarOption: {
    width: '30%',
    alignItems: 'center',
    padding: 10,
    borderRadius: 14,
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#EEE',
  },
  avatarOptionSelected: {
    borderColor: '#8B6914',
    backgroundColor: '#FFF9E6',
  },
  avatarLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 6,
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: '#8B6914',
    padding: 18,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 10,
    elevation: 3,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
