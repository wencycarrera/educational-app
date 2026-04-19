import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../ui/Card';
import { Heading } from '../ui/Heading';
import { Body } from '../ui/Body';
import { ProgressBar } from '../ui/ProgressBar';
import { theme } from '../../config/theme';
import { Timestamp } from 'firebase/firestore';

export interface StudentCardProps {
  studentName: string;
  parentName: string;
  completionRate: number; // 0-100
  lastActivity: Timestamp | null;
  onPress?: () => void;
}

/**
 * Student Card Component
 * Displays student info with progress indicator
 */
export const StudentCard: React.FC<StudentCardProps> = ({
  studentName,
  parentName,
  completionRate,
  lastActivity,
  onPress,
}) => {
  const formatLastActivity = (timestamp: Timestamp | null): string => {
    if (!timestamp) return 'No activity';
    
    const date = timestamp.toDate();
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const getProgressColor = (rate: number): string => {
    if (rate >= 80) return theme.colors.success[500];
    if (rate >= 50) return theme.colors.warning[500];
    return theme.colors.error[500];
  };

  // Helper to convert hex to rgba for gradients
  const hexToRgba = (hex: string, alpha: number): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      const r = parseInt(result[1], 16);
      const g = parseInt(result[2], 16);
      const b = parseInt(result[3], 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return hex;
  };

  const content = (
    <View style={styles.container}>
      <View style={styles.header}>
        <LinearGradient
          colors={[
            hexToRgba(getProgressColor(completionRate), 0.2),
            hexToRgba(getProgressColor(completionRate), 0.08),
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.avatar}
        >
          <View style={[styles.avatarInner, { backgroundColor: hexToRgba(getProgressColor(completionRate), 0.15) }]}>
            <Ionicons
              name="person"
              size={26}
              color={getProgressColor(completionRate)}
            />
          </View>
        </LinearGradient>
        <View style={styles.info}>
          <Heading level="h4" style={styles.studentName}>
            {studentName}
          </Heading>
          <Body size="small" style={styles.parentName}>
            Parent: {parentName}
          </Body>
        </View>
        <View style={styles.chevronContainer}>
          <Ionicons
            name="chevron-forward"
            size={22}
            color={theme.colors.gray[400]}
          />
        </View>
      </View>
      
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <View style={styles.progressLabelContainer}>
            <Ionicons
              name="trending-up"
              size={14}
              color={theme.colors.text.secondary}
            />
            <Body size="small" style={styles.progressLabel}>
              Progress
            </Body>
          </View>
          <View style={[styles.progressBadge, { backgroundColor: hexToRgba(getProgressColor(completionRate), 0.15) }]}>
            <Body size="small" style={[styles.progressValue, { color: getProgressColor(completionRate) }]}>
              {Math.round(completionRate)}%
            </Body>
          </View>
        </View>
        <View style={styles.progressBarContainer}>
          <ProgressBar
            progress={completionRate / 100}
            color={getProgressColor(completionRate)}
            height={10}
          />
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.activityRow}>
          <View style={[styles.activityIconContainer, { backgroundColor: theme.colors.gray[100] }]}>
            <Ionicons
              name="time-outline"
              size={14}
              color={theme.colors.text.secondary}
            />
          </View>
          <Body size="small" style={styles.activityText}>
            {formatLastActivity(lastActivity)}
          </Body>
        </View>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        style={styles.touchable}
      >
        <Card variant="elevated" padding="medium" style={styles.card}>
          {content}
        </Card>
      </TouchableOpacity>
    );
  }

  return (
    <Card variant="elevated" padding="medium" style={styles.card}>
      {content}
    </Card>
  );
};

const styles = StyleSheet.create({
  touchable: {
    marginBottom: theme.spacing[3],
  },
  card: {
    marginBottom: 0,
  },
  container: {
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing[4],
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing[3],
    overflow: 'hidden',
  },
  avatarInner: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
  },
  studentName: {
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
    fontWeight: theme.typography.fontWeight.semibold,
  },
  parentName: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.sm,
  },
  chevronContainer: {
    padding: theme.spacing[1],
  },
  progressSection: {
    marginBottom: theme.spacing[4],
    paddingTop: theme.spacing[3],
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray[100],
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing[3],
  },
  progressLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[1],
  },
  progressLabel: {
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  progressBadge: {
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[1],
    borderRadius: theme.borderRadius.full,
  },
  progressValue: {
    fontWeight: theme.typography.fontWeight.bold,
    fontSize: theme.typography.fontSize.sm,
  },
  progressBarContainer: {
    marginTop: theme.spacing[1],
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: theme.spacing[2],
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray[100],
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[2],
  },
  activityIconContainer: {
    width: 24,
    height: 24,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.sm,
  },
});

