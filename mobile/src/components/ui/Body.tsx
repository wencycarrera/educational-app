import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { theme } from '../../config/theme';

export type BodySize = 'small' | 'medium' | 'large';

export interface BodyProps extends TextProps {
  size?: BodySize;
  children: React.ReactNode;
}

/**
 * KidVenture Body Text Component
 * 
 * @example
 * <Body size="medium">This is body text for children to read.</Body>
 */
export const Body: React.FC<BodyProps> = ({
  size = 'medium',
  children,
  style,
  ...props
}) => {
  const getFontSize = () => {
    switch (size) {
      case 'small':
        return theme.typography.fontSize.sm;
      case 'medium':
        return theme.typography.fontSize.base;
      case 'large':
        return theme.typography.fontSize.lg;
      default:
        return theme.typography.fontSize.base;
    }
  };

  return (
    <Text
      style={[
        styles.body,
        {
          fontSize: getFontSize(),
          fontFamily: theme.typography.fontFamily.regular,
          lineHeight: theme.typography.lineHeight.normal * getFontSize(),
        },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  body: {
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.regular,
  },
});
