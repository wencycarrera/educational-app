import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../../src/hooks/useAuth';
import { Heading } from '../../../../src/components/ui/Heading';
import { Body } from '../../../../src/components/ui/Body';
import { Card } from '../../../../src/components/ui/Card';
import { FIXED_CURRICULUM, LessonTopic } from '../../../../src/data/curriculum-skeleton';
import { getLessonModulesByTopic, LessonModule, getModulesBySubLesson, isLessonUnlocked } from '../../../../src/services/lesson.service';
import { getStudentProgress, StudentProgress } from '../../../../src/services/progress.service';
import { getSubLessonById, getSubLessonsByTopic, SubLesson } from '../../../../src/services/sub-lesson.service';
import { hasContentBeenViewed } from '../../../../src/services/content-view.service';
import { theme } from '../../../../src/config/theme';

export default function SubLessonDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; topicId?: string }>();
  const { userData, user, loading: authLoading } = useAuth();
  const subLessonId = params.id;
  const topicIdParam = params.topicId;

  const [subLesson, setSubLesson] = useState<SubLesson | null>(null);
  const [topic, setTopic] = useState<LessonTopic | null>(null);
  const [modules, setModules] = useState<LessonModule[]>([]);
  const [allSubLessons, setAllSubLessons] = useState<SubLesson[]>([]);
  const [allModulesBySubLesson, setAllModulesBySubLesson] = useState<Record<string, LessonModule[]>>({});
  const [progress, setProgress] = useState<StudentProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contentViewed, setContentViewed] = useState(false);
  const [isLegacy, setIsLegacy] = useState(false);
  const [isParentLessonLocked, setIsParentLessonLocked] = useState(false);

  // Get user data
  const studentProfile = userData && userData.role === 'student' ? userData.studentProfile : null;
  const joinedClassID = studentProfile?.joinedClassID;
  const studentID = user?.uid || '';

  // Check if this is a legacy modules view
  useEffect(() => {
    if (subLessonId === '__legacy__') {
      setIsLegacy(true);
    }
  }, [subLessonId]);

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!joinedClassID) {
      setLoading(false);
      return;
    }

    try {
      setError(null);

      if (isLegacy) {
        // Handle legacy modules - get from specific topic if provided
        const modulesByTopic = await getLessonModulesByTopic(joinedClassID);
        
        let legacyModules: LessonModule[] = [];
        if (topicIdParam) {
          // Get legacy modules for specific topic
          const topicModules = modulesByTopic[topicIdParam] || [];
          legacyModules = topicModules.filter((module) => !module.subLessonID);
          
          // Find topic
          const foundTopic = FIXED_CURRICULUM.find((t) => t.id === topicIdParam);
          if (foundTopic) {
            setTopic(foundTopic);
          }
        } else {
          // Fallback: get all legacy modules across all topics
          Object.values(modulesByTopic).forEach((topicModules) => {
            topicModules.forEach((module) => {
              if (!module.subLessonID) {
                legacyModules.push(module);
              }
            });
          });

          // Find topic from first module if available
          if (legacyModules.length > 0) {
            const firstModule = legacyModules[0];
            const foundTopic = FIXED_CURRICULUM.find((t) => t.id === firstModule.topicCategory);
            if (foundTopic) {
              setTopic(foundTopic);
            }
          }
        }

        // Sort by sequenceOrder
        legacyModules.sort((a, b) => (a.sequenceOrder || 0) - (b.sequenceOrder || 0));
        setModules(legacyModules);
      } else {
        // Fetch sub-lesson
        const fetchedSubLesson = await getSubLessonById(subLessonId);
        if (!fetchedSubLesson) {
          setError('Sub-lesson not found');
          setLoading(false);
          return;
        }
        setSubLesson(fetchedSubLesson);

        // Find topic
        const foundTopic = FIXED_CURRICULUM.find((t) => t.id === fetchedSubLesson.topicCategory);
        if (foundTopic) {
          setTopic(foundTopic);
        }

        // Fetch all sub-lessons for this topic to check locking
        const fetchedSubLessons = await getSubLessonsByTopic(joinedClassID, fetchedSubLesson.topicCategory);
        setAllSubLessons(fetchedSubLessons);

        // Fetch all modules for this topic to check previous sub-lesson completion
        const modulesByTopic = await getLessonModulesByTopic(joinedClassID);
        const topicModules = modulesByTopic[fetchedSubLesson.topicCategory] || [];
        
        // Group modules by sub-lesson
        const grouped: Record<string, LessonModule[]> = {};
        topicModules.forEach((module) => {
          if (module.subLessonID) {
            if (!grouped[module.subLessonID]) {
              grouped[module.subLessonID] = [];
            }
            grouped[module.subLessonID].push(module);
          }
        });

        // Sort modules within each sub-lesson
        Object.keys(grouped).forEach((subLessonID) => {
          grouped[subLessonID].sort((a, b) => {
            if (a.subLessonOrder !== undefined && b.subLessonOrder !== undefined) {
              return a.subLessonOrder - b.subLessonOrder;
            }
            return (a.sequenceOrder || 0) - (b.sequenceOrder || 0);
          });
        });

        setAllModulesBySubLesson(grouped);

        // Fetch modules for this sub-lesson
        const fetchedModules = grouped[subLessonId] || [];
        setModules(fetchedModules);

        // Check if content has been viewed
        if (studentID) {
          const viewed = await hasContentBeenViewed(studentID, subLessonId);
          setContentViewed(viewed);
        }
      }

      // Fetch student progress
      const studentProgress = await getStudentProgress(studentID, joinedClassID);
      setProgress(studentProgress);

      // Check if parent lesson is unlocked (if not legacy)
      if (!isLegacy && subLesson) {
        const parentLessonUnlocked = await isLessonUnlocked(
          subLesson.topicCategory,
          studentID,
          joinedClassID,
          studentProgress,
          FIXED_CURRICULUM
        );
        setIsParentLessonLocked(!parentLessonUnlocked);
      }
    } catch (err) {
      console.error('❌ [SubLessonDetail] Error fetching data:', err);
      setError('Failed to load sub-lesson. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [joinedClassID, subLessonId, studentID, isLegacy]);

  useEffect(() => {
    if (!authLoading) {
      fetchData();
    }
  }, [authLoading, fetchData]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (!authLoading) {
        fetchData();
      }
    }, [authLoading, fetchData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  // Helper functions
  const isModuleCompleted = (moduleId: string): boolean => {
    const moduleProgressRecords = progress.filter((p) => p.moduleID === moduleId);
    if (moduleProgressRecords.length === 0) return false;
    
    const sortedRecords = moduleProgressRecords.sort((a, b) => {
      const aTime = a.lastAttemptAt?.toMillis?.() || a.lastAttemptAt || 0;
      const bTime = b.lastAttemptAt?.toMillis?.() || b.lastAttemptAt || 0;
      return bTime - aTime;
    });
    
    return sortedRecords[0]?.status === 'completed';
  };

  const getModuleProgress = (moduleId: string): StudentProgress | undefined => {
    const moduleProgressRecords = progress.filter((p) => p.moduleID === moduleId);
    if (moduleProgressRecords.length === 0) return undefined;
    
    const sortedRecords = moduleProgressRecords.sort((a, b) => {
      const aTime = a.lastAttemptAt?.toMillis?.() || a.lastAttemptAt || 0;
      const bTime = b.lastAttemptAt?.toMillis?.() || b.lastAttemptAt || 0;
      return bTime - aTime;
    });
    
    return sortedRecords[0];
  };

  // Check if sub-lesson is unlocked
  const isSubLessonUnlocked = (): boolean => {
    if (isLegacy || !subLesson) return true;

    const subLessonIndex = allSubLessons.findIndex((sl) => sl.id === subLesson.id);
    if (subLessonIndex === 0) return true;

    const previousSubLesson = allSubLessons[subLessonIndex - 1];
    if (!previousSubLesson) return true;

    // Get modules for previous sub-lesson
    const previousModules = allModulesBySubLesson[previousSubLesson.id] || [];
    if (previousModules.length === 0) return true; // No modules means it's considered complete

    // All modules in previous sub-lesson must be completed
    return previousModules.every((m) => isModuleCompleted(m.id));
  };

  // Check if module is unlocked
  const isModuleUnlocked = (module: LessonModule, moduleIndex: number): boolean => {
    if (isLegacy) {
      // For legacy modules, first is always unlocked
      if (moduleIndex === 0) return true;
      // Previous module must be completed
      const previousModule = modules[moduleIndex - 1];
      return previousModule ? isModuleCompleted(previousModule.id) : true;
    }

    // Check if sub-lesson is unlocked first
    if (!isSubLessonUnlocked()) return false;

    // First module is unlocked if sub-lesson is unlocked
    if (moduleIndex === 0) return true;

    // Previous module must be completed
    const previousModule = modules[moduleIndex - 1];
    return previousModule ? isModuleCompleted(previousModule.id) : true;
  };

  const getActivityTypeIcon = (activityType: string): string => {
    switch (activityType) {
      case 'drag_drop':
        return 'hand-left-outline';
      case 'ordering':
        return 'swap-vertical-outline';
      case 'quiz':
        return 'help-circle-outline';
      case 'number_line':
        return 'git-branch-outline';
      case 'place_value':
        return 'cube-outline';
      case 'comparison':
        return 'swap-horizontal-outline';
      case 'visual_counting':
        return 'add-circle-outline';
      case 'sequential_counting':
        return 'repeat-outline';
      case 'ordinal_position':
        return 'list-number-outline';
      case 'matching':
        return 'git-merge-outline';
      case 'word_problem':
        return 'book-outline';
      case 'demonstration':
        return 'eye-outline';
      default:
        return 'play-circle-outline';
    }
  };

  const getActivityTypeLabel = (activityType: string): string => {
    switch (activityType) {
      case 'drag_drop':
        return 'Drag & Drop';
      case 'ordering':
        return 'Ordering';
      case 'quiz':
        return 'Quiz';
      case 'number_line':
        return 'Number Line';
      case 'place_value':
        return 'Place Value';
      case 'comparison':
        return 'Comparison';
      case 'visual_counting':
        return 'Visual Counting';
      case 'sequential_counting':
        return 'Sequential Counting';
      case 'ordinal_position':
        return 'Ordinal Position';
      case 'matching':
        return 'Matching';
      case 'word_problem':
        return 'Word Problem';
      case 'demonstration':
        return 'Demonstration';
      default:
        return 'Activity';
    }
  };

  const handleModulePress = async (module: LessonModule, isLocked: boolean, isFirstInSubLesson: boolean = false) => {
    if (isLocked) return;

    // If this is the first activity and content hasn't been viewed, show content first
    if (isFirstInSubLesson && !isLegacy && subLesson && studentID) {
      const hasViewed = await hasContentBeenViewed(studentID, subLesson.id);
      if (!hasViewed) {
        router.push({
          pathname: '/(student)/lessons/content',
          params: {
            subLessonID: subLesson.id,
            moduleID: module.id,
          },
        });
        return;
      }
    }
    
    // Navigate to play screen
    router.push({
      pathname: '/(student)/lessons/play',
      params: { moduleId: module.id },
    });
  };

  const handleViewContent = () => {
    if (!subLesson) return;
    // Get the first module ID to navigate to after viewing content
    const firstModule = modules.length > 0 ? modules[0] : null;
    // Navigate to content screen
    router.push({
      pathname: '/(student)/lessons/content',
      params: {
        subLessonID: subLesson.id,
        moduleID: firstModule?.id || '',
      },
    });
  };

  // Loading state
  if (authLoading || loading) {
    return (
      <View className="flex-1 justify-center items-center bg-primary-50">
        <ActivityIndicator size="large" color={theme.colors.primary[500]} />
        <Body size="small" className="text-gray-500 mt-4">
          Loading sub-lesson...
        </Body>
      </View>
    );
  }

  // Error state
  if (error || (!isLegacy && !subLesson) || !topic) {
    return (
      <SafeAreaView className="flex-1 bg-primary-50" edges={['top']}>
        <View className="flex-1 justify-center items-center px-6">
          <Card variant="outlined" padding="large">
            <View className="items-center">
              <Ionicons
                name="alert-circle-outline"
                size={48}
                color={theme.colors.error[500]}
                style={{ marginBottom: theme.spacing[3] }}
              />
              <Heading level="h4" className="text-center mb-2" style={{ color: theme.colors.text.primary }}>
                {error || 'Sub-lesson Not Found'}
              </Heading>
              <Body size="medium" className="text-center text-gray-600 mb-4">
                {error || 'The sub-lesson you\'re looking for doesn\'t exist.'}
              </Body>
              <TouchableOpacity
                onPress={() => router.back()}
                activeOpacity={0.7}
                className="px-6 py-3 rounded-full"
                style={{ backgroundColor: theme.colors.primary[500] }}
              >
                <Body size="medium" style={{ color: '#ffffff', fontWeight: '600' }}>
                  Go Back
                </Body>
              </TouchableOpacity>
            </View>
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  // No class joined
  if (!joinedClassID) {
    return (
      <SafeAreaView className="flex-1 bg-primary-50" edges={['top']}>
        <View className="flex-1 justify-center items-center px-6">
          <Card variant="outlined" padding="large">
            <View className="items-center">
              <Text className="text-6xl mb-4">📚</Text>
              <Heading level="h4" className="text-center mb-2" style={{ color: theme.colors.text.primary }}>
                No Class Joined
              </Heading>
              <Body size="medium" className="text-center text-gray-600 mb-4">
                Join a class to access lessons.
              </Body>
              <TouchableOpacity
                onPress={() => router.push('/(student)/classroom/join')}
                activeOpacity={0.7}
                className="px-6 py-3 rounded-full"
                style={{ backgroundColor: theme.colors.primary[500] }}
              >
                <Body size="medium" style={{ color: '#ffffff', fontWeight: '600' }}>
                  Join a Class
                </Body>
              </TouchableOpacity>
            </View>
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  const subLessonUnlocked = isSubLessonUnlocked() && !isParentLessonLocked;
  const completedCount = modules.filter((m) => isModuleCompleted(m.id)).length;
  const totalCount = modules.length;

  return (
    <SafeAreaView className="flex-1 bg-primary-50" edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary[500]}
            colors={[theme.colors.primary[500]]}
          />
        }
      >
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
                {isLegacy ? 'Activities' : subLesson?.title || 'Sub-lesson'}
              </Heading>
            </View>
            <View className="w-10" />
          </View>

          {/* Sub-Lesson Info Card */}
          {!isLegacy && subLesson && (
            <Card
              variant="elevated"
              padding="large"
              style={[
                styles.subLessonCard,
                { backgroundColor: topic.color },
              ]}
            >
              <View className="flex-row items-center mb-4">
                <View
                  className="w-16 h-16 rounded-full items-center justify-center"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.3)' }}
                >
                  <Ionicons name="book" size={32} color="#ffffff" />
                </View>
                <View className="flex-1 ml-4">
                  <Heading
                    level="h4"
                    style={{
                      color: '#ffffff',
                      marginBottom: theme.spacing[1],
                    }}
                  >
                    {subLesson.title}
                  </Heading>
                  <Body size="small" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                    {topic.title}
                  </Body>
                </View>
                <TouchableOpacity
                  onPress={handleViewContent}
                  activeOpacity={0.7}
                  className="w-16 h-16 rounded-full items-center justify-center ml-4"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.3)' }}
                >
                  <Ionicons name="play-circle" size={32} color="#ffffff" />
                </TouchableOpacity>
              </View>

              {/* Progress Bar */}
              {totalCount > 0 && (
                <View className="mt-4 pt-4 border-t" style={{ borderTopColor: 'rgba(255, 255, 255, 0.3)' }}>
                  <View className="flex-row items-center justify-between mb-2">
                    <Body size="small" style={{ color: '#ffffff', fontWeight: '600' }}>
                      Progress
                    </Body>
                    <Body size="small" style={{ color: '#ffffff' }}>
                      {completedCount} / {totalCount}
                    </Body>
                  </View>
                  <View
                    className="h-2 rounded-full"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.3)', overflow: 'hidden' }}
                  >
                    <View
                      className="h-full rounded-full"
                      style={{
                        width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%`,
                        backgroundColor: '#ffffff',
                      }}
                    />
                  </View>
                </View>
              )}

              {/* Content Viewing Prompt */}
              {!contentViewed && (
                <View className="mt-4 pt-4 border-t" style={{ borderTopColor: 'rgba(255, 255, 255, 0.3)' }}>
                  <TouchableOpacity
                    onPress={handleViewContent}
                    activeOpacity={0.7}
                    className="flex-row items-center justify-center py-3 px-4 rounded-full"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.3)' }}
                  >
                    <Ionicons name="book-outline" size={18} color="#ffffff" />
                    <Body size="small" style={{ color: '#ffffff', marginLeft: 8, fontWeight: '600' }}>
                      Read Content First
                    </Body>
                  </TouchableOpacity>
                </View>
              )}
            </Card>
          )}

          {/* Legacy Activities Header */}
          {isLegacy && (
            <Card
              variant="elevated"
              padding="large"
              style={[
                styles.subLessonCard,
                { backgroundColor: topic?.color || theme.colors.primary[500] },
              ]}
            >
              <View className="flex-row items-center mb-4">
                <View
                  className="w-16 h-16 rounded-full items-center justify-center"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.3)' }}
                >
                  <Ionicons name="play-circle" size={32} color="#ffffff" />
                </View>
                <View className="flex-1 ml-4">
                  <Heading
                    level="h4"
                    style={{
                      color: '#ffffff',
                      marginBottom: theme.spacing[1],
                    }}
                  >
                    Activities
                  </Heading>
                  <Body size="small" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                    {totalCount} {totalCount === 1 ? 'activity' : 'activities'} available
                  </Body>
                </View>
              </View>
            </Card>
          )}
        </View>

        {/* Parent Lesson Lock Message */}
        {isParentLessonLocked && !isLegacy && (
          <View className="px-6 pb-4">
            <Card variant="outlined" padding="medium" style={{ backgroundColor: theme.colors.warning[50], borderColor: theme.colors.warning[200] }}>
              <View className="flex-row items-center">
                <Ionicons name="lock-closed" size={24} color={theme.colors.warning[700]} />
                <View className="flex-1 ml-3">
                  <Body size="small" style={{ color: theme.colors.warning[700], fontWeight: '600' }}>
                    Parent lesson is locked
                  </Body>
                  <Body size="small" style={{ color: theme.colors.warning[600], marginTop: 4 }}>
                    {(() => {
                      if (!topic) return 'Complete the previous lesson to unlock.';
                      const previousLesson = FIXED_CURRICULUM.find((l) => l.order === topic.order - 1);
                      return previousLesson 
                        ? `Complete ${previousLesson.title.split(':')[0]} to unlock this lesson.`
                        : 'Complete the previous lesson to unlock.';
                    })()}
                  </Body>
                </View>
              </View>
            </Card>
          </View>
        )}

        {/* Activities List */}
        <View className="px-6 pb-8">
          {isParentLessonLocked && !isLegacy ? (
            <Card variant="outlined" padding="large" style={styles.emptyCard}>
              <View className="items-center">
                <Ionicons
                  name="lock-closed"
                  size={48}
                  color={theme.colors.gray[400]}
                  style={{ marginBottom: theme.spacing[3] }}
                />
                <Heading level="h4" className="text-center mb-2" style={{ color: theme.colors.text.primary }}>
                  Lesson Locked
                </Heading>
                <Body size="medium" className="text-center text-gray-600">
                  {(() => {
                    if (!topic) return 'Complete the previous lesson to unlock.';
                    const previousLesson = FIXED_CURRICULUM.find((l) => l.order === topic.order - 1);
                    return previousLesson 
                      ? `Complete ${previousLesson.title.split(':')[0]} to unlock this lesson.`
                      : 'Complete the previous lesson to unlock.';
                  })()}
                </Body>
              </View>
            </Card>
          ) : modules.length === 0 ? (
            <Card variant="outlined" padding="large" style={styles.emptyCard}>
              <View className="items-center">
                <Text className="text-6xl mb-4">🎯</Text>
                <Heading level="h4" className="text-center mb-2" style={{ color: theme.colors.text.primary }}>
                  No Activities Yet
                </Heading>
                <Body size="medium" className="text-center text-gray-600">
                  Your teacher hasn't added any activities for this sub-lesson yet.
                </Body>
              </View>
            </Card>
          ) : (
            <View className="gap-3">
              {!subLessonUnlocked && !isLegacy && (
                <Card variant="outlined" padding="medium" style={{ backgroundColor: theme.colors.warning[50], borderColor: theme.colors.warning[200] }}>
                  <View className="flex-row items-center">
                    <Ionicons name="lock-closed" size={20} color={theme.colors.warning[700]} />
                    <Body size="small" style={{ color: theme.colors.warning[700], marginLeft: 8 }}>
                      Complete the previous sub-lesson to unlock these activities.
                    </Body>
                  </View>
                </Card>
              )}

              {modules.map((module, moduleIndex) => {
                const isLocked = isParentLessonLocked || !subLessonUnlocked || !isModuleUnlocked(module, moduleIndex);
                const isCompleted = isModuleCompleted(module.id);
                const moduleProgress = getModuleProgress(module.id);
                const activityIcon = getActivityTypeIcon(module.activityType);
                const activityLabel = getActivityTypeLabel(module.activityType);
                const isFirstInSubLesson = moduleIndex === 0;

                return (
                  <TouchableOpacity
                    key={module.id}
                    onPress={() => handleModulePress(module, isLocked, isFirstInSubLesson)}
                    activeOpacity={isLocked ? 1 : 0.7}
                    disabled={isLocked}
                  >
                    <Card
                      variant="elevated"
                      padding="medium"
                      style={[
                        styles.moduleCard,
                        {
                          opacity: isLocked ? 0.6 : 1,
                          borderWidth: isCompleted ? 2 : 0,
                          borderColor: isCompleted ? (topic?.color || theme.colors.primary[500]) : 'transparent',
                        },
                      ]}
                    >
                      <View className="flex-row items-center">
                        {/* Module Number */}
                        <View
                          className="w-10 h-10 rounded-full items-center justify-center mr-3"
                          style={{
                            backgroundColor: isLocked
                              ? theme.colors.gray[200]
                              : isCompleted
                              ? (topic?.color || theme.colors.primary[500])
                              : theme.colors.primary[100],
                          }}
                        >
                          {isLocked ? (
                            <Ionicons
                              name="lock-closed"
                              size={18}
                              color={theme.colors.gray[500]}
                            />
                          ) : (
                            <Text
                              className="text-base font-bold"
                              style={{
                                color: isCompleted ? '#ffffff' : theme.colors.primary[700],
                              }}
                            >
                              {moduleIndex + 1}
                            </Text>
                          )}
                        </View>

                        {/* Module Info */}
                        <View className="flex-1">
                          <View className="flex-row items-center mb-1">
                            <Heading
                              level="h4"
                              style={{
                                color: theme.colors.text.primary,
                                flex: 1,
                                fontSize: 16,
                              }}
                            >
                              {module.title}
                            </Heading>
                          </View>
                          <View className="flex-row items-center gap-3">
                            <View className="flex-row items-center">
                              <Ionicons
                                name={activityIcon as any}
                                size={12}
                                color={theme.colors.gray[500]}
                              />
                              <Body size="small" className="text-gray-500 ml-1">
                                {activityLabel}
                              </Body>
                            </View>
                            {moduleProgress && !isCompleted && (
                              <View className="flex-row items-center">
                                <Ionicons
                                  name="star"
                                  size={12}
                                  color={theme.colors.primary[500]}
                                />
                                <Body size="small" className="text-gray-500 ml-1">
                                  {moduleProgress.score}%
                                </Body>
                              </View>
                            )}
                          </View>
                        </View>

                        {/* Completion Checkmark */}
                        {isCompleted && (
                          <View
                            className="w-8 h-8 rounded-full items-center justify-center mr-4"
                            style={{ backgroundColor: topic?.color || theme.colors.primary[500] }}
                          >
                            <Ionicons name="checkmark" size={18} color="#ffffff" />
                          </View>
                        )}

                        {/* Arrow */}
                        {!isLocked && (
                          <Ionicons
                            name="chevron-forward"
                            size={20}
                            color={theme.colors.gray[400]}
                          />
                        )}
                      </View>

                      {/* Lock Message or Content Reminder */}
                      {isLocked ? (
                        <View className="mt-2 pt-2 border-t" style={{ borderTopColor: theme.colors.gray[200] }}>
                          <Body size="small" className="text-gray-500">
                            {!subLessonUnlocked
                              ? 'Complete the previous sub-lesson to unlock.'
                              : 'Complete the previous activity to unlock this one.'}
                          </Body>
                        </View>
                      ) : isFirstInSubLesson && !isLegacy && !contentViewed && (
                        <View className="mt-2 pt-2 border-t" style={{ borderTopColor: theme.colors.primary[200] }}>
                          <View className="flex-row items-center">
                            <Ionicons name="book-outline" size={14} color={theme.colors.primary[600]} />
                            <Body size="small" style={{ color: theme.colors.primary[700], marginLeft: 6 }}>
                              Read the content first before playing
                            </Body>
                          </View>
                        </View>
                      )}
                    </Card>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: theme.spacing[8],
  },
  subLessonCard: {
    marginTop: theme.spacing[2],
  },
  moduleCard: {
    marginBottom: theme.spacing[1],
  },
  emptyCard: {
    marginTop: theme.spacing[4],
    minHeight: 200,
    justifyContent: 'center',
  },
});

