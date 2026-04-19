import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Input, InputProps } from './Input';

/**
 * KidVenture Password Input Component
 * 
 * Wraps the Input component with password visibility toggle functionality.
 * Automatically handles security best practices (no auto-capitalize, no auto-correct).
 * 
 * @example
 * <PasswordInput
 *   label="Password"
 *   placeholder="Enter your password"
 *   value={password}
 *   onChangeText={setPassword}
 * />
 */
export const PasswordInput: React.FC<InputProps> = (props) => {
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  return (
    <Input
      {...props}
      // UX: Passwords should never auto-capitalize or auto-correct
      autoCapitalize="none"
      autoCorrect={false}
      // Logic: If visible is true, secure is false (and vice versa)
      secureTextEntry={!isVisible}
      rightIcon={
        <Ionicons
          name={isVisible ? 'eye-off' : 'eye'}
          size={22}
          color="#9CA3AF"
        />
      }
      onRightIconPress={toggleVisibility}
    />
  );
};

