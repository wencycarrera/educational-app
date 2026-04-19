import React from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Button } from '../../src/components/common/Button';
import { Heading } from '../../src/components/ui/Heading';
import { Body } from '../../src/components/ui/Body';
import { theme } from '../../src/config/theme';

export default function OnboardingScreen() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/(auth)/login');
  };

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
              Welcome to KidVenture!
            </Heading>
            <Body size="large" className="text-center text-gray-600">
              Learn math in a fun and interactive way.
            </Body>
          </View>

          <View className="mt-8">
            <Button
              variant="primary"
              size="large"
              onPress={handleGetStarted}
              fullWidth
            >
              Get Started
            </Button>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}


