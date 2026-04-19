import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { theme } from '../../config/theme';

export type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'h5';

export interface HeadingProps extends TextProps {
  level?: HeadingLevel;
  children: React.ReactNode;
}

/**
 * KidVenture Heading Component
 * 
 * @example
 * <Heading level="h1">Welcome to KidVenture!</Heading>
 */
export const Heading: React.FC<HeadingProps> = ({
  level = 'h1',
  children,
  style,
  ...props
}) => {
  const getFontSize = () => {
    switch (level) {
      case 'h1':
        return theme.typography.fontSize['5xl'];
      case 'h2':
        return theme.typography.fontSize['4xl'];
      case 'h3':
        return theme.typography.fontSize['3xl'];
      case 'h4':
        return theme.typography.fontSize['2xl'];
      case 'h5':
        return theme.typography.fontSize['xl'];
      default:
        return theme.typography.fontSize['3xl'];
    }
  };

  const getFontWeight = () => {
    switch (level) {
      case 'h1':
      case 'h2':
        return theme.typography.fontWeight.semibold;
      case 'h3':
      case 'h4':
      case 'h5':
        return theme.typography.fontWeight.semibold;
      default:
        return theme.typography.fontWeight.semibold;
    }
  };

  const getFontFamily = () => {
    switch (level) {
      case 'h1':
      case 'h2':
        return theme.typography.fontFamily.headingBold;
      case 'h3':
      case 'h4':
      case 'h5':
        return theme.typography.fontFamily.heading;
      default:
        return theme.typography.fontFamily.headingBold;
    }
  };

  return (
    <Text
      style={[
        styles.heading,
        {
          fontSize: getFontSize(),
          fontWeight: getFontWeight(),
          fontFamily: getFontFamily(),
          lineHeight: theme.typography.lineHeight.tight * getFontSize(),
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
  heading: {
    color: theme.colors.text.primary,
  },
});
