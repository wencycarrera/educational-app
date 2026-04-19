import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../src/hooks/useAuth';
import { Button } from '../../../src/components/common/Button';
import { Input } from '../../../src/components/common/Input';
import { Heading } from '../../../src/components/ui/Heading';
import { Body } from '../../../src/components/ui/Body';
import { theme } from '../../../src/config/theme';
import { joinClassByCode } from '../../../src/services/classroom.service';

export default function JoinClassScreen() {
  const router = useRouter();
  const { userData, user, reloadUserData } = useAuth();
  const [classCode, setClassCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleJoinClass = async () => {
    setError(null);

    if (!classCode.trim()) {
      setError('Please enter a class code');
      return;
    }

    if (classCode.trim().length < 4) {
      setError('Class code must be at least 4 characters');
      return;
    }

    if (!user || !userData || userData.role !== 'student') {
      setError('Only student accounts can join classes.');
      return;
    }

    try {
      setLoading(true);
      
      // Join the class using the service
      await joinClassByCode(classCode.trim(), user.uid);
      
      // Reload user data to get the updated joinedClassID
      await reloadUserData();
      
      // Navigate to the student dashboard (home screen)
      router.replace('/(student)/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join class. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const studentName = userData && userData.role === 'student' ? userData.studentProfile?.name : 'your child';

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
          <View className="mb-12 items-center">
            <View className="mb-4">
              <Text className="text-6xl">🎓</Text>
            </View>
            <Heading level="h1" className="mb-3 text-center" style={{ color: theme.colors.primary[500] }}>
              Join a Class
            </Heading>
            <Body size="large" className="text-center text-gray-600">
              Enter the class code provided by {studentName}'s teacher to get started.
            </Body>
          </View>

          <View className="mb-8">
            <Input
              placeholder="Class Code"
              value={classCode}
              onChangeText={(text) => {
                setClassCode(text);
                setError(null);
              }}
              autoCapitalize="characters"
              autoComplete="off"
              autoCorrect={false}
              editable={!loading}
              maxLength={20}
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
                onPress={handleJoinClass}
                loading={loading}
                disabled={loading}
                fullWidth
              >
                Join Class
              </Button>
            </View>
          </View>

          <View className="items-center pt-4">
            <Body size="small" className="text-center text-gray-500">
              Don't have a class code?{'\n'}
              Contact your child's teacher to get one.
            </Body>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

