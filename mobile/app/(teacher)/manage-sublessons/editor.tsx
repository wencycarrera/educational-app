import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Heading } from '../../../src/components/ui/Heading';
import { Body } from '../../../src/components/ui/Body';
import { Card } from '../../../src/components/ui/Card';
import { Input } from '../../../src/components/common/Input';
import { Button } from '../../../src/components/common/Button';
import { theme } from '../../../src/config/theme';
import {
  createSubLesson,
  updateSubLesson,
  getSubLessonById,
  getSubLessonsByTopic,
} from '../../../src/services/sub-lesson.service';

export default function SubLessonEditorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    classID?: string;
    topicCategory?: string;
    topicTitle?: string;
    subLessonID?: string;
    subLessonTitle?: string;
    subLessonContent?: string;
    subLessonOrder?: string;
  }>();

  const classID = params.classID;
  const topicCategory = params.topicCategory;
  const topicTitle = params.topicTitle || 'Selected Topic';
  const isEditing = !!params.subLessonID;

  const [title, setTitle] = useState(params.subLessonTitle || '');
  const [content, setContent] = useState(params.subLessonContent || '');
  const [order, setOrder] = useState(params.subLessonOrder || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderCalculated, setOrderCalculated] = useState(false);

  // Calculate next order if creating new sub-lesson
  useEffect(() => {
    const calculateOrder = async () => {
      if (!isEditing && classID && topicCategory && !orderCalculated) {
        try {
          const subLessons = await getSubLessonsByTopic(classID, topicCategory);
          const nextOrder = subLessons.length > 0
            ? Math.max(...subLessons.map((sl) => sl.order || 0)) + 1
            : 1;
          setOrder(nextOrder.toString());
          setOrderCalculated(true);
        } catch (error) {
          console.error('Error calculating order:', error);
        }
      }
    };

    calculateOrder();
  }, [isEditing, classID, topicCategory, orderCalculated]);

  const validateForm = (): boolean => {
    setError(null);

    if (!title.trim()) {
      setError('Sub-lesson title is required');
      return false;
    }

    if (title.trim().length < 3) {
      setError('Title must be at least 3 characters');
      return false;
    }

    if (!content.trim()) {
      setError('Content is required');
      return false;
    }

    if (content.trim().length < 10) {
      setError('Content must be at least 10 characters');
      return false;
    }

    if (content.trim().length > 2000) {
      setError('Content must be less than 2000 characters');
      return false;
    }

    const orderNum = parseInt(order);
    if (isNaN(orderNum) || orderNum < 1) {
      setError('Order must be at least 1');
      return false;
    }

    return true;
  };

  const showSuccessMessage = (message: string) => {
  if (Platform.OS === 'web') {
    window.alert(message);
    router.back();
  } else {
    Alert.alert('Success!', message, [
      { text: 'OK', onPress: () => router.back() },
    ]);
  }
};

  const handleSave = async () => {
  if (!validateForm()) {
    return;
  }

  if (!classID || !topicCategory) {
    setError('Missing required information. Please go back and try again.');
    return;
  }

  try {
    setLoading(true);
    setError(null);

    const orderNum = parseInt(order);

    if (isEditing && params.subLessonID) {
      await updateSubLesson(params.subLessonID, {
        title: title.trim(),
        content: content.trim(),
        order: orderNum,
      });

      showSuccessMessage('Sub-lesson updated successfully.');
    } else {
      await createSubLesson(
        classID,
        topicCategory,
        title.trim(),
        content.trim(),
        orderNum
      );

      showSuccessMessage('Sub-lesson created successfully.');
    }
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : 'Failed to save sub-lesson. Please try again.'
    );
  } finally {
    setLoading(false);
  }
};
  if (!classID || !topicCategory) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={64}
            color={theme.colors.error[500]}
          />
          <Heading level="h3" style={styles.errorTitle}>
            Missing Information
          </Heading>
          <Body size="medium" style={styles.errorText}>
            Please select a topic from the previous screen.
          </Body>
          <Button variant="primary" onPress={() => router.back()}>
            Go Back
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
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
                {isEditing ? 'Edit Sub-Lesson' : 'Create Sub-Lesson'}
              </Heading>
              <Body size="small" style={styles.headerSubtitle}>
                {topicTitle}
              </Body>
            </View>
            <View style={styles.headerSpacer} />
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Form Fields */}
          <Input
            label="Sub-Lesson Title *"
            placeholder="e.g., Counting Forward and Backward (0-20)"
            value={title}
            onChangeText={(text) => {
              setTitle(text);
              setError(null);
            }}
            autoCapitalize="words"
            maxLength={100}
            editable={!loading}
          />

          <View style={styles.textInputContainer}>
            <Body size="small" style={styles.label}>
              Content (Kids Can Read/Listen) *
            </Body>
            <TextInput
              style={styles.textArea}
              placeholder="Enter the content that students will read or listen to before playing games..."
              value={content}
              onChangeText={(text) => {
                setContent(text);
                setError(null);
              }}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
              maxLength={2000}
              editable={!loading}
            />
            <Body size="small" style={styles.characterCount}>
              {content.length} / 2000 characters
            </Body>
          </View>

          <Input
            label="Order *"
            placeholder="Auto-calculated"
            value={order}
            onChangeText={(text) => {
              setOrder(text.replace(/[^0-9]/g, ''));
              setError(null);
            }}
            keyboardType="numeric"
            maxLength={3}
            editable={!loading}
            helperText="Order in which this sub-lesson appears (auto-calculated). Change only if you need a specific order."
          />

          {error && (
            <Card variant="outlined" padding="medium" style={styles.errorCard}>
              <View style={styles.errorContent}>
                <Ionicons
                  name="alert-circle"
                  size={20}
                  color={theme.colors.error[500]}
                />
                <Body size="small" style={styles.errorMessageText}>
                  {error}
                </Body>
              </View>
            </Card>
          )}

          <View style={styles.buttonContainer}>
            <Button
              variant="primary"
              size="large"
              onPress={handleSave}
              loading={loading}
              disabled={loading}
              fullWidth
            >
              {isEditing ? 'Update Sub-Lesson' : 'Create Sub-Lesson'}
            </Button>
            <TouchableOpacity
  onPress={() => router.back()}
  activeOpacity={0.8}
  disabled={loading}
  style={styles.cancelButton}
