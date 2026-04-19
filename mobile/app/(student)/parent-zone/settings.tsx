import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../src/hooks/useAuth';
import { Heading } from '../../../src/components/ui/Heading';
import { Body } from '../../../src/components/ui/Body';
import { Card } from '../../../src/components/ui/Card';
import { Input } from '../../../src/components/common/Input';
import { Button } from '../../../src/components/common/Button';
import { DatePicker } from '../../../src/components/common/DatePicker';
import { theme } from '../../../src/config/theme';
import { updateUserData } from '../../../src/services/auth.service';
import { logout } from '../../../src/services/auth.service';
import { Timestamp } from 'firebase/firestore';

type Gender = 'male' | 'female' | 'other';

export default function SettingsScreen() {
  const router = useRouter();
  const { userData, user, reloadUserData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showEditStudent, setShowEditStudent] = useState(false);
  const [showGenderPicker, setShowGenderPicker] = useState(false);
const [showLogoutModal, setShowLogoutModal] = useState(false);
  const studentProfile = (userData as any)?.studentProfile || null;

  // Edit student form state
  const [studentName, setStudentName] = useState(studentProfile?.name || '');
  const [studentBirthday, setStudentBirthday] = useState<Date | null>(
    studentProfile?.birthday ? studentProfile.birthday.toDate() : null
  );
  const [studentGender, setStudentGender] = useState<Gender | ''>(
    (studentProfile?.gender as Gender) || ''
  );

  const handleEditStudent = async () => {
    if (!user || !userData || !studentProfile) return;

    if (!studentName.trim()) {
      Alert.alert('Error', 'Student name is required');
      return;
    }

    if (!studentBirthday) {
      Alert.alert('Error', 'Student birthday is required');
      return;
    }

    if (!studentGender) {
      Alert.alert('Error', 'Student gender is required');
      return;
    }

    try {
      setLoading(true);
      await updateUserData(user.uid, {
        studentProfile: {
          ...(studentProfile || {}),
          name: studentName.trim(),
          birthday: Timestamp.fromDate(studentBirthday),
          gender: studentGender as Gender,
        },
      });
      await reloadUserData();
      setShowEditStudent(false);
      Alert.alert('Success', 'Student profile updated successfully');
    } catch (error) {
      console.error('Error updating student profile:', error);
      Alert.alert('Error', 'Failed to update student profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

const handleLogout = () => {
  setShowLogoutModal(true);
};

const confirmLogout = async () => {
  try {
    setShowLogoutModal(false);
    await logout();
  } catch (error) {
    console.error('Logout error:', error);
    Alert.alert('Error', 'Failed to logout. Please try again.');
  }
};
  const genderOptions: { label: string; value: Gender }[] = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
    { label: 'Other', value: 'other' },
  ];

  const today = new Date();
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() - 1);

  // Format birthday to "July 12, 2004" format
  const formatBirthday = (birthday: any): string => {
    if (!birthday) return 'N/A';
    try {
      const date = birthday.toDate ? birthday.toDate() : new Date(birthday);
      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'N/A';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header (mirrors teacher class roster) */}
        <View style={styles.headerContainer}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.7}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color={theme.colors.gray[700]} />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Heading level="h3" style={{ color: theme.colors.primary[700] }}>
                Settings
              </Heading>
              <Body size="small" style={styles.headerSubtitle}>
                Manage your account
              </Body>
            </View>
            <View style={styles.headerSpacer} />
          </View>
        </View>

        {/* Account Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="person-circle-outline" size={24} color={theme.colors.primary[600]} />
              </View>
              <View>
                <Heading level="h3" style={{ color: theme.colors.text.primary }}>
                  Account Information
                </Heading>
                <Body size="small" style={styles.sectionSubtitle}>
                  Details tied to your parent account
                </Body>
              </View>
            </View>
          </View>
          <Card variant="elevated" padding="medium" style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <Ionicons name="mail-outline" size={18} color={theme.colors.gray[500]} style={styles.infoIcon} />
                <Body size="small" style={styles.infoLabel}>Email</Body>
              </View>
              <Body size="medium" style={styles.infoValue}>
                {userData?.email || 'N/A'}
              </Body>
            </View>
            {studentProfile?.parentInfo && (
              <View style={[styles.infoRow, styles.infoRowBorder]}>
                <View style={styles.infoLabelContainer}>
                  <Ionicons name="person-outline" size={18} color={theme.colors.gray[500]} style={styles.infoIcon} />
                  <Body size="small" style={styles.infoLabel}>Parent Name</Body>
                </View>
                <Body size="medium" style={styles.infoValue}>
                  {studentProfile.parentInfo.parentName || 'N/A'}
                </Body>
              </View>
            )}
          </Card>
        </View>

        {/* Student Profile */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="school-outline" size={24} color={theme.colors.primary[600]} />
              </View>
              <View>
                <Heading level="h3" style={{ color: theme.colors.text.primary }}>
                  Student Profile
                </Heading>
                <Body size="small" style={styles.sectionSubtitle}>
                  Keep your child's info up to date
                </Body>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => {
                setStudentName(studentProfile?.name || '');
                setStudentBirthday(studentProfile?.birthday ? studentProfile.birthday.toDate() : null);
                setStudentGender((studentProfile?.gender as Gender) || '');
                setShowEditStudent(true);
              }}
              style={styles.editButton}
              activeOpacity={0.7}
            >
              <Ionicons name="create-outline" size={18} color={theme.colors.primary[600]} />
              <Body size="medium" style={styles.editButtonText}>
                Edit
              </Body>
            </TouchableOpacity>
          </View>
          <Card variant="elevated" padding="medium" style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <Ionicons name="person-outline" size={18} color={theme.colors.gray[500]} style={styles.infoIcon} />
                <Body size="small" style={styles.infoLabel}>Name</Body>
              </View>
              <Body size="medium" style={styles.infoValue}>
                {studentProfile?.name || 'N/A'}
              </Body>
            </View>
            <View style={[styles.infoRow, styles.infoRowBorder]}>
              <View style={styles.infoLabelContainer}>
                <Ionicons name="calendar-outline" size={18} color={theme.colors.gray[500]} style={styles.infoIcon} />
                <Body size="small" style={styles.infoLabel}>Birthday</Body>
              </View>
              <Body size="medium" style={styles.infoValue}>
                {formatBirthday(studentProfile?.birthday)}
              </Body>
            </View>
            <View style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <Ionicons name="people-outline" size={18} color={theme.colors.gray[500]} style={styles.infoIcon} />
                <Body size="small" style={styles.infoLabel}>Gender</Body>
              </View>
              <Body size="medium" style={styles.infoValue}>
                {studentProfile?.gender
                  ? studentProfile.gender.charAt(0).toUpperCase() + studentProfile.gender.slice(1)
                  : 'N/A'}
              </Body>
            </View>
          </Card>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <TouchableOpacity 
            onPress={handleLogout} 
            style={styles.logoutButton}
            activeOpacity={0.7}
          >
            <Card variant="outlined" padding="medium" style={styles.logoutCard}>
              <View style={styles.logoutContent}>
                <View style={styles.logoutIconContainer}>
                  <Ionicons name="log-out-outline" size={22} color={theme.colors.error[600]} />
                </View>
                <Body size="medium" style={styles.logoutText}>
                  Logout
                </Body>
              </View>
            </Card>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Student Modal */}
      <Modal
        visible={showEditStudent}
        animationType="slide"
        transparent
        onRequestClose={() => setShowEditStudent(false)}
      >
        <View style={styles.modalContainer}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalKeyboardView}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleContainer}>
                  <View style={styles.modalIconContainer}>
                    <Ionicons name="create-outline" size={24} color={theme.colors.primary[600]} />
                  </View>
                  <Heading level="h4" style={{ color: theme.colors.text.primary }}>
                    Edit Student Profile
                  </Heading>
                </View>
                <TouchableOpacity 
                  onPress={() => setShowEditStudent(false)}
                  style={styles.modalCloseButton}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={28} color={theme.colors.gray[700]} />
                </TouchableOpacity>
              </View>

              <ScrollView 
                style={styles.modalScroll}
                contentContainerStyle={styles.modalScrollContent}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
              >
                <Input
                  label="Student Name"
                  placeholder="Enter student's name"
                  value={studentName}
                  onChangeText={setStudentName}
                  autoCapitalize="words"
                />

                <DatePicker
                  label="Student Birthday"
                  value={studentBirthday}
                  onChange={setStudentBirthday}
                  maximumDate={maxDate}
                  placeholder="Select birthday"
                />

                <View style={styles.genderContainer}>
                  <Text style={styles.genderLabel}>Gender</Text>
                  <TouchableOpacity
                    style={styles.genderButton}
                    onPress={() => setShowGenderPicker(true)}
                  >
                    <Text style={[styles.genderButtonText, !studentGender && styles.genderButtonTextPlaceholder]}>
                      {studentGender
                        ? genderOptions.find((opt) => opt.value === studentGender)?.label
                        : 'Select gender'}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color={theme.colors.gray[500]} />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalButtons}>
                  <View style={{ marginBottom: theme.spacing[3] }}>
                    <Button
                      variant="outline"
                      size="large"
                      onPress={() => setShowEditStudent(false)}
                      fullWidth
                    >
                      Cancel
                    </Button>
                  </View>
                  <Button
                    variant="primary"
                    size="large"
                    onPress={handleEditStudent}
                    loading={loading}
                    disabled={loading}
                    fullWidth
                  >
                    Save Changes
                  </Button>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Gender Picker Modal */}
      <Modal
        visible={showGenderPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGenderPicker(false)}
      >
        <View style={styles.pickerModalContainer}>
          <View style={styles.pickerModalContent}>
            <View style={styles.pickerModalHeader}>
              <Heading level="h4" style={{ color: theme.colors.text.primary }}>
                Select Gender
              </Heading>
              <TouchableOpacity onPress={() => setShowGenderPicker(false)}>
                <Body size="medium" style={{ color: theme.colors.primary[600], fontWeight: '600' }}>
                  Done
                </Body>
              </TouchableOpacity>
            </View>
            {genderOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.genderOption,
                  studentGender === option.value && styles.genderOptionSelected,
                ]}
                onPress={() => {
                  setStudentGender(option.value);
                  setShowGenderPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.genderOptionText,
                    studentGender === option.value && styles.genderOptionTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
      <Modal
  visible={showLogoutModal}
  transparent
  animationType="fade"
  onRequestClose={() => setShowLogoutModal(false)}
>
  <View style={styles.logoutModalOverlay}>
    <View style={styles.logoutModalContainer}>
      
    
      {/* Message */}
      <Text style={styles.logoutMessage}>
        Are you sure you want to logout?
      </Text>

      {/* Buttons */}
      <View style={styles.logoutButtons}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => setShowLogoutModal(false)}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.confirmButton}
          onPress={confirmLogout}
        >
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
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing[10],
    paddingTop: theme.spacing[2],
  },
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
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerSubtitle: {
    color: theme.colors.text.secondary,
    marginTop: 4,
  },
  headerSpacer: {
    width: 40,
  },
  section: {
    marginBottom: theme.spacing[6],
    paddingHorizontal: theme.spacing[6],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.spacing[1],
    marginBottom: theme.spacing[4],
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: theme.spacing[3],
  },
  sectionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionSubtitle: {
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[2],
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.primary[50],
  },
  editButtonText: {
    color: theme.colors.primary[600],
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: theme.colors.background.light,
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing[3],
    minHeight: 48,
  },
  infoLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoIcon: {
    marginRight: theme.spacing[2],
  },
  infoLabel: {
    color: theme.colors.gray[600],
    fontWeight: theme.typography.fontWeight.medium,
  },
  infoValue: {
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium,
    textAlign: 'right',
    flex: 1,
  },
  infoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[200],
  },
  logoutButton: {
    marginTop: theme.spacing[2],
  },
  logoutCard: {
    backgroundColor: theme.colors.background.light,
    borderColor: theme.colors.error[200],
    borderWidth: 1.5,
  },
  logoutContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.error[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    color: theme.colors.error[600],
    marginLeft: theme.spacing[3],
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing[4],
  },
  modalKeyboardView: {
    width: '100%',
  },
  modalContent: {
    backgroundColor: theme.colors.background.light,
    borderRadius: theme.borderRadius['2xl'],
    width: '100%',
    padding: theme.spacing[6],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    maxHeight: Dimensions.get('window').height * 0.85,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing[6],
    paddingBottom: theme.spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[200],
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[3],
    flex: 1,
  },
  modalIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.gray[100],
  },
  modalScroll: {
    height: Dimensions.get('window').height * 0.5,
  },
  modalScrollContent: {
    paddingBottom: theme.spacing[2],
    flexGrow: 1,
  },
  genderContainer: {
    marginBottom: theme.spacing[4],
  },
  genderLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[2],
  },
  genderButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing[4],
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.background.light,
    borderWidth: 1,
    borderColor: theme.colors.gray[300],
  },
  genderButtonText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
  },
  genderButtonTextPlaceholder: {
    color: theme.colors.gray[500],
  },
  modalButtons: {
    marginTop: theme.spacing[4],
  },
  pickerModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing[4],
  },
  pickerModalContent: {
    backgroundColor: theme.colors.background.light,
    borderTopLeftRadius: theme.borderRadius['2xl'],
    borderTopRightRadius: theme.borderRadius['2xl'],
    padding: theme.spacing[6],
    paddingBottom: theme.spacing[8],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  pickerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing[6],
    paddingBottom: theme.spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[200],
  },
  genderOption: {
    padding: theme.spacing[4],
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.gray[50],
    marginBottom: theme.spacing[3],
    borderWidth: 1.5,
    borderColor: theme.colors.gray[200],
  },
  genderOptionSelected: {
    backgroundColor: theme.colors.primary[50],
    borderColor: theme.colors.primary[500],
    borderWidth: 2,
    shadowColor: theme.colors.primary[500],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  genderOptionText: {
    fontSize: theme.typography.fontSize.base,
    textAlign: 'center',
    color: theme.colors.text.primary,
  },
  genderOptionTextSelected: {
    color: theme.colors.primary[700],
    fontWeight: theme.typography.fontWeight.semibold,
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

logoutTitle: {
  fontSize: 18,
  fontWeight: '700',
  color: theme.colors.text.primary,
  marginBottom: theme.spacing[2],
},

logoutMessage: {
  fontSize: 14,
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

cancelText: {
  color: theme.colors.text.primary,
  fontWeight: '600',
},

confirmText: {
  color: '#fff',
  fontWeight: '700',
},
});

