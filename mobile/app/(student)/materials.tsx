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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Heading } from '../../src/components/ui/Heading';
import { Body } from '../../src/components/ui/Body';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/common/Button';
import { theme } from '../../src/config/theme';
import { useAuth } from '../../src/hooks/useAuth';
import { subscribeToMaterialsForClass } from '../../src/services/material.service';
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

export default function StudentMaterialsScreen() {
  const router = useRouter();
  const { userData, user } = useAuth();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  const studentProfile = userData?.role === 'student' ? userData.studentProfile : null;
  const classID = studentProfile?.joinedClassID;

  useEffect(() => {
    if (!classID || !user?.uid) {
      setLoading(false);
      return;
    }
    const unsubscribe = subscribeToMaterialsForClass(classID, (items) => {
      setMaterials(items);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [classID, user?.uid]);

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

  if (!studentProfile) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary[500]} />
        </View>
      </SafeAreaView>
    );
  }

  if (!classID) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
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
                  Join a class to view shared materials.
                </Body>
              </View>
              <View style={styles.headerSpacer} />
            </View>
          </View>
          <Card variant="outlined" padding="large" style={{ marginHorizontal: theme.spacing[6], marginTop: theme.spacing[4] }}>
            <View style={{ alignItems: 'center', gap: theme.spacing[3] }}>
              <Ionicons name="school-outline" size={48} color={theme.colors.gray[400]} />
              <Body size="medium" style={{ color: theme.colors.text.secondary, textAlign: 'center' }}>
                You need to join a class to see materials from your teacher.
              </Body>
              <Button
                variant="primary"
                size="large"
                onPress={() => router.push('/(student)/classroom/join' as any)}
                fullWidth
              >
                Join a Class
              </Button>
            </View>
          </Card>
        </ScrollView>
      </SafeAreaView>
    );
  }

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
                Resources shared by your teacher
              </Body>
            </View>
            <View style={styles.headerSpacer} />
          </View>
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={theme.colors.primary[500]} />
          </View>
        ) : materials.length === 0 ? (
          <Card variant="outlined" padding="large" style={{ marginHorizontal: theme.spacing[6] }}>
            <View style={{ alignItems: 'center', gap: theme.spacing[2] }}>
              <Ionicons name="folder-open-outline" size={48} color={theme.colors.gray[400]} />
              <Heading level="h4" style={{ color: theme.colors.text.primary }}>
                No materials yet
              </Heading>
              <Body size="medium" style={{ color: theme.colors.text.secondary, textAlign: 'center' }}>
                Your teacher hasn't posted materials for this class yet.
              </Body>
            </View>
          </Card>
        ) : (
          <View style={{ gap: theme.spacing[3], paddingHorizontal: theme.spacing[6] }}>
            {materials.map((item) => (
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
              </Card>
            ))}
          </View>
        )}
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing[6],
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
});

