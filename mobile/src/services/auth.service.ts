import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  User as FirebaseUser,
  AuthError,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { FIREBASE_AUTH, FIREBASE_DB } from '../config/firebase';
import {
  UserWithProfile,
  UserWithTeacherProfile,
  UserWithStudentProfile,
  UserRole,
} from '../types/user';

/**
 * Custom error class for authentication errors
 */
export class AuthServiceError extends Error {
  constructor(
    message: string,
    public code?: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'AuthServiceError';
  }
}

/**
 * Helper function to convert Firebase Auth errors to user-friendly messages
 */
function getAuthErrorMessage(error: AuthError): string {
  switch (error.code) {
    case 'auth/email-already-in-use':
    case 'auth/email-already-exists':
      return 'This email is already registered. Please try logging in.';
    case 'auth/invalid-email':
      return 'Invalid email address. Please check and try again.';
    case 'auth/weak-password':
      return 'Password is too weak. Please use at least 6 characters.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/user-not-found':
      return 'No account found with this email. Please check and try again.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect password. Please try again.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection and try again.';
    default:
      return error.message || 'An authentication error occurred. Please try again.';
  }
}

/**
 * Register a new student user
 * Creates Firebase Auth user, sends verification email, and creates Firestore document
 * Parent information is nested within the student profile
 */
export async function registerParent(data: {
  email: string;
  password: string;
  parentName: string;
  parentBirthday: Date;
  childName: string;
  childBirthday: Date;
  childGender: 'male' | 'female' | 'other';
}): Promise<FirebaseUser> {
  try {
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(
      FIREBASE_AUTH,
      data.email,
      data.password
    );

    const user = userCredential.user;

    // Send verification email
    await sendEmailVerification(user);

    // Create Firestore user document with student role
    const userDoc: Omit<UserWithStudentProfile, 'createdAt'> & {
      createdAt: ReturnType<typeof serverTimestamp>;
    } = {
      role: 'student',
      email: data.email,
      createdAt: serverTimestamp(),
      studentProfile: {
        name: data.childName,
        birthday: Timestamp.fromDate(data.childBirthday),
        gender: data.childGender,
        points: 0, // Initial points
        level: 1, // Initial level (Level 1: Math Explorer)
        parentInfo: {
          parentName: data.parentName,
          parentBirthday: Timestamp.fromDate(data.parentBirthday),
          parentEmail: data.email,
        },
        // joinedClassID is omitted - will be set when student joins a class
      },
    };

    await setDoc(doc(FIREBASE_DB, 'users', user.uid), userDoc);

    return user;
  } catch (error) {
    if (error instanceof Error && 'code' in error) {
      throw new AuthServiceError(
        getAuthErrorMessage(error as AuthError),
        (error as AuthError).code,
        error
      );
    }
    throw new AuthServiceError(
      'Failed to register student account. Please try again.',
      undefined,
      error
    );
  }
}

/**
 * Register a new teacher user
 * Creates Firebase Auth user and creates Firestore document with isApproved: false
 * Note: Teachers don't need email verification - they go directly to waiting-approval screen
 */
export async function registerTeacher(data: {
  email: string;
  password: string;
  name: string;
  birthday: Date;
}): Promise<FirebaseUser> {
  try {
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(
      FIREBASE_AUTH,
      data.email,
      data.password
    );

    const user = userCredential.user;

    // Note: Teachers don't need email verification - they go directly to waiting-approval
    // Email will be sent when admin approves their account

    // Create Firestore user document with isApproved: false
    const userDoc: Omit<UserWithTeacherProfile, 'createdAt'> & {
      createdAt: ReturnType<typeof serverTimestamp>;
    } = {
      role: 'teacher',
      email: data.email,
      createdAt: serverTimestamp(),
      isApproved: false, // Default false, Admin must approve
      teacherProfile: {
        name: data.name,
        birthday: Timestamp.fromDate(data.birthday),
      },
    };

    await setDoc(doc(FIREBASE_DB, 'users', user.uid), userDoc);

    return user;
  } catch (error) {
    if (error instanceof Error && 'code' in error) {
      throw new AuthServiceError(
        getAuthErrorMessage(error as AuthError),
        (error as AuthError).code,
        error
      );
    }
    throw new AuthServiceError(
      'Failed to register teacher account. Please try again.',
      undefined,
      error
    );
  }
}

