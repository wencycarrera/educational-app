import AsyncStorage from '@react-native-async-storage/async-storage';

const CONTENT_VIEWED_KEY_PREFIX = 'content_viewed_';

/**
 * Mark sub-lesson content as viewed by student
 */
export async function markContentAsViewed(
  studentID: string,
  subLessonID: string
): Promise<void> {
  try {
    const key = `${CONTENT_VIEWED_KEY_PREFIX}${studentID}_${subLessonID}`;
    await AsyncStorage.setItem(key, 'true');
  } catch (error) {
    console.error('Error marking content as viewed:', error);
  }
}

/**
 * Check if sub-lesson content has been viewed by student
 */
export async function hasContentBeenViewed(
  studentID: string,
  subLessonID: string
): Promise<boolean> {
  try {
    const key = `${CONTENT_VIEWED_KEY_PREFIX}${studentID}_${subLessonID}`;
    const value = await AsyncStorage.getItem(key);
    return value === 'true';
  } catch (error) {
    console.error('Error checking content viewed status:', error);
    return false;
  }
}

/**
 * Clear content viewed status (for testing or reset)
 */
export async function clearContentViewed(
  studentID: string,
  subLessonID: string
): Promise<void> {
  try {
    const key = `${CONTENT_VIEWED_KEY_PREFIX}${studentID}_${subLessonID}`;
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error('Error clearing content viewed status:', error);
  }
}

