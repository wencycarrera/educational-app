import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, Animated, Easing } from 'react-native';
import { Heading } from '../ui/Heading';
import { Body } from '../ui/Body';
import { Button } from '../common/Button';
import { theme } from '../../config/theme';
import { getLevelName, getLevelEmoji } from '../../utils/leveling';
import { playSound } from '../../utils/soundPlayer';

export interface LevelUpCelebrationProps {
  visible: boolean;
  oldLevel: number;
  newLevel: number;
  onClose: () => void;
}

/**
 * LevelUpCelebration Component
 * Displays a fun celebration modal when a student levels up
 */
export const LevelUpCelebration: React.FC<LevelUpCelebrationProps> = ({
  visible,
  oldLevel,
  newLevel,
  onClose,
}) => {
  const scaleAnim = React.useRef(new Animated.Value(0)).current;
  const rotateAnim = React.useRef(new Animated.Value(0)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Play level-up sound and haptic feedback
      playSound('levelup');

      // Reset animations
      scaleAnim.setValue(0);
      rotateAnim.setValue(0);
      fadeAnim.setValue(0);

      // Animate entrance
      Animated.parallel([
        // Scale animation (bounce effect)
        Animated.sequence([
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1.1,
            duration: 200,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 6,
            tension: 40,
            useNativeDriver: true,
          }),
        ]),
        // Rotation animation (spin effect)
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        // Fade animation
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, scaleAnim, rotateAnim, fadeAnim]);

  const scale = scaleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const levelName = getLevelName(newLevel);
  const levelEmoji = getLevelEmoji(newLevel);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [{ scale }, { rotate }],
            },
          ]}
        >
          {/* Confetti/Sparkle effect area */}
          <View style={styles.sparkleContainer}>
            <Text style={styles.sparkle}>✨</Text>
            <Text style={[styles.sparkle, styles.sparkle2]}>⭐</Text>
            <Text style={[styles.sparkle, styles.sparkle3]}>🎉</Text>
            <Text style={[styles.sparkle, styles.sparkle4]}>🌟</Text>
          </View>

          {/* Main content */}
          <View style={styles.content}>
            <Text style={styles.levelUpText}>LEVEL UP!</Text>
            
            <View style={styles.levelBadge}>
              <Text style={styles.levelEmoji}>{levelEmoji}</Text>
            </View>

            <Heading level="h2" style={styles.levelNumber}>
              Level {newLevel}
            </Heading>

            <Body size="large" style={styles.levelName}>
              {levelName}
            </Body>

            <View style={styles.levelChange}>
              <Body size="small" style={styles.levelChangeText}>
                Level {oldLevel} → Level {newLevel}
              </Body>
            </View>

            <View style={styles.buttonContainer}>
              <Button
                variant="primary"
                size="large"
                onPress={onClose}
                style={styles.button}
              >
                Awesome!
              </Button>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: theme.colors.background.light,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing[6],
    width: '85%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  sparkleContainer: {
    position: 'absolute',
    top: -20,
    left: 0,
    right: 0,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkle: {
    position: 'absolute',
    fontSize: 30,
    opacity: 0.8,
  },
  sparkle2: {
    top: 10,
    left: '20%',
    fontSize: 25,
  },
  sparkle3: {
    top: 20,
    right: '20%',
    fontSize: 28,
  },
  sparkle4: {
    top: 5,
    left: '60%',
    fontSize: 22,
  },
  content: {
    alignItems: 'center',
    width: '100%',
    marginTop: theme.spacing[4],
  },
  levelUpText: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary[600],
    marginBottom: theme.spacing[4],
    textAlign: 'center',
  },
  levelBadge: {
    width: 100,
    height: 100,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing[3],
    borderWidth: 4,
    borderColor: theme.colors.primary[300],
  },
  levelEmoji: {
    fontSize: 50,
  },
  levelNumber: {
    color: theme.colors.primary[700],
    marginBottom: theme.spacing[2],
    textAlign: 'center',
  },
  levelName: {
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing[4],
    textAlign: 'center',
  },
  levelChange: {
    backgroundColor: theme.colors.gray[100],
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[2],
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing[6],
  },
  levelChangeText: {
    color: theme.colors.gray[700],
    fontWeight: theme.typography.fontWeight.medium,
  },
  buttonContainer: {
    width: '100%',
  },
  button: {
    width: '100%',
  },
});

