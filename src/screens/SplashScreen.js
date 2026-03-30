import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  StatusBar,
  TouchableWithoutFeedback,
} from 'react-native';

export default function SplashScreen({ onFinish }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const textFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in the icon
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start(() => {
      // Then fade in the text
      Animated.timing(textFade, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    });

    // Auto-advance after 3 seconds
    const timer = setTimeout(() => {
      onFinish();
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <TouchableWithoutFeedback onPress={onFinish}>
      <View style={styles.container}>
        <StatusBar backgroundColor="#8B6914" barStyle="light-content" />
        <Animated.View style={[styles.iconContainer, { opacity: fadeAnim }]}>
          <Text style={styles.poopEmoji}>{'\uD83D\uDCA9'}</Text>
          <Text style={styles.appName}>Appreton</Text>
        </Animated.View>
        <Animated.View style={[styles.messageContainer, { opacity: textFade }]}>
          <Text style={styles.message}>Te cagas? abreme</Text>
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F0E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
  },
  poopEmoji: {
    fontSize: 120,
  },
  appName: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#8B6914',
    marginTop: 10,
  },
  messageContainer: {
    marginTop: 30,
  },
  message: {
    fontSize: 22,
    color: '#A07B1A',
    fontWeight: '600',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
