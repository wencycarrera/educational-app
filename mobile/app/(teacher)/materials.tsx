import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Heading } from '../../src/components/ui/Heading';
import { Body } from '../../src/components/ui/Body';
import { Card } from '../../src/components/ui/Card';
import { Input } from '../../src/components/common/Input';
import { Button } from '../../src/components/common/Button';
import { theme } from '../../src/config/theme';
import { useAuth } from '../../src/hooks/useAuth';
import { Classroom, getClassroomsByTeacher } from '../../src/services/classroom.service';
import {
  createMaterial,
  subscribeToMaterialsForClass,
} from '../../src/services/material.service';
import { Material } from '../../src/types/material';

function formatDate(ts?: any) {
  try {
    if (!ts) return '';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleDateString();
  } catch {
    return '';
  }
}

export default function TeacherMaterialsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user, userData } = useAuth();
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [link, setLink] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const loadClassroom = async () => {
      if (!user?.uid || userData?.role !== 'teacher') return;
      try {
        setLoadingClasses(true);
        const list = await getClassroomsByTeacher(user.uid);
        if (list.length > 0) {
          setClassroom(list[0]); // Teacher can only have one classroom
        }
      } catch (error) {
        console.error('Error loading classroom:', error);
        Alert.alert('Error', 'Could not load classroom.');
      } finally {
        setLoadingClasses(false);
      }
    };
    loadClassroom();
  }, [user?.uid, userData?.role]);

  useEffect(() => {
    if (!classroom?.id) return;
    setLoadingMaterials(true);
    const unsubscribe = subscribeToMaterialsForClass(classroom.id, (items) => {
      setMaterials(items);
      setLoadingMaterials(false);
    });
    return () => unsubscribe();
  }, [classroom?.id]);

  const handleCreate = async () => {
    if (!user || userData?.role !== 'teacher') {
      Alert.alert('Error', 'You must be signed in as a teacher.');
      return;
    }
    if (!classroom) {
      Alert.alert('Error', 'No classroom found. Please create a classroom first.');
      return;
    }
    if (!title.trim()) {
      Alert.alert('Error', 'Title is required.');
      return;
    }
    if (!link.trim()) {
      Alert.alert('Error', 'Link is required.');
      return;
    }

    setSaving(true);
    try {
      await createMaterial({
        title,
        link,
        notes,
        classID: classroom.id,
        classCode: classroom.classCode,
        teacherID: user.uid,
      });

      setTitle('');
      setLink('');
      setNotes('');
      Alert.alert('Success', 'Material posted and students notified.');
    } catch (error) {
      console.error('Error creating material:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to create material.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleOpenLink = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Invalid link', 'Cannot open this link.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open link.');
    }
  };

  const renderMaterialCard = (item: Material) => (
    <Card key={item.id} variant="elevated" padding="medium" style={styles.materialCard}>
      <View style={styles.materialHeader}>
        <View style={{ flex: 1 }}>
          <Heading level="h4" style={{ color: theme.colors.text.primary }}>
            {item.title}
          </Heading>
          {item.notes ? (
            <Body size="small" style={{ color: theme.colors.text.secondary, marginTop: 4 }}>
              {item.notes}
            </Body>
          ) : null}
          <Body size="small" style={{ color: theme.colors.gray[500], marginTop: 6 }}>
            {formatDate(item.createdAt)}
          </Body>
        </View>
        <TouchableOpacity
          onPress={() => handleOpenLink(item.link)}
          activeOpacity={0.8}
          style={styles.openLinkButton}
        >
          <Ionicons name="open-outline" size={20} color={theme.colors.primary[600]} />
          <Body size="small" style={{ color: theme.colors.primary[600], marginLeft: 6 }}>
            Open
          </Body>
        </TouchableOpacity>
      </View>
      {item.classCode ? (
        <View style={styles.tag}>
          <Body size="small" style={{ color: theme.colors.text.secondary }}>
            Code: {item.classCode}
          </Body>
        </View>
      ) : null}
    </Card>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
                Materials
              </Heading>
              <Body size="small" style={styles.headerSubtitle}>
                Share resources via GDrive links with your class
              </Body>
            </View>
            <View style={styles.headerSpacer} />
          </View>
        </View>

        {/* Create material form */}
        <Card variant="elevated" padding="medium" style={[styles.sectionCard, { marginHorizontal: theme.spacing[6], marginBottom: theme.spacing[4] }]}>
          <Heading level="h4" style={{ color: theme.colors.text.primary, marginBottom: 8 }}>
            New Material
          </Heading>
          <Input
            label="Title"
            placeholder="e.g., Counting objects worksheet"
            value={title}
            onChangeText={setTitle}
            autoCapitalize="sentences"
          />
          <Input
            label="GDrive Link"
            placeholder="https://drive.google.com/..."
            value={link}
            onChangeText={setLink}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Input
            label="Notes (optional)"
            placeholder="Add context or instructions"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            style={{ minHeight: 80 }}
          />
          <Button
            variant="primary"
            size="large"
            onPress={handleCreate}
            loading={saving}
            disabled={saving || !classroom}
            fullWidth
          >
            Publish to Class
          </Button>
        </Card>

        {/* Materials list */}
        <Card variant="elevated" padding="medium" style={[styles.sectionCard, { marginHorizontal: theme.spacing[6] }]}>
          <View style={styles.sectionHeader}>
            <Heading level="h4" style={{ color: theme.colors.text.primary }}>
              Materials Posted
            </Heading>
            {loadingMaterials && (
              <ActivityIndicator size="small" color={theme.colors.primary[500]} />
            )}
          </View>
          {classroom ? (
            materials.length === 0 && !loadingMaterials ? (
              <Body size="small" style={{ color: theme.colors.text.secondary }}>
                No materials yet for this class.
              </Body>
            ) : (
              <View style={{ gap: theme.spacing[3] }}>{materials.map(renderMaterialCard)}</View>
            )
          ) : loadingClasses ? (
            <Body size="small" style={{ color: theme.colors.text.secondary }}>
              Loading...
            </Body>
          ) : (
            <Body size="small" style={{ color: theme.colors.text.secondary }}>
              No classroom found. Create one from the dashboard.
            </Body>
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  scrollContent: {
    paddingTop: theme.spacing[2],
    paddingBottom: theme.spacing[10],
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
  sectionCard: {
    backgroundColor: theme.colors.background.light,
    borderColor: theme.colors.gray[200],
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing[3],
  },
  materialCard: {
    borderColor: theme.colors.gray[200],
    borderWidth: 1,
  },
  materialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing[3],
    alignItems: 'flex-start',
  },
  openLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
    backgroundColor: `${theme.colors.primary[100]}`,
    borderRadius: theme.borderRadius.xl,
  },
  tag: {
    marginTop: theme.spacing[2],
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[1],
    backgroundColor: theme.colors.gray[100],
    borderRadius: theme.borderRadius.lg,
    alignSelf: 'flex-start',
  },
});

