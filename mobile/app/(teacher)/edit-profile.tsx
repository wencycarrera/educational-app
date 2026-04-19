import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/hooks/useAuth';
import { Button } from '../../src/components/common/Button';
import { Input } from '../../src/components/common/Input';
import { DatePicker } from '../../src/components/common/DatePicker';
import { Heading } from '../../src/components/ui/Heading';
import { Body } from '../../src/components/ui/Body';
import { theme } from '../../src/config/theme';
import { updateTeacherProfile } from '../../src/services/auth.service';
import { UserWithTeacherProfile } from '../../src/types/user';
import { Timestamp } from 'firebase/firestore';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, userData, reloadUserData } = useAuth();
  
  const [name, setName] = useState('');
  const [birthday, setBirthday] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Load current profile data
  useEffect(() => {
    if (userData && userData.role === 'teacher') {
      const teacherData = userData as UserWithTeacherProfile;
      const profile = teacherData.teacherProfile;
      
      setName(profile.name);
      
      // Convert Firestore Timestamp to Date
      if (profile.birthday) {
        const birthdayDate = profile.birthday.toDate ? profile.birthday.toDate() : new Date(profile.birthday);
        setBirthday(birthdayDate);
      }
    }
  }, [userData]);

  const validateForm = (): boolean => {
    setError(null);

    if (!name.trim()) {
      setError('Name is required');
      return false;
    }

    if (!birthday) {
      setError('Birthday is required');
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const birthDate = new Date(birthday);
    birthDate.setHours(0, 0, 0, 0);
    if (birthDate >= today) {
      setError('Birthday must be in the past');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    if (!user) {
      setError('User not found');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await updateTeacherProfile(user.uid, {
        name: name.trim(),
        birthday: birthday!,
      });

      // Reload user data to reflect changes
      await reloadUserData();

      Alert.alert(
        'Success',
        'Profile updated successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!userData || userData.role !== 'teacher') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.emptyContainer}>
          <Heading level="h3" style={styles.emptyText}>
            Teacher profile not found
          </Heading>
        </View>
      </SafeAreaView>
    );
  }

  const today = new Date();
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() - 1); // Yesterday (past dates only)

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.7}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color={theme.colors.primary[500]} />
            </TouchableOpacity>
            <Heading level="h2" style={styles.headerTitle}>
              Edit Profile
            </Heading>
            <View style={styles.headerSpacer} />
          </View>

          {/* Form */}
          <View style={styles.section}>
            <Input
              label="Full Name"
              placeholder="Enter your full name"
              value={name}
              onChangeText={(text) => {
                setName(text);
                setError(null);
              }}
              autoCapitalize="words"
              editable={!loading}
            />

            <DatePicker
              label="Birthday"
              value={birthday}
              onChange={(date) => {
                setBirthday(date);
                setError(null);
              }}
              maximumDate={maxDate}
              editable={!loading}
              placeholder="Select your birthday"
            />

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.buttonContainer}>
              <Button
                variant="primary"
                size="large"
                onPress={handleSave}
                loading={loading}
                disabled={loading}
                fullWidth
              >
                Save Changes
              </Button>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing[6],
  },
  emptyText: {
    color: theme.colors.text.secondary,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing[8],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing[6],
    paddingTop: theme.spacing[4],
    paddingBottom: theme.spacing[4],
  },
  backButton: {
    padding: theme.spacing[2],
  },
  headerTitle: {
    color: theme.colors.primary[500],
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  section: {
    paddingHorizontal: theme.spacing[6],
    marginBottom: theme.spacing[6],
  },
  errorContainer: {
    marginTop: theme.spacing[2],
    marginBottom: theme.spacing[4],
    padding: theme.spacing[4],
    backgroundColor: theme.colors.error[50],
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.error[200],
  },
  errorText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.error[700],
    textAlign: 'center',
    fontWeight: theme.typography.fontWeight.medium,
  },
  buttonContainer: {
    marginTop: theme.spacing[4],
  },
});

