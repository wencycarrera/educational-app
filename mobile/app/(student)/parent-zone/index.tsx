import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

import { useAuth } from '../../../src/hooks/useAuth';
import { Heading } from '../../../src/components/ui/Heading';
import { Body } from '../../../src/components/ui/Body';
import { Card } from '../../../src/components/ui/Card';
import { Input } from '../../../src/components/common/Input';
import { Button } from '../../../src/components/common/Button';
import { StarsDisplay } from '../../../src/components/student/StarsDisplay';
import { LevelDisplay } from '../../../src/components/student/LevelDisplay';

import { theme } from '../../../src/config/theme';
import { getLevelInfo } from '../../../src/utils/leveling';

export default function ParentSpaceScreen() {
  const router = useRouter();
  const { userData } = useAuth();

  const [showGate, setShowGate] = useState(true);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [secureEntry, setSecureEntry] = useState(true);

  const studentProfile =
    userData && userData.role === 'student'
      ? userData.studentProfile
      : null;

  const parentInfo = studentProfile?.parentInfo;

  useEffect(() => {
    setShowGate(true);
  }, []);

  // 🔐 Parent Password Verification
  const handleGateSubmit = async () => {
    setError(null);

    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }

    if (!parentInfo?.parentEmail) {
      setError('Parent email not found.');
      return;
    }

    setLoading(true);

    try {
      const auth = getAuth();

      await signInWithEmailAndPassword(
        auth,
        parentInfo.parentEmail,
        password
      );

      setShowGate(false);
      setPassword('');
    } catch (err: any) {
      console.log('Parent verification error:', err);

      if (err.code === 'auth/wrong-password') {
        setError('Incorrect password.');
      } else if (err.code === 'auth/user-not-found') {
        setError('Parent account not found.');
      } else {
        setError('Verification failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleViewReports = () => {
    router.push('/(student)/parent-zone/reports');
  };

  const handleViewSettings = () => {
    router.push('/(student)/parent-zone/settings');
  };

  // 🔐 Parent Gate Screen
  if (showGate) {
    return (
      <SafeAreaView className="flex-1 bg-primary-50" edges={['top']}>
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            className="flex-1"
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: 'center',
              paddingHorizontal: 32,
              paddingVertical: 48
            }}
          >
            <View className="w-full max-w-[420px] self-center">
              <View className="items-center mb-10">
                <View
                  className="items-center justify-center w-20 h-20 mb-4 rounded-full"
                  style={{ backgroundColor: theme.colors.primary[200] }}
                >
                  <Ionicons
                    name="lock-closed"
                    size={40}
                    color={theme.colors.primary[700]}
                  />
                </View>

                <Heading
                  level="h1"
                  className="mb-3 text-center"
                  style={{ color: theme.colors.primary[500] }}
                >
                  Parent's Space
                </Heading>

                <Body size="large" className="text-center text-gray-600">
                  Enter the password you used during registration to access
                  parent reports and settings.
                </Body>
              </View>

              <Input
                placeholder="Enter your registration password"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setError(null);
                }}
                secureTextEntry={secureEntry} // <-- use the toggle state
                editable={!loading}
                rightIcon={  // <-- add this
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

              {error && (
                <View className="p-4 mt-4 border bg-error-50 rounded-xl border-error-200">
                  <Text className="text-sm font-medium text-center text-error-700">
                    {error}
                  </Text>
                </View>
              )}

              <View className="mt-6">
                <Button
                  variant="primary"
                  size="large"
                  onPress={handleGateSubmit}
                  loading={loading}
                  disabled={loading || !password}
                  fullWidth
                >
                  {loading ? 'Verifying...' : 'Continue'}
                </Button>
              </View>

              <View className="items-center pt-6">
                <TouchableOpacity
                  onPress={() => router.back()}
                  activeOpacity={0.7}
                >
                  <Body size="small" className="text-gray-500">
                    Go Back
                  </Body>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // Main parent space screen
  if (!studentProfile || !parentInfo) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.emptyContainer}>
          <Body size="medium" style={styles.emptyText}>
            Unable to load parent space
          </Body>
        </View>
      </SafeAreaView>
    );
  }

  const studentName = studentProfile.name;
  const points = (studentProfile as any).points ?? (studentProfile as any).stars ?? 0;
  const level = studentProfile.level;
  const levelInfo = getLevelInfo(points);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerContainer}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              onPress={() => router.replace('/(student)/dashboard')}
              activeOpacity={0.7}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color={theme.colors.gray[700]} />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Heading level="h3" style={{ color: theme.colors.primary[700] }}>
                Parent's Space
              </Heading>
              <Body size="small" style={styles.headerSubtitle}>
                Monitor {studentName}'s progress
              </Body>
            </View>
            <View style={styles.headerSpacer} />
          </View>
        </View>

        {/* Student Overview Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="person-circle-outline" size={24} color={theme.colors.primary[600]} />
              </View>
              <View>
                <Heading level="h3" style={{ color: theme.colors.text.primary }}>
                  Student Overview
                </Heading>
                <Body size="small" style={styles.sectionSubtitle}>
                  Current progress and achievements
                </Body>
              </View>
            </View>
          </View>
          <Card variant="elevated" padding="large" style={styles.overviewCard}>
            <View style={styles.overviewContent}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {studentName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              </View>
              <Heading level="h3" style={styles.studentName}>
                {studentName}
              </Heading>
              <View style={styles.levelDisplayContainer}>
                <LevelDisplay points={points} level={level} size="medium" showProgress={true} />
              </View>
              <View style={styles.starsContainer}>
                <StarsDisplay points={points} size="large" />
              </View>
            </View>
          </Card>
        </View>

        {/* Quick Stats Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="stats-chart-outline" size={24} color={theme.colors.primary[600]} />
              </View>
              <View>
                <Heading level="h3" style={{ color: theme.colors.text.primary }}>
                  Quick Stats
                </Heading>
                <Body size="small" style={styles.sectionSubtitle}>
                  Key performance metrics
                </Body>
              </View>
            </View>
          </View>
          <View style={styles.statsContainer}>
            <Card variant="elevated" padding="large" style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="trophy" size={32} color={theme.colors.warning[600]} />
              </View>
              <Body size="small" style={styles.statLabel}>
                Level
              </Body>
              <Heading level="h4" style={styles.statValue}>
                {levelInfo.level}
              </Heading>
            </Card>
            <Card variant="elevated" padding="large" style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Ionicons name="star" size={32} color={theme.colors.primary[600]} />
              </View>
              <Body size="small" style={styles.statLabel}>
                Total Points
              </Body>
              <Heading level="h4" style={styles.statValue}>
                {points.toLocaleString()}
              </Heading>
            </Card>
          </View>
        </View>

        {/* Menu Options Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="grid-outline" size={24} color={theme.colors.primary[600]} />
              </View>
              <View>
                <Heading level="h3" style={{ color: theme.colors.text.primary }}>
                  Options
                </Heading>
                <Body size="small" style={styles.sectionSubtitle}>
                  Access reports and settings
                </Body>
              </View>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleViewReports}
            activeOpacity={0.7}
            style={styles.menuItem}
          >
            <Card variant="elevated" padding="medium" style={styles.menuCard}>
              <View style={styles.menuCardContent}>
                <View style={[styles.menuIconContainer, { backgroundColor: theme.colors.secondary.blue[100] }]}>
                  <Ionicons
                    name="bar-chart"
                    size={24}
                    color={theme.colors.secondary.blue[600]}
                  />
                </View>
                <View style={styles.menuTextContainer}>
                  <Heading level="h4" style={styles.menuTitle}>
                    Progress Reports
                  </Heading>
                  <Body size="small" style={styles.menuDescription}>
                    View detailed learning progress and analytics
                  </Body>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={24}
                  color={theme.colors.gray[400]}
                />
              </View>
            </Card>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleViewSettings}
            activeOpacity={0.7}
            style={styles.menuItem}
          >
            <Card variant="elevated" padding="medium" style={styles.menuCard}>
              <View style={styles.menuCardContent}>
                <View style={[styles.menuIconContainer, { backgroundColor: theme.colors.gray[100] }]}>
                  <Ionicons
                    name="settings-outline"
                    size={24}
                    color={theme.colors.gray[700]}
                  />
                </View>
                <View style={styles.menuTextContainer}>
                  <Heading level="h4" style={styles.menuTitle}>
                    Settings
                  </Heading>
                  <Body size="small" style={styles.menuDescription}>
                    Manage account and preferences
                  </Body>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={24}
                  color={theme.colors.gray[400]}
                />
              </View>
            </Card>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background.primary },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: theme.spacing[10], paddingTop: theme.spacing[2] },
  headerContainer: { paddingHorizontal: theme.spacing[6], paddingTop: theme.spacing[6], paddingBottom: theme.spacing[4] },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing[6] },
  backButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background.light, marginRight: theme.spacing[4] },
  headerTitleContainer: { flex: 1, alignItems: 'center' },
  headerSubtitle: { color: theme.colors.text.secondary, marginTop: 4 },
  headerSpacer: { width: 40 },
  section: { marginBottom: theme.spacing[6], paddingHorizontal: theme.spacing[6] },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: theme.spacing[1], marginBottom: theme.spacing[4] },
  sectionTitleContainer: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: theme.spacing[3] },
  sectionIconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.primary[50], alignItems: 'center', justifyContent: 'center' },
  sectionSubtitle: { color: theme.colors.text.secondary, marginTop: 2 },
  overviewCard: { backgroundColor: theme.colors.background.light, borderWidth: 1, borderColor: theme.colors.gray[200], shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  overviewContent: { alignItems: 'center' },
  avatarContainer: { marginBottom: theme.spacing[4] },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: theme.colors.primary[200], alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 36, fontWeight: theme.typography.fontWeight.bold, color: theme.colors.primary[700] },
  studentName: { color: theme.colors.primary[700], marginBottom: theme.spacing[4] },
  levelDisplayContainer: { width: '100%', marginBottom: theme.spacing[4] },
  starsContainer: { paddingTop: theme.spacing[4], borderTopWidth: 1, borderTopColor: theme.colors.gray[200], width: '100%', alignItems: 'center' },
  statsContainer: { flexDirection: 'row', gap: theme.spacing[3] },
  statCard: { flex: 1, backgroundColor: theme.colors.background.light, borderWidth: 1, borderColor: theme.colors.gray[200], shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2, alignItems: 'center', minHeight: 140, justifyContent: 'center' },
  statIconContainer: { width: 56, height: 56, borderRadius: 28, backgroundColor: theme.colors.primary[50], alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing[3] },
  statLabel: { color: theme.colors.gray[600], marginBottom: theme.spacing[1], fontWeight: theme.typography.fontWeight.medium },
  statValue: { color: theme.colors.text.primary },
  menuItem: { marginBottom: theme.spacing[3] },
  menuCard: { backgroundColor: theme.colors.background.light, borderWidth: 1, borderColor: theme.colors.gray[200], shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  menuCardContent: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing[4] },
  menuIconContainer: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  menuTextContainer: { flex: 1 },
  menuTitle: { color: theme.colors.text.primary, marginBottom: theme.spacing[1] },
  menuDescription: { color: theme.colors.text.secondary },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: theme.spacing[6] },
  emptyText: { color: theme.colors.text.secondary, textAlign: 'center' },
});