# Firebase Setup Guide - Step by Step

This guide will walk you through setting up Firebase for your educational app from scratch.

## Prerequisites
- A Google account
- Node.js and npm installed
- Your Expo app running

---

## Step 1: Create a Firebase Project

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/
   - Sign in with your Google account

2. **Create a New Project**
   - Click "Add project" or "Create a project"
   - Enter a project name (e.g., "educational-app")
   - Click "Continue"

3. **Configure Google Analytics (Optional)**
   - You can enable or disable Google Analytics
   - If enabled, select or create an Analytics account
   - Click "Create project"

4. **Wait for Project Creation**
   - Firebase will set up your project (takes 30-60 seconds)
   - Click "Continue" when ready

---

## Step 2: Add Your App to Firebase

Since you're using Expo/React Native, you'll need to add both iOS and Android apps:

### For Android:

1. **Add Android App**
   - In Firebase Console, click the Android icon (or "Add app" → Android)
   - **Android package name**: Check your `app.json` file for the `android.package` field
     - If not set, it's usually: `com.yourname.educationalapp`
     - You can also find it in `android/app/build.gradle` if you've ejected
   - **App nickname** (optional): "Educational App Android"
   - **Debug signing certificate SHA-1** (optional for now, needed for some features later)
   - Click "Register app"

2. **Download `google-services.json`**
   - Download the config file
   - **IMPORTANT**: For Expo, you don't need to place this file manually
   - The config will be in your Firebase Console

### For iOS:

1. **Add iOS App**
   - Click the iOS icon (or "Add app" → iOS)
   - **iOS bundle ID**: Check your `app.json` for `ios.bundleIdentifier`
     - Usually: `com.yourname.educationalapp`
   - **App nickname** (optional): "Educational App iOS"
   - **App Store ID** (optional): Leave blank for now
   - Click "Register app"

2. **Download `GoogleService-Info.plist`**
   - Download the config file
   - **IMPORTANT**: For Expo, you don't need to place this file manually

---

## Step 3: Get Your Firebase Configuration

1. **Go to Project Settings**
   - Click the gear icon ⚙️ next to "Project Overview"
   - Select "Project settings"

2. **Scroll to "Your apps" section**
   - You'll see your registered apps
   - Click on the web icon `</>` (or "Add app" → Web)

3. **Register Web App**
   - **App nickname**: "Educational App Web"
   - **Firebase Hosting** (optional): Leave unchecked for now
   - Click "Register app"

4. **Copy Your Config**
   - You'll see a code snippet like this:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abcdef"
   };
   ```
   - **Copy these values** - you'll need them in the next step

---

## Step 4: Install Firebase Packages

Open your terminal in the `mobile` directory and run:

```bash
npm install firebase
```

This installs the Firebase SDK for JavaScript/TypeScript.

---

## Step 5: Configure Firebase in Your App

1. **Open `mobile/src/config/firebase.ts`**

2. **Replace the placeholder values** with your actual Firebase config:

```typescript
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Replace these with your actual values from Firebase Console
const firebaseConfig = {
  apiKey: "AIza...", // Your actual API key
  authDomain: "your-project.firebaseapp.com", // Your actual auth domain
  projectId: "your-project-id", // Your actual project ID
  storageBucket: "your-project.appspot.com", // Your actual storage bucket
  messagingSenderId: "123456789", // Your actual sender ID
  appId: "1:123456789:web:abcdef" // Your actual app ID
};

export const FIREBASE_APP = initializeApp(firebaseConfig);
export const FIREBASE_AUTH = getAuth(FIREBASE_APP);
export const FIREBASE_DB = getFirestore(FIREBASE_APP);
```

**⚠️ Security Note**: For production apps, consider using environment variables to store these values. For now, this is fine for development.

---

## Step 6: Enable Authentication Methods

1. **Go to Authentication**
   - In Firebase Console, click "Authentication" in the left sidebar
   - Click "Get started"

2. **Enable Sign-in Methods**
   - Click "Sign-in method" tab
   - For email/password:
     - Click "Email/Password"
     - Toggle "Enable" to ON
     - Click "Save"
   - For other methods (Google, etc.):
     - Click the provider (e.g., "Google")
     - Toggle "Enable" to ON
     - Follow the setup instructions
     - Click "Save"

---

## Step 7: Enable Billing (Required for Firestore)

**⚠️ Important**: Firebase requires billing to be enabled, even for the free tier. You won't be charged if you stay within free limits.

1. **Go to Project Settings**
   - Click the gear icon ⚙️ next to "Project Overview"
   - Select "Usage and billing"

2. **Enable Billing**
   - Click "Upgrade project" or "Enable billing"
   - You'll be redirected to Google Cloud Console
   - Link a billing account (or create one)
   - Add a payment method (credit/debit card)
   - **Don't worry**: You won't be charged if you stay within the free tier!

3. **Verify Billing is Active**
   - Return to Firebase Console
   - Check that billing status shows as "Active"

**📖 For detailed billing setup instructions, see `FIREBASE_BILLING_GUIDE.md`**

## Step 8: Set Up Firestore Database

1. **Go to Firestore Database**
   - In Firebase Console, click "Firestore Database" in the left sidebar
   - Click "Create database"

2. **Choose Security Rules**
   - Select "Start in test mode" (for development)
   - **⚠️ Important**: Test mode allows anyone to read/write. Only use for development!
   - Click "Next"

3. **Choose Location**
   - Select a location closest to your users
   - Click "Enable"

4. **Wait for Database Creation**
   - Takes about 1-2 minutes

---

## Step 9: Set Up Basic Security Rules (Important!)

1. **Go to Firestore Rules**
   - In Firestore Database, click "Rules" tab

2. **Update Rules for Development**
   - For now, you can use test mode rules:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if request.time < timestamp.date(2025, 12, 31);
       }
     }
   }
   ```
   - Click "Publish"

