import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Heading } from '../../../src/components/ui/Heading';
import { Body } from '../../../src/components/ui/Body';
import { Card } from '../../../src/components/ui/Card';
import { theme } from '../../../src/config/theme';
import { getStudentProgressSummary, StudentProgressSummary } from '../../../src/services/progress.service';
import { getModulesBySubLesson, LessonModule } from '../../../src/services/lesson.service';
import { getSubLessonById, SubLesson } from '../../../src/services/sub-lesson.service';
import { FIXED_CURRICULUM } from '../../../src/data/curriculum-skeleton';
import { Timestamp } from 'firebase/firestore';

export default function SubLessonActivitiesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    subLessonId: string;
    studentID: string;
    studentName: string;
    classID: string;
    lessonTitle?: string;
    lessonColor?: string;
  }>();

  const { subLessonId, studentID, studentName, classID, lessonTitle, lessonColor } = params;
  const [subLesson, setSubLesson] = useState<SubLesson | null>(null);
  const [modules, setModules] = useState<LessonModule[]>([]);
  const [summary, setSummary] = useState<StudentProgressSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!subLessonId || !studentID || !classID) return;

    try {
      setLoading(true);

      // Fetch sub-lesson
      const fetchedSubLesson = await getSubLessonById(subLessonId);
      setSubLesson(fetchedSubLesson);

      // Fetch modules for this sub-lesson
      const fetchedModules = await getModulesBySubLesson(subLessonId);
      // Sort by subLessonOrder
      fetchedModules.sort((a, b) => {
        if (a.subLessonOrder !== undefined && b.subLessonOrder !== undefined) {
          return a.subLessonOrder - b.subLessonOrder;
        }
        return (a.sequenceOrder || 0) - (b.sequenceOrder || 0);
      });
      setModules(fetchedModules);

      // Fetch student progress
      const progressSummary = await getStudentProgressSummary(
        studentID,
        studentName || 'Student',
        classID
      );
      setSummary(progressSummary);
    } catch (error) {
      console.error('Error fetching sub-lesson activities:', error);
    } finally {
      setLoading(false);
    }
  }, [subLessonId, studentID, classID, studentName]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const getModuleProgress = (moduleID: string) => {
    if (!summary) return null;
    return summary.progress.find((p) => p.moduleID === moduleID);
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Activity type helpers
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary[500]} />
      </View>
    );
  }

  const topic = subLesson
    ? FIXED_CURRICULUM.find((t) => t.id === subLesson.topicCategory)
    : null;
  const lessonColorValue = lessonColor || topic?.color || theme.colors.primary[500];
  const completedCount = modules.filter((m) => {
    const progress = getModuleProgress(m.id);
    return progress?.status === 'completed';
  }).length;
  const totalCount = modules.length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary[500]}
            colors={[theme.colors.primary[500]]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.7}
              style={styles.backButton}
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color={theme.colors.gray[700]}
              />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Heading level="h3" style={{ color: theme.colors.primary[700] }}>
                {subLesson?.title || 'Activities'}
              </Heading>
            </View>
            <View style={styles.headerSpacer} />
          </View>

          {/* Sub-Lesson Info Card */}
          {subLesson && (
            <Card
              variant="elevated"
              padding="large"
              style={[
                styles.subLessonCard,
                { backgroundColor: lessonColorValue },
              ]}
            >
              <View style={styles.subLessonCardContent}>
                <View
                  style={[
                    styles.subLessonIconContainer,
                    { backgroundColor: 'rgba(255, 255, 255, 0.3)' },
                  ]}
                >
                  <Ionicons name="book" size={32} color="#ffffff" />
                </View>
                <View style={styles.subLessonInfo}>
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
                    {studentName}'s Progress
                  </Body>
                </View>
              </View>

              {/* Progress Bar */}
              {totalCount > 0 && (
                <View style={styles.progressSection}>
                  <View style={styles.progressHeader}>
                    <Body size="small" style={{ color: '#ffffff', fontWeight: '600' }}>
                      Progress
                    </Body>
                    <Body size="small" style={{ color: '#ffffff' }}>
                      {completedCount} / {totalCount}
                    </Body>
                  </View>
                  <View
                    style={[
                      styles.progressBar,
                      { backgroundColor: 'rgba(255, 255, 255, 0.3)', overflow: 'hidden' },
                    ]}
                  >
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${(completedCount / totalCount) * 100}%`,
                          backgroundColor: '#ffffff',
                        },
                      ]}
                    />
                  </View>
                </View>
              )}
            </Card>
          )}
        </View>
        {/* Activities List */}
        <View style={styles.activitiesSection}>
          {modules.length === 0 ? (
            <Card variant="outlined" padding="large" style={styles.emptyCard}>
              <View style={styles.emptyContent}>
                <Text style={styles.emptyEmoji}>🎯</Text>
                <Heading level="h4" style={styles.emptyTitle}>
                  No Activities Yet
                </Heading>
                <Body size="medium" style={styles.emptyText}>
                  No activities have been added to this sub-lesson yet.
                </Body>
              </View>
            </Card>
          ) : (
            <View style={styles.activitiesList}>
            {modules.map((module, moduleIndex) => {
              const moduleProgress = getModuleProgress(module.id);
              const isCompleted = moduleProgress?.status === 'completed';
              const score = moduleProgress?.score || 0;
              const attempts = moduleProgress?.attempts || 0;
              const timeSpent = moduleProgress?.timeSpent || 0;
              const activityIcon = getActivityTypeIcon(module.activityType);
              const activityLabel = getActivityTypeLabel(module.activityType);

              return (
                <Card
                  key={module.id}
                  variant="elevated"
                  padding="medium"
                  style={[
                    styles.activityCard,
                    {
                      borderWidth: isCompleted ? 2 : 0,
                      borderColor: isCompleted ? lessonColorValue : 'transparent',
                    },
                  ]}
                >
                  <View style={styles.activityContent}>
                    {/* Activity Number */}
                    <View
                      style={[
                        styles.activityNumber,
                        {
                          backgroundColor: isCompleted
                            ? lessonColorValue
                            : theme.colors.primary[100],
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.activityNumberText,
                          {
                            color: isCompleted ? '#ffffff' : theme.colors.primary[700],
                          },
                        ]}
                      >
                        {moduleIndex + 1}
                      </Text>
                    </View>

                    {/* Activity Info */}
                    <View style={styles.activityInfo}>
                      <Heading level="h4" style={styles.activityTitle}>
                        {module.title}
                      </Heading>
                      <View style={styles.activityMetaRow}>
                        <View style={styles.activityTypeRow}>
                          <Ionicons
                            name={activityIcon as any}
                            size={12}
                            color={theme.colors.gray[500]}
                          />
                          <Body size="small" style={styles.activityTypeLabel}>
                            {activityLabel}
                          </Body>
                        </View>
                        {moduleProgress && !isCompleted && (
                          <View style={styles.scoreContainer}>
                            <Ionicons
                              name="star"
                              size={12}
                              color={theme.colors.primary[500]}
                            />
                            <Body size="small" style={styles.scoreText}>
                              {score}%
                            </Body>
                          </View>
                        )}
                      </View>

                      {/* Attempts and Time */}
                      {moduleProgress && (
                        <View style={styles.activityStats}>
                          <View style={styles.activityStat}>
                            <Ionicons
                              name="repeat"
                              size={14}
                              color={theme.colors.text.secondary}
                            />
                            <Body size="small" style={styles.activityStatText}>
                              {attempts} {attempts === 1 ? 'attempt' : 'attempts'}
                            </Body>
                          </View>
                          <View style={styles.activityStat}>
                            <Ionicons
                              name="time"
                              size={14}
                              color={theme.colors.text.secondary}
                            />
                            <Body size="small" style={styles.activityStatText}>
                              {formatTime(timeSpent)}
                            </Body>
                          </View>
                        </View>
                      )}

                      {!moduleProgress && (
                        <Body size="small" style={styles.notStarted}>
                          Not started yet
                        </Body>
                      )}
                    </View>

                    {/* Completion Checkmark */}
                    {isCompleted && (
                      <View
                        style={[
                          styles.completedBadge,
                          { backgroundColor: lessonColorValue },
                        ]}
                      >
                        <Ionicons name="checkmark" size={18} color="#ffffff" />
                      </View>
                    )}
                  </View>
                </Card>
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
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing[8],
  },
  headerContainer: {
    paddingHorizontal: theme.spacing[6],
    paddingTop: theme.spacing[6],
    paddingBottom: theme.spacing[4],
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing[6],
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background.light,
    marginRight: theme.spacing[4],
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  subLessonCard: {
    marginTop: 0,
  },
  subLessonCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing[4],
  },
  subLessonIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing[4],
  },
  subLessonInfo: {
    flex: 1,
  },
  progressSection: {
    marginTop: theme.spacing[4],
    paddingTop: theme.spacing[4],
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing[2],
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  activitiesSection: {
    paddingHorizontal: theme.spacing[6],
    paddingBottom: theme.spacing[8],
  },
  activitiesList: {
    gap: theme.spacing[3],
  },
  activityCard: {
    marginBottom: 0,
  },
  activityContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing[3],
  },
  activityNumberText: {
    fontSize: 16,
    fontWeight: '600',
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
    fontSize: 16,
    flex: 1,
  },
  activityMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[3],
    marginTop: theme.spacing[1],
  },
  activityTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityTypeLabel: {
    color: theme.colors.gray[500],
    marginLeft: 4,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[1],
  },
  scoreText: {
    color: theme.colors.text.secondary,
  },
  activityStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[3],
    marginTop: theme.spacing[2],
  },
  activityStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[1],
  },
  activityStatText: {
    color: theme.colors.text.secondary,
  },
  notStarted: {
    color: theme.colors.text.tertiary,
    fontStyle: 'italic',
    marginTop: theme.spacing[2],
  },
  completedBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.spacing[2],
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  emptyContent: {
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: theme.spacing[3],
  },
  emptyTitle: {
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[2],
    textAlign: 'center',
  },
  emptyText: {
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
});

