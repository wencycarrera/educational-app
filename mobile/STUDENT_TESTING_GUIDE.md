# Student Testing Guide

This guide explains how to distribute your educational app to students for testing **without** requiring them to:
- Run `npm start`
- Scan QR codes
- Install from App Store/Play Store

## Overview

We'll use **EAS Build** to create standalone installable files (APK for Android, IPA for iOS) that students can download and install directly on their devices.

---

## Prerequisites

1. **Expo Account** (free)
   - Sign up at: https://expo.dev/signup
   - Or login: `npx eas login`

2. **EAS CLI** (already configured in this project)
   - Install globally: `npm install -g eas-cli`
   - Or use: `npx eas-cli`

3. **Environment Variables**
   - Make sure your `.env` file in the `mobile/` directory has all Firebase config values

---

## Step 1: Install EAS CLI (if not already installed)

```bash
npm install -g eas-cli
```

---

## Step 2: Login to Expo

```bash
cd mobile
npx eas login
```

Enter your Expo account credentials.

---

## Step 3: Configure Your Project (First Time Only)

```bash
npx eas build:configure
```

This will create/update the `eas.json` file (already created for you).

---

## Step 3.5: Android Keystore (Automatic - Recommended)

**For student testing, you don't need to generate a keystore manually!**

When you run your first build, EAS will automatically:
- Generate a keystore for you
- Securely store it in EAS servers
- Use it for all future builds

**Just run the build command** - EAS handles everything:

```bash
npm run build:android
```

When prompted about credentials, choose:
- **"Generate a new Android Keystore"** (recommended)

### Manual Keystore (Optional - Only if you need full control)

If you want to generate and manage your own keystore:

1. **Generate keystore:**
   ```bash
   keytool -genkeypair -v -storetype PKCS12 -keystore my-keystore.jks -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **Upload to EAS:**
   ```bash
   npx eas credentials
   ```
   - Select "Android"
   - Choose "Set up keystore"
   - Upload your `.jks` file

**Note:** For capstone testing, automatic keystore is perfectly fine!

---

## Step 4: Build for Android (APK)

**For Android devices (most common for student testing):**

```bash
cd mobile
npm run build:android
```

Or directly:
```bash
npx eas build --platform android --profile preview
```

**What happens:**
- EAS will build your app in the cloud
- It will create an APK file (Android installable)
- Build takes ~10-20 minutes
- You'll get a download link when complete

**After build completes:**
- You'll receive a URL to download the APK
- Example: `https://expo.dev/artifacts/eas/xxxxx.apk`

---

## Step 5: Build for iOS (Optional)

**For iOS devices:**

```bash
cd mobile
npm run build:ios
```

### iOS Distribution Options:

**⚠️ Important:** iOS has stricter distribution rules than Android. Here are your options:

#### Option 1: TestFlight (Recommended for iOS)
- **Requires:** Apple Developer account ($99/year)
- **How it works:**
  1. Build your app with EAS
  2. Submit to TestFlight via App Store Connect
  3. Add students as testers (up to 10,000 internal testers)
  4. Students install TestFlight app (free from App Store)
  5. Students accept invitation and install your app
- **Pros:**
  - No App Store review needed for internal testing
  - Easy for students (just install TestFlight + accept invite)
  - Can test for up to 90 days per build
- **Cons:**
  - Requires $99/year Apple Developer account
  - Students need to install TestFlight first

#### Option 2: Ad Hoc Distribution (Limited)
- **Requires:** Apple Developer account ($99/year)
- **How it works:**
  1. Build IPA with EAS
  2. Register each student's device UDID in Apple Developer portal
  3. Build with those device IDs included
  4. Distribute IPA file (via email, download link, etc.)
  5. Students install via iTunes/Finder or third-party tools
- **Pros:**
  - Direct installation (no TestFlight needed)
- **Cons:**
  - Limited to 100 devices per year
  - Requires collecting UDIDs from all students
  - More complex setup
  - Students need to trust your developer certificate

#### Option 3: Enterprise Distribution (Not Available)
- Requires Apple Enterprise Developer Program ($299/year)
- Only for companies with 500+ employees
- Not suitable for student testing

### Summary: iOS vs Android

