import Constants from 'expo-constants';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { FIREBASE_APP } from '../config/firebase';
import type { EmailTemplate } from '../utils/email-templates';

/**
 * Email Notification Service
 * 
 * This service handles sending email notifications via Firebase Cloud Functions.
 * The actual email sending is implemented in a Firebase Function (functions/src/index.ts).
 * 
 * To set up email sending:
 * 1. Deploy a Firebase Function that handles email sending (using SendGrid, Mailgun, etc.)
 * 2. The function should accept the email data and send via your email service
 * 3. Update the function name below to match your deployed function
 */

// Name of the Firebase Callable Function for sending emails
const EMAIL_FUNCTION_NAME = 'sendEmailNotification';

// Fallback: If Firebase Functions are not available, this will be set to null
let sendEmailFunction: ReturnType<typeof httpsCallable> | null = null;

/**
 * Initialize the email service
 * This sets up the Firebase Functions callable function
 */
function initializeEmailService(): void {
  try {
    // Specify region if you deployed to a different region than us-central1
    // Example: getFunctions(FIREBASE_APP, 'asia-southeast1')
    const functions = getFunctions(FIREBASE_APP);
    sendEmailFunction = httpsCallable(functions, EMAIL_FUNCTION_NAME);
  } catch (error) {
    console.warn('Email service not available. Firebase Functions may not be configured.', error);
    sendEmailFunction = null;
  }
}

// Initialize on import
initializeEmailService();

/**
 * Email data structure expected by the Firebase Function
 */
export interface EmailData {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Send a single email notification
 * 
 * @param recipientEmail - Email address of the recipient
 * @param template - Email template with subject and body
 * @returns Promise that resolves when email is sent (or queued)
 */
export async function sendEmailNotification(
  recipientEmail: string,
  template: EmailTemplate
): Promise<void> {
  try {
    if (!sendEmailFunction) {
      console.warn('Email service not available. Email not sent to:', recipientEmail);
      return;
    }

    const emailData: EmailData = {
      to: recipientEmail,
      subject: template.subject,
      text: template.body,
      html: template.htmlBody,
    };

    await sendEmailFunction(emailData);
  } catch (error: any) {
    if (error?.code === 'functions/not-found') {
      console.warn(`Email function "${EMAIL_FUNCTION_NAME}" not deployed; skipping email to ${recipientEmail}.`);
      return;
    }
    
    // Handle internal errors (likely configuration issues)
    if (error?.code === 'functions/internal' || error?.code === 'internal') {
      const errorMessage = error?.message || error?.details || 'Unknown error';
      console.warn(
        `Email service configuration issue. Email not sent to ${recipientEmail}. ` +
        `This usually means the Resend API key is not configured in Firebase Functions. ` +
        `Error: ${errorMessage}`
      );
      return;
    }
    
    // Log other errors but don't throw - email failures shouldn't block the main flow
    console.error('Error sending email notification:', error);
    // In production, you might want to queue failed emails for retry
  }
}

/**
 * Send email notifications to multiple recipients
 * 
 * @param recipientEmails - Array of email addresses
 * @param template - Email template with subject and body
 * @returns Promise that resolves when all emails are sent (or queued)
 */
export async function sendBulkEmailNotifications(
  recipientEmails: string[],
  template: EmailTemplate
): Promise<void> {
  if (recipientEmails.length === 0) {
    return;
  }

  // Send emails in parallel but catch individual errors
  const emailPromises = recipientEmails.map((email) =>
    sendEmailNotification(email, template).catch((error) => {
      console.error(`Failed to send email to ${email}:`, error);
      // Continue with other emails even if one fails
    })
  );

  await Promise.all(emailPromises);
}

/**
 * Send email notification to all students in a class
 * Gets student emails from Firestore and sends notifications
 * 
 * @param classID - ID of the classroom
 * @param template - Email template with subject and body
 * @returns Promise that resolves when emails are sent
 */
export async function sendEmailToClass(
  classID: string,
  template: EmailTemplate
): Promise<void> {
  try {
    // Import here to avoid circular dependency
    const { getStudentsByClass } = await import('./classroom.service');
    const { doc, getDoc } = await import('firebase/firestore');
    const { FIREBASE_DB } = await import('../config/firebase');

    // Get all students in the class
    const students = await getStudentsByClass(classID);

    if (students.length === 0) {
      console.log(`No students in class ${classID}, skipping emails`);
      return;
    }

    // Get email addresses for all students (parents)
    const emailAddresses: string[] = [];

    for (const student of students) {
      try {
        // Get parent email from user document
        const userRef = doc(FIREBASE_DB, 'users', student.studentID);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          const email = userData.email;

          if (email && typeof email === 'string') {
            emailAddresses.push(email);
          }
        }
      } catch (error) {
        console.error(`Error getting email for student ${student.studentID}:`, error);
        // Continue with other students
      }
    }

    // Send emails to all parents
    await sendBulkEmailNotifications(emailAddresses, template);
  } catch (error) {
    console.error('Error sending emails to class:', error);
    // Don't throw - email failures shouldn't block the main flow
  }
}

/**
 * Check if email service is available
 */
export function isEmailServiceAvailable(): boolean {
  return sendEmailFunction !== null;
}

