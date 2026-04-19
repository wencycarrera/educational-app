import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Linking,
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
import {
  getNotifications,
  markNotificationAsRead,
  markAllAsRead,
  subscribeToNotifications,
  Notification,
} from '../../src/services/notification.service';

const formatDate = (timestamp: any) => {
  if (!timestamp) return 'N/A';
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return 'N/A';
  }
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const recipientID = user?.uid || '';

  const fetchNotifications = useCallback(async () => {
    if (!recipientID) {
      setLoading(false);
      return;
    }

    try {
      const notifs = await getNotifications(recipientID);
      setNotifications(notifs);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [recipientID]);

  useEffect(() => {
    fetchNotifications();

    // Subscribe to real-time updates
    if (recipientID) {
      const unsubscribe = subscribeToNotifications(recipientID, (notifs) => {
        setNotifications(notifs);
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, [recipientID, fetchNotifications]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    await handleMarkAsRead(notification.id);

    const data = notification.data || {};

    // Navigate to activity or content based on available IDs
    if (data.moduleID) {
      router.push({
        pathname: '/(student)/lessons/play',
        params: { moduleId: String(data.moduleID) },
      });
      return;
    }

    if (data.subLessonID) {
      router.push({
        pathname: '/(student)/lessons/sub-lesson/[id]',
        params: {
          id: String(data.subLessonID),
          topicId: data.topicCategory ? String(data.topicCategory) : undefined,
        },
      });
      return;
    }

    if (data.topicCategory) {
      router.push({
        pathname: '/(student)/lessons/[id]',
        params: { id: String(data.topicCategory) },
      });
      return;
    }

    if (notification.type === 'material_post') {
      if (data.link && typeof data.link === 'string') {
        try {
          const supported = await Linking.canOpenURL(data.link);
          if (supported) {
            await Linking.openURL(data.link);
            return;
          }
        } catch (err) {
          console.warn('Failed to open material link', err);
        }
      }

      router.push('/(student)/materials' as any);
      return;
    }

    Alert.alert('Navigation unavailable', 'This notification has no target to open.');
  };

  const handleMarkAllAsRead = async () => {
    if (!recipientID) return;
    try {
      setMarkingAll(true);
      await markAllAsRead(recipientID);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    } finally {
      setMarkingAll(false);
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'lesson_post':
        return 'book-outline';
      case 'announcement':
        return 'megaphone-outline';
      case 'reminder':
        return 'time-outline';
      case 'system':
        return 'information-circle-outline';
      default:
        return 'notifications-outline';
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (loading && notifications.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary[500]} />
          <Body size="medium" className="text-gray-600 mt-4">
            Loading notifications...
          </Body>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary[500]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
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
                Notifications
              </Heading>
              <Body size="small" style={{ color: theme.colors.text.secondary, marginTop: 4 }}>
                Stay updated on new activities and materials
              </Body>
            </View>
            <View style={styles.headerSpacer} />
          </View>
          {unreadCount > 0 && (
            <TouchableOpacity
              onPress={handleMarkAllAsRead}
              disabled={markingAll}
              style={styles.markAllButton}
              activeOpacity={0.8}
            >
              <Body size="small" style={{ color: theme.colors.primary[600], fontWeight: '700' }}>
                {markingAll ? 'Marking...' : 'Mark all read'}
              </Body>
            </TouchableOpacity>
          )}
        </View>

        {notifications.length === 0 ? (
          <Card variant="outlined" padding="large" style={styles.emptyCard}>
            <View style={styles.emptyContent}>
              <Ionicons
                name="notifications-off-outline"
                size={64}
                color={theme.colors.gray[400]}
              />
              <Heading level="h4" className="text-center mt-4" style={{ color: theme.colors.text.primary }}>
                No Notifications
              </Heading>
              <Body size="medium" className="text-center mt-2" style={{ color: theme.colors.gray[600] }}>
                You're all caught up!
              </Body>
            </View>
          </Card>
        ) : (
          <View style={styles.notificationsList}>
            {notifications.map((notification) => (
              <TouchableOpacity
                key={notification.id}
                onPress={() => handleNotificationPress(notification)}
                activeOpacity={0.7}
              >
                <Card
                  variant="elevated"
                  padding="medium"
                  style={[
                    styles.notificationCard,
                    !notification.isRead && styles.notificationCardUnread,
                  ]}
                >
                  <View style={styles.notificationContent}>
                    <View
                      style={[
                        styles.iconContainer,
                        !notification.isRead && styles.iconContainerUnread,
                      ]}
                    >
                      <Ionicons
                        name={getNotificationIcon(notification.type) as any}
                        size={24}
                        color={
                          !notification.isRead
                            ? theme.colors.primary[600]
                            : theme.colors.gray[500]
                        }
                      />
                    </View>
                    <View style={styles.notificationText}>
                      <View style={styles.notificationHeader}>
                        <Heading
                          level="h4"
                          style={{
                            color: theme.colors.text.primary,
                            fontWeight: !notification.isRead ? '600' : '400',
                          }}
                        >
                          {notification.title}
                        </Heading>
                        {!notification.isRead && (
                          <View style={styles.unreadDot} />
                        )}
                      </View>
                      <View style={styles.metaRow}>
                        <View style={styles.typePill}>
                          <Body size="small" style={{ color: theme.colors.primary[700], fontWeight: '700' }}>
                            {notification.type.replace('_', ' ')}
                          </Body>
                        </View>
                        <Body size="small" style={{ color: theme.colors.gray[500] }}>
                          {formatDate(notification.createdAt)}
                        </Body>
                      </View>
                      <Body
                        size="small"
                        className="text-gray-600 mt-2"
                        numberOfLines={2}
                      >
                        {notification.message}
                      </Body>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: theme.spacing[4],
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
  markAllButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
    backgroundColor: theme.colors.primary[50],
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.primary[100],
  },
  emptyCard: {
    marginTop: theme.spacing[4],
    marginHorizontal: theme.spacing[6],
  },
  emptyContent: {
    alignItems: 'center',
  },
  notificationsList: {
    gap: theme.spacing[3],
    paddingHorizontal: theme.spacing[6],
    paddingBottom: theme.spacing[8],
  },
  notificationCard: {
    backgroundColor: theme.colors.background.light,
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
  },
  notificationCardUnread: {
    backgroundColor: theme.colors.primary[50],
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary[500],
  },
  notificationContent: {
    flexDirection: 'row',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing[3],
  },
  iconContainerUnread: {
    backgroundColor: theme.colors.primary[100],
  },
  notificationText: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing[1],
  },
  typePill: {
    paddingHorizontal: theme.spacing[2],
    paddingVertical: theme.spacing[1],
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.primary[100],
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary[500],
  },
});

