import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Heading } from '../../../src/components/ui/Heading';
import { Body } from '../../../src/components/ui/Body';
import { Card } from '../../../src/components/ui/Card';
import { theme } from '../../../src/config/theme';
import { FIXED_CURRICULUM, LessonTopic } from '../../../src/data/curriculum-skeleton';
import { getLessonModulesByTopic } from '../../../src/services/lesson.service';

export default function CreateActivityScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ classID?: string }>();
  const classID = params.classID;
  
  const [lessonModuleCounts, setLessonModuleCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (classID) {
      fetchLessonCounts();
    } else {
      setLoading(false);
    }
  }, [classID]);

  const fetchLessonCounts = async () => {
    if (!classID) return;
    
    try {
      setLoading(true);
      const modulesByTopic = await getLessonModulesByTopic(classID);
      const counts: Record<string, number> = {};
      
      FIXED_CURRICULUM.forEach((topic) => {
        counts[topic.id] = modulesByTopic[topic.id]?.length || 0;
      });
      
      setLessonModuleCounts(counts);
    } catch (error) {
      console.error('Error fetching lesson counts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTopicSelect = (topic: LessonTopic) => {
    if (!classID) {
      // If no classID, show error or redirect
      return;
    }
    
    router.push({
      pathname: '/(teacher)/create-activity/builder',
      params: {
        classID,
        topicCategory: topic.id,
        topicTitle: topic.title,
      },
    });
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
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Body size="medium" style={styles.backButtonText}>
              Go Back
            </Body>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
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
                Create Activity
              </Heading>
              <Body size="small" style={{ color: theme.colors.text.secondary, marginTop: 4 }}>
                Select a lesson topic to create an activity for
              </Body>
            </View>
            <View style={styles.headerSpacer} />
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary[500]} />
            <Body size="small" style={styles.loadingText}>
              Loading topics...
            </Body>
          </View>
        ) : (
          <View style={styles.topicsContainer}>
            <View style={styles.topicsGrid}>
              {FIXED_CURRICULUM.map((topic) => {
                const activityCount = lessonModuleCounts[topic.id] || 0;
                
                return (
                  <TouchableOpacity
                    key={topic.id}
                    onPress={() => handleTopicSelect(topic)}
                    activeOpacity={0.8}
                    style={styles.topicCardWrapper}
                  >
                    <Card
                      variant="elevated"
                      padding="medium"
                      style={[
                        styles.topicCard,
                        {
                          backgroundColor: topic.color,
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
                            {topic.order}
                          </Body>
                        </View>
                        {activityCount > 0 && (
                          <View
                            style={[
                              styles.activityBadge,
                              { backgroundColor: 'rgba(255, 255, 255, 0.3)' },
                            ]}
                          >
                            <Body
                              size="small"
                              style={[
                                styles.activityCount,
                                { color: '#ffffff', fontWeight: '600' },
                              ]}
                            >
                              {activityCount}
                            </Body>
                          </View>
                        )}
                      </View>

                      <Heading
                        level="h4"
                        style={[
                          styles.topicTitle,
                          { color: '#ffffff', marginTop: theme.spacing[3] },
                        ]}
                      >
                        {topic.title.split(':')[0]}
                      </Heading>

                      <Body
                        size="small"
                        style={[
                          styles.topicDescription,
                          { color: 'rgba(255, 255, 255, 0.9)' },
                        ]}
                      >
                        {topic.description}
                      </Body>

                      <View style={styles.topicFooter}>
                        <View style={styles.selectButton}>
                          <Body
                            size="small"
                            style={[
                              styles.selectButtonText,
                              { color: '#ffffff', fontWeight: '600' },
                            ]}
                          >
                            Create Activity
                          </Body>
                          <Ionicons
                            name="arrow-forward"
                            size={16}
                            color="#ffffff"
                            style={{ marginLeft: theme.spacing[1] }}
                          />
                        </View>
                      </View>
                    </Card>
                  </TouchableOpacity>
                );
              })}
            </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing[6],
    minHeight: 200,
  },
  loadingText: {
    color: theme.colors.text.secondary,
    marginTop: theme.spacing[3],
  },
  topicsContainer: {
    paddingHorizontal: theme.spacing[6],
  },
  topicsGrid: {
    gap: theme.spacing[4],
    marginTop: theme.spacing[2],
  },
  topicCardWrapper: {
    marginBottom: theme.spacing[2],
  },
  topicCard: {
    borderRadius: theme.borderRadius['2xl'],
    minHeight: 160,
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
  activityBadge: {
    paddingHorizontal: theme.spacing[2],
    paddingVertical: theme.spacing[1],
    borderRadius: theme.borderRadius.full,
  },
  activityCount: {
    fontSize: theme.typography.fontSize.xs,
  },
  topicTitle: {
    marginBottom: theme.spacing[2],
    fontSize: theme.typography.fontSize.lg,
  },
  topicDescription: {
    marginBottom: theme.spacing[4],
    lineHeight: 20,
  },
  topicFooter: {
    marginTop: 'auto',
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[2],
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  selectButtonText: {
    fontSize: theme.typography.fontSize.sm,
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
});
