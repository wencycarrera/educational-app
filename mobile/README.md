KidVenture Mobile Application
📌 Overview

The KidVenture Mobile Application is a React Native (Expo) based learning platform designed for Grade 1 students. It provides a gamified and interactive learning experience supported by teachers and parents.

The application follows a file-based routing structure using Expo Router and is organized into role-based modules: Student, Teacher, Parent, and Authentication.

⚙️ Purpose

This mobile application is responsible for:

Delivering interactive math learning experiences
Providing gamified educational activities for students
Allowing teachers to create and manage learning content
Enabling parents to monitor student progress
Supporting authentication and role-based access
Integrating with backend services and Firebase
🚀 Getting Started
1. Install dependencies
npm install
2. Start the application
npx expo start
📱 Running the App

After starting the development server, you can run the app using:

Expo Go (mobile testing environment)
Android Emulator
iOS Simulator
Development Build

More details: https://docs.expo.dev

🧭 Project Structure

The app uses file-based routing (Expo Router). All screens are located inside the app directory.

Main Modules
Authentication Module
Student Module
Teacher Module
Parent Zone
🔐 Authentication Module

Handles login, registration, onboarding, and account verification.

Features:
Login system
Parent registration
Teacher registration
Email verification
Onboarding flow
Teacher approval waiting screen
🎓 Student Module (Core Learning System)

This is the main learning experience for students.

Features:
Student dashboard with progress tracking
Interactive lessons and sub-lessons
Gamified learning activities
Classroom joining system
Notifications system
Learning materials access
Parent monitoring support
👩‍🏫 Teacher Module

Used by teachers to manage classrooms and learning content.

Features:
Classroom creation and management
Student roster management
Activity and sub-lesson creation
Student progress tracking
Performance analytics
Feedback system
👨‍👩‍👧 Parent Zone

Allows parents to monitor their child’s learning progress.

Features:
Student progress tracking
Performance reports
Learning activity monitoring
Settings and notifications
🧠 Architecture Overview

The application is built using:

React Native (Expo)
TypeScript
Expo Router (file-based navigation)
Firebase (authentication and backend services)
Modular service-based architecture
📂 Key Folder Structure
app/(auth) → Authentication screens
app/(student) → Student learning system
app/(teacher) → Teacher tools and dashboard
app/(parent-zone) → Parent monitoring system
src/components → Reusable UI and game components
src/services → Business logic and API services
src/hooks → Custom React hooks
assets → Images, sounds, and game resources
🎮 Game System (Core Feature)

The app includes a gamified learning system designed for early learners.

Game Engines:
Quiz Engine
Matching Engine
Drag and Drop Engine
Number Line Engine
Visual Counting Engine
Word Problem Engine
Ordering Engine
Place Value Engine

These engines transform traditional lessons into interactive learning experiences.

🎨 Assets System

The application includes a structured asset system to support engagement.

Includes:
Images and icons
Background music
Sticker library:
Fruits
Numbers
Shapes
Money
Rewards
Tools
Patterns
🚀 Development Notes
Uses Expo Router for navigation
Fully modular architecture
Designed for scalability and future expansion
Integrated with Firebase backend services
Supports role-based access system
⚠️ Important Notes
Always install dependencies before running the app
Use Expo Go or emulator for testing
Ensure Firebase configuration is set properly
Do not modify core routing structure without understanding file-based routing
📚 Learn More
https://docs.expo.dev
https://reactnative.dev
https://firebase.google.com
👨‍💻 Developer
KidVenture Development Team