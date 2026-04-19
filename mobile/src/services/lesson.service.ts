import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  addDoc,
  getDoc,
  doc,
  Timestamp,
} from 'firebase/firestore';
import { FIREBASE_DB } from '../config/firebase';

/**
 * Lesson Module Interface
 * Matches Firestore schema for lesson_modules collection
 */
export interface LessonModule {
  id: string;
  classID: string;
  topicCategory: string; // Links to fixed curriculum (e.g., "lesson_01")
  title: string;
  sequenceOrder: number; // For gated progression (deprecated, use subLessonOrder)
  activityType: 'drag_drop' | 'ordering' | 'quiz' | 'number_line' | 'place_value' | 'comparison' | 'visual_counting' | 'sequential_counting' | 'ordinal_position' | 'matching' | 'word_problem' | 'demonstration';
  subLessonID?: string; // Links to sub_lessons collection (NEW)
  subLessonOrder?: number; // Order within sub-lesson (1, 2, 3...) (NEW)
  data: {
    instruction?: string;
    correctCount?: number;
    assetID?: string; // Primary asset (for backward compatibility)
    assetIDs?: string[]; // Multiple assets (optional, for activities that need multiple)
    [key: string]: unknown; // Allow dynamic JSON data
  };
  createdAt: Timestamp;
}

/**
 * Get all lesson modules for a specific class
 * Note: We query without orderBy to avoid requiring a Firestore index, then sort manually
 */
export async function getLessonModulesByClass(
  classID: string
): Promise<LessonModule[]> {
  try {
    const lessonsRef = collection(FIREBASE_DB, 'lesson_modules');
    // Query without orderBy to avoid requiring composite index
    const q = query(lessonsRef, where('classID', '==', classID));

    const querySnapshot = await getDocs(q);
    const lessons: LessonModule[] = [];

    querySnapshot.forEach((doc) => {
      lessons.push({
        id: doc.id,
        ...doc.data(),
      } as LessonModule);
    });

    // Sort manually by sequenceOrder
    return lessons.sort((a, b) => (a.sequenceOrder || 0) - (b.sequenceOrder || 0));
  } catch (error) {
    console.error('Error fetching lesson modules:', error);
    // Return empty array instead of throwing - treat as no lessons available
    return [];
  }
}

/**
 * Get lesson modules grouped by topic category
 * Returns a map of topicCategory -> LessonModule[]
 */
export async function getLessonModulesByTopic(
  classID: string
): Promise<Record<string, LessonModule[]>> {
  const modules = await getLessonModulesByClass(classID);
  const grouped: Record<string, LessonModule[]> = {};

  modules.forEach((module) => {
    const topic = module.topicCategory;
    if (!grouped[topic]) {
      grouped[topic] = [];
    }
    grouped[topic].push(module);
  });

  return grouped;
}

/**
 * Check if a topic has any lesson modules available
 */
export async function hasLessonModulesForTopic(
  classID: string,
  topicCategory: string
): Promise<boolean> {
  try {
    const lessonsRef = collection(FIREBASE_DB, 'lesson_modules');
    const q = query(
      lessonsRef,
      where('classID', '==', classID),
      where('topicCategory', '==', topicCategory)
    );

    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking lesson modules:', error);
    return false;
  }
}

/**
 * Get a lesson module by ID
 */
export async function getLessonModuleById(moduleID: string): Promise<LessonModule | null> {
  try {
    const moduleRef = doc(FIREBASE_DB, 'lesson_modules', moduleID);
    const moduleSnap = await getDoc(moduleRef);

    if (!moduleSnap.exists()) {
      return null;
    }

    return {
      id: moduleSnap.id,
      ...moduleSnap.data(),
    } as LessonModule;
  } catch (error) {
    console.error('Error fetching lesson module:', error);
    throw new Error('Failed to fetch lesson module. Please try again.');
  }
}

/**
 * Create a new lesson module in Firestore
 * Links to fixed curriculum via topicCategory field
 */
