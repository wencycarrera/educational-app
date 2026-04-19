import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  TouchableOpacityProps,
} from 'react-native';
import * as Haptics from 'expo-haptics';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
export type ButtonSize = 'small' | 'medium' | 'large';

export interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: React.ReactNode;
  fullWidth?: boolean;
}

/**
 * KidVenture Button Component
 * 
 * @example
 * <Button variant="primary" size="large" onPress={handlePress}>
 *   Start Lesson
 * </Button>
 */
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  children,
  fullWidth = false,
  onPress,
  ...props
}) => {
  const handlePress = (e: any) => {
    if (!disabled && !loading && onPress) {
      // Haptic feedback for better UX
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress(e);
    }
  };

  const getVariantClassName = () => {
    if (disabled) {
      return 'bg-gray-300 border-0';
    }
    switch (variant) {
      case 'primary':
        return 'bg-primary-500 border-0';
      case 'secondary':
        return 'bg-[#2196f3] border-0';
      case 'outline':
        return 'bg-transparent border-2 border-primary-500';
      case 'ghost':
        return 'bg-transparent border-0';
      default:
        return 'bg-primary-500 border-0';
    }
  };

  const getSizeClassName = () => {
    switch (size) {
      case 'small':
        return 'py-2 px-4 min-h-[36px]';
      case 'medium':
        return 'py-3 px-6 min-h-[48px]';
      case 'large':
        return 'py-4 px-8 min-h-[56px]';
      default:
        return 'py-3 px-6 min-h-[48px]';
    }
  };

  const getTextColor = () => {
    if (disabled) return '#bdbdbd';
    if (variant === 'outline' || variant === 'ghost') {
      return '#faa123';
    }
    return '#ffffff';
  };

  const getTextSizeClassName = () => {
    switch (size) {
      case 'small':
        return 'text-sm';
      case 'medium':
        return 'text-base';
      case 'large':
        return 'text-lg';
      default:
        return 'text-base';
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      className={`rounded-xl items-center justify-center flex-row ${getVariantClassName()} ${getSizeClassName()} ${fullWidth ? 'w-full' : ''} ${disabled ? 'opacity-60' : ''} shadow-lg`}
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
      }}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={getTextColor()}
        />
      ) : (
        <Text
          className={`text-center font-bold ${getTextSizeClassName()} uppercase tracking-wide`}
          style={{ color: getTextColor() }}
        >
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
};
