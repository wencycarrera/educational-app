import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/hooks/useAuth';
import { Heading } from '../../src/components/ui/Heading';
import { Body } from '../../src/components/ui/Body';
import { Card } from '../../src/components/ui/Card';
import { ProgressChart } from '../../src/components/teacher/ProgressChart';
import { StatsCard } from '../../src/components/teacher/StatsCard';
import { theme } from '../../src/config/theme';
import { getProgressStats, getClassProgress } from '../../src/services/progress.service';
import { getLessonModulesByClass, LessonModule } from '../../src/services/lesson.service';
import { getClassroomById, getClassroomsByTeacher, getStudentsByClass } from '../../src/services/classroom.service';
import { ProgressStats, StudentProgress } from '../../src/types/progress';

export default function ProgressAnalyticsScreen() {
  const router = useRouter();
  const { user, userData } = useAuth();
  const params = useLocalSearchParams<{ classID?: string }>();
  const [classID, setClassID] = useState<string | null>(params.classID || null);

  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [modules, setModules] = useState<LessonModule[]>([]);
  const [classProgress, setClassProgress] = useState<StudentProgress[]>([]);
  const [enrolledStudentIDs, setEnrolledStudentIDs] = useState<Set<string>>(new Set());
  const [classroomName, setClassroomName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // If no classID in params, get the first classroom
    if (!classID && user && userData && userData.role === 'teacher') {
      const fetchFirstClassroom = async () => {
        try {
          const classrooms = await getClassroomsByTeacher(user.uid);
          if (classrooms.length > 0) {
            setClassID(classrooms[0].id);
          }
        } catch (error) {
          console.error('Error fetching classrooms:', error);
        }
      };
      fetchFirstClassroom();
    } else if (classID) {
      fetchAnalyticsData();
    }
  }, [classID, user, userData]);

  useEffect(() => {
    if (classID) {
      fetchAnalyticsData();
    }
  }, [classID]);

  const fetchAnalyticsData = async () => {
    if (!classID) return;

    try {
      setLoading(true);

      // Fetch classroom info
      const classroom = await getClassroomById(classID);
      if (classroom) {
        setClassroomName(classroom.className);
      }

      // Fetch stats
      const classStats = await getProgressStats(classID);
      setStats(classStats);

      // Fetch modules
      const lessonModules = await getLessonModulesByClass(classID);
      setModules(lessonModules);

      // Fetch enrolled students to filter progress
      const students = await getStudentsByClass(classID);
      const studentIDSet = new Set(students.map(s => s.studentID));
      setEnrolledStudentIDs(studentIDSet);

      // Fetch all progress
      const progress = await getClassProgress(classID);
      setClassProgress(progress);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAnalyticsData();
    setRefreshing(false);
  };

  // Calculate completion rate per module
  const getModuleCompletionData = () => {
    if (modules.length === 0) return [];

    return modules.map((module) => {
      const moduleProgress = classProgress.filter((p) => p.moduleID === module.id);
      const completed = moduleProgress.filter((p) => p.status === 'completed').length;
      const totalStudents = stats?.totalStudents ?? 0;
      const completionRate = totalStudents > 0 ? (completed / totalStudents) * 100 : 0;

      return {
        label: module.title.length > 15 ? module.title.substring(0, 15) + '...' : module.title,
        value: Math.round(completionRate),
        color: theme.colors.primary[500],
      };
    });
  };

  // Calculate average score per module
  const getModuleScoreData = () => {
    if (modules.length === 0) return [];

    return modules.map((module) => {
      const moduleProgress = classProgress.filter(
        (p) => p.moduleID === module.id && p.status === 'completed'
      );
      
      if (moduleProgress.length === 0) {
        return {
          label: module.title.length > 15 ? module.title.substring(0, 15) + '...' : module.title,
          value: 0,
          color: theme.colors.gray[400],
        };
      }

      const totalScore = moduleProgress.reduce((sum, p) => {
        const scoreForAverage = p.bestScore ?? p.score;
        return sum + scoreForAverage;
      }, 0);
      const avgScore = totalScore / moduleProgress.length;

      return {
        label: module.title.length > 15 ? module.title.substring(0, 15) + '...' : module.title,
        value: Math.round(avgScore),
        color: theme.colors.success[500],
      };
    });
  };

  // Calculate on-track students (completion rate >= 50%)
  // Only counts students who are currently enrolled in the class
  // Uses total modules in class as denominator (not just modules with progress records)
  const getOnTrackStudents = () => {
    const totalModules = modules.length;
    if (totalModules === 0) return 0;

    // Use a Set per student to track unique completed module IDs
    const studentCompletedModules: Record<string, Set<string>> = {};
    classProgress.forEach((progress) => {
      // Only count progress from students who are currently enrolled
      if (!enrolledStudentIDs.has(progress.studentID)) {
        return;
      }
      if (progress.status === 'completed') {
        if (!studentCompletedModules[progress.studentID]) {
          studentCompletedModules[progress.studentID] = new Set();
        }
        studentCompletedModules[progress.studentID].add(progress.moduleID);
      }
    });

    // Calculate completion rates based on total modules in class
    // For each enrolled student, calculate their completion rate
    const onTrack: Array<{ studentID: string; completionRate: number }> = [];
    enrolledStudentIDs.forEach((studentID) => {
      const completedModuleSet = studentCompletedModules[studentID] || new Set();
      const completedCount = completedModuleSet.size;
      const completionRate = (completedCount / totalModules) * 100;
      if (completionRate >= 50) {
        onTrack.push({ studentID, completionRate });
      }
    });

    return onTrack.length;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary[500]} />
      </View>
    );
  }

  if (!classID) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
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
                  Class Analytics
                </Heading>
                <Body size="small" style={{ color: theme.colors.text.secondary, marginTop: 4 }}>
                  View detailed analytics and insights
                </Body>
              </View>
              <View style={styles.headerSpacer} />
            </View>
          </View>
          <View style={styles.emptyContainer}>
            <Heading level="h4" style={styles.emptyText}>
              No Classroom Selected
            </Heading>
            <Body size="medium" style={styles.emptySubtext}>
              Please select a classroom from the dashboard.
            </Body>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!stats) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
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
                  Class Analytics
                </Heading>
                <Body size="small" style={{ color: theme.colors.text.secondary, marginTop: 4 }}>
                  View detailed analytics and insights
                </Body>
              </View>
              <View style={styles.headerSpacer} />
            </View>
          </View>
          <View style={styles.emptyContainer}>
            <Heading level="h4" style={styles.emptyText}>
              No analytics data available
            </Heading>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const completionData = getModuleCompletionData();
  const scoreData = getModuleScoreData();
  const onTrackCount = getOnTrackStudents();

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
                Class Analytics
              </Heading>
              {classroomName && (
                <Body size="small" style={{ color: theme.colors.text.secondary, marginTop: 4 }} numberOfLines={1}>
                  {classroomName}
                </Body>
              )}
            </View>
            <View style={styles.headerSpacer} />
          </View>
        </View>
        {/* Key Metrics */}
        <View style={[styles.section, { paddingHorizontal: theme.spacing[6] }]}>
          <Body size="medium" style={styles.sectionLabel}>
            Key Metrics
          </Body>
          <View style={styles.statsGrid}>
            <View style={styles.statsRow}>
              <StatsCard
                icon="people"
                label="Total Students"
                value={stats.totalStudents}
                color={theme.colors.secondary.blue[500]}
              />
              <StatsCard
                icon="trending-up"
                label="Completion Rate"
                value={`${Math.round(stats.completionRate)}%`}
                color={theme.colors.success[500]}
              />
            </View>
            <View style={styles.statsRow}>
              <StatsCard
                icon="star"
                label="Average Score"
                value={stats.averageScore.toFixed(1)}
                color={theme.colors.warning[500]}
              />
              <StatsCard
                icon="checkmark-circle"
                label="On Track"
                value={onTrackCount}
                color={theme.colors.success[500]}
              />
            </View>
          </View>
        </View>

        {/* Completion Rate Chart */}
        {completionData.length > 0 && (
          <View style={[styles.section, { paddingHorizontal: theme.spacing[6] }]}>
            <View style={styles.chartWrapper}>
              <ProgressChart
                title="Completion Rate by Module"
                data={completionData}
                maxValue={100}
              />
            </View>
          </View>
        )}

        {/* Average Score Chart */}
        {scoreData.length > 0 && (
          <View style={[styles.section, { paddingHorizontal: theme.spacing[6] }]}>
            <View style={styles.chartWrapper}>
              <ProgressChart
                title="Average Score by Module"
                data={scoreData}
                maxValue={100}
              />
            </View>
          </View>
        )}

        {/* Performance Summary */}
        <View style={[styles.section, { paddingHorizontal: theme.spacing[6] }]}>
          <Body size="medium" style={styles.sectionLabel}>
            Performance Summary
          </Body>
          <Card variant="elevated" padding="medium" style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Body size="medium" style={styles.summaryLabel} numberOfLines={2}>
                Total Modules Created
              </Body>
              <Body size="medium" style={styles.summaryValue}>
                {stats.totalModules}
              </Body>
            </View>
            <View style={styles.summaryRow}>
              <Body size="medium" style={styles.summaryLabel} numberOfLines={2}>
                Completed Modules
              </Body>
              <Body size="medium" style={styles.summaryValue}>
                {stats.completedModules}
              </Body>
            </View>
            <View style={styles.summaryRow}>
              <Body size="medium" style={styles.summaryLabel} numberOfLines={2}>
                Average Time Spent
              </Body>
              <Body size="medium" style={styles.summaryValue}>
                {Math.round(stats.averageTimeSpent / 60)} min
              </Body>
            </View>
            {onTrackCount > 0 && stats.totalStudents > 0 && (
              <View style={[styles.summaryRow, styles.alertRow]}>
                <Body size="medium" style={styles.alertText} numberOfLines={3}>
                  {onTrackCount} out of {stats.totalStudents} student{stats.totalStudents === 1 ? '' : 's'} {onTrackCount === 1 ? 'is' : 'are'} on track with 50% or more completion
                </Body>
              </View>
            )}
          </Card>
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
    gap: theme.spacing[3],
  },
  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing[3],
    marginBottom: theme.spacing[3],
  },
  chartWrapper: {
    overflow: 'hidden',
  },
  summaryCard: {
    marginBottom: 0,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[200],
    minHeight: 44,
  },
  summaryLabel: {
    color: theme.colors.text.secondary,
    flex: 1,
    flexShrink: 1,
    marginRight: theme.spacing[3],
  },
  summaryValue: {
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.semibold,
    flexShrink: 0,
  },
  alertRow: {
    marginTop: theme.spacing[2],
    paddingTop: theme.spacing[3],
    borderTopWidth: 1,
    borderTopColor: theme.colors.success[200],
    borderBottomWidth: 0,
  },
  alertText: {
    color: theme.colors.success[600],
    flex: 1,
    textAlign: 'center',
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
    marginBottom: theme.spacing[2],
  },
  emptySubtext: {
    color: theme.colors.text.tertiary,
    textAlign: 'center',
  },
});

