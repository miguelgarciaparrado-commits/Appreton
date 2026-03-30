import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  TextInput,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { registerWithEmail, loginWithEmail, loginWithProvider } from '../data/auth';

const PROVIDERS = [
  { key: 'google', label: 'Google', color: '#DB4437', icon: '🌐' },
  { key: 'instagram', label: 'Instagram', color: '#E1306C', icon: '📷' },
  { key: 'facebook', label: 'Facebook', color: '#4267B2', icon: '👤' },
  { key: 'apple', label: 'Apple', color: '#000000', icon: '🍏' },
];

export default function LoginScreen({ onLogin }) {
  const [mode, setMode] = useState('welcome'); // 'welcome' | 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleRegister() {
    if (!email.trim()) {
      Alert.alert('Oops', 'Introduce tu email');
      return;
    }
    if (!email.includes('@') || !email.includes('.')) {
      Alert.alert('Oops', 'Introduce un email valido');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Oops', 'La contrasena debe tener al menos 6 caracteres');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Oops', 'Las contrasenas no coinciden');
      return;
    }

    setLoading(true);
    try {
      const user = await registerWithEmail(email.trim(), password);
      onLogin(user);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin() {
    if (!email.trim()) {
      Alert.alert('Oops', 'Introduce tu email');
      return;
    }
    if (!password) {
      Alert.alert('Oops', 'Introduce tu contrasena');
      return;
    }

    setLoading(true);
    try {
      const user = await loginWithEmail(email.trim(), password);
      onLogin(user);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleProviderLogin(provider) {
    setLoading(true);
    try {
      const user = await loginWithProvider(provider);
      onLogin(user);
    } catch {
      Alert.alert('Error', 'No se pudo conectar con ' + provider);
    } finally {
      setLoading(false);
    }
  }

  // Welcome screen
  if (mode === 'welcome') {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar backgroundColor="#8B6914" barStyle="light-content" />
        <View style={styles.welcomeContainer}>
          <View style={styles.brandSection}>
            <Text style={styles.poopEmoji}>{'\uD83D\uDCA9'}</Text>
            <Text style={styles.appName}>Appreton</Text>
            <Text style={styles.tagline}>Te cagas?? abreme</Text>
          </View>

          <View style={styles.welcomeButtons}>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => setMode('register')}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryBtnText}>Registrarse</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => setMode('login')}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryBtnText}>Ya tengo cuenta - Iniciar sesion</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footer}>Al continuar aceptas nuestras condiciones de uso 🚽</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Login / Register form
  const isRegister = mode === 'register';

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor="#8B6914" barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.formContainer}>
          {/* Back button */}
          <TouchableOpacity style={styles.backBtn} onPress={() => { setMode('welcome'); setEmail(''); setPassword(''); setConfirmPassword(''); }}>
            <Text style={styles.backBtnText}>← Volver</Text>
          </TouchableOpacity>

          <View style={styles.formBrand}>
            <Text style={styles.formEmoji}>{'\uD83D\uDCA9'}</Text>
            <Text style={styles.formTitle}>
              {isRegister ? 'Crear cuenta' : 'Iniciar sesion'}
            </Text>
          </View>

          {/* Email + Password form */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="tu@email.com"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.inputLabel}>Contrasena</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Min. 6 caracteres"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>

            {isRegister && (
              <>
                <Text style={styles.inputLabel}>Confirmar contrasena</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Repite la contrasena"
                  placeholderTextColor="#999"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                />
              </>
            )}

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={isRegister ? handleRegister : handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.submitBtnText}>
                  {isRegister ? 'Crear cuenta' : 'Entrar'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>o continua con</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social login buttons */}
          <View style={styles.socialSection}>
            {PROVIDERS.map((p) => (
              <TouchableOpacity
                key={p.key}
                style={[styles.socialBtn, { backgroundColor: p.color }]}
                onPress={() => handleProviderLogin(p.key)}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Text style={styles.socialIcon}>{p.icon}</Text>
                <Text style={styles.socialText}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Switch mode */}
          <TouchableOpacity
            style={styles.switchMode}
            onPress={() => {
              setMode(isRegister ? 'login' : 'register');
              setPassword('');
              setConfirmPassword('');
            }}
          >
            <Text style={styles.switchText}>
              {isRegister
                ? 'Ya tienes cuenta? Inicia sesion'
                : 'No tienes cuenta? Registrate'}
            </Text>
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
  // Welcome screen
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: 50,
  },
  poopEmoji: {
    fontSize: 80,
  },
  appName: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#8B6914',
    marginTop: 8,
  },
  tagline: {
    fontSize: 18,
    color: '#A07B1A',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  welcomeButtons: {
    gap: 14,
  },
  primaryBtn: {
    backgroundColor: '#8B6914',
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
    elevation: 3,
  },
  primaryBtnText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryBtn: {
    backgroundColor: '#FFF',
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#8B6914',
  },
  secondaryBtnText: {
    color: '#8B6914',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    fontSize: 11,
    color: '#BBB',
    textAlign: 'center',
    marginTop: 30,
  },
  // Form screen
  formContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  backBtn: {
    marginBottom: 10,
  },
  backBtnText: {
    fontSize: 16,
    color: '#8B6914',
    fontWeight: '600',
  },
  formBrand: {
    alignItems: 'center',
    marginBottom: 30,
  },
  formEmoji: {
    fontSize: 50,
  },
  formTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginTop: 8,
  },
  inputSection: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    marginTop: 8,
  },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  passwordInput: {
    flex: 1,
    padding: 14,
    fontSize: 16,
  },
  eyeBtn: {
    paddingHorizontal: 14,
  },
  eyeText: {
    fontSize: 20,
  },
  submitBtn: {
    backgroundColor: '#8B6914',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 16,
    elevation: 3,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#DDD',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 13,
    color: '#999',
  },
  // Social buttons
  socialSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 2,
  },
  socialIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  socialText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  // Switch mode
  switchMode: {
    marginTop: 24,
    alignItems: 'center',
  },
  switchText: {
    fontSize: 14,
    color: '#8B6914',
    fontWeight: '600',
  },
});
