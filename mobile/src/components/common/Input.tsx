import React, { useState } from 'react';
import {
  TextInput,
  TextInputProps,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
}

/**
 * KidVenture Input Component
 * 
 * @example
 * <Input
 *   label="Email"
 *   placeholder="Enter your email"
 *   error={errors.email}
 * />
 */
export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  fullWidth = false,
  rightIcon,
  onRightIconPress,
  onFocus,
  onBlur,
  style,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const getBorderClassName = () => {
    if (error) return 'border-error-500';
    if (isFocused) return 'border-primary-500';
    return 'border-gray-300';
  };

  return (
    <View className={`mb-5 ${fullWidth ? 'w-full' : ''}`}>
      {label && (
        <Text className="text-sm font-medium text-gray-900 mb-2">{label}</Text>
      )}
      <View
        className={`rounded-xl bg-white ${getBorderClassName()} ${isFocused ? 'border-2' : 'border'} ${rightIcon ? 'flex-row items-center' : ''}`}
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: isFocused ? 0.1 : 0.05,
          shadowRadius: 2,
          elevation: isFocused ? 2 : 1,
        }}
      >
        <TextInput
          className={`text-base text-gray-900 py-4 min-h-[60px] ${rightIcon ? 'px-5 flex-1' : 'px-5'}`}
          style={style}
          placeholderTextColor="#9e9e9e"
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
        {rightIcon && (
          <TouchableOpacity
            onPress={onRightIconPress}
            activeOpacity={0.7}
            className="pr-5 justify-center items-center"
            style={{ minHeight: 56 }}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <Text className="text-sm text-error-500 mt-1">{error}</Text>
      )}
      {helperText && !error && (
        <Text className="text-sm text-gray-600 mt-1">{helperText}</Text>
      )}
    </View>
  );
};
