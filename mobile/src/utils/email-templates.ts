/**
 * Email Templates for KidVenture Notifications
 * 
 * These templates provide the subject and body for different notification types.
 * Actual email sending is handled by Firebase Functions or external service.
 */

export interface EmailTemplate {
  subject: string;
  body: string;
  htmlBody?: string; // Optional HTML version
}

/**
 * Template for new lesson activity notification
 */
export function getLessonActivityEmailTemplate(
  activityTitle: string,
  lessonTitle: string,
  teacherName?: string
): EmailTemplate {
  const subject = `New Activity: ${activityTitle}`;
  const body = `Hello!

Your teacher${teacherName ? ` ${teacherName}` : ''} has created a new activity for you: "${activityTitle}"

Lesson: ${lessonTitle}

Log in to KidVenture to start learning and having fun!

Best regards,
KidVenture Team`;

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4F46E5;">New Activity Available!</h2>
      <p>Hello!</p>
      <p>Your teacher${teacherName ? ` <strong>${teacherName}</strong>` : ''} has created a new activity for you:</p>
      <div style="background-color: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #1F2937;">${activityTitle}</h3>
        <p style="margin-bottom: 0;"><strong>Lesson:</strong> ${lessonTitle}</p>
      </div>
      <p>Log in to KidVenture to start learning and having fun!</p>
      <p style="margin-top: 30px;">Best regards,<br>KidVenture Team</p>
    </div>
  `;

  return { subject, body, htmlBody };
}

/**
 * Template for new sub-lesson notification
 */
export function getSubLessonEmailTemplate(
  subLessonTitle: string,
  lessonTitle: string,
  teacherName?: string
): EmailTemplate {
  const subject = `New Lesson: ${subLessonTitle}`;
  const body = `Hello!

Your teacher${teacherName ? ` ${teacherName}` : ''} has added a new lesson: "${subLessonTitle}"

Part of: ${lessonTitle}

Check it out in KidVenture and continue your learning journey!

Best regards,
KidVenture Team`;

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4F46E5;">New Lesson Available!</h2>
      <p>Hello!</p>
      <p>Your teacher${teacherName ? ` <strong>${teacherName}</strong>` : ''} has added a new lesson:</p>
      <div style="background-color: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #1F2937;">${subLessonTitle}</h3>
        <p style="margin-bottom: 0;"><strong>Part of:</strong> ${lessonTitle}</p>
      </div>
      <p>Check it out in KidVenture and continue your learning journey!</p>
      <p style="margin-top: 30px;">Best regards,<br>KidVenture Team</p>
    </div>
  `;

  return { subject, body, htmlBody };
}

/**
 * Template for teacher approval notification
 */
export function getTeacherApprovalEmailTemplate(teacherName: string): EmailTemplate {
  const subject = 'Welcome to KidVenture - Your Account Has Been Approved!';
  const body = `Hello ${teacherName},

Great news! Your KidVenture teacher account has been approved by the administrator.

You can now:
- Create and manage classrooms
- Build interactive lessons and activities
- Monitor student progress
- Provide feedback to learners

Log in to KidVenture to get started!

Best regards,
KidVenture Team`;

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #10B981;">Welcome to KidVenture!</h2>
      <p>Hello <strong>${teacherName}</strong>,</p>
      <p>Great news! Your KidVenture teacher account has been approved by the administrator.</p>
      <div style="background-color: #ECFDF5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10B981;">
        <p style="margin-top: 0;"><strong>You can now:</strong></p>
        <ul style="margin-bottom: 0;">
          <li>Create and manage classrooms</li>
          <li>Build interactive lessons and activities</li>
          <li>Monitor student progress</li>
          <li>Provide feedback to learners</li>
        </ul>
      </div>
      <p>Log in to KidVenture to get started!</p>
      <p style="margin-top: 30px;">Best regards,<br>KidVenture Team</p>
    </div>
  `;

  return { subject, body, htmlBody };
}

/**
 * Template for new material notification
 */
export function getMaterialEmailTemplate(
  materialTitle: string,
  teacherName?: string
): EmailTemplate {
  const subject = `New Material: ${materialTitle}`;
  const body = `Hello!

Your teacher${teacherName ? ` ${teacherName}` : ''} has shared new learning material: "${materialTitle}"

Check it out in KidVenture!

Best regards,
KidVenture Team`;

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4F46E5;">New Material Available!</h2>
      <p>Hello!</p>
      <p>Your teacher${teacherName ? ` <strong>${teacherName}</strong>` : ''} has shared new learning material:</p>
      <div style="background-color: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #1F2937;">${materialTitle}</h3>
      </div>
      <p>Check it out in KidVenture!</p>
      <p style="margin-top: 30px;">Best regards,<br>KidVenture Team</p>
    </div>
  `;

  return { subject, body, htmlBody };
}

/**
 * Template for general announcements
 */
export function getAnnouncementEmailTemplate(
  announcementTitle: string,
  announcementMessage: string,
  teacherName?: string
): EmailTemplate {
  const subject = announcementTitle;
  const body = `Hello!

${teacherName ? `From ${teacherName}:\n\n` : ''}${announcementMessage}

Best regards,
KidVenture Team`;

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4F46E5;">${announcementTitle}</h2>
      <p>Hello!</p>
      ${teacherName ? `<p>From <strong>${teacherName}</strong>:</p>` : ''}
      <div style="background-color: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; white-space: pre-wrap;">${announcementMessage}</p>
      </div>
      <p style="margin-top: 30px;">Best regards,<br>KidVenture Team</p>
    </div>
  `;

  return { subject, body, htmlBody };
}

