import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Heading } from '../ui/Heading';
import { Body } from '../ui/Body';
import { Card } from '../ui/Card';
import { CongratulationsModal } from '../ui/CongratulationsModal';
import { GameSurface } from '../ui/GameSurface';
import { theme } from '../../config/theme';
import * as Haptics from 'expo-haptics';
import { LessonModule } from '../../services/lesson.service';
import { ASSET_IMAGE_MAP } from '../../data/sticker-assets';

interface MatchingEngineProps {
  module: LessonModule;
  onComplete: (score: number) => void;
}

interface MatchingPair {
  left: string;
  right: string;
}

export const MatchingEngine: React.FC<MatchingEngineProps> = ({
  module,
  onComplete,
}) => {
  const instruction = module.data.instruction || 'Match each item on the left with its pair on the right';
  
  const matchingPairs = (module.data.matchingPairs as MatchingPair[]) || [];
  
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [selectedRight, setSelectedRight] = useState<number | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<Set<number>>(new Set());
  const [isCompleted, setIsCompleted] = useState(false);
  const [showFeedback, setShowFeedback] = useState<string | null>(null);
  const [showCongratsModal, setShowCongratsModal] = useState(false);

  // Shuffle the right side items
  const [shuffledRight, setShuffledRight] = useState<MatchingPair[]>([]);

  useEffect(() => {
    // Shuffle right side on mount
    const shuffled = [...matchingPairs].sort(() => Math.random() - 0.5);
    setShuffledRight(shuffled);
  }, []);

  const handleLeftSelect = useCallback((index: number) => {
    if (isCompleted || matchedPairs.has(index)) return;
    
    setSelectedLeft(index);
    setSelectedRight(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [isCompleted, matchedPairs]);

  const handleRightSelect = useCallback((rightIndex: number) => {
    if (isCompleted || selectedLeft === null) return;

    const leftIndex = selectedLeft;
    const leftPair = matchingPairs[leftIndex];
    const rightPair = shuffledRight[rightIndex];

    setSelectedRight(rightIndex);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Check if match is correct - the right item should match the left pair's right value
    if (leftPair.right === rightPair.right) {
      // Correct match
      const newMatched = new Set(matchedPairs);
      newMatched.add(leftIndex);
      setMatchedPairs(newMatched);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowFeedback('Correct match!');
      setTimeout(() => setShowFeedback(null), 1500);

      // Check if all pairs are matched
      if (newMatched.size === matchingPairs.length) {
        setIsCompleted(true);
        setTimeout(() => setShowCongratsModal(true), 500);
      }

      setSelectedLeft(null);
      setSelectedRight(null);
    } else {
      // Incorrect match
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setShowFeedback('Try again!');
      setTimeout(() => {
        setShowFeedback(null);
        setSelectedLeft(null);
        setSelectedRight(null);
      }, 1500);
    }
  }, [selectedLeft, matchingPairs, shuffledRight, matchedPairs, isCompleted]);

  const renderValue = (value: string) => {
    const trimmed = value.trim();
    const numberMatch = /^\d+$/.test(trimmed) ? trimmed : null;
    if (numberMatch && ASSET_IMAGE_MAP[`number_${numberMatch}`]) {
      return (
        <View style={styles.valueContainer}>
          <Image
            source={ASSET_IMAGE_MAP[`number_${numberMatch}`]}
            style={styles.valueImage}
            resizeMode="contain"
          />
          <Text style={styles.valueText}>{trimmed}</Text>
        </View>
      );
    }
    return (
      <Text style={styles.valueText}>
        {value}
      </Text>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Body size="medium" style={styles.instruction}>
            {instruction}
          </Body>
          
          {/* Progress Display */}
          <View style={styles.progressContainer}>
            <Body size="medium" style={styles.progressText}>
              {matchedPairs.size} / {matchingPairs.length}
            </Body>
          </View>
        </View>

        {/* Matching Area */}
        <GameSurface style={styles.gameCard} contentStyle={styles.gameArea}>
          <View style={styles.matchingContainer}>
            {/* Left Column */}
            <View style={styles.column}>
              <Body size="small" style={styles.columnLabel}>
                Match these:
              </Body>
              {matchingPairs.map((pair, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleLeftSelect(index)}
                  disabled={isCompleted || matchedPairs.has(index)}
                  style={[
                    styles.matchItem,
                    selectedLeft === index && styles.matchItemSelected,
                    matchedPairs.has(index) && styles.matchItemMatched,
                  ]}
                  activeOpacity={0.7}
                >
                  <View style={styles.valueWrapper}>
                    {renderValue(pair.left)}
                  </View>
                  {matchedPairs.has(index) && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={theme.colors.success[500]}
                      style={styles.checkmark}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Right Column */}
            <View style={styles.column}>
              <Body size="small" style={styles.columnLabel}>
                With these:
              </Body>
              {shuffledRight.map((pair, index) => {
                const isMatched = matchingPairs.some((p, i) => 
                  p.right === pair.right && matchedPairs.has(i)
                );
                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handleRightSelect(index)}
                    disabled={isCompleted || isMatched}
                    style={[
                      styles.matchItem,
                      selectedRight === index && styles.matchItemSelected,
                      isMatched && styles.matchItemMatched,
                    ]}
                    activeOpacity={0.7}
                  >
                    <View style={styles.valueWrapper}>
                      {renderValue(pair.right)}
                    </View>
                    {isMatched && (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={theme.colors.success[500]}
                        style={styles.checkmark}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </GameSurface>

        {/* Feedback */}
        {showFeedback && (
          <View style={styles.feedbackContainer}>
            <Card variant="elevated" padding="medium">
              <Body
                size="medium"
                style={{
                  color: showFeedback.includes('Correct')
                    ? theme.colors.success[600]
                    : theme.colors.error[600],
                  fontWeight: '600',
                }}
              >
                {showFeedback}
              </Body>
            </Card>
          </View>
        )}


      </ScrollView>

      {/* Congratulations Modal */}
      <CongratulationsModal
        visible={showCongratsModal}
        score={100}
        onClose={() => {
          setShowCongratsModal(false);
          onComplete(100);
        }}
        title="Perfect Match!"
        message="You matched all the pairs correctly!"
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
    padding: 0,
  },
  matchingCard: {
    marginBottom: theme.spacing[4],
    backgroundColor: theme.colors.background.light,
  },
  matchingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: theme.spacing[4],
  },
  column: {
    flex: 1,
    gap: theme.spacing[2],
  },
  columnLabel: {
    color: theme.colors.text.secondary,
    fontWeight: '600',
    marginBottom: theme.spacing[2],
    textAlign: 'center',
  },
  matchItem: {
    padding: theme.spacing[3],
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.gray[300],
    backgroundColor: theme.colors.background.light,
    marginBottom: theme.spacing[2],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  matchItemSelected: {
    borderColor: theme.colors.primary[500],
    backgroundColor: theme.colors.primary[50],
  },
  matchItemMatched: {
    borderColor: theme.colors.success[500],
    backgroundColor: theme.colors.success[50],
  },
  matchText: {
    color: theme.colors.text.primary,
    fontWeight: '600',
    flex: 1,
  },
  matchTextMatched: {
    color: theme.colors.success[700],
  },
  checkmark: {
    marginLeft: theme.spacing[2],
  },
  valueWrapper: {
    flex: 1,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[2],
  },
  valueText: {
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  valueImage: {
    width: 40,
    height: 40,
  },
  feedbackContainer: {
    marginTop: theme.spacing[2],
    marginBottom: theme.spacing[2],
    alignItems: 'center',
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
});

