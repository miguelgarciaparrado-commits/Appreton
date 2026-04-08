import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, ActivityIndicator, View } from 'react-native';

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
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (authState === 'setup') {
    return <ProfileSetupScreen onComplete={handleProfileComplete} />;
  }

  return (
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
          name="Banos"
          component={RankingScreen}
          options={{
            headerShown: false,
            tabBarLabel: 'Banos',
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
  );
}
