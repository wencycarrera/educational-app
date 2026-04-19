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
import { Heading } from '../ui/Heading';
import { Body } from '../ui/Body';
import { Card } from '../ui/Card';
import { Button } from '../common/Button';
import { CongratulationsModal } from '../ui/CongratulationsModal';
import { GameSurface } from '../ui/GameSurface';
import { theme } from '../../config/theme';
import * as Haptics from 'expo-haptics';
import { LessonModule } from '../../services/lesson.service';
import { ASSET_IMAGE_MAP } from '../../data/sticker-assets';

interface PlaceValueEngineProps {
  module: LessonModule;
  onComplete: (score: number) => void;
}

const BLOCK_SIZE = 50;
const ROD_SIZE = 50; // Height for tens rod

export const PlaceValueEngine: React.FC<PlaceValueEngineProps> = ({
  module,
  onComplete,
}) => {
  const instruction = module.data.instruction || 'Build the number using tens and ones';
  
  // Parse place value configuration
  const targetNumber = (module.data.targetNumber as number) || 34;
  const targetTens = Math.floor(targetNumber / 10);
  const targetOnes = targetNumber % 10;
  const mode = (module.data.mode as 'build' | 'decompose' | 'regroup') || 'build';

  const [tensCount, setTensCount] = useState(0);
  const [onesCount, setOnesCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showFeedback, setShowFeedback] = useState<string | null>(null);
  const [showCongratsModal, setShowCongratsModal] = useState(false);

  const currentNumber = tensCount * 10 + onesCount;

  const handleAddTen = useCallback(() => {
    if (isCompleted) return;
    if (tensCount < 9) {
      setTensCount(tensCount + 1);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [tensCount, isCompleted]);

  const handleRemoveTen = useCallback(() => {
    if (isCompleted) return;
    if (tensCount > 0) {
      setTensCount(tensCount - 1);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [tensCount, isCompleted]);

  const handleAddOne = useCallback(() => {
    if (isCompleted) return;
    if (onesCount < 9) {
      setOnesCount(onesCount + 1);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [onesCount, isCompleted]);

  const handleRemoveOne = useCallback(() => {
    if (isCompleted) return;
    if (onesCount > 0) {
      setOnesCount(onesCount - 1);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [onesCount, isCompleted]);

  const handleRegroup = useCallback(() => {
    if (isCompleted) return;
    if (onesCount >= 10) {
      setOnesCount(onesCount - 10);
      setTensCount(tensCount + 1);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowFeedback('10 ones = 1 ten!');
      setTimeout(() => setShowFeedback(null), 2000);
    }
  }, [onesCount, tensCount, isCompleted]);

  const renderNumberAsset = (value: number, textStyle: any, imageStyle: any) => {
    const key = `number_${value}`;
    if (ASSET_IMAGE_MAP[key]) {
      return (
        <Image
          source={ASSET_IMAGE_MAP[key]}
          style={imageStyle}
          resizeMode="contain"
        />
      );
    }
    return <Text style={textStyle}>{value}</Text>;
  };

  const handleSubmit = useCallback(() => {
    if (currentNumber === targetNumber) {
      setIsCompleted(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowFeedback('Perfect!');
      setShowCongratsModal(true);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setShowFeedback(`Try again! The number is ${targetNumber}`);
      setTimeout(() => setShowFeedback(null), 2000);
    }
  }, [currentNumber, targetNumber, onComplete]);

  const renderTensBlock = (index: number) => (
    <View key={index} style={styles.tenBlock}>
      <View style={styles.tenBlockInner}>
        {renderNumberAsset(10, styles.tenBlockText, styles.numberImageSmall)}
      </View>
    </View>
  );

  const renderOneBlock = (index: number) => (
    <View key={index} style={styles.oneBlock}>
      <View style={styles.oneBlockInner}>
        {renderNumberAsset(1, styles.oneBlockText, styles.numberImageSmall)}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Body size="medium" style={styles.instruction}>
            {instruction}
          </Body>
          <View style={styles.progressContainer}>
            <Body size="medium" style={styles.progressText}>
              Target: {targetNumber}
            </Body>
          </View>
        </View>

        <GameSurface style={styles.gameCard} contentStyle={styles.gameArea}>
          {/* Place Value Chart */}
          <Card variant="elevated" padding="large" style={styles.chartCard}>
            <View style={styles.chartContainer}>
              {/* Tens Column */}
              <View style={styles.column}>
                <Body size="medium" style={{ color: theme.colors.primary[700], fontWeight: '600', marginBottom: theme.spacing[2] }}>
                  Tens ({tensCount})
                </Body>
                <View style={styles.blocksContainer}>
                  {Array.from({ length: tensCount }).map((_, i) => renderTensBlock(i))}
                </View>
              </View>

              {/* Ones Column */}
              <View style={styles.column}>
                <Body size="medium" style={{ color: theme.colors.primary[700], fontWeight: '600', marginBottom: theme.spacing[2] }}>
                  Ones ({onesCount})
                </Body>
                <View style={styles.blocksContainer}>
                  {Array.from({ length: onesCount }).map((_, i) => renderOneBlock(i))}
                </View>
              </View>
            </View>

            {/* Current Number Display */}
            <View style={styles.numberDisplay}>
              <View style={styles.numberDisplayRow}>
                {renderNumberAsset(currentNumber, styles.numberDisplayNumber, styles.numberImageLarge)}
                <Body size="large" style={styles.numberDisplayText}>=</Body>
                {renderNumberAsset(tensCount, styles.numberDisplayNumber, styles.numberImageMedium)}
                <Body size="large" style={styles.numberDisplayText}>tens +</Body>
                {renderNumberAsset(onesCount, styles.numberDisplayNumber, styles.numberImageMedium)}
                <Body size="large" style={styles.numberDisplayText}>ones</Body>
              </View>
            </View>
          </Card>

          {/* Controls */}
          <Card variant="elevated" padding="medium" style={styles.controlsCard}>
            <View style={styles.controlsRow}>
              <View style={styles.controlGroup}>
                <Body size="small" className="text-gray-600 mb-2">Tens</Body>
                <View style={styles.controlButtons}>
                  <TouchableOpacity
                    onPress={handleRemoveTen}
                    disabled={tensCount === 0 || isCompleted}
                    style={[styles.controlButton, tensCount === 0 && styles.controlButtonDisabled]}
                  >
                    <Ionicons name="remove" size={24} color={tensCount === 0 ? theme.colors.gray[400] : theme.colors.primary[600]} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleAddTen}
                    disabled={tensCount >= 9 || isCompleted}
                    style={[styles.controlButton, tensCount >= 9 && styles.controlButtonDisabled]}
                  >
                    <Ionicons name="add" size={24} color={tensCount >= 9 ? theme.colors.gray[400] : theme.colors.primary[600]} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.controlGroup}>
                <Body size="small" className="text-gray-600 mb-2">Ones</Body>
                <View style={styles.controlButtons}>
                  <TouchableOpacity
                    onPress={handleRemoveOne}
                    disabled={onesCount === 0 || isCompleted}
                    style={[styles.controlButton, onesCount === 0 && styles.controlButtonDisabled]}
                  >
                    <Ionicons name="remove" size={24} color={onesCount === 0 ? theme.colors.gray[400] : theme.colors.primary[600]} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleAddOne}
                    disabled={onesCount >= 9 || isCompleted}
                    style={[styles.controlButton, onesCount >= 9 && styles.controlButtonDisabled]}
                  >
                    <Ionicons name="add" size={24} color={onesCount >= 9 ? theme.colors.gray[400] : theme.colors.primary[600]} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Regroup Button */}
            {onesCount >= 10 && (
              <View style={styles.regroupContainer}>
                <Button
                  variant="secondary"
                  size="medium"
                  onPress={handleRegroup}
                  disabled={isCompleted}
                >
                  Regroup: 10 ones → 1 ten
                </Button>
              </View>
            )}
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

          {/* Submit Button */}
          {!isCompleted && (
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
        title="Perfect!"
        message={`${targetNumber} = ${targetTens} tens + ${targetOnes} ones`}
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
  chartCard: {
    marginBottom: theme.spacing[4],
    backgroundColor: theme.colors.background.light,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing[4],
  },
  column: {
    flex: 1,
    alignItems: 'center',
  },
  blocksContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    minHeight: 100,
    gap: theme.spacing[1],
  },
  tenBlock: {
    width: BLOCK_SIZE,
    height: ROD_SIZE,
    margin: theme.spacing[1],
  },
  tenBlockInner: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.primary[500],
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.primary[700],
  },
  tenBlockText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
  },
  oneBlock: {
    width: BLOCK_SIZE,
    height: BLOCK_SIZE,
    margin: theme.spacing[1],
  },
  oneBlockInner: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.primary[300],
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.primary[500],
  },
  oneBlockText: {
    color: theme.colors.primary[900],
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
  },
  numberDisplay: {
    marginTop: theme.spacing[4],
    padding: theme.spacing[3],
    backgroundColor: theme.colors.primary[50],
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  numberDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[2],
  },
  numberDisplayText: {
    color: theme.colors.text.primary,
    fontWeight: 'bold',
  },
  numberDisplayNumber: {
    color: theme.colors.text.primary,
    fontWeight: 'bold',
    fontSize: theme.typography.fontSize['2xl'],
  },
  numberImageSmall: {
    width: 28,
    height: 28,
  },
  numberImageMedium: {
    width: 40,
    height: 40,
  },
  numberImageLarge: {
    width: 56,
    height: 56,
  },
  controlsCard: {
    marginBottom: theme.spacing[4],
    backgroundColor: theme.colors.background.light,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  controlGroup: {
    alignItems: 'center',
  },
  controlButtons: {
    flexDirection: 'row',
    gap: theme.spacing[2],
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.primary[300],
  },
  controlButtonDisabled: {
    opacity: 0.3,
    backgroundColor: theme.colors.gray[100],
    borderColor: theme.colors.gray[300],
  },
  regroupContainer: {
    marginTop: theme.spacing[4],
    alignItems: 'center',
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

