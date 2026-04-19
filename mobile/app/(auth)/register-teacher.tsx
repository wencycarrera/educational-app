import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { Button } from '../../src/components/common/Button';
import { Input } from '../../src/components/common/Input';
import { DatePicker } from '../../src/components/common/DatePicker';
import { Heading } from '../../src/components/ui/Heading';
import { Body } from '../../src/components/ui/Body';
import { theme } from '../../src/config/theme';
import { Ionicons } from '@expo/vector-icons';


export default function RegisterTeacherScreen() {
  const router = useRouter();
  const { registerTeacher, loading, error, clearError } = useAuth();
  
  // Form state
  const [name, setName] = useState('');
  const [birthday, setBirthday] = useState<Date | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateForm = (): boolean => {
    setLocalError(null);
    clearError();

    if (!name.trim()) {
      setLocalError('Name is required');
      return false;
    }

    if (!birthday) {
      setLocalError('Birthday is required');
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const birthDate = new Date(birthday);
    birthDate.setHours(0, 0, 0, 0);
    if (birthDate >= today) {
      setLocalError('Birthday must be in the past');
      return false;
    }

    if (!email.trim()) {
      setLocalError('Email is required');
      return false;
    }

    if (!email.includes('@')) {
      setLocalError('Please enter a valid email address');
      return false;
    }

    if (!password) {
      setLocalError('Password is required');
      return false;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return false;
    }

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await registerTeacher({
        email: email.trim(),
        password,
        name: name.trim(),
        birthday: birthday!,
      });
      // Navigation will be handled by root layout
      // Teacher goes directly to waiting-approval screen (no email verification needed)
      router.push('/(auth)/waiting-approval');
    } catch (err) {
      // Error is already handled by AuthContext
      console.error('Registration error:', err);
    }
  };

  const displayError = localError || error;
  const today = new Date();
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() - 1); // Yesterday (past dates only)

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
              Register as Teacher
            </Heading>
            <Body size="large" className="text-center text-gray-600">
              Create an account to start teaching with KidVenture
            </Body>
          </View>

          <View className="mb-8">
            <Input
              label="Full Name"
              placeholder="Enter your full name"
              value={name}
              onChangeText={(text) => {
                setName(text);
                setLocalError(null);
                clearError();
              }}
              autoCapitalize="words"
              editable={!loading}
            />

            <DatePicker
              label="Birthday"
              value={birthday}
              onChange={(date) => {
                setBirthday(date);
                setLocalError(null);
                clearError();
              }}
              maximumDate={maxDate}
              editable={!loading}
              placeholder="Select your birthday"
            />

            <Input
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setLocalError(null);
                clearError();
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              editable={!loading}
            />

             <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setLocalError(null);
                clearError();
              }}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete="password"
              autoCorrect={false}
              editable={!loading}
              helperText="At least 6 characters"
              rightIcon={
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={24}
                    color="#898989" // primary color
                  />
                </TouchableOpacity>
              }
            />
            
            <Input
              label="Confirm Password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                setLocalError(null);
                clearError();
              }}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              autoComplete="password"
              autoCorrect={false}
              editable={!loading}
              rightIcon={
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off' : 'eye'}
                    size={24}
                    color="#898989"
                  />
                </TouchableOpacity>
              }
            />

            <View className="p-4 mb-6 border bg-info-50 rounded-xl border-info-200">
              <Text className="text-sm leading-relaxed text-info-700">
                Note: Your account will be reviewed by an administrator before you can access the teacher dashboard.
              </Text>
            </View>

            {displayError && (
              <View className="p-4 mb-6 border bg-error-50 rounded-xl border-error-200">
                <Text className="text-sm font-medium text-center text-error-700">{displayError}</Text>
              </View>
            )}

            <View className="mt-2">
              <Button
                variant="primary"
                size="large"
                onPress={handleRegister}
                loading={loading}
                disabled={loading}
                fullWidth
              >
                Create Account
              </Button>
            </View>
          </View>

          <View className="items-center pt-4">
            <Text className="mb-4 text-sm text-gray-500">Already have an account?</Text>
            <TouchableOpacity
              onPress={() => router.push('/(auth)/login')}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Text className="text-base font-semibold text-primary-500">Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

