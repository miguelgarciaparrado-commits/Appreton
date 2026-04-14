import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Modal,
  SafeAreaView,
} from 'react-native';
import { storageGet, storageSet } from '../data/storage';

const { width: W, height: H } = Dimensions.get('window');
const POOP_SIZE = 64;
const GAME_AREA_TOP = 140;
const GAME_AREA_BOTTOM = H - 120;
const HIGH_SCORE_KEY = '@appreton_game_highscore';

const POOPS = ['\uD83D\uDCA9', '\uD83D\uDCA9\u2728', '\uD83D\uDCA9\uD83D\uDC51', '\uD83D\uDCA9\uD83D\uDD25', '\uD83D\uDCA9\uD83C\uDF08'];

function randomPos() {
  return {
    x: Math.random() * (W - POOP_SIZE - 32) + 16,
    y: Math.random() * (GAME_AREA_BOTTOM - GAME_AREA_TOP - POOP_SIZE) + GAME_AREA_TOP,
  };
}

function getInterval(score) {
  if (score >= 150) return 600;
  if (score >= 100) return 750;
  if (score >= 60)  return 900;
  if (score >= 30)  return 1100;
  return 1400;
}

function getLifetime(score) {
  if (score >= 150) return 900;
  if (score >= 100) return 1100;
  if (score >= 60)  return 1400;
  if (score >= 30)  return 1700;
  return 2200;
}

