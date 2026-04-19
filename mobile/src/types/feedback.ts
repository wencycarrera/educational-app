import { Timestamp } from 'firebase/firestore';

/**
 * Feedback Category
 */
export type FeedbackCategory = 'usability' | 'educational' | 'general';

/**
 * Teacher Feedback Interface
 * Stores teacher feedback on app usability and educational effectiveness
 */
export interface TeacherFeedback {
  id: string;
  teacherID: string;
  rating: number; // 1-5 stars
  feedbackText: string;
  category: FeedbackCategory;
  createdAt: Timestamp;
}

/**
 * Feedback Form Data Interface
 * Data structure for submitting new feedback
 */
export interface FeedbackFormData {
  rating: number;
  feedbackText: string;
  category: FeedbackCategory;
}

