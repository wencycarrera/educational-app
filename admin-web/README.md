KidVenture Admin Web

Admin Web Dashboard for the KidVenture Learning System.
Built using React, TypeScript, Vite, and Shadcn UI, with a focus on responsiveness, modular architecture, and accessibility.

📌 Overview

The KidVenture Admin Web is the central management system of the KidVenture platform. It is used by administrators to manage users, approve teachers, monitor student progress, manage learning content, and handle system-wide configurations.

This dashboard is designed as a feature-based modular system, making it scalable, maintainable, and easy to extend.

🖼️ Preview

⚙️ Features

The Admin Web includes the following core functionalities:

User management for students, teachers, and administrators
Teacher approval and verification system
Learning content management (sub-lessons and activities)
Task creation and assignment system
Student activity tracking and progress monitoring
Feedback collection and review system
System settings and configuration
Dashboard analytics and reporting overview
Responsive UI for desktop and tablet use
Light and dark mode support
Role-based access control system
🧠 System Structure

The project follows a modular architecture where each feature is separated into its own domain.

Main Feature Modules
User Management → src/features/users
Teacher Approvals → src/features/teacher-approvals
Sub-Lessons / Learning Content → src/features/sub-lessons
Tasks Management → src/features/tasks
Student Activity Tracking → src/features/student-activity
Feedback System → src/features/teacher-feedback
Settings & Profile → src/features/settings
Dashboard Analytics → src/features/dashboard
🔐 Authentication System

Authentication and user session management are handled through a centralized system.

Key Files
src/lib/auth-service.ts
src/stores/auth-store.ts
src/routes/(auth)/
Features
Secure login system
Role-based access (Admin, Teacher, Student)
Session persistence
Route protection
🧩 UI System

The Admin Web uses a reusable component-based UI system built with Shadcn UI.

UI Structure
src/components/ui → Reusable UI components
src/components/data-table → Table system for large datasets
src/components/layout → App layout components
src/routes → Application routing system
📊 Dashboard System

The dashboard provides a high-level overview of the entire system.

Includes:
Total number of users
Student performance summary
Recent system activity
Analytics charts
Quick access to key modules
🚀 How to Run Locally
1. Install dependencies
npm install
2. Start development server
npm run dev
3. Open in browser
http://localhost:5173
🏗️ Tech Stack

The Admin Web is built using modern web technologies:

React
TypeScript
Vite
Shadcn UI (Tailwind + Radix UI)
TanStack Router
Lucide Icons
ESLint & Prettier
📁 Project Highlights

This system is designed with:

Modular feature-based architecture
Reusable UI components
Scalable folder structure
Role-based system design
Clean separation of logic and UI
Responsive dashboard layout
📌 Important Notes
This system is part of the KidVenture Learning Ecosystem
It should always be used together with the Mobile Application and Backend Utilities
Admin access is required for full system control
Designed for scalability and future expansion
🧾 License

This project is for educational and capstone purposes.

👨‍💻 Developer

KidVenture Development Team