export async function createLessonModule(
  classID: string,
  topicCategory: string,
  title: string,
  sequenceOrder: number,
  activityType: 'drag_drop' | 'ordering' | 'quiz' | 'number_line' | 'place_value' | 'comparison' | 'visual_counting' | 'sequential_counting' | 'ordinal_position' | 'matching' | 'word_problem' | 'demonstration',
  data: {
    instruction?: string;
    correctCount?: number;
    assetID?: string; // Primary asset (for backward compatibility)
    assetIDs?: string[]; // Multiple assets (optional)
    [key: string]: unknown;
  },
  subLessonID?: string,
  subLessonOrder?: number
): Promise<LessonModule> {
  try {
    const lessonsRef = collection(FIREBASE_DB, 'lesson_modules');
    
    const lessonData: {
      classID: string;
      topicCategory: string;
      title: string;
      sequenceOrder: number;
      activityType: string;
      data: unknown;
      subLessonID?: string;
      subLessonOrder?: number;
      createdAt: Timestamp;
    } = {
      classID,
      topicCategory,
      title,
      sequenceOrder,
      activityType,
      data,
      createdAt: Timestamp.now(),
    };

    // Add sub-lesson fields if provided
    if (subLessonID) {
      lessonData.subLessonID = subLessonID;
    }
    if (subLessonOrder !== undefined) {
      lessonData.subLessonOrder = subLessonOrder;
    }

    const docRef = await addDoc(lessonsRef, lessonData);

    const createdModule: LessonModule = {
      id: docRef.id,
      ...lessonData,
      createdAt: lessonData.createdAt,
    } as LessonModule;

    // Trigger notifications asynchronously (don't block on errors)
    triggerActivityNotifications(createdModule, classID, topicCategory).catch((error) => {
      console.error('Error sending activity notifications (non-blocking):', error);
      // Notifications failed but activity was created successfully
    });

    return createdModule;
  } catch (error) {
    console.error('Error creating lesson module:', error);
    throw new Error('Failed to create lesson module. Please try again.');
  }
}

/**
 * Trigger notifications when a new activity is created
 * This runs asynchronously and doesn't block activity creation
 */
async function triggerActivityNotifications(
  module: LessonModule,
  classID: string,
  topicCategory: string
): Promise<void> {
  try {
    // Import services dynamically to avoid circular dependencies
    const { sendNotificationToClass } = await import('./notification.service');
    const { sendEmailToClass } = await import('./email.service');
    const { getLessonActivityEmailTemplate } = await import('../utils/email-templates');
    const { FIXED_CURRICULUM } = await import('../data/curriculum-skeleton');
    const { doc, getDoc } = await import('firebase/firestore');
    const { FIREBASE_DB } = await import('../config/firebase');
    const { getClassroomById } = await import('./classroom.service');

    // Get lesson title from curriculum skeleton
    const lesson = FIXED_CURRICULUM.find((l) => l.id === topicCategory);
    const lessonTitle = lesson?.title || 'New Lesson';

    // Get teacher name (optional, for personalization)
    let teacherName: string | undefined;
    try {
      const classroom = await getClassroomById(classID);
      if (classroom?.teacherID) {
        const teacherRef = doc(FIREBASE_DB, 'users', classroom.teacherID);
        const teacherSnap = await getDoc(teacherRef);
        if (teacherSnap.exists()) {
          const teacherData = teacherSnap.data();
          if (teacherData.teacherProfile?.name) {
            teacherName = teacherData.teacherProfile.name;
          } else if (teacherData.name) {
            teacherName = teacherData.name;
          }
        }
      }
    } catch (error) {
      console.warn('Could not fetch teacher name for notification:', error);
      // Continue without teacher name
    }

    // Create in-app notifications for all students in the class
    await sendNotificationToClass(
      classID,
      `New Activity: ${module.title}`,
      `A new activity "${module.title}" is now available in ${lessonTitle}. Check it out!`,
      'lesson_post',
      {
        classID,
        moduleID: module.id,
        topicCategory,
      }
    );

    // Send email notifications
    const emailTemplate = getLessonActivityEmailTemplate(
      module.title,
      lessonTitle,
      teacherName
    );
    await sendEmailToClass(classID, emailTemplate);
  } catch (error) {
    // Log error but don't throw - this is a fire-and-forget operation
    console.error('Error in triggerActivityNotifications:', error);
  }
}

/**
 * Get all modules for a specific sub-lesson
 */
