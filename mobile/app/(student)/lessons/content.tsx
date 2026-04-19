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
import { useAuth } from '../../../src/hooks/useAuth';
import { Heading } from '../../../src/components/ui/Heading';
import { Body } from '../../../src/components/ui/Body';
import { Card } from '../../../src/components/ui/Card';
import { Button } from '../../../src/components/common/Button';
import { theme } from '../../../src/config/theme';
import { getSubLessonById, SubLesson } from '../../../src/services/sub-lesson.service';
import { speakText, stopSpeaking } from '../../../src/services/tts.service';
import { markContentAsViewed } from '../../../src/services/content-view.service';
import { getModulesBySubLesson } from '../../../src/services/lesson.service';

export default function SubLessonContentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    subLessonID: string;
    moduleID: string; // The activity to navigate to after viewing content
  }>();

  const { user } = useAuth();
  const studentID = user?.uid || '';

  const [subLesson, setSubLesson] = useState<SubLesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.subLessonID) {
      loadSubLesson();
    }
  }, [params.subLessonID]);

  // Cleanup: stop speaking when component unmounts
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  const loadSubLesson = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetched = await getSubLessonById(params.subLessonID);
      if (!fetched) {
        setError('Sub-lesson not found');
        return;
      }
      setSubLesson(fetched);
    } catch (err) {
      console.error('Error loading sub-lesson:', err);
      setError('Failed to load content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSpeakContent = async () => {
    if (!subLesson?.content) return;

    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      try {
        await speakText(subLesson.content, {
          onDone: () => setIsSpeaking(false),
          onError: () => setIsSpeaking(false),
        });
      } catch (error) {
        console.error('Error speaking content:', error);
        setIsSpeaking(false);
      }
    }
  };

  const handleContinue = async () => {
    // Mark content as viewed before navigating
    if (subLesson && studentID) {
      try {
        await markContentAsViewed(studentID, subLesson.id);
      } catch (error) {
        console.error('Error marking content as viewed:', error);
      }
    }

    // Get the module ID to navigate to
    let moduleIdToNavigate = params.moduleID;
    
    // If moduleID is not provided or empty, fetch the first module for this sub-lesson
    if (!moduleIdToNavigate && subLesson) {
      try {
        const modules = await getModulesBySubLesson(subLesson.id);
        if (modules.length > 0) {
          moduleIdToNavigate = modules[0].id;
        }
      } catch (error) {
        console.error('Error fetching modules:', error);
      }
    }

    // Navigate to the activity
    if (moduleIdToNavigate) {
      // Use replace to prevent going back to content screen
      router.replace({
        pathname: '/(student)/lessons/play',
        params: { moduleId: moduleIdToNavigate },
      });
    } else {
      // If no module found, go back to sub-lesson screen
      router.back();
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-primary-50" edges={['top']}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary[500]} />
          <Body size="medium" className="text-gray-600 mt-4">
            Loading content...
          </Body>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !subLesson) {
    return (
      <SafeAreaView className="flex-1 bg-primary-50" edges={['top']}>
        <View style={styles.centerContainer}>
          <Card variant="outlined" padding="large">
            <View style={styles.errorContent}>
              <Ionicons
                name="alert-circle-outline"
                size={48}
                color={theme.colors.error[500]}
                style={{ marginBottom: theme.spacing[3] }}
              />
              <Heading level="h4" className="text-center mb-2" style={{ color: theme.colors.text.primary }}>
                {error || 'Content Not Found'}
              </Heading>
              <Body size="medium" className="text-center text-gray-600 mb-4">
                {error || 'The content you\'re looking for doesn\'t exist.'}
              </Body>
              <Button variant="primary" onPress={() => router.back()}>
                Go Back
              </Button>
            </View>
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-primary-50" edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            stopSpeaking();
            router.back();
          }}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.gray[700]} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Body size="small" className="text-gray-500">
            Read & Listen
          </Body>
          <Heading level="h4" style={{ color: theme.colors.text.primary }}>
            {subLesson.title}
          </Heading>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Content Section */}
        <Card variant="elevated" padding="large" style={styles.contentCard}>
          <View style={styles.contentHeader}>
            <View style={styles.contentHeaderLeft}>
              <Ionicons
                name="book"
                size={24}
                color={theme.colors.primary[500]}
                style={{ marginRight: theme.spacing[2] }}
              />
              <Body size="small" style={{ color: theme.colors.text.secondary, fontWeight: '600' }}>
                Kids Can Read / Listen
              </Body>
            </View>
            <TouchableOpacity
              onPress={handleSpeakContent}
              activeOpacity={0.7}
              style={[
                styles.listenButton,
                {
                  backgroundColor: isSpeaking
                    ? theme.colors.primary[500]
                    : theme.colors.primary[100],
                },
              ]}
            >
              <Ionicons
                name={isSpeaking ? 'stop' : 'volume-high'}
                size={18}
                color={isSpeaking ? '#ffffff' : theme.colors.primary[700]}
              />
              <Body
                size="small"
                style={{
                  color: isSpeaking ? '#ffffff' : theme.colors.primary[700],
                  marginLeft: 6,
                  fontWeight: '600',
                }}
              >
                {isSpeaking ? 'Stop' : 'Listen'}
              </Body>
            </TouchableOpacity>
          </View>

          <View style={styles.contentTextContainer}>
            <Body size="large" style={styles.contentText}>
              {subLesson.content}
            </Body>
          </View>
        </Card>

        {/* Continue Button */}
        <View style={styles.buttonContainer}>
          <Button
            variant="primary"
            size="large"
            onPress={handleContinue}
            fullWidth
            style={styles.continueButton}
          >
            Continue
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing[6],
  },
  errorContent: {
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[4],
    paddingTop: theme.spacing[2],
    paddingBottom: theme.spacing[3],
    backgroundColor: theme.colors.background.light,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[200],
  },
  backButton: {
    marginRight: theme.spacing[3],
    padding: theme.spacing[1],
  },
  headerTitle: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing[6],
    paddingBottom: theme.spacing[8],
  },
  contentCard: {
    marginBottom: theme.spacing[6],
  },
  contentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing[4],
    paddingBottom: theme.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[200],
  },
  contentHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  listenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing[2],
    paddingHorizontal: theme.spacing[3],
    borderRadius: theme.borderRadius.full,
  },
  contentTextContainer: {
    marginTop: theme.spacing[2],
  },
  contentText: {
    color: theme.colors.text.primary,
    lineHeight: 28,
    fontSize: 18,
  },
  buttonContainer: {
    marginTop: theme.spacing[4],
  },
  continueButton: {
    marginTop: theme.spacing[2],
  },
});