>
  <View style={styles.cancelCard}>
    <Body size="medium" style={styles.cancelText}>
      Cancel
    </Body>
  </View>
</TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  keyboardView: {
    flex: 1,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing[6],
    paddingBottom: theme.spacing[10],
    paddingTop: theme.spacing[2],
  },
  textInputContainer: {
    marginBottom: theme.spacing[5],
  },
  label: {
    color: theme.colors.text.primary,
    fontWeight: '600',
    marginBottom: theme.spacing[2],
  },
  textArea: {
    backgroundColor: theme.colors.background.light,
    borderWidth: 1,
    borderColor: theme.colors.gray[300],
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing[4],
    minHeight: 200,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  characterCount: {
    color: theme.colors.text.secondary,
    marginTop: theme.spacing[2],
    textAlign: 'right',
  },
  errorCard: {
    backgroundColor: theme.colors.error[50],
    borderColor: theme.colors.error[200],
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: theme.spacing[4],
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorMessageText: {
    flex: 1,
    color: theme.colors.error[700],
    marginLeft: theme.spacing[2],
  },
  errorText: {
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing[6],
  },
  buttonContainer: {
    marginTop: theme.spacing[4],
    gap: theme.spacing[3],
  },
  cancelButton: {
    marginTop: theme.spacing[2],
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

  cancelCard: {
  backgroundColor: '#FFFFFF',              // white background
  borderColor: theme.colors.primary[500], // orange border
  borderWidth: 2,
  borderRadius: theme.borderRadius.lg,
  paddingVertical: theme.spacing[4],
  alignItems: 'center',
  justifyContent: 'center',
},

cancelContent: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
},

cancelText: {
  color: theme.colors.primary[500], // orange text
  fontWeight: '800',
},
});

