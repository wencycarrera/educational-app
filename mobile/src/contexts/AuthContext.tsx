import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { FIREBASE_AUTH } from '../config/firebase';
import {
  registerParent,
  registerTeacher,
  login,
  logout,
  sendEmailVerificationEmail,
  checkEmailVerified,
  getUserData,
  reloadUser,
  AuthServiceError,
} from '../services/auth.service';
import { UserWithProfile } from '../types/user';

/**
 * Auth Context State Interface
 */
interface AuthContextType {
  // State
  user: FirebaseUser | null;
  userData: UserWithProfile | null;
  loading: boolean;
  error: string | null;
  emailVerified: boolean;

  // Actions
  registerParent: typeof registerParent;
  registerTeacher: typeof registerTeacher;
  login: typeof login;
  logout: () => Promise<void>;
  sendEmailVerification: () => Promise<void>;
  checkVerification: () => Promise<boolean>;
  clearError: () => void;
  reloadUserData: () => Promise<void>;
}

/**
 * Create Auth Context
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Auth Provider Props
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Auth Provider Component
 * Manages global authentication state and provides auth methods
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<UserWithProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [emailVerified, setEmailVerified] = useState<boolean>(false);

  /**
   * Load user data from Firestore when user is authenticated
   */
  const loadUserData = async (firebaseUser: FirebaseUser, reloadVerification = false) => {
    try {
      // Reload user to get latest email verification status if requested
      if (reloadVerification) {
        await reloadUser(firebaseUser);
        // After reload, the user object is updated in place
        // Get the current user to ensure we have the latest reference
        const currentUser = FIREBASE_AUTH.currentUser;
        if (currentUser) {
          firebaseUser = currentUser;
          setUser(currentUser);
        }
      }
      
      const data = await getUserData(firebaseUser.uid);
      const isVerified = checkEmailVerified(firebaseUser);
      
      setUserData(data);
      setEmailVerified(isVerified);
      
      // Debug logging
      console.log('loadUserData - emailVerified:', isVerified, 'user.emailVerified:', firebaseUser.emailVerified);
    } catch (err) {
      console.error('Error loading user data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load user data');
    }
  };

  /**
   * Initialize auth state listener
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      FIREBASE_AUTH,
      async (firebaseUser) => {
        setUser(firebaseUser);
        setLoading(true);

        if (firebaseUser) {
          // User is signed in
          // Reload user to get latest email verification status
          await loadUserData(firebaseUser, true);
        } else {
          // User is signed out
          setUserData(null);
          setEmailVerified(false);
        }

        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  /**
   * Wrapper for registerParent with error handling
   */
  const handleRegisterParent = async (data: Parameters<typeof registerParent>[0]) => {
    try {
      setError(null);
      setLoading(true);
      const newUser = await registerParent(data);
      // Auth state listener will handle updating user state
      return newUser;
    } catch (err) {
      const errorMessage =
        err instanceof AuthServiceError
          ? err.message
          : 'Failed to register. Please try again.';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Wrapper for registerTeacher with error handling
   */
  const handleRegisterTeacher = async (data: Parameters<typeof registerTeacher>[0]) => {
    try {
      setError(null);
      setLoading(true);
      const newUser = await registerTeacher(data);
      // Auth state listener will handle updating user state
      return newUser;
    } catch (err) {
      const errorMessage =
        err instanceof AuthServiceError
          ? err.message
          : 'Failed to register. Please try again.';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Wrapper for login with error handling
   */
  const handleLogin = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      const loggedInUser = await login(email, password);
      // Auth state listener will handle updating user state
      return loggedInUser;
    } catch (err) {
      const errorMessage =
        err instanceof AuthServiceError
          ? err.message
          : 'Failed to login. Please try again.';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Wrapper for logout with error handling
   */
  const handleLogout = async () => {
    try {
      setError(null);
      setLoading(true);
      await logout();
      // Auth state listener will handle clearing user state
    } catch (err) {
      const errorMessage =
        err instanceof AuthServiceError
          ? err.message
          : 'Failed to logout. Please try again.';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Send email verification
   */
  const handleSendEmailVerification = async () => {
    if (!user) {
      throw new Error('No user is currently signed in');
    }

    try {
      setError(null);
      await sendEmailVerificationEmail(user);
    } catch (err) {
      const errorMessage =
        err instanceof AuthServiceError
          ? err.message
          : 'Failed to send verification email. Please try again.';
      setError(errorMessage);
      throw err;
    }
  };

  /**
   * Check email verification status
   */
  const handleCheckVerification = async (): Promise<boolean> => {
    if (!user) {
      return false;
    }

    try {
      // Reload user to get latest verification status
      await reloadUser(user);
      // After reload, get the current user to ensure we have the latest reference
      const currentUser = FIREBASE_AUTH.currentUser;
      if (currentUser) {
        setUser(currentUser);
        const verified = checkEmailVerified(currentUser);
        setEmailVerified(verified);
        
        // Debug logging
        console.log('checkVerification - verified:', verified, 'user.emailVerified:', currentUser.emailVerified);
        
        // Reload user data to ensure everything is in sync
        if (verified) {
          await loadUserData(currentUser, false);
        }
        return verified;
      }
      return false;
    } catch (err) {
      console.error('Error checking verification:', err);
      return false;
    }
  };

  /**
   * Reload user data from Firestore
   */
  const handleReloadUserData = async () => {
    if (!user) {
      return;
    }

    try {
      setError(null);
      await loadUserData(user);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to reload user data. Please try again.';
      setError(errorMessage);
    }
  };

  /**
   * Clear error state
   */
  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    // State
    user,
    userData,
    loading,
    error,
    emailVerified,

    // Actions
    registerParent: handleRegisterParent,
    registerTeacher: handleRegisterTeacher,
    login: handleLogin,
    logout: handleLogout,
    sendEmailVerification: handleSendEmailVerification,
    checkVerification: handleCheckVerification,
    clearError,
    reloadUserData: handleReloadUserData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * useAuth Hook
 * Provides access to auth context
 * @throws Error if used outside AuthProvider
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

