import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Badge } from '../ui/Badge';
import { theme } from '../../config/theme';

export interface StarsDisplayProps {
  points: number; // Points to display (renamed from stars)
  size?: 'small' | 'medium' | 'large';
}

/**
 * StarsDisplay Component
 * Displays the child's points in a visually appealing badge
 * Note: Component name kept as StarsDisplay for backward compatibility, but displays points
 */
export const StarsDisplay: React.FC<StarsDisplayProps> = ({
  points,
  size = 'medium',
}) => {
  return (
    <View style={styles.container}>
      <Badge variant="primary" size={size}>
        <View style={styles.starsContent}>
          <Text style={[styles.starIcon, { fontSize: size === 'large' ? 20 : size === 'medium' ? 16 : 14 }]}>
            ⭐
          </Text>
          <Text
            style={[
              styles.starsText,
              {
                fontSize:
                  size === 'large'
                    ? theme.typography.fontSize.base
                    : size === 'medium'
                    ? theme.typography.fontSize.sm
                    : theme.typography.fontSize.xs,
              },
            ]}
          >
            {points.toLocaleString()}
          </Text>
        </View>
      </Badge>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  starsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[1],
  },
  starIcon: {
    lineHeight: 20,
  },
  starsText: {
    fontFamily: theme.typography.fontFamily.bold,
    fontWeight: theme.typography.fontWeight.bold,
  },
});

