import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/hooks/useAuth';
import { Heading } from '../../src/components/ui/Heading';
import { Body } from '../../src/components/ui/Body';
import { Card } from '../../src/components/ui/Card';
import { FeedbackForm } from '../../src/components/teacher/FeedbackForm';
import { theme } from '../../src/config/theme';
import { submitFeedback, getFeedbackHistory } from '../../src/services/feedback.service';
import { TeacherFeedback, FeedbackFormData } from '../../src/types/feedback';
import { Timestamp } from 'firebase/firestore';

export default function FeedbackScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [feedbackHistory, setFeedbackHistory] = useState<TeacherFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (user) {
      fetchFeedbackHistory();
    }
  }, [user]);

  const fetchFeedbackHistory = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const history = await getFeedbackHistory(user.uid);
      setFeedbackHistory(history);
    } catch (error) {
      console.error('Error fetching feedback history:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFeedbackHistory();
    setRefreshing(false);
  };

  const handleSubmitFeedback = async (data: FeedbackFormData) => {
    if (!user) return;

    try {
      setSubmitting(true);
      await submitFeedback(user.uid, data);
      // Refresh history after submission
      await fetchFeedbackHistory();
      setShowHistory(true);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (timestamp: Timestamp): string => {
    const date = timestamp.toDate();
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCategoryLabel = (category: string): string => {
    switch (category) {
      case 'usability':
        return 'Usability';
      case 'educational':
        return 'Educational';
      case 'general':
        return 'General';
      default:
        return category;
    }
  };

  const getCategoryIcon = (category: string): string => {
    switch (category) {
      case 'usability':
        return 'phone-portrait-outline';
      case 'educational':
        return 'school-outline';
      case 'general':
        return 'chatbubble-outline';
      default:
        return 'help-circle-outline';
    }
  };

  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'usability':
        return theme.colors.secondary.blue[500];
      case 'educational':
        return theme.colors.success[500];
      case 'general':
        return theme.colors.primary[500];
      default:
        return theme.colors.gray[500];
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary[500]} />
      </View>
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
                Feedback
              </Heading>
              <Body size="small" style={{ color: theme.colors.text.secondary, marginTop: 4 }}>
                Share your thoughts to help us improve
              </Body>
            </View>
            <View style={styles.headerSpacer} />
          </View>
        </View>
        {/* Toggle between form and history */}
        <View style={[styles.toggleContainer, { paddingHorizontal: theme.spacing[6] }]}>
          <View style={styles.toggleButtons}>
            <TouchableOpacity
              onPress={() => setShowHistory(false)}
              activeOpacity={0.7}
              style={[
                styles.toggleButton,
                !showHistory && styles.toggleButtonActive,
              ]}
            >
              <Ionicons
                name="create-outline"
                size={18}
                color={
                  !showHistory
                    ? theme.colors.text.inverse
                    : theme.colors.text.secondary
                }
                style={{ marginRight: theme.spacing[2] }}
              />
              <Body
                size="medium"
                style={[
                  styles.toggleText,
                  !showHistory && styles.toggleTextActive,
                ]}
              >
                Submit Feedback
              </Body>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowHistory(true)}
              activeOpacity={0.7}
              style={[
                styles.toggleButton,
                showHistory && styles.toggleButtonActive,
              ]}
            >
              <Ionicons
                name="time-outline"
                size={18}
                color={
                  showHistory
                    ? theme.colors.text.inverse
                    : theme.colors.text.secondary
                }
                style={{ marginRight: theme.spacing[2] }}
              />
              <Body
                size="medium"
                style={[
                  styles.toggleText,
                  showHistory && styles.toggleTextActive,
                ]}
              >
                History ({feedbackHistory.length})
              </Body>
            </TouchableOpacity>
          </View>
        </View>

        {!showHistory ? (
          <View style={{ paddingHorizontal: theme.spacing[6] }}>
            <FeedbackForm onSubmit={handleSubmitFeedback} loading={submitting} />
          </View>
        ) : (
          <View style={[styles.historyContainer, { paddingHorizontal: theme.spacing[6] }]}>
            {feedbackHistory.length === 0 ? (
              <Card variant="outlined" padding="large" style={styles.emptyCard}>
                <View style={styles.emptyIconContainer}>
                  <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={64}
                    color={theme.colors.gray[400]}
                  />
                </View>
                <Heading level="h4" style={styles.emptyTitle}>
                  No Feedback Yet
                </Heading>
                <Body size="medium" style={styles.emptyText}>
                  Your feedback history will appear here once you submit feedback.
                </Body>
              </Card>
            ) : (
              <View style={styles.historyList}>
                {feedbackHistory.map((feedback) => {
                  const categoryColor = getCategoryColor(feedback.category);
                  const categoryIcon = getCategoryIcon(feedback.category);
                  
                  return (
                    <Card
                      key={feedback.id}
                      variant="elevated"
                      padding="large"
                      style={styles.feedbackCard}
                    >
                      <View style={styles.feedbackHeader}>
                        <View style={styles.feedbackLeft}>
                          <View
                            style={[
                              styles.categoryIconContainer,
                              { backgroundColor: `${categoryColor}15` },
                            ]}
                          >
                            <Ionicons
                              name={categoryIcon as any}
                              size={20}
                              color={categoryColor}
                            />
                          </View>
                          <View style={styles.feedbackMeta}>
                            <View style={styles.categoryRow}>
                              <Body size="small" style={[styles.feedbackCategory, { color: categoryColor }]}>
                                {getCategoryLabel(feedback.category)}
                              </Body>
                            </View>
                            <View style={styles.dateRow}>
                              <Ionicons
                                name="time-outline"
                                size={12}
                                color={theme.colors.text.tertiary}
                                style={{ marginRight: 4 }}
                              />
                              <Body size="small" style={styles.feedbackDate}>
                                {formatDate(feedback.createdAt)}
                              </Body>
                            </View>
                          </View>
                        </View>
                        <View style={styles.ratingContainer}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Ionicons
                              key={star}
                              name={star <= feedback.rating ? 'star' : 'star-outline'}
                              size={18}
                              color={
                                star <= feedback.rating
                                  ? theme.colors.warning[500]
                                  : theme.colors.gray[300]
                              }
                            />
                          ))}
                        </View>
                      </View>
                      <View style={styles.feedbackDivider} />
                      <Body size="medium" style={styles.feedbackText}>
                        {feedback.feedbackText}
                      </Body>
                    </Card>
                  );
                })}
              </View>
            )}
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
  toggleContainer: {
    marginBottom: theme.spacing[6],
  },
  toggleButtons: {
    flexDirection: 'row',
    backgroundColor: theme.colors.gray[100],
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing[1],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: theme.spacing[3],
    paddingHorizontal: theme.spacing[4],
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  toggleButtonActive: {
    backgroundColor: theme.colors.primary[500],
  },
  toggleText: {
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  toggleTextActive: {
    color: theme.colors.text.inverse,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  historyContainer: {
    marginTop: theme.spacing[4],
  },
  historyList: {
    gap: theme.spacing[3],
  },
  feedbackCard: {
    marginBottom: 0,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing[3],
  },
  feedbackLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing[3],
  },
  feedbackMeta: {
    flex: 1,
  },
  categoryRow: {
    marginBottom: theme.spacing[1],
  },
  feedbackCategory: {
    fontWeight: theme.typography.fontWeight.semibold,
    textTransform: 'uppercase',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  feedbackDate: {
    color: theme.colors.text.tertiary,
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: theme.spacing[1],
    alignItems: 'center',
    marginLeft: theme.spacing[2],
  },
  feedbackDivider: {
    height: 1,
    backgroundColor: theme.colors.gray[200],
    marginVertical: theme.spacing[3],
  },
  feedbackText: {
    color: theme.colors.text.primary,
    lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.base,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 250,
    backgroundColor: theme.colors.background.light,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing[4],
  },
  emptyTitle: {
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[2],
    textAlign: 'center',
  },
  emptyText: {
    color: theme.colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: theme.spacing[4],
  },
});

