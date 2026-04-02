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
import { register, loginWithEmail } from '../data/auth';

export default function LoginScreen({ onLogin }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function validateEmail(e) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
  }

  async function handleSubmit() {
    setError('');
    if (!email.trim() || !password) {
      setError('Rellena todos los campos');
      return;
    }
    if (!validateEmail(email)) {
      setError('Email no valido');
      return;
    }
    if (password.length < 6) {
      setError('La contrasena debe tener al menos 6 caracteres');
      return;
    }
    if (mode === 'register' && password !== confirmPassword) {
      setError('Las contrasenas no coinciden');
      return;
    }

    setLoading(true);
    try {
      let user;
      if (mode === 'register') {
        user = await register(email, password);
      } else {
        user = await loginWithEmail(email, password);
      }
      onLogin(user);
    } catch (e) {
      setError(e.message || 'Error al iniciar sesion');
    } finally {
      setLoading(false);
    }
  }

  function switchMode() {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
    setPassword('');
    setConfirmPassword('');
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
          {/* Branding */}
          <View style={styles.brandSection}>
            <Text style={styles.poopEmoji}>💩</Text>
            <Text style={styles.appName}>Appreton</Text>
            <Text style={styles.tagline}>La app para encontrar{'\n'}el bano perfecto</Text>
          </View>

          {/* Form card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {mode === 'login' ? 'Iniciar sesion' : 'Crear cuenta'}
            </Text>

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="tu@email.com"
              placeholderTextColor="#BBB"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.label}>Contrasena</Text>
            <TextInput
              style={styles.input}
              placeholder="Minimo 6 caracteres"
              placeholderTextColor="#BBB"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            {mode === 'register' && (
              <>
                <Text style={styles.label}>Confirmar contrasena</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Repite la contrasena"
                  placeholderTextColor="#BBB"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              </>
            )}

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
                <Text style={styles.submitText}>
                  {mode === 'login' ? 'Entrar' : 'Registrarse'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={switchMode} style={styles.switchRow}>
              <Text style={styles.switchText}>
                {mode === 'login'
                  ? '¿No tienes cuenta? '
                  : '¿Ya tienes cuenta? '}
                <Text style={styles.switchLink}>
                  {mode === 'login' ? 'Registrate' : 'Inicia sesion'}
                </Text>
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footer}>Al continuar aceptas nuestras condiciones de uso 🚽</Text>
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
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  poopEmoji: {
    fontSize: 72,
  },
  appName: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#8B6914',
    marginTop: 8,
  },
  tagline: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 22,
  },
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
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    marginBottom: 6,
    marginTop: 12,
  },
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
  errorText: {
    color: '#E74C3C',
    fontSize: 13,
    marginTop: 12,
    textAlign: 'center',
  },
  submitBtn: {
    backgroundColor: '#8B6914',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    elevation: 3,
  },
  submitText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
  },
  switchRow: {
    marginTop: 16,
    alignItems: 'center',
  },
  switchText: {
    fontSize: 14,
    color: '#888',
  },
  switchLink: {
    color: '#8B6914',
    fontWeight: '700',
  },
  footer: {
    fontSize: 11,
    color: '#BBB',
    textAlign: 'center',
    marginTop: 24,
  },
});
