import { Stack } from 'expo-router';

/**
 * Auth Layout
 * Handles navigation for authentication screens
 */
export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}

