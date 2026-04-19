import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { theme } from '../../config/theme';

export interface LabelProps extends TextProps {
  required?: boolean;
  children: React.ReactNode;
}

/**
 * KidVenture Label Component for Forms
 * 
 * @example
 * <Label required>Email Address</Label>
 */
export const Label: React.FC<LabelProps> = ({
  required = false,
  children,
  style,
  ...props
}) => {
  return (
    <Text
      style={[styles.label, style]}
      {...props}
    >
      {children}
      {required && <Text style={styles.required}> *</Text>}
    </Text>
  );
};

const styles = StyleSheet.create({
  label: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[2],
  },
  required: {
    color: theme.colors.error[500],
  },
});
