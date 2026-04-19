import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../src/hooks/useAuth';
import { Heading } from '../../../src/components/ui/Heading';
import { Body } from '../../../src/components/ui/Body';
import { Card } from '../../../src/components/ui/Card';
import { ProgressBar } from '../../../src/components/ui/ProgressBar';
import { theme } from '../../../src/config/theme';
import { getLessonModuleById, getLessonModulesByTopic, LessonModule } from '../../../src/services/lesson.service';
import { saveStudentProgress, getStudentProgress } from '../../../src/services/progress.service';
import { DragDropEngine } from '../../../src/components/game-engines/DragDropEngine';
import { OrderingEngine } from '../../../src/components/game-engines/OrderingEngine';
import { QuizEngine } from '../../../src/components/game-engines/QuizEngine';
import { NumberLineEngine } from '../../../src/components/game-engines/NumberLineEngine';
import { PlaceValueEngine } from '../../../src/components/game-engines/PlaceValueEngine';
import { ComparisonEngine } from '../../../src/components/game-engines/ComparisonEngine';
import { VisualCountingEngine } from '../../../src/components/game-engines/VisualCountingEngine';
import { SequentialCountingEngine } from '../../../src/components/game-engines/SequentialCountingEngine';
import { OrdinalPositionEngine } from '../../../src/components/game-engines/OrdinalPositionEngine';
import { MatchingEngine } from '../../../src/components/game-engines/MatchingEngine';
import { WordProblemEngine } from '../../../src/components/game-engines/WordProblemEngine';
import { DemonstrationEngine } from '../../../src/components/game-engines/DemonstrationEngine';
import { LevelUpCelebration } from '../../../src/components/student/LevelUpCelebration';

