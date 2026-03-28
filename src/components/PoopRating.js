import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function PoopRating({ rating, onRate, size = 30, readonly = false }) {
  const poops = [1, 2, 3, 4, 5];

  return (
    <View style={styles.container}>
      {poops.map((i) => (
        <TouchableOpacity
          key={i}
          onPress={() => !readonly && onRate && onRate(i)}
          disabled={readonly}
          activeOpacity={readonly ? 1 : 0.6}
        >
          <Text style={[styles.poop, { fontSize: size, opacity: i <= Math.round(rating) ? 1 : 0.25 }]}>
            💩
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  poop: {
    marginHorizontal: 2,
  },
});