export default function GameScreen({ visible, onClose }) {
  const [gameState, setGameState] = useState('idle'); // idle | playing | gameover
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [highScore, setHighScore] = useState(0);
  const [poops, setPoops] = useState([]); // [{id, x, y, emoji, opacity}]
  const poopIdRef = useRef(0);
  const spawnRef = useRef(null);
  const scoreRef = useRef(0);
  const livesRef = useRef(3);

  useEffect(() => {
    storageGet(HIGH_SCORE_KEY).then((v) => { if (v) setHighScore(parseInt(v, 10) || 0); });
  }, []);

  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { livesRef.current = lives; }, [lives]);

  useEffect(() => {
    if (gameState === 'playing') {
      startSpawning();
    } else {
      if (spawnRef.current) clearInterval(spawnRef.current);
    }
    return () => { if (spawnRef.current) clearInterval(spawnRef.current); };
  }, [gameState]);

  function startSpawning() {
    if (spawnRef.current) clearInterval(spawnRef.current);
    spawnRef.current = setInterval(() => {
      spawnPoop();
      // Restart interval with new speed
      clearInterval(spawnRef.current);
      startSpawning();
    }, getInterval(scoreRef.current));
  }

  function spawnPoop() {
    const id = ++poopIdRef.current;
    const pos = randomPos();
    const emoji = POOPS[Math.floor(Math.random() * POOPS.length)];
    setPoops((prev) => [...prev, { id, ...pos, emoji }]);

    // Auto remove after lifetime
    setTimeout(() => {
      setPoops((prev) => {
        const exists = prev.find((p) => p.id === id);
        if (exists) {
          // Missed - lose a life
          const newLives = livesRef.current - 1;
          livesRef.current = newLives;
          setLives(newLives);
          if (newLives <= 0) endGame();
        }
        return prev.filter((p) => p.id !== id);
      });
    }, getLifetime(scoreRef.current));
  }

  function tapPoop(id) {
    setPoops((prev) => prev.filter((p) => p.id !== id));
    const newScore = scoreRef.current + 10;
    scoreRef.current = newScore;
    setScore(newScore);
  }

  async function endGame() {
    if (spawnRef.current) clearInterval(spawnRef.current);
    setGameState('gameover');
    setPoops([]);
    const current = scoreRef.current;
    const stored = parseInt(await storageGet(HIGH_SCORE_KEY) || '0', 10);
    if (current > stored) {
      await storageSet(HIGH_SCORE_KEY, String(current));
      setHighScore(current);
    }
  }

  function startGame() {
    scoreRef.current = 0;
    livesRef.current = 3;
    setScore(0);
    setLives(3);
    setPoops([]);
    setGameState('playing');
  }

  function handleClose() {
    if (spawnRef.current) clearInterval(spawnRef.current);
    setGameState('idle');
    setPoops([]);
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>X</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Toca la Caca</Text>
          <View style={styles.headerRight} />
        </View>

        {/* HUD */}
        <View style={styles.hud}>
          <View style={styles.hudItem}>
            <Text style={styles.hudLabel}>Puntos</Text>
            <Text style={styles.hudValue}>{score}</Text>
          </View>
          <View style={styles.hudItem}>
            <Text style={styles.hudLabel}>Record</Text>
            <Text style={styles.hudValue}>{highScore}</Text>
          </View>
          <View style={styles.hudItem}>
            <Text style={styles.hudLabel}>Vidas</Text>
            <Text style={styles.hudValue}>
              {Array.from({ length: 3 }).map((_, i) => i < lives ? '\uD83D\uDCA9' : '\uD83D\uDCA8').join('')}
            </Text>
          </View>
        </View>

        {/* Game area */}
        <View style={styles.gameArea}>
          {gameState === 'idle' && (
            <View style={styles.centerBox}>
              <Text style={styles.bigEmoji}>\uD83D\uDCA9</Text>
              <Text style={styles.centerTitle}>Toca la Caca</Text>
              <Text style={styles.centerSub}>
                Toca las cacas antes de que desaparezcan{'\n'}
                3 escapes = game over{'\n'}
                La velocidad aumenta con la puntuacion
              </Text>
              <TouchableOpacity style={styles.startBtn} onPress={startGame}>
                <Text style={styles.startBtnText}>Empezar</Text>
              </TouchableOpacity>
              {highScore > 0 && (
                <Text style={styles.highScoreText}>Record: {highScore} pts</Text>
              )}
            </View>
          )}

          {gameState === 'gameover' && (
            <View style={styles.centerBox}>
              <Text style={styles.bigEmoji}>\uD83D\uDCA8</Text>
              <Text style={styles.centerTitle}>Game Over</Text>
              <Text style={styles.gameoverScore}>{score} puntos</Text>
              {score >= highScore && score > 0 && (
                <Text style={styles.newRecord}>Nuevo record!</Text>
              )}
              <TouchableOpacity style={styles.startBtn} onPress={startGame}>
                <Text style={styles.startBtnText}>Volver a jugar</Text>
              </TouchableOpacity>
            </View>
          )}

          {gameState === 'playing' &&
            poops.map((poop) => (
              <TouchableOpacity
                key={poop.id}
                style={[styles.poop, { left: poop.x, top: poop.y }]}
                onPress={() => tapPoop(poop.id)}
                activeOpacity={0.6}
              >
                <Text style={styles.poopEmoji}>{poop.emoji}</Text>
              </TouchableOpacity>
            ))}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F0E1' },
  header: {
    backgroundColor: '#8B6914',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  headerRight: { width: 36 },
  hud: {
    flexDirection: 'row',
    backgroundColor: '#2C3E50',
    paddingVertical: 10,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  hudItem: { alignItems: 'center' },
  hudLabel: { fontSize: 11, color: '#AAA', fontWeight: '600' },
  hudValue: { fontSize: 18, color: '#FFF', fontWeight: 'bold', marginTop: 2 },
  gameArea: { flex: 1, position: 'relative' },
  poop: {
    position: 'absolute',
    width: POOP_SIZE,
    height: POOP_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  poopEmoji: { fontSize: 48 },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  bigEmoji: { fontSize: 80 },
  centerTitle: { fontSize: 28, fontWeight: 'bold', color: '#2C3E50', marginTop: 12 },
  centerSub: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
  },
  startBtn: {
    backgroundColor: '#8B6914',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 30,
    marginTop: 28,
    elevation: 3,
  },
  startBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 },
  highScoreText: { fontSize: 14, color: '#8B6914', marginTop: 12, fontWeight: '600' },
  gameoverScore: { fontSize: 40, fontWeight: 'bold', color: '#8B6914', marginTop: 8 },
  newRecord: { fontSize: 16, color: '#27AE60', fontWeight: 'bold', marginTop: 6 },
});