3. **⚠️ For Production**: You'll need to set up proper security rules based on authentication. Example:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```

---

## Step 10: Test Your Firebase Connection

Create a simple test to verify everything works:

1. **Create a test file** (optional): `mobile/src/utils/testFirebase.ts`

```typescript
import { FIREBASE_DB } from '../config/firebase';
import { collection, addDoc } from 'firebase/firestore';

export const testFirebase = async () => {
  try {
    // Try to add a test document
    const docRef = await addDoc(collection(FIREBASE_DB, 'test'), {
      message: 'Firebase is working!',
      timestamp: new Date()
    });
    console.log('✅ Firebase connected! Document ID:', docRef.id);
    return true;
  } catch (error) {
    console.error('❌ Firebase connection failed:', error);
    return false;
  }
};
```

2. **Call it from your app** (in `app/index.tsx` or similar):
```typescript
import { testFirebase } from '../src/utils/testFirebase';

// Call on component mount
useEffect(() => {
  testFirebase();
}, []);
```

---

## Step 11: Environment Variables (Recommended for Production)

For better security, use environment variables:

1. **Install expo-constants** (if not already installed):
```bash
npm install expo-constants
```

2. **Create `.env` file** in `mobile/` directory:
```
FIREBASE_API_KEY=your_api_key_here
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:web:abcdef
```

3. **Install dotenv**:
```bash
npm install dotenv
```

4. **Update `firebase.ts`**:
```typescript
import Constants from 'expo-constants';

const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.firebaseApiKey,
  authDomain: Constants.expoConfig?.extra?.firebaseAuthDomain,
  // ... etc
};
```

5. **Update `app.json`**:
```json
{
  "expo": {
    "extra": {
      "firebaseApiKey": process.env.FIREBASE_API_KEY,
      "firebaseAuthDomain": process.env.FIREBASE_AUTH_DOMAIN,
      // ... etc
    }
  }
}
```

---

## Common Issues & Solutions

### Issue: "Firebase: Error (auth/network-request-failed)"
- **Solution**: Check your internet connection and Firebase project settings

### Issue: "Firebase: Error (auth/api-key-not-valid)"
- **Solution**: Double-check your API key in `firebase.ts` matches Firebase Console

### Issue: "Firestore permission denied"
- **Solution**: Check your Firestore security rules in Firebase Console

### Issue: App crashes on startup
- **Solution**: Make sure all Firebase packages are installed: `npm install firebase`

---

## Next Steps

Now that Firebase is set up, you can:

1. **Set up Authentication** - Use `FIREBASE_AUTH` for user login/signup
2. **Use Firestore** - Use `FIREBASE_DB` to store and retrieve data
3. **Add Storage** - Set up Firebase Storage for file uploads
4. **Set up Cloud Functions** - For server-side logic (optional)

---

## Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Auth for Web](https://firebase.google.com/docs/auth/web/start)
- [Cloud Firestore for Web](https://firebase.google.com/docs/firestore/quickstart)
- [Expo + Firebase Guide](https://docs.expo.dev/guides/using-firebase/)

---

## Quick Checklist

- [ ] Created Firebase project
- [ ] Added Android app to Firebase
- [ ] Added iOS app to Firebase
- [ ] Added Web app to Firebase
- [ ] Copied Firebase config values
- [ ] Installed `firebase` package
- [ ] Updated `firebase.ts` with real config
- [ ] **Enabled billing** (required for Firestore)
- [ ] Enabled Authentication methods
- [ ] Created Firestore database
- [ ] Set up basic security rules
- [ ] Tested Firebase connection

---

**Need Help?** Check the Firebase Console for error messages and the Firebase documentation for detailed guides.

