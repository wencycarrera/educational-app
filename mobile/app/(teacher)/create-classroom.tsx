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
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/hooks/useAuth';
import { Button } from '../../src/components/common/Button';
import { Input } from '../../src/components/common/Input';
import { Heading } from '../../src/components/ui/Heading';
import { Body } from '../../src/components/ui/Body';
import { Card } from '../../src/components/ui/Card';
import { theme } from '../../src/config/theme';
import { createClassroom, getClassroomsByTeacher } from '../../src/services/classroom.service';

export default function CreateClassroomScreen() {
  const router = useRouter();
  const { user, userData } = useAuth();
  const [className, setClassName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [createdClassCode, setCreatedClassCode] = useState<string | null>(null);
  const [checkingExistingClassroom, setCheckingExistingClassroom] = useState(true);

  // Check if teacher already has a classroom (one classroom per teacher restriction)
  useEffect(() => {
    const checkExistingClassroom = async () => {
      if (!user || !userData || userData.role !== 'teacher') {
        setCheckingExistingClassroom(false);
        return;
      }

      try {
        const existingClassrooms = await getClassroomsByTeacher(user.uid);
        if (existingClassrooms.length > 0) {
          // Teacher already has a classroom, redirect to dashboard
          router.replace('/(teacher)/dashboard');
          return;
        }
      } catch (error) {
        console.error('Error checking existing classroom:', error);
      } finally {
        setCheckingExistingClassroom(false);
      }
    };

    checkExistingClassroom();
  }, [user, userData, router]);

  const validateForm = (): boolean => {
    setError(null);

    if (!className.trim()) {
      setError('Class name is required');
      return false;
    }

    if (className.trim().length < 3) {
      setError('Class name must be at least 3 characters');
      return false;
    }

    if (className.trim().length > 50) {
      setError('Class name must be less than 50 characters');
      return false;
    }

    return true;
  };

  const handleCreateClassroom = async () => {
    if (!validateForm()) {
      return;
    }

    if (!user || !userData || userData.role !== 'teacher') {
      setError('You must be logged in as a teacher to create a classroom');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const newClassroom = await createClassroom(user.uid, className.trim());
      
      setCreatedClassCode(newClassroom.classCode);
      setSuccess(true);
      
      // Auto-navigate after 2 seconds
      setTimeout(() => {
        router.replace('/(teacher)/dashboard');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create classroom. Please try again.');
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  // Show loading while checking for existing classroom
  if (checkingExistingClassroom) {
    return (
      <SafeAreaView className="flex-1 bg-primary-50" edges={['top']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.primary[500]} />
        </View>
      </SafeAreaView>
    );
  }

  if (success && createdClassCode) {
    return (
      <SafeAreaView className="flex-1 bg-primary-50" edges={['top']}>
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 32, paddingVertical: 48 }}
            keyboardShouldPersistTaps="handled"
          >
            <View className="w-full max-w-[420px] self-center">
              <View className="mb-12 items-center">
                <View className="mb-4">
                  <View className="w-24 h-24 rounded-full bg-success-500 items-center justify-center">
                    <Ionicons name="checkmark" size={48} color="#ffffff" />
                  </View>
                </View>
                <Heading level="h1" className="mb-3 text-center" style={{ color: theme.colors.success[500] }}>
                  Classroom Created!
                </Heading>
                <Body size="large" className="text-center text-gray-600 mb-6">
                  Your classroom has been successfully created.
                </Body>
              </View>

              <Card variant="elevated" padding="large" style={{ marginBottom: 24 }}>
                <View className="items-center">
                  <Body size="small" className="text-gray-600 mb-2 text-center">
                    Class Name
                  </Body>
                  <Heading level="h3" className="mb-6" style={{ color: theme.colors.text.primary }}>
                    {className}
                  </Heading>
                  
                  <Body size="small" className="text-gray-600 mb-2 text-center">
                    Class Code
                  </Body>
                  <View className="bg-primary-100 px-6 py-4 rounded-xl mb-4">
                    <Text className="text-3xl font-bold text-center tracking-widest" style={{ color: theme.colors.primary[700], fontFamily: theme.typography.fontFamily.headingBold }}>
                      {createdClassCode}
                    </Text>
                  </View>
                  <Body size="small" className="text-center text-gray-500">
                    Share this code with parents so they can join your class
                  </Body>
                </View>
              </Card>

              <View className="items-center">
                <Body size="small" className="text-center text-gray-500">
                  Redirecting to dashboard...
                </Body>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-primary-50" edges={['top']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 32, paddingVertical: 48 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="w-full max-w-[420px] self-center">
            {/* Header with back button */}
            <View className="mb-8">
              <TouchableOpacity
                onPress={handleGoBack}
                activeOpacity={0.7}
                className="mb-6"
              >
                <View className="flex-row items-center">
                  <Ionicons name="arrow-back" size={24} color={theme.colors.primary[500]} />
                  <Body size="medium" className="ml-2" style={{ color: theme.colors.primary[500] }}>
                    Back
                  </Body>
                </View>
              </TouchableOpacity>
            </View>

            <View className="mb-12 items-center">
              <View className="mb-4">
                <Text className="text-6xl">🏫</Text>
              </View>
              <Heading level="h1" className="mb-3 text-center" style={{ color: theme.colors.primary[500] }}>
                Create Classroom
              </Heading>
              <Body size="large" className="text-center text-gray-600">
                Set up a new classroom for your students. A unique class code will be generated automatically.
              </Body>
            </View>

            <View className="mb-8">
              <Input
                label="Class Name"
                placeholder="e.g., Grade 1 - Sampaguita"
                value={className}
                onChangeText={(text) => {
                  setClassName(text);
                  setError(null);
                }}
                autoCapitalize="words"
                autoComplete="off"
                autoCorrect={false}
                editable={!loading}
                maxLength={50}
              />

              {error && (
                <View className="mb-6 p-4 bg-error-50 rounded-xl border border-error-200">
                  <Text className="text-sm text-error-700 text-center font-medium">{error}</Text>
                </View>
              )}

              <View className="mt-4">
                <Button
                  variant="primary"
                  size="large"
                  onPress={handleCreateClassroom}
                  loading={loading}
                  disabled={loading || !className.trim()}
                  fullWidth
                >
                  Create Classroom
                </Button>
              </View>
            </View>

            {/* Info Card */}
            <Card variant="outlined" padding="medium">
              <View className="flex-row items-start">
                <View className="mr-3 mt-1">
                  <Ionicons name="information-circle" size={20} color={theme.colors.info[500]} />
                </View>
                <View className="flex-1">
                  <Body size="small" style={{ color: theme.colors.text.secondary }}>
                    <Text style={{ fontWeight: theme.typography.fontWeight.semibold }}>
                      What happens next?
                    </Text>
                    {'\n\n'}
                    After creating your classroom, you'll receive a unique 6-character class code. 
                    Share this code with parents so they can join your class with their child's account.
                  </Body>
                </View>
              </View>
            </Card>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

