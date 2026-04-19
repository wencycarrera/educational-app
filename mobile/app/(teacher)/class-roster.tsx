import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/hooks/useAuth';
import { Heading } from '../../src/components/ui/Heading';
import { Body } from '../../src/components/ui/Body';
import { StudentCard } from '../../src/components/teacher/StudentCard';
import { Card } from '../../src/components/ui/Card';
import { theme } from '../../src/config/theme';
import { getStudentsByClass, StudentInfo, getClassroomsByTeacher } from '../../src/services/classroom.service';
import { getStudentProgressSummary } from '../../src/services/progress.service';
import { getClassroomById } from '../../src/services/classroom.service';

export default function ClassRosterScreen() {
  const router = useRouter();
  const { user, userData } = useAuth();
  const params = useLocalSearchParams<{ classID?: string }>();
  const [classID, setClassID] = useState<string | null>(params.classID || null);

  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [studentProgress, setStudentProgress] = useState<
    Record<string, { completionRate: number; lastActivity: any }>
  >({});
  const [classroomName, setClassroomName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // If no classID in params, get the first classroom
    if (!classID && user && userData && userData.role === 'teacher') {
      const fetchFirstClassroom = async () => {
        try {
          const classrooms = await getClassroomsByTeacher(user.uid);
          if (classrooms.length > 0) {
            setClassID(classrooms[0].id);
          }
        } catch (error) {
          console.error('Error fetching classrooms:', error);
        }
      };
      fetchFirstClassroom();
    } else if (classID) {
      fetchRosterData();
    }
  }, [classID, user, userData]);

  useEffect(() => {
    if (classID) {
      fetchRosterData();
    }
  }, [classID]);

  const fetchRosterData = async () => {
    if (!classID) return;

    try {
      setLoading(true);

      // Fetch classroom info
      const classroom = await getClassroomById(classID);
      if (classroom) {
        setClassroomName(classroom.className);
      }

      // Fetch students
      const classStudents = await getStudentsByClass(classID);
      setStudents(classStudents);

      // Fetch progress for each student
      const progressMap: Record<string, { completionRate: number; lastActivity: any }> = {};
      
      for (const student of classStudents) {
        try {
          const summary = await getStudentProgressSummary(
            student.studentID,
            student.studentName,
            classID
          );
          progressMap[student.studentID] = {
            completionRate: summary.completionRate,
            lastActivity: summary.lastActivity,
          };
        } catch (error) {
          console.error(`Error fetching progress for ${student.studentName}:`, error);
          progressMap[student.studentID] = {
            completionRate: 0,
            lastActivity: null,
          };
        }
      }

      setStudentProgress(progressMap);
    } catch (error) {
      console.error('Error fetching roster data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRosterData();
    setRefreshing(false);
  };

  const handleStudentPress = (student: StudentInfo) => {
    router.push({
      pathname: '/(teacher)/student-progress',
      params: {
        studentID: student.studentID,
        studentName: student.studentName,
        classID: classID || '',
      },
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary[500]} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary[500]}
            colors={[theme.colors.primary[500]]}
          />
        }
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
                Class Roster
              </Heading>
              {classroomName && (
                <Body size="small" style={{ color: theme.colors.text.secondary, marginTop: 4 }}>
                  {classroomName}
                </Body>
              )}
            </View>
            <View style={styles.headerSpacer} />
          </View>
        </View>
        {/* Content */}
        <View style={styles.contentSection}>
          {!classID ? (
            <View style={styles.emptyState}>
              <Ionicons
                name="school-outline"
                size={64}
                color={theme.colors.gray[400]}
              />
              <Heading level="h4" style={styles.emptyTitle}>
                No Classroom Selected
              </Heading>
              <Body size="medium" style={styles.emptyText}>
                Please select a classroom from the dashboard.
              </Body>
            </View>
          ) : students.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons
                name="people-outline"
                size={64}
                color={theme.colors.gray[400]}
              />
              <Heading level="h4" style={styles.emptyTitle}>
                No Students Yet
              </Heading>
              <Body size="medium" style={styles.emptyText}>
                Students will appear here once they join your class.
              </Body>
            </View>
          ) : (
            <View style={styles.studentsList}>
              {students.map((student) => {
                const progress = studentProgress[student.studentID] || {
                  completionRate: 0,
                  lastActivity: null,
                };

                return (
                  <StudentCard
                    key={student.studentID}
                    studentName={student.studentName}
                    parentName={student.parentName}
                    completionRate={progress.completionRate}
                    lastActivity={progress.lastActivity}
                    onPress={() => handleStudentPress(student)}
                  />
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing[8],
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
  headerSpacer: {
    width: 40,
  },
  contentSection: {
    paddingHorizontal: theme.spacing[6],
  },
  studentsList: {
    gap: theme.spacing[3],
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing[12],
    paddingHorizontal: theme.spacing[6],
  },
  emptyTitle: {
    color: theme.colors.text.primary,
    marginTop: theme.spacing[4],
    marginBottom: theme.spacing[2],
  },
  emptyText: {
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
});

