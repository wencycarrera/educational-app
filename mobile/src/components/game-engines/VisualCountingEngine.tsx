import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
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

interface VisualCountingEngineProps {
  module: LessonModule;
  onComplete: (score: number) => void;
}

export const VisualCountingEngine: React.FC<VisualCountingEngineProps> = ({
  module,
  onComplete,
}) => {
  const instruction = module.data.instruction || 'Count the objects';
  
  // Parse visual counting configuration
  const targetCount = (module.data.targetCount as number) || 5;
  const mode = (module.data.mode as 'count' | 'add' | 'subtract' | 'one_more_less') || 'count';
  const assetID = (module.data.assetID as string) || 'fruit_apple_red';
  const initialCount = (module.data.initialCount as number) || 0;
  const operationValue = (module.data.operationValue as number) || 1;

  const [currentCount, setCurrentCount] = useState(initialCount);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showFeedback, setShowFeedback] = useState<string | null>(null);
  const [animatingObjects, setAnimatingObjects] = useState<number[]>([]);
  const [showCongratsModal, setShowCongratsModal] = useState(false);

  // Animate objects appearing/disappearing
  useEffect(() => {
    if (animatingObjects.length > 0) {
      const timer = setTimeout(() => {
        setAnimatingObjects([]);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [animatingObjects]);

  const handleAdd = useCallback(() => {
    if (isCompleted) return;
    
    const newCount = currentCount + operationValue;
    setCurrentCount(newCount);
    setAnimatingObjects([...animatingObjects, newCount - 1]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (mode === 'count' && newCount === targetCount) {
      setIsCompleted(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowFeedback('Perfect!');
      setShowCongratsModal(true);
    } else if (mode === 'add' && newCount === targetCount) {
      setIsCompleted(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowFeedback('Perfect!');
      setShowCongratsModal(true);
    }
  }, [currentCount, targetCount, mode, operationValue, isCompleted, animatingObjects, onComplete]);

  const handleSubtract = useCallback(() => {
    if (isCompleted) return;
    if (currentCount > 0) {
      const newCount = currentCount - operationValue;
      setCurrentCount(newCount);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [currentCount, operationValue, isCompleted]);

  const handleSubmit = useCallback(() => {
    if (currentCount === targetCount) {
      setIsCompleted(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowFeedback('Perfect!');
      setShowCongratsModal(true);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setShowFeedback(`Try again! Count: ${currentCount}, Target: ${targetCount}`);
      setTimeout(() => setShowFeedback(null), 2000);
    }
  }, [currentCount, targetCount, onComplete]);

  const renderObjects = () => {
    const assetImage = loadAssetImage(assetID);
    const emoji = getAssetEmoji(assetID);

    return (
      <View style={styles.objectsContainer}>
        {Array.from({ length: currentCount }).map((_, i) => {
          const isAnimating = animatingObjects.includes(i);
          return (
            <View
              key={i}
              style={[
                styles.objectItem,
                isAnimating && styles.objectItemAnimating,
              ]}
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
            </View>
          );
        })}
      </View>
    );
  };

  const getInstructionText = () => {
    switch (mode) {
      case 'count':
        return `Count to ${targetCount}`;
      case 'add':
        return `Add ${operationValue} more to make ${targetCount}`;
      case 'subtract':
        return `Remove ${operationValue} to make ${targetCount}`;
      case 'one_more_less':
        return `Show one ${operationValue > 0 ? 'more' : 'less'} than ${initialCount}`;
      default:
        return instruction;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <GameSurface style={styles.gameCard} contentStyle={styles.gameArea}>
          <View style={styles.header}>
            <Body size="medium" style={styles.instruction}>
              {getInstructionText()}
            </Body>
            {mode === 'count' && (
              <View style={styles.progressContainer}>
                <Body size="medium" style={styles.progressText}>
                  {currentCount} / {targetCount}
                </Body>
              </View>
            )}
          </View>

          {/* Visual Objects Display */}
          <Card variant="elevated" padding="large" style={styles.objectsCard}>
            {currentCount === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>📦</Text>
                <Body size="medium" className="text-gray-500 mt-2">
                  Tap the buttons to add or remove objects
                </Body>
              </View>
            ) : (
              renderObjects()
            )}
          </Card>

          {/* Controls */}
          <Card variant="elevated" padding="medium" style={styles.controlsCard}>
            <View style={styles.controlsRow}>
              <TouchableOpacity
                onPress={handleSubtract}
                disabled={currentCount === 0 || isCompleted}
                style={[
                  styles.controlButton,
                  styles.controlButtonRemove,
                  (currentCount === 0 || isCompleted) && styles.controlButtonDisabled,
                ]}
              >
                <Ionicons
                  name="remove"
                  size={32}
                  color={currentCount === 0 || isCompleted ? theme.colors.gray[400] : theme.colors.error[600]}
                />
              </TouchableOpacity>

              <View style={styles.countDisplay}>
                <Text style={styles.countText}>{currentCount}</Text>
              </View>

              <TouchableOpacity
                onPress={handleAdd}
                disabled={isCompleted}
                style={[
                  styles.controlButton,
                  styles.controlButtonAdd,
                  isCompleted && styles.controlButtonDisabled,
                ]}
              >
                <Ionicons
                  name="add"
                  size={32}
                  color={isCompleted ? theme.colors.gray[400] : theme.colors.success[600]}
                />
              </TouchableOpacity>
            </View>
          </Card>

          {/* Feedback */}
          {showFeedback && (
            <View style={styles.feedbackContainer}>
              <Card variant="elevated" padding="medium">
                <Body
                  size="medium"
                  style={{
                    color: showFeedback.includes('Perfect')
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

          {/* Submit Button (for count mode) */}
          {!isCompleted && mode === 'count' && (
            <View style={styles.buttonContainer}>
              <Button
                variant="primary"
                size="large"
                onPress={handleSubmit}
                fullWidth
              >
                Check Answer
              </Button>
            </View>
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
        message={`You counted ${targetCount} objects correctly!`}
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
  countContainer: {
    marginTop: theme.spacing[3],
    padding: theme.spacing[3],
    backgroundColor: theme.colors.primary[50],
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  objectsCard: {
    marginBottom: theme.spacing[4],
    backgroundColor: theme.colors.background.light,
    minHeight: 200,
  },
  objectsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: theme.spacing[3],
    padding: theme.spacing[2],
  },
  objectItem: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  objectItemAnimating: {
    transform: [{ scale: 1.2 }],
  },
  objectImage: {
    width: 60,
    height: 60,
  },
  objectEmoji: {
    fontSize: 50,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing[6],
  },
  emptyEmoji: {
    fontSize: 64,
  },
  controlsCard: {
    marginBottom: theme.spacing[4],
    backgroundColor: theme.colors.background.light,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing[4],
  },
  controlButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },
  controlButtonAdd: {
    backgroundColor: theme.colors.success[100],
    borderColor: theme.colors.success[500],
  },
  controlButtonRemove: {
    backgroundColor: theme.colors.error[100],
    borderColor: theme.colors.error[500],
  },
  controlButtonDisabled: {
    opacity: 0.3,
    backgroundColor: theme.colors.gray[100],
    borderColor: theme.colors.gray[300],
  },
  countDisplay: {
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing[3],
    backgroundColor: theme.colors.primary[50],
    borderRadius: theme.borderRadius.lg,
  },
  countText: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary[700],
  },
  feedbackContainer: {
    marginTop: theme.spacing[2],
    marginBottom: theme.spacing[2],
    alignItems: 'center',
  },
  buttonContainer: {
    marginTop: theme.spacing[4],
  },
});

