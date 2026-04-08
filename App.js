import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, ActivityIndicator, View, TouchableOpacity, StyleSheet } from 'react-native';

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
import AddPlaceScreen from './src/screens/AddPlaceScreen';
import RankingScreen from './src/screens/RankingScreen';
import LoginScreen from './src/screens/LoginScreen';
import ProfileSetupScreen from './src/screens/ProfileSetupScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AppretoneroRankingScreen from './src/screens/AppretoneroRankingScreen';
import MapScreen from './src/screens/MapScreen';
import { getCurrentUser, logout } from './src/data/auth';
import { storageGet, storageRemove } from './src/data/storage';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

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
  const [authState, setAuthState] = useState('loading'); // 'loading' | 'login' | 'setup' | 'app'
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      // Migración: limpiar datos incompatibles de versiones antiguas
      await migrateOldData();

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

  if (authState === 'setup') {
    return <ErrorBoundary><ProfileSetupScreen onComplete={handleProfileComplete} /></ErrorBoundary>;
  }

  return (
    <ErrorBoundary>
    <NavigationContainer>
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
          name="Sugerir"
          component={AddPlaceScreen}
          options={{
            title: 'Sugerir sitio',
            tabBarIcon: ({ focused }) => <TabIcon emoji={'\u2795'} focused={focused} />,
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
