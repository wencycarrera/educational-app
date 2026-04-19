import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Heading } from '../../../src/components/ui/Heading';
import { Body } from '../../../src/components/ui/Body';
import { Card } from '../../../src/components/ui/Card';
import { Input } from '../../../src/components/common/Input';
import { Button } from '../../../src/components/common/Button';
import { AssetPicker } from '../../../src/components/teacher-tools/AssetPicker';
import { theme } from '../../../src/config/theme';
import { createLessonModule, getLessonModulesByClass, getModulesBySubLesson } from '../../../src/services/lesson.service';
import { getSubLessonsByTopic, SubLesson } from '../../../src/services/sub-lesson.service';


type ActivityType = 'drag_drop' | 'ordering' | 'quiz' | 'number_line' | 'place_value' | 'comparison' | 'visual_counting' | 'sequential_counting' | 'ordinal_position' | 'matching' | 'word_problem' | 'demonstration';

interface ActivityTemplate {
  id: ActivityType;
  name: string;
  description: string;
  icon: string;
  color: string;
}

const ACTIVITY_TEMPLATES: ActivityTemplate[] = [
  {
    id: 'drag_drop',
    name: 'Drag & Drop',
    description: 'Students select the correct number of items',
    icon: 'move',
    color: theme.colors.primary[500],
  },
  {
    id: 'ordering',
    name: 'Ordering',
    description: 'Students arrange items in the correct order',
    icon: 'list',
    color: theme.colors.secondary.blue[500],
  },
  {
    id: 'number_line',
    name: 'Number Line',
    description: 'Students tap numbers on an interactive number line',
    icon: 'git-branch',
    color: theme.colors.warning[500] || '#FFA500',
  },
  {
    id: 'place_value',
    name: 'Place Value',
    description: 'Students build numbers using tens and ones blocks',
    icon: 'cube',
    color: theme.colors.secondary.purple[500] || '#9B59B6',
  },
  {
    id: 'comparison',
    name: 'Comparison',
    description: 'Students compare numbers using <, >, or =',
    icon: 'swap-horizontal',
    color: theme.colors.error[500],
  },
  {
    id: 'visual_counting',
    name: 'Visual Counting',
    description: 'Students count objects by adding or removing them',
    icon: 'add-circle',
    color: theme.colors.info[500] || '#3498DB',
  },
  {
    id: 'sequential_counting',
    name: 'Sequential Counting',
    description: 'Objects appear/disappear as students count forward or backward',
    icon: 'repeat',
    color: theme.colors.secondary.purple[500] || '#9B59B6',
  },
  {
    id: 'ordinal_position',
    name: 'Ordinal Position',
    description: 'Students tap objects in specific positions (1st, 2nd, 3rd, etc.)',
    icon: 'list-number',
    color: '#FF6B35',
  },
  {
    id: 'matching',
    name: 'Matching',
    description: 'Students match items (e.g., numerals to words, numbers to representations)',
    icon: 'git-merge',
    color: '#20B2AA',
  },
  {
    id: 'word_problem',
    name: 'Word Problem',
    description: 'Story-based problems with visual context and interactive solving',
    icon: 'book',
    color: theme.colors.secondary.pink[500],
  },
  {
    id: 'demonstration',
    name: 'Visual Demonstration',
    description: 'Read-only visual demonstrations and animations for learning concepts',
    icon: 'eye',
    color: '#6B46C1',
  },
];

const VISIBLE_ACTIVITY_TEMPLATES = ACTIVITY_TEMPLATES.filter(
  (template) => template.id !== 'visual_counting' && template.id !== 'drag_drop' && template.id !== 'demonstration'
);

