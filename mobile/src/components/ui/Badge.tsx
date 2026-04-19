import React from 'react';
import { View, Text, StyleSheet, ViewProps } from 'react-native';
import { theme } from '../../config/theme';

export type BadgeVariant = 'primary' | 'success' | 'warning' | 'error' | 'info';
export type BadgeSize = 'small' | 'medium' | 'large';

export interface BadgeProps extends ViewProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: React.ReactNode;
}

/**
 * KidVenture Badge Component for stars, rewards, and labels
 * 
 * @example
 * <Badge variant="primary" size="medium">120 ⭐</Badge>
 */
export const Badge: React.FC<BadgeProps> = ({
  variant = 'primary',
  size = 'medium',
  children,
  style,
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: theme.colors.primary[100],
          borderColor: theme.colors.primary[500],
        };
      case 'success':
        return {
          backgroundColor: theme.colors.success[100],
          borderColor: theme.colors.success[500],
        };
      case 'warning':
        return {
          backgroundColor: theme.colors.warning[100],
          borderColor: theme.colors.warning[500],
        };
      case 'error':
        return {
          backgroundColor: theme.colors.error[100],
          borderColor: theme.colors.error[500],
        };
      case 'info':
        return {
          backgroundColor: theme.colors.info[100],
          borderColor: theme.colors.info[500],
        };
      default:
        return {
          backgroundColor: theme.colors.primary[100],
          borderColor: theme.colors.primary[500],
        };
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'primary':
        return theme.colors.primary[700];
      case 'success':
        return theme.colors.success[700];
      case 'warning':
        return theme.colors.warning[700];
      case 'error':
        return theme.colors.error[700];
      case 'info':
        return theme.colors.info[700];
      default:
        return theme.colors.primary[700];
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: theme.spacing[1],
          paddingHorizontal: theme.spacing[2],
          minHeight: 20,
        };
      case 'medium':
        return {
          paddingVertical: theme.spacing[2],
          paddingHorizontal: theme.spacing[3],
          minHeight: 28,
        };
      case 'large':
        return {
          paddingVertical: theme.spacing[3],
          paddingHorizontal: theme.spacing[4],
          minHeight: 36,
        };
      default:
        return {
          paddingVertical: theme.spacing[2],
          paddingHorizontal: theme.spacing[3],
          minHeight: 28,
        };
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'small':
        return theme.typography.fontSize.xs;
      case 'medium':
        return theme.typography.fontSize.sm;
      case 'large':
        return theme.typography.fontSize.base;
      default:
        return theme.typography.fontSize.sm;
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <View
      style={[
        styles.badge,
        variantStyles,
        sizeStyles,
        {
          borderWidth: 2,
        },
        style,
      ]}
      {...props}
    >
      <Text
        style={[
          styles.text,
          {
            color: getTextColor(),
            fontSize: getFontSize(),
            fontWeight: theme.typography.fontWeight.bold,
          },
        ]}
      >
        {children}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  text: {
    textAlign: 'center',
  },
});
