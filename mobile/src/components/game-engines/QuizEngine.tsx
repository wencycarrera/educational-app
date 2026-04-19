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
import { Button } from '../common/Button';
import { CongratulationsModal } from '../ui/CongratulationsModal';
import { GameSurface } from '../ui/GameSurface';
import { theme } from '../../config/theme';
import * as Haptics from 'expo-haptics';
import { LessonModule } from '../../services/lesson.service';

interface QuizEngineProps {
  module: LessonModule;
  onComplete: (score: number) => void;
}

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

export const QuizEngine: React.FC<QuizEngineProps> = ({
  module,
  onComplete,
}) => {
  const instruction = module.data.instruction || 'Answer the questions correctly';
  const storyText = (module.data.storyText as string) || '';
  const questionType = (module.data.questionType as string) || 'multiple_choice';
  
  // Parse questions from module data or create default
  const questionsData = module.data.questions as Question[] || [
    {
      id: 'q1',
      question: 'What is 2 + 2?',
      options: ['3', '4', '5', '6'],
      correctAnswer: 1,
    },
    {
      id: 'q2',
      question: 'What is 5 - 3?',
      options: ['1', '2', '3', '4'],
      correctAnswer: 1,
    },
  ];

  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showCongratsModal, setShowCongratsModal] = useState(false);
  const [finalScore, setFinalScore] = useState(0);

  const handleAnswerSelect = useCallback((questionId: string, answerIndex: number) => {
    if (showResults || isCompleted) return;
    
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: answerIndex,
    }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [showResults, isCompleted]);

  const handleSubmit = useCallback(() => {
    // Check if all questions are answered
    if (Object.keys(selectedAnswers).length < questionsData.length) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    setShowResults(true);
    
    // Calculate score
    let correctCount = 0;
    questionsData.forEach((question) => {
      if (selectedAnswers[question.id] === question.correctAnswer) {
        correctCount++;
      }
    });

    const score = Math.round((correctCount / questionsData.length) * 100);
    
    if (score === 100) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    setIsCompleted(true);
    setFinalScore(score);
    setTimeout(() => setShowCongratsModal(true), 2000);
  }, [selectedAnswers, questionsData, onComplete]);

  const getAnswerStatus = (questionId: string, optionIndex: number): 'correct' | 'incorrect' | 'selected' | null => {
    if (!showResults) {
      return selectedAnswers[questionId] === optionIndex ? 'selected' : null;
    }

    const question = questionsData.find((q) => q.id === questionId);
    if (!question) return null;

    const isCorrect = optionIndex === question.correctAnswer;
    const isSelected = selectedAnswers[questionId] === optionIndex;

    if (isCorrect) return 'correct';
    if (isSelected && !isCorrect) return 'incorrect';
    return null;
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
          {/* Story Context */}
          {storyText && (
            <Card variant="elevated" padding="large" style={styles.storyCard}>
              <View style={styles.storyContainer}>
                <Ionicons
                  name="book-outline"
                  size={24}
                  color={theme.colors.primary[500]}
                  style={styles.storyIcon}
                />
                <Body size="medium" style={styles.storyText}>
                  {storyText}
                </Body>
              </View>
            </Card>
          )}
          
          <View style={styles.progressContainer}>
            <Body size="medium" style={styles.progressText}>
              {Object.keys(selectedAnswers).length} / {questionsData.length}
            </Body>
          </View>

          {/* Questions */}
          <View style={styles.questionsContainer}>
            {questionsData.map((question, qIndex) => (
              <Card
                key={question.id}
                variant="elevated"
                padding="large"
                style={styles.questionCard}
              >
                <View style={styles.questionHeader}>
                  <Body size="small" className="text-gray-500">
                    Question {qIndex + 1} of {questionsData.length}
                  </Body>
                  <Heading level="h4" style={{ color: theme.colors.text.primary, marginTop: theme.spacing[2] }}>
                    {question.question}
                  </Heading>
                </View>

                <View style={styles.optionsContainer}>
                  {question.options.map((option, optionIndex) => {
                    const status = getAnswerStatus(question.id, optionIndex);
                    return (
                      <TouchableOpacity
                        key={optionIndex}
                        onPress={() => handleAnswerSelect(question.id, optionIndex)}
                        disabled={showResults || isCompleted}
                        activeOpacity={0.7}
                        style={[
                          styles.optionButton,
                          status === 'selected' && styles.optionButtonSelected,
                          status === 'correct' && styles.optionButtonCorrect,
                          status === 'incorrect' && styles.optionButtonIncorrect,
                        ]}
                      >
                        <View style={styles.optionContent}>
                          <View
                            style={[
                              styles.optionIndicator,
                              status === 'selected' && styles.optionIndicatorSelected,
                              status === 'correct' && styles.optionIndicatorCorrect,
                              status === 'incorrect' && styles.optionIndicatorIncorrect,
                            ]}
                          >
                            <Body size="small" style={{ color: '#ffffff', fontWeight: 'bold' }}>
                              {String.fromCharCode(65 + optionIndex)}
                            </Body>
                          </View>
                          <Body
                            size="medium"
                            style={[
                              styles.optionText,
                              status === 'selected' && styles.optionTextSelected,
                              status === 'correct' && styles.optionTextCorrect,
                              status === 'incorrect' && styles.optionTextIncorrect,
                            ]}
                          >
                            {option}
                          </Body>
                          {status === 'correct' && (
                            <Ionicons
                              name="checkmark-circle"
                              size={24}
                              color={theme.colors.success[600]}
                            />
                          )}
                          {status === 'incorrect' && (
                            <Ionicons
                              name="close-circle"
                              size={24}
                              color={theme.colors.error[600]}
                            />
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </Card>
            ))}
          </View>

          {/* Submit Button */}
          {!isCompleted && (
            <View style={styles.buttonContainer}>
              <Button
                variant="primary"
                size="large"
                onPress={handleSubmit}
                fullWidth
                disabled={Object.keys(selectedAnswers).length < questionsData.length}
              >
                {showResults ? 'View Results' : 'Submit Answers'}
              </Button>
            </View>
          )}
        </GameSurface>

      </ScrollView>

      {/* Congratulations Modal */}
      <CongratulationsModal
        visible={showCongratsModal}
        score={finalScore}
        onClose={() => {
          setShowCongratsModal(false);
          onComplete(finalScore);
        }}
        title="Quiz Complete!"
        message={`You scored ${Object.keys(selectedAnswers).filter((qId) => {
          const question = questionsData.find((q) => q.id === qId);
          return question && selectedAnswers[qId] === question.correctAnswer;
        }).length} out of ${questionsData.length}!`}
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
  questionsContainer: {
    marginBottom: theme.spacing[4],
  },
  questionCard: {
    marginBottom: theme.spacing[4],
    backgroundColor: theme.colors.background.light,
  },
  questionHeader: {
    marginBottom: theme.spacing[4],
  },
  optionsContainer: {
    gap: theme.spacing[2],
  },
  optionButton: {
    borderWidth: 2,
    borderColor: theme.colors.gray[300],
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.background.light,
    padding: theme.spacing[3],
  },
  optionButtonSelected: {
    borderColor: theme.colors.primary[500],
    backgroundColor: theme.colors.primary[50],
  },
  optionButtonCorrect: {
    borderColor: theme.colors.success[500],
    backgroundColor: theme.colors.success[50],
  },
  optionButtonIncorrect: {
    borderColor: theme.colors.error[500],
    backgroundColor: theme.colors.error[50],
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.gray[400],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing[3],
  },
  optionIndicatorSelected: {
    backgroundColor: theme.colors.primary[600],
  },
  optionIndicatorCorrect: {
    backgroundColor: theme.colors.success[600],
  },
  optionIndicatorIncorrect: {
    backgroundColor: theme.colors.error[600],
  },
  optionText: {
    flex: 1,
    color: theme.colors.text.primary,
  },
  optionTextSelected: {
    color: theme.colors.primary[700],
    fontWeight: '600',
  },
  optionTextCorrect: {
    color: theme.colors.success[700],
    fontWeight: '600',
  },
  optionTextIncorrect: {
    color: theme.colors.error[700],
    fontWeight: '600',
  },
  buttonContainer: {
    marginTop: theme.spacing[4],
  },
  storyCard: {
    marginTop: theme.spacing[4],
    marginBottom: theme.spacing[2],
    backgroundColor: theme.colors.primary[50],
  },
  storyContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing[2],
  },
  storyIcon: {
    marginTop: theme.spacing[1],
  },
  storyText: {
    flex: 1,
    color: theme.colors.text.primary,
    lineHeight: theme.typography.lineHeight.relaxed,
  },
});

