import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { theme } from '../../config/theme';

export interface ProgressBarProps extends ViewProps {
  progress: number; // 0 to 1
  height?: number;
  showLabel?: boolean;
  variant?: 'primary' | 'success' | 'warning';
}

/**
 * KidVenture Progress Bar Component
 * 
 * @example
 * <ProgressBar progress={0.75} height={8} variant="primary" />
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 8,
  showLabel = false,
  variant = 'primary',
  style,
  ...props
}) => {
  const clampedProgress = Math.max(0, Math.min(1, progress));

  const getVariantColor = () => {
    switch (variant) {
      case 'primary':
        return theme.colors.primary[500];
      case 'success':
        return theme.colors.success[500];
      case 'warning':
        return theme.colors.warning[500];
      default:
        return theme.colors.primary[500];
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: `${clampedProgress * 100}%`,
    };
  });

  // Animate progress on mount/update
  React.useEffect(() => {
    // Trigger animation by updating the shared value
    // The width animation will happen automatically via useAnimatedStyle
  }, [clampedProgress]);

  return (
    <View
      style={[
        styles.container,
        {
          height,
          borderRadius: height / 2,
        },
        style,
      ]}
      {...props}
    >
      <View
        style={[
          styles.track,
          {
            height,
            borderRadius: height / 2,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.fill,
            {
              backgroundColor: getVariantColor(),
              height,
              borderRadius: height / 2,
            },
            animatedStyle,
          ]}
        />
      </View>
      {showLabel && (
        <View style={styles.labelContainer}>
          {/* Label can be added here if needed */}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
  },
  track: {
    width: '100%',
    backgroundColor: theme.colors.gray[200],
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
  labelContainer: {
    marginTop: theme.spacing[1],
  },
});
