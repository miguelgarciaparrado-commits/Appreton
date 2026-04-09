import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AmenitiesBadges({ review }) {
  return (
    <View style={styles.container}>
      {review.hasPaper && <Badge label="🧻 Papel" />}
      {review.hasSoap && <Badge label="🧴 Jabon" />}
      {review.hasBrush && <Badge label="🪥 Escobilla" />}
      {review.requiredOrder === true && <Badge label="🍺 Me toco pedir" isOrder />}
      {review.requiredOrder === false && <Badge label="🆓 Entre sin pedir" />}
      {review.extras && review.extras.map((extra, i) => (
        <Badge key={i} label={extra} isExtra />
      ))}
    </View>
  );
}

function Badge({ label, isOrder, isExtra }) {
  return (
    <View style={[styles.badge, isOrder ? styles.order : isExtra ? styles.extra : styles.active]}>
      <Text style={[styles.text, isOrder ? styles.orderText : isExtra ? styles.extraText : styles.activeText]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  active: { backgroundColor: '#D5F5E3', borderColor: '#27AE60' },
  extra: { backgroundColor: '#EBF5FB', borderColor: '#3498DB' },
  order: { backgroundColor: '#FDEBD0', borderColor: '#E67E22' },
  text: { fontSize: 12, fontWeight: '600' },
  activeText: { color: '#1E8449' },
  extraText: { color: '#1A5276' },
  orderText: { color: '#A04000' },
});
