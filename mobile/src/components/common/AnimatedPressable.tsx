import React from 'react';
import { Pressable, PressableProps, ViewStyle, StyleProp, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const ReanimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface AnimatedPressableProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  /**
   * Height of the bottom shadow/lip in pixels (default: 5)
   */
  lipHeight?: number;
  /**
   * Amount to translate down when pressed in pixels (default: 4)
   */
  pressOffset?: number;
  /**
   * Background color for the button
   */
  backgroundColor?: string;
  /**
   * Color for the bottom shadow/lip (darker shade)
   */
  shadowColor?: string;
  /**
   * Whether to enable haptic feedback (default: true)
   */
  enableHaptics?: boolean;
  /**
   * Custom className for styling
   */
  className?: string;
  /**
   * Children to render inside the pressable
   */
  children: React.ReactNode;
}

/**
 * AnimatedPressable Component
 * 
 * A pressable component with Duolingo-style 3D flat design.
 * Features a bottom shadow/lip that gets covered when pressed,
 * with smooth spring animations for a "juicy" feel.
 * 
 * @example
 * <AnimatedPressable
 *   backgroundColor="#faa123"
 *   shadowColor="#d6811b"
 *   onPress={handlePress}
 * >
 *   <Text>Press Me</Text>
 * </AnimatedPressable>
 */
export const AnimatedPressable: React.FC<AnimatedPressableProps> = ({
  lipHeight = 5,
  pressOffset = 4,
  backgroundColor,
  shadowColor,
  enableHaptics = true,
  className = '',
  children,
  disabled = false,
  onPress,
  onPressIn,
  onPressOut,
  style,
  ...props
}) => {
  const translateY = useSharedValue(0);
  const isPressed = useSharedValue(false);

  const triggerHaptic = () => {
    if (enableHaptics && !disabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePressIn = (e: any) => {
    if (disabled) return;
    
    isPressed.value = true;
    translateY.value = withSpring(pressOffset, {
      damping: 9,
      stiffness: 120,
      mass: 0.8,
    });
    
    runOnJS(triggerHaptic)();
    onPressIn?.(e);
  };

  const handlePressOut = (e: any) => {
    if (disabled) return;
    
    isPressed.value = false;
    translateY.value = withSpring(0, {
      damping: 9,
      stiffness: 120,
      mass: 0.8,
    });
    
    onPressOut?.(e);
  };

  const handlePress = (e: any) => {
    if (disabled || !onPress) return;
    onPress(e);
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  // Calculate the container height to accommodate the lip
  const containerStyle: ViewStyle = {
    position: 'relative',
    overflow: 'visible',
  };

  // Button style with background
  const buttonStyle: ViewStyle = {
    backgroundColor: backgroundColor || 'transparent',
    position: 'relative',
    zIndex: 2,
  };

  // Shadow/lip style
  const lipStyle: ViewStyle = {
    position: 'absolute',
    bottom: -lipHeight,
    left: 0,
    right: 0,
    height: lipHeight,
    backgroundColor: shadowColor || 'rgba(0, 0, 0, 0.2)',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    zIndex: 1,
  };

  return (
    <ReanimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[containerStyle, style]}
      className={className}
      {...props}
    >
      <Animated.View style={[buttonStyle, animatedStyle]}>
        {children}
      </Animated.View>
      {!disabled && shadowColor && (
        <View style={lipStyle} />
      )}
    </ReanimatedPressable>
  );
};

