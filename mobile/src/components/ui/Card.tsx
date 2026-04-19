import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { theme } from '../../config/theme';

export interface CardProps extends ViewProps {
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'small' | 'medium' | 'large';
  children: React.ReactNode;
}

/**
 * KidVenture Card Component
 * 
 * @example
 * <Card variant="elevated" padding="medium">
 *   <Text>Card content</Text>
 * </Card>
 */
export const Card: React.FC<CardProps> = ({
  variant = 'default',
  padding = 'medium',
  children,
  style,
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: theme.colors.background.light,
          ...theme.shadows.lg,
          borderWidth: 0.5,
          borderColor: theme.colors.gray[100],
        };
      case 'outlined':
        return {
          backgroundColor: theme.colors.background.light,
          borderWidth: 1.5,
          borderColor: theme.colors.gray[200],
        };
      default:
        return {
          backgroundColor: theme.colors.background.light,
          ...theme.shadows.base,
          borderWidth: 0.5,
          borderColor: theme.colors.gray[100],
        };
    }
  };

  const getPadding = () => {
    switch (padding) {
      case 'none':
        return 0;
      case 'small':
        return theme.spacing[3];
      case 'medium':
        return theme.spacing[4];
      case 'large':
        return theme.spacing[6];
      default:
        return theme.spacing[4];
    }
  };

  return (
    <View
      style={[
        styles.card,
        getVariantStyles(),
        {
          padding: getPadding(),
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.borderRadius['2xl'],
    overflow: 'hidden',
  },
});
