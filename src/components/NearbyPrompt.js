import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

// Banner flotante que aparece en Explorar cuando detectamos que la persona
// lleva varios segundos dentro de un establecimiento (dwell detection).
export default function NearbyPrompt({ place, onOpinar, onDismiss }) {
  if (!place) return null;
  return (
    <View style={styles.card}>
      <View style={styles.emojiBox}>
        <Text style={styles.emoji}>📍</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>Parece que estas en</Text>
        <Text style={styles.name} numberOfLines={1}>{place.name}</Text>
        <Text style={styles.sub}>Como esta su WC? 💩</Text>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.btnSecondary} onPress={onDismiss}>
            <Text style={styles.btnSecondaryText}>Ahora no</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnPrimary} onPress={onOpinar}>
            <Text style={styles.btnPrimaryText}>Opinar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF',
    marginHorizontal: 12,
    marginTop: 10,
    padding: 14,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    borderWidth: 2,
    borderColor: '#F0D060',
  },
  emojiBox: {
    backgroundColor: '#FFF9E6',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  emoji: { fontSize: 22 },
  body: { flex: 1 },
  title: { fontSize: 11, color: '#888', fontWeight: '600', textTransform: 'uppercase' },
  name: { fontSize: 17, fontWeight: '800', color: '#2C3E50', marginTop: 2 },
  sub: { fontSize: 13, color: '#666', marginTop: 2 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10, gap: 10 },
  btnSecondary: { paddingHorizontal: 12, paddingVertical: 8 },
  btnSecondaryText: { color: '#888', fontWeight: '600', fontSize: 13 },
  btnPrimary: {
    backgroundColor: '#8B6914',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
    elevation: 1,
  },
  btnPrimaryText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
});
