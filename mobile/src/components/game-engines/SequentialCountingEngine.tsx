import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Heading } from '../ui/Heading';
import { Body } from '../ui/Body';
import { Card } from '../ui/Card';
import { Button } from '../common/Button';
import { CongratulationsModal } from '../ui/CongratulationsModal';
import { GameSurface } from '../ui/GameSurface';
import { theme } from '../../config/theme';
import * as Haptics from 'expo-haptics';
import { LessonModule } from '../../services/lesson.service';
import { loadAssetImage, getAssetEmoji } from '../../utils/assetLoader';
import { Image } from 'expo-image';
import { useTTS } from '../../hooks/useTTS';

interface SequentialCountingEngineProps {
  module: LessonModule;
  onComplete: (score: number) => void;
}

interface AnimatedObject {
  id: number;
  number: number;
  scale: Animated.Value;
  opacity: Animated.Value;
  position: Animated.ValueXY;
}

export const SequentialCountingEngine: React.FC<SequentialCountingEngineProps> = ({
  module,
  onComplete,
}) => {
  const { speakNumber } = useTTS();
  const instruction = module.data.instruction || 'Count the objects in sequence';
  
  // Parse configuration
  const startNumber = (module.data.startNumber as number) || 0;
  const endNumber = (module.data.endNumber as number) || 20;
  const direction = (module.data.direction as 'forward' | 'backward') || 'forward';
  const assetID = (module.data.assetID as string) || 'fruit_apple_red';
  const animationSpeed = (module.data.animationSpeed as 'slow' | 'medium' | 'fast') || 'medium';
  const autoPlay = (module.data.autoPlay as boolean) || false;

  // Calculate sequence
  const sequence = useMemo(() => {
    const seq: number[] = [];
    if (direction === 'forward') {
      for (let i = startNumber; i <= endNumber; i++) {
        seq.push(i);
      }
    } else {
      for (let i = endNumber; i >= startNumber; i--) {
        seq.push(i);
      }
    }
    return seq;
  }, [startNumber, endNumber, direction]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showCongratsModal, setShowCongratsModal] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [animatedObjects, setAnimatedObjects] = useState<AnimatedObject[]>([]);
  const animationTimersRef = useRef<NodeJS.Timeout[]>([]);

  // Animation speed multipliers
  const speedMultiplier = {
    slow: 1500,
    medium: 1000,
    fast: 600,
  }[animationSpeed];

  // Initialize animated objects
  useEffect(() => {
    const objects: AnimatedObject[] = sequence.map((num, idx) => ({
      id: idx,
      number: num,
      scale: new Animated.Value(0),
      opacity: new Animated.Value(0),
      position: new Animated.ValueXY({ x: 0, y: 0 }),
    }));
    setAnimatedObjects(objects);
  }, [sequence]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      animationTimersRef.current.forEach(timer => clearTimeout(timer));
    };
  }, []);

  // Auto-play functionality
  useEffect(() => {
    if (autoPlay && !isCompleted && !isPlaying && currentIndex < sequence.length) {
      setIsPlaying(true);
      handleNext();
    }
  }, [autoPlay, currentIndex, isCompleted, isPlaying]);

  const animateObjectAppearance = useCallback((obj: AnimatedObject, delay: number = 0) => {
    return new Promise<void>((resolve) => {
      const timer = setTimeout(() => {
        // Random position for visual interest
        const randomX = (Math.random() - 0.5) * 40;
        const randomY = (Math.random() - 0.5) * 40;
        obj.position.setValue({ x: randomX, y: randomY });

        // Animate appearance
        Animated.parallel([
          Animated.spring(obj.scale, {
            toValue: 1,
            useNativeDriver: true,
            tension: 50,
            friction: 7,
          }),
          Animated.timing(obj.opacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.spring(obj.position, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
            tension: 50,
            friction: 7,
          }),
        ]).start(() => resolve());
      }, delay);
      animationTimersRef.current.push(timer);
    });
  }, []);

  const animateObjectDisappearance = useCallback((obj: AnimatedObject) => {
    return new Promise<void>((resolve) => {
      Animated.parallel([
        Animated.timing(obj.scale, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(obj.opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => resolve());
    });
  }, []);

  const handleNext = useCallback(async () => {
    if (isCompleted || currentIndex >= sequence.length) return;

    const nextIndex = currentIndex + 1;
    
    // Calculate the number that will be displayed after the state update
    // This matches the same logic used in the render to calculate currentNumber
    let numberToSpeak: number;
    if (direction === 'forward') {
      const nextNumVisible = nextIndex; // For forward, numVisible = currentIndex
      if (nextNumVisible === 0) {
        numberToSpeak = startNumber;
      } else {
        numberToSpeak = startNumber === 0 ? nextNumVisible : startNumber + nextNumVisible - 1;
      }
    } else {
      const nextNumVisible = sequence.length - nextIndex; // For backward, numVisible = sequence.length - currentIndex
      if (nextNumVisible === 0) {
        numberToSpeak = startNumber;
      } else {
        numberToSpeak = sequence[nextNumVisible];
      }
    }
    
    // Update the index first so the visual count changes
    setCurrentIndex(nextIndex);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Start animation in parallel (don't wait for it)
    const obj = animatedObjects[currentIndex];
    if (obj) {
      if (direction === 'forward') {
        // Objects appear as we count forward
        animateObjectAppearance(obj);
      } else {
        // Objects disappear as we count backward
        animateObjectDisappearance(obj);
      }
    }

    // Speak the number right after state update (using requestAnimationFrame for better sync)
    // This ensures the visual count has updated before we speak
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        speakNumber(numberToSpeak);
      });
    });

    if (nextIndex >= sequence.length) {
      // Completed!
      setIsCompleted(true);
      setIsPlaying(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowCongratsModal(true);
    } else if (autoPlay) {
      // Continue auto-play
      const timer = setTimeout(() => {
        handleNext();
      }, speedMultiplier);
      animationTimersRef.current.push(timer);
    } else {
      setIsPlaying(false);
    }
  }, [currentIndex, sequence, animatedObjects, direction, autoPlay, speedMultiplier, isCompleted, speakNumber, animateObjectAppearance, animateObjectDisappearance, startNumber]);

  const handleManualNext = useCallback(() => {
    if (!isPlaying && !isCompleted) {
      setIsPlaying(true);
      handleNext();
    }
  }, [isPlaying, isCompleted, handleNext]);

  const handleReset = useCallback(() => {
    // Clear all timers
    animationTimersRef.current.forEach(timer => clearTimeout(timer));
    animationTimersRef.current = [];
    
    // Reset state
    setCurrentIndex(0);
    setIsCompleted(false);
    setIsPlaying(false);
    
    // Reset animations
    animatedObjects.forEach(obj => {
      obj.scale.setValue(0);
      obj.opacity.setValue(0);
      obj.position.setValue({ x: 0, y: 0 });
    });
  }, [animatedObjects]);

  // Calculate visible objects
  // For forward: show objects up to currentIndex (so currentIndex objects total)
  // For backward: show objects from currentIndex onwards (so sequence.length - currentIndex objects total)
  const visibleObjects = direction === 'forward' 
    ? animatedObjects.slice(0, currentIndex)
    : animatedObjects.slice(currentIndex);
  
  // The displayed number should equal the number of visible objects
  // Simple rule: if there are N objects visible, show the number that represents N objects
  // For forward counting: if we have N objects and started at S, show S + N - 1 (but show S when N=0)
  // For backward counting: if we have N objects remaining out of total T, show the number at position T - N
  const numVisible = visibleObjects.length;
  let currentNumber: number;
  
  if (direction === 'forward') {
    if (numVisible === 0) {
      // Haven't started counting yet - show start number
      currentNumber = startNumber;
    } else {
      // Formula: currentNumber = startNumber + numVisible - 1
      // Example: counting 0-5, 5 objects = 0 + 5 - 1 = 4? That's wrong, should be 5.
      // Wait, if counting 0-5: 1 object = 0, 2 objects = 1, ..., 6 objects = 5
      // So: currentNumber = startNumber + numVisible - 1 when startNumber = 0 gives numVisible - 1, which is wrong
      // Actually: if counting from 0, 5 objects should show 5, so: currentNumber = numVisible
      // If counting from 3, 5 objects should show 7, so: currentNumber = 3 + 5 - 1 = 7 ✓
      // So the formula works when startNumber > 0, but not when startNumber = 0
      // Fix: currentNumber = (startNumber === 0 ? numVisible : startNumber + numVisible - 1)
      currentNumber = startNumber === 0 ? numVisible : startNumber + numVisible - 1;
    }
  } else {
    // Backward: we start with all objects, remove as we count down
    if (numVisible === 0) {
      currentNumber = startNumber; // All removed, back to start
    } else {
      // We have numVisible objects remaining out of sequence.length total
      // If we started with sequence.length objects and removed (sequence.length - numVisible),
      // we're at position: sequence.length - numVisible in the backward sequence
      // But we want to show the number that equals numVisible objects
      // If counting backward 5->0 and we have 3 objects, show 3
      // So: currentNumber = sequence[sequence.length - numVisible]
      currentNumber = sequence[sequence.length - numVisible];
    }
  }

  const assetImage = loadAssetImage(assetID);
  const emoji = getAssetEmoji(assetID);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <GameSurface style={styles.gameCard} contentStyle={styles.gameArea}>
          <View style={styles.header}>
            <Body size="medium" style={styles.instruction}>
              {instruction}
            </Body>
            
            {/* Progress Display */}
            <View style={styles.progressContainer}>
              <Body size="medium" style={styles.progressText}>
                {currentIndex} / {sequence.length}
              </Body>
            </View>

            {/* Current Number Display */}
            <Card variant="elevated" padding="large" style={styles.numberCard}>
              <Body size="large" style={styles.currentNumberLabel}>
                {direction === 'forward' ? 'Count:' : 'Count Back:'}
              </Body>
              <Text style={styles.currentNumber}>
                {currentNumber}
              </Text>
            </Card>
          </View>

          {/* Objects Display */}
          <Card variant="elevated" padding="large" style={styles.objectsCard}>
            {visibleObjects.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>📦</Text>
                <Body size="medium" className="text-gray-500 mt-2">
                  {direction === 'forward' 
                    ? 'Tap "Next" to start counting!'
                    : 'Tap "Next" to start counting backward!'}
                </Body>
              </View>
            ) : (
              <View style={styles.objectsContainer}>
                {visibleObjects.map((obj) => {
                  const animatedStyle = {
                    transform: [
                      { scale: obj.scale },
                      {
                        translateX: obj.position.x,
                      },
                      {
                        translateY: obj.position.y,
                      },
                    ],
                    opacity: obj.opacity,
                  };

                  return (
                    <Animated.View
                      key={obj.id}
                      style={[styles.objectItem, animatedStyle]}
                    >
                      {assetImage ? (
                        <Image
                          source={assetImage}
                          style={styles.objectImage}
                          contentFit="contain"
                        />
                      ) : (
                        <Text style={styles.objectEmoji}>{emoji}</Text>
                      )}
                    </Animated.View>
                  );
                })}
              </View>
            )}
          </Card>

          {/* Controls */}
          {!autoPlay && (
            <Card variant="elevated" padding="medium" style={styles.controlsCard}>
              <View style={styles.controlsRow}>
                <TouchableOpacity
                  onPress={handleReset}
                  disabled={currentIndex === 0}
                  style={[
                    styles.controlButton,
                    styles.resetButton,
                    currentIndex === 0 && styles.controlButtonDisabled,
                  ]}
                >
                  <Ionicons
                    name="refresh"
                    size={24}
                    color={currentIndex === 0 ? theme.colors.gray[400] : theme.colors.gray[600]}
                  />
                  <Body size="small" style={styles.controlButtonText}>
                    Reset
                  </Body>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleManualNext}
                  disabled={isCompleted || isPlaying}
                  style={[
                    styles.controlButton,
                    styles.nextButton,
                    (isCompleted || isPlaying) && styles.controlButtonDisabled,
                  ]}
                >
                  <Ionicons
                    name="arrow-forward"
                    size={24}
                    color={(isCompleted || isPlaying) ? theme.colors.gray[400] : theme.colors.primary[600]}
                  />
                  <Body size="small" style={styles.controlButtonText}>
                    {isCompleted ? 'Complete!' : 'Next'}
                  </Body>
                </TouchableOpacity>
              </View>
            </Card>
          )}

          {autoPlay && (
            <Card variant="elevated" padding="medium" style={styles.autoPlayCard}>
              <Body size="small" style={styles.autoPlayText}>
                Auto-playing... Tap to pause
              </Body>
            </Card>
          )}
        </GameSurface>
      </ScrollView>

      {/* Congratulations Modal */}
      <CongratulationsModal
        visible={showCongratsModal}
        score={100}
        onClose={() => {
          setShowCongratsModal(false);
          onComplete(100);
        }}
        title="Excellent!"
        message={`You counted from ${startNumber} to ${endNumber} ${direction === 'forward' ? 'forward' : 'backward'}!`}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  scrollContent: {
    padding: theme.spacing[4],
    paddingBottom: theme.spacing[8],
  },
  header: {
    marginBottom: theme.spacing[6],
  },
  instruction: {
    color: theme.colors.text.secondary,
    marginTop: theme.spacing[2],
    textAlign: 'center',
  },
  gameCard: {
    marginBottom: theme.spacing[4],
  },
  gameArea: {
    gap: theme.spacing[3],
  },
  progressContainer: {
    marginTop: theme.spacing[4],
    marginBottom: theme.spacing[3],
  },
  progressText: {
    textAlign: 'center',
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  numberCard: {
    backgroundColor: theme.colors.primary[50],
    alignItems: 'center',
    marginBottom: theme.spacing[4],
  },
  currentNumberLabel: {
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[2],
  },
  currentNumber: {
    fontSize: theme.typography.fontSize['5xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary[700],
  },
  objectsCard: {
    marginBottom: theme.spacing[4],
    backgroundColor: theme.colors.background.light,
    minHeight: 300,
  },
  objectsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing[3],
    padding: theme.spacing[2],
  },
  objectItem: {
    width: 70,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  objectImage: {
    width: 70,
    height: 70,
  },
  objectEmoji: {
    fontSize: 60,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing[6],
    minHeight: 200,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: theme.spacing[2],
  },
  controlsCard: {
    marginBottom: theme.spacing[4],
    backgroundColor: theme.colors.background.light,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: theme.spacing[4],
  },
  controlButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing[3],
    borderRadius: theme.borderRadius.xl,
    borderWidth: 2,
    gap: theme.spacing[2],
  },
  resetButton: {
    backgroundColor: theme.colors.gray[100],
    borderColor: theme.colors.gray[300],
  },
  nextButton: {
    backgroundColor: theme.colors.primary[50],
    borderColor: theme.colors.primary[300],
  },
  controlButtonDisabled: {
    opacity: 0.5,
  },
  controlButtonText: {
    fontWeight: '600',
  },
  autoPlayCard: {
    marginBottom: theme.spacing[4],
    backgroundColor: theme.colors.info[50],
    borderColor: theme.colors.info[200],
    borderWidth: 1,
  },
  autoPlayText: {
    textAlign: 'center',
    color: theme.colors.info[700],
    fontWeight: '600',
  },
});

