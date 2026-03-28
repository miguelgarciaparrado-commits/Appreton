import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import PoopRating from './PoopRating';

const TYPE_LABELS = {
  bar: '🍺 Bar',
  restaurante: '🍽️ Restaurante',
  gasolinera: '⛽ Gasolinera',
  centro_comercial: '🛒 Centro Comercial',
  cafeteria: '☕ Cafeteria',
  otro: '🏢 Otro',
};

const TYPE_COLORS = {
  bar: '#E67E22',
  restaurante: '#E74C3C',
  gasolinera: '#3498DB',
  centro_comercial: '#9B59B6',
  cafeteria: '#1ABC9C',
  otro: '#95A5A6',
};

export default function PlaceCard({ place, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={[styles.typeBadge, { backgroundColor: TYPE_COLORS[place.type] || '#95A5A6' }]}>
          <Text style={styles.typeText}>{TYPE_LABELS[place.type] || '🏢 Otro'}</Text>
        </View>
      </View>
      <Text style={styles.name}>{place.name}</Text>
      <Text style={styles.address}>{place.address}</Text>
      <View style={styles.footer}>
        <PoopRating rating={place.avgRating} size={20} readonly />
        <Text style={styles.ratingText}>
          {place.avgRating.toFixed(1)} ({place.reviewCount} {place.reviewCount === 1 ? 'opinion' : 'opiniones'})
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  address: {
    fontSize: 13,
    color: '#7F8C8D',
    marginBottom: 10,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#8B6914',
    fontWeight: '600',
  },
});
