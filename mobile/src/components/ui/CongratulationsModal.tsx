import React, { useEffect, useMemo } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
  Text,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import { Button } from '../common/Button';
import { theme } from '../../config/theme';
import { loadAssetImage } from '../../utils/assetLoader';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// --- Types ---
export interface CongratulationsModalProps {
  visible: boolean;
  score: number;
  maxScore?: number; // Added to calculate star rating
  onClose: () => void;
  title?: string;
  message?: string;
}

interface ConfettiParticle {
  id: number;
  x: number;
  color: string;
  size: number;
  rotation: number;
}

// --- Constants ---
const CONFETTI_COLORS = [
  '#FFD700', // Gold
  '#FF6B6B', // Red/Pink
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Green
];

// --- Components ---

// 1. Improved Confetti (Lighter weight implementation)
const ConfettiParticleItem = ({ delay, visible }: { delay: number; visible: boolean }) => {
  const yPosition = useSharedValue(-50);
  const rotation = useSharedValue(0);
  const xWobble = useSharedValue(0);
  
  // Random props for variety
  const startX = useMemo(() => Math.random() * SCREEN_WIDTH, []);
  const color = useMemo(() => CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)], []);
  const size = useMemo(() => 8 + Math.random() * 6, []);

  useEffect(() => {
    if (visible) {
      // Reset positions
      yPosition.value = -50;
      rotation.value = 0;
      xWobble.value = 0;
      
      // Fall animation
      yPosition.value = withDelay(delay, withTiming(SCREEN_HEIGHT + 50, { duration: 2500, easing: Easing.linear }));
      // Rotate animation
      rotation.value = withDelay(delay, withRepeat(withTiming(360, { duration: 1000 }), -1));
      // Side to side wobble
      xWobble.value = withDelay(delay, withRepeat(withSequence(
        withTiming(15, { duration: 500 }),
        withTiming(-15, { duration: 500 })
      ), -1, true));
    }
  }, [visible]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: yPosition.value },
      { translateX: xWobble.value },
      { rotate: `${rotation.value}deg` }
    ],
  }));

  return (
    <Animated.View
      style={[
        style,
        {
          position: 'absolute',
          left: startX,
          top: 0,
          width: size,
          height: size,
          backgroundColor: color,
          borderRadius: 4,
        },
      ]}
    />
  );
};

// 2. Animated Star Component
const AnimatedStar = ({ index, filled, delay }: { index: number, filled: boolean, delay: number }) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(delay, withSpring(1, { damping: 12, stiffness: 200 }));
    opacity.value = withDelay(delay, withTiming(1, { duration: 300 }));
  }, [filled]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const starImage = loadAssetImage('reward_star_gold');

  return (
    <Animated.View style={[styles.starContainer, style]}>
      {filled && starImage ? (
        <Image 
          source={starImage} 
          style={styles.starImage}
          contentFit="contain"
        />
      ) : (
        <Text style={styles.starText}>☆</Text>
      )}
    </Animated.View>
  );
};

