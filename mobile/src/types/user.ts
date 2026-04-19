import { Timestamp } from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';

/**
 * User Role Types
 */
export type UserRole = 'teacher' | 'student' | 'admin';

/**
 * Teacher Profile Interface
 * Matches Firestore schema for teacher-specific data
 */
export interface TeacherProfile {
  name: string;
  birthday: Timestamp;
}

/**
 * Parent Info Interface
 * Nested within StudentProfile for parent gate and account management
 */
export interface ParentInfo {
  parentName: string;
  parentBirthday: Timestamp; // For Parent Gate validation
  parentEmail: string; // Same as account email
}

/**
 * Student Profile Interface
 * Matches Firestore schema for student-specific data
 * Parent information is nested within student profile
 */
export interface StudentProfile {
  name: string;
  birthday: Timestamp; // App calculates Age from this
  gender: 'male' | 'female' | 'other';
  points: number; // Total accumulated points (earned from star ratings)
  level: number; // Current level (calculated from points, stored for performance)
  parentInfo: ParentInfo; // Nested parent information
  joinedClassID?: string; // Links to the teacher's class
}

/**
 * Base User Interface
 * Common fields for all user types
 */
export interface User {
  role: UserRole;
  email: string;
  createdAt: Timestamp;
}

/**
 * User with Teacher Profile
 */
export interface UserWithTeacherProfile extends User {
  role: 'teacher';
  isApproved: boolean; // Default false, Admin flips to true
  teacherProfile: TeacherProfile;
}

/**
 * User with Student Profile
 */
export interface UserWithStudentProfile extends User {
  role: 'student';
  studentProfile: StudentProfile;
}

/**
 * User with Admin Profile
 */
export interface UserWithAdminProfile extends User {
  role: 'admin';
}

/**
 * Union type for all user profiles
 */
export type UserWithProfile = 
  | UserWithTeacherProfile 
  | UserWithStudentProfile 
  | UserWithAdminProfile;

/**
 * Firebase Auth User type alias
 */
export type AuthUser = FirebaseUser;

