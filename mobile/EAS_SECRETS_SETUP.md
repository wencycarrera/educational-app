# EAS Secrets Setup Guide

## Problem
When building with EAS, your `.env` file is **NOT** automatically included. Environment variables need to be set as **EAS Secrets** so they're available during the build process.

## Solution: Set EAS Secrets

You need to set your Firebase environment variables as EAS secrets. Here's how:

### Step 1: Make sure you're logged in

```bash
cd mobile
npx eas login
```

### Step 2: Set each Firebase environment variable as a secret

Run these commands (replace the values with your actual Firebase config):

```bash
# Set Firebase API Key
npx eas secret:create --scope project --name FIREBASE_API_KEY --value "your-api-key-here"

# Set Firebase Auth Domain
npx eas secret:create --scope project --name FIREBASE_AUTH_DOMAIN --value "your-project.firebaseapp.com"

# Set Firebase Project ID
npx eas secret:create --scope project --name FIREBASE_PROJECT_ID --value "your-project-id"

# Set Firebase Storage Bucket
npx eas secret:create --scope project --name FIREBASE_STORAGE_BUCKET --value "your-project.appspot.com"

# Set Firebase Messaging Sender ID
npx eas secret:create --scope project --name FIREBASE_MESSAGING_SENDER_ID --value "123456789"

# Set Firebase App ID
npx eas secret:create --scope project --name FIREBASE_APP_ID --value "1:123456789:web:abcdef"

# Set Firebase Measurement ID (optional, but recommended)
npx eas secret:create --scope project --name FIREBASE_MEASUREMENT_ID --value "G-XXXXXXXXXX"
```

### Step 3: Update app.config.js to use EAS secrets

Your `app.config.js` already reads from `process.env`, but we need to make sure EAS secrets are available. Update it to check both:

```javascript
// In app.config.js, the extra section should use:
extra: {
  firebaseApiKey: process.env.FIREBASE_API_KEY,
  firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN,
  // ... etc
}
```

**Good news:** Your current `app.config.js` already does this! EAS automatically makes secrets available as `process.env` variables during builds.

### Step 4: Verify secrets are set

```bash
npx eas secret:list
```

You should see all your Firebase secrets listed.

### Step 5: Rebuild your app

After setting secrets, rebuild:

```bash
npm run build:android
```

## Quick Setup Script

If you have your Firebase config in a `.env` file, you can use this PowerShell script (Windows) to set all secrets at once:

```powershell
# Read .env file and set EAS secrets
$envFile = Get-Content "mobile\.env"
foreach ($line in $envFile) {
    if ($line -match "^([^=]+)=(.*)$") {
        $name = $matches[1]
        $value = $matches[2]
        Write-Host "Setting secret: $name"
        npx eas secret:create --scope project --name $name --value $value
    }
}
```

Or manually copy each value from your `.env` file and run the `npx eas secret:create` commands.

## Troubleshooting

### "Secret already exists"
If a secret already exists and you want to update it:
```bash
npx eas secret:delete --name FIREBASE_API_KEY
npx eas secret:create --scope project --name FIREBASE_API_KEY --value "new-value"
```

### "Cannot find secret"
Make sure you're in the `mobile/` directory and logged in:
```bash
cd mobile
npx eas login
npx eas secret:list
```

### Still crashing after setting secrets?
1. Verify secrets are set: `npx eas secret:list`
2. Check the build logs for any errors
3. Make sure all 7 Firebase config values are set (including optional ones)

## Where to get Firebase config values

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click the gear icon ⚙️ → Project Settings
4. Scroll to "Your apps" section
5. Click on your web app (or create one if you don't have it)
6. Copy the config values

