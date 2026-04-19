import React, { useState, useCallback } from 'react';
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
import { CongratulationsModal } from '../ui/CongratulationsModal';
import { GameSurface } from '../ui/GameSurface';
import { theme } from '../../config/theme';
import * as Haptics from 'expo-haptics';
import { LessonModule } from '../../services/lesson.service';
import { loadAssetImage, getAssetEmoji } from '../../utils/assetLoader';
import { Image } from 'expo-image';

interface OrdinalPositionEngineProps {
  module: LessonModule;
  onComplete: (score: number) => void;
}

const ORDINAL_SUFFIXES: Record<number, string> = {
  1: 'st',
  2: 'nd',
  3: 'rd',
  4: 'th',
  5: 'th',
  6: 'th',
  7: 'th',
  8: 'th',
  9: 'th',
  10: 'th',
};

export const OrdinalPositionEngine: React.FC<OrdinalPositionEngineProps> = ({
  module,
  onComplete,
}) => {
  const instruction = module.data.instruction || 'Tap the object in the position called out';
  
  const numberOfObjects = (module.data.numberOfObjects as number) || 5;
  const targetPosition = (module.data.targetPosition as number) || 3;
  const assetIDs = Array.isArray(module.data.assetIDs)
    ? (module.data.assetIDs as string[])
    : module.data.assetID
      ? [module.data.assetID as string]
      : [];
  const legacyAssetID = (module.data.assetID as string) || 'fruit_apple_red';
  
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showFeedback, setShowFeedback] = useState<string | null>(null);
  const [showCongratsModal, setShowCongratsModal] = useState(false);

  const ordinalText = `${targetPosition}${ORDINAL_SUFFIXES[targetPosition] || 'th'}`;
  const ordinalWord = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'][targetPosition - 1] || `${targetPosition}th`;

  const handleObjectTap = useCallback((index: number) => {
    if (isCompleted) return;

    // Convert 0-based index to 1-based position
    const position = index + 1;
    setSelectedIndex(index);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (position === targetPosition) {
      setIsCompleted(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowFeedback(`Correct! This is the ${ordinalText} (${ordinalWord})!`);
      setShowCongratsModal(true);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setShowFeedback(`Try again! Look for the ${ordinalText} position.`);
      setTimeout(() => setShowFeedback(null), 2000);
    }
  }, [targetPosition, ordinalText, ordinalWord, isCompleted]);

  const fallbackAssetImage = loadAssetImage(legacyAssetID);
  const fallbackEmoji = getAssetEmoji(legacyAssetID);

  const getAssetForIndex = (index: number) => {
    const id = assetIDs[index] || assetIDs[0] || legacyAssetID;
    const image = loadAssetImage(id);
    const emoji = getAssetEmoji(id);
    return { image, emoji };
  };

  const getNumberImage = (position: number) => {
    const key = `number_${position}`;
    return loadAssetImage(key);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Body size="medium" style={styles.instruction}>
            {instruction}
          </Body>
        </View>

        <GameSurface style={styles.gameCard} contentStyle={styles.gameArea}>
          {/* Question Card */}
          <Card variant="elevated" padding="large" style={styles.questionCard}>
            <View style={styles.questionContainer}>
              <Body size="large" style={styles.questionText}>
                Which one is the <Text style={styles.ordinalText}>{ordinalText}</Text>?
              </Body>
              <Body size="small" style={styles.questionSubtext}>
                ({ordinalWord})
              </Body>
            </View>
          </Card>

          {/* Objects Line */}
          <Card variant="elevated" padding="large" style={styles.objectsCard}>
            <View style={styles.objectsContainer}>
              {Array.from({ length: numberOfObjects }).map((_, index) => {
                const position = index + 1;
                const isSelected = selectedIndex === index;
                const isCorrect = position === targetPosition;
                const { image, emoji } = getAssetForIndex(index);
                const numberImage = getNumberImage(position);
                
                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handleObjectTap(index)}
                    disabled={isCompleted}
                    style={[
                      styles.objectWrapper,
                      isSelected && isCorrect && styles.objectWrapperCorrect,
                      isSelected && !isCorrect && styles.objectWrapperIncorrect,
                    ]}
                    activeOpacity={0.7}
                  >
                    <View style={styles.objectItem}>
                      {image ? (
                        <Image
                          source={image}
                          style={styles.objectImage}
                          contentFit="contain"
                        />
                      ) : fallbackAssetImage ? (
                        <Image
                          source={fallbackAssetImage}
                          style={styles.objectImage}
                          contentFit="contain"
                        />
                      ) : (
                        <Text style={styles.objectEmoji}>{emoji || fallbackEmoji}</Text>
                      )}
                    </View>
                    {numberImage ? (
                      <Image
                        source={numberImage}
                        style={styles.numberImage}
                        contentFit="contain"
                      />
                    ) : (
                      <Body size="small" style={styles.positionLabel}>
                        {position}
                      </Body>
                    )}
                    {isCompleted && isCorrect && (
                      <View style={styles.checkmarkContainer}>
                        <Ionicons
                          name="checkmark-circle"
                          size={24}
                          color={theme.colors.success[500]}
                        />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card>

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
        title="Great Job!"
        message={`You found the ${ordinalText} position!`}
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
  questionCard: {
    marginBottom: theme.spacing[4],
    backgroundColor: theme.colors.primary[50],
  },
  questionContainer: {
    alignItems: 'center',
  },
  questionText: {
    color: theme.colors.text.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
  ordinalText: {
    color: theme.colors.primary[700],
    fontWeight: '700',
    fontSize: theme.typography.fontSize['2xl'],
  },
  questionSubtext: {
    color: theme.colors.text.secondary,
    marginTop: theme.spacing[2],
    fontStyle: 'italic',
  },
  objectsCard: {
    marginBottom: theme.spacing[4],
    backgroundColor: theme.colors.background.light,
  },
  objectsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: theme.spacing[3],
  },
  objectWrapper: {
    alignItems: 'center',
    padding: theme.spacing[2],
    borderRadius: theme.borderRadius.lg,
    borderWidth: 3,
    borderColor: theme.colors.gray[300],
    backgroundColor: theme.colors.background.light,
    minWidth: 80,
  },
  objectWrapperCorrect: {
    borderColor: theme.colors.success[500],
    backgroundColor: theme.colors.success[50],
  },
  objectWrapperIncorrect: {
    borderColor: theme.colors.error[500],
    backgroundColor: theme.colors.error[50],
  },
  objectItem: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing[1],
  },
  objectImage: {
    width: 60,
    height: 60,
  },
  objectEmoji: {
    fontSize: 48,
  },
  positionLabel: {
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  numberImage: {
    width: 48,
    height: 48,
    marginTop: theme.spacing[1],
  },
  checkmarkContainer: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.full,
  },
  feedbackContainer: {
    marginTop: theme.spacing[2],
    marginBottom: theme.spacing[2],
    alignItems: 'center',
  },
});

