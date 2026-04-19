# Environment Variables Setup

## Important: Create Your .env File

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` and add your actual Firebase config values:**
   ```
   FIREBASE_API_KEY=AIzaSyAkbHSW9Oqa35hMIjuOHOpOjgQilusBC1g
   FIREBASE_AUTH_DOMAIN=educational-app-52979.firebaseapp.com
   FIREBASE_PROJECT_ID=educational-app-52979
   FIREBASE_STORAGE_BUCKET=educational-app-52979.firebasestorage.app
   FIREBASE_MESSAGING_SENDER_ID=735775915622
   FIREBASE_APP_ID=1:735775915622:web:ef370c4d871ca0ed2037a7
   FIREBASE_MEASUREMENT_ID=G-ETYL2W9P6J
   ```

3. **The `.env` file is already in `.gitignore`** - it won't be committed to git!

## How It Works

- `app.config.js` reads from `.env` file using `dotenv`
- Values are passed to `expo.extra` 
- `firebase.ts` reads from `Constants.expoConfig?.extra`
- Your sensitive keys stay out of version control

## Security Notes

- ✅ `.env` is in `.gitignore` - safe from commits
- ✅ `.env.example` shows the structure without real values
- ✅ Never commit your actual `.env` file
- ✅ Each developer creates their own `.env` from `.env.example`

