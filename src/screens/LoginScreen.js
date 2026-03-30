import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { loginWithProvider } from '../data/auth';

const PROVIDERS = [
  { key: 'google', label: 'Continuar con Google', color: '#DB4437', icon: '\uD83C\uDF10' },
  { key: 'instagram', label: 'Continuar con Instagram', color: '#E1306C', icon: '\uD83D\uDCF7' },
  { key: 'facebook', label: 'Continuar con Facebook', color: '#4267B2', icon: '\uD83D\uDC64' },
  { key: 'apple', label: 'Continuar con Apple', color: '#000000', icon: '\uD83C\uDF4F' },
];

export default function LoginScreen({ onLogin }) {
  const [loading, setLoading] = useState(false);

  async function handleLogin(provider) {
    setLoading(true);
    try {
      const user = await loginWithProvider(provider);
      onLogin(user);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor="#8B6914" barStyle="light-content" />
      <View style={styles.container}>
        {/* Branding */}
        <View style={styles.brandSection}>
          <Text style={styles.poopEmoji}>{'\uD83D\uDCA9'}</Text>
          <Text style={styles.appName}>Appreton</Text>
          <Text style={styles.tagline}>Te cagas?? abreme</Text>
        </View>

        {/* Subtitle */}
        <View style={styles.subtitleSection}>
          <Text style={styles.subtitle}>Inicia sesion para guardar tus opiniones,{'\n'}subir de nivel y competir con otros!</Text>
        </View>

        {/* Login buttons */}
        <View style={styles.buttonsSection}>
          {PROVIDERS.map((p) => (
            <TouchableOpacity
              key={p.key}
              style={[styles.loginBtn, { backgroundColor: p.color }]}
              onPress={() => handleLogin(p.key)}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={styles.loginIcon}>{p.icon}</Text>
              <Text style={styles.loginText}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading && (
          <ActivityIndicator
            size="large"
            color="#8B6914"
            style={styles.loader}
          />
        )}

        <Text style={styles.footer}>Al continuar aceptas nuestras condiciones de uso {'\uD83D\uDEBD'}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F5F0E1',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: 30,
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
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  subtitleSection: {
    marginBottom: 30,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonsSection: {
    gap: 12,
  },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  loginIcon: {
    fontSize: 22,
    marginRight: 12,
  },
  loginText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loader: {
    marginTop: 20,
  },
  footer: {
    fontSize: 11,
    color: '#BBB',
    textAlign: 'center',
    marginTop: 30,
  },
});
