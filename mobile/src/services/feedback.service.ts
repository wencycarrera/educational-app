import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { FIREBASE_DB } from '../config/firebase';
import { TeacherFeedback, FeedbackFormData } from '../types/feedback';

/**
 * Submit teacher feedback
 */
export async function submitFeedback(
  teacherID: string,
  feedbackData: FeedbackFormData
): Promise<string> {
  try {
    const feedbackRef = collection(FIREBASE_DB, 'teacher_feedback');
    const docRef = await addDoc(feedbackRef, {
      teacherID,
      rating: feedbackData.rating,
      feedbackText: feedbackData.feedbackText,
      category: feedbackData.category,
      createdAt: serverTimestamp(),
    });

    return docRef.id;
  } catch (error) {
    console.error('Error submitting feedback:', error);
    throw new Error('Failed to submit feedback. Please try again.');
  }
}

/**
 * Get teacher's feedback history
 */
export async function getFeedbackHistory(
  teacherID: string
): Promise<TeacherFeedback[]> {
  try {
    const feedbackRef = collection(FIREBASE_DB, 'teacher_feedback');
    const q = query(
      feedbackRef,
      where('teacherID', '==', teacherID),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const feedback: TeacherFeedback[] = [];

    querySnapshot.forEach((doc) => {
      feedback.push({
        id: doc.id,
        ...doc.data(),
      } as TeacherFeedback);
    });

    return feedback;
  } catch (error) {
    console.error('Error fetching feedback history:', error);
    throw new Error('Failed to fetch feedback history. Please try again.');
  }
}