export const CongratulationsModal: React.FC<CongratulationsModalProps> = ({
  visible,
  score,
  maxScore = 100, // Default max score for calculation
  onClose,
  title = "Amazing Job!",
  message = "You're getting smarter every day!",
}) => {
  // --- Shared Values ---
  const backdropOpacity = useSharedValue(0);
  const modalScale = useSharedValue(0.5);
  const modalTranslateY = useSharedValue(100);
  const trophyScale = useSharedValue(0);
  const trophyRotate = useSharedValue(-20);
  
  // Calculate stars (Logic: >80% = 3 stars, >50% = 2 stars, else 1 star)
  const starCount = useMemo(() => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 3;
    if (percentage >= 50) return 2;
    return 1;
  }, [score, maxScore]);

  // Load trophy image
  const trophyImage = useMemo(() => loadAssetImage('reward_trophy'), []);

  // --- Effects ---
  useEffect(() => {
    if (visible) {
      // 1. Entrance Sounds
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Speech.speak('Woohoo! ' + title, { rate: 1.1, pitch: 1.2 });

      // 2. Visual Entrance Sequence
      backdropOpacity.value = withTiming(1, { duration: 400 });
      
      modalScale.value = withSpring(1, { damping: 15 });
      modalTranslateY.value = withSpring(0, { damping: 15 });

      // Trophy Pop & Wiggle
      trophyScale.value = withDelay(200, withSpring(1, { damping: 12 }));
      trophyRotate.value = withDelay(200, withSequence(
        withTiming(10, { duration: 100 }),
        withTiming(-10, { duration: 100 }),
        withTiming(0, { duration: 100 })
      ));

    } else {
      // Reset
      backdropOpacity.value = 0;
      modalScale.value = 0.5;
      modalTranslateY.value = 100;
      trophyScale.value = 0;
      Speech.stop();
    }
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const modalStyle = useAnimatedStyle(() => ({
    opacity: 1,
    transform: [
      { scale: modalScale.value },
      { translateY: modalTranslateY.value }
    ],
  }));

  const trophyStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: trophyScale.value },
      { rotate: `${trophyRotate.value}deg` }
    ],
  }));

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Dark Backdrop */}
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View style={[styles.backdrop, backdropStyle]} />
        </TouchableWithoutFeedback>

        {/* Confetti Background Layer */}
        <View style={styles.confettiContainer} pointerEvents="none">
           {Array.from({ length: 30 }).map((_, i) => (
             <ConfettiParticleItem key={i} delay={i * 50} visible={visible} />
           ))}
        </View>

        {/* Modal Card */}
        <Animated.View style={[styles.cardContainer, modalStyle]}>
          
          {/* 1. Floating Header Icon (Breaks the layout) */}
          <View style={styles.iconAnchor}>
            <Animated.View style={[styles.iconBadge, trophyStyle]}>
              <LinearGradient
                colors={['#FFD700', '#FFA500']}
                style={styles.iconGradient}
              >
                {trophyImage ? (
                  <Image 
                    source={trophyImage} 
                    style={styles.iconImage}
                    contentFit="contain"
                  />
                ) : (
                  <Text style={styles.iconEmoji}>🏆</Text>
                )}
              </LinearGradient>
            </Animated.View>
          </View>

          {/* 2. Main Card Content */}
          <View style={styles.cardContent}>
            
            {/* Title Section */}
            <View style={styles.headerSection}>
              <Text style={styles.titleText}>{title}</Text>
              <Text style={styles.subtitleText}>{message}</Text>
            </View>

            {/* Star Rating Section */}
            <View style={styles.starsRow}>
              {[1, 2, 3].map((star, index) => (
                <AnimatedStar 
                  key={index} 
                  index={index} 
                  filled={index < starCount}
                  delay={600 + (index * 200)} // Sequential animation
                />
              ))}
            </View>

            {/* Score Pill */}
            <View style={styles.scoreContainer}>
              <View style={styles.scorePill}>
                <Text style={styles.scoreLabel}>POINTS</Text>
                <Text style={styles.scoreValue}>+{starCount}</Text>
              </View>
            </View>

            {/* 3. Action Button (Full Width, Bottom) */}
            <View style={styles.footer}>
              <Button
                variant="primary" // Assuming you have a rounded/bold button style
                size="large"
                onPress={onClose}
                fullWidth
                style={styles.actionButton}
              >
                Continue
              </Button>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20, 10, 40, 0.8)', // Deep purple/black tint
  },
  confettiContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  cardContainer: {
    width: Math.min(SCREEN_WIDTH * 0.85, 400),
    alignItems: 'center',
    zIndex: 10,
  },
  // This helps position the Trophy halfway out of the box
  iconAnchor: {
    zIndex: 20,
    marginBottom: -50, // Pulls the card up into the icon
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  iconBadge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    padding: 6,
    backgroundColor: 'white', // White border ring
  },
  iconGradient: {
    flex: 1,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF8E1',
  },
  iconEmoji: {
    fontSize: 50,
  },
  iconImage: {
    width: 85,
    height: 85,
  },
  cardContent: {
    backgroundColor: 'white',
    borderRadius: 32,
    width: '100%',
    paddingTop: 60, // Space for the trophy
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 5,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  titleText: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.primary[600],
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitleText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    height: 140,
    width: '100%',
    alignSelf: 'center',
  },
  starContainer: {
    marginHorizontal: -20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starText: {
    fontSize: 42,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  starImage: {
    width: 150,
    height: 150,
  },
  scoreContainer: {
    marginBottom: 24,
    width: '100%',
    alignItems: 'center',
  },
  scorePill: {
    backgroundColor: '#F0F5FF',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 99,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.primary[100],
  },
  scoreLabel: {
    color: theme.colors.primary[400],
    fontWeight: '700',
    fontSize: 12,
    marginRight: 8,
    letterSpacing: 1,
  },
  scoreValue: {
    color: theme.colors.primary[600],
    fontWeight: '900',
    fontSize: 24,
  },
  footer: {
    width: '100%',
  },
  actionButton: {
    borderRadius: 20, // Extra rounded for kids
    height: 56,
  },
});
