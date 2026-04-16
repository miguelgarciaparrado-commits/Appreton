import React, { useState, useEffect, useRef } from 'react';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, ActivityIndicator, View, TouchableOpacity, StyleSheet } from 'react-native';
import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
// Import con efecto colateral: registra la TaskManager task de geofence.
// DEBE ir en el top level del módulo para que el SO la reconozca.
import './src/tasks/geofenceTask';
import {
  requestNotificationPermission,
  requestBackgroundLocationPermission,
  markPlaceNotified,
} from './src/data/notifications';
import { getPlaceById } from './src/data/store';

const navigationRef = createNavigationContainerRef();

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <View style={eb.container}>
          <Text style={eb.emoji}>💩</Text>
          <Text style={eb.title}>Algo salio mal</Text>
          <Text style={eb.sub}>Reinicia la aplicacion para continuar</Text>
          <TouchableOpacity style={eb.btn} onPress={() => this.setState({ hasError: false })}>
            <Text style={eb.btnText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}
const eb = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F0E1', padding: 32 },
  emoji: { fontSize: 64 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#333', marginTop: 16 },
  sub: { fontSize: 14, color: '#888', marginTop: 8, textAlign: 'center' },
  btn: { marginTop: 24, backgroundColor: '#8B6914', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
  btnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
});

import HomeScreen from './src/screens/HomeScreen';
import PlaceDetailScreen from './src/screens/PlaceDetailScreen';
import AddReviewScreen from './src/screens/AddReviewScreen';

import RankingScreen from './src/screens/RankingScreen';
import LoginScreen from './src/screens/LoginScreen';
import ProfileSetupScreen from './src/screens/ProfileSetupScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AppretoneroRankingScreen from './src/screens/AppretoneroRankingScreen';
import MapScreen from './src/screens/MapScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';
import CagatriviaScreen from './src/screens/CagatriviaScreen';
import GamesScreen from './src/screens/GamesScreen';
import { getCurrentUser, logout } from './src/data/auth';
import { storageGet, storageSet, storageRemove } from './src/data/storage';
import { supabase } from './src/data/supabase';
import { CURRENT_VERSION } from './src/version';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function GamesStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#8B6914' },
        headerTintColor: '#FFF',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen name="GamesHub" component={GamesScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="CagatriviaGame"
        component={CagatriviaScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

function HomeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#8B6914' },
        headerTintColor: '#FFF',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="PlaceDetail"
        component={PlaceDetailScreen}
        options={({ route }) => ({ title: route.params.place.name })}
      />
      <Stack.Screen
        name="AddReview"
        component={AddReviewScreen}
        options={{ title: 'Nueva opinion' }}
      />
    </Stack.Navigator>
  );
}

