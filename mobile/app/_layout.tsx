import { Stack, useRouter, useSegments, usePathname } from 'expo-router';
import { useEffect, useState, useRef } from 'react';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import { TTSProvider } from '../src/contexts/TTSContext';
import { View, ActivityIndicator } from 'react-native';
import { useFonts } from 'expo-font';
import { migrateStarsToPoints, migrateParentToStudent, migrateCalculateLevel } from '../src/utils/migration';
import {
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from '@expo-google-fonts/nunito';
import {
  Fredoka_400Regular,
  Fredoka_500Medium,
  Fredoka_600SemiBold,
  Fredoka_700Bold,
} from '@expo-google-fonts/fredoka';
import * as SplashScreen from 'expo-splash-screen';
import '../global.css';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

/**
 * Protected Routes Component
 * Handles routing based on authentication state
 */
function ProtectedRoutes({ splashReady }: { splashReady: boolean }) {
  const { user, userData, loading, emailVerified } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const pathname = usePathname();
  const navigationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Clear any pending navigation timer
    if (navigationTimerRef.current) {
      clearTimeout(navigationTimerRef.current);
      navigationTimerRef.current = null;
    }
    
    // Don't navigate until splash screen is ready
    if (!splashReady) {
      return;
    }

    if (loading) {
      // Still loading auth state, don't navigate yet
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';
    const inStudentGroup = segments[0] === '(student)';
    const inTeacherGroup = segments[0] === '(teacher)';

    // Debug logging
    console.log('ProtectedRoutes - user:', !!user, 'emailVerified:', emailVerified, 'userData:', !!userData, 'loading:', loading, 'pathname:', pathname);

    if (!user) {
      // User is not authenticated, redirect to auth
      // Allow index route (splash screen) and onboarding to show
      const isIndexRoute = pathname === '/' || pathname === '';
      const isOnboardingRoute = pathname === '/(auth)/onboarding' || segments[1] === 'onboarding';
      
      if (!inAuthGroup && !isIndexRoute && !isOnboardingRoute) {
        router.replace('/(auth)/login');
      } else if (isIndexRoute && splashReady) {
        // Navigate from splash screen to onboarding after it's ready
        router.replace('/(auth)/onboarding');
      }
    } else if (user) {
      // User is authenticated - wait for userData to load before making routing decisions
      if (!userData) {
        // User data is still loading, wait for it
        // This ensures emailVerified status is accurate
        console.log('Waiting for userData to load...');
        return;
      }
      
      // Check teacher approval status first (teachers don't need email verification)
      if (userData.role === 'teacher' && 'isApproved' in userData) {
        if (!userData.isApproved) {
          // Teacher not approved yet
          if (!inAuthGroup || segments[1] !== 'waiting-approval') {
            console.log('Teacher not approved, redirecting to waiting-approval');
            router.replace('/(auth)/waiting-approval');
          }
          return; // Don't proceed with other routing logic
        }
      }
      
      // For non-teachers, check email verification status
      if (userData.role !== 'teacher' && !emailVerified) {
        // User is authenticated but email not verified (parents/students only)
        if (!inAuthGroup || segments[1] !== 'verify-email') {
          console.log('Redirecting to verify-email');
          router.replace('/(auth)/verify-email');
        }
      } else {
        // User is authenticated and verified (or teacher is approved)
        
        // Route based on role
        const isIndexRoute = pathname === '/' || pathname === '';
        
        if (inAuthGroup || isIndexRoute) {
          // User is authenticated, redirect from auth screens or index route
          console.log('User verified, routing based on role:', userData.role);
          
          let targetRoute: string | null = null;
          
          if (userData.role === 'student') {
            // Check if student has joined a class
            if (!userData.studentProfile?.joinedClassID) {
              console.log('Student has no class, redirecting to join');
              targetRoute = '/(student)/classroom/join';
            } else {
              console.log('Student has class, redirecting to dashboard');
              targetRoute = '/(student)/dashboard';
            }
          } else if (userData.role === 'teacher') {
            // Only allow access if approved (already checked above)
            console.log('Teacher approved, redirecting to dashboard');
            targetRoute = '/(teacher)/dashboard';
          } else if (userData.role === 'admin') {
            console.log('Admin, redirecting to dashboard');
            targetRoute = '/(student)/dashboard';
          }
          
          // Only navigate if we have a target route and we're not already there
          if (targetRoute && pathname !== targetRoute) {
            console.log('Navigating to:', targetRoute, 'from:', pathname);
            // Use a small delay to ensure router is ready
            navigationTimerRef.current = setTimeout(() => {
              console.log('Executing navigation to:', targetRoute);
              router.replace(targetRoute as any);
              navigationTimerRef.current = null;
            }, 50);
          }
        } else {
          // User is in a protected route, check role-based access
          if (userData.role === 'student' && inTeacherGroup) {
            // Student trying to access teacher routes
            router.replace('/(student)/dashboard');
          } else if (userData.role === 'teacher') {
            // Check if teacher is approved before allowing access to teacher routes
            if ('isApproved' in userData && !userData.isApproved) {
              // Teacher not approved, redirect to waiting screen
              router.replace('/(auth)/waiting-approval');
            } else if (inStudentGroup) {
              // Teacher trying to access student routes
              router.replace('/(teacher)/dashboard');
            }
          }
        }
      }
    }
    
    // Cleanup function
    return () => {
      if (navigationTimerRef.current) {
        clearTimeout(navigationTimerRef.current);
        navigationTimerRef.current = null;
      }
    };
  }, [user, userData, loading, emailVerified, segments, splashReady, pathname, router]);

  // Show loading screen while checking auth state
  if (loading) {
    return (
      <View className="items-center justify-center flex-1 bg-white">
        <ActivityIndicator size="large" color="#faa123" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}

/**
 * Root Layout Component
 * Wraps app with AuthProvider and loads fonts
 */
export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    // Nunito - Body text (instructions, story)
    'Nunito-Regular': Nunito_400Regular,
    'Nunito-Medium': Nunito_500Medium,
    'Nunito-SemiBold': Nunito_600SemiBold,
    'Nunito-Bold': Nunito_700Bold,
    // Fredoka - Headings (titles, rewards)
    'Fredoka-Regular': Fredoka_400Regular,
    'Fredoka-Medium': Fredoka_500Medium,
    'Fredoka-SemiBold': Fredoka_600SemiBold,
    'Fredoka-Bold': Fredoka_700Bold,
  });
  const [splashReady, setSplashReady] = useState(false);

  // Run migrations once on app start
  useEffect(() => {
    // Run migrations in order: parent to student, stars to points, then calculate level
    migrateParentToStudent()
      .then(() => migrateStarsToPoints())
      .then(() => migrateCalculateLevel())
      .catch((error) => {
        console.error('Migration error (non-fatal):', error);
        // Migration errors are non-fatal - app continues to work
      });
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      // Keep splash screen visible for at least 3.5 seconds
      const minSplashDuration = 3500;
      const startTime = Date.now();
      
      const hideSplash = async () => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, minSplashDuration - elapsed);
        
        setTimeout(async () => {
          try {
            await SplashScreen.hideAsync();
          } catch (error) {
            // Silently handle splash screen errors (may occur on web or if already hidden)
            console.debug('Splash screen hide error:', error);
          }
          setSplashReady(true);
        }, remaining);
      };
      
      hideSplash();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <AuthProvider>
      <TTSProvider>
        <ProtectedRoutes splashReady={splashReady} />
      </TTSProvider>
    </AuthProvider>
  );
}
