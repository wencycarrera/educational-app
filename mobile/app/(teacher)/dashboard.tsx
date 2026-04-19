import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/hooks/useAuth';
import { Heading } from '../../src/components/ui/Heading';
import { Body } from '../../src/components/ui/Body';
import { StatsCard } from '../../src/components/teacher/StatsCard';
import { Card } from '../../src/components/ui/Card';
import { theme } from '../../src/config/theme';
import { getClassroomsByTeacher } from '../../src/services/classroom.service';
import { getProgressStats } from '../../src/services/progress.service';
import { getLessonModulesByClass } from '../../src/services/lesson.service';
import { Classroom } from '../../src/services/classroom.service';

export default function TeacherDashboard() {
  const router = useRouter();
  const { user, userData, loading: authLoading } = useAuth();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalModules: 0,
    completedModules: 0,
    averageScore: 0,
    completionRate: 0,
    averageTimeSpent: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Get teacher profile
  const teacherProfile =
    userData && userData.role === 'teacher' ? userData.teacherProfile : null;

  // Fetch classrooms and stats
  useEffect(() => {
    if (user && userData && userData.role === 'teacher') {
      fetchDashboardData();
    }
  }, [user, userData]);

  const fetchDashboardData = async () => {
    if (!user || !userData || userData.role !== 'teacher') return;

    try {
      setLoading(true);
      const teacherClassrooms = await getClassroomsByTeacher(user.uid);

      if (teacherClassrooms.length > 0) {
        setClassrooms(teacherClassrooms);
        const firstClassroom = teacherClassrooms[0];
        setSelectedClassroom(firstClassroom);

        // Fetch stats for the first classroom
        try {
          const classroomStats = await getProgressStats(firstClassroom.id);
          setStats(classroomStats);
        } catch (error) {
          console.error('Error fetching stats:', error);
        }
      } else {
        setClassrooms([]);
        setSelectedClassroom(null);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const handleNavigateToRoster = () => {
    if (selectedClassroom) {
      router.push({
        pathname: '/(teacher)/class-roster',
        params: { classID: selectedClassroom.id },
      });
    }
  };

  const handleNavigateToAnalytics = () => {
    if (selectedClassroom) {
      router.push({
        pathname: '/(teacher)/progress-analytics',
        params: { classID: selectedClassroom.id },
      });
    }
  };

  const handleNavigateToFeedback = () => {
    router.push('/(teacher)/feedback');
  };

  const handleNavigateToCreateActivity = () => {
    if (selectedClassroom) {
      router.push({
        pathname: '/(teacher)/create-activity',
        params: { classID: selectedClassroom.id },
      });
    }
  };

  const handleNavigateToManageSubLessons = () => {
    if (selectedClassroom) {
      router.push({
        pathname: '/(teacher)/manage-sublessons',
        params: { classID: selectedClassroom.id },
      });
    }
  };

  const handleNavigateToMaterials = () => {
    if (selectedClassroom) {
      router.push({
        pathname: '/(teacher)/materials',
        params: { classID: selectedClassroom.id },
      });
    }
  };

  const handleNavigateToCreateClassroom = () => {
    router.push('/(teacher)/create-classroom');
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (authLoading || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary[500]} />
      </View>
    );
  }

  if (!teacherProfile) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.emptyContainer}>
          <Heading level="h3" style={styles.emptyText}>
            Teacher profile not found
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Body size="medium" style={styles.greeting}>
              {getGreeting()},
            </Body>
            <Heading level="h2" style={styles.teacherName}>
              {teacherProfile.name}
            </Heading>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(teacher)/profile')}
            activeOpacity={0.7}
            style={styles.profileButton}
          >
            <Ionicons
              name="person-circle"
              size={32}
              color={theme.colors.primary[500]}
            />
          </TouchableOpacity>
        </View>

        {/* Classroom Selector */}
        {classrooms.length > 0 && (
          <View style={styles.section}>
            <Body size="medium" style={styles.sectionLabel}>
              Active Classroom
            </Body>
            <Card variant="elevated" padding="medium" style={styles.classroomCard}>
              <View style={styles.classroomInfo}>
                <View style={styles.classroomIcon}>
                  <Ionicons
                    name="school"
                    size={24}
                    color={theme.colors.primary[500]}
                  />
                </View>
                <View style={styles.classroomDetails}>
                  <Heading level="h4" style={styles.classroomName}>
                    {selectedClassroom?.className || 'No classroom'}
                  </Heading>
                  <Body size="small" style={styles.classCode}>
                    Code: {selectedClassroom?.classCode || 'N/A'}
                  </Body>
                </View>
              </View>
            </Card>
          </View>
        )}

        {/* Statistics Cards */}
        {selectedClassroom && (
          <View style={styles.section}>
            <Body size="medium" style={styles.sectionLabel}>
              Overview
            </Body>
            <View style={styles.statsGrid}>
              <StatsCard
                icon="people"
                label="Total Students"
                value={stats.totalStudents}
                color={theme.colors.secondary.blue[500]}
              />
              <StatsCard
                icon="book"
                label="Lesson Modules"
                value={stats.totalModules}
                color={theme.colors.secondary.purple[500]}
              />
              <StatsCard
                icon="checkmark-circle"
                label="Completion Rate"
                value={`${Math.round(stats.completionRate)}%`}
                color={theme.colors.success[500]}
              />
              <StatsCard
                icon="star"
                label="Average Score"
                value={stats.averageScore.toFixed(1)}
                color={theme.colors.warning[500]}
              />
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Body size="medium" style={styles.sectionLabel}>
            Quick Actions
          </Body>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              onPress={handleNavigateToRoster}
              activeOpacity={0.8}
              style={styles.actionCard}
              disabled={!selectedClassroom}
            >
              <Card variant="elevated" padding="large" style={styles.actionCardContent}>
                <View style={[styles.actionIconContainer, { backgroundColor: `${theme.colors.primary[500]}15` }]}>
                  <Ionicons
                    name="people"
                    size={32}
                    color={theme.colors.primary[500]}
                  />
                </View>
                <Body
                  size="medium"
                  style={styles.actionLabel}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  Class Roster
                </Body>
              </Card>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleNavigateToAnalytics}
              activeOpacity={0.8}
              style={styles.actionCard}
              disabled={!selectedClassroom}
            >
              <Card variant="elevated" padding="large" style={styles.actionCardContent}>
                <View style={[styles.actionIconContainer, { backgroundColor: `${theme.colors.secondary.blue[500]}15` }]}>
                  <Ionicons
                    name="analytics"
                    size={32}
                    color={theme.colors.secondary.blue[500]}
                  />
                </View>
                <Body
                  size="medium"
                  style={styles.actionLabel}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  Analytics
                </Body>
              </Card>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleNavigateToCreateActivity}
              activeOpacity={0.8}
              style={styles.actionCard}
              disabled={!selectedClassroom}
            >
              <Card variant="elevated" padding="large" style={styles.actionCardContent}>
                <View style={[styles.actionIconContainer, { backgroundColor: `${theme.colors.success[500]}15` }]}>
                  <Ionicons
                    name="add-circle"
                    size={32}
                    color={theme.colors.success[500]}
                  />
                </View>
                <Body
                  size="medium"
                  style={styles.actionLabel}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  Create Activity
                </Body>
              </Card>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleNavigateToManageSubLessons}
              activeOpacity={0.8}
              style={styles.actionCard}
              disabled={!selectedClassroom}
            >
              <Card variant="elevated" padding="large" style={styles.actionCardContent}>
                <View style={[styles.actionIconContainer, { backgroundColor: `${theme.colors.info[500] || '#3498DB'}15` }]}>
                  <Ionicons
                    name="book"
                    size={32}
                    color={theme.colors.info[500] || '#3498DB'}
                  />
                </View>
                <Body
                  size="medium"
                  style={styles.actionLabel}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  Manage Sub-Lessons
                </Body>
              </Card>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleNavigateToMaterials}
              activeOpacity={0.8}
              style={styles.actionCard}
              disabled={!selectedClassroom}
            >
              <Card variant="elevated" padding="large" style={styles.actionCardContent}>
                <View
                  style={[
                    styles.actionIconContainer,
                    { backgroundColor: `${theme.colors.secondary.green?.[500] || theme.colors.success[500]}15` },
                  ]}
                >
                  <Ionicons
                    name="folder-open"
                    size={32}
                    color={theme.colors.secondary.green?.[500] || theme.colors.success[500]}
                  />
                </View>
                <Body
                  size="medium"
                  style={styles.actionLabel}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  Materials
                </Body>
              </Card>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleNavigateToFeedback}
              activeOpacity={0.8}
              style={styles.actionCard}
            >
              <Card variant="elevated" padding="large" style={styles.actionCardContent}>
                <View style={[styles.actionIconContainer, { backgroundColor: `${theme.colors.secondary.purple[500]}15` }]}>
                  <Ionicons
                    name="chatbubble"
                    size={32}
                    color={theme.colors.secondary.purple[500]}
                  />
                </View>
                <Body
                  size="medium"
                  style={styles.actionLabel}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  Feedback
                </Body>
              </Card>
            </TouchableOpacity>

            {/* Only show New Classroom button if teacher doesn't have a classroom yet */}
            {classrooms.length === 0 && (
              <TouchableOpacity
                onPress={handleNavigateToCreateClassroom}
                activeOpacity={0.8}
                style={styles.actionCard}
              >
                <Card variant="elevated" padding="large" style={styles.actionCardContent}>
                  <View style={[styles.actionIconContainer, { backgroundColor: `${theme.colors.warning[500]}15` }]}>
                    <Ionicons
                      name="add-circle-outline"
                      size={32}
                      color={theme.colors.warning[500]}
                    />
                  </View>
                  <Body
                    size="medium"
                    style={styles.actionLabel}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    New Classroom
                  </Body>
                </Card>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Empty State */}
        {classrooms.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons
              name="school-outline"
              size={64}
              color={theme.colors.gray[400]}
            />
            <Heading level="h4" style={styles.emptyTitle}>
              No Classrooms Yet
            </Heading>
            <Body size="medium" style={styles.emptyText}>
              Create your first classroom to get started!
            </Body>
            <TouchableOpacity
              onPress={handleNavigateToCreateClassroom}
              activeOpacity={0.8}
              style={styles.createButton}
            >
              <View style={styles.createButtonContent}>
                <Ionicons
                  name="add-circle"
                  size={24}
                  color={theme.colors.primary[500]}
                />
                <Body size="medium" style={styles.createButtonText}>
                  Create Classroom
                </Body>
              </View>
            </TouchableOpacity>
          </View>
        )}
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
  header: {
    paddingHorizontal: theme.spacing[6],
    paddingTop: theme.spacing[4],
    paddingBottom: theme.spacing[6],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerContent: {
    flex: 1,
  },
  profileButton: {
    padding: theme.spacing[2],
    marginLeft: theme.spacing[2],
  },
  greeting: {
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[1],
  },
  teacherName: {
    color: theme.colors.primary[700],
  },
  section: {
    paddingHorizontal: theme.spacing[6],
    marginBottom: theme.spacing[6],
  },
  sectionLabel: {
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing[3],
  },
  classroomCard: {
    marginBottom: 0,
  },
  classroomInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  classroomIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing[3],
  },
  classroomDetails: {
    flex: 1,
  },
  classroomName: {
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
  },
  classCode: {
    color: theme.colors.text.secondary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[3],
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[3],
  },
  actionCard: {
    width: '47%',
  },
  actionCardContent: {
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  actionIconContainer: {
    width: 64,
    height: 64,
    borderRadius: theme.borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing[3],
  },
  actionLabel: {
    color: theme.colors.text.primary,
    textAlign: 'center',
    fontWeight: theme.typography.fontWeight.semibold,
    fontSize: theme.typography.fontSize.base,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing[6],
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing[12],
    paddingHorizontal: theme.spacing[6],
  },
  emptyTitle: {
    color: theme.colors.text.primary,
    marginTop: theme.spacing[4],
    marginBottom: theme.spacing[2],
  },
  emptyText: {
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing[6],
  },
  createButton: {
    marginTop: theme.spacing[4],
    borderRadius: theme.borderRadius['2xl'],
    backgroundColor: theme.colors.background.light,
    ...theme.shadows.lg,
    borderWidth: 2,
    borderColor: theme.colors.primary[300],
    overflow: 'hidden',
  },
  createButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing[4],
    paddingHorizontal: theme.spacing[6],
  },
  createButtonText: {
    color: theme.colors.primary[500],
    fontWeight: theme.typography.fontWeight.semibold,
    marginLeft: theme.spacing[2],
  },
});

