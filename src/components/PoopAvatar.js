import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

// 6 different poop avatar designs using emoji + colored backgrounds
const POOP_AVATARS = {
  poop_1: { emoji: '\uD83D\uDCA9', bg: '#F39C12', label: 'Clasico' },
  poop_2: { emoji: '\uD83D\uDCA9\u2728', bg: '#8E44AD', label: 'Brillante' },
  poop_3: { emoji: '\uD83D\uDCA9\uD83D\uDC51', bg: '#E74C3C', label: 'Rey' },
  poop_4: { emoji: '\uD83D\uDCA9\uD83D\uDD25', bg: '#E67E22', label: 'Fuego' },
  poop_5: { emoji: '\uD83D\uDCA9\uD83C\uDF08', bg: '#1ABC9C', label: 'Arcoiris' },
  poop_6: { emoji: '\uD83D\uDCA9\uD83D\uDCAA', bg: '#2C3E50', label: 'Fuerte' },
};

export function getPoopAvatarConfig(type) {
  return POOP_AVATARS[type] || POOP_AVATARS.poop_1;
}

export function getAllPoopAvatars() {
  return Object.entries(POOP_AVATARS).map(([key, val]) => ({
    key,
    ...val,
  }));
}

export default function PoopAvatar({ type, customUri, size = 60 }) {
  // If custom avatar with a URI, show an image
  if (type === 'custom' && customUri) {
    return (
      <View
        style={[
          styles.container,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            overflow: 'hidden',
          },
        ]}
      >
        <Image
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
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: config.bg,
        },
      ]}
    >
      <Text style={{ fontSize: emojiSize, textAlign: 'center' }}>
        {config.emoji}
      </Text>
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
