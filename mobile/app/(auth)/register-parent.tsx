import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Modal,
  Pressable,
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

type Gender = 'male' | 'female' | 'other';

export default function RegisterParentScreen() {
  const router = useRouter();
  const { registerParent, loading, error, clearError } = useAuth();
  
  // Form state
  const [parentName, setParentName] = useState('');
  const [parentBirthday, setParentBirthday] = useState<Date | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [childName, setChildName] = useState('');
  const [childBirthday, setChildBirthday] = useState<Date | null>(null);
  const [childGender, setChildGender] = useState<Gender | ''>('');
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Today date for parent max date
  const today = new Date();
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() - 1); // Yesterday (parent past date)

  // Child birthday must be 6 to 7 years old
  const maxChildBirthday = new Date(today);
  maxChildBirthday.setFullYear(maxChildBirthday.getFullYear() - 6); // max = 6 years old

  const minChildBirthday = new Date(today);
  minChildBirthday.setFullYear(minChildBirthday.getFullYear() - 7); // min = 7 years old

  const validateForm = (): boolean => {
    setLocalError(null);
    clearError();

    if (!parentName.trim()) {
      setLocalError('Parent name is required');
      return false;
    }

    if (!parentBirthday) {
      setLocalError('Parent birthday is required');
      return false;
    }

    const parentDate = new Date(parentBirthday);
    parentDate.setHours(0, 0, 0, 0);
    if (parentDate >= today) {
      setLocalError('Parent birthday must be in the past');
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

    if (!childName.trim()) {
      setLocalError('Child name is required');
      return false;
    }

    if (!childBirthday) {
      setLocalError('Child birthday is required');
      return false;
    }

    const childDate = new Date(childBirthday);
    childDate.setHours(0, 0, 0, 0);
    if (childDate > maxChildBirthday || childDate < minChildBirthday) {
      setLocalError('Child must be aged 6 to 7 years old');
      return false;
    }

    if (!childGender) {
      setLocalError('Child gender is required');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      await registerParent({
        email: email.trim(),
        password,
        parentName: parentName.trim(),
        parentBirthday: parentBirthday!,
        childName: childName.trim(),
        childBirthday: childBirthday!,
        childGender: childGender as Gender,
      });
      router.push('/(auth)/verify-email');
    } catch (err) {
      console.error('Registration error:', err);
    }
  };

  const displayError = localError || error;

  const genderOptions: { label: string; value: Gender }[] = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
    { label: 'Other', value: 'other' },
  ];

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
              Register for Student
            </Heading>
            <Body size="large" className="text-center text-gray-600">
              Register on behalf of your child to start learning
            </Body>
          </View>

          <View className="mb-8">
            <Text className="mb-4 text-lg font-semibold text-gray-900">Parent Information</Text>

            <Input
              label="Parent Name"
              placeholder="Enter your full name"
              value={parentName}
              onChangeText={(text) => {
                setParentName(text);
                setLocalError(null);
                clearError();
              }}
              autoCapitalize="words"
              editable={!loading}
            />

            <DatePicker
              label="Parent Birthday"
              value={parentBirthday}
              onChange={(date) => {
                setParentBirthday(date);
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

            <Text className="mt-6 mb-4 text-lg font-semibold text-gray-900">Student Information</Text>

            <Input
              label="Student Name"
              placeholder="Enter your child's name"
              value={childName}
              onChangeText={(text) => {
                setChildName(text);
                setLocalError(null);
                clearError();
              }}
              autoCapitalize="words"
              editable={!loading}
            />

            <DatePicker
              label="Child Birthday"
              value={childBirthday}
              onChange={(date) => {
                setChildBirthday(date);
                setLocalError(null);
                clearError();
              }}
              maximumDate={maxChildBirthday}
              minimumDate={minChildBirthday}
              editable={!loading}
              placeholder="Select your child's birthday"
            />

            <View className="mb-5">
              <Text className="mb-2 text-sm font-medium text-gray-900">Student Gender</Text>
              <TouchableOpacity
                className="rounded-xl bg-white border border-gray-300 py-4 px-5 min-h-[56px] justify-center"
                onPress={() => setShowGenderPicker(true)}
                disabled={loading}
                activeOpacity={0.7}
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 1,
                }}
              >
                <Text className={`text-base ${!childGender ? 'text-gray-500' : 'text-gray-900'}`}>
                  {childGender
                    ? genderOptions.find((opt) => opt.value === childGender)?.label
                    : 'Select gender'}
                </Text>
              </TouchableOpacity>
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

      {/* Gender Picker Modal */}
      <Modal
        visible={showGenderPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGenderPicker(false)}
      >
        <Pressable
          className="justify-end flex-1 bg-black/50"
          onPress={() => setShowGenderPicker(false)}
        >
          <View className="p-6 pb-8 bg-white rounded-t-3xl" onStartShouldSetResponder={() => true}>
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-xl font-bold text-gray-900">Select Gender</Text>
              <TouchableOpacity
                onPress={() => setShowGenderPicker(false)}
                activeOpacity={0.7}
              >
                <Text className="text-base font-semibold text-primary-500">Done</Text>
              </TouchableOpacity>
            </View>
            {genderOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                className={`py-4 px-5 rounded-xl mb-3 ${
                  childGender === option.value
                    ? 'bg-primary-100 border-2 border-primary-500'
                    : 'bg-gray-100 border border-gray-200'
                }`}
                onPress={() => {
                  setChildGender(option.value);
                  setShowGenderPicker(false);
                  setLocalError(null);
                  clearError();
                }}
                activeOpacity={0.7}
              >
                <Text
                  className={`text-base text-center ${
                    childGender === option.value
                      ? 'text-primary-700 font-semibold'
                      : 'text-gray-900'
                  }`}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}