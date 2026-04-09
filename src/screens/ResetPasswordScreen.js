import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { supabase } from '../data/supabase';

export default function ResetPasswordScreen({ onDone }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit() {
    setError('');
    if (!password || !confirmPassword) {
      setError('Rellena todos los campos');
      return;
    }
    if (password.length < 6) {
      setError('La contrasena debe tener al menos 6 caracteres');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contrasenas no coinciden');
      return;
    }
    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw new Error(updateError.message);
      setSuccess(true);
    } catch (e) {
      setError(e.message || 'No se pudo cambiar la contrasena');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor="#8B6914" barStyle="light-content" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.brandSection}>
            <Text style={styles.poopEmoji}>💩</Text>
            <Text style={styles.appName}>Appreton</Text>
          </View>

          <View style={styles.card}>
            {success ? (
              <View style={styles.successBox}>
                <Text style={styles.successIcon}>✅</Text>
                <Text style={styles.successTitle}>Contrasena cambiada</Text>
                <Text style={styles.successText}>
                  Tu contrasena se ha actualizado correctamente.
                </Text>
                <TouchableOpacity style={styles.submitBtn} onPress={onDone}>
                  <Text style={styles.submitText}>Iniciar sesion</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text style={styles.cardTitle}>Nueva contrasena</Text>
                <Text style={styles.cardDesc}>
                  Introduce tu nueva contrasena para continuar.
                </Text>

                <Text style={styles.label}>Nueva contrasena</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Minimo 6 caracteres"
                  placeholderTextColor="#BBB"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />

                <Text style={styles.label}>Confirmar contrasena</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Repite la contrasena"
                  placeholderTextColor="#BBB"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={handleSubmit}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.submitText}>Cambiar contrasena</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.cancelBtn} onPress={onDone}>
                  <Text style={styles.cancelText}>Cancelar</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F0E1' },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  brandSection: { alignItems: 'center', marginBottom: 28 },
  poopEmoji: { fontSize: 72 },
  appName: { fontSize: 40, fontWeight: 'bold', color: '#8B6914', marginTop: 8 },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  cardDesc: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1.5,
    borderColor: '#E0D8C8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#333',
    backgroundColor: '#FAFAF8',
  },
  errorText: { color: '#E74C3C', fontSize: 13, marginTop: 12, textAlign: 'center' },
  submitBtn: {
    backgroundColor: '#8B6914',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    elevation: 3,
  },
  submitText: { color: '#FFF', fontSize: 17, fontWeight: '700' },
  cancelBtn: { alignItems: 'center', marginTop: 14 },
  cancelText: { fontSize: 14, color: '#8B6914', fontWeight: '600' },
  successBox: { alignItems: 'center', paddingVertical: 8 },
  successIcon: { fontSize: 48, marginBottom: 12 },
  successTitle: { fontSize: 18, fontWeight: 'bold', color: '#27AE60', marginBottom: 8 },
  successText: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
});
