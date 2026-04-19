import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { Button } from '../../src/components/common/Button';
import { Heading } from '../../src/components/ui/Heading';
import { Body } from '../../src/components/ui/Body';
import { theme } from '../../src/config/theme';

export default function WaitingApprovalScreen() {
  const router = useRouter();
  const { user, userData, reloadUserData, loading } = useAuth();
  const [isChecking, setIsChecking] = useState(false);
  const [isApproved, setIsApproved] = useState<boolean | null>(null);

  // Update approval status when userData changes
  useEffect(() => {
    if (userData && userData.role === 'teacher' && 'isApproved' in userData) {
      setIsApproved(userData.isApproved);
    }
  }, [userData]);

  // Auto-check approval status periodically
  useEffect(() => {
    if (!user || !userData || userData.role !== 'teacher') {
      return;
    }

    // Only set up auto-check if not approved
    if (isApproved === false) {
      const interval = setInterval(async () => {
        try {
          await reloadUserData();
          // The userData will be updated by the auth context
        } catch (err) {
          // Silently fail auto-check
          console.error('Auto-check approval error:', err);
        }
      }, 10000); // Check every 10 seconds

      return () => clearInterval(interval);
    }
  }, [user, userData, isApproved, reloadUserData]);

  const handleCheckStatus = async () => {
    if (!user) {
      return;
    }

    try {
      setIsChecking(true);
      await reloadUserData();
      // Status will be updated via useEffect when userData changes
    } catch (err) {
      console.error('Check approval status error:', err);
    } finally {
      setIsChecking(false);
    }
  };

  const handleBackToLogin = () => {
    router.replace('/(auth)/login');
  };

  // Initialize approval status on mount
  useEffect(() => {
    if (isApproved === null && userData && userData.role === 'teacher' && 'isApproved' in userData) {
      setIsApproved(userData.isApproved);
    }
  }, [userData, isApproved]);

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-primary-50"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 32, paddingVertical: 48 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="w-full max-w-[420px] self-center">
          <View className="items-center mb-12">
            <Image
              source={require('../../assets/images/kidventure-logo.png')}
              style={{ width: 128, height: 128, marginBottom: 24 }}
              contentFit="contain"
              priority="high"
              transition={300}
            />
            <Heading level="h1" className="mb-3 text-center" style={{ color: theme.colors.primary[500] }}>
              Account Under Review
            </Heading>
            <Body size="large" className="text-center text-gray-600">
              Your account is being reviewed by MES Admins.
            </Body>
          </View>

          <View className="mb-8">
            <View className="p-4 mb-6 border bg-info-50 rounded-xl border-info-200">
              <Text className="text-sm leading-relaxed text-info-700">
                Thank you for registering as a teacher! Your account is currently under review by our administrators. 
                You will receive an email notification once your account has been approved.
              </Text>
            </View>

            {user?.email && (
              <View className="p-4 mb-6 bg-white border border-gray-200 rounded-xl">
                <Text className="mb-1 text-sm font-medium text-gray-700">Registered Email:</Text>
                <Text className="text-base font-semibold text-gray-900">{user.email}</Text>
              </View>
            )}

            <View className="mb-6">
              <Button
                variant="primary"
                size="large"
                onPress={handleCheckStatus}
                loading={isChecking}
                disabled={isChecking || loading}
                fullWidth
              >
                {isChecking ? 'Checking...' : 'Refresh Approval Status'}
              </Button>
            </View>

            {isApproved === true && (
              <View className="items-center p-4 mt-4">
                <ActivityIndicator size="large" color={theme.colors.success[500]} />
                <Text className="mt-2 text-base font-semibold text-success-700">
                  Account approved! Redirecting...
                </Text>
              </View>
            )}
          </View>

          <View className="items-center pt-4">
            <TouchableOpacity
              onPress={handleBackToLogin}
              disabled={loading || isChecking}
              activeOpacity={0.7}
            >
              <Text className="text-base font-semibold text-primary-500">Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

