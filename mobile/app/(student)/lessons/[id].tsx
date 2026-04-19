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
import { useAuth } from '../../../src/hooks/useAuth';
import { Heading } from '../../../src/components/ui/Heading';
import { Body } from '../../../src/components/ui/Body';
import { Card } from '../../../src/components/ui/Card';
import { FIXED_CURRICULUM, LessonTopic } from '../../../src/data/curriculum-skeleton';
import { getLessonModulesByTopic, LessonModule, getModulesBySubLesson, isLessonUnlocked } from '../../../src/services/lesson.service';
import { getStudentProgress, StudentProgress } from '../../../src/services/progress.service';
import { getSubLessonsByTopic, SubLesson } from '../../../src/services/sub-lesson.service';
import { theme } from '../../../src/config/theme';

export default function LessonDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const { userData, user, loading: authLoading } = useAuth();
  const topicId = params.id;

  const [topic, setTopic] = useState<LessonTopic | null>(null);
  const [modules, setModules] = useState<LessonModule[]>([]);
  const [subLessons, setSubLessons] = useState<SubLesson[]>([]);
  const [modulesBySubLesson, setModulesBySubLesson] = useState<Record<string, LessonModule[]>>({});
  const [progress, setProgress] = useState<StudentProgress[]>([]);
  const [isLessonLocked, setIsLessonLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get user data
  const studentProfile = userData && userData.role === 'student' ? userData.studentProfile : null;
  const joinedClassID = studentProfile?.joinedClassID;
  const studentID = user?.uid || ''; // Use user.uid from Firebase Auth, not userData.uid

  // Find topic from curriculum skeleton
  useEffect(() => {
    if (topicId) {
      const foundTopic = FIXED_CURRICULUM.find((t) => t.id === topicId);
      if (foundTopic) {
        setTopic(foundTopic);
      } else {
        setError('Lesson topic not found');
        setLoading(false);
      }
    }
  }, [topicId]);

  // Fetch modules and progress
  const fetchData = useCallback(async () => {
    if (!joinedClassID || !topicId) {
      setLoading(false);
      return;
    }

    try {
      console.log('📥 [LessonDetail] Fetching progress for:', { studentID, classID: joinedClassID, topicId });
      setError(null);

      // Fetch sub-lessons for this topic
      const fetchedSubLessons = await getSubLessonsByTopic(joinedClassID, topicId);
      setSubLessons(fetchedSubLessons);

      // Fetch modules for this topic
      const modulesByTopic = await getLessonModulesByTopic(joinedClassID);
      const topicModules = modulesByTopic[topicId] || [];
      setModules(topicModules);

      // Group modules by sub-lesson
      const grouped: Record<string, LessonModule[]> = {};
      
      // First, group modules that have subLessonID
      topicModules.forEach((module) => {
        if (module.subLessonID) {
          if (!grouped[module.subLessonID]) {
            grouped[module.subLessonID] = [];
          }
          grouped[module.subLessonID].push(module);
        }
      });

      // Sort modules within each sub-lesson by subLessonOrder
      Object.keys(grouped).forEach((subLessonID) => {
        grouped[subLessonID].sort((a, b) => {
          if (a.subLessonOrder !== undefined && b.subLessonOrder !== undefined) {
            return a.subLessonOrder - b.subLessonOrder;
          }
          return (a.sequenceOrder || 0) - (b.sequenceOrder || 0);
        });
      });

      // Handle modules without subLessonID (legacy data) - create a default group
      const modulesWithoutSubLesson = topicModules.filter((m) => !m.subLessonID);
      if (modulesWithoutSubLesson.length > 0) {
        grouped['__legacy__'] = modulesWithoutSubLesson.sort(
          (a, b) => (a.sequenceOrder || 0) - (b.sequenceOrder || 0)
        );
      }

      setModulesBySubLesson(grouped);

      // Fetch student progress - ensure we get fresh data
      const studentProgress = await getStudentProgress(studentID, joinedClassID);
      console.log('📊 [LessonDetail] Fetched progress records:', studentProgress.map(p => ({
        id: p.id,
        moduleID: p.moduleID,
        status: p.status,
        completedAt: p.completedAt,
        lastAttemptAt: p.lastAttemptAt,
        score: p.score,
      })));
      console.log('📊 [LessonDetail] Progress summary:', {
        totalRecords: studentProgress.length,
        completedCount: studentProgress.filter((p) => p.status === 'completed').length,
      });
      setProgress(studentProgress);

      // Check if lesson is unlocked
      const unlocked = await isLessonUnlocked(topicId, studentID, joinedClassID, studentProgress, FIXED_CURRICULUM);
      setIsLessonLocked(!unlocked);
    } catch (err) {
      console.error('❌ [LessonDetail] Error fetching lesson data:', err);
      setError('Failed to load lesson. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [joinedClassID, topicId, studentID]);

  useEffect(() => {
    if (topic && !authLoading) {
      fetchData();
    }
  }, [topic, authLoading, fetchData]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('👁️ [LessonDetail] Screen came into focus, refreshing data...');
      if (topic && !authLoading) {
        fetchData();
      }
    }, [topic, authLoading, fetchData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  // Helper functions
  const isModuleCompleted = (moduleId: string): boolean => {
    console.log('🔍 [CompletionCheck] Checking module:', moduleId);
    
    // Get all progress records for this module and find the most recent one
    const moduleProgressRecords = progress.filter((p) => p.moduleID === moduleId);
    console.log('📋 [CompletionCheck] Found records:', moduleProgressRecords.map(p => ({
      id: p.id,
      moduleID: p.moduleID,
      status: p.status,
      completedAt: p.completedAt,
      lastAttemptAt: p.lastAttemptAt,
      score: p.score,
    })));
    
    if (moduleProgressRecords.length === 0) {
      console.log('🎯 [CompletionCheck] No records found, returning false');
      return false;
    }
    
    // Sort by lastAttemptAt to get the most recent (progress is already sorted, but be safe)
    const sortedRecords = moduleProgressRecords.sort((a, b) => {
      const aTime = a.lastAttemptAt?.toMillis?.() || a.lastAttemptAt || 0;
      const bTime = b.lastAttemptAt?.toMillis?.() || b.lastAttemptAt || 0;
      return bTime - aTime; // Descending order
    });
    
    console.log('📋 [CompletionCheck] Sorted records (by lastAttemptAt):', sortedRecords.map(p => ({
      id: p.id,
      status: p.status,
      lastAttemptAt: p.lastAttemptAt,
    })));
    
    const latestProgress = sortedRecords[0];
    console.log('✅ [CompletionCheck] Latest record:', {
      id: latestProgress.id,
      moduleID: latestProgress.moduleID,
      status: latestProgress.status,
      completedAt: latestProgress.completedAt,
      lastAttemptAt: latestProgress.lastAttemptAt,
    });
    
    const isCompleted = latestProgress?.status === 'completed';
    console.log('🎯 [CompletionCheck] Is completed?', isCompleted, '(status === "completed":', latestProgress?.status === 'completed', ')');
    
    return isCompleted;
  };

  // Check if a sub-lesson is unlocked (all previous sub-lessons must be completed)
  const isSubLessonUnlocked = (subLesson: SubLesson, subLessonIndex: number): boolean => {
    // First sub-lesson is always unlocked
    if (subLessonIndex === 0) {
      return true;
    }

    // Check if previous sub-lesson is completed
    const previousSubLesson = subLessons[subLessonIndex - 1];
    if (!previousSubLesson) {
      return true;
    }

    // Get all modules for previous sub-lesson
    const previousModules = modulesBySubLesson[previousSubLesson.id] || [];
    if (previousModules.length === 0) {
      return true; // No modules means it's considered complete
    }

    // All modules in previous sub-lesson must be completed
    return previousModules.every((m) => isModuleCompleted(m.id));
  };




  const handleSubLessonPress = (subLesson: SubLesson, isLocked: boolean) => {
    if (isLocked || isLessonLocked) return;
    
    // Navigate to sub-lesson detail screen
    router.push({
      pathname: '/(student)/lessons/sub-lesson/[id]',
      params: { id: subLesson.id },
    });
  };

  // Loading state
  if (authLoading || loading) {
    return (
      <View className="flex-1 justify-center items-center bg-primary-50">
        <ActivityIndicator size="large" color={theme.colors.primary[500]} />
        <Body size="small" className="text-gray-500 mt-4">
          Loading lesson...
        </Body>
      </View>
    );
  }

  // Error state
  if (error || !topic) {
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
                {error || 'Lesson Not Found'}
              </Heading>
              <Body size="medium" className="text-center text-gray-600 mb-4">
                {error || 'The lesson you\'re looking for doesn\'t exist.'}
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

  const completedCount = modules.filter((m) => isModuleCompleted(m.id)).length;
  const totalCount = modules.length;

  // Log module statuses for debugging (removed to avoid errors with incomplete data)
  console.log('📈 [Render] Progress:', { completedCount, totalCount });

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
                {topic.title}
              </Heading>
            </View>
            <View className="w-10" />
          </View>

          {/* Topic Info Card */}
          <Card
            variant="elevated"
            padding="large"
            style={[
              styles.topicCard,
              { backgroundColor: topic.color },
            ]}
          >
            <View className="flex-row items-center mb-4">
              <View
                className="w-16 h-16 rounded-full items-center justify-center"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.3)' }}
              >
                <Text className="text-3xl font-bold" style={{ color: '#ffffff' }}>
                  {topic.order}
                </Text>
              </View>
              <View className="flex-1 ml-4">
                <Heading
                  level="h4"
                  style={{
                    color: '#ffffff',
                    marginBottom: theme.spacing[1],
                  }}
                >
                  {topic.title.split(':')[1]?.trim() || topic.title}
                </Heading>
                <Body size="small" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                  {topic.description}
                </Body>
              </View>
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
          </Card>
        </View>

        {/* Lock Message */}
        {isLessonLocked && (
          <View className="px-6 pb-4">
            <Card variant="outlined" padding="medium" style={{ backgroundColor: theme.colors.warning[50], borderColor: theme.colors.warning[200] }}>
              <View className="flex-row items-center">
                <Ionicons name="lock-closed" size={24} color={theme.colors.warning[700]} />
                <View className="flex-1 ml-3">
                  <Body size="small" style={{ color: theme.colors.warning[700], fontWeight: '600' }}>
                    This lesson is locked
                  </Body>
                  <Body size="small" style={{ color: theme.colors.warning[600], marginTop: 4 }}>
                    {(() => {
                      const previousLesson = FIXED_CURRICULUM.find((l) => l.order === (topic?.order || 0) - 1);
                      return previousLesson 
                        ? `Complete ${previousLesson.title.split(':')[0]} to unlock this lesson.`
                        : 'Complete the previous lesson to unlock this one.';
                    })()}
                  </Body>
                </View>
              </View>
            </Card>
          </View>
        )}

        {/* Sub-Lessons List */}
        <View className="px-6 pb-8">
          {isLessonLocked ? (
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
                    const previousLesson = FIXED_CURRICULUM.find((l) => l.order === (topic?.order || 0) - 1);
                    return previousLesson 
                      ? `Complete ${previousLesson.title.split(':')[0]} to unlock this lesson.`
                      : 'Complete the previous lesson to unlock this one.';
                  })()}
                </Body>
              </View>
            </Card>
          ) : subLessons.length === 0 && modules.length === 0 ? (
            <Card variant="outlined" padding="large" style={styles.emptyCard}>
              <View className="items-center">
                <Text className="text-6xl mb-4">🎯</Text>
                <Heading level="h4" className="text-center mb-2" style={{ color: theme.colors.text.primary }}>
                  No Activities Yet
                </Heading>
                <Body size="medium" className="text-center text-gray-600">
                  Your teacher hasn't added any activities for this lesson yet. Check back soon!
                </Body>
              </View>
            </Card>
          ) : (
            <View className="gap-4">
              {/* Render sub-lessons as clickable cards */}
              {subLessons.map((subLesson, subLessonIndex) => {
                const subLessonModules = modulesBySubLesson[subLesson.id] || [];
                const isSubLessonLocked = !isSubLessonUnlocked(subLesson, subLessonIndex);
                const subLessonCompleted = subLessonModules.length > 0 && subLessonModules.every((m) => isModuleCompleted(m.id));
                const activityCount = subLessonModules.length;
                const completedActivities = subLessonModules.filter((m) => isModuleCompleted(m.id)).length;

                return (
                  <TouchableOpacity
                    key={subLesson.id}
                    onPress={() => handleSubLessonPress(subLesson, isSubLessonLocked)}
                    activeOpacity={isSubLessonLocked || isLessonLocked ? 1 : 0.7}
                    disabled={isSubLessonLocked || isLessonLocked}
                  >
                    <Card
                      variant="elevated"
                      padding="medium"
                      style={[
                        styles.subLessonCard,
                        {
                          opacity: isSubLessonLocked || isLessonLocked ? 0.6 : 1,
                          borderWidth: subLessonCompleted ? 2 : 0,
                          borderColor: subLessonCompleted ? topic.color : 'transparent',
                        },
                      ]}
                    >
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center flex-1">
                          <View
                            className="w-10 h-10 rounded-full items-center justify-center mr-3"
                            style={{
                              backgroundColor: isSubLessonLocked
                                ? theme.colors.gray[200]
                                : topic.color + '20',
                            }}
                          >
                            {isSubLessonLocked ? (
                              <Ionicons
                                name="lock-closed"
                                size={18}
                                color={theme.colors.gray[500]}
                              />
                            ) : (
                              <Text
                                className="text-base font-bold"
                                style={{ color: topic.color }}
                              >
                                {subLessonIndex + 1}
                              </Text>
                            )}
                          </View>
                          <View className="flex-1">
                            <Heading
                              level="h5"
                              style={{
                                color: theme.colors.text.primary,
                                marginBottom: theme.spacing[1],
                              }}
                            >
                              {subLesson.title}
                            </Heading>
                            {activityCount > 0 && (
                              <Body size="small" className="text-gray-500">
                                {activityCount} {activityCount === 1 ? 'activity' : 'activities'}
                                {completedActivities > 0 && (
                                  <Text> • {completedActivities} completed</Text>
                                )}
                              </Body>
                            )}
                          </View>
                        </View>
                        <View className="flex-row items-center gap-2">
                          {subLessonCompleted && (
                            <View
                              className="px-2 py-1 rounded-full"
                              style={{ backgroundColor: topic.color }}
                            >
                              <Ionicons name="checkmark" size={16} color="#ffffff" />
                            </View>
                          )}
                          {!isSubLessonLocked && (
                            <Ionicons
                              name="chevron-forward"
                              size={20}
                              color={theme.colors.gray[400]}
                            />
                          )}
                        </View>
                      </View>

                      {/* Lock Message for Sub-Lesson */}
                      {isSubLessonLocked && (
                        <View className="mt-3 pt-3 border-t" style={{ borderTopColor: theme.colors.gray[200] }}>
                          <Body size="small" className="text-gray-500">
                            Complete the previous sub-lesson to unlock this one.
                          </Body>
                        </View>
                      )}
                    </Card>
                  </TouchableOpacity>
                );
              })}

              {/* Legacy modules without sub-lesson - show as a special sub-lesson */}
              {modulesBySubLesson['__legacy__'] && modulesBySubLesson['__legacy__'].length > 0 && (
                <View className="gap-3">
                  <Heading level="h3" style={{ color: theme.colors.text.primary, marginBottom: 8 }}>
                    Activities
                  </Heading>
                  <Body size="small" className="text-gray-500 mb-2">
                    These activities are not part of a sub-lesson.
                  </Body>
                  <TouchableOpacity
                    onPress={() => {
                      // Navigate to sub-lesson screen with legacy flag and topicId
                      router.push({
                        pathname: '/(student)/lessons/sub-lesson/[id]',
                        params: { id: '__legacy__', topicId: topicId },
                      });
                    }}
                    activeOpacity={0.7}
                  >
                    <Card
                      variant="elevated"
                      padding="medium"
                      style={styles.subLessonCard}
                    >
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center flex-1">
                          <View
                            className="w-10 h-10 rounded-full items-center justify-center mr-3"
                            style={{
                              backgroundColor: theme.colors.primary[100],
                            }}
                          >
                            <Ionicons
                              name="play-circle-outline"
                              size={18}
                              color={theme.colors.primary[700]}
                            />
                          </View>
                          <View className="flex-1">
                            <Heading
                              level="h4"
                              style={{
                                color: theme.colors.text.primary,
                                marginBottom: theme.spacing[1],
                              }}
                            >
                              Activities
                            </Heading>
                            <Body size="small" className="text-gray-500">
                              {modulesBySubLesson['__legacy__'].length} {modulesBySubLesson['__legacy__'].length === 1 ? 'activity' : 'activities'}
                            </Body>
                          </View>
                        </View>
                        <Ionicons
                          name="chevron-forward"
                          size={20}
                          color={theme.colors.gray[400]}
                        />
                      </View>
                    </Card>
                  </TouchableOpacity>
                </View>
              )}
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
  topicCard: {
    marginTop: theme.spacing[2],
  },
  subLessonCard: {
    marginBottom: theme.spacing[2],
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