export async function getModulesBySubLesson(subLessonID: string): Promise<LessonModule[]> {
  try {
    const lessonsRef = collection(FIREBASE_DB, 'lesson_modules');
    const q = query(lessonsRef, where('subLessonID', '==', subLessonID));

    const querySnapshot = await getDocs(q);
    const modules: LessonModule[] = [];

    querySnapshot.forEach((doc) => {
      modules.push({
        id: doc.id,
        ...doc.data(),
      } as LessonModule);
    });

    // Sort by subLessonOrder, fallback to sequenceOrder
    return modules.sort((a, b) => {
      if (a.subLessonOrder !== undefined && b.subLessonOrder !== undefined) {
        return a.subLessonOrder - b.subLessonOrder;
      }
      return (a.sequenceOrder || 0) - (b.sequenceOrder || 0);
    });
  } catch (error) {
    console.error('Error fetching modules by sub-lesson:', error);
    return [];
  }
}

/**
 * Get all activities (modules) for a specific lesson topic
 * Includes both sub-lesson activities and legacy activities
 */
export async function getAllActivitiesForLesson(
  classID: string,
  topicId: string
): Promise<LessonModule[]> {
  try {
    const modulesByTopic = await getLessonModulesByTopic(classID);
    return modulesByTopic[topicId] || [];
  } catch (error) {
    console.error('Error fetching all activities for lesson:', error);
    return [];
  }
}

/**
 * Check if a lesson is completed
 * A lesson is completed when ALL activities in ALL sub-lessons are completed
 */
export async function isLessonCompleted(
  studentID: string,
  classID: string,
  topicId: string,
  progress: Array<{ moduleID: string; status: string; lastAttemptAt?: any }>
): Promise<boolean> {
  try {
    // Get all activities for this lesson
    const allActivities = await getAllActivitiesForLesson(classID, topicId);
    
    // If no activities, consider it not completable (return false)
    if (allActivities.length === 0) {
      return false;
    }

    // Check if each activity is completed
    // For each activity, find the most recent progress record
    const activityCompletionMap = new Map<string, boolean>();
    
    allActivities.forEach((activity) => {
      // Get all progress records for this activity
      const activityProgress = progress.filter((p) => p.moduleID === activity.id);
      
      if (activityProgress.length === 0) {
        // No progress means not completed
        activityCompletionMap.set(activity.id, false);
        return;
      }

      // Sort by lastAttemptAt to get the most recent
      const sortedProgress = activityProgress.sort((a, b) => {
        const aTime = a.lastAttemptAt?.toMillis?.() || a.lastAttemptAt || 0;
        const bTime = b.lastAttemptAt?.toMillis?.() || b.lastAttemptAt || 0;
        return bTime - aTime; // Descending order
      });

      const latestProgress = sortedProgress[0];
      // Activity is completed if status is 'completed'
      activityCompletionMap.set(activity.id, latestProgress.status === 'completed');
    });

    // All activities must be completed
    return Array.from(activityCompletionMap.values()).every((completed) => completed === true);
  } catch (error) {
    console.error('Error checking lesson completion:', error);
    return false;
  }
}

/**
 * Check if a lesson is unlocked
 * Lesson 1 is always unlocked
 * Lesson N is unlocked when Lesson N-1 is completed
 */
export async function isLessonUnlocked(
  topicId: string,
  studentID: string,
  classID: string,
  progress: Array<{ moduleID: string; status: string; lastAttemptAt?: any }>,
  curriculum: Array<{ id: string; order: number }>
): Promise<boolean> {
  try {
    // Find the lesson in curriculum
    const lesson = curriculum.find((l) => l.id === topicId);
    if (!lesson) {
      // If lesson not found in curriculum, consider it unlocked (edge case)
      return true;
    }

    // Lesson 1 is always unlocked
    if (lesson.order === 1) {
      return true;
    }

    // Find previous lesson
    const previousLesson = curriculum.find((l) => l.order === lesson.order - 1);
    if (!previousLesson) {
      // If previous lesson not found, consider it unlocked (edge case)
      return true;
    }

    // Check if previous lesson is completed
    const previousLessonCompleted = await isLessonCompleted(
      studentID,
      classID,
      previousLesson.id,
      progress
    );

    return previousLessonCompleted;
  } catch (error) {
    console.error('Error checking lesson unlock status:', error);
    // On error, default to unlocked to avoid blocking users
    return true;
  }
}

