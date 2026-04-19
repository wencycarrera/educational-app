import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Text,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Heading } from '../../src/components/ui/Heading';
import { Body } from '../../src/components/ui/Body';
import { Card } from '../../src/components/ui/Card';
import { ProgressBar } from '../../src/components/ui/ProgressBar';
import { StatsCard } from '../../src/components/teacher/StatsCard';
import { theme } from '../../src/config/theme';
import { getStudentProgressSummary, StudentProgressSummary } from '../../src/services/progress.service';
import { getLessonModulesByClass, LessonModule } from '../../src/services/lesson.service';
import { getSubLessonsByTopic, SubLesson } from '../../src/services/sub-lesson.service';
import { FIXED_CURRICULUM, LessonTopic } from '../../src/data/curriculum-skeleton';
import { Timestamp } from 'firebase/firestore';

// Types for hierarchical organization
interface OrganizedData {
  lesson: LessonTopic;
  subLessons: {
    subLesson: SubLesson;
    modules: LessonModule[];
    completedCount: number;
    totalCount: number;
  }[];
  completedCount: number;
  totalCount: number;
}

export default function StudentProgressScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    studentID: string;
    studentName: string;
    classID: string;
  }>();

  const { studentID, studentName, classID } = params;
  const [summary, setSummary] = useState<StudentProgressSummary | null>(null);
  const [modules, setModules] = useState<LessonModule[]>([]);
  const [organizedData, setOrganizedData] = useState<OrganizedData[]>([]);
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (studentID && classID) {
      fetchProgressData();
    }
  }, [studentID, classID]);

  const fetchProgressData = async () => {
    if (!studentID || !classID || !studentName) return;

    try {
      setLoading(true);

      // Fetch student progress summary
      const progressSummary = await getStudentProgressSummary(
        studentID,
        studentName,
        classID
      );
      setSummary(progressSummary);

      // Fetch all lesson modules
      const lessonModules = await getLessonModulesByClass(classID);
      setModules(lessonModules);

      // Fetch all sub-lessons and organize hierarchically
      const organized = await organizeDataHierarchically(lessonModules, classID, progressSummary);
      setOrganizedData(organized);

      // Expand first lesson by default
      if (organized.length > 0 && expandedLessons.size === 0) {
        setExpandedLessons(new Set([organized[0].lesson.id]));
      }
    } catch (error) {
      console.error('Error fetching progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProgressData();
    setRefreshing(false);
  };

  // Organize data hierarchically: Lessons → Sub-lessons → Activities
  const organizeDataHierarchically = async (
    allModules: LessonModule[],
    classID: string,
    progressSummary: StudentProgressSummary
  ): Promise<OrganizedData[]> => {
    const organized: OrganizedData[] = [];

    // Group modules by sub-lesson ID
    const modulesBySubLesson = new Map<string, LessonModule[]>();
    const legacyModules: LessonModule[] = [];

    allModules.forEach((module) => {
      if (module.subLessonID) {
        if (!modulesBySubLesson.has(module.subLessonID)) {
          modulesBySubLesson.set(module.subLessonID, []);
        }
        modulesBySubLesson.get(module.subLessonID)!.push(module);
      } else {
        legacyModules.push(module);
      }
    });

    // Sort modules within each sub-lesson
    modulesBySubLesson.forEach((modules, subLessonID) => {
      modules.sort((a, b) => {
        if (a.subLessonOrder !== undefined && b.subLessonOrder !== undefined) {
          return a.subLessonOrder - b.subLessonOrder;
        }
        return (a.sequenceOrder || 0) - (b.sequenceOrder || 0);
      });
    });

    // Group sub-lessons by topic category
    const subLessonsByTopic = new Map<string, SubLesson[]>();

    // Fetch sub-lessons for each topic in the curriculum
    for (const lesson of FIXED_CURRICULUM) {
      const subLessons = await getSubLessonsByTopic(classID, lesson.id);
      if (subLessons.length > 0) {
        subLessonsByTopic.set(lesson.id, subLessons);
      }
    }

    // Build organized structure
    for (const lesson of FIXED_CURRICULUM) {
      const subLessons = subLessonsByTopic.get(lesson.id) || [];
      if (subLessons.length === 0 && legacyModules.filter(m => m.topicCategory === lesson.id).length === 0) {
        continue; // Skip lessons with no sub-lessons or modules
      }

      const lessonSubLessons: OrganizedData['subLessons'] = [];

      // Process sub-lessons
      for (const subLesson of subLessons) {
        const subLessonModules = modulesBySubLesson.get(subLesson.id) || [];
        if (subLessonModules.length === 0) continue;

        const { completedCount, totalCount } = calculateSubLessonProgress(
          subLessonModules,
          progressSummary
        );

        lessonSubLessons.push({
          subLesson,
          modules: subLessonModules,
          completedCount,
          totalCount,
        });
      }

      // Process legacy modules (modules without sub-lesson ID) for this topic
      const topicLegacyModules = legacyModules.filter(m => m.topicCategory === lesson.id);
      if (topicLegacyModules.length > 0) {
        const { completedCount, totalCount } = calculateSubLessonProgress(
          topicLegacyModules,
          progressSummary
        );

        // Create a virtual sub-lesson for legacy modules
        lessonSubLessons.push({
          subLesson: {
            id: '__legacy__',
            classID,
            topicCategory: lesson.id,
            title: 'Activities',
            content: '',
            order: 999,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          } as SubLesson,
          modules: topicLegacyModules,
          completedCount,
          totalCount,
        });
      }

      if (lessonSubLessons.length > 0) {
        const lessonCompletedCount = lessonSubLessons.reduce((sum, sl) => sum + sl.completedCount, 0);
        const lessonTotalCount = lessonSubLessons.reduce((sum, sl) => sum + sl.totalCount, 0);

        organized.push({
          lesson,
          subLessons: lessonSubLessons,
          completedCount: lessonCompletedCount,
          totalCount: lessonTotalCount,
        });
      }
    }

    return organized;
  };

  // Calculate progress for a sub-lesson
  const calculateSubLessonProgress = (
    subLessonModules: LessonModule[],
    progressSummary: StudentProgressSummary
  ): { completedCount: number; totalCount: number } => {
    const totalCount = subLessonModules.length;
    let completedCount = 0;

    subLessonModules.forEach((module) => {
      const moduleProgress = progressSummary.progress.find((p) => p.moduleID === module.id);
      if (moduleProgress?.status === 'completed') {
        completedCount++;
      }
    });

    return { completedCount, totalCount };
  };

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

  const formatDate = (timestamp: Timestamp | null): string => {
    if (!timestamp) return 'Never';
    const date = timestamp.toDate();
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const toggleLesson = (lessonId: string) => {
    const newExpanded = new Set(expandedLessons);
    if (newExpanded.has(lessonId)) {
      newExpanded.delete(lessonId);
    } else {
      newExpanded.add(lessonId);
    }
    setExpandedLessons(newExpanded);
  };

  const handleSubLessonPress = (subLessonData: { subLesson: SubLesson; modules: LessonModule[] }, lessonColor: string, lessonTitle: string) => {
    router.push({
      pathname: '/(teacher)/student-progress/[subLessonId]',
      params: {
        subLessonId: subLessonData.subLesson.id,
        studentID: studentID || '',
        studentName: studentName || '',
        classID: classID || '',
        lessonTitle: lessonTitle,
        lessonColor: lessonColor,
      },
    });
  };

  // Helper to convert hex color to rgba with opacity
  const hexToRgba = (hex: string, opacity: number): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return hex;
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary[500]} />
      </View>
    );
  }

  if (!summary) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.emptyContainer}>
          <Heading level="h4" style={styles.emptyText}>
            No progress data found
          </Heading>
        </View>
      </SafeAreaView>
    );
  }

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
                {studentName}'s Progress
              </Heading>
            </View>
            <View style={styles.headerSpacer} />
          </View>
        </View>
        {/* Summary Statistics */}
        <View style={[styles.section, { paddingHorizontal: theme.spacing[6] }]}>
          <View style={styles.statsGrid}>
            <StatsCard
              icon="checkmark-circle"
              label="Completed"
              value={`${summary.completedModules}/${summary.totalModules}`}
              color={theme.colors.success[500]}
            />
            <StatsCard
              icon="star"
              label="Average Score"
              value={summary.averageScore.toFixed(1)}
              color={theme.colors.warning[500]}
            />
            <StatsCard
              icon="trending-up"
              label="Completion Rate"
              value={`${Math.round(summary.completionRate)}%`}
              color={theme.colors.secondary.blue[500]}
            />
          </View>
        </View>

        {/* Overall Progress */}
        <View style={[styles.section, { paddingHorizontal: theme.spacing[6] }]}>
          <Body size="medium" style={styles.sectionLabel}>
            Overall Progress
          </Body>
          <Card variant="elevated" padding="medium" style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Body size="small" style={styles.progressLabel}>
                {summary.completedModules} of {summary.totalModules} modules completed
              </Body>
              <Body size="small" style={styles.progressValue}>
                {Math.round(summary.completionRate)}%
              </Body>
            </View>
            <ProgressBar
              progress={summary.completionRate / 100}
              color={theme.colors.primary[500]}
              height={12}
            />
          </Card>
        </View>

        {/* Hierarchical Lesson Progress */}
        <View style={[styles.section, { paddingHorizontal: theme.spacing[6] }]}>
          <Body size="medium" style={styles.sectionLabel}>
            Lessons & Activities
          </Body>
          {organizedData.length === 0 ? (
            <Card variant="elevated" padding="large" style={styles.emptyCard}>
              <Body size="medium" style={styles.emptyText}>
                No lesson modules available yet.
              </Body>
            </Card>
          ) : (
            <View style={styles.lessonsList}>
              {organizedData.map((lessonData) => {
                const isExpanded = expandedLessons.has(lessonData.lesson.id);
                const progressPercentage =
                  lessonData.totalCount > 0
                    ? (lessonData.completedCount / lessonData.totalCount) * 100
                    : 0;

                return (
                  <Card
                    key={lessonData.lesson.id}
                    variant="elevated"
                    padding="none"
                    style={styles.lessonCard}
                  >
                    {/* Lesson Header */}
                    <TouchableOpacity
                      onPress={() => toggleLesson(lessonData.lesson.id)}
                      activeOpacity={0.7}
                      style={[
                        styles.lessonHeader,
                        { backgroundColor: lessonData.lesson.color },
                      ]}
                    >
                      <View style={styles.lessonHeaderContent}>
                        <View
                          style={[
                            styles.lessonIconContainer,
                            { backgroundColor: 'rgba(255, 255, 255, 0.3)' },
                          ]}
                        >
                          <Ionicons name="book" size={24} color="#ffffff" />
                        </View>
                        <View style={styles.lessonHeaderText}>
                          <Heading
                            level="h4"
                            style={{ color: '#ffffff', marginBottom: 4 }}
                          >
                            {lessonData.lesson.title}
                          </Heading>
                          <Body size="small" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                            {lessonData.completedCount} of {lessonData.totalCount} activities completed
                          </Body>
                        </View>
                        <View style={styles.lessonHeaderRight}>
                          <Ionicons
                            name={isExpanded ? 'chevron-up' : 'chevron-down'}
                            size={24}
                            color="#ffffff"
                          />
                        </View>
                      </View>
                      <View style={styles.lessonProgressBar}>
                        <View
                          style={[
                            styles.lessonProgressFill,
                            {
                              width: `${progressPercentage}%`,
                              backgroundColor: '#ffffff',
                            },
                          ]}
                        />
                      </View>
                    </TouchableOpacity>

                    {/* Sub-lessons (collapsible) */}
                    {isExpanded && (
                      <View style={styles.subLessonsContainer}>
                        {lessonData.subLessons.map((subLessonData) => {
                          const subLessonProgressPercentage =
                            subLessonData.totalCount > 0
                              ? (subLessonData.completedCount / subLessonData.totalCount) * 100
                              : 0;

                          return (
                            <TouchableOpacity
                              key={subLessonData.subLesson.id}
                              onPress={() => handleSubLessonPress(subLessonData, lessonData.lesson.color, lessonData.lesson.title)}
                              activeOpacity={0.7}
                            >
                              <Card
                                variant="elevated"
                                padding="large"
                                style={[
                                  styles.subLessonCard,
                                  {
                                    borderLeftWidth: 6,
                                    borderLeftColor: lessonData.lesson.color,
                                    backgroundColor: hexToRgba(lessonData.lesson.color, 0.08),
                                    borderWidth: 1,
                                    borderColor: hexToRgba(lessonData.lesson.color, 0.2),
                                  },
                                ]}
                              >
                                <View style={styles.subLessonHeader}>
                                  <View style={styles.subLessonInfo}>
                                    <Heading level="h4" style={styles.subLessonTitle}>
                                      {subLessonData.subLesson.title}
                                    </Heading>
                                    <View style={styles.subLessonProgressRow}>
                                      <Body size="small" style={styles.subLessonProgressText}>
                                        {subLessonData.completedCount} / {subLessonData.totalCount} activities completed
                                      </Body>
                                      <View style={styles.subLessonProgressBarContainer}>
                                        <View
                                          style={[
                                            styles.subLessonProgressBar,
                                            { backgroundColor: theme.colors.gray[200] },
                                          ]}
                                        >
                                          <View
                                            style={[
                                              styles.subLessonProgressFill,
                                              {
                                                width: `${subLessonProgressPercentage}%`,
                                                backgroundColor: lessonData.lesson.color,
                                              },
                                            ]}
                                          />
                                        </View>
                                      </View>
                                    </View>
                                  </View>
                                  <Ionicons
                                    name="chevron-forward"
                                    size={24}
                                    color={theme.colors.gray[500]}
                                  />
                                </View>
                              </Card>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
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
  section: {
    marginBottom: theme.spacing[6],
  },
  sectionLabel: {
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing[3],
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[3],
  },
  progressCard: {
    marginBottom: 0,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing[3],
  },
  progressLabel: {
    color: theme.colors.text.secondary,
  },
  progressValue: {
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  modulesList: {
    gap: theme.spacing[3],
  },
  moduleCard: {
    marginBottom: 0,
  },
  moduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing[3],
  },
  moduleInfo: {
    flex: 1,
  },
  moduleTitle: {
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
  },
  moduleMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[3],
    marginTop: theme.spacing[1],
  },
  moduleType: {
    color: theme.colors.text.tertiary,
    textTransform: 'uppercase',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[1],
  },
  scoreText: {
    color: theme.colors.text.secondary,
  },
  completedBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.spacing[2],
    marginRight: theme.spacing[1],
  },
  moduleProgress: {
    marginTop: theme.spacing[2],
  },
  moduleStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[4],
    marginBottom: theme.spacing[2],
  },
  moduleStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[1],
  },
  moduleStatText: {
    color: theme.colors.text.secondary,
  },
  lastAttempt: {
    color: theme.colors.text.tertiary,
    marginTop: theme.spacing[1],
  },
  notStarted: {
    color: theme.colors.text.tertiary,
    fontStyle: 'italic',
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing[6],
  },
  emptyText: {
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  lessonsList: {
    gap: theme.spacing[4],
  },
  lessonCard: {
    marginBottom: 0,
    overflow: 'hidden',
  },
  lessonHeader: {
    padding: theme.spacing[4],
  },
  lessonHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing[3],
  },
  lessonIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing[3],
  },
  lessonHeaderText: {
    flex: 1,
  },
  lessonHeaderRight: {
    marginLeft: theme.spacing[2],
  },
  lessonProgressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  lessonProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  subLessonsContainer: {
    padding: theme.spacing[4],
    gap: theme.spacing[4],
  },
  subLessonCard: {
    marginBottom: 0,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  subLessonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subLessonInfo: {
    flex: 1,
  },
  subLessonTitle: {
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[3],
    fontSize: 18,
  },
  subLessonProgressRow: {
    flexDirection: 'column',
    gap: theme.spacing[2],
  },
  subLessonProgressText: {
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[1],
  },
  subLessonProgressBarContainer: {
    width: '100%',
  },
  subLessonProgressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  subLessonProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
});

