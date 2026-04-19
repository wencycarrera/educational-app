import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Heading } from '../../../src/components/ui/Heading';
import { Body } from '../../../src/components/ui/Body';
import { Card } from '../../../src/components/ui/Card';
import { theme } from '../../../src/config/theme';
import { FIXED_CURRICULUM, LessonTopic } from '../../../src/data/curriculum-skeleton';
import { getSubLessonsByTopic, SubLesson, deleteSubLesson, hasModulesForSubLesson } from '../../../src/services/sub-lesson.service';
import { getModulesBySubLesson } from '../../../src/services/lesson.service';

export default function ManageSubLessonsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ classID?: string; topicCategory?: string }>();
  const classID = params.classID;
  const topicCategory = params.topicCategory;

  const [subLessons, setSubLessons] = useState<SubLesson[]>([]);
  const [moduleCounts, setModuleCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(topicCategory || null);

  const topic = selectedTopic ? FIXED_CURRICULUM.find((t) => t.id === selectedTopic) : null;

  const fetchSubLessons = async () => {
    if (!classID || !selectedTopic) return;

    try {
      setLoading(true);
      const fetched = await getSubLessonsByTopic(classID, selectedTopic);
      setSubLessons(fetched);

      // Fetch module counts for each sub-lesson
      const counts: Record<string, number> = {};
      for (const subLesson of fetched) {
        const modules = await getModulesBySubLesson(subLesson.id);
        counts[subLesson.id] = modules.length;
      }
      setModuleCounts(counts);
    } catch (error) {
      console.error('Error fetching sub-lessons:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (classID && selectedTopic) {
      fetchSubLessons();
    } else {
      setLoading(false);
    }
  }, [classID, selectedTopic]);

  const handleCreate = () => {
    if (!classID || !selectedTopic || !topic) return;
    router.push({
      pathname: '/(teacher)/manage-sublessons/editor',
      params: {
        classID,
        topicCategory: selectedTopic,
        topicTitle: topic.title,
      },
    });
  };

  const handleEdit = (subLesson: SubLesson) => {
    if (!classID || !selectedTopic || !topic) return;
    router.push({
      pathname: '/(teacher)/manage-sublessons/editor',
      params: {
        classID,
        topicCategory: selectedTopic,
        topicTitle: topic.title,
        subLessonID: subLesson.id,
        subLessonTitle: subLesson.title,
        subLessonContent: subLesson.content,
        subLessonOrder: subLesson.order.toString(),
      },
    });
  };

  const handleDelete = async (subLesson: SubLesson) => {
    if (!classID) return;

    // Check if sub-lesson has modules
    const hasModules = await hasModulesForSubLesson(subLesson.id);
    if (hasModules) {
      Alert.alert(
        'Cannot Delete',
        'This sub-lesson has activities. Please delete or move the activities first.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Delete Sub-Lesson',
      `Are you sure you want to delete "${subLesson.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingId(subLesson.id);
              await deleteSubLesson(subLesson.id);
              await fetchSubLessons();
            } catch (error) {
              console.error('Error deleting sub-lesson:', error);
              Alert.alert('Error', 'Failed to delete sub-lesson. Please try again.');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  if (!classID) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={64}
            color={theme.colors.error[500]}
          />
          <Heading level="h3" style={styles.errorTitle}>
            No Classroom Selected
          </Heading>
          <Body size="medium" style={styles.errorText}>
            Please select a classroom from the dashboard first.
          </Body>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Body size="medium" style={styles.backButtonText}>
              Go Back
            </Body>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Show topic selection if no topic selected
  if (!selectedTopic) {
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
                Select Topic
              </Heading>
              <Body size="small" style={styles.headerSubtitle}>
                Choose a lesson topic to manage sub-lessons
              </Body>
            </View>
            <View style={styles.headerSpacer} />
          </View>
        </View>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topicsGrid}>
            {FIXED_CURRICULUM.map((topicItem) => (
              <TouchableOpacity
                key={topicItem.id}
                onPress={() => setSelectedTopic(topicItem.id)}
                activeOpacity={0.8}
                style={styles.topicCardWrapper}
              >
                <Card
                  variant="elevated"
                  padding="medium"
                  style={[
                    styles.topicCard,
                    {
                      backgroundColor: topicItem.color,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      elevation: 3,
                    },
                  ]}
                >
                  <View style={styles.topicHeader}>
                    <View
                      style={[
                        styles.topicNumberBadge,
                        { backgroundColor: 'rgba(255, 255, 255, 0.3)' },
                      ]}
                    >
                      <Body
                        size="small"
                        style={[
                          styles.topicNumber,
                          { color: '#ffffff', fontWeight: 'bold' },
                        ]}
                      >
                        {topicItem.order}
                      </Body>
                    </View>
                  </View>
                  <Heading
                    level="h4"
                    style={[
                      styles.topicTitle,
                      { color: '#ffffff', marginTop: theme.spacing[3] },
                    ]}
                  >
                    {topicItem.title.split(':')[0]}
                  </Heading>
                  <Body
                    size="small"
                    style={[
                      styles.topicDescription,
                      { color: 'rgba(255, 255, 255, 0.9)' },
                    ]}
                  >
                    {topicItem.description}
                  </Body>
                </Card>
              </TouchableOpacity>
            ))}
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
              Manage Sub-Lessons
            </Heading>
            <Body size="small" style={styles.headerSubtitle}>
              {topic?.title || 'Selected Topic'}
            </Body>
          </View>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary[500]} />
          <Body size="small" style={styles.loadingText}>
            Loading sub-lessons...
          </Body>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Create Button */}
          <TouchableOpacity
            onPress={handleCreate}
            activeOpacity={0.8}
            style={styles.createButton}
          >
            <Card variant="elevated" padding="large" style={styles.createButtonCard}>
              <View style={styles.createButtonContent}>
                <View style={[styles.createIconContainer, { backgroundColor: theme.colors.primary[50] }]}>
                  <Ionicons name="add-circle" size={32} color={theme.colors.primary[600]} />
                </View>
                <Body size="medium" style={styles.createButtonText}>
                  Create New Sub-Lesson
                </Body>
              </View>
            </Card>
          </TouchableOpacity>

          {/* Sub-Lessons List */}
          {subLessons.length === 0 ? (
            <Card variant="outlined" padding="large" style={styles.emptyCard}>
              <View style={styles.emptyContent}>
                <Ionicons
                  name="book-outline"
                  size={64}
                  color={theme.colors.gray[400]}
                />
                <Heading level="h4" style={styles.emptyTitle}>
                  No Sub-Lessons Yet
                </Heading>
                <Body size="medium" style={styles.emptyText}>
                  Create your first sub-lesson to organize activities.
                </Body>
              </View>
            </Card>
          ) : (
            <View style={styles.subLessonsList}>
              {subLessons.map((subLesson) => {
                const moduleCount = moduleCounts[subLesson.id] || 0;
                const isDeleting = deletingId === subLesson.id;

                return (
                  <Card
                    key={subLesson.id}
                    variant="elevated"
                    padding="medium"
                    style={[styles.subLessonCard, styles.cardWithShadow]}
                  >
                    <View style={styles.subLessonHeader}>
                      <View style={styles.subLessonNumber}>
                        <Body size="small" style={styles.subLessonNumberText}>
                          {subLesson.order}
                        </Body>
                      </View>
                      <View style={styles.subLessonContent}>
                        <Heading level="h4" style={styles.subLessonTitle}>
                          {subLesson.title}
                        </Heading>
                        {subLesson.content && (
                          <Body size="small" style={styles.subLessonPreview} numberOfLines={2}>
                            {subLesson.content}
                          </Body>
                        )}
                        <View style={styles.subLessonMeta}>
                          <View style={styles.metaItem}>
                            <Ionicons
                              name="game-controller"
                              size={14}
                              color={theme.colors.gray[500]}
                            />
                            <Body size="small" style={styles.metaText}>
                              {moduleCount} {moduleCount === 1 ? 'activity' : 'activities'}
                            </Body>
                          </View>
                        </View>
                      </View>
                    </View>
                    <View style={styles.subLessonActions}>
                      <TouchableOpacity
                        onPress={() => handleEdit(subLesson)}
                        style={styles.actionButton}
                        disabled={isDeleting}
                      >
                        <Ionicons name="create-outline" size={20} color={theme.colors.primary[500]} />
                        <Body size="small" style={styles.actionText}>
                          Edit
                        </Body>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDelete(subLesson)}
                        style={[styles.actionButton, styles.deleteButton]}
                        disabled={isDeleting}
                      >
                        {isDeleting ? (
                          <ActivityIndicator size="small" color={theme.colors.error[500]} />
                        ) : (
                          <>
                            <Ionicons name="trash-outline" size={20} color={theme.colors.error[500]} />
                            <Body size="small" style={[styles.actionText, styles.deleteText]}>
                              Delete
                            </Body>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  </Card>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  headerContainer: {
    paddingHorizontal: theme.spacing[6],
    paddingTop: theme.spacing[6],
    paddingBottom: theme.spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[200],
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
  headerSubtitle: {
    color: theme.colors.text.secondary,
    marginTop: 4,
  },
  headerSpacer: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing[6],
  },
  loadingText: {
    color: theme.colors.text.secondary,
    marginTop: theme.spacing[3],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing[6],
    paddingBottom: theme.spacing[10],
    paddingTop: theme.spacing[2],
  },
  createButton: {
    marginBottom: theme.spacing[6],
  },
  createButtonCard: {
    backgroundColor: theme.colors.background.light,
    borderWidth: 2,
    borderColor: theme.colors.primary[300],
    borderStyle: 'dashed',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  createButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createIconContainer: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing[3],
  },
  createButtonText: {
    color: theme.colors.primary[700],
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: theme.colors.background.light,
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    marginTop: theme.spacing[4],
    minHeight: 200,
    justifyContent: 'center',
  },
  emptyContent: {
    alignItems: 'center',
  },
  emptyTitle: {
    color: theme.colors.text.primary,
    marginTop: theme.spacing[4],
    marginBottom: theme.spacing[2],
  },
  emptyText: {
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  subLessonsList: {
    gap: theme.spacing[4],
  },
  subLessonCard: {
    backgroundColor: theme.colors.background.light,
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
    marginBottom: theme.spacing[2],
  },
  cardWithShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  subLessonHeader: {
    flexDirection: 'row',
    marginBottom: theme.spacing[4],
  },
  subLessonNumber: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing[3],
  },
  subLessonNumberText: {
    color: theme.colors.primary[700],
    fontWeight: 'bold',
  },
  subLessonContent: {
    flex: 1,
  },
  subLessonTitle: {
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
  },
  subLessonPreview: {
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[2],
  },
  subLessonMeta: {
    flexDirection: 'row',
    gap: theme.spacing[4],
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[1],
  },
  metaText: {
    color: theme.colors.text.secondary,
  },
  subLessonActions: {
    flexDirection: 'row',
    gap: theme.spacing[3],
    paddingTop: theme.spacing[3],
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray[200],
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing[2],
    paddingHorizontal: theme.spacing[4],
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.background.light,
    borderWidth: 1,
    borderColor: theme.colors.gray[300],
  },
  deleteButton: {
    borderColor: theme.colors.error[200],
    backgroundColor: theme.colors.error[50],
  },
  actionText: {
    color: theme.colors.primary[700],
    fontWeight: '600',
    marginLeft: theme.spacing[2],
  },
  deleteText: {
    color: theme.colors.error[700],
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing[6],
  },
  errorTitle: {
    color: theme.colors.text.primary,
    marginTop: theme.spacing[4],
    marginBottom: theme.spacing[2],
  },
  errorText: {
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing[6],
  },
  backButtonText: {
    color: theme.colors.primary[500],
    fontWeight: '600',
  },
  topicsGrid: {
    gap: theme.spacing[4],
  },
  topicCardWrapper: {
    marginBottom: theme.spacing[2],
  },
  topicCard: {
    borderRadius: theme.borderRadius['2xl'],
    minHeight: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  topicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topicNumberBadge: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topicNumber: {
    fontSize: theme.typography.fontSize.base,
  },
  topicTitle: {
    marginBottom: theme.spacing[2],
    fontSize: theme.typography.fontSize.lg,
  },
  topicDescription: {
    marginBottom: theme.spacing[4],
    lineHeight: 20,
  },
});

