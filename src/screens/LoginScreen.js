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
  Alert,
} from 'react-native';
import { register, loginWithEmail, loginWithProvider } from '../data/auth';

const PROVIDERS = [
  { key: 'google', label: 'Continuar con Google', color: '#DB4437', icon: '🌐' },
  { key: 'instagram', label: 'Continuar con Instagram', color: '#E1306C', icon: '📷' },
  { key: 'facebook', label: 'Continuar con Facebook', color: '#4267B2', icon: '👤' },
  { key: 'apple', label: 'Continuar con Apple', color: '#000000', icon: '🍎' },
];

export default function LoginScreen({ onLogin }) {
  const [mode, setMode] = useState('providers'); // 'providers' | 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleProvider(providerKey) {
    if (providerKey === 'instagram') {
      Alert.alert(
        'No disponible',
        'El inicio de sesión con Instagram no está disponible todavía. Usa Google, Facebook o Apple.',
        [{ text: 'OK' }]
      );
      return;
    }
    setLoading(true);
    setError('');
    try {
      const user = await loginWithProvider(providerKey);
      onLogin(user);
    } catch (e) {
      const msg = e.message || '';
      if (!msg.includes('cancelado') && !msg.includes('cancel')) {
        setError(msg || 'No se pudo iniciar sesion');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleEmailSubmit() {
    setError('');
    if (!email.trim() || !password) {
      setError('Rellena todos los campos');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
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
      const user =
        mode === 'register'
          ? await register(email, password)
          : await loginWithEmail(email, password);
      onLogin(user);
    } catch (e) {
      setError(e.message || 'Error al iniciar sesion');
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
          {/* Branding */}
          <View style={styles.brandSection}>
            <Text style={styles.poopEmoji}>💩</Text>
            <Text style={styles.appName}>Appreton</Text>
            <Text style={styles.tagline}>La app perfecta para{'\n'}solucionar un apretón</Text>
          </View>

          {mode === 'providers' && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Entra en Appreton</Text>

              {PROVIDERS.map((p) => (
                <TouchableOpacity
                  key={p.key}
                  style={[styles.providerBtn, { backgroundColor: p.color }]}
                  onPress={() => handleProvider(p.key)}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <Text style={styles.providerIcon}>{p.icon}</Text>
                  <Text style={styles.providerText}>{p.label}</Text>
                </TouchableOpacity>
              ))}

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>o</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={styles.emailBtn}
                onPress={() => { setMode('login'); setError(''); }}
              >
                <Text style={styles.emailBtnText}>📧 Entrar con email</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.registerLink}
                onPress={() => { setMode('register'); setError(''); }}
              >
                <Text style={styles.registerLinkText}>
                  ¿No tienes cuenta? <Text style={styles.registerLinkBold}>Registrate</Text>
                </Text>
              </TouchableOpacity>

              {loading && <ActivityIndicator color="#8B6914" style={{ marginTop: 16 }} />}
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
            </View>
          )}

          {(mode === 'login' || mode === 'register') && (
            <View style={styles.card}>
              <TouchableOpacity onPress={() => { setMode('providers'); setError(''); }} style={styles.backBtn}>
                <Text style={styles.backText}>← Volver</Text>
              </TouchableOpacity>

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
                onPress={handleEmailSubmit}
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

              <TouchableOpacity
                onPress={() => {
                  setMode(mode === 'login' ? 'register' : 'login');
                  setError('');
                  setPassword('');
                  setConfirmPassword('');
                }}
                style={styles.switchRow}
              >
                <Text style={styles.switchText}>
                  {mode === 'login' ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
                  <Text style={styles.switchLink}>
                    {mode === 'login' ? 'Registrate' : 'Inicia sesion'}
                  </Text>
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.footer}>Al continuar aceptas nuestras condiciones de uso 🚽</Text>
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
  tagline: { fontSize: 15, color: '#888', textAlign: 'center', marginTop: 6, lineHeight: 22 },
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
    marginBottom: 18,
    textAlign: 'center',
  },
  providerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 14,
    marginBottom: 10,
    elevation: 2,
  },
  providerIcon: { fontSize: 20, marginRight: 12 },
  providerText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#EEE' },
  dividerText: { marginHorizontal: 12, color: '#AAA', fontSize: 13 },
  emailBtn: {
    borderWidth: 1.5,
    borderColor: '#8B6914',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  emailBtnText: { color: '#8B6914', fontWeight: '600', fontSize: 15 },
  registerLink: { alignItems: 'center', marginTop: 4 },
  registerLinkText: { fontSize: 14, color: '#888' },
  registerLinkBold: { color: '#8B6914', fontWeight: '700' },
  backBtn: { marginBottom: 12 },
  backText: { color: '#8B6914', fontWeight: '600', fontSize: 14 },
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
  switchRow: { marginTop: 16, alignItems: 'center' },
  switchText: { fontSize: 14, color: '#888' },
  switchLink: { color: '#8B6914', fontWeight: '700' },
  footer: { fontSize: 11, color: '#BBB', textAlign: 'center', marginTop: 24 },
});