function TabIcon({ emoji, focused }) {
  return (
    <Text style={{ fontSize: 24, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
  );
}

export default function App() {
  const [authState, setAuthState] = useState('loading'); // 'loading' | 'login' | 'setup' | 'app' | 'reset-password'
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkAuth();

    // Handle deep link when app is already open
    const sub = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    // Handle deep link that opened the app cold
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });

    // Usuario toca una notificación de proximidad: abrimos el detalle del sitio
    const notifSub = Notifications.addNotificationResponseReceivedListener(async (response) => {
      try {
        const data = response?.notification?.request?.content?.data || {};
        if (data.type !== 'proximity' || !data.placeId) return;
        await markPlaceNotified(data.placeId);
        const place = await getPlaceById(data.placeId);
        if (!place) return;
        // Esperar a que la navegación esté lista
        const tryNav = () => {
          if (navigationRef.isReady()) {
            navigationRef.navigate('Explorar', {
              screen: 'PlaceDetail',
              params: { place },
            });
          } else {
            setTimeout(tryNav, 300);
          }
        };
        tryNav();
      } catch (e) {
        console.error('[Appreton] notification tap handler error:', e);
      }
    });

    // Pedimos permisos una vez al arrancar (idempotente; si ya están, no molesta)
    (async () => {
      await requestNotificationPermission();
      await requestBackgroundLocationPermission();
    })();

    return () => {
      sub.remove();
      notifSub.remove();
    };
  }, []);

  async function handleDeepLink(url) {
    if (!url) return;
    // Match appreton://auth/reset-password
    if (!url.includes('reset-password')) return;

    // Supabase sends tokens in the hash fragment: #access_token=...&type=recovery
    const hash = url.split('#')[1] || '';
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const type = params.get('type');

    if (accessToken && type === 'recovery') {
      try {
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || '',
        });
        setAuthState('reset-password');
      } catch {}
    }
  }

  async function checkAuth() {
    try {
      // Migración: limpiar datos incompatibles de versiones antiguas
      await migrateOldData();
      // Migración por versión: borra caches de places/reviews al actualizar
      await migrateCacheVersion();

      const currentUser = await getCurrentUser();
      if (!currentUser) {
        setAuthState('login');
      } else if (!currentUser.profileCompleted) {
        setUser(currentUser);
        setAuthState('setup');
      } else {
        setUser(currentUser);
        setAuthState('app');
      }
    } catch {
      setAuthState('login');
    }
  }

  // Limpia datos del sistema de auth antiguo (IDs locales user_TIMESTAMP)
  async function migrateOldData() {
    try {
      const raw = await storageGet('@appreton_auth_user');
      if (!raw) return;
      const user = JSON.parse(raw);
      // IDs del sistema antiguo empezaban por 'user_' (no son UUIDs de Supabase)
      if (user && user.id && user.id.startsWith('user_')) {
        await storageRemove('@appreton_auth_user');
        await storageRemove('@appreton_credentials');
        await storageRemove('@appreton_all_users');
        await storageRemove('@appreton_users_data');
      }
    } catch {}
  }

  // Borra los caches de places y reviews cuando cambia la version de la app.
  // Asi, tras una actualizacion, el usuario arranca con caches limpios y los
  // repobla desde Supabase en la siguiente carga (evita tener que desinstalar
  // para limpiar datos obsoletos del AsyncStorage).
  async function migrateCacheVersion() {
    try {
      const stored = await storageGet('@appreton_cache_version');
      if (stored === CURRENT_VERSION) return;
      await storageRemove('@appreton_places');
      await storageRemove('@appreton_reviews');
      await storageSet('@appreton_cache_version', CURRENT_VERSION);
    } catch {}
  }

  function handleLogin(loggedInUser) {
    setUser(loggedInUser);
    if (loggedInUser.profileCompleted) {
      setAuthState('app');
    } else {
      setAuthState('setup');
    }
  }

  function handleProfileComplete() {
    setAuthState('app');
  }

  function handleLogout() {
    setUser(null);
    setAuthState('login');
  }

  function handleEditProfile() {
    setAuthState('setup');
  }

  if (authState === 'loading') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F0E1' }}>
        <ActivityIndicator size="large" color="#8B6914" />
      </View>
    );
  }

  if (authState === 'login') {
    return <ErrorBoundary><LoginScreen onLogin={handleLogin} /></ErrorBoundary>;
  }

  if (authState === 'reset-password') {
    return (
      <ErrorBoundary>
        <ResetPasswordScreen onDone={() => setAuthState('login')} />
      </ErrorBoundary>
    );
  }

  if (authState === 'setup') {
    return <ErrorBoundary><ProfileSetupScreen onComplete={handleProfileComplete} /></ErrorBoundary>;
  }

  return (
    <ErrorBoundary>
    <NavigationContainer ref={navigationRef}>
      <Tab.Navigator
        screenOptions={{
          tabBarStyle: {
            backgroundColor: '#FFF',
            borderTopWidth: 0,
            elevation: 10,
            height: 65,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarActiveTintColor: '#8B6914',
          tabBarInactiveTintColor: '#999',
          headerStyle: { backgroundColor: '#8B6914' },
          headerTintColor: '#FFF',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        <Tab.Screen
          name="Explorar"
          component={HomeStack}
          options={{
            headerShown: false,
            tabBarIcon: ({ focused }) => <TabIcon emoji={'\uD83D\uDEBD'} focused={focused} />,
          }}
        />
        <Tab.Screen
          name="Mapa"
          component={MapScreen}
          options={{
            headerShown: false,
            tabBarIcon: ({ focused }) => <TabIcon emoji={'\uD83D\uDDFA\uFE0F'} focused={focused} />,
          }}
        />
        <Tab.Screen
          name="Juegos"
          component={GamesStack}
          options={{
            headerShown: false,
            tabBarLabel: 'Juegos',
            tabBarIcon: ({ focused }) => <TabIcon emoji={'\uD83C\uDFAE'} focused={focused} />,
          }}
        />
        <Tab.Screen
          name="Top WC"
          component={RankingScreen}
          options={{
            headerShown: false,
            tabBarLabel: 'Top WC',
            tabBarIcon: ({ focused }) => <TabIcon emoji={'\uD83C\uDFC6'} focused={focused} />,
          }}
        />
        <Tab.Screen
          name="Appretoneros"
          component={AppretoneroRankingScreen}
          options={{
            headerShown: false,
            tabBarIcon: ({ focused }) => <TabIcon emoji={'\uD83D\uDCA9'} focused={focused} />,
          }}
        />
        <Tab.Screen
          name="Perfil"
          options={{
            headerShown: false,
            tabBarIcon: ({ focused }) => <TabIcon emoji={'\uD83D\uDC64'} focused={focused} />,
          }}
        >
          {() => (
            <ProfileScreen
              onLogout={handleLogout}
              onEditProfile={handleEditProfile}
            />
          )}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
    </ErrorBoundary>
  );
}
