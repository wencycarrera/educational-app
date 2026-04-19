KidVenture Firebase Cloud Functions
📌 Overview

The KidVenture Firebase Cloud Functions handle backend server-side operations for the system, specifically focused on sending email notifications. These functions are used by the Admin Web and Mobile Application to deliver automated emails such as account verification, notifications, and system updates.

The system is built using Firebase Functions and integrates with third-party email services such as SendGrid or Mailgun.

⚙️ Purpose

These Cloud Functions are responsible for:

Sending email notifications to users
Handling system-triggered email events
Supporting both SendGrid and Mailgun email services
Providing a secure backend for email delivery
Running server-side logic independent of the client applications
🚀 Quick Start Guide
1. Install dependencies
npm install
2. Email service setup

Before running the functions, configure your email provider.

For full setup instructions, refer to:

FIREBASE_FUNCTIONS_SETUP.md
3. Configure SendGrid (default option)

Set Firebase function environment variables:

firebase functions:config:set sendgrid.api_key="YOUR_API_KEY"
firebase functions:config:set sendgrid.from_email="noreply@yourdomain.com"
4. Build the functions
npm run build
5. Deploy to Firebase
npm run deploy
🧪 Local Development

You can test functions locally using the Firebase emulator:

npm run serve

This allows you to simulate cloud function behavior without deploying.

📧 Available Functions
sendEmailNotification

This is the main cloud function responsible for sending emails.

It is a callable function that receives email data and sends it through the configured provider (SendGrid or Mailgun).

📥 Request Format
{
  to: string;
  subject: string;
  text: string;
  html?: string;
}
📤 Response Format
{
  success: boolean;
  message: string;
}
🔄 Switching Email Provider (SendGrid → Mailgun)

If you want to switch from SendGrid to Mailgun, follow these steps:

1. Install required packages
npm install mailgun.js form-data
2. Update source code
Open src/index.ts
Uncomment Mailgun implementation
Comment out SendGrid implementation
3. Set Mailgun configuration
firebase functions:config:set mailgun.api_key="YOUR_KEY"
firebase functions:config:set mailgun.domain="mg.yourdomain.com"
4. Redeploy functions
npm run deploy
🧠 System Role in KidVenture

These functions are integrated into the KidVenture ecosystem and support:

Admin Web (notifications, approvals, alerts)
Mobile App (account verification, updates)
Teacher and Parent communication system

They act as the backend communication layer of the platform.

⚠️ Important Notes
Always configure environment variables before deployment
Do not expose API keys in frontend code
Use Firebase emulator for local testing
Ensure email provider limits are monitored
Backup configuration before switching providers
🧾 Tech Stack
Firebase Cloud Functions
Node.js
SendGrid / Mailgun
TypeScript
👨‍💻 Developer

KidVenture Development Team