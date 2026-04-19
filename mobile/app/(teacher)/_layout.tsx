import { Stack } from 'expo-router';

/**
 * Teacher Layout
 * Handles navigation for teacher screens
 * All navigation is done through the dashboard's Quick Actions
 */
export default function TeacherLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}

