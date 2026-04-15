import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getRandomQuestions, TRIVIA_QUESTIONS } from '../data/trivia';
import { storageGet, storageSet } from '../data/storage';

const HIGH_SCORE_KEY = '@appreton_trivia_highscore';
const BEST_STREAK_KEY = '@appreton_trivia_best_streak';
const QUESTIONS_PER_GAME = 10;

export default function CagatriviaScreen() {
  const [state, setState] = useState('idle'); // idle | playing | result
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadHighScore();
    }, [])
  );

  async function loadHighScore() {
    const v = await storageGet(HIGH_SCORE_KEY);
    if (v) setHighScore(parseInt(v, 10) || 0);
  }

  function startGame() {
    setQuestions(getRandomQuestions(QUESTIONS_PER_GAME));
    setCurrentIdx(0);
    setSelectedAnswer(null);
    setScore(0);
    setShowExplanation(false);
    setState('playing');
  }

  function handleAnswer(idx) {
    if (selectedAnswer !== null) return; // ya respondio
    const q = questions[currentIdx];
    const isCorrect = idx === q.correct;
    setSelectedAnswer(idx);
    setShowExplanation(true);
    if (isCorrect) setScore((s) => s + 10);
  }

  async function handleNext() {
    const nextIdx = currentIdx + 1;
    if (nextIdx >= questions.length) {
      // Fin del juego
      if (score > highScore) {
        setHighScore(score);
        await storageSet(HIGH_SCORE_KEY, String(score));
      }
      setState('result');
      return;
    }
    setCurrentIdx(nextIdx);
    setSelectedAnswer(null);
    setShowExplanation(false);
  }

  // -------- IDLE (pantalla inicial) --------
  if (state === 'idle') {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar backgroundColor="#8B6914" barStyle="light-content" />
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.emoji}>🧠💩</Text>
          <Text style={styles.title}>Cagatrivia</Text>
          <Text style={styles.subtitle}>
            Preguntas absurdas y curiosas sobre la caca, el WC y todo lo que les rodea
          </Text>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Como se juega</Text>
            <Text style={styles.cardText}>
              🔸 10 preguntas al azar del pool de {TRIVIA_QUESTIONS.length}
            </Text>
            <Text style={styles.cardText}>🔸 4 respuestas posibles. Solo 1 es correcta.</Text>
            <Text style={styles.cardText}>🔸 +10 puntos por acierto. Maximo 100.</Text>
            <Text style={styles.cardText}>🔸 Cada pregunta lleva su explicacion al fondo.</Text>
          </View>

          <View style={styles.scoreCard}>
            <Text style={styles.scoreLabel}>Tu mejor puntuacion</Text>
            <Text style={styles.scoreValue}>{highScore} / 100</Text>
          </View>

          <TouchableOpacity style={styles.startBtn} onPress={startGame}>
            <Text style={styles.startBtnText}>Empezar 💩</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // -------- PLAYING --------
  if (state === 'playing') {
    const q = questions[currentIdx];
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar backgroundColor="#8B6914" barStyle="light-content" />
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.headerRow}>
            <Text style={styles.progress}>
              {currentIdx + 1} / {questions.length}
            </Text>
            <Text style={styles.scoreInline}>Puntos: {score}</Text>
          </View>

          <View style={styles.questionCard}>
            <Text style={styles.questionText}>{q.question}</Text>
          </View>

          <View style={styles.answersContainer}>
            {q.answers.map((answer, idx) => {
              const isSelected = selectedAnswer === idx;
              const isCorrect = idx === q.correct;
              let btnStyle = styles.answerBtn;
              let txtStyle = styles.answerText;
              if (selectedAnswer !== null) {
                if (isCorrect) {
                  btnStyle = [styles.answerBtn, styles.answerCorrect];
                  txtStyle = [styles.answerText, styles.answerTextCorrect];
                } else if (isSelected) {
                  btnStyle = [styles.answerBtn, styles.answerWrong];
                  txtStyle = [styles.answerText, styles.answerTextWrong];
                }
              }
              return (
                <TouchableOpacity
                  key={idx}
                  style={btnStyle}
                  onPress={() => handleAnswer(idx)}
                  disabled={selectedAnswer !== null}
                  activeOpacity={0.7}
                >
                  <Text style={txtStyle}>{answer}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {showExplanation && q.explanation && (
            <View style={styles.explanationCard}>
              <Text style={styles.explanationTitle}>
                {selectedAnswer === q.correct ? '✅ Correcto' : '❌ Fallaste'}
              </Text>
              <Text style={styles.explanationText}>{q.explanation}</Text>
            </View>
          )}

          {selectedAnswer !== null && (
            <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
              <Text style={styles.nextBtnText}>
                {currentIdx + 1 === questions.length ? 'Ver resultado' : 'Siguiente →'}
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // -------- RESULT --------
  if (state === 'result') {
    const total = questions.length * 10;
    const ratio = score / total;
    let title, emoji, msg;
    if (ratio >= 0.9) {
      title = 'Dios de la Cloaca';
      emoji = '👑💩';
      msg = 'Nadie sabe mas que tu sobre el trono. Impresionante.';
    } else if (ratio >= 0.7) {
      title = 'Experto cagante';
      emoji = '🏆';
      msg = 'Casi todo correcto. Aun te queda algun misterio por descubrir.';
    } else if (ratio >= 0.5) {
      title = 'Aprendiz del WC';
      emoji = '📚';
      msg = 'Vas por buen camino. Sigue investigando en tus proximos apretones.';
    } else {
      title = 'Novato total';
      emoji = '🤷';
      msg = 'Te queda mucho por aprender. Vuelve a intentarlo.';
    }

    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar backgroundColor="#8B6914" barStyle="light-content" />
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.emoji}>{emoji}</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{msg}</Text>

          <View style={styles.resultCard}>
            <Text style={styles.resultScoreLabel}>Puntuacion final</Text>
            <Text style={styles.resultScoreValue}>
              {score} <Text style={{ fontSize: 24 }}>/ {total}</Text>
            </Text>
            {score > 0 && score === highScore && score >= total * 0.5 && (
              <Text style={styles.resultBest}>🎉 ¡Nuevo record personal!</Text>
            )}
            <Text style={styles.resultHigh}>Tu mejor: {highScore}</Text>
          </View>

          <TouchableOpacity style={styles.startBtn} onPress={startGame}>
            <Text style={styles.startBtnText}>Jugar de nuevo 🔁</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.idleBtn}
            onPress={() => setState('idle')}
          >
            <Text style={styles.idleBtnText}>Volver al menu</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F0E1' },
  container: { padding: 20, paddingBottom: 60 },
  emoji: { fontSize: 70, textAlign: 'center', marginTop: 20 },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#2C3E50',
    textAlign: 'center',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
    lineHeight: 22,
  },
  card: {
    backgroundColor: '#FFF',
    padding: 18,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#2C3E50', marginBottom: 10 },
  cardText: { fontSize: 14, color: '#555', marginBottom: 4 },
  scoreCard: {
    backgroundColor: '#FFF9E6',
    borderWidth: 2,
    borderColor: '#F0C400',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  scoreLabel: { fontSize: 13, color: '#7A5D00', fontWeight: '600' },
  scoreValue: { fontSize: 30, fontWeight: '900', color: '#7A5D00', marginTop: 4 },
  startBtn: {
    backgroundColor: '#8B6914',
    padding: 18,
    borderRadius: 30,
    alignItems: 'center',
    elevation: 3,
  },
  startBtnText: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  idleBtn: { padding: 14, alignItems: 'center', marginTop: 10 },
  idleBtnText: { color: '#8B6914', fontSize: 15, fontWeight: '600' },
  // Playing
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  progress: { fontSize: 14, color: '#666', fontWeight: '700' },
  scoreInline: {
    fontSize: 14,
    color: '#8B6914',
    fontWeight: '800',
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  questionCard: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    elevation: 2,
  },
  questionText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2C3E50',
    lineHeight: 24,
  },
  answersContainer: { gap: 10 },
  answerBtn: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#DDD',
  },
  answerText: { fontSize: 15, color: '#2C3E50', fontWeight: '600' },
  answerCorrect: { backgroundColor: '#D5F5E3', borderColor: '#27AE60' },
  answerTextCorrect: { color: '#1E8449', fontWeight: '800' },
  answerWrong: { backgroundColor: '#FADBD8', borderColor: '#E74C3C' },
  answerTextWrong: { color: '#C0392B', fontWeight: '800' },
  explanationCard: {
    backgroundColor: '#EBF5FB',
    borderLeftWidth: 4,
    borderLeftColor: '#3498DB',
    padding: 14,
    borderRadius: 10,
    marginTop: 16,
  },
  explanationTitle: { fontSize: 14, fontWeight: '800', color: '#2980B9', marginBottom: 4 },
  explanationText: { fontSize: 13, color: '#555', lineHeight: 19 },
  nextBtn: {
    backgroundColor: '#8B6914',
    padding: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 20,
    elevation: 2,
  },
  nextBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  // Result
  resultCard: {
    backgroundColor: '#FFF',
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 3,
  },
  resultScoreLabel: { fontSize: 14, color: '#888', fontWeight: '600' },
  resultScoreValue: {
    fontSize: 56,
    fontWeight: '900',
    color: '#8B6914',
    marginTop: 6,
  },
  resultBest: { fontSize: 15, color: '#27AE60', fontWeight: '800', marginTop: 8 },
  resultHigh: { fontSize: 13, color: '#888', marginTop: 4 },
});
