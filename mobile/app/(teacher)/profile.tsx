import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Text,
  Modal,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/hooks/useAuth';
import { Heading } from '../../src/components/ui/Heading';
import { Body } from '../../src/components/ui/Body';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/common/Button';
import { theme } from '../../src/config/theme';
import { UserWithTeacherProfile } from '../../src/types/user';

export default function TeacherProfileScreen() {
  const router = useRouter();
  const { user, userData, logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

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

  const teacherData = userData as UserWithTeacherProfile;
  const teacherProfile = teacherData.teacherProfile;

  const formatBirthday = (timestamp: any) => {
    if (!timestamp) return 'Not set';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleEditProfile = () => {
    router.push('/(teacher)/edit-profile');
  };

  const handleLogout = () => setShowLogoutModal(true);

  const confirmLogout = async () => {
    try {
      setShowLogoutModal(false);
      await logout();
      router.replace('/login'); // Works for mobile & web
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
  };

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
              onPress={() => router.back()}
              activeOpacity={0.7}
              style={styles.backButton}
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color={theme.colors.gray[700]}
              />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Heading level="h3" style={{ color: theme.colors.primary[700] }}>
                Profile
              </Heading>
            </View>
            <View style={styles.headerSpacer} />
          </View>
        </View>

        {/* Profile Card */}
        <View style={styles.section}>
          <Card variant="elevated" padding="large" style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                <Ionicons
                  name="person-circle"
                  size={80}
                  color={theme.colors.primary[500]}
                />
              </View>
              <Heading level="h2" style={styles.profileName}>
                {teacherProfile.name}
              </Heading>
              <Body size="medium" style={styles.profileEmail}>
                {user?.email || 'N/A'}
              </Body>
            </View>
          </Card>
        </View>

        {/* Profile Information */}
        <View style={styles.section}>
          <Body size="medium" style={styles.sectionLabel}>
            Profile Information
          </Body>
          <Card variant="elevated" padding="medium" style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={theme.colors.primary[500]}
                />
              </View>
              <View style={styles.infoContent}>
                <Body size="small" style={styles.infoLabel}>
                  Name
                </Body>
                <Body size="medium" style={styles.infoValue}>
                  {teacherProfile.name}
                </Body>
              </View>
            </View>

            <View style={[styles.infoRow, styles.infoRowDivider]}>
              <View style={styles.infoIconContainer}>
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={theme.colors.primary[500]}
                />
              </View>
              <View style={styles.infoContent}>
                <Body size="small" style={styles.infoLabel}>
                  Birthday
                </Body>
                <Body size="medium" style={styles.infoValue}>
                  {formatBirthday(teacherProfile.birthday)}
                </Body>
              </View>
            </View>
          </Card>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <Button
            variant="primary"
            size="large"
            onPress={handleEditProfile}
            fullWidth
          >
            Edit Profile
          </Button>
        </View>

        {/* Logout Button */}
        <View style={styles.section}>
          <TouchableOpacity onPress={handleLogout} activeOpacity={0.8}>
            <View style={styles.logoutButtonContainer}>
              <Ionicons
                name="log-out-outline"
                size={24}
                color="#fff"
                style={{ marginRight: 12 }}
              />
              <Text style={styles.logoutButtonText}>Logout</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Logout Modal */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.logoutModalOverlay}>
          <View style={styles.logoutModalContainer}>
            
            <Text style={styles.logoutMessage}>
              Are you sure you want to logout?
            </Text>
            <View style={styles.logoutButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={confirmLogout}>
                <Text style={styles.confirmText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background.primary },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: theme.spacing[8] },
  headerContainer: {
    paddingHorizontal: theme.spacing[6],
    paddingTop: theme.spacing[6],
    paddingBottom: theme.spacing[4],
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing[6],
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background.light,
    marginRight: theme.spacing[4],
  },
  headerTitleContainer: { flex: 1, alignItems: 'center' },
  headerSpacer: { width: 40 },
  section: { paddingHorizontal: theme.spacing[6], marginBottom: theme.spacing[6] },
  sectionLabel: {
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing[3],
  },
  profileCard: { alignItems: 'center' },
  profileHeader: { alignItems: 'center', width: '100%' },
  avatarContainer: { marginBottom: theme.spacing[4] },
  profileName: {
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
    textAlign: 'center',
  },
  profileEmail: { color: theme.colors.text.secondary, textAlign: 'center' },
  infoCard: { marginTop: 0 },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: theme.spacing[3] },
  infoRowDivider: { borderTopWidth: 1, borderTopColor: theme.colors.gray[200] },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing[3],
  },
  infoContent: { flex: 1 },
  infoLabel: { color: theme.colors.text.secondary, marginBottom: theme.spacing[1] },
  infoValue: { color: theme.colors.text.primary, fontWeight: theme.typography.fontWeight.medium },
  // --- Logout button styles ---
  logoutButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.error[600],
    paddingVertical: theme.spacing[4],
    borderRadius: theme.borderRadius.xl,
    marginHorizontal: theme.spacing[6],
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  logoutModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutModalContainer: {
    width: '85%',
    backgroundColor: theme.colors.background.light,
    borderRadius: theme.borderRadius['2xl'],
    padding: theme.spacing[6],
    alignItems: 'center',
  },
  
  logoutMessage: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing[5],
  },
  logoutButtons: {
    flexDirection: 'row',
    gap: theme.spacing[3],
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: theme.spacing[3],
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.gray[100],
    alignItems: 'center',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: theme.spacing[3],
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.error[600],
    alignItems: 'center',
  },
  cancelText: { color: theme.colors.text.primary, fontWeight: '600' },
  confirmText: { color: '#fff', fontWeight: '700' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: theme.colors.text.secondary },
});