/**
 * Login with email and password
 */
export async function login(
  email: string,
  password: string
): Promise<FirebaseUser> {
  try {
    const userCredential = await signInWithEmailAndPassword(
      FIREBASE_AUTH,
      email,
      password
    );
    return userCredential.user;
  } catch (error) {
    if (error instanceof Error && 'code' in error) {
      throw new AuthServiceError(
        getAuthErrorMessage(error as AuthError),
        (error as AuthError).code,
        error
      );
    }
    throw new AuthServiceError(
      'Failed to login. Please check your credentials and try again.',
      undefined,
      error
    );
  }
}

/**
 * Logout current user
 */
export async function logout(): Promise<void> {
  try {
    await signOut(FIREBASE_AUTH);
  } catch (error) {
    throw new AuthServiceError(
      'Failed to logout. Please try again.',
      undefined,
      error
    );
  }
}

/**
 * Send email verification
 */
export async function sendEmailVerificationEmail(
  user: FirebaseUser
): Promise<void> {
  try {
    await sendEmailVerification(user);
  } catch (error) {
    if (error instanceof Error && 'code' in error) {
      throw new AuthServiceError(
        getAuthErrorMessage(error as AuthError),
        (error as AuthError).code,
        error
      );
    }
    throw new AuthServiceError(
      'Failed to send verification email. Please try again.',
      undefined,
      error
    );
  }
}

/**
 * Check if email is verified
 */
export function checkEmailVerified(user: FirebaseUser): boolean {
  return user.emailVerified;
}

/**
 * Get user data from Firestore
 */
export async function getUserData(
  userId: string
): Promise<UserWithProfile | null> {
  try {
    const userDocRef = doc(FIREBASE_DB, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      return null;
    }

    return userDocSnap.data() as UserWithProfile;
  } catch (error) {
    throw new AuthServiceError(
      'Failed to fetch user data. Please try again.',
      undefined,
      error
    );
  }
}

/**
 * Update user data in Firestore
 */
export async function updateUserData(
  userId: string,
  data: Partial<UserWithProfile>
): Promise<void> {
  try {
    const userDocRef = doc(FIREBASE_DB, 'users', userId);
    await updateDoc(userDocRef, data);
  } catch (error) {
    throw new AuthServiceError(
      'Failed to update user data. Please try again.',
      undefined,
      error
    );
  }
}

/**
 * Update teacher profile
 */
export async function updateTeacherProfile(
  userId: string,
  profileData: {
    name?: string;
    birthday?: Date;
  }
): Promise<void> {
  try {
    const userDocRef = doc(FIREBASE_DB, 'users', userId);
    const updateData: any = {};
    
    if (profileData.name !== undefined || profileData.birthday !== undefined) {
      // Get current user data to preserve existing profile fields
      const userDocSnap = await getDoc(userDocRef);
      if (!userDocSnap.exists()) {
        throw new AuthServiceError('User not found');
      }
      
      const currentData = userDocSnap.data() as UserWithTeacherProfile;
      const currentProfile = currentData.teacherProfile || {};
      
      updateData.teacherProfile = {
        name: profileData.name !== undefined ? profileData.name : currentProfile.name,
        birthday: profileData.birthday !== undefined 
          ? Timestamp.fromDate(profileData.birthday) 
          : currentProfile.birthday,
      };
    }
    
    await updateDoc(userDocRef, updateData);
  } catch (error) {
    if (error instanceof AuthServiceError) {
      throw error;
    }
    throw new AuthServiceError(
      'Failed to update teacher profile. Please try again.',
      undefined,
      error
    );
  }
}

/**
 * Reload user data from Firebase Auth
 * Useful for checking updated email verification status
 */
export async function reloadUser(user: FirebaseUser): Promise<void> {
  try {
    await user.reload();
  } catch (error) {
    throw new AuthServiceError(
      'Failed to reload user data. Please try again.',
      undefined,
      error
    );
  }
}

