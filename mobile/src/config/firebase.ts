import Constants from 'expo-constants';
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

/**
 * Firebase Configuration
 * 
 * These values are loaded from environment variables via app.config.js
 * app.config.js runs in Node.js context (build time) and can use dotenv
 * The values are passed through expo.extra and accessed via Constants
 * 
 * Make sure you have a .env file with your Firebase config values
 * 
 * To get these values:
 * Firebase Console → Project Settings → Your apps → Web app config
 */
const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.firebaseApiKey,
  authDomain: Constants.expoConfig?.extra?.firebaseAuthDomain,
  projectId: Constants.expoConfig?.extra?.firebaseProjectId,
  storageBucket: Constants.expoConfig?.extra?.firebaseStorageBucket,
  messagingSenderId: Constants.expoConfig?.extra?.firebaseMessagingSenderId,
  appId: Constants.expoConfig?.extra?.firebaseAppId,
  measurementId: Constants.expoConfig?.extra?.firebaseMeasurementId
};

// Validate that all required config values are present
const missingConfig = [];
if (!firebaseConfig.apiKey) missingConfig.push('FIREBASE_API_KEY');
if (!firebaseConfig.projectId) missingConfig.push('FIREBASE_PROJECT_ID');
if (!firebaseConfig.authDomain) missingConfig.push('FIREBASE_AUTH_DOMAIN');
if (!firebaseConfig.storageBucket) missingConfig.push('FIREBASE_STORAGE_BUCKET');
if (!firebaseConfig.messagingSenderId) missingConfig.push('FIREBASE_MESSAGING_SENDER_ID');
if (!firebaseConfig.appId) missingConfig.push('FIREBASE_APP_ID');

if (missingConfig.length > 0) {
  const errorMessage = `Missing Firebase configuration: ${missingConfig.join(', ')}. 
  
For local development: Check your .env file in the mobile/ directory.
For EAS builds: Set these as EAS secrets using: npx eas secret:create --scope project --name FIREBASE_API_KEY --value "your-value"

Current config values:
- apiKey: ${firebaseConfig.apiKey ? '✓' : '✗'}
- projectId: ${firebaseConfig.projectId ? '✓' : '✗'}
- authDomain: ${firebaseConfig.authDomain ? '✓' : '✗'}
- storageBucket: ${firebaseConfig.storageBucket ? '✓' : '✗'}
- messagingSenderId: ${firebaseConfig.messagingSenderId ? '✓' : '✗'}
- appId: ${firebaseConfig.appId ? '✓' : '✗'}`;
  
  console.error(errorMessage);
  throw new Error(errorMessage);
}

export const FIREBASE_APP = initializeApp(firebaseConfig);
export const FIREBASE_AUTH = getAuth(FIREBASE_APP);
export const FIREBASE_DB = getFirestore(FIREBASE_APP);