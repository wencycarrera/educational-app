import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  FlatList,
  Animated,
  ListRenderItem,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

// Adjust these imports based on your actual file structure
import { Heading } from '../ui/Heading';
import { Body } from '../ui/Body';
import { Card } from '../ui/Card';
import { CongratulationsModal } from '../ui/CongratulationsModal';
import { theme } from '../../config/theme';
import { LessonModule } from '../../services/lesson.service';
import { useTTS } from '../../hooks/useTTS';
import { ASSET_IMAGE_MAP } from '../../data/sticker-assets';

interface NumberLineEngineProps {
  module: LessonModule;
  onComplete: (score: number) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_WIDTH = 90; // Wider to accommodate larger bubbles
const NUMBER_SIZE = 70;

// --- Sub-Component: Number Item ---
// Extracted and Memoized to prevent re-rendering the whole list on every tap
interface NumberItemProps {
  number: number;
  status: 'idle' | 'selected' | 'next' | 'disabled';
  onPress: (num: number) => void;
  isFirst: boolean;
  isLast: boolean;
}

const NumberLineItem = React.memo(({ number, status, onPress, isFirst, isLast }: NumberItemProps) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const numberAsset = ASSET_IMAGE_MAP[`number_${number}`];
  
  // Animation logic
  useEffect(() => {
    if (status === 'selected') {
      Animated.spring(scaleAnim, {
        toValue: 1.1,
        useNativeDriver: true,
        friction: 5,
      }).start();
    } else {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    }
  }, [status]);

  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    if (status === 'next') {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0.2, duration: 900, useNativeDriver: true }),
        ])
      );
      loop.start();
    } else {
      glowAnim.setValue(0);
    }
    return () => {
      if (loop) loop.stop();
    };
  }, [status, glowAnim]);

  // Trigger a shake/error visual if needed (exposed via ref in a fuller implementation, 
  // but kept simple here via prop or parent control)

  const getBubbleStyle = () => {
    switch (status) {
      case 'selected': return styles.bubbleSelected;
      case 'next': return styles.bubbleNext; // Hint style
      default: return styles.bubbleIdle;
    }
  };

  const getTextStyle = () => {
    switch (status) {
      case 'selected': return styles.textSelected;
      case 'next': return styles.textNext;
      default: return styles.textIdle;
    }
  };

  return (
    <View style={styles.itemContainer}>
      {/* connecting line segments */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.glowRing,
          {
            opacity: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.7] }),
            transform: [
              { scale: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) },
            ],
          },
        ]}
      />
      <View style={styles.lineContainer}>
        <View style={[styles.lineSegment, isFirst && styles.transparentLine]} />
        <View style={[styles.lineSegment, isLast && styles.transparentLine]} />
      </View>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => onPress(number)}
        disabled={status === 'selected' || status === 'disabled'}
        accessibilityLabel={`Number ${number}`}
        accessibilityState={{ selected: status === 'selected' }}
        style={styles.touchableArea}
      >
        <Animated.View style={[styles.bubble, getBubbleStyle(), { transform: [{ scale: scaleAnim }] }]}>
          {numberAsset ? (
            <Image source={numberAsset} style={styles.numberImage} />
          ) : (
            <Text style={[styles.numberText, getTextStyle()]}>{number}</Text>
          )}
        </Animated.View>
        <View style={styles.tickMark} />
      </TouchableOpacity>
    </View>
  );
});

// --- Main Engine Component ---

export const NumberLineEngine: React.FC<NumberLineEngineProps> = ({
  module,
  onComplete,
}) => {
  const { speakNumber } = useTTS();
  const flatListRef = useRef<FlatList>(null);
  
  // Destructure with safe defaults
  const {
    instruction = 'Tap the numbers in order',
    startNumber = 0,
    endNumber = 20,
    mode = 'forward',
    skipBy = 1,
    targetNumber = null,
    correctSequence: manualSequence = [],
  } = module.data;

  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [showCongrats, setShowCongrats] = useState(false);

  // 1. Generate Data (Memoized)
  const numbers = useMemo(() => {
    return Array.from({ length: endNumber - startNumber + 1 }, (_, i) => startNumber + i);
  }, [startNumber, endNumber]);

  // 2. Calculate Expected Sequence (Memoized)
  const expectedSequence = useMemo<number[]>(() => {
    if (manualSequence.length > 0) return manualSequence;
    
    const seq: number[] = [];
    if (mode === 'forward' || mode === 'skip_counting') {
      for (let i = startNumber; i <= endNumber; i += skipBy) seq.push(i);
    } else if (mode === 'backward') {
      for (let i = endNumber; i >= startNumber; i -= skipBy) seq.push(i);
    }
    return seq;
  }, [manualSequence, mode, startNumber, endNumber, skipBy]);

  // 3. Interaction Handler
  const handleTap = useCallback((number: number) => {
    if (isCompleted) return;

    // TTS
    speakNumber(number);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Mode: Free / Find Target
    if (mode === 'free') {
      if (targetNumber !== null) {
        if (number === targetNumber) {
           handleSuccess();
        } else {
           handleError('Try again!');
        }
      }
      return;
    }

    // Mode: Sequential
    const nextIndex = selectedNumbers.length;
    const nextExpected = expectedSequence[nextIndex];

    if (number === nextExpected) {
      const newSelected = [...selectedNumbers, number];
      setSelectedNumbers(newSelected);
      
      // Auto-scroll to next relevant area
      if (nextIndex + 1 < expectedSequence.length) {
         scrollToNumber(expectedSequence[nextIndex + 1]);
      }

      if (newSelected.length === expectedSequence.length) {
        handleSuccess();
      } else {
        setFeedback({ type: 'success', message: 'Good!' });
        setTimeout(() => setFeedback(null), 1000);
      }
    } else {
      handleError(`Find ${nextExpected}!`);
    }
  }, [selectedNumbers, expectedSequence, mode, targetNumber, isCompleted, speakNumber]);

  const handleSuccess = () => {
    setIsCompleted(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setFeedback({ type: 'success', message: 'Perfect!' });
    setShowCongrats(true);
  };

  const handleError = (msg: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    setFeedback({ type: 'error', message: msg });
    setTimeout(() => setFeedback(null), 1500);
  };

  // 4. Scrolling Logic
  const scrollToNumber = useCallback((num: number) => {
    const index = numbers.indexOf(num);
    if (index !== -1 && flatListRef.current) {
      flatListRef.current.scrollToIndex({
        index,
        animated: true,
        viewOffset: SCREEN_WIDTH / 2 - ITEM_WIDTH / 2, // Centers the item
      });
    }
  }, [numbers]);

  // Initial scroll setup
  useEffect(() => {
    // Need a slight delay to allow FlatList layout to calculate
    setTimeout(() => {
      if (mode === 'backward') {
        scrollToNumber(endNumber);
      } else {
        scrollToNumber(startNumber);
      }
    }, 300);
  }, []);

  // 5. Render Item
  const renderItem: ListRenderItem<number> = useCallback(({ item, index }) => {
    let status: 'idle' | 'selected' | 'next' | 'disabled' = 'idle';
    
    if (selectedNumbers.includes(item)) status = 'selected';
    // Highlight next expected number subtly if you want to give hints
    else if (!isCompleted && expectedSequence[selectedNumbers.length] === item && mode !== 'free') status = 'next'; 
    if (isCompleted) status = 'disabled';

    return (
      <NumberLineItem 
        number={item}
        status={status}
        onPress={handleTap}
        isFirst={index === 0}
        isLast={index === numbers.length - 1}
      />
    );
  }, [selectedNumbers, expectedSequence, isCompleted, mode, handleTap, numbers.length]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Body size="medium" style={styles.instruction}>{instruction}</Body>
        
        {/* Progress Display */}
        {mode !== 'free' && (
          <View style={styles.progressContainer}>
            <Body size="medium" style={styles.progressText}>
              {selectedNumbers.length} / {expectedSequence.length}
            </Body>
          </View>
        )}
      </View>

      {/* Main Game Area */}
      <LinearGradient
        colors={[theme.colors.primary[50], theme.colors.primary[100]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gameCard}
      >
        <View style={styles.gameArea}>
          {/* Scroll Hints */}
          <View style={styles.scrollHintContainer}>
             <Ionicons name="chevron-back" size={20} color={theme.colors.gray[400]} />
             <Body size="small" style={{ color: theme.colors.gray[400] }}>Scroll</Body>
             <Ionicons name="chevron-forward" size={20} color={theme.colors.gray[400]} />
          </View>

          <View style={styles.listContainer}>
            <LinearGradient
              colors={[theme.colors.primary[100], theme.colors.primary[50], theme.colors.primary[100]]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.trackAmbient}
            />
            <FlatList
              ref={flatListRef}
              data={numbers}
              renderItem={renderItem}
              keyExtractor={(item) => item.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.flatListContent}
              getItemLayout={(_, index) => ({
                length: ITEM_WIDTH,
                offset: ITEM_WIDTH * index,
                index,
              })}
              initialNumToRender={10}
              maxToRenderPerBatch={10}
              windowSize={5}
              removeClippedSubviews={Platform.OS === 'android'}
            />
          </View>
        </View>
      </LinearGradient>

      {/* Feedback Area */}
      <View style={styles.feedbackArea}>
        {feedback && (
          <Animated.View style={styles.feedbackCard}>
            <Ionicons 
              name={feedback.type === 'success' ? 'checkmark-circle' : 'alert-circle'} 
              size={24} 
              color={feedback.type === 'success' ? theme.colors.success[600] : theme.colors.error[600]} 
            />
            <Text style={[
              styles.feedbackText, 
              { color: feedback.type === 'success' ? theme.colors.success[700] : theme.colors.error[700] }
            ]}>
              {feedback.message}
            </Text>
          </Animated.View>
        )}
      </View>

      <CongratulationsModal
        visible={showCongrats}
        score={100}
        onClose={() => {
          setShowCongrats(false);
          onComplete(100);
        }}
        title="Excellent Work!"
        message="You've mastered this number line!"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
    paddingTop: theme.spacing[4],
    paddingHorizontal: theme.spacing[3],
  },
  header: {
    paddingHorizontal: theme.spacing[2],
    alignItems: 'center',
    zIndex: 10,
  },
  title: {
    color: theme.colors.primary[700],
    textAlign: 'center',
  },
  instruction: {
    color: theme.colors.gray[600],
    marginTop: theme.spacing[2],
    textAlign: 'center',
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
  // Game Area
  gameCard: {
    marginTop: theme.spacing[6],
    borderRadius: 18,
    paddingVertical: theme.spacing[4],
    paddingHorizontal: theme.spacing[2],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  gameArea: {
    height: 190,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  scrollHintContainer: {
    position: 'absolute',
    top: 10,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.6,
  },
  listContainer: {
    height: 130, // Constrain height for the FlatList
    justifyContent: 'center',
  },
  trackAmbient: {
    position: 'absolute',
    height: 6,
    width: '100%',
    top: 78,
    opacity: 0.6,
    borderRadius: 10,
  },
  flatListContent: {
    paddingHorizontal: SCREEN_WIDTH / 2 - ITEM_WIDTH / 2, // Center the first/last items
    alignItems: 'center',
  },
  // Item Styles
  itemContainer: {
    width: ITEM_WIDTH,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  glowRing: {
    position: 'absolute',
    width: NUMBER_SIZE + 22,
    height: NUMBER_SIZE + 22,
    borderRadius: (NUMBER_SIZE + 22) / 2,
    backgroundColor: theme.colors.primary[200],
    zIndex: 0,
  },
  lineContainer: {
    position: 'absolute',
    top: 70, // Align with the bottom of the tick mark
    left: 0,
    right: 0,
    flexDirection: 'row',
    height: 3,
  },
  lineSegment: {
    flex: 1,
    backgroundColor: theme.colors.primary[300],
    height: 3,
  },
  transparentLine: {
    backgroundColor: 'transparent',
  },
  touchableArea: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    height: '100%',
    paddingTop: 10,
  },
  bubble: {
    width: NUMBER_SIZE,
    height: NUMBER_SIZE,
    borderRadius: NUMBER_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
    marginBottom: 5, // Space between bubble and tick
  },
  bubbleIdle: {
    backgroundColor: theme.colors.background.light,
    borderColor: theme.colors.gray[200],
  },
  bubbleSelected: {
    backgroundColor: theme.colors.success[100],
    borderColor: theme.colors.success[500],
    borderWidth: 3,
  },
  bubbleNext: {
    backgroundColor: theme.colors.primary[50],
    borderColor: theme.colors.primary[400],
    shadowColor: theme.colors.primary[300],
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  textIdle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.gray[700],
  },
  textSelected: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.success[700],
  },
  textNext: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.primary[700],
  },
  numberImage: {
    width: NUMBER_SIZE - 6,
    height: NUMBER_SIZE - 6,
    resizeMode: 'contain',
  },
  tickMark: {
    width: 2,
    height: 15,
    backgroundColor: theme.colors.primary[400],
    borderRadius: 1,
  },
  // Feedback
  feedbackArea: {
    marginTop: theme.spacing[4],
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: theme.colors.background.light,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  feedbackText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
