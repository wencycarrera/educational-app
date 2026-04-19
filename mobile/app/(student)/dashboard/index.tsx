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
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../src/hooks/useAuth';
import { Heading } from '../../../src/components/ui/Heading';
import { Body } from '../../../src/components/ui/Body';
import { Card } from '../../../src/components/ui/Card';
import { StarsDisplay } from '../../../src/components/student/StarsDisplay';
import { LevelDisplay } from '../../../src/components/student/LevelDisplay';
import { FIXED_CURRICULUM, LessonTopic } from '../../../src/data/curriculum-skeleton';
import { getLessonModulesByTopic, isLessonCompleted, isLessonUnlocked } from '../../../src/services/lesson.service';
import { getStudentProgress } from '../../../src/services/progress.service';
import { theme } from '../../../src/config/theme';
import { subscribeToUnreadCount } from '../../../src/services/notification.service';

export default function DashboardScreen() {
  const router = useRouter();
  const { userData, user, loading: authLoading, reloadUserData } = useAuth();
  const [lessonModules, setLessonModules] = useState<Record<string, any[]>>({});
  const [lessonCompletion, setLessonCompletion] = useState<Record<string, boolean>>({});
  const [lessonUnlockStatus, setLessonUnlockStatus] = useState<Record<string, boolean>>({});
  const [studentProgress, setStudentProgress] = useState<any[]>([]);
  const [loadingLessons, setLoadingLessons] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Get student profile data
  const studentProfile = userData && userData.role === 'student' ? userData.studentProfile : null;
  const joinedClassID = studentProfile?.joinedClassID;
  const studentID = user?.uid || '';

  // Fetch lesson modules and progress for the class
  const fetchLessons = useCallback(async () => {
    if (!joinedClassID || !studentID) {
      setLoadingLessons(false);
      setError(null);
      return;
    }

    try {
      setError(null);
      
      // Fetch modules
      const modules = await getLessonModulesByTopic(joinedClassID);
      setLessonModules(modules || {});

      // Fetch student progress
      const progress = await getStudentProgress(studentID, joinedClassID);
      setStudentProgress(progress);

      // Calculate completion and unlock status for each lesson
      const completionMap: Record<string, boolean> = {};
      const unlockMap: Record<string, boolean> = {};

      for (const topic of FIXED_CURRICULUM) {
        // Check completion
        const completed = await isLessonCompleted(studentID, joinedClassID, topic.id, progress);
        completionMap[topic.id] = completed;

        // Check unlock status
        const unlocked = await isLessonUnlocked(topic.id, studentID, joinedClassID, progress, FIXED_CURRICULUM);
        unlockMap[topic.id] = unlocked;
      }

      setLessonCompletion(completionMap);
      setLessonUnlockStatus(unlockMap);
    } catch (err) {
      console.error('Error fetching lessons:', err);
      setLessonModules({});
      setError(null);
    } finally {
      setLoadingLessons(false);
    }
  }, [joinedClassID, studentID]);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  // Reload userData when screen comes into focus to refresh points and level
  useFocusEffect(
    useCallback(() => {
      if (user) {
        reloadUserData();
      }
    }, [user, reloadUserData])
  );

  // Subscribe to unread notifications count
  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = subscribeToUnreadCount(user.uid, (count) => {
      setUnreadCount(count);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Subscribe to unread notifications count
  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = subscribeToUnreadCount(user.uid, (count) => {
      setUnreadCount(count);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setLoadingLessons(true);
    await fetchLessons();
    setRefreshing(false);
  }, [fetchLessons]);

  const handleLessonPress = (topic: LessonTopic) => {
    router.push(`/(student)/lessons/${topic.id}`);
  };

  const handleParentsSpacePress = () => {
    router.push('/(student)/parent-zone' as any);
  };

  const handleNotificationPress = () => {
    router.push('/(student)/notifications' as any);
  };

  const handleMaterialsPress = () => {
    router.push('/(student)/materials' as any);
  };

  if (authLoading || !studentProfile) {
    return (
      <View className="items-center justify-center flex-1 bg-primary-50">
        <ActivityIndicator size="large" color={theme.colors.primary[500]} />
      </View>
    );
  }

  const studentName = studentProfile.name;
  // Support both old 'stars' field (for migration) and new 'points' field
  const points = (studentProfile as any).points ?? (studentProfile as any).stars ?? 0;
  // Read level from Firebase (with fallback to calculating from points for backward compatibility)
  const level = studentProfile.level;

  // Calculate total activities
  const totalActivities = Object.values(lessonModules).reduce(
    (sum, modules) => sum + (modules?.length || 0),
    0
  );

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };


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
        {/* Enhanced Header Section */}
        <View className="px-6 pt-6 pb-4">
          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-row items-center flex-1">
              <View
                className="items-center justify-center rounded-full w-14 h-14"
                style={{ backgroundColor: theme.colors.primary[200], marginRight: theme.spacing[4] }}
              >
                <Text className="text-3xl">
                  {studentName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View className="flex-1 justify-center pl-0.5" style={{ minWidth: 0 }}>
                <Body size="medium" className="text-gray-600" style={{ marginBottom: 1 }}>
                  {getGreeting()},
                </Body>
                <Heading 
                  level="h5" 
                  style={{ 
                    color: theme.colors.primary[700],
                    lineHeight: theme.typography.lineHeight.tight * 28,
                  }}
                >
                  {studentName}!
                </Heading>
              </View>
            </View>
            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                onPress={handleNotificationPress}
                activeOpacity={0.7}
                className="items-center justify-center rounded-full w-14 h-14"
                style={{ backgroundColor: theme.colors.background.light }}
              >
                <View>
                  <Ionicons
                    name="notifications-outline"
                    size={24}
                    color={theme.colors.gray[700]}
                  />
                  {unreadCount > 0 && (
                    <View
                      style={{
                        position: 'absolute',
                        top: -4,
                        right: -4,
                        backgroundColor: theme.colors.error[500],
                        borderRadius: 10,
                        minWidth: 20,
                        height: 20,
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingHorizontal: 4,
                      }}
                    >
                      <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: 'bold' }}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleParentsSpacePress}
                activeOpacity={0.7}
                className="items-center justify-center rounded-full w-14 h-14"
                style={{ backgroundColor: theme.colors.background.light }}
              >
                <Ionicons
                  name="person-circle-outline"
                  size={24}
                  color={theme.colors.gray[700]}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleMaterialsPress}
                activeOpacity={0.7}
                className="items-center justify-center rounded-full w-14 h-14"
                style={{ backgroundColor: theme.colors.background.light }}
              >
                <Ionicons
                  name="folder-open-outline"
                  size={24}
                  color={theme.colors.gray[700]}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Stats Card */}
          <Card variant="elevated" padding="medium" style={styles.statsCard}>
            <View className="mb-4">
              <LevelDisplay points={points} level={level} size="medium" showProgress={true} />
            </View>
            <View className="flex-row items-center justify-between pt-4 border-t" style={{ borderTopColor: theme.colors.gray[200] }}>
              <View className="flex-1">
                <Body size="small" className="mb-1 text-gray-600">
                  Your Progress
                </Body>
                <View className="flex-row items-baseline gap-2">
                  <Heading level="h3" style={{ color: theme.colors.primary[700] }}>
                    {totalActivities}
                  </Heading>
                  <Body size="small" className="text-gray-500">
                    {totalActivities === 1 ? 'activity' : 'activities'} available
                  </Body>
                </View>
              </View>
              <View className="items-end">
                <StarsDisplay points={points} size="large" />
              </View>
            </View>
          </Card>
        </View>

        {/* Lessons Grid Section */}
        <View className="px-6 pb-8">
          <View className="flex-row items-center justify-between mb-4">
            <Heading level="h3" style={{ color: theme.colors.text.primary }}>
              Your Lessons
            </Heading>
            {totalActivities > 0 && (
              <Body size="small" className="text-gray-500">
                {totalActivities} total
              </Body>
            )}
          </View>

          {loadingLessons && !refreshing ? (
            <View className="items-center py-16">
              <ActivityIndicator size="large" color={theme.colors.primary[500]} />
              <Body size="small" className="mt-4 text-gray-500">
                Loading lessons...
              </Body>
            </View>
          ) : error ? (
            <Card variant="outlined" padding="large" style={styles.errorCard}>
              <View className="items-center">
                <Ionicons
                  name="alert-circle-outline"
                  size={48}
                  color={theme.colors.error[500]}
                  style={{ marginBottom: theme.spacing[3] }}
                />
                <Body size="medium" className="mb-2 text-center text-gray-700">
                  {error}
                </Body>
                <TouchableOpacity
                  onPress={fetchLessons}
                  activeOpacity={0.7}
                  className="px-6 py-2 mt-2 rounded-full"
                  style={{ backgroundColor: theme.colors.primary[500] }}
                >
                  <Body size="small" style={{ color: '#ffffff', fontWeight: '600' }}>
                    Try Again
                  </Body>
                </TouchableOpacity>
              </View>
            </Card>
          ) : !joinedClassID ? (
            <Card variant="outlined" padding="large" style={styles.emptyCard}>
              <View className="items-center">
                <Text className="mb-4 text-6xl">📚</Text>
                <Heading level="h4" className="mb-2 text-center" style={{ color: theme.colors.text.primary }}>
                  No Class Joined Yet
                </Heading>
                <Body size="medium" className="mb-4 text-center text-gray-600">
                  Join a class to start learning! Ask your teacher for a class code.
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
          ) : (
            <View className="flex-row flex-wrap gap-4">
              {FIXED_CURRICULUM.map((topic) => {
                const hasActivities = lessonModules[topic.id]?.length > 0;
                const isLocked = !lessonUnlockStatus[topic.id];
                const isCompleted = lessonCompletion[topic.id] || false;
                const activityCount = lessonModules[topic.id]?.length || 0;
                
                // Find previous lesson for lock message
                const previousLesson = FIXED_CURRICULUM.find((l) => l.order === topic.order - 1);

                return (
                  <TouchableOpacity
                    key={topic.id}
                    onPress={() => !isLocked && handleLessonPress(topic)}
                    activeOpacity={0.8}
                    disabled={isLocked}
                    style={[
                      styles.lessonCard,
                      {
                        backgroundColor: topic.color,
                        opacity: isLocked ? 0.5 : 1,
                        width: '47%', // 2 columns with gap
                      },
                    ]}
                  >
                    <Card
                      variant="elevated"
                      padding="medium"
                      style={[
                        styles.cardContent,
                        {
                          backgroundColor: topic.color,
                        },
                      ]}
                    >
                      {isLocked && (
                        <View className="absolute z-10 top-3 right-3">
                          <View
                            className="items-center justify-center w-8 h-8 rounded-full"
                            style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
                          >
                            <Ionicons
                              name="lock-closed"
                              size={16}
                              color="#ffffff"
                            />
                          </View>
                        </View>
                      )}
                      {isCompleted && !isLocked && (
                        <View className="absolute z-10 top-3 right-3">
                          <View
                            className="items-center justify-center w-8 h-8 rounded-full"
                            style={{ backgroundColor: 'rgba(255, 255, 255, 0.3)' }}
                          >
                            <Ionicons
                              name="checkmark-circle"
                              size={18}
                              color="#ffffff"
                            />
                          </View>
                        </View>
                      )}
                      <View className="mb-3">
                        <View
                          className="items-center justify-center mb-3 rounded-full w-14 h-14"
                          style={{ backgroundColor: 'rgba(255, 255, 255, 0.3)' }}
                        >
                          <Text className="text-2xl font-bold" style={{ color: '#ffffff' }}>
                            {topic.order}
                          </Text>
                        </View>
                      </View>
                      <Heading
                        level="h4"
                        style={{
                          color: '#ffffff',
                          marginBottom: theme.spacing[1],
                          fontSize: theme.typography.fontSize.lg,
                        }}
                      >
                        {topic.title.split(':')[0]}
                      </Heading>
                      <Body
                        size="small"
                        style={{
                          color: 'rgba(255, 255, 255, 0.9)',
                          marginBottom: theme.spacing[2],
                        }}
                      >
                        {topic.description}
                      </Body>
                      {hasActivities && (
                        <View className="mt-auto">
                          <View
                            className="px-3 py-1.5 rounded-full self-start"
                            style={{ backgroundColor: 'rgba(255, 255, 255, 0.3)' }}
                          >
                            <Body
                              size="small"
                              style={{
                                color: '#ffffff',
                                fontWeight: '600',
                                fontSize: theme.typography.fontSize.xs,
                              }}
                            >
                              {activityCount} {activityCount === 1 ? 'activity' : 'activities'}
                            </Body>
                          </View>
                        </View>
                      )}
                      {!hasActivities && (
                        <View className="mt-auto">
                          <View
                            className="px-3 py-1.5 rounded-full self-start"
                            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                          >
                            <Body
                              size="small"
                              style={{
                                color: 'rgba(255, 255, 255, 0.7)',
                                fontSize: theme.typography.fontSize.xs,
                              }}
                            >
                              Coming soon
                            </Body>
                          </View>
                        </View>
                      )}
                      {isLocked && previousLesson && (
                        <View className="pt-2 mt-2 border-t" style={{ borderTopColor: 'rgba(255, 255, 255, 0.3)' }}>
                          <Body
                            size="small"
                            style={{
                              color: 'rgba(255, 255, 255, 0.8)',
                              fontSize: theme.typography.fontSize.xs,
                            }}
                          >
                            Complete {previousLesson.title.split(':')[0]} to unlock
                          </Body>
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
  statsCard: {
    marginTop: theme.spacing[2],
  },
  lessonCard: {
    borderRadius: theme.borderRadius['2xl'],
    overflow: 'hidden',
  },
  cardContent: {
    height: 200,
    justifyContent: 'space-between',
  },
  emptyCard: {
    marginTop: theme.spacing[4],
    minHeight: 200,
    justifyContent: 'center',
  },
  errorCard: {
    marginTop: theme.spacing[4],
    minHeight: 200,
    justifyContent: 'center',
  },
});
