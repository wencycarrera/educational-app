# Testing Authentication - Quick Start Guide

## Prerequisites Checklist

Before testing, make sure you have:

- [ ] Firebase project created
- [ ] Firebase Authentication enabled (Email/Password method)
- [ ] Firestore Database created
- [ ] `.env` file with Firebase config values
- [ ] App dependencies installed

---

## Step 1: Set Up Firebase (If Not Done)

### 1.1 Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Follow the setup wizard

### 1.2 Enable Authentication
1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Click on **Email/Password**
3. Toggle **Enable** to ON
4. Click **Save**

### 1.3 Create Firestore Database
1. Go to **Firestore Database** in Firebase Console
2. Click **Create database**
3. Select **Start in test mode** (for development)
4. Choose a location and click **Enable**

**⚠️ Important**: Test mode allows read/write for 30 days. For production, you'll need proper security rules.

### 1.4 Enable Billing (Required for Firestore)
- Go to **Project Settings** → **Usage and billing**
- Enable billing (won't charge if you stay within free tier)

---

## Step 2: Create `.env` File

1. **Create `.env` file** in the `mobile/` directory:

```bash
cd mobile
touch .env
```

2. **Get your Firebase config values**:
   - Go to Firebase Console → Project Settings
   - Scroll to "Your apps" section
   - Click the web icon `</>` or "Add app" → Web
   - Register the web app (nickname: "Educational App Web")
   - Copy the config values

3. **Add to `.env` file**:
```env
FIREBASE_API_KEY=your_api_key_here
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:web:abcdef
FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

**Replace all values with your actual Firebase config!**

---

## Step 3: Install Dependencies

Make sure all packages are installed:

```bash
cd mobile
npm install
```

---

## Step 4: Start the App

```bash
npm start
```

Then:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Press `w` for web browser
- Scan QR code with Expo Go app on your phone

---

## Step 5: Test Authentication Flows

### Test 1: Register as Parent

1. **Open the app** - You should see the login screen
2. **Click "Register as Parent"**
3. **Fill in the form**:
   - Parent Name: `Test Parent`
   - Parent Birthday: `1990-01-15` (format: YYYY-MM-DD)
   - Email: `parent@test.com` (use a real email you can access)
   - Password: `test123` (at least 6 characters)
   - Confirm Password: `test123`
   - Child Name: `Test Child`
   - Child Birthday: `2018-05-20`
   - Child Gender: Select from picker
4. **Click "Create Account"**
5. **Expected**: 
   - Should redirect to verify-email screen
   - Check your email inbox for verification email

### Test 2: Verify Email

1. **On verify-email screen**:
   - Check your email inbox
   - Click the verification link in the email
2. **In the app**:
   - Click "Check Verification Status" button
   - Or wait for auto-check (checks every 5 seconds)
3. **Expected**:
   - Should show "Email verified! Redirecting..."
   - Should redirect to join class screen (since parent hasn't joined a class yet)

### Test 3: Register as Teacher

1. **Go back to login** (or start fresh)
2. **Click "Register as Teacher"**
3. **Fill in the form**:
   - Full Name: `Test Teacher`
   - Birthday: `1985-03-15`
   - School ID: `DWAD-T001`
   - Email: `teacher@test.com`
   - Password: `test123`
   - Confirm Password: `test123`
4. **Click "Create Account"**
5. **Expected**:
   - Should redirect to verify-email screen
   - After verification, should show teacher dashboard (but may show "waiting for approval" - to be implemented)

### Test 4: Login

1. **From login screen**, enter:
   - Email: `parent@test.com` (or `teacher@test.com`)
   - Password: `test123`
2. **Click "Sign In"**
3. **Expected**:
   - Should successfully log in
   - Should redirect to appropriate dashboard based on role

### Test 5: Logout (When Implemented)

- Should be available in dashboard/settings
- Should redirect back to login screen

---

## Step 6: Verify Data in Firestore

1. **Go to Firebase Console** → **Firestore Database**
2. **Check `users` collection**:
   - You should see documents with user IDs
   - Each document should have:
     - `role`: "parent" or "teacher"
     - `email`: user's email
     - `createdAt`: timestamp
     - For parents: `parentProfile` and `childProfile`
     - For teachers: `teacherProfile` and `isApproved: false`

---

## Common Issues & Solutions

### Issue: "Missing Firebase configuration"
**Solution**: 
- Make sure `.env` file exists in `mobile/` directory
- Check that all `FIREBASE_*` variables are set
- Restart the Expo dev server after creating `.env`

### Issue: "Firebase: Error (auth/email-already-in-use)"
**Solution**: 
- The email is already registered
- Try a different email or use login instead

### Issue: "Network error" or "Firebase connection failed"
**Solution**:
- Check your internet connection
- Verify Firebase config values in `.env` are correct
- Check Firebase Console to ensure project is active

### Issue: "Permission denied" when creating user document
**Solution**:
- Check Firestore security rules
- Make sure database is in "test mode" for development
- Rules should allow writes for testing

### Issue: Email verification not working
**Solution**:
- Check spam folder
- Make sure you're using a real email address
- In Firebase Console → Authentication → Templates, check email templates are enabled

### Issue: App crashes on startup
**Solution**:
- Check console for error messages
- Make sure all dependencies are installed: `npm install`
- Clear cache: `npm start --clear`

---

## Testing Checklist

- [ ] Can register as parent
- [ ] Can register as teacher
- [ ] Verification email is received
- [ ] Can verify email
- [ ] Can login with registered account
- [ ] User data appears in Firestore
- [ ] Parent profile includes child profile
- [ ] Teacher profile has `isApproved: false`
- [ ] Routing works correctly after login
- [ ] Error messages display properly
- [ ] Form validation works

---

## Next Steps After Testing

Once authentication is working:

1. **Set up proper Firestore security rules** (replace test mode)
2. **Implement "Waiting for Approval" screen** for teachers
3. **Implement class joining flow** for parents
4. **Add logout functionality** to dashboards
5. **Test on physical devices** (iOS/Android)

---

## Quick Test Commands

```bash
# Start the app
cd mobile
npm start

# Clear cache and start
npm start --clear

# Check for linting errors
npm run lint
```

---

**Need Help?** Check the Firebase Console for error messages and logs!

