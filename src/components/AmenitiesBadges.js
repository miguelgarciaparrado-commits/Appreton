import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AmenitiesBadges({ review }) {
  return (
    <View style={styles.container}>
      <Badge label="🧻 Papel" active={review.hasPaper} />
      <Badge label="🧴 Jabon" active={review.hasSoap} />
      <Badge label="🪥 Escobilla" active={review.hasBrush} />
      {review.requiredOrder != null && (
        <Badge
          label={review.requiredOrder ? '🍺 Me toco pedir' : '🆓 Entre sin pedir nada'}
          active={!review.requiredOrder}
          isExtra={review.requiredOrder}
          isOrder
        />
      )}
      {review.extras &&
        review.extras.map((extra, i) => (
          <Badge key={i} label={`✨ ${extra}`} active={true} isExtra />
        ))}
    </View>
  );
}

function Badge({ label, active, isExtra }) {
  return (
    <View
      style={[
        styles.badge,
        active ? (isExtra ? styles.extraActive : styles.active) : styles.inactive,
      ]}
    >
      <Text style={[styles.text, active ? styles.activeText : styles.inactiveText]}>
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
  active: {
    backgroundColor: '#D5F5E3',
    borderColor: '#27AE60',
  },
  extraActive: {
    backgroundColor: '#EBF5FB',
    borderColor: '#3498DB',
  },
  inactive: {
    backgroundColor: '#FADBD8',
    borderColor: '#E74C3C',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
  activeText: {
    color: '#1E8449',
  },
  inactiveText: {
    color: '#C0392B',
  },
});
