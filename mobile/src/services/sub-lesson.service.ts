import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
} from 'firebase/firestore';
import { FIREBASE_DB } from '../config/firebase';

/**
 * Sub-Lesson Interface
 * Matches Firestore schema for sub_lessons collection
 */
export interface SubLesson {
  id: string;
  classID: string;
  topicCategory: string; // Links to fixed curriculum (e.g., "lesson_01")
  title: string; // e.g., "Counting Forward and Backward (0-20)"
  content: string; // The "Kids Can Read/Listen" text
  order: number; // Order within the lesson topic
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Get all sub-lessons for a specific topic
 */
export async function getSubLessonsByTopic(
  classID: string,
  topicCategory: string
): Promise<SubLesson[]> {
  try {
    const subLessonsRef = collection(FIREBASE_DB, 'sub_lessons');
    const q = query(
      subLessonsRef,
      where('classID', '==', classID),
      where('topicCategory', '==', topicCategory)
    );

    const querySnapshot = await getDocs(q);
    const subLessons: SubLesson[] = [];

    querySnapshot.forEach((doc) => {
      subLessons.push({
        id: doc.id,
        ...doc.data(),
      } as SubLesson);
    });

    // Sort by order
    return subLessons.sort((a, b) => (a.order || 0) - (b.order || 0));
  } catch (error) {
    console.error('Error fetching sub-lessons:', error);
    return [];
  }
}

/**
 * Get a sub-lesson by ID
 */
export async function getSubLessonById(subLessonID: string): Promise<SubLesson | null> {
  try {
    const subLessonRef = doc(FIREBASE_DB, 'sub_lessons', subLessonID);
    const subLessonSnap = await getDoc(subLessonRef);

    if (!subLessonSnap.exists()) {
      return null;
    }

    return {
      id: subLessonSnap.id,
      ...subLessonSnap.data(),
    } as SubLesson;
  } catch (error) {
    console.error('Error fetching sub-lesson:', error);
    throw new Error('Failed to fetch sub-lesson. Please try again.');
  }
}

/**
 * Get next order number for a topic
 */
async function getNextOrderForTopic(
  classID: string,
  topicCategory: string
): Promise<number> {
  try {
    const subLessons = await getSubLessonsByTopic(classID, topicCategory);
    if (subLessons.length === 0) return 1;
    const maxOrder = Math.max(...subLessons.map((sl) => sl.order || 0));
    return maxOrder + 1;
  } catch (error) {
    console.error('Error calculating next order:', error);
    return 1;
  }
}

/**
 * Create a new sub-lesson
 */
export async function createSubLesson(
  classID: string,
  topicCategory: string,
  title: string,
  content: string,
  order?: number
): Promise<SubLesson> {
  try {
    const subLessonsRef = collection(FIREBASE_DB, 'sub_lessons');

    // Auto-calculate order if not provided
    const finalOrder = order || (await getNextOrderForTopic(classID, topicCategory));

    const subLessonData = {
      classID,
      topicCategory,
      title: title.trim(),
      content: content.trim(),
      order: finalOrder,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(subLessonsRef, subLessonData);

    const createdSubLesson: SubLesson = {
      id: docRef.id,
      ...subLessonData,
    } as SubLesson;

    // Trigger notifications asynchronously (don't block on errors)
    triggerSubLessonNotifications(createdSubLesson, classID, topicCategory).catch((error) => {
      console.error('Error sending sub-lesson notifications (non-blocking):', error);
      // Notifications failed but sub-lesson was created successfully
    });

    return createdSubLesson;
  } catch (error) {
    console.error('Error creating sub-lesson:', error);
    throw new Error('Failed to create sub-lesson. Please try again.');
  }
}

/**
 * Trigger notifications when a new sub-lesson is created
 * This runs asynchronously and doesn't block sub-lesson creation
 */
async function triggerSubLessonNotifications(
  subLesson: SubLesson,
  classID: string,
  topicCategory: string
): Promise<void> {
  try {
    // Import services dynamically to avoid circular dependencies
    const { sendNotificationToClass } = await import('./notification.service');
    const { sendEmailToClass } = await import('./email.service');
    const { getSubLessonEmailTemplate } = await import('../utils/email-templates');
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
      `New Lesson: ${subLesson.title}`,
      `A new lesson "${subLesson.title}" has been added to ${lessonTitle}. Start learning now!`,
      'sublesson_post',
      {
        classID,
        subLessonID: subLesson.id,
        topicCategory,
      }
    );

    // Send email notifications
    const emailTemplate = getSubLessonEmailTemplate(
      subLesson.title,
      lessonTitle,
      teacherName
    );
    await sendEmailToClass(classID, emailTemplate);
  } catch (error) {
    // Log error but don't throw - this is a fire-and-forget operation
    console.error('Error in triggerSubLessonNotifications:', error);
  }
}

/**
 * Update a sub-lesson
 */
export async function updateSubLesson(
  subLessonID: string,
  updates: {
    title?: string;
    content?: string;
    order?: number;
  }
): Promise<void> {
  try {
    const subLessonRef = doc(FIREBASE_DB, 'sub_lessons', subLessonID);

    const updateData: {
      title?: string;
      content?: string;
      order?: number;
      updatedAt: Timestamp;
    } = {
      updatedAt: Timestamp.now(),
    };

    if (updates.title !== undefined) {
      updateData.title = updates.title.trim();
    }
    if (updates.content !== undefined) {
      updateData.content = updates.content.trim();
    }
    if (updates.order !== undefined) {
      updateData.order = updates.order;
    }

    await updateDoc(subLessonRef, updateData);
  } catch (error) {
    console.error('Error updating sub-lesson:', error);
    throw new Error('Failed to update sub-lesson. Please try again.');
  }
}

/**
 * Delete a sub-lesson
 * Note: Should validate that no modules reference this sub-lesson before deleting
 */
export async function deleteSubLesson(subLessonID: string): Promise<void> {
  try {
    // TODO: Add validation to check if any modules reference this sub-lesson
    // For now, we'll allow deletion but this should be handled in the UI

    const subLessonRef = doc(FIREBASE_DB, 'sub_lessons', subLessonID);
    await deleteDoc(subLessonRef);
  } catch (error) {
    console.error('Error deleting sub-lesson:', error);
    throw new Error('Failed to delete sub-lesson. Please try again.');
  }
}

/**
 * Check if any modules reference a sub-lesson
 */
export async function hasModulesForSubLesson(subLessonID: string): Promise<boolean> {
  try {
    const { getLessonModulesByClass } = await import('./lesson.service');
    // This is a simplified check - in production, you'd want a more efficient query
    // For now, we'll check if any module has this subLessonID
    // This requires importing lesson service, which creates a circular dependency risk
    // Better approach: query lesson_modules collection directly
    const modulesRef = collection(FIREBASE_DB, 'lesson_modules');
    const q = query(modulesRef, where('subLessonID', '==', subLessonID));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking modules for sub-lesson:', error);
    return false;
  }
}

