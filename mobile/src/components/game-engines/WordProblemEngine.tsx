import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
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

interface WordProblemEngineProps {
  module: LessonModule;
  onComplete: (score: number) => void;
}

export const WordProblemEngine: React.FC<WordProblemEngineProps> = ({
  module,
  onComplete,
}) => {
  const instruction = module.data.instruction || 'Read the story and solve the problem';
  
  const storyText = (module.data.storyText as string) || '';
  const problemType = (module.data.problemType as string) || 'addition';
  const firstNumber = (module.data.firstNumber as number) || 0;
  const secondNumber = (module.data.secondNumber as number) || 0;
  const answer = (module.data.answer as number) || 0;
  const assetID = (module.data.assetID as string) || 'fruit_apple_red';
  
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [showFeedback, setShowFeedback] = useState<string | null>(null);
  const [showCongratsModal, setShowCongratsModal] = useState(false);
  const [showObjects, setShowObjects] = useState(true);

  const handleSubmit = useCallback(() => {
    const answerNum = parseInt(userAnswer);
    
    if (isNaN(answerNum)) {
      setShowFeedback('Please enter a number');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (answerNum === answer) {
      setIsCompleted(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowFeedback('Correct! Great job!');
      setShowCongratsModal(true);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      if (answerNum < answer) {
        setShowFeedback('Too low! Try again.');
      } else {
        setShowFeedback('Too high! Try again.');
      }
      setTimeout(() => setShowFeedback(null), 2000);
    }
  }, [userAnswer, answer, isCompleted]);

  const assetImage = loadAssetImage(assetID);
  const emoji = getAssetEmoji(assetID);

  const renderObjects = (count: number) => {
    return (
      <View style={styles.objectsContainer}>
        {Array.from({ length: count }).map((_, i) => (
          <View key={i} style={styles.objectItem}>
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
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <GameSurface style={styles.gameCard} contentStyle={styles.gameArea}>
          <View style={styles.header}>
            <Body size="medium" style={styles.instruction}>
              {instruction}
            </Body>
          </View>

          {/* Story Card */}
          <Card variant="elevated" padding="large" style={styles.storyCard}>
          <View style={styles.storyContainer}>
            <Ionicons
              name="book-outline"
              size={32}
              color={theme.colors.primary[500]}
              style={styles.storyIcon}
            />
            <Text
              style={styles.storyText}
              numberOfLines={0}  // allow unlimited lines
              ellipsizeMode="tail"
            >
              {storyText}
            </Text>
          </View>
        </Card>

          {/* Visual Representation */}
          {showObjects && (
            <Card variant="elevated" padding="large" style={styles.visualCard}>
              <View style={styles.visualContainer}>
                <View style={styles.groupContainer}>
                  <Body size="small" style={styles.groupLabel}>
                    First group: {firstNumber}
                  </Body>
                  {renderObjects(firstNumber)}
                </View>
                
                <View style={styles.operatorContainer}>
                  <Text style={styles.operator}>
                    {problemType === 'addition' ? '+' : '−'}
                  </Text>
                </View>

                <View style={styles.groupContainer}>
                  <Body size="small" style={styles.groupLabel}>
                    Second group: {secondNumber}
                  </Body>
                  {renderObjects(secondNumber)}
                </View>
              </View>
            </Card>
          )}

          {/* Answer Input */}
          <Card variant="elevated" padding="large" style={styles.answerCard}>
            <View style={styles.answerContainer}>
              <Body size="medium" style={styles.answerLabel}>
                What is the answer?
              </Body>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.answerInput}
                  placeholder="Enter your answer"
                  value={userAnswer}
                  onChangeText={(text) => {
                    setUserAnswer(text.replace(/[^0-9]/g, ''));
                    setShowFeedback(null);
                  }}
                  keyboardType="numeric"
                  editable={!isCompleted}
                  maxLength={3}
                />
              </View>
              <Button
                variant="primary"
                size="large"
                onPress={handleSubmit}
                disabled={isCompleted || !userAnswer}
                fullWidth
                style={styles.submitButton}
              >
                Submit Answer
              </Button>
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
        title="Excellent!"
        message={`The answer is ${answer}! You solved the problem correctly!`}
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
  storyCard: {
  marginBottom: theme.spacing[4],
  backgroundColor: theme.colors.primary[50],
  paddingVertical: theme.spacing[6],
  paddingHorizontal: theme.spacing[4],
},
  storyContainer: {
    alignItems: 'center',
  },
  storyIcon: {
    marginBottom: theme.spacing[3],
  },
  storyText: {
  color: theme.colors.text.primary,
  fontSize: theme.typography.fontSize.xl, // bigger text
  lineHeight: 32,
  textAlign: 'center',
  fontWeight: '600',
},
  visualCard: {
    marginBottom: theme.spacing[4],
    backgroundColor: theme.colors.background.light,
  },
 visualContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
},
  groupContainer: {
    alignItems: 'center',
    flex: 1,
    minWidth: 100,
  },
  groupLabel: {
    color: theme.colors.text.secondary,
    fontWeight: '600',
    marginBottom: theme.spacing[2],
  },
  operatorContainer: {
  alignItems: 'center',
  justifyContent: 'center',
  width: 60,
},
  operator: {
    fontSize: theme.typography.fontSize['3xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary[700],
  },
  objectsContainer: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  justifyContent: 'center',
  gap: theme.spacing[1],
  maxWidth: 150,
},
  objectItem: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  objectImage: {
    width: 50,
    height: 50,
  },
  objectEmoji: {
    fontSize: 40,
  },
  answerCard: {
    marginBottom: theme.spacing[4],
    backgroundColor: theme.colors.background.light,
  },
  answerContainer: {
    alignItems: 'center',
  },
  answerLabel: {
    color: theme.colors.text.primary,
    fontWeight: '600',
    marginBottom: theme.spacing[3],
  },
  inputContainer: {
    width: '100%',
    marginBottom: theme.spacing[4],
  },
  answerInput: {
    width: '100%',
    padding: theme.spacing[4],
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    textAlign: 'center',
    backgroundColor: theme.colors.background.primary,
    borderWidth: 2,
    borderColor: theme.colors.gray[300],
    borderRadius: theme.borderRadius.xl,
    color: theme.colors.text.primary,
  },
  submitButton: {
    marginTop: theme.spacing[2],
  },
  feedbackContainer: {
    marginTop: theme.spacing[2],
    marginBottom: theme.spacing[2],
    alignItems: 'center',
  },
});

