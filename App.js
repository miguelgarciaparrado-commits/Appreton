import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';

import HomeScreen from './src/screens/HomeScreen';
import PlaceDetailScreen from './src/screens/PlaceDetailScreen';
import AddReviewScreen from './src/screens/AddReviewScreen';
import AddPlaceScreen from './src/screens/AddPlaceScreen';
import RankingScreen from './src/screens/RankingScreen';

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
            tabBarIcon: ({ focused }) => <TabIcon emoji="🚽" focused={focused} />,
          }}
        />
        <Tab.Screen
          name="Anadir"
          component={AddPlaceScreen}
          options={{
            title: 'Anadir sitio',
            tabBarIcon: ({ focused }) => <TabIcon emoji="➕" focused={focused} />,
          }}
        />
        <Tab.Screen
          name="Ranking"
          component={RankingScreen}
          options={{
            headerShown: false,
            tabBarIcon: ({ focused }) => <TabIcon emoji="🏆" focused={focused} />,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
