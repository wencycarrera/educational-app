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
import { Ionicons } from '@expo/vector-icons'; // ✅ ADD THIS
import { useAuth } from '../../src/hooks/useAuth';
import { Button } from '../../src/components/common/Button';
import { Input } from '../../src/components/common/Input';
import { Heading } from '../../src/components/ui/Heading';
import { Body } from '../../src/components/ui/Body';
import { theme } from '../../src/config/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { login, loading, error, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secureEntry, setSecureEntry] = useState(true); // ✅ ADD THIS
  const [localError, setLocalError] = useState<string | null>(null);

  const validateForm = (): boolean => {
    setLocalError(null);
    clearError();

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

    return true;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    try {
      await login(email.trim(), password);
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  const displayError = localError || error;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-primary-50"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          paddingHorizontal: 32,
          paddingVertical: 48,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="w-full max-w-[420px] self-center">

          {/* HEADER */}
          <View className="items-center mb-12">
            <Image
              source={require('../../assets/images/kidventure-logo.png')}
              style={{ width: 160, height: 160, marginBottom: 24 }}
              contentFit="contain"
            />
            <Heading level="h1" className="mb-3 text-center" style={{ color: theme.colors.primary[500] }}>
              Welcome to KidVenture!
            </Heading>
            <Body size="large" className="text-center text-gray-600">
              Sign in to continue your learning journey.
            </Body>
          </View>

          {/* FORM */}
          <View className="mb-8">
            <Input
              placeholder="Email"
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

            {/* 🔥 PASSWORD WITH TOGGLE */}
            <Input
              placeholder="Password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setLocalError(null);
                clearError();
              }}
              secureTextEntry={secureEntry} // ✅ controlled
              autoCapitalize="none"
              autoComplete="password"
              autoCorrect={false}
              editable={!loading}

              rightIcon={
                <TouchableOpacity
                  onPress={() => setSecureEntry(!secureEntry)}
                  style={{ padding: 8 }}
                >
                  <Ionicons
                    name={secureEntry ? 'eye-off' : 'eye'}
                    size={20}
                    color={theme.colors.gray[400]}
                  />
                </TouchableOpacity>
              }
            />

            {/* ERROR */}
            {displayError && (
              <View className="p-4 mb-6 border bg-error-50 rounded-xl border-error-200">
                <Text className="text-sm font-medium text-center text-error-700">
                  {displayError}
                </Text>
              </View>
            )}

            {/* BUTTON */}
            <View className="mt-4">
              <Button
                variant="primary"
                size="large"
                onPress={handleLogin}
                loading={loading}
                disabled={loading}
                fullWidth
              >
                Sign In
              </Button>
            </View>
          </View>

          {/* FOOTER */}
          <View className="items-center pt-4">
            <Text className="mb-4 text-sm text-gray-500">
              Don't have an account?
            </Text>

            <View className="flex-row flex-wrap items-center justify-center gap-2">
              <TouchableOpacity
                onPress={() => router.push('/(auth)/register-parent')}
                disabled={loading}
              >
                <Text className="text-sm font-semibold text-primary-500">
                  Register as Parent
                </Text>
              </TouchableOpacity>

              <Text className="text-sm text-gray-400">•</Text>

              <TouchableOpacity
                onPress={() => router.push('/(auth)/register-teacher')}
                disabled={loading}
              >
                <Text className="text-sm font-semibold text-primary-500">
                  Register as Teacher
                </Text>
              </TouchableOpacity>
            </View>
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}