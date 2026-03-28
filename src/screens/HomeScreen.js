import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getPlaces } from '../data/store';
import PlaceCard from '../components/PlaceCard';

const FILTERS = [
  { key: 'todos', label: '🚽 Todos' },
  { key: 'bar', label: '🍺 Bares' },
  { key: 'restaurante', label: '🍽️ Restaurantes' },
  { key: 'gasolinera', label: '⛽ Gasolineras' },
  { key: 'centro_comercial', label: '🛒 Centros' },
  { key: 'cafeteria', label: '☕ Cafeterias' },
];

export default function HomeScreen({ navigation }) {
  const [places, setPlaces] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('todos');

  useFocusEffect(
    useCallback(() => {
      loadPlaces();
    }, [])
  );

  async function loadPlaces() {
    const data = await getPlaces();
    setPlaces(data);
  }

  const filtered = places
    .filter((p) => filter === 'todos' || p.type === filter)
    .filter(
      (p) =>
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.address.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => b.avgRating - a.avgRating);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor="#8B6914" barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.logo}>💩 Appreton</Text>
        <Text style={styles.subtitle}>Encuentra el bano perfecto</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.search}
          placeholder="Buscar bares, gasolineras..."
          placeholderTextColor="#999"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FILTERS}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.filters}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterBtn, filter === item.key && styles.filterActive]}
              onPress={() => setFilter(item.key)}
            >
              <Text style={[styles.filterText, filter === item.key && styles.filterTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PlaceCard
            place={item}
            onPress={() => navigation.navigate('PlaceDetail', { place: item })}
          />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🚽</Text>
            <Text style={styles.emptyText}>No se encontraron sitios</Text>
            <Text style={styles.emptySubtext}>Anade uno con el boton +</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F5F0E1',
  },
  header: {
    backgroundColor: '#8B6914',
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  logo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#F5DEB3',
    marginTop: 2,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#8B6914',
  },
  search: {
    backgroundColor: '#FFF',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 10,
    fontSize: 15,
    elevation: 2,
  },
  filtersContainer: {
    backgroundColor: '#F5F0E1',
  },
  filters: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  filterActive: {
    backgroundColor: '#8B6914',
    borderColor: '#8B6914',
  },
  filterText: {
    fontSize: 13,
    color: '#666',
  },
  filterTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  list: {
    paddingVertical: 8,
    paddingBottom: 100,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyIcon: {
    fontSize: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
});
