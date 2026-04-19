import { Stack } from "expo-router";
import React from "react";
import { useAuth } from "../../src/contexts/AuthContext";

/**
 * Student Layout (No Background Music)
 * Handles navigation for student screens only
 */
export default function StudentLayout() {
  const { user, userData, loading } = useAuth();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}