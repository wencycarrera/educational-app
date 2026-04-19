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
import { loadAssetImage, getAssetEmoji } from '../../utils/assetLoader';
import { Image } from 'expo-image';
import { ASSET_IMAGE_MAP } from '../../data/sticker-assets';

interface ComparisonEngineProps {
  module: LessonModule;
  onComplete: (score: number) => void;
}

export const ComparisonEngine: React.FC<ComparisonEngineProps> = ({
  module,
  onComplete,
}) => {
  const instruction = module.data.instruction || 'Choose the correct comparison symbol';
  
  // Parse comparison configuration
  const leftValue = (module.data.leftValue as number) || 5;
  const rightValue = (module.data.rightValue as number) || 3;
  const correctSymbol = leftValue > rightValue ? '>' : leftValue < rightValue ? '<' : '=';
  const showObjects = (module.data.showObjects as boolean) || false;
  
  // Support multiple assets: use assetIDs if available, otherwise fall back to assetID
  const assetIDs = (module.data.assetIDs as string[]) || [];
  const primaryAssetID = (module.data.assetID as string) || 'fruit_apple_red';
  const leftAssetID = assetIDs[0] || primaryAssetID;
  const rightAssetID = assetIDs[1] || primaryAssetID; // Use second asset if available, otherwise same as left

  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showFeedback, setShowFeedback] = useState<string | null>(null);
  const [showCongratsModal, setShowCongratsModal] = useState(false);

  const handleSymbolSelect = useCallback((symbol: string) => {
    if (isCompleted) return;

    setSelectedSymbol(symbol);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (symbol === correctSymbol) {
      setIsCompleted(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowFeedback('Correct!');
      setShowCongratsModal(true);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setShowFeedback('Try again!');
      setTimeout(() => setShowFeedback(null), 1500);
    }
  }, [correctSymbol, isCompleted, onComplete]);

  const renderNumberAsset = (value: number, textStyle: any, imageStyle: any) => {
    const source = ASSET_IMAGE_MAP[`number_${value}`];
    if (source) {
      return (
        <Image
          source={source}
          style={imageStyle}
          contentFit="contain"
        />
      );
    }
    return <Text style={textStyle}>{value}</Text>;
  };

  const renderSymbolAsset = (symbol: string) => {
    const symbolId: Record<string, string> = {
      '<': 'symbol_less_than',
      '=': 'symbol_equals',
      '>': 'symbol_greater_than',
    };
    const source = ASSET_IMAGE_MAP[symbolId[symbol]];
    if (source) {
      return (
        <Image
          source={source}
          style={styles.symbolImage}
          contentFit="contain"
        />
      );
    }
    return <Text style={styles.symbolText}>{symbol}</Text>;
  };

  const renderObjects = (count: number, side: 'left' | 'right') => {
    const assetID = side === 'left' ? leftAssetID : rightAssetID;
    const assetImage = loadAssetImage(assetID);
    const emoji = getAssetEmoji(assetID);

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
        <View style={styles.header}>
          <Body size="medium" style={styles.instruction}>
            {instruction}
          </Body>
        </View>

        {/* Comparison Display */}
        <GameSurface style={styles.gameCard} contentStyle={styles.gameArea}>
          <View style={styles.comparisonContainer}>
            {/* Left Side */}
            <View style={styles.sideContainer}>
              {showObjects ? (
                renderObjects(leftValue, 'left')
              ) : (
                renderNumberAsset(leftValue, styles.numberDisplay, styles.numberImageLarge)
              )}
              <View style={styles.numberLabel}>
                {renderNumberAsset(leftValue, styles.numberLabelText, styles.numberImageSmall)}
              </View>
            </View>

            {/* Symbol Selection Area */}
            <View style={styles.symbolContainer}>
              <View style={styles.symbolOptions}>
                {['<', '=', '>'].map((symbol) => (
                  <TouchableOpacity
                    key={symbol}
                    onPress={() => handleSymbolSelect(symbol)}
                    disabled={isCompleted}
                    style={[
                      styles.symbolButton,
                      selectedSymbol === symbol && styles.symbolButtonSelected,
                      selectedSymbol === symbol && symbol === correctSymbol && styles.symbolButtonCorrect,
                      selectedSymbol === symbol && symbol !== correctSymbol && styles.symbolButtonIncorrect,
                    ]}
                    activeOpacity={0.7}
                  >
                    <View style={styles.symbolContent}>
                      {renderSymbolAsset(symbol)}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Right Side */}
            <View style={styles.sideContainer}>
              {showObjects ? (
                renderObjects(rightValue, 'right')
              ) : (
                renderNumberAsset(rightValue, styles.numberDisplay, styles.numberImageLarge)
              )}
              <View style={styles.numberLabel}>
                {renderNumberAsset(rightValue, styles.numberLabelText, styles.numberImageSmall)}
              </View>
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
        title="Great Job!"
        message={`${leftValue} ${correctSymbol} ${rightValue}`}
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
  comparisonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sideContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberDisplay: {
    fontSize: theme.typography.fontSize['4xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary[700],
  },
  numberLabel: {
    marginTop: theme.spacing[2],
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberLabelText: {
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  numberImageLarge: {
    width: 64,
    height: 64,
  },
  numberImageSmall: {
    width: 36,
    height: 36,
  },
  objectsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: theme.spacing[2],
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
  symbolContainer: {
    paddingHorizontal: theme.spacing[4],
    alignItems: 'center',
  },
  symbolOptions: {
    flexDirection: 'row',
    gap: theme.spacing[2],
  },
  symbolButton: {
    width: 60,
    height: 60,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.background.light,
    borderWidth: 3,
    borderColor: theme.colors.gray[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbolButtonSelected: {
    borderColor: theme.colors.primary[500],
    backgroundColor: theme.colors.primary[50],
  },
  symbolButtonCorrect: {
    borderColor: theme.colors.success[500],
    backgroundColor: theme.colors.success[50],
  },
  symbolButtonIncorrect: {
    borderColor: theme.colors.error[500],
    backgroundColor: theme.colors.error[50],
  },
  symbolContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbolText: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  symbolTextSelected: {
    color: theme.colors.primary[700],
  },
  symbolImage: {
    width: 44,
    height: 44,
  },
  feedbackContainer: {
    marginTop: theme.spacing[2],
    marginBottom: theme.spacing[2],
    alignItems: 'center',
  },
});