| Feature | Android (APK) | iOS (TestFlight) |
|---------|---------------|------------------|
| **Cost** | Free | $99/year (Apple Developer) |
| **Student Setup** | Download APK → Install | Install TestFlight → Accept invite |
| **Device Limit** | Unlimited | Up to 10,000 testers |
| **Distribution** | Direct download link | Via TestFlight |
| **Ease of Use** | ⭐⭐⭐⭐⭐ Very Easy | ⭐⭐⭐⭐ Easy (after setup) |

---

## Step 6: Distribute to Students

### Option A: Direct Download Link (Easiest)

1. **Share the APK download link** from EAS Build
   - Students click the link on their Android phone
   - Download the APK
   - Install it (may need to enable "Install from Unknown Sources")

2. **Instructions for students:**
   ```
   1. Open the link on your Android phone
   2. Download the APK file
   3. If prompted, allow "Install from Unknown Sources"
   4. Tap the downloaded file to install
   5. Open the app from your app drawer
   ```

### Option B: Google Drive / Dropbox

1. Download the APK from EAS
2. Upload to Google Drive or Dropbox
3. Share the link with students
4. They download and install

### Option C: Email Distribution

1. Download the APK
2. Email it to students (if file size allows)
3. They download from email and install

### Option D: QR Code to Download Link (Not Development)

1. Generate a QR code pointing to the APK download URL
2. Students scan QR code → opens download link
3. They download and install
4. **This is different from Expo Go** - they're downloading a real app, not running dev server

---

## Step 7: Update the App (If Needed)

If you need to make changes and rebuild:

1. Make your code changes
2. Update version in `app.config.js`:
   ```js
   version: "1.0.1",  // increment version
   ```
3. Run build again:
   ```bash
   npm run build:android
   ```
4. Share the new APK link with students

---

## Android Installation Troubleshooting

If students can't install the APK:

1. **"Install from Unknown Sources"**
   - Settings → Security → Enable "Unknown Sources" or "Install Unknown Apps"
   - Or when installing, tap "Settings" and enable it

2. **"App not installed" error**
   - Make sure they uninstall any previous version first
   - Check if device has enough storage space

3. **"Package appears to be corrupt"**
   - Re-download the APK
   - Make sure download completed fully

---

## iOS Distribution via TestFlight (Step-by-Step)

If you need iOS testing, here's the complete process:

### Prerequisites:
1. **Apple Developer Account** ($99/year)
   - Sign up at: https://developer.apple.com/programs/
   - Takes 24-48 hours for approval

2. **App Store Connect Setup:**
   - Go to: https://appstoreconnect.apple.com
   - Create a new app (don't worry, it won't go to App Store)
   - Fill in basic info (name, bundle ID, etc.)

### Build and Submit:

1. **Build your iOS app:**
   ```bash
   cd mobile
   npm run build:ios
   ```
   - Select "App Store" or "Ad Hoc" when prompted
   - Build takes ~15-25 minutes

2. **Submit to TestFlight:**
   ```bash
   npx eas submit --platform ios
   ```
   - This uploads your build to App Store Connect
   - Takes ~5-10 minutes

3. **Add Testers in App Store Connect:**
   - Go to TestFlight tab in App Store Connect
   - Click "Internal Testing" or "External Testing"
   - Add testers by email or create a public link
   - Send invitations

4. **Students Install:**
   - Students install **TestFlight** app (free from App Store)
   - Students accept email invitation or use public link
   - Your app appears in TestFlight
   - Students tap "Install" in TestFlight
   - Done! App works like normal

### TestFlight Benefits:
- ✅ No App Store review for internal testing
- ✅ Up to 10,000 testers
- ✅ Easy for students (just TestFlight app)
- ✅ Can update builds easily
- ✅ 90-day testing period per build

---

## Cost

- **EAS Build:** Free tier includes:
  - 30 builds per month
  - Unlimited build time
  - Perfect for student testing!

- **Paid plans:** Only needed if you exceed 30 builds/month

---

## Quick Reference Commands

```bash
# Build Android APK
cd mobile
npm run build:android

# Build iOS (requires Apple Developer account)
npm run build:ios

# Build both platforms
npm run build:all

# Check build status
npx eas build:list

# View build logs
npx eas build:view [build-id]
```

---

## Summary

✅ **What students need to do:**
1. Click download link (or scan QR code to download link)
2. Download APK file
3. Install APK (enable "Unknown Sources" if needed)
4. Open app and use it

❌ **What students DON'T need:**
- No `npm start`
- No QR code scanning for dev server
- No Expo Go app
- No App Store/Play Store
- No technical setup

The APK is a **standalone app** that works just like any app from the Play Store!

