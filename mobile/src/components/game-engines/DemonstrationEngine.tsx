import React, { useState, useCallback, useRef } from 'react';
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
import LottieView from 'lottie-react-native';

interface DemonstrationEngineProps {
  module: LessonModule;
  onComplete: (score: number) => void;
}

export const DemonstrationEngine: React.FC<DemonstrationEngineProps> = ({
  module,
  onComplete,
}) => {
  const instruction = module.data.instruction || 'Watch and learn from this demonstration';
  
  const demonstrationType = (module.data.demonstrationType as string) || 'animation';
  const lottieAsset = (module.data.lottieAsset as string) || '';
  
  const [hasViewed, setHasViewed] = useState(false);
  const [showCongratsModal, setShowCongratsModal] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [lottieError, setLottieError] = useState(false);
  const lottieRef = useRef<LottieView>(null);

  const handleContinue = useCallback(() => {
    if (!hasViewed) {
      setHasViewed(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      setShowCongratsModal(true);
    }
  }, [hasViewed]);

  const handlePlayLottie = () => {
    setIsPlaying(true);
    setLottieError(false);
    requestAnimationFrame(() => {
      lottieRef.current?.reset?.();
      lottieRef.current?.play?.();
    });
  };

  const handleLottieFinish = () => {
    setHasViewed(true);
  };

  const renderDemonstration = () => {
    // Lottie override if provided
    if (lottieAsset) {
      return (
        <View style={styles.lottieContainer}>
          {!isPlaying && (
            <TouchableOpacity
              onPress={handlePlayLottie}
              activeOpacity={0.8}
              style={styles.playOverlay}
            >
              <Ionicons name="play-circle" size={72} color={theme.colors.primary[500]} />
              <Body size="small" style={styles.playHint}>
                Tap to play
              </Body>
            </TouchableOpacity>
          )}
          <LottieView
            ref={lottieRef}
            source={typeof lottieAsset === 'string' ? { uri: lottieAsset } : lottieAsset}
            autoPlay={false}
            loop={false}
            style={styles.lottieView}
            onAnimationFinish={handleLottieFinish}
            onError={() => setLottieError(true)}
          />
          {lottieError && (
            <Body size="small" style={styles.errorText}>
              Unable to load animation. Please try again.
            </Body>
          )}
          {isPlaying && (
            <TouchableOpacity
              onPress={handlePlayLottie}
              style={styles.replayButton}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh" size={20} color="#fff" />
              <Body size="small" style={styles.replayText}>
                Replay
              </Body>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    switch (demonstrationType) {
      case 'animation':
        return (
          <View style={styles.animationContainer}>
            <Ionicons
              name="play-circle"
              size={80}
              color={theme.colors.primary[500]}
            />
            <Body size="medium" style={styles.demoText}>
              Animation demonstration will play here
            </Body>
            <Body size="small" style={styles.demoSubtext}>
              (Animation implementation can be added later)
            </Body>
          </View>
        );
      
      case 'visual':
        return (
          <View style={styles.visualContainer}>
            <Ionicons
              name="image"
              size={80}
              color={theme.colors.primary[500]}
            />
            <Body size="medium" style={styles.demoText}>
              Visual demonstration content
            </Body>
            <Body size="small" style={styles.demoSubtext}>
              (Visual content can be customized per activity)
            </Body>
          </View>
        );
      
      case 'step_by_step':
        return (
          <View style={styles.stepContainer}>
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Body size="medium" style={styles.stepNumberText}>1</Body>
              </View>
              <Body size="medium" style={styles.stepText}>
                First step of the demonstration
              </Body>
            </View>
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Body size="medium" style={styles.stepNumberText}>2</Body>
              </View>
              <Body size="medium" style={styles.stepText}>
                Second step of the demonstration
              </Body>
            </View>
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Body size="medium" style={styles.stepNumberText}>3</Body>
              </View>
              <Body size="medium" style={styles.stepText}>
                Third step of the demonstration
              </Body>
            </View>
          </View>
        );
      
      default:
        return (
          <View style={styles.defaultContainer}>
            <Body size="medium" style={styles.demoText}>
              Demonstration content
            </Body>
          </View>
        );
    }
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
          {/* Demonstration Card */}
          <Card variant="elevated" padding="large" style={styles.demoCard}>
            <View style={styles.demoContent}>
              {renderDemonstration()}
            </View>
          </Card>

          {/* Info Card */}
          <Card variant="outlined" padding="medium" style={styles.infoCard}>
            <View style={styles.infoContainer}>
              <Ionicons
                name="information-circle-outline"
                size={24}
                color={theme.colors.info[500]}
              />
              <Body size="small" style={styles.infoText}>
                This is a demonstration activity. Watch carefully and tap "Continue" when you're ready.
              </Body>
            </View>
          </Card>

          {/* Continue Button */}
          <View style={styles.buttonContainer}>
            <Button
              variant="primary"
              size="large"
              onPress={handleContinue}
              fullWidth
            >
              {hasViewed ? 'I Understand' : 'Continue'}
            </Button>
          </View>
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
        message="You've completed the demonstration. Keep learning!"
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
  demoCard: {
    marginBottom: theme.spacing[4],
    backgroundColor: theme.colors.background.light,
    minHeight: 300,
  },
  lottieContainer: {
    width: '100%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottieView: {
    width: '100%',
    height: '100%',
  },
  playOverlay: {
    position: 'absolute',
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing[4],
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: theme.borderRadius.xl,
  },
  playHint: {
    marginTop: theme.spacing[2],
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  replayButton: {
    position: 'absolute',
    bottom: theme.spacing[3],
    right: theme.spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[2],
    backgroundColor: theme.colors.primary[600],
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
    borderRadius: theme.borderRadius.lg,
  },
  replayText: {
    color: '#fff',
    fontWeight: '600',
  },
  errorText: {
    color: theme.colors.error[600],
    marginTop: theme.spacing[2],
    textAlign: 'center',
  },
  demoContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  animationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing[6],
  },
  visualContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing[6],
  },
  stepContainer: {
    width: '100%',
    gap: theme.spacing[4],
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing[3],
    backgroundColor: theme.colors.primary[50],
    borderRadius: theme.borderRadius.lg,
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing[3],
  },
  stepNumberText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  stepText: {
    flex: 1,
    color: theme.colors.text.primary,
  },
  defaultContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing[6],
  },
  demoText: {
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginTop: theme.spacing[3],
  },
  demoSubtext: {
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing[2],
    fontStyle: 'italic',
  },
  infoCard: {
    marginBottom: theme.spacing[4],
    backgroundColor: theme.colors.info[50],
    borderColor: theme.colors.info[200],
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing[2],
  },
  infoText: {
    flex: 1,
    color: theme.colors.text.secondary,
  },
  buttonContainer: {
    marginTop: theme.spacing[4],
  },
});

