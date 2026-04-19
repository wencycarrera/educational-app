// app.config.js runs in Node.js context (build time), so dotenv works here
// This file is NOT bundled into your React Native app
require('dotenv').config();

module.exports = {
  expo: {
    name: "KidVenture",
    slug: "educational-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/kidventure-logo.png",
    scheme: "educationalapp",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundler: "metro",
      bundleIdentifier: "com.educationalapp.mobile"
    },
    android: {
      package: "com.educationalapp.mobile",
      adaptiveIcon: {
        backgroundColor: "#FFA500",
        foregroundImage: "./assets/images/kidventure-logo.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/kidventure-logo.png"
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false
    },
    web: {
      output: "static",
      favicon: "./assets/images/kidventure-logo.png",
      bundler: "metro"
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/kidventure-logo.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#FFA500",
          dark: {
            backgroundColor: "#FFA500"
          }
        }
      ]
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true
    },
    extra: {
      // These values are loaded from .env at BUILD TIME (Node.js context)
      // They're then available in your app via Constants.expoConfig?.extra
      firebaseApiKey: process.env.FIREBASE_API_KEY,
      firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN,
      firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
      firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId: process.env.FIREBASE_APP_ID,
      firebaseMeasurementId: process.env.FIREBASE_MEASUREMENT_ID,
      eas: {
        projectId: "2102430a-3f4a-44e4-8d13-7e8e60ad00da"
      }
    }
  }
};

