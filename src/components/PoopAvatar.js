import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

const POOP_AVATARS = {
  poop_1:  { emoji: '\uD83D\uDCA9', bg: '#F39C12', label: 'Clasico' },
  poop_2:  { emoji: '\uD83D\uDCA9\u2728', bg: '#8E44AD', label: 'Brillante' },
  poop_3:  { emoji: '\uD83D\uDCA9\uD83D\uDC51', bg: '#E74C3C', label: 'Rey' },
  poop_4:  { emoji: '\uD83D\uDCA9\uD83D\uDD25', bg: '#E67E22', label: 'Fuego' },
  poop_5:  { emoji: '\uD83D\uDCA9\uD83C\uDF08', bg: '#1ABC9C', label: 'Arcoiris' },
  poop_6:  { emoji: '\uD83D\uDCA9\uD83D\uDCAA', bg: '#2C3E50', label: 'Fuerte' },
  poop_7:  { emoji: '\uD83D\uDCA9\uD83C\uDF19', bg: '#1A1A2E', label: 'Nocturno' },
  poop_8:  { emoji: '\uD83D\uDCA9\u2744\uFE0F', bg: '#5DADE2', label: 'Helado' },
  poop_9:  { emoji: '\uD83D\uDCA9\uD83C\uDF83', bg: '#7D3C98', label: 'Halloween' },
  poop_10: { emoji: '\uD83D\uDCA9\uD83E\uDD29', bg: '#F1C40F', label: 'Estrella' },
  poop_11: { emoji: '\uD83D\uDCA9\uD83C\uDFB5', bg: '#E91E63', label: 'Musical' },
  poop_12: { emoji: '\uD83D\uDCA9\uD83C\uDFC6', bg: '#D4AC0D', label: 'Campeon' },
  poop_13: { emoji: '\uD83D\uDCA9\uD83D\uDC7D', bg: '#00BCD4', label: 'Alien' },
  poop_14: { emoji: '\uD83D\uDCA9\uD83C\uDF55', bg: '#C0392B', label: 'Pizza' },
  poop_15: { emoji: '\uD83D\uDCA9\uD83E\uDD78', bg: '#27AE60', label: 'Ninja' },
  poop_16: { emoji: '\uD83D\uDCA9\uD83D\uDC80', bg: '#2C3E50', label: 'Calavera' },
  poop_17: { emoji: '\uD83D\uDCA9\uD83E\uDDB8', bg: '#FF5722', label: 'Super' },
  poop_18: { emoji: '\uD83D\uDCA9\uD83C\uDF36\uFE0F', bg: '#B71C1C', label: 'Picante' },
};

export function getPoopAvatarConfig(type) {
  return POOP_AVATARS[type] || POOP_AVATARS.poop_1;
}

export function getAllPoopAvatars() {
  return Object.entries(POOP_AVATARS).map(([key, val]) => ({ key, ...val }));
}

export default function PoopAvatar({ type, customUri, size = 60 }) {
  if (type === 'custom' && customUri) {
    return (
      <View style={[styles.container, { width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }]}>
        <Image
          key={customUri}
          source={{ uri: customUri }}
          style={{ width: size, height: size }}
          resizeMode="cover"
        />
      </View>
    );
  }

  const config = getPoopAvatarConfig(type);
  const emojiSize = size * 0.5;

  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size / 2, backgroundColor: config.bg }]}>
      <Text style={{ fontSize: emojiSize, textAlign: 'center' }}>{config.emoji}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
});
