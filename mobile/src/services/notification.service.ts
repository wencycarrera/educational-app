import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  doc,
  updateDoc,
  addDoc,
  onSnapshot,
  Timestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { FIREBASE_DB } from '../config/firebase';

/**
 * Notification Interface
 * Matches Firestore schema for notifications collection
 */
export interface Notification {
  id: string;
  recipientID: string;
  title: string;
  message: string;
  type: 'lesson_post' | 'sublesson_post' | 'announcement' | 'reminder' | 'system' | 'teacher_approved' | 'material_post';
  isRead: boolean;
  createdAt: Timestamp;
  data?: {
    [key: string]: unknown;
    classID?: string;
    moduleID?: string;
    subLessonID?: string;
    topicCategory?: string;
  };
}

/**
 * Get all notifications for a user
 */
export async function getNotifications(recipientID: string): Promise<Notification[]> {
  try {
    const notificationsRef = collection(FIREBASE_DB, 'notifications');
    const q = query(
      notificationsRef,
      where('recipientID', '==', recipientID),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const notifications: Notification[] = [];

    querySnapshot.forEach((doc) => {
      notifications.push({
        id: doc.id,
        ...doc.data(),
      } as Notification);
    });

    return notifications;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw new Error('Failed to fetch notifications. Please try again.');
  }
}

/**
 * Get unread notifications count
 */
export async function getUnreadCount(recipientID: string): Promise<number> {
  try {
    const notificationsRef = collection(FIREBASE_DB, 'notifications');
    const q = query(
      notificationsRef,
      where('recipientID', '==', recipientID),
      where('isRead', '==', false)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return 0;
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationID: string): Promise<void> {
  try {
    const notificationRef = doc(FIREBASE_DB, 'notifications', notificationID);
    await updateDoc(notificationRef, {
      isRead: true,
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw new Error('Failed to mark notification as read. Please try again.');
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(recipientID: string): Promise<void> {
  try {
    const notifications = await getNotifications(recipientID);
    const unreadNotifications = notifications.filter((n) => !n.isRead);

    const updatePromises = unreadNotifications.map((notification) =>
      markNotificationAsRead(notification.id)
    );

    await Promise.all(updatePromises);
  } catch (error) {
    console.error('Error marking all as read:', error);
    throw new Error('Failed to mark all notifications as read. Please try again.');
  }
}

/**
 * Subscribe to notifications for real-time updates
 * Returns an unsubscribe function
 */
export function subscribeToNotifications(
  recipientID: string,
  callback: (notifications: Notification[]) => void
): Unsubscribe {
  const notificationsRef = collection(FIREBASE_DB, 'notifications');
  const q = query(
    notificationsRef,
    where('recipientID', '==', recipientID),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    q,
    (querySnapshot) => {
      const notifications: Notification[] = [];
      querySnapshot.forEach((doc) => {
        notifications.push({
          id: doc.id,
          ...doc.data(),
        } as Notification);
      });
      callback(notifications);
    },
    (error) => {
      console.error('Error in notifications subscription:', error);
      callback([]);
    }
  );
}

/**
 * Subscribe to unread count for real-time updates
 * Returns an unsubscribe function
 */
export function subscribeToUnreadCount(
  recipientID: string,
  callback: (count: number) => void
): Unsubscribe {
  const notificationsRef = collection(FIREBASE_DB, 'notifications');
  const q = query(
    notificationsRef,
    where('recipientID', '==', recipientID),
    where('isRead', '==', false)
  );

  return onSnapshot(
    q,
    (querySnapshot) => {
      callback(querySnapshot.size);
    },
    (error) => {
      console.error('Error in unread count subscription:', error);
      callback(0);
    }
  );
}

/**
 * Create a single notification in Firestore
 */
export async function createNotification(
  recipientID: string,
  title: string,
  message: string,
  type: Notification['type'],
  data?: Notification['data']
): Promise<string> {
  try {
    const notificationsRef = collection(FIREBASE_DB, 'notifications');
    const notificationData = {
      recipientID,
      title: title.trim(),
      message: message.trim(),
      type,
      isRead: false,
      createdAt: Timestamp.now(),
      ...(data && { data }),
    };

    const docRef = await addDoc(notificationsRef, notificationData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw new Error('Failed to create notification. Please try again.');
  }
}

/**
 * Create notifications for multiple recipients (bulk operation)
 * Returns array of notification IDs created
 */
export async function createBulkNotifications(
  recipientIDs: string[],
  title: string,
  message: string,
  type: Notification['type'],
  data?: Notification['data']
): Promise<string[]> {
  try {
    if (recipientIDs.length === 0) {
      return [];
    }

    const notificationsRef = collection(FIREBASE_DB, 'notifications');
    const notificationData = {
      title: title.trim(),
      message: message.trim(),
      type,
      isRead: false,
      createdAt: Timestamp.now(),
      ...(data && { data }),
    };

    // Create all notifications in parallel
    const createPromises = recipientIDs.map(async (recipientID) => {
      const docRef = await addDoc(notificationsRef, {
        ...notificationData,
        recipientID,
      });
      return docRef.id;
    });

    const notificationIDs = await Promise.all(createPromises);
    return notificationIDs;
  } catch (error) {
    console.error('Error creating bulk notifications:', error);
    throw new Error('Failed to create notifications. Please try again.');
  }
}

/**
 * Send notifications to all students in a classroom
 * Gets student IDs from classroom and creates notifications for each
 */
export async function sendNotificationToClass(
  classID: string,
  title: string,
  message: string,
  type: Notification['type'],
  data?: Notification['data']
): Promise<string[]> {
  try {
    // Import here to avoid circular dependency
    const { getClassroomById } = await import('./classroom.service');
    
    // Get classroom to retrieve student IDs
    const classroom = await getClassroomById(classID);
    if (!classroom) {
      throw new Error('Classroom not found');
    }

    // If no students in class, return empty array
    if (!classroom.studentIDs || classroom.studentIDs.length === 0) {
      console.log(`No students in class ${classID}, skipping notifications`);
      return [];
    }

    // Add classID to data if not already present
    const notificationData: Notification['data'] = {
      ...data,
      classID,
    };

    // Create notifications for all students
    return await createBulkNotifications(
      classroom.studentIDs,
      title,
      message,
      type,
      notificationData
    );
  } catch (error) {
    console.error('Error sending notifications to class:', error);
    throw new Error('Failed to send notifications to class. Please try again.');
  }
}

/**
 * Send teacher approval notification to a teacher
 * This should be called when an admin approves a teacher's account
 * 
 * @param teacherID - The ID of the teacher being approved
 * @param teacherEmail - The teacher's email address (for email notification)
 * @param teacherName - The teacher's name (for personalization)
 */
export async function sendTeacherApprovalNotification(
  teacherID: string,
  teacherEmail: string,
  teacherName?: string
): Promise<void> {
  try {
    // Import services dynamically
    const { sendEmailNotification } = await import('./email.service');
    const { getTeacherApprovalEmailTemplate } = await import('../utils/email-templates');

    // Create in-app notification for the teacher
    await createNotification(
      teacherID,
      'Account Approved!',
      'Your KidVenture teacher account has been approved. You can now create classes and lessons!',
      'teacher_approved',
      {}
    );

    // Send email notification
    const emailTemplate = getTeacherApprovalEmailTemplate(teacherName || 'Teacher');
    await sendEmailNotification(teacherEmail, emailTemplate);
  } catch (error) {
    console.error('Error sending teacher approval notification:', error);
    // Don't throw - notification failures shouldn't block approval
  }
}