export default function PlayScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ moduleId: string }>();
  const { userData, user } = useAuth();
  const moduleId = params.moduleId;

  const [module, setModule] = useState<LessonModule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [topicModules, setTopicModules] = useState<LessonModule[]>([]);
  const [subLessonModules, setSubLessonModules] = useState<LessonModule[]>([]);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpData, setLevelUpData] = useState<{ oldLevel: number; newLevel: number } | null>(null);

  const startTimeRef = useRef<number>(Date.now());
  const hasSavedProgressRef = useRef<boolean>(false);
  const studentProfile = userData && userData.role === 'student' ? userData.studentProfile : null;
  const joinedClassID = studentProfile?.joinedClassID;
  const studentID = user?.uid || '';

  useEffect(() => {
    if (moduleId) {
      loadModule();
    }
  }, [moduleId]);

  const loadModule = async () => {
    try {
      setLoading(true);
      setError(null);
      const loadedModule = await getLessonModuleById(moduleId);
      
      if (!loadedModule) {
        setError('Lesson module not found');
        return;
      }

      setModule(loadedModule);
      startTimeRef.current = Date.now();
      hasSavedProgressRef.current = false;

      // Load modules for progress calculation
      if (joinedClassID && loadedModule.topicCategory) {
        const modulesByTopic = await getLessonModulesByTopic(joinedClassID);
        const topicModulesList = modulesByTopic[loadedModule.topicCategory] || [];
        
        // Store all topic modules (for legacy fallback)
        setTopicModules(topicModulesList);
        
        // Filter modules by subLessonID if available, otherwise use all topic modules (legacy)
        let modulesForProgress: LessonModule[] = [];
        
        if (loadedModule.subLessonID) {
          // Filter to only include modules from the same sub-lesson
          modulesForProgress = topicModulesList.filter(
            (m) => m.subLessonID === loadedModule.subLessonID
          );
          
          // Sort by subLessonOrder (fallback to sequenceOrder)
          modulesForProgress.sort((a, b) => {
            if (a.subLessonOrder !== undefined && b.subLessonOrder !== undefined) {
              return a.subLessonOrder - b.subLessonOrder;
            }
            return (a.sequenceOrder || 0) - (b.sequenceOrder || 0);
          });
        } else {
          // Legacy: no subLessonID, use all topic modules sorted by sequenceOrder
          modulesForProgress = topicModulesList.sort((a, b) => (a.sequenceOrder || 0) - (b.sequenceOrder || 0));
        }
        
        setSubLessonModules(modulesForProgress);
        
        // Find current module index within the filtered modules
        const index = modulesForProgress.findIndex((m) => m.id === moduleId);
        setCurrentModuleIndex(index >= 0 ? index : 0);
      }
    } catch (err) {
      console.error('Error loading module:', err);
      setError('Failed to load lesson. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to navigate to next activity or back to lesson page
  const navigateToNextOrBack = () => {
    if (!module) {
      router.back();
      return;
    }

    // Determine which modules array to use (sub-lesson modules or topic modules for legacy)
    const modulesForNavigation = subLessonModules.length > 0 ? subLessonModules : topicModules;
    
    // Check if there's a next activity
    const nextIndex = currentModuleIndex + 1;
    const nextModule = modulesForNavigation[nextIndex];

    if (nextModule) {
      // Navigate to next activity
      console.log('🚀 [Play] Navigating to next activity:', nextModule.id);
      router.replace({
        pathname: '/(student)/lessons/play',
        params: { moduleId: nextModule.id },
      });
    } else {
      // Last activity in sub-lesson, navigate back to lesson page
      console.log('🚀 [Play] Last activity completed, navigating back to lesson page');
      router.replace({
        pathname: '/(student)/lessons/[id]',
        params: { id: module.topicCategory },
      });
    }
  };

  const handleComplete = async (score: number) => {
    if (!module || !joinedClassID || !studentID || hasSavedProgressRef.current) return;

    try {
      hasSavedProgressRef.current = true;
      
      // Calculate time spent in seconds
      const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);

      // Log before save
      console.log('💾 [Play] About to save progress:', {
        moduleID: module.id,
        studentID,
        classID: joinedClassID,
        score,
        timeSpent,
        isCompleted: true,
      });

      // Save progress - ensure isCompleted is always true when activity is completed
      const result = await saveStudentProgress({
        studentID,
        moduleID: module.id,
        classID: joinedClassID,
        score,
        timeSpent,
        isCompleted: true, // Always mark as completed when handleComplete is called
      });

      // Log after save
      console.log('✅ [Play] Progress saved successfully:', {
        progressId: result.progressId,
        starsEarned: result.starsEarned,
        leveledUp: result.leveledUp,
        oldLevel: result.oldLevel,
        newLevel: result.newLevel,
        moduleID: module.id,
      });

      // Check if student leveled up
      if (result.leveledUp && result.oldLevel !== undefined && result.newLevel !== undefined) {
        setLevelUpData({
          oldLevel: result.oldLevel,
          newLevel: result.newLevel,
        });
        setShowLevelUp(true);
        // Don't navigate yet - wait for user to close level-up celebration
        return;
      }

      // Small delay to ensure Firestore write is committed before navigation
      // This helps with eventual consistency issues
      console.log('⏳ [Play] Waiting 1000ms for Firestore consistency...');
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Navigation will happen after user closes the congratulations modal
      // The modal is shown by the game engine, and onComplete is called when modal closes
      // So we navigate to next activity or back to lesson page
      navigateToNextOrBack();
    } catch (err) {
      console.error('❌ [Play] Error saving progress:', err);
      // Still navigate back even if save fails
      router.back();
    }
  };

  const renderGameEngine = () => {
    if (!module) return null;

    switch (module.activityType) {
      case 'drag_drop':
        return <DragDropEngine module={module} onComplete={handleComplete} />;
      case 'ordering':
        return <OrderingEngine module={module} onComplete={handleComplete} />;
      case 'quiz':
        return <QuizEngine module={module} onComplete={handleComplete} />;
      case 'number_line':
        return <NumberLineEngine module={module} onComplete={handleComplete} />;
      case 'place_value':
        return <PlaceValueEngine module={module} onComplete={handleComplete} />;
      case 'comparison':
        return <ComparisonEngine module={module} onComplete={handleComplete} />;
      case 'visual_counting':
        return <VisualCountingEngine module={module} onComplete={handleComplete} />;
      case 'sequential_counting':
        return <SequentialCountingEngine module={module} onComplete={handleComplete} />;
      case 'ordinal_position':
        return <OrdinalPositionEngine module={module} onComplete={handleComplete} />;
      case 'matching':
        return <MatchingEngine module={module} onComplete={handleComplete} />;
      case 'word_problem':
        return <WordProblemEngine module={module} onComplete={handleComplete} />;
      case 'demonstration':
        return <DemonstrationEngine module={module} onComplete={handleComplete} />;
      default:
        return (
          <View style={styles.errorContainer}>
            <Body size="medium" style={{ color: theme.colors.error[600] }}>
              Unknown activity type: {module.activityType}
            </Body>
          </View>
        );
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-primary-50" edges={['top']}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary[500]} />
          <Body size="medium" className="text-gray-600 mt-4">
            Loading activity...
          </Body>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !module) {
    return (
      <SafeAreaView className="flex-1 bg-primary-50" edges={['top']}>
        <View style={styles.centerContainer}>
          <Card variant="outlined" padding="large">
            <View style={styles.errorContent}>
              <Ionicons
                name="alert-circle-outline"
                size={48}
                color={theme.colors.error[500]}
                style={{ marginBottom: theme.spacing[3] }}
              />
              <Heading level="h4" className="text-center mb-2" style={{ color: theme.colors.text.primary }}>
                {error || 'Module Not Found'}
              </Heading>
              <Body size="medium" className="text-center text-gray-600 mb-4">
                {error || 'The activity you\'re looking for doesn\'t exist.'}
              </Body>
              <View style={styles.buttonContainer}>
                <Body
                  size="medium"
                  style={{ color: theme.colors.primary[600], fontWeight: '600' }}
                  onPress={() => router.back()}
                >
                  Go Back
                </Body>
              </View>
            </View>
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  if (!joinedClassID) {
    return (
      <SafeAreaView className="flex-1 bg-primary-50" edges={['top']}>
        <View style={styles.centerContainer}>
          <Card variant="outlined" padding="large">
            <View style={styles.errorContent}>
              <Text style={styles.emoji}>📚</Text>
              <Heading level="h4" className="text-center mb-2" style={{ color: theme.colors.text.primary }}>
                No Class Joined
              </Heading>
              <Body size="medium" className="text-center text-gray-600 mb-4">
                Join a class to access activities.
              </Body>
              <View style={styles.buttonContainer}>
                <Body
                  size="medium"
                  style={{ color: theme.colors.primary[600], fontWeight: '600' }}
                  onPress={() => router.push('/(student)/classroom/join')}
                >
                  Join a Class
                </Body>
              </View>
            </View>
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  // Calculate progress based on sub-lesson modules (or topic modules for legacy)
  const modulesForProgress = subLessonModules.length > 0 ? subLessonModules : topicModules;
  const totalModules = modulesForProgress.length;
  const progress = totalModules > 0 ? (currentModuleIndex + 1) / totalModules : 0;

  return (
    <SafeAreaView className="flex-1 bg-primary-50" edges={['top']}>
      {/* Progress Bar - Top-most position */}
      {totalModules > 0 && (
        <View style={styles.topProgressContainer}>
          <ProgressBar
            progress={progress}
            height={10}
            variant="primary"
            style={styles.progressBar}
          />
        </View>
      )}
      
      {/* Header */}
      <View className="px-6 pt-6 pb-4">
        <View className="flex-row items-center justify-between mb-6">
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: theme.colors.background.light, marginRight: theme.spacing[4] }}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={theme.colors.gray[700]}
            />
          </TouchableOpacity>
          <View className="flex-1 items-center">
            <Heading level="h3" style={{ color: theme.colors.primary[700] }}>
              {module.title}
            </Heading>
          </View>
          <View className="w-10" />
        </View>
      </View>
      
      {/* Game Container */}
      <View style={styles.gameContainer}>
        {renderGameEngine()}
      </View>

      {/* Level Up Celebration Modal */}
      {levelUpData && (
        <LevelUpCelebration
          visible={showLevelUp}
          oldLevel={levelUpData.oldLevel}
          newLevel={levelUpData.newLevel}
          onClose={() => {
            setShowLevelUp(false);
            setLevelUpData(null);
            // Navigate to next activity or back to lesson page after closing level-up celebration
            setTimeout(() => {
              navigateToNextOrBack();
            }, 500);
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing[6],
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing[6],
  },
  errorContent: {
    alignItems: 'center',
  },
  emoji: {
    fontSize: 64,
    marginBottom: theme.spacing[4],
  },
  buttonContainer: {
    marginTop: theme.spacing[4],
  },
  topProgressContainer: {
    paddingHorizontal: theme.spacing[4],
    paddingTop: theme.spacing[2],
    paddingBottom: theme.spacing[2],
    backgroundColor: theme.colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[200],
  },
  progressBar: {
    width: '100%',
  },
  gameContainer: {
    flex: 1,
  },
});

