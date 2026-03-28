import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getPlaces } from '../data/store';
import PoopRating from '../components/PoopRating';

export default function RankingScreen() {
  const [places, setPlaces] = useState([]);

  useFocusEffect(
    useCallback(() => {
      loadPlaces();
    }, [])
  );

  async function loadPlaces() {
    const data = await getPlaces();
    setPlaces(data.filter((p) => p.reviewCount > 0).sort((a, b) => b.avgRating - a.avgRating));
  }

  const renderItem = ({ item, index }) => (
    <View style={styles.card}>
      <View style={styles.rank}>
        <Text style={styles.rankText}>
          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
        </Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.address}>{item.address}</Text>
        <PoopRating rating={item.avgRating} size={16} readonly />
      </View>
      <View style={styles.score}>
        <Text style={styles.scoreText}>{item.avgRating.toFixed(1)}</Text>
        <Text style={styles.scoreLabel}>💩</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>🏆 Ranking</Text>
        <Text style={styles.subtitle}>Los banos mas limpios</Text>
      </View>
      <FlatList
        data={places}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🏆</Text>
            <Text style={styles.emptyText}>Aun no hay ranking</Text>
            <Text style={styles.emptySubtext}>Opina sobre los sitios para crear el ranking</Text>
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
    padding: 20,
    paddingTop: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#F5DEB3',
    marginTop: 2,
  },
  list: {
    paddingVertical: 10,
    paddingBottom: 100,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginVertical: 5,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    elevation: 2,
  },
  rank: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F0E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B6914',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  address: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  score: {
    alignItems: 'center',
    marginLeft: 8,
  },
  scoreText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#8B6914',
  },
  scoreLabel: {
    fontSize: 14,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyIcon: {
    fontSize: 50,
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
