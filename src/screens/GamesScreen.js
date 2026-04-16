import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import GameScreen from './GameScreen';

export default function GamesScreen({ navigation }) {
  const [tocaLaCacaVisible, setTocaLaCacaVisible] = useState(false);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>🎮 Juegos</Text>
        <Text style={styles.subtitle}>Elige un juego y pasa el rato</Text>
      </View>
      <ScrollView contentContainerStyle={styles.list}>
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('CagatriviaGame')}
        >
          <View style={[styles.cardIcon, { backgroundColor: '#8E44AD' }]}>
            <Text style={styles.cardEmoji}>🧠</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>Cagatrivia</Text>
            <Text style={styles.cardDesc}>
              30+ preguntas absurdas sobre WCs, caca y cultura escatologica. 10 por partida.
            </Text>
          </View>
          <Text style={styles.cardArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.85}
          onPress={() => setTocaLaCacaVisible(true)}
        >
          <View style={[styles.cardIcon, { backgroundColor: '#E67E22' }]}>
            <Text style={styles.cardEmoji}>💩</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>Toca la Caca</Text>
            <Text style={styles.cardDesc}>
              Toca las cacas antes de que desaparezcan. 3 vidas, velocidad creciente.
            </Text>
          </View>
          <Text style={styles.cardArrow}>›</Text>
        </TouchableOpacity>
      </ScrollView>

      <GameScreen
        visible={tocaLaCacaVisible}
        onClose={() => setTocaLaCacaVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F0E1' },
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
    padding: 16,
    gap: 14,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  cardIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardEmoji: { fontSize: 28 },
  cardInfo: {
    flex: 1,
    marginLeft: 14,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2C3E50',
  },
  cardDesc: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    lineHeight: 17,
  },
  cardArrow: {
    fontSize: 28,
    color: '#CCC',
    fontWeight: '300',
    marginLeft: 8,
  },
});