export default function ActivityBuilderScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    classID?: string;
    topicCategory?: string;
    topicTitle?: string;
  }>();

  const classID = params.classID;
  const topicCategory = params.topicCategory;
  const topicTitle = params.topicTitle || 'Selected Topic';

  // Form state
  const [step, setStep] = useState<'template' | 'configure' | 'asset'>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<ActivityType | null>(null);
  const [title, setTitle] = useState('');
  const [instruction, setInstruction] = useState('');
  const [correctCount, setCorrectCount] = useState<string>('');
  const [selectedAssetId, setSelectedAssetId] = useState<string>('');
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [sequenceOrder, setSequenceOrder] = useState<string>('1');
  const [sequenceOrderCalculated, setSequenceOrderCalculated] = useState(false);
  const [subLessons, setSubLessons] = useState<SubLesson[]>([]);
  const [selectedSubLessonID, setSelectedSubLessonID] = useState<string>('');
  const [showCreateSubLesson, setShowCreateSubLesson] = useState(false);
  
  // New activity type specific fields
  const [startNumber, setStartNumber] = useState<string>('0');
  const [endNumber, setEndNumber] = useState<string>('20');
  const [targetNumber, setTargetNumber] = useState<string>('');
  const [leftValue, setLeftValue] = useState<string>('');
  const [rightValue, setRightValue] = useState<string>('');
  const [targetCount, setTargetCount] = useState<string>('');
  const [mode, setMode] = useState<string>('forward');
  
  // New template fields
  const [numberOfObjects, setNumberOfObjects] = useState<string>('5');
  const [targetPosition, setTargetPosition] = useState<string>('3');
  const [matchingPairs, setMatchingPairs] = useState<string>('');
  const [storyText, setStoryText] = useState<string>('');
  const [problemType, setProblemType] = useState<string>('addition');
  const [firstNumber, setFirstNumber] = useState<string>('');
  const [secondNumber, setSecondNumber] = useState<string>('');
  const [demonstrationType, setDemonstrationType] = useState<string>('animation');
  const [lottieUrl, setLottieUrl] = useState<string>('');
  const [lottieAssetId, setLottieAssetId] = useState<string>('');
  const [quizStoryText, setQuizStoryText] = useState<string>('');
  const [quizQuestionType, setQuizQuestionType] = useState<string>('multiple_choice');
  const [sortingCategories, setSortingCategories] = useState<string>('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAssetPicker, setShowAssetPicker] = useState(false);

  // Helper function to check if asset is required for a template
  const isAssetRequired = (template: ActivityType | null): boolean => {
    if (!template) return false;
    return ['drag_drop', 'visual_counting', 'sequential_counting', 'ordinal_position', 'word_problem'].includes(template) ||
           (template === 'comparison' && selectedAssetId); // Required if showObjects will be true
  };

  // Helper function to check if asset picker should be shown
  const shouldShowAssetPicker = (template: ActivityType | null): boolean => {
    if (!template) return false;
    // Hide for templates that don't use assets
    return !['number_line', 'place_value', 'quiz', 'demonstration'].includes(template);
  };

  // Validate required fields
  const validateForm = (): boolean => {
    setError(null);

    if (!selectedTemplate) {
      setError('Please select an activity template');
      return false;
    }

    if (!title.trim()) {
      setError('Activity title is required');
      return false;
    }

    if (title.trim().length < 3) {
      setError('Activity title must be at least 3 characters');
      return false;
    }

    if (!instruction.trim()) {
      setError('Instruction is required');
      return false;
    }

    if (!selectedSubLessonID) {
      setError('Please select a sub-lesson');
      return false;
    }

    // Template-specific validations
    if (selectedTemplate === 'drag_drop' || selectedTemplate === 'ordering') {
      const count = parseInt(correctCount);
      if (isNaN(count) || count < 1) {
        setError('Please enter a valid correct count (at least 1)');
        return false;
      }
      if (!selectedAssetId && isAssetRequired(selectedTemplate)) {
        setError('Please select an asset for this activity type');
        return false;
      }
    }

    if (selectedTemplate === 'number_line') {
      const start = parseInt(startNumber);
      const end = parseInt(endNumber);
      if (isNaN(start) || isNaN(end) || start >= end) {
        setError('Start number must be less than end number');
        return false;
      }
      if (end - start > 100) {
        setError('Number range cannot exceed 100 numbers');
        return false;
      }
    }

    if (selectedTemplate === 'place_value') {
      const target = parseInt(targetNumber);
      if (isNaN(target) || target < 0 || target > 99) {
        setError('Target number must be between 0 and 99');
        return false;
      }
    }

    if (selectedTemplate === 'comparison') {
      const left = parseInt(leftValue);
      const right = parseInt(rightValue);
      if (isNaN(left) || isNaN(right)) {
        setError('Please enter valid numbers for comparison');
        return false;
      }
      // Asset is optional for comparison (can show numbers only)
    }

    if (selectedTemplate === 'visual_counting') {
      const target = parseInt(targetCount);
      if (isNaN(target) || target < 1) {
        setError('Target count must be at least 1');
        return false;
      }
      if (!selectedAssetId) {
        setError('Please select an asset for visual counting activities');
        return false;
      }
    }

    if (selectedTemplate === 'sequential_counting') {
      const start = parseInt(startNumber);
      const end = parseInt(endNumber);
      if (isNaN(start) || isNaN(end)) {
        setError('Please enter valid start and end numbers');
        return false;
      }
      if (start < 0 || start > 20 || end < 0 || end > 20) {
        setError('Start and end numbers must be between 0 and 20');
        return false;
      }
      if (start >= end) {
        setError('Start number must be less than end number');
        return false;
      }
      if (!selectedAssetId) {
        setError('Please select an asset for sequential counting activities');
        return false;
      }
    }

    if (selectedTemplate === 'ordinal_position') {
      const numObjects = parseInt(numberOfObjects);
      const targetPos = parseInt(targetPosition);
      if (isNaN(numObjects) || numObjects < 2 || numObjects > 10) {
        setError('Number of objects must be between 2 and 10');
        return false;
      }
      if (isNaN(targetPos) || targetPos < 1 || targetPos > numObjects) {
        setError(`Target position must be between 1 and ${numObjects}`);
        return false;
      }
      if (selectedAssetIds.length !== numObjects) {
        setError(`Select exactly ${numObjects} distinct assets for this activity`);
        return false;
      }
      const distinct = new Set(selectedAssetIds);
      if (distinct.size !== selectedAssetIds.length) {
        setError('Please select distinct assets (no duplicates)');
        return false;
      }
    }

    if (selectedTemplate === 'matching') {
      if (!matchingPairs.trim()) {
        setError('Please enter matching pairs (e.g., "1st:first,2nd:second,3rd:third")');
        return false;
      }
      // Basic validation - check if pairs are formatted correctly
      const pairs = matchingPairs.split(',').map(p => p.trim());
      if (pairs.length < 2) {
        setError('Please enter at least 2 matching pairs');
        return false;
      }
      for (const pair of pairs) {
        if (!pair.includes(':')) {
          setError('Each pair must be in format "item1:item2"');
          return false;
        }
      }
    }

    if (selectedTemplate === 'word_problem') {
      if (!storyText.trim()) {
        setError('Please enter the story text for the word problem');
        return false;
      }
      if (storyText.trim().length < 20) {
        setError('Story text must be at least 20 characters');
        return false;
      }
      const first = parseInt(firstNumber);
      const second = parseInt(secondNumber);
      if (isNaN(first) || isNaN(second) || first < 0 || second < 0) {
        setError('Please enter valid numbers for the word problem');
        return false;
      }
      if (!selectedAssetId) {
        setError('Please select an asset for word problem activities');
        return false;
      }
    }

    if (selectedTemplate === 'demonstration') {
      // Demonstration is read-only, minimal validation needed
      // Could add validation for demonstration type if needed
    }

    if (selectedTemplate === 'drag_drop' && mode === 'sorting') {
      if (!sortingCategories.trim()) {
        setError('Please enter sorting categories (e.g., "₱1,₱5,₱10,₱20")');
        return false;
      }
      const categories = sortingCategories.split(',').map(c => c.trim()).filter(c => c);
      if (categories.length < 2) {
        setError('Please enter at least 2 sorting categories');
        return false;
      }
    }

    if (selectedTemplate === 'quiz') {
      if (quizStoryText && quizStoryText.trim().length > 0 && quizStoryText.trim().length < 20) {
        setError('Story text must be at least 20 characters if provided');
        return false;
      }
    }

    const order = parseInt(sequenceOrder);
    if (isNaN(order) || order < 1) {
      setError('Sequence order must be at least 1');
      return false;
    }

    return true;
  };

  // Get next sequence order for the topic
  const getNextSequenceOrder = async (): Promise<number> => {
    if (!classID || !topicCategory) return 1;

    try {
      const modules = await getLessonModulesByClass(classID);
      const topicModules = modules.filter((m) => m.topicCategory === topicCategory);
      if (topicModules.length === 0) return 1;
      
      const maxOrder = Math.max(...topicModules.map((m) => m.sequenceOrder || 0));
      const nextOrder = maxOrder + 1;
      console.log('📊 Calculated next sequence order:', {
        topicCategory,
        existingModules: topicModules.length,
        maxOrder,
        nextOrder,
      });
      return nextOrder;
    } catch (error) {
      console.error('Error fetching sequence order:', error);
      return 1;
    }
  };

  // Fetch sub-lessons when component mounts
  useEffect(() => {
    const fetchSubLessons = async () => {
      if (classID && topicCategory) {
        try {
          const fetchedSubLessons = await getSubLessonsByTopic(classID, topicCategory);
          setSubLessons(fetchedSubLessons);
          // Auto-select first sub-lesson if only one exists
          if (fetchedSubLessons.length === 1) {
            setSelectedSubLessonID(fetchedSubLessons[0].id);
          }
        } catch (error) {
          console.error('Error fetching sub-lessons:', error);
        }
      }
    };

    fetchSubLessons();
  }, [classID, topicCategory]);

  // Auto-calculate sequence order when component mounts or topic changes
  useEffect(() => {
    const calculateInitialSequenceOrder = async () => {
      if (classID && topicCategory && !sequenceOrderCalculated) {
        const nextOrder = await getNextSequenceOrder();
        setSequenceOrder(nextOrder.toString());
        setSequenceOrderCalculated(true);
      }
    };

    calculateInitialSequenceOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classID, topicCategory]);

  // Get next sub-lesson order for selected sub-lesson
  const getNextSubLessonOrder = async (subLessonID: string): Promise<number> => {
    try {
      const modules = await getModulesBySubLesson(subLessonID);
      if (modules.length === 0) return 1;
      const maxOrder = Math.max(...modules.map((m) => m.subLessonOrder || 0));
      return maxOrder + 1;
    } catch (error) {
      console.error('Error calculating sub-lesson order:', error);
      return 1;
    }
  };
  

  const handleTemplateSelect = (template: ActivityType) => {
    if (template === 'visual_counting') {
      // Hidden template safeguard
      return;
    }
    setSelectedTemplate(template);
    setStep('configure');
    setError(null);
    setSelectedAssetId('');
    setSelectedAssetIds([]);
  };

  const handleNextToAsset = async () => {
    if (!validateForm()) {
      return;
    }
    setShowAssetPicker(true);
  };

  const handleAssetSelect = (assetId: string) => {
    setSelectedAssetId(assetId);
    setShowAssetPicker(false);
  };

  const handleMultiAssetSelect = (assetIds: string[]) => {
    setSelectedAssetIds(assetIds);
    setError(null);
  };

  // Trim selections if teacher lowers number of objects
  useEffect(() => {
    if (selectedTemplate !== 'ordinal_position') return;
    const expected = parseInt(numberOfObjects);
    if (isNaN(expected) || expected < 0) return;
    if (selectedAssetIds.length > expected) {
      setSelectedAssetIds((prev) => prev.slice(0, expected));
    }
  }, [numberOfObjects, selectedTemplate, selectedAssetIds.length]);

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

      // Auto-set sequence order - always recalculate to ensure it's correct
      // This handles cases where multiple teachers might be creating activities simultaneously
      let finalSequenceOrder = parseInt(sequenceOrder);
      if (isNaN(finalSequenceOrder) || finalSequenceOrder < 1) {
        finalSequenceOrder = await getNextSequenceOrder();
      } else {
        // Even if provided, verify it's not conflicting with existing modules
      const calculatedOrder = await getNextSequenceOrder();
      // Use the calculated order if it's higher (meaning new modules were added)
      if (calculatedOrder > finalSequenceOrder) {
        console.log('⚠️ Sequence order conflict detected, using calculated order:', calculatedOrder);
        finalSequenceOrder = calculatedOrder;
      }
    }

    // Calculate sub-lesson order
    const subLessonOrder = await getNextSubLessonOrder(selectedSubLessonID);
    
    console.log('💾 Saving activity with sequence order:', finalSequenceOrder, 'sub-lesson order:', subLessonOrder);

      const activityData: {
        instruction?: string;
        correctCount?: number;
        assetID?: string;
        [key: string]: unknown;
      } = {
        instruction: instruction.trim(),
      };

      // Template-specific data
      if (selectedTemplate === 'drag_drop' || selectedTemplate === 'ordering') {
        activityData.correctCount = parseInt(correctCount);
      }

      if (selectedTemplate === 'drag_drop') {
        activityData.mode = mode || 'generic';
        if (mode === 'sorting' && sortingCategories) {
          // Parse categories: "₱1,₱5,₱10,₱20" -> ["₱1", "₱5", "₱10", "₱20"]
          const categories = sortingCategories.split(',').map(c => c.trim()).filter(c => c);
          activityData.sortingCategories = categories;
        }
      }

    if (selectedTemplate === 'number_line') {
        activityData.startNumber = parseInt(startNumber) || 0;
        activityData.endNumber = parseInt(endNumber) || 20;
        activityData.mode = mode;
        if (targetNumber) {
          activityData.targetNumber = parseInt(targetNumber);
        }
      }

      if (selectedTemplate === 'place_value') {
        activityData.targetNumber = parseInt(targetNumber) || 34;
        activityData.mode = mode;
      }

      if (selectedTemplate === 'comparison') {
        activityData.leftValue = parseInt(leftValue) || 5;
        activityData.rightValue = parseInt(rightValue) || 3;
        activityData.showObjects = selectedAssetId ? true : false;
      }

      if (selectedTemplate === 'visual_counting') {
        activityData.targetCount = parseInt(targetCount) || 5;
        activityData.mode = mode;
        activityData.initialCount = parseInt(startNumber) || 0;
      }

      if (selectedTemplate === 'sequential_counting') {
        activityData.startNumber = parseInt(startNumber) || 0;
        activityData.endNumber = parseInt(endNumber) || 20;
        activityData.direction = mode; // 'forward' or 'backward'
        activityData.animationSpeed = 'medium'; // Default, can be made configurable later
        activityData.autoPlay = false; // Default, can be made configurable later
      }

      if (selectedTemplate === 'ordinal_position') {
        activityData.numberOfObjects = parseInt(numberOfObjects) || 5;
        activityData.targetPosition = parseInt(targetPosition) || 3;
      if (selectedAssetIds.length > 0) {
        activityData.assetIDs = selectedAssetIds;
      }
      }

      if (selectedTemplate === 'matching') {
        // Parse matching pairs: "item1:match1,item2:match2"
        const pairs = matchingPairs.split(',').map(p => p.trim()).filter(p => p);
        const matches: Array<{ left: string; right: string }> = [];
        pairs.forEach(pair => {
          const [left, right] = pair.split(':').map(s => s.trim());
          if (left && right) {
            matches.push({ left, right });
          }
        });
        activityData.matchingPairs = matches;
      }

      if (selectedTemplate === 'word_problem') {
        activityData.storyText = storyText.trim();
        activityData.problemType = problemType; // 'addition' or 'subtraction'
        activityData.firstNumber = parseInt(firstNumber) || 0;
        activityData.secondNumber = parseInt(secondNumber) || 0;
        // Calculate answer
        if (problemType === 'addition') {
          activityData.answer = parseInt(firstNumber) + parseInt(secondNumber);
        } else {
          activityData.answer = parseInt(firstNumber) - parseInt(secondNumber);
        }
      }

      if (selectedTemplate === 'demonstration') {
        activityData.demonstrationType = demonstrationType; // 'animation', 'visual', 'step_by_step'
      if (lottieUrl.trim()) {
        activityData.lottieAsset = lottieUrl.trim();
      } else if (lottieAssetId.trim()) {
        activityData.lottieAsset = lottieAssetId.trim();
      }
      }

      if (selectedTemplate === 'quiz') {
        if (quizStoryText && quizStoryText.trim()) {
          activityData.storyText = quizStoryText.trim();
        }
        activityData.questionType = quizQuestionType || 'multiple_choice';
        // Quiz questions are typically managed separately
        // For now, we'll use a default structure
      }

      if (selectedAssetId) {
        activityData.assetID = selectedAssetId;
      }

      await createLessonModule(
        classID,
        topicCategory,
        title.trim(),
        finalSequenceOrder,
        selectedTemplate!,
        activityData,
        selectedSubLessonID,
        subLessonOrder
      );

      Alert.alert(
        'Success!',
        'Activity created successfully. Your students can now access it.',
        [
          {
            text: 'Create Another',
            onPress: () => {
              // Reset form but keep template selection
              setTitle('');
              setInstruction('');
              setCorrectCount('');
              setSelectedAssetId('');
              setLottieUrl('');
              setLottieAssetId('');
              setSelectedAssetIds([]);
              setSequenceOrder(finalSequenceOrder + 1 + '');
              setError(null);
              setStep('configure');
            },
          },
          {
            text: 'Go to Dashboard',
            style: 'default',
            onPress: () => {
              router.replace('/(teacher)/dashboard');
            },
          },
        ]
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create activity. Please try again.');
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
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.headerContainer}>
            <View style={styles.headerTop}>
              <TouchableOpacity
                onPress={() => {
                  if (step === 'template') {
                    router.back();
                  } else {
                    setStep('template');
                    setError(null);
                  }
                }}
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
                  {step === 'template' ? 'Choose Template' : 'Configure Activity'}
                </Heading>
                <Body size="small" style={{ color: theme.colors.text.secondary, marginTop: 4 }} numberOfLines={1}>
                  {topicTitle}
                </Body>
              </View>
              <View style={styles.headerSpacer} />
            </View>
          </View>
          {step === 'template' && (
            <View style={[styles.templatesContainer, { paddingHorizontal: theme.spacing[6] }]}>
              <Body size="medium" style={styles.sectionDescription}>
                Choose an activity template to get started
              </Body>

              <View style={styles.templatesGrid}>
                {VISIBLE_ACTIVITY_TEMPLATES.map((template) => (
                  <TouchableOpacity
                    key={template.id}
                    onPress={() => handleTemplateSelect(template.id)}
                    activeOpacity={0.8}
                    style={styles.templateCard}
                  >
                    <Card variant="elevated" padding="large" style={styles.templateCardContent}>
                      <View
                        style={[
                          styles.templateIconContainer,
                          { backgroundColor: template.color + '15' },
                        ]}
                      >
                        <Ionicons
                          name={template.icon as any}
                          size={32}
                          color={template.color}
                        />
                      </View>
                      <Heading level="h4" style={styles.templateName}>
                        {template.name}
                      </Heading>
                      <Body size="small" style={styles.templateDescription}>
                        {template.description}
                      </Body>
                    </Card>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {step === 'configure' && (
            <View style={[styles.formContainer, { paddingHorizontal: theme.spacing[6] }]}>
              {/* Selected Template Info */}
              <Card variant="outlined" padding="medium" style={styles.selectedTemplateCard}>
                <View style={styles.selectedTemplateInfo}>
                  <View
                    style={[
                      styles.selectedTemplateIcon,
                      {
                        backgroundColor:
                          ACTIVITY_TEMPLATES.find((t) => t.id === selectedTemplate)?.color + '15',
                      },
                    ]}
                  >
                    <Ionicons
                      name={ACTIVITY_TEMPLATES.find((t) => t.id === selectedTemplate)?.icon as any}
                      size={24}
                      color={ACTIVITY_TEMPLATES.find((t) => t.id === selectedTemplate)?.color}
                    />
                  </View>
                  <View style={styles.selectedTemplateText}>
                    <Body size="small" style={styles.selectedTemplateLabel}>
                      Selected Template
                    </Body>
                    <Body size="medium" style={styles.selectedTemplateName}>
                      {ACTIVITY_TEMPLATES.find((t) => t.id === selectedTemplate)?.name}
                    </Body>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      setStep('template');
                      setSelectedTemplate(null);
                    }}
                    style={styles.changeTemplateButton}
                  >
                    <Body size="small" style={styles.changeTemplateText}>
                      Change
                    </Body>
                  </TouchableOpacity>
                </View>
              </Card>

              {/* Sub-Lesson Selection */}
              <View style={styles.textInputContainer}>
                <Body size="small" style={styles.label}>
                  Sub-Lesson *
                </Body>
                {subLessons.length === 0 ? (
                  <Card variant="outlined" padding="medium" style={styles.infoCard}>
                    <Body size="small" style={styles.infoText}>
                      No sub-lessons found. Create a sub-lesson first to add activities.
                    </Body>
                    <TouchableOpacity
                      onPress={() => {
                        router.push({
                          pathname: '/(teacher)/manage-sublessons/editor',
                          params: {
                            classID,
                            topicCategory,
                            topicTitle,
                          },
                        });
                      }}
                      style={styles.createSubLessonButton}
                    >
                      <Body size="small" style={styles.createSubLessonText}>
                        Create Sub-Lesson
                      </Body>
                    </TouchableOpacity>
                  </Card>
                ) : (
                  <View style={styles.selectContainer}>
                    {subLessons.map((subLesson) => (
                      <TouchableOpacity
                        key={subLesson.id}
                        onPress={() => {
                          setSelectedSubLessonID(subLesson.id);
                          setError(null);
                        }}
                        style={[
                          styles.subLessonOption,
                          selectedSubLessonID === subLesson.id && styles.subLessonOptionSelected,
                        ]}
                      >
                        <View style={styles.subLessonOptionContent}>
                          <View style={styles.subLessonOptionLeft}>
                            <Ionicons
                              name={selectedSubLessonID === subLesson.id ? 'radio-button-on' : 'radio-button-off'}
                              size={20}
                              color={selectedSubLessonID === subLesson.id ? theme.colors.primary[500] : theme.colors.gray[400]}
                            />
                            <View style={styles.subLessonOptionText}>
                              <Body size="medium" style={styles.subLessonOptionTitle}>
                                {subLesson.title}
                              </Body>
                              {subLesson.content && (
                                <Body size="small" style={styles.subLessonOptionPreview} numberOfLines={1}>
                                  {subLesson.content}
                                </Body>
                              )}
                            </View>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                      onPress={() => {
                        router.push({
                          pathname: '/(teacher)/manage-sublessons/editor',
                          params: {
                            classID,
                            topicCategory,
                            topicTitle,
                          },
                        });
                      }}
                      style={styles.addSubLessonButton}
                    >
                      <Ionicons name="add-circle-outline" size={20} color={theme.colors.primary[500]} />
                      <Body size="small" style={styles.addSubLessonText}>
                        Create New Sub-Lesson
                      </Body>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Form Fields */}
              <Input
                label="Activity Title"
                placeholder="e.g., Counting Apples"
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
                  Instruction
                </Body>
                <TextInput
                  style={styles.textArea}
                  placeholder="e.g., Drag 5 apples into the basket"
                  value={instruction}
                  onChangeText={(text) => {
                    setInstruction(text);
                    setError(null);
                  }}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  maxLength={500}
                  editable={!loading}
                />
              </View>

              {(selectedTemplate === 'drag_drop' || selectedTemplate === 'ordering') && (
                <>
                  <Input
                    label="Correct Count"
                    placeholder="e.g., 5"
                    value={correctCount}
                    onChangeText={(text) => {
                      setCorrectCount(text.replace(/[^0-9]/g, ''));
                      setError(null);
                    }}
                    keyboardType="numeric"
                    maxLength={3}
                    editable={!loading}
                    helperText="Number of items students need to get right"
                  />
                  {selectedTemplate === 'drag_drop' && (
                    <View style={styles.textInputContainer}>
                      <Body size="small" style={styles.label}>
                        Drag Mode
                      </Body>
                      <View style={styles.radioGroup}>
                        {['generic', 'sorting', 'addition', 'counting', 'one_more_less', 'representing_numbers'].map((m) => (
                          <TouchableOpacity
                            key={m}
                            onPress={() => setMode(m)}
                            style={[styles.radioOption, mode === m && styles.radioOptionSelected]}
                          >
                            <Body size="small" style={mode === m ? styles.radioTextSelected : styles.radioText}>
                              {m.charAt(0).toUpperCase() + m.slice(1).replace('_', ' ')}
                            </Body>
                          </TouchableOpacity>
                        ))}
                      </View>
                      <Body size="xs" style={styles.helpText}>
                        Sorting: Drag items into categories. Generic: Drag items to a target count.
                      </Body>
                    </View>
                  )}
                </>
              )}

              {selectedTemplate === 'number_line' && (
                <>
                  <View style={styles.row}>
                    <View style={styles.halfWidth}>
                      <Input
                        label="Start Number"
                        placeholder="0"
                        value={startNumber}
                        onChangeText={(text) => {
                          setStartNumber(text.replace(/[^0-9-]/g, ''));
                          setError(null);
                        }}
                        keyboardType="numeric"
                        editable={!loading}
                      />
                    </View>
                    <View style={styles.halfWidth}>
                      <Input
                        label="End Number"
                        placeholder="20"
                        value={endNumber}
                        onChangeText={(text) => {
                          setEndNumber(text.replace(/[^0-9]/g, ''));
                          setError(null);
                        }}
                        keyboardType="numeric"
                        editable={!loading}
                      />
                    </View>
                  </View>
                  <View style={styles.textInputContainer}>
                    <Body size="small" style={styles.label}>
                      Mode
                    </Body>
                    <View style={styles.radioGroup}>
                      {['forward', 'backward'].map((m) => (
                        <TouchableOpacity
                          key={m}
                          onPress={() => setMode(m)}
                          style={[styles.radioOption, mode === m && styles.radioOptionSelected]}
                        >
                          <Body size="small" style={mode === m ? styles.radioTextSelected : styles.radioText}>
                            {m.charAt(0).toUpperCase() + m.slice(1).replace('_', ' ')}
                          </Body>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </>
              )}

              {selectedTemplate === 'place_value' && (
                <Input
                  label="Target Number"
                  placeholder="e.g., 34"
                  value={targetNumber}
                  onChangeText={(text) => {
                    setTargetNumber(text.replace(/[^0-9]/g, ''));
                    setError(null);
                  }}
                  keyboardType="numeric"
                  maxLength={3}
                  editable={!loading}
                  helperText="Number students need to build"
                />
              )}

              {selectedTemplate === 'comparison' && (
                <>
                  <View style={styles.row}>
                    <View style={styles.halfWidth}>
                      <Input
                        label="Left Value"
                        placeholder="5"
                        value={leftValue}
                        onChangeText={(text) => {
                          setLeftValue(text.replace(/[^0-9]/g, ''));
                          setError(null);
                        }}
                        keyboardType="numeric"
                        editable={!loading}
                      />
                    </View>
                    <View style={styles.halfWidth}>
                      <Input
                        label="Right Value"
                        placeholder="3"
                        value={rightValue}
                        onChangeText={(text) => {
                          setRightValue(text.replace(/[^0-9]/g, ''));
                          setError(null);
                        }}
                        keyboardType="numeric"
                        editable={!loading}
                      />
                    </View>
                  </View>
                </>
              )}

              {selectedTemplate === 'quiz' && (
                <>
                  <View style={styles.textInputContainer}>
                    <Body size="small" style={styles.label}>
                      Story Context (Optional)
                    </Body>
                    <TextInput
                      style={styles.textArea}
                      placeholder='e.g., "Anna has 5 apples. She gets 3 more. How many apples does she have now?"'
                      value={quizStoryText}
                      onChangeText={(text) => {
                        setQuizStoryText(text);
                        setError(null);
                      }}
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                      maxLength={500}
                      editable={!loading}
                    />
                    <Body size="xs" style={styles.helpText}>
                      Add a story context to make the quiz more engaging. Questions will be shown after the story.
                    </Body>
                  </View>
                  <View style={styles.textInputContainer}>
                    <Body size="small" style={styles.label}>
                      Question Type
                    </Body>
                    <View style={styles.radioGroup}>
                      {['multiple_choice', 'matching'].map((qt) => (
                        <TouchableOpacity
                          key={qt}
                          onPress={() => setQuizQuestionType(qt)}
                          style={[styles.radioOption, quizQuestionType === qt && styles.radioOptionSelected]}
                        >
                          <Body size="small" style={quizQuestionType === qt ? styles.radioTextSelected : styles.radioText}>
                            {qt.charAt(0).toUpperCase() + qt.slice(1).replace('_', ' ')}
                          </Body>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <Body size="xs" style={styles.helpText}>
                      Multiple Choice: Standard quiz questions. Matching: Match items from two columns.
                    </Body>
                  </View>
                </>
              )}

              {selectedTemplate === 'drag_drop' && mode === 'sorting' && (
                <View style={styles.textInputContainer}>
                  <Body size="small" style={styles.label}>
                    Sorting Categories *
                  </Body>
                  <TextInput
                    style={styles.textArea}
                    placeholder='e.g., "₱1,₱5,₱10,₱20,₱50,₱100" or "Red,Blue,Green"'
                    value={sortingCategories}
                    onChangeText={(text) => {
                      setSortingCategories(text);
                      setError(null);
                    }}
                    multiline
                    numberOfLines={2}
                    textAlignVertical="top"
                    maxLength={200}
                    editable={!loading}
                  />
                  <Body size="xs" style={styles.helpText}>
                    Enter categories separated by commas. Students will drag items into these categories.
                  </Body>
                </View>
              )}

              {selectedTemplate === 'visual_counting' && (
                <>
                  <Input
                    label="Target Count"
                    placeholder="e.g., 5"
                    value={targetCount}
                    onChangeText={(text) => {
                      setTargetCount(text.replace(/[^0-9]/g, ''));
                      setError(null);
                    }}
                    keyboardType="numeric"
                    maxLength={3}
                    editable={!loading}
                    helperText="Number of objects students need to count"
                  />
                  <View style={styles.textInputContainer}>
                    <Body size="small" style={styles.label}>
                      Mode
                    </Body>
                    <View style={styles.radioGroup}>
                      {['count', 'add', 'subtract', 'one_more_less'].map((m) => (
                        <TouchableOpacity
                          key={m}
                          onPress={() => setMode(m)}
                          style={[styles.radioOption, mode === m && styles.radioOptionSelected]}
                        >
                          <Body size="small" style={mode === m ? styles.radioTextSelected : styles.radioText}>
                            {m.charAt(0).toUpperCase() + m.slice(1).replace('_', ' ')}
                          </Body>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </>
              )}

              {selectedTemplate === 'sequential_counting' && (
                <>
                  <View style={styles.row}>
                    <View style={styles.halfWidth}>
                      <Input
                        label="Start Number"
                        placeholder="0"
                        value={startNumber}
                        onChangeText={(text) => {
                          setStartNumber(text.replace(/[^0-9]/g, ''));
                          setError(null);
                        }}
                        keyboardType="numeric"
                        maxLength={2}
                        editable={!loading}
                        helperText="Starting number (0-20)"
                      />
                    </View>
                    <View style={styles.halfWidth}>
                      <Input
                        label="End Number"
                        placeholder="20"
                        value={endNumber}
                        onChangeText={(text) => {
                          setEndNumber(text.replace(/[^0-9]/g, ''));
                          setError(null);
                        }}
                        keyboardType="numeric"
                        maxLength={2}
                        editable={!loading}
                        helperText="Ending number (0-20)"
                      />
                    </View>
                  </View>
                  <View style={styles.textInputContainer}>
                    <Body size="small" style={styles.label}>
                      Counting Direction *
                    </Body>
                    <View style={styles.radioGroup}>
                      {['forward', 'backward'].map((d) => (
                        <TouchableOpacity
                          key={d}
                          onPress={() => setMode(d)}
                          style={[styles.radioOption, mode === d && styles.radioOptionSelected]}
                        >
                          <Body size="small" style={mode === d ? styles.radioTextSelected : styles.radioText}>
                            {d.charAt(0).toUpperCase() + d.slice(1)}
                          </Body>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <Body size="xs" style={styles.helpText}>
                      Forward: Objects appear as numbers increase. Backward: Objects disappear as numbers decrease.
                    </Body>
                  </View>
                </>
              )}

              {selectedTemplate === 'ordinal_position' && (
                <>
                  <Input
                    label="Number of Objects"
                    placeholder="e.g., 5"
                    value={numberOfObjects}
                    onChangeText={(text) => {
                      setNumberOfObjects(text.replace(/[^0-9]/g, ''));
                      setError(null);
                    }}
                    keyboardType="numeric"
                    maxLength={2}
                    editable={!loading}
                    helperText="How many objects to display in a line (2-10)"
                  />
                  <Input
                    label="Target Position"
                    placeholder="e.g., 3"
                    value={targetPosition}
                    onChangeText={(text) => {
                      setTargetPosition(text.replace(/[^0-9]/g, ''));
                      setError(null);
                    }}
                    keyboardType="numeric"
                    maxLength={2}
                    editable={!loading}
                    helperText="Which position should students identify? (e.g., 3 = 3rd)"
                  />
                </>
              )}

              {selectedTemplate === 'matching' && (
                <>
                  <View style={styles.textInputContainer}>
                    <Body size="small" style={styles.label}>
                      Matching Pairs *
                    </Body>
                    <TextInput
                      style={styles.textArea}
                      placeholder='e.g., "1st:first,2nd:second,3rd:third" or "5:five,10:ten"'
                      value={matchingPairs}
                      onChangeText={(text) => {
                        setMatchingPairs(text);
                        setError(null);
                      }}
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                      maxLength={500}
                      editable={!loading}
                    />
                    <Body size="xs" style={styles.helpText}>
                      Format: "item1:match1,item2:match2,item3:match3" (comma-separated pairs)
                    </Body>
                  </View>
                </>
              )}

              {selectedTemplate === 'word_problem' && (
                <>
                  <View style={styles.textInputContainer}>
                    <Body size="small" style={styles.label}>
                      Story Text *
                    </Body>
                    <TextInput
                      style={styles.textArea}
                      placeholder='e.g., "Anna has 5 apples. She gets 3 more. How many apples does she have now?"'
                      value={storyText}
                      onChangeText={(text) => {
                        setStoryText(text);
                        setError(null);
                      }}
                      multiline
                      numberOfLines={5}
                      textAlignVertical="top"
                      maxLength={500}
                      editable={!loading}
                    />
                  </View>
                  <View style={styles.textInputContainer}>
                    <Body size="small" style={styles.label}>
                      Problem Type
                    </Body>
                    <View style={styles.radioGroup}>
                      {['addition', 'subtraction'].map((pt) => (
                        <TouchableOpacity
                          key={pt}
                          onPress={() => setProblemType(pt)}
                          style={[styles.radioOption, problemType === pt && styles.radioOptionSelected]}
                        >
                          <Body size="small" style={problemType === pt ? styles.radioTextSelected : styles.radioText}>
                            {pt.charAt(0).toUpperCase() + pt.slice(1)}
                          </Body>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  <View style={styles.row}>
                    <View style={styles.halfWidth}>
                      <Input
                        label="First Number"
                        placeholder="5"
                        value={firstNumber}
                        onChangeText={(text) => {
                          setFirstNumber(text.replace(/[^0-9]/g, ''));
                          setError(null);
                        }}
                        keyboardType="numeric"
                        editable={!loading}
                      />
                    </View>
                    <View style={styles.halfWidth}>
                      <Input
                        label="Second Number"
                        placeholder="3"
                        value={secondNumber}
                        onChangeText={(text) => {
                          setSecondNumber(text.replace(/[^0-9]/g, ''));
                          setError(null);
                        }}
                        keyboardType="numeric"
                        editable={!loading}
                      />
                    </View>
                  </View>
                </>
              )}

              {selectedTemplate === 'demonstration' && (
                <>
                  <View style={styles.textInputContainer}>
                    <Body size="small" style={styles.label}>
                      Demonstration Type
                    </Body>
                    <View style={styles.radioGroup}>
                      {['animation', 'visual', 'step_by_step'].map((dt) => (
                        <TouchableOpacity
                          key={dt}
                          onPress={() => setDemonstrationType(dt)}
                          style={[styles.radioOption, demonstrationType === dt && styles.radioOptionSelected]}
                        >
                          <Body size="small" style={demonstrationType === dt ? styles.radioTextSelected : styles.radioText}>
                            {dt.charAt(0).toUpperCase() + dt.slice(1).replace('_', ' ')}
                          </Body>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <Body size="xs" style={styles.helpText}>
                      This is a read-only demonstration activity for visual learning.
                    </Body>
                  </View>

                  <Input
                    label="Lottie URL (optional)"
                    placeholder="https://example.com/animation.json"
                    value={lottieUrl}
                    onChangeText={(text) => {
                      setLottieUrl(text);
                      setError(null);
                    }}
                    helperText="Hosted Lottie JSON to play in the demo. If provided, this takes priority."
                    autoCapitalize="none"
                    autoCorrect={false}
                  />

                  <Input
                    label="Lottie Asset ID (optional)"
                    placeholder="local_animation_id"
                    value={lottieAssetId}
                    onChangeText={(text) => {
                      setLottieAssetId(text);
                      setError(null);
                    }}
                    helperText="Bundled Lottie asset key (local require) used if no URL is set."
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </>
              )}

              <Input
                label="Sequence Order"
                placeholder="Auto-calculated"
                value={sequenceOrder}
                onChangeText={(text) => {
                  setSequenceOrder(text.replace(/[^0-9]/g, ''));
                  setError(null);
                }}
                keyboardType="numeric"
                maxLength={3}
                editable={!loading}
                helperText={`Order in which this activity appears (auto-calculated: ${sequenceOrder}). Change only if you need a specific order.`}
              />

              {/* Asset Selection - Conditionally shown based on template */}
              {shouldShowAssetPicker(selectedTemplate) && (
                <View style={styles.assetSection}>
                  <View style={styles.labelContainer}>
                    <Body size="small" style={styles.label}>
                      {selectedTemplate === 'ordinal_position'
                        ? `Sticker Assets (${numberOfObjects || '0'} required)`
                        : `Sticker Asset ${isAssetRequired(selectedTemplate) ? '*' : '(Optional)'}`}
                    </Body>
                    {selectedTemplate && (
                      <Body size="xs" style={styles.helpText}>
                        {selectedTemplate === 'drag_drop' && 'Select an object for students to drag and drop'}
                        {selectedTemplate === 'visual_counting' && 'Select an object that will appear/disappear as students count'}
                        {selectedTemplate === 'comparison' && 'Optional: Select objects to show visually, or leave empty to show numbers only'}
                        {selectedTemplate === 'ordering' && 'Optional: Select an object to display with the items to order'}
                        {selectedTemplate === 'sequential_counting' && 'Select an object that will animate as students count forward or backward'}
                        {selectedTemplate === 'ordinal_position' && 'Select distinct assets to place in order; count must match Number of Objects'}
                        {selectedTemplate === 'word_problem' && 'Select an object to represent items in the story problem'}
                        {selectedTemplate === 'matching' && 'Optional: Select an asset if matching involves visual items'}
                      </Body>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => setShowAssetPicker(true)}
                    style={styles.assetButton}
                    disabled={loading}
                  >
                    <Card variant="outlined" padding="medium" style={styles.assetButtonCard}>
                      <View style={styles.assetButtonContent}>
                        {selectedTemplate === 'ordinal_position' ? (
                          <>
                            <Ionicons
                              name={selectedAssetIds.length > 0 ? 'images' : 'add-circle-outline'}
                              size={24}
                              color={selectedAssetIds.length > 0 ? theme.colors.primary[500] : theme.colors.gray[500]}
                            />
                            <Body size="medium" style={selectedAssetIds.length > 0 ? styles.assetButtonText : styles.assetButtonTextUnselected}>
                              {`${selectedAssetIds.length}/${parseInt(numberOfObjects) || 0} assets selected`}
                            </Body>
                          </>
                        ) : selectedAssetId ? (
                          <>
                            <Ionicons
                              name="image"
                              size={24}
                              color={theme.colors.primary[500]}
                            />
                            <Body size="medium" style={styles.assetButtonText}>
                              Asset Selected
                            </Body>
                          </>
                        ) : (
                          <>
                            <Ionicons
                              name="add-circle-outline"
                              size={24}
                              color={theme.colors.gray[500]}
                            />
                            <Body size="medium" style={styles.assetButtonTextUnselected}>
                              {isAssetRequired(selectedTemplate) ? 'Select Asset (Required)' : 'Select Asset'}
                            </Body>
                          </>
                        )}
                        <Ionicons
                          name="chevron-forward"
                          size={20}
                          color={theme.colors.gray[400]}
                        />
                      </View>
                    </Card>
                  </TouchableOpacity>
                </View>
              )}

              {error && (
                <Card variant="outlined" padding="medium" style={styles.errorCard}>
                  <View style={styles.errorContent}>
                    <Ionicons
                      name="alert-circle"
                      size={20}
                      color={theme.colors.error[500]}
                    />
                    <Body size="small" style={styles.errorText}>
                      {error}
                    </Body>
                  </View>
                </Card>
              )}

              <View style={styles.buttonContainer}>
                <Button
                  variant="primary"
                  size="large"
                  onPress={() => {
                    const requiresAsset = isAssetRequired(selectedTemplate);
                    if (selectedTemplate === 'ordinal_position') {
                      const expected = parseInt(numberOfObjects);
                      if (isNaN(expected) || expected < 1 || selectedAssetIds.length !== expected) {
                        setError(`Select exactly ${numberOfObjects || expected || 0} distinct assets for this activity`);
                        setShowAssetPicker(true);
                        return;
                      }
                      handleSave();
                      return;
                    }
                    if (requiresAsset && !selectedAssetId) {
                      setError('Please select an asset before saving');
                      setShowAssetPicker(true);
                      return;
                    }
                    handleSave();
                  }}
                  loading={loading}
                  disabled={loading}
                  fullWidth
                >
                  {selectedTemplate === 'ordinal_position'
                    ? `Save (${selectedAssetIds.length}/${parseInt(numberOfObjects) || 0} assets)`
                    : isAssetRequired(selectedTemplate) && !selectedAssetId
                      ? 'Select Asset'
                      : 'Create Activity'}
                </Button>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Asset Picker Modal */}
        <Modal
          visible={showAssetPicker}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowAssetPicker(false)}
        >
          <SafeAreaView style={styles.modalContainer} edges={['top']}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => setShowAssetPicker(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons
                  name="close"
                  size={28}
                  color={theme.colors.text.primary}
                />
              </TouchableOpacity>
              <Heading level="h3" style={styles.modalTitle}>
                Select Sticker
              </Heading>
              <View style={styles.modalHeaderSpacer} />
            </View>
            <AssetPicker
              onSelectAsset={handleAssetSelect}
              onSelectAssets={handleMultiAssetSelect}
              selectedAssetId={selectedAssetId}
              selectedAssetIds={selectedAssetIds}
              showCategories={true}
              multiSelect={selectedTemplate === 'ordinal_position'}
              maxSelections={
                selectedTemplate === 'ordinal_position'
                  ? Math.max(0, parseInt(numberOfObjects) || 0)
                  : undefined
              }
            />
          </SafeAreaView>
        </Modal>
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
  templatesContainer: {
    flex: 1,
  },
  sectionDescription: {
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[6],
    textAlign: 'center',
  },
  templatesGrid: {
    gap: theme.spacing[4],
  },
  templateCard: {
    marginBottom: theme.spacing[2],
  },
  templateCardContent: {
    alignItems: 'center',
    minHeight: 140,
    justifyContent: 'center',
  },
  templateIconContainer: {
    width: 64,
    height: 64,
    borderRadius: theme.borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing[3],
  },
  templateName: {
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
  },
  templateDescription: {
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
  },
  selectedTemplateCard: {
    marginBottom: theme.spacing[6],
  },
  selectedTemplateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedTemplateIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing[3],
  },
  selectedTemplateText: {
    flex: 1,
  },
  selectedTemplateLabel: {
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[1],
  },
  selectedTemplateName: {
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  changeTemplateButton: {
    padding: theme.spacing[1],
  },
  changeTemplateText: {
    color: theme.colors.primary[500],
    fontWeight: '600',
  },
  textInputContainer: {
    marginBottom: theme.spacing[5],
  },
  label: {
    color: theme.colors.text.primary,
    fontWeight: '600',
    marginBottom: theme.spacing[2],
  },
  labelContainer: {
    marginBottom: theme.spacing[2],
  },
  helpText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.xs,
    marginTop: theme.spacing[1],
    fontStyle: 'italic',
  },
  textArea: {
    backgroundColor: theme.colors.background.light,
    borderWidth: 1,
    borderColor: theme.colors.gray[300],
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing[4],
    minHeight: 100,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
  },
  assetSection: {
    marginBottom: theme.spacing[6],
  },
  assetButton: {
    marginTop: theme.spacing[2],
  },
  assetButtonCard: {
    marginBottom: 0,
  },
  assetButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assetButtonText: {
    flex: 1,
    color: theme.colors.primary[500],
    fontWeight: '600',
    marginLeft: theme.spacing[3],
  },
  assetButtonTextUnselected: {
    flex: 1,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing[3],
  },
  errorCard: {
    backgroundColor: theme.colors.error[50],
    borderColor: theme.colors.error[200],
    marginBottom: theme.spacing[4],
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    flex: 1,
    color: theme.colors.error[700],
    marginLeft: theme.spacing[2],
  },
  buttonContainer: {
    marginTop: theme.spacing[4],
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing[6],
    paddingVertical: theme.spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[200],
  },
  modalCloseButton: {
    padding: theme.spacing[1],
  },
  modalTitle: {
    color: theme.colors.text.primary,
  },
  modalHeaderSpacer: {
    width: 36,
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
  row: {
    flexDirection: 'row',
    gap: theme.spacing[3],
    marginBottom: theme.spacing[5],
  },
  halfWidth: {
    flex: 1,
  },
  radioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[2],
    marginTop: theme.spacing[2],
  },
  radioOption: {
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[2],
    borderRadius: theme.borderRadius.full,
    borderWidth: 2,
    borderColor: theme.colors.gray[300],
    backgroundColor: theme.colors.background.light,
  },
  radioOptionSelected: {
    borderColor: theme.colors.primary[500],
    backgroundColor: theme.colors.primary[50],
  },
  radioText: {
    color: theme.colors.text.secondary,
  },
  radioTextSelected: {
    color: theme.colors.primary[700],
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: theme.colors.primary[50],
    borderColor: theme.colors.primary[200],
  },
  infoText: {
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[3],
  },
  createSubLessonButton: {
    paddingVertical: theme.spacing[2],
    paddingHorizontal: theme.spacing[4],
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary[500],
    alignSelf: 'flex-start',
  },
  createSubLessonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  selectContainer: {
    gap: theme.spacing[2],
  },
  subLessonOption: {
    borderWidth: 2,
    borderColor: theme.colors.gray[300],
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing[3],
    backgroundColor: theme.colors.background.light,
  },
  subLessonOptionSelected: {
    borderColor: theme.colors.primary[500],
    backgroundColor: theme.colors.primary[50],
  },
  subLessonOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subLessonOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  subLessonOptionText: {
    marginLeft: theme.spacing[3],
    flex: 1,
  },
  subLessonOptionTitle: {
    color: theme.colors.text.primary,
    fontWeight: '600',
    marginBottom: theme.spacing[1],
  },
  subLessonOptionPreview: {
    color: theme.colors.text.secondary,
  },
  addSubLessonButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing[3],
    paddingHorizontal: theme.spacing[4],
    borderRadius: theme.borderRadius.xl,
    borderWidth: 2,
    borderColor: theme.colors.primary[300],
    borderStyle: 'dashed',
    backgroundColor: theme.colors.primary[50],
  },
  addSubLessonText: {
    color: theme.colors.primary[700],
    fontWeight: '600',
    marginLeft: theme.spacing[2],
  },
});
