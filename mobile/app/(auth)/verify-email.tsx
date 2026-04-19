import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  AppState,
  Linking,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/hooks/useAuth';
import { Button } from '../../src/components/common/Button';
import { Heading } from '../../src/components/ui/Heading';
import { Body } from '../../src/components/ui/Body';
import { theme } from '../../src/config/theme';

// Utility to open system mail app
const openMailApp = async () => {
  const url = Platform.select({
    ios: 'message://',
    android: 'mailto:',
    default: 'mailto:',
  });

  const canOpen = await Linking.canOpenURL(url);
  if (canOpen) {
    Linking.openURL(url);
  } else {
    // Fallback
    Linking.openURL('mailto:');
  }
};

export default function VerifyEmailScreen() {
  const router = useRouter();
  const appState = useRef(AppState.currentState);
  const {
    user,
    emailVerified,
    sendEmailVerification,
    checkVerification,
    loading,
    error,
    clearError,
  } = useAuth();

  const [isChecking, setIsChecking] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 1. Auto-check when App comes to foreground (UX BEST PRACTICE)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active' &&
        !emailVerified
      ) {
        handleCheckStatus(true); // Silent check on resume
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [emailVerified]);

  // 2. Countdown timer for Resend button
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (resendCountdown > 0) {
      interval = setInterval(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendCountdown]);

  // 3. Polling (keep existing logic but less aggressive)
  useEffect(() => {
    if (!user || emailVerified) return;
    const interval = setInterval(async () => {
      try {
        const verified = await checkVerification();
        if (verified) clearInterval(interval);
      } catch (err) { /* silent fail */ }
    }, 5000);
    return () => clearInterval(interval);
  }, [user, emailVerified, checkVerification]);

  const handleResendEmail = async () => {
    if (!user || resendCountdown > 0) return;

    try {
      setIsResending(true);
      setSuccessMessage(null);
      clearError();
      await sendEmailVerification();
      setSuccessMessage('New link sent! Please check your inbox.');
      setResendCountdown(60); // Start 60s cooldown
    } catch (err) {
      console.error('Resend email error:', err);
    } finally {
      setIsResending(false);
    }
  };

  const handleCheckStatus = async (silent = false) => {
    if (!user) return;

    try {
      if (!silent) setIsChecking(true);
      setSuccessMessage(null);
      if (!silent) clearError();
      
      const verified = await checkVerification();
      
      if (verified) {
        setSuccessMessage('Email verified successfully!');
      } else if (!silent) {
        // Only show "not verified" message if user manually clicked the button
        setSuccessMessage(null);
        // Error is usually handled by context, but we can set a local hint
      }
    } catch (err) {
      console.error('Check verification error:', err);
    } finally {
      setIsChecking(false);
    }
  };

  const displayMessage = successMessage || error;
  const isError = !!error;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-primary-50"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 32, paddingVertical: 48 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full max-w-[420px] self-center">
          {/* Header Section */}
          <View className="mb-12 items-center">
            <Image
              source={require('../../assets/images/kidventure-logo.png')}
              style={{ width: 128, height: 128, marginBottom: 24 }}
              contentFit="contain"
              priority="high"
              transition={300}
            />
            <View className="w-20 h-20 bg-white rounded-full items-center justify-center mb-4 shadow-md"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 4,
              }}
            >
              <Ionicons name="mail-open" size={40} color={theme.colors.primary[500]} />
            </View>
            
            <Heading level="h1" className="mb-3 text-center" style={{ color: theme.colors.primary[500] }}>
              Verify your email
            </Heading>
            
            <Body size="large" className="text-center text-gray-600 mb-6">
              We've sent a verification link to your email address. Please check your inbox and click the link to verify your account.
            </Body>

            {/* Email Display Card */}
            <View className="w-full bg-white rounded-xl border border-gray-200 p-4 mb-6"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 2,
              }}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1 mr-3">
                  <Text className="text-xs font-medium text-gray-500 mb-1">Email Address</Text>
                  <Text className="text-base font-semibold text-gray-900" numberOfLines={1}>
                    {user?.email}
                  </Text>
                </View>
                {emailVerified && (
                  <View className="bg-success-50 rounded-full p-2">
                    <Ionicons name="checkmark-circle" size={24} color={theme.colors.success[600]} />
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Steps Card */}
          <View className="bg-white border border-gray-200 rounded-xl p-5 mb-6"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 2,
            }}
          >
            <Text className="text-sm font-semibold text-gray-900 mb-4">How to verify:</Text>
            <StepItem 
              icon="mail" 
              text="Check your inbox (and spam folder)" 
              color={theme.colors.secondary.blue[500]}
              bgColor={theme.colors.secondary.blue[50]}
            />
            <View className="h-3 w-[1px] bg-gray-200 ml-5 my-1" />
            <StepItem 
              icon="link" 
              text="Click the verification link in the email" 
              color={theme.colors.secondary.purple[500]}
              bgColor={theme.colors.secondary.purple[50]}
            />
            <View className="h-3 w-[1px] bg-gray-200 ml-5 my-1" />
            <StepItem 
              icon="refresh" 
              text="Return here and tap 'I've Verified My Email'" 
              color={theme.colors.success[600]}
              bgColor={theme.colors.success[50]}
            />
          </View>

          {/* Feedback Message Area */}
          {displayMessage && (
            <View
              className={`mb-6 p-4 rounded-xl border flex-row items-start ${
                isError ? 'bg-error-50 border-error-200' : 'bg-success-50 border-success-200'
              }`}
            >
              <Ionicons 
                name={isError ? "alert-circle" : "checkmark-circle"} 
                size={20} 
                color={isError ? theme.colors.error[700] : theme.colors.success[700]} 
              />
              <Text
                className={`ml-2 flex-1 text-sm font-medium ${
                  isError ? 'text-error-700' : 'text-success-700'
                }`}
              >
                {displayMessage}
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          <View className="mb-6">
            <Button
              variant="primary"
              size="large"
              onPress={openMailApp}
              fullWidth
            >
              Open Email App
            </Button>

            <View className="mt-4">
              <Button
                variant="secondary"
                size="large"
                onPress={() => handleCheckStatus(false)}
                loading={isChecking}
                disabled={isChecking || loading}
                fullWidth
              >
                I've Verified My Email
              </Button>
            </View>

            <View className="mt-4">
              <TouchableOpacity 
                onPress={handleResendEmail}
                disabled={isResending || resendCountdown > 0}
                activeOpacity={0.7}
                className="py-3 items-center"
              >
                <Text className={`text-sm font-medium ${resendCountdown > 0 ? 'text-gray-400' : 'text-primary-500'}`}>
                  {isResending 
                    ? 'Sending...' 
                    : resendCountdown > 0 
                      ? `Resend email in ${resendCountdown}s`
                      : 'Did not receive the email? Resend'
                  }
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className="items-center pt-4">
            <TouchableOpacity
              onPress={() => router.replace('/(auth)/login')}
              disabled={loading || isChecking}
              activeOpacity={0.7}
            >
              <Text className="text-base text-primary-500 font-semibold">Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Full Screen Loading Overlay for Verification Success */}
      {emailVerified && (
        <View className="absolute inset-0 bg-primary-50/95 items-center justify-center z-50">
          <View className="items-center">
            <ActivityIndicator size="large" color={theme.colors.primary[500]} />
            <Text className="mt-4 text-xl font-bold text-gray-900" style={{ fontFamily: theme.typography.fontFamily.headingBold }}>
              Email Verified!
            </Text>
            <Body size="medium" className="text-gray-600 mt-2">
              Redirecting you now...
            </Body>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

// Helper Component for Steps
const StepItem = ({ 
  icon, 
  text, 
  color, 
  bgColor 
}: { 
  icon: string; 
  text: string; 
  color: string; 
  bgColor: string;
}) => (
  <View className="flex-row items-center">
    <View 
      className="w-10 h-10 rounded-full items-center justify-center mr-3"
      style={{ backgroundColor: bgColor }}
    >
      <Ionicons name={icon as any} size={20} color={color} />
    </View>
    <Text className="text-gray-700 font-medium flex-1 text-sm">{text}</Text>
  </View>
);