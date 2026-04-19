import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getLevelInfo, getLevelEmoji, getLevelName } from '../../utils/leveling';
import { Heading } from '../ui/Heading';
import { Body } from '../ui/Body';
import { theme } from '../../config/theme';

export interface LevelDisplayProps {
  points: number; // Points to calculate level from (renamed from stars)
  level?: number; // Optional: level from Firebase (if provided, uses this instead of calculating)
  size?: 'small' | 'medium' | 'large';
  showProgress?: boolean;
}

/**
 * LevelDisplay Component
 * Displays the student's current level with fun name, emoji, and progress bar
 * If level is provided, uses it directly; otherwise calculates from points (backward compatibility)
 */
export const LevelDisplay: React.FC<LevelDisplayProps> = ({
  points,
  level,
  size = 'medium',
  showProgress = true,
}) => {
  // Calculate level info from points (for progress calculation)
  const levelInfoFromPoints = getLevelInfo(points);
  
  // Use provided level if available, otherwise use calculated level
  const currentLevel = level !== undefined ? level : levelInfoFromPoints.level;
  
  // Get level name and emoji for the current level (may differ from calculated if level is provided)
  const levelName = getLevelName(currentLevel);
  const emoji = getLevelEmoji(currentLevel);
  
  // For progress calculation, always use points-based calculation
  // But if a level is provided and differs from calculated, we still show progress based on points
  const finalLevelInfo = {
    level: currentLevel,
    name: levelName,
    pointsRequired: levelInfoFromPoints.pointsRequired,
    pointsForNextLevel: levelInfoFromPoints.pointsForNextLevel,
    progress: levelInfoFromPoints.progress,
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          badgeSize: 40,
          fontSize: theme.typography.fontSize.sm,
          emojiSize: 16,
        };
      case 'large':
        return {
          badgeSize: 60,
          fontSize: theme.typography.fontSize.lg,
          emojiSize: 24,
        };
      default:
        return {
          badgeSize: 50,
          fontSize: theme.typography.fontSize.base,
          emojiSize: 20,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <View style={styles.container}>
      <View style={styles.levelBadge}>
        <View
          style={[
            styles.badgeCircle,
            {
              width: sizeStyles.badgeSize,
              height: sizeStyles.badgeSize,
              backgroundColor: theme.colors.primary[100],
            },
          ]}
        >
          <Text style={{ fontSize: sizeStyles.emojiSize }}>{emoji}</Text>
        </View>
        <View style={styles.levelInfo}>
          <View className="flex-row items-center gap-1">
            <Body
              size="small"
              style={{
                color: theme.colors.gray[600],
                fontWeight: theme.typography.fontWeight.medium,
              }}
            >
              Level {finalLevelInfo.level}
            </Body>
            <Body
              size="small"
              style={{
                color: theme.colors.primary[700],
                fontWeight: theme.typography.fontWeight.semibold,
                fontSize: sizeStyles.fontSize,
              }}
            >
              {finalLevelInfo.name}
            </Body>
          </View>
          {showProgress && finalLevelInfo.pointsForNextLevel > 0 && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBarBackground}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${finalLevelInfo.progress * 100}%`,
                      backgroundColor: theme.colors.primary[500],
                    },
                  ]}
                />
              </View>
              <Body
                size="small"
                style={{
                  color: theme.colors.gray[600],
                  marginTop: theme.spacing[1],
                  fontSize: theme.typography.fontSize.xs,
                }}
              >
                {Math.ceil(finalLevelInfo.pointsForNextLevel * (1 - finalLevelInfo.progress))} points to next level
              </Body>
            </View>
          )}
          {finalLevelInfo.pointsForNextLevel === 0 && (
            <Body
              size="small"
              style={{
                color: theme.colors.success[600],
                marginTop: theme.spacing[1],
                fontWeight: theme.typography.fontWeight.semibold,
              }}
            >
              Max Level! 🎉
            </Body>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[3],
  },
  badgeCircle: {
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.primary[300],
  },
  levelInfo: {
    flex: 1,
  },
  progressContainer: {
    marginTop: theme.spacing[1],
    width: '100%',
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: theme.colors.gray[200],
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: theme.borderRadius.full,
  },
});

