import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../src/hooks/useAuth';
import { Heading } from '../../../src/components/ui/Heading';
import { Body } from '../../../src/components/ui/Body';
import { Card } from '../../../src/components/ui/Card';
import { theme } from '../../../src/config/theme';
import { getStudentProgressSummary, getProgressByTopic, getProgressByActivityType, getActivityTimeline } from '../../../src/services/progress.service';
import { getTimeAnalytics, getPerformanceTrends } from '../../../src/services/progress-analytics.service';
import { StudentProgressSummary, TopicProgressSummary, ActivityTypeSummary, ActivityTimelineItem } from '../../../src/types/progress';
import {
  formatDate,
  formatDateTime,
  formatTimeSpent,
  formatActivityType,
  getActivityTypeIcon,
  getScoreColor,
  formatTopicCategory,
  getRelativeTime,
} from '../../../src/utils/report-formatting';

type ReportSection = 'summary' | 'timeline' | 'topics' | 'activities' | 'analytics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ReportsScreen() {
  const router = useRouter();
  const { userData, user } = useAuth();
  const [activeSection, setActiveSection] = useState<ReportSection>('summary');
  const [summary, setSummary] = useState<StudentProgressSummary | null>(null);
  const [topics, setTopics] = useState<TopicProgressSummary[]>([]);
  const [activities, setActivities] = useState<ActivityTypeSummary[]>([]);
  const [timeline, setTimeline] = useState<ActivityTimelineItem[]>([]);
  const [timeAnalytics, setTimeAnalytics] = useState<any>(null);
  const [performanceTrends, setPerformanceTrends] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const studentProfile = userData && userData.role === 'student' ? userData.studentProfile : null;
  const joinedClassID = studentProfile?.joinedClassID;
  const studentID = user?.uid || '';
  const studentName = studentProfile?.name || 'Student';

  const fetchAllReports = useCallback(async () => {
    if (!joinedClassID || !studentID) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      
      // Fetch all data in parallel
      const [summaryData, topicsData, activitiesData, timelineData, timeData, trendsData] = await Promise.all([
        getStudentProgressSummary(studentID, studentName, joinedClassID),
        getProgressByTopic(studentID, joinedClassID),
        getProgressByActivityType(studentID, joinedClassID),
        getActivityTimeline(studentID, joinedClassID, 50), // Load first 50 items
        getTimeAnalytics(studentID, joinedClassID),
        getPerformanceTrends(studentID, joinedClassID),
      ]);

      setSummary(summaryData);
      setTopics(topicsData);
      setActivities(activitiesData);
      setTimeline(timelineData);
      setTimeAnalytics(timeData);
      setPerformanceTrends(trendsData);
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError('Failed to load reports. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [joinedClassID, studentID, studentName]);

  useEffect(() => {
    fetchAllReports();
  }, [fetchAllReports]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAllReports();
  }, [fetchAllReports]);

  const loadMoreTimeline = useCallback(async () => {
    if (loadingMore || !joinedClassID || !studentID) return;
    
    try {
      setLoadingMore(true);
      const moreItems = await getActivityTimeline(studentID, joinedClassID, timeline.length + 50);
      setTimeline(moreItems);
    } catch (err) {
      console.error('Error loading more timeline items:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [timeline.length, joinedClassID, studentID, loadingMore]);

  const renderSectionTab = (section: ReportSection, label: string, icon: string) => {
    const isActive = activeSection === section;
    return (
      <TouchableOpacity
        key={section}
        onPress={() => setActiveSection(section)}
        style={[styles.tab, isActive && styles.tabActive]}
        activeOpacity={0.7}
      >
        <Ionicons
          name={icon as any}
          size={20}
          color={isActive ? theme.colors.primary[700] : theme.colors.gray[500]}
        />
        <Body
          size="small"
          style={{
            color: isActive ? theme.colors.primary[700] : theme.colors.gray[500],
            fontWeight: isActive ? '600' : '400',
            marginLeft: theme.spacing[1],
          }}
        >
          {label}
        </Body>
      </TouchableOpacity>
    );
  };

  const renderSummary = () => {
    if (!summary) return null;

    const totalStars = summary.progress.reduce((sum, p) => sum + (p.starsEarned || 0), 0);
    const totalTimeSpent = summary.progress.reduce((sum, p) => sum + p.timeSpent, 0);

    return (
      <View>
        {/* Enhanced Summary Stats */}
        <Card variant="elevated" padding="large" style={styles.summaryCard}>
          <Heading level="h3" style={{ color: theme.colors.primary[700], marginBottom: theme.spacing[4] }}>
            Overall Progress
          </Heading>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: theme.colors.success[100] }]}>
                <Ionicons name="checkmark-circle" size={32} color={theme.colors.success[600]} />
              </View>
              <Body size="small" style={styles.statLabel}>Completed</Body>
              <Heading level="h4" style={{ color: theme.colors.text.primary }}>
                {summary.completedModules} / {summary.totalModules}
              </Heading>
            </View>
            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: theme.colors.primary[100] }]}>
                <Ionicons name="trophy" size={32} color={theme.colors.primary[600]} />
              </View>
              <Body size="small" style={styles.statLabel}>Average Score</Body>
              <Heading level="h4" style={{ color: theme.colors.text.primary }}>
                {summary.averageScore}%
              </Heading>
            </View>
            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: theme.colors.secondary.blue[100] }]}>
                <Ionicons name="trending-up" size={32} color={theme.colors.secondary.blue[600]} />
              </View>
              <Body size="small" style={styles.statLabel}>Completion Rate</Body>
              <Heading level="h4" style={{ color: theme.colors.text.primary }}>
                {summary.completionRate}%
              </Heading>
            </View>
          </View>
        </Card>

        {/* Additional Metrics */}
        <View style={styles.additionalMetrics}>
          <Card variant="elevated" padding="medium" style={styles.metricCard}>
            <View style={styles.metricContent}>
              <Ionicons name="star" size={24} color={theme.colors.primary[500]} />
              <View style={styles.metricText}>
                <Body size="small" style={styles.metricLabel}>Total Stars</Body>
                <Heading level="h4" style={{ color: theme.colors.text.primary }}>
                  {totalStars.toLocaleString()}
                </Heading>
              </View>
            </View>
          </Card>
          <Card variant="elevated" padding="medium" style={styles.metricCard}>
            <View style={styles.metricContent}>
              <Ionicons name="time" size={24} color={theme.colors.secondary.blue[500]} />
              <View style={styles.metricText}>
                <Body size="small" style={styles.metricLabel}>Total Time</Body>
                <Heading level="h4" style={{ color: theme.colors.text.primary }}>
                  {formatTimeSpent(totalTimeSpent)}
                </Heading>
              </View>
            </View>
          </Card>
        </View>

        {performanceTrends && (
          <Card variant="elevated" padding="large" style={styles.trendsCard}>
            <Heading level="h3" style={{ color: theme.colors.primary[700], marginBottom: theme.spacing[4] }}>
              Performance Insights
            </Heading>
            {performanceTrends.scoreImprovement !== 0 && (
              <View style={styles.insightItem}>
                <Ionicons
                  name={performanceTrends.scoreImprovement > 0 ? 'trending-up' : 'trending-down'}
                  size={20}
                  color={performanceTrends.scoreImprovement > 0 ? theme.colors.success[600] : theme.colors.error[600]}
                />
                <Body size="medium" style={{ marginLeft: theme.spacing[2], flex: 1 }}>
                  Score {performanceTrends.scoreImprovement > 0 ? 'improved' : 'changed'} by{' '}
                  <Text style={{ fontWeight: '600' }}>
                    {Math.abs(performanceTrends.scoreImprovement).toFixed(1)}%
                  </Text>{' '}
                  over time
                </Body>
              </View>
            )}
            {performanceTrends.strengths.length > 0 && (
              <View style={styles.insightItem}>
                <Ionicons name="star" size={20} color={theme.colors.success[600]} />
                <Body size="medium" style={{ marginLeft: theme.spacing[2], flex: 1 }}>
                  <Text style={{ fontWeight: '600' }}>Strengths:</Text> {performanceTrends.strengths.map(formatTopicCategory).join(', ')}
                </Body>
              </View>
            )}
            {performanceTrends.areasForImprovement.length > 0 && (
              <View style={styles.insightItem}>
                <Ionicons name="bulb" size={20} color={theme.colors.warning[600]} />
                <Body size="medium" style={{ marginLeft: theme.spacing[2], flex: 1 }}>
                  <Text style={{ fontWeight: '600' }}>Areas to improve:</Text> {performanceTrends.areasForImprovement.map(formatTopicCategory).join(', ')}
                </Body>
              </View>
            )}
          </Card>
        )}
      </View>
    );
  };

  const renderTimeline = () => {
    if (timeline.length === 0) {
      return (
        <Card variant="outlined" padding="large" style={styles.emptyCard}>
          <Body size="medium" style={styles.emptyText}>
            No activities completed yet.
          </Body>
        </Card>
      );
    }

    return (
      <View>
        {timeline.map((item, index) => (
          <Card key={item.id} variant="elevated" padding="medium" style={styles.timelineItem}>
            <View style={styles.timelineHeader}>
              <View style={styles.timelineLeft}>
                <View style={[styles.activityIcon, { backgroundColor: theme.colors.primary[100] }]}>
                  <Ionicons name={getActivityTypeIcon(item.activityType) as any} size={20} color={theme.colors.primary[600]} />
                </View>
                <View style={styles.timelineContent}>
                  <Body size="medium" style={{ color: theme.colors.text.primary, fontWeight: '600' }}>
                    {item.lessonTitle}
                  </Body>
                  <View style={styles.timelineMeta}>
                    <Body size="small" style={styles.timelineMetaText}>
                      {formatTopicCategory(item.topicCategory)}
                    </Body>
                    <Text style={{ color: theme.colors.gray[400], marginHorizontal: theme.spacing[1] }}>•</Text>
                    <Body size="small" style={styles.timelineMetaText}>
                      {formatActivityType(item.activityType)}
                    </Body>
                  </View>
                </View>
              </View>
              <View style={styles.timelineScore}>
                <Text style={{ fontSize: 18, fontWeight: '600', color: getScoreColor(item.score) }}>
                  {item.score}%
                </Text>
              </View>
            </View>
            <View style={styles.timelineDetails}>
              <View style={styles.timelineDetailItem}>
                <Ionicons name="time-outline" size={16} color={theme.colors.gray[500]} />
                <Body size="small" style={styles.timelineDetailText}>
                  {formatTimeSpent(item.timeSpent)}
                </Body>
              </View>
              <View style={styles.timelineDetailItem}>
                <Ionicons name="repeat-outline" size={16} color={theme.colors.gray[500]} />
                <Body size="small" style={styles.timelineDetailText}>
                  {item.attempts} {item.attempts === 1 ? 'attempt' : 'attempts'}
                </Body>
              </View>
              <View style={styles.timelineDetailItem}>
                <Ionicons name="star-outline" size={16} color={theme.colors.primary[500]} />
                <Body size="small" style={styles.timelineDetailText}>
                  {item.starsEarned} {item.starsEarned === 1 ? 'star' : 'stars'}
                </Body>
              </View>
              <View style={styles.timelineDetailItem}>
                <Body size="small" style={styles.timelineMetaText}>
                  {getRelativeTime(item.lastAttemptAt)}
                </Body>
              </View>
            </View>
          </Card>
        ))}
        {timeline.length >= 50 && (
          <TouchableOpacity
            onPress={loadMoreTimeline}
            disabled={loadingMore}
            style={styles.loadMoreButton}
          >
            {loadingMore ? (
              <ActivityIndicator size="small" color={theme.colors.primary[500]} />
            ) : (
              <Body size="medium" style={{ color: theme.colors.primary[600], fontWeight: '600' }}>
                Load More
              </Body>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderTopics = () => {
    if (topics.length === 0) {
      return (
        <Card variant="outlined" padding="large" style={styles.emptyCard}>
          <Body size="medium" style={styles.emptyText}>
            No topic data available.
          </Body>
        </Card>
      );
    }

    return (
      <View>
        {topics.map((topic) => {
          const progressPercentage = topic.totalModules > 0 ? (topic.completedModules / topic.totalModules) * 100 : 0;
          return (
            <Card key={topic.topicCategory} variant="elevated" padding="large" style={styles.topicCard}>
              <View style={styles.topicHeader}>
                <Heading level="h4" style={{ color: theme.colors.text.primary, flex: 1 }}>
                  {formatTopicCategory(topic.topicCategory)}
                </Heading>
                <Body size="medium" style={{ color: getScoreColor(topic.averageScore), fontWeight: '600' }}>
                  {topic.averageScore}%
                </Body>
              </View>
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBarBackground}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${progressPercentage}%`,
                        backgroundColor: theme.colors.primary[500],
                      },
                    ]}
                  />
                </View>
                <Body size="small" style={styles.progressBarText}>
                  {topic.completedModules} of {topic.totalModules} completed ({topic.completionRate.toFixed(0)}%)
                </Body>
              </View>
              <View style={styles.topicMetrics}>
                <View style={styles.topicMetric}>
                  <Ionicons name="star" size={16} color={theme.colors.primary[500]} />
                  <Body size="small" style={styles.topicMetricText}>
                    {topic.totalStars} stars
                  </Body>
                </View>
                <View style={styles.topicMetric}>
                  <Ionicons name="time" size={16} color={theme.colors.gray[500]} />
                  <Body size="small" style={styles.topicMetricText}>
                    {formatTimeSpent(topic.averageTimeSpent)} avg
                  </Body>
                </View>
              </View>
            </Card>
          );
        })}
      </View>
    );
  };

  const renderActivities = () => {
    if (activities.length === 0) {
      return (
        <Card variant="outlined" padding="large" style={styles.emptyCard}>
          <Body size="medium" style={styles.emptyText}>
            No activity type data available.
          </Body>
        </Card>
      );
    }

    return (
      <View>
        {activities.map((activity) => {
          const progressPercentage = activity.totalModules > 0 ? (activity.completedModules / activity.totalModules) * 100 : 0;
          return (
            <Card key={activity.activityType} variant="elevated" padding="large" style={styles.activityCard}>
              <View style={styles.activityHeader}>
                <View style={[styles.activityIconLarge, { backgroundColor: theme.colors.primary[100] }]}>
                  <Ionicons name={getActivityTypeIcon(activity.activityType) as any} size={28} color={theme.colors.primary[600]} />
                </View>
                <View style={styles.activityContent}>
                  <Heading level="h4" style={{ color: theme.colors.text.primary }}>
                    {formatActivityType(activity.activityType)}
                  </Heading>
                  <Body size="small" style={styles.activityDescription}>
                    {activity.completedModules} of {activity.totalModules} completed
                  </Body>
                </View>
                <Body size="large" style={{ color: getScoreColor(activity.averageScore), fontWeight: '600' }}>
                  {activity.averageScore}%
                </Body>
              </View>
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBarBackground}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${progressPercentage}%`,
                        backgroundColor: theme.colors.primary[500],
                      },
                    ]}
                  />
                </View>
              </View>
              <View style={styles.activityStats}>
                <View style={styles.activityStat}>
                  <Body size="small" style={styles.activityStatLabel}>Total Attempts</Body>
                  <Heading level="h4" style={{ color: theme.colors.text.primary }}>
                    {activity.totalAttempts}
                  </Heading>
                </View>
                <View style={styles.activityStat}>
                  <Body size="small" style={styles.activityStatLabel}>Total Time</Body>
                  <Heading level="h4" style={{ color: theme.colors.text.primary }}>
                    {formatTimeSpent(activity.totalTimeSpent)}
                  </Heading>
                </View>
                <View style={styles.activityStat}>
                  <Body size="small" style={styles.activityStatLabel}>Stars Earned</Body>
                  <Heading level="h4" style={{ color: theme.colors.text.primary }}>
                    {activity.totalStars}
                  </Heading>
                </View>
              </View>
            </Card>
          );
        })}
      </View>
    );
  };

  const renderAnalytics = () => {
    if (!timeAnalytics) return null;

    return (
      <View>
        {/* Time Statistics */}
        <Card variant="elevated" padding="large" style={styles.analyticsCard}>
          <Heading level="h3" style={{ color: theme.colors.primary[700], marginBottom: theme.spacing[4] }}>
            Time Analytics
          </Heading>
          <View style={styles.analyticsGrid}>
            <View style={styles.analyticsItem}>
              <Body size="small" style={styles.analyticsLabel}>Total Learning Time</Body>
              <Heading level="h4" style={{ color: theme.colors.text.primary }}>
                {formatTimeSpent(timeAnalytics.totalTimeSpent)}
              </Heading>
            </View>
            <View style={styles.analyticsItem}>
              <Body size="small" style={styles.analyticsLabel}>Avg per Activity</Body>
              <Heading level="h4" style={{ color: theme.colors.text.primary }}>
                {formatTimeSpent(timeAnalytics.averageTimePerActivity)}
              </Heading>
            </View>
            <View style={styles.analyticsItem}>
              <Body size="small" style={styles.analyticsLabel}>Avg per Completed</Body>
              <Heading level="h4" style={{ color: theme.colors.text.primary }}>
                {formatTimeSpent(timeAnalytics.averageTimePerCompleted)}
              </Heading>
            </View>
          </View>
          {timeAnalytics.mostActiveDay && (
            <View style={styles.insightItem}>
              <Ionicons name="calendar" size={20} color={theme.colors.primary[500]} />
              <Body size="medium" style={{ marginLeft: theme.spacing[2] }}>
                Most active day: <Text style={{ fontWeight: '600' }}>{timeAnalytics.mostActiveDay}</Text>
              </Body>
            </View>
          )}
        </Card>

        {/* Daily Activity */}
        {timeAnalytics.dailyActivity.length > 0 && (
          <View style={styles.dailyActivityContainer}>
            <Heading level="h3" style={{ color: theme.colors.text.primary, marginBottom: theme.spacing[4] }}>
              Daily Activity
            </Heading>
            {timeAnalytics.dailyActivity.slice(0, 7).map((day: any) => (
              <Card key={day.date} variant="elevated" padding="medium" style={styles.dailyActivityItem}>
                <View style={styles.dailyActivityHeader}>
                  <Body size="medium" style={{ color: theme.colors.text.primary, fontWeight: '600' }}>
                    {formatDate(day.dateTimestamp)}
                  </Body>
                  <Body size="medium" style={{ color: theme.colors.primary[600], fontWeight: '600' }}>
                    {day.activityCount} {day.activityCount === 1 ? 'activity' : 'activities'}
                  </Body>
                </View>
                <View style={styles.dailyActivityStats}>
                  <View style={styles.dailyActivityStat}>
                    <Ionicons name="checkmark-circle" size={16} color={theme.colors.success[600]} />
                    <Body size="small" style={styles.dailyActivityStatText}>
                      {day.completedCount} completed
                    </Body>
                  </View>
                  <View style={styles.dailyActivityStat}>
                    <Ionicons name="time" size={16} color={theme.colors.gray[500]} />
                    <Body size="small" style={styles.dailyActivityStatText}>
                      {formatTimeSpent(day.totalTimeSpent)}
                    </Body>
                  </View>
                  <View style={styles.dailyActivityStat}>
                    <Ionicons name="star" size={16} color={theme.colors.primary[500]} />
                    <Body size="small" style={styles.dailyActivityStatText}>
                      {day.starsEarned} stars
                    </Body>
                  </View>
                  {day.averageScore > 0 && (
                    <View style={styles.dailyActivityStat}>
                      <Body size="small" style={{ color: getScoreColor(day.averageScore), fontWeight: '600' }}>
                        {day.averageScore.toFixed(0)}% avg
                      </Body>
                    </View>
                  )}
                </View>
              </Card>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'summary':
        return renderSummary();
      case 'timeline':
        return renderTimeline();
      case 'topics':
        return renderTopics();
      case 'activities':
        return renderActivities();
      case 'analytics':
        return renderAnalytics();
      default:
        return renderSummary();
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary[500]} />
          <Body size="medium" style={styles.loadingText}>
            Loading reports...
          </Body>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !summary) {
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
            />
          }
        >
          {/* Header (mirrors settings.tsx) */}
          <View style={styles.headerContainer}>
            <View style={styles.headerTop}>
              <TouchableOpacity
                onPress={() => router.back()}
                activeOpacity={0.7}
                style={styles.backButton}
              >
                <Ionicons name="arrow-back" size={24} color={theme.colors.gray[700]} />
              </TouchableOpacity>
              <View style={styles.headerTitleContainer}>
                <Heading level="h3" style={{ color: theme.colors.primary[700] }}>
                  Progress Reports
                </Heading>
                <Body size="small" style={styles.headerSubtitle}>
                  View detailed learning progress
                </Body>
              </View>
              <View style={styles.headerSpacer} />
            </View>
          </View>
          <View style={styles.section}>
            <Card variant="outlined" padding="large" style={styles.errorCard}>
              <View style={styles.errorContent}>
                <Ionicons name="alert-circle-outline" size={48} color={theme.colors.error[500]} />
                <Body size="medium" style={styles.errorText}>
                  {error || 'No data available'}
                </Body>
              </View>
            </Card>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header (mirrors settings.tsx) */}
      <View style={styles.headerContainer}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.gray[700]} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Heading level="h3" style={{ color: theme.colors.primary[700] }}>
              Progress Reports
            </Heading>
            <Body size="small" style={styles.headerSubtitle}>
              View detailed learning progress
            </Body>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        {/* Section Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContainer}
        >
          {renderSectionTab('summary', 'Summary', 'stats-chart')}
          {renderSectionTab('timeline', 'Timeline', 'time')}
          {renderSectionTab('topics', 'Topics', 'book')}
          {renderSectionTab('activities', 'Activities', 'game-controller')}
          {renderSectionTab('analytics', 'Analytics', 'analytics')}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary[500]}
          />
        }
      >
        {renderContent()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: theme.colors.text.secondary,
    marginTop: theme.spacing[4],
  },
  headerContainer: {
    backgroundColor: theme.colors.background.light,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[200],
    paddingBottom: theme.spacing[2],
    paddingTop: theme.spacing[6],
    paddingHorizontal: theme.spacing[6],
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing[4],
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background.primary,
    marginRight: theme.spacing[4],
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerSubtitle: {
    color: theme.colors.text.secondary,
    marginTop: 4,
  },
  headerSpacer: {
    width: 40,
  },
  section: {
    marginBottom: theme.spacing[6],
    paddingHorizontal: theme.spacing[6],
  },
  tabsContainer: {
    paddingHorizontal: theme.spacing[4],
    paddingBottom: theme.spacing[2],
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing[2],
    paddingHorizontal: theme.spacing[3],
    marginRight: theme.spacing[2],
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.gray[100],
  },
  tabActive: {
    backgroundColor: theme.colors.primary[100],
  },
  scrollContent: {
    padding: theme.spacing[4],
    paddingBottom: theme.spacing[10],
    paddingTop: theme.spacing[2],
  },
  errorCard: {
    backgroundColor: theme.colors.background.light,
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  errorContent: {
    alignItems: 'center',
  },
  errorText: {
    color: theme.colors.error[600],
    textAlign: 'center',
    marginTop: theme.spacing[4],
  },
  emptyCard: {
    backgroundColor: theme.colors.background.light,
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
  },
  emptyText: {
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: theme.colors.background.light,
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: theme.spacing[4],
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  statItem: {
    alignItems: 'center',
    minWidth: 100,
    marginBottom: theme.spacing[4],
  },
  statIconContainer: {
    width: 64,
    height: 64,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing[2],
  },
  statLabel: {
    color: theme.colors.text.secondary,
    marginTop: theme.spacing[2],
    fontWeight: theme.typography.fontWeight.medium,
  },
  additionalMetrics: {
    flexDirection: 'row',
    gap: theme.spacing[3],
    marginBottom: theme.spacing[4],
  },
  metricCard: {
    flex: 1,
    backgroundColor: theme.colors.background.light,
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  metricContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricText: {
    marginLeft: theme.spacing[3],
  },
  metricLabel: {
    color: theme.colors.text.secondary,
  },
  trendsCard: {
    backgroundColor: theme.colors.background.light,
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: theme.spacing[4],
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing[3],
  },
  timelineItem: {
    backgroundColor: theme.colors.background.light,
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: theme.spacing[3],
  },
  timelineMetaText: {
    color: theme.colors.text.tertiary,
  },
  timelineDetailText: {
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing[1],
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing[2],
  },
  timelineLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing[3],
  },
  timelineContent: {
    flex: 1,
  },
  timelineMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing[1],
  },
  timelineScore: {
    marginLeft: theme.spacing[2],
  },
  timelineDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[3],
    marginTop: theme.spacing[2],
    paddingTop: theme.spacing[2],
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray[200],
  },
  timelineDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadMoreButton: {
    padding: theme.spacing[4],
    alignItems: 'center',
    marginTop: theme.spacing[2],
  },
  topicCard: {
    backgroundColor: theme.colors.background.light,
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: theme.spacing[3],
  },
  progressBarText: {
    color: theme.colors.text.secondary,
    marginTop: theme.spacing[1],
  },
  topicMetricText: {
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing[1],
  },
  topicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing[3],
  },
  progressBarContainer: {
    marginBottom: theme.spacing[3],
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: theme.colors.gray[200],
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: theme.borderRadius.full,
  },
  topicMetrics: {
    flexDirection: 'row',
    gap: theme.spacing[4],
  },
  topicMetric: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityCard: {
    backgroundColor: theme.colors.background.light,
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: theme.spacing[3],
  },
  activityDescription: {
    color: theme.colors.text.secondary,
  },
  activityStatLabel: {
    color: theme.colors.text.secondary,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing[3],
  },
  activityIconLarge: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing[3],
  },
  activityContent: {
    flex: 1,
  },
  activityStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: theme.spacing[3],
    paddingTop: theme.spacing[3],
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray[200],
  },
  activityStat: {
    alignItems: 'center',
  },
  analyticsCard: {
    backgroundColor: theme.colors.background.light,
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: theme.spacing[4],
  },
  analyticsLabel: {
    color: theme.colors.text.secondary,
  },
  analyticsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    marginBottom: theme.spacing[4],
  },
  analyticsItem: {
    alignItems: 'center',
    minWidth: 100,
    marginBottom: theme.spacing[3],
  },
  dailyActivityContainer: {
    marginTop: theme.spacing[4],
  },
  dailyActivityItem: {
    backgroundColor: theme.colors.background.light,
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: theme.spacing[3],
  },
  dailyActivityStatText: {
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing[1],
  },
  dailyActivityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing[2],
  },
  dailyActivityStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[3],
  },
  dailyActivityStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
