import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../ui/Card';
import { Heading } from '../ui/Heading';
import { Body } from '../ui/Body';
import { theme } from '../../config/theme';

export interface StatsCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string | number;
  color?: string;
}

/**
 * Stats Card Component
 * Displays a statistic with icon, label, and value
 */
export const StatsCard: React.FC<StatsCardProps> = ({
  icon,
  label,
  value,
  color = theme.colors.primary[500],
}) => {
  // Create gradient colors from the provided color
  const getGradientColors = (baseColor: string) => {
    // Use rgba format for proper gradient
    // Extract RGB values if it's a hex color
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
          }
        : null;
    };

    const rgb = hexToRgb(baseColor);
    if (rgb) {
      return [
        `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2)`,
        `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.05)`,
      ];
    }
    // Fallback for non-hex colors
    return [`${baseColor}33`, `${baseColor}0D`];
  };

  return (
    <Card variant="elevated" padding="medium" style={styles.card}>
      <View style={styles.container}>
        <LinearGradient
          colors={getGradientColors(color)}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconContainer}
        >
          <View style={[styles.iconInner, { backgroundColor: `${color}15` }]}>
            <Ionicons name={icon} size={26} color={color} />
          </View>
        </LinearGradient>
        <View style={styles.content}>
          <Body size="small" style={styles.label}>
            {label}
          </Body>
          <Heading level="h3" style={[styles.value, { color }]}>
            {value}
          </Heading>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '47%',
    marginBottom: theme.spacing[3],
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing[3],
    overflow: 'hidden',
  },
  iconInner: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  label: {
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[2],
    fontWeight: theme.typography.fontWeight.medium,
    letterSpacing: 0.3,
  },
  value: {
    fontSize: theme.typography.fontSize['3xl'],
    fontWeight: theme.typography.fontWeight.bold,
    letterSpacing: -0.5,
  },
});

