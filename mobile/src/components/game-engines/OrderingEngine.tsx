import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Body } from '../ui/Body';
import { Card } from '../ui/Card';
import { Button } from '../common/Button';
import { CongratulationsModal } from '../ui/CongratulationsModal';
import { GameSurface } from '../ui/GameSurface';
import { theme } from '../../config/theme';
import * as Haptics from 'expo-haptics';
import { LessonModule } from '../../services/lesson.service';
import { ASSET_IMAGE_MAP } from '../../data/sticker-assets';

interface OrderingEngineProps {
  module: LessonModule;
  onComplete: (score: number) => void;
}

export const OrderingEngine: React.FC<OrderingEngineProps> = ({
  module,
  onComplete,
}) => {
  const instruction = module.data.instruction || 'Arrange the items in the correct order';
  
 // ✅ Correct Count from Create Activity
const correctCount = (module.data.correctCount as number) || 8;

// ✅ Generate correct order starting from 1 up to correctCount
const correctOrder =
  (module.data.correctOrder as number[]) ||
  Array.from({ length: correctCount }, (_, i) => i + 1); // 1,2,3,...,correctCount

// ✅ Shuffle initial order
const [orderedItems, setOrderedItems] = useState<number[]>(() => {
  return [...correctOrder].sort(() => Math.random() - 0.5);
});

  const [isCompleted, setIsCompleted] = useState(false);
  const [showFeedback, setShowFeedback] = useState<string | null>(null);
  const [showCongratsModal, setShowCongratsModal] = useState(false);

  // Move item function
  const moveItem = useCallback((fromIndex: number, toIndex: number) => {
    if (isCompleted) return;

    const newOrder = [...orderedItems];
    const [removed] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, removed);
    setOrderedItems(newOrder);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [orderedItems, isCompleted]);

  // Submit to check
  const handleSubmit = useCallback(() => {
    const isCorrect = JSON.stringify(orderedItems) === JSON.stringify(correctOrder);
    
    if (isCorrect) {
      setIsCompleted(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowFeedback('Perfect!');
      setShowCongratsModal(true);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setShowFeedback('Not quite right. Try again!');
      setTimeout(() => setShowFeedback(null), 2000);
    }
  }, [orderedItems, correctOrder]);

  const handleMoveUp = useCallback((index: number) => {
    if (index > 0) moveItem(index, index - 1);
  }, [moveItem]);

  const handleMoveDown = useCallback((index: number) => {
    if (index < orderedItems.length - 1) moveItem(index, index + 1);
  }, [moveItem, orderedItems.length]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Body size="medium" style={styles.instruction}>
            {instruction}
          </Body>
        </View>

        <GameSurface style={styles.gameCard} contentStyle={styles.gameArea}>
          {/* Ordered Items List */}
          <View style={styles.itemsContainer}>
            {orderedItems.map((item, index) => (
              <Card
                key={`${item}-${index}`}
                variant="elevated"
                padding="medium"
                style={styles.itemCard}
              >
                <View style={styles.itemContent}>
                  <View style={styles.itemNumber}>
                    <Body size="large" style={{ color: theme.colors.primary[700], fontWeight: 'bold' }}>
                      {index + 1}
                    </Body>
                  </View>
                  <View style={styles.itemValue}>
                    {ASSET_IMAGE_MAP[`number_${item}`] ? (
                      <Image
                        source={ASSET_IMAGE_MAP[`number_${item}`]}
                        style={styles.itemImage}
                        resizeMode="contain"
                      />
                    ) : (
                      <Text style={styles.itemText}>{item}</Text>
                    )}
                  </View>
                  <View style={styles.itemControls}>
                    <TouchableOpacity
                      onPress={() => handleMoveUp(index)}
                      disabled={index === 0 || isCompleted}
                      style={[styles.controlButton, (index === 0 || isCompleted) && styles.controlButtonDisabled]}
                    >
                      <Ionicons
                        name="chevron-up"
                        size={24}
                        color={index === 0 || isCompleted ? theme.colors.gray[400] : theme.colors.primary[600]}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleMoveDown(index)}
                      disabled={index === orderedItems.length - 1 || isCompleted}
                      style={[styles.controlButton, (index === orderedItems.length - 1 || isCompleted) && styles.controlButtonDisabled]}
                    >
                      <Ionicons
                        name="chevron-down"
                        size={24}
                        color={index === orderedItems.length - 1 || isCompleted ? theme.colors.gray[400] : theme.colors.primary[600]}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </Card>
            ))}
          </View>

          {/* Feedback */}
          {showFeedback && (
            <View style={styles.feedbackContainer}>
              <Card variant="elevated" padding="medium">
                <Body
                  size="medium"
                  style={{
                    color: showFeedback.includes('Perfect') ? theme.colors.success[600] : theme.colors.error[600],
                    fontWeight: '600',
                  }}
                >
                  {showFeedback}
                </Body>
              </Card>
            </View>
          )}

          {/* Submit Button */}
          {!isCompleted && (
            <View style={styles.buttonContainer}>
              <Button variant="primary" size="large" onPress={handleSubmit} fullWidth>
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
        title="Perfect!"
        message="You got the order right!"
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
    gap: theme.spacing[3],
  },
  itemsContainer: {
    marginBottom: theme.spacing[4],
  },
  itemCard: {
    marginBottom: theme.spacing[3],
    backgroundColor: theme.colors.background.light,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary[200],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing[3],
  },
  itemValue: {
    flex: 1,
  },
  itemText: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  itemImage: {
    width: 56,
    height: 56,
    alignSelf: 'flex-start',
  },
  itemControls: {
    flexDirection: 'row',
    gap: theme.spacing[2],
  },
  controlButton: {
    padding: theme.spacing[1],
  },
  controlButtonDisabled: {
    opacity: 0.3,
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