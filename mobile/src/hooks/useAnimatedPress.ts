import { useCallback } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

export interface UseAnimatedPressOptions {
  /**
   * Amount to translate down when pressed in pixels (default: 4)
   */
  pressOffset?: number;
  /**
   * Whether to enable haptic feedback (default: true)
   */
  enableHaptics?: boolean;
  /**
   * Spring animation damping (default: 9)
   */
  damping?: number;
  /**
   * Spring animation stiffness (default: 120)
   */
  stiffness?: number;
  /**
   * Spring animation mass (default: 0.8)
   */
  mass?: number;
}

export interface UseAnimatedPressReturn {
  /**
   * Animated style to apply to the pressable component
   */
  animatedStyle: ReturnType<typeof useAnimatedStyle>;
  /**
   * Handler for onPressIn event
   */
  handlePressIn: (e?: any) => void;
  /**
   * Handler for onPressOut event
   */
  handlePressOut: (e?: any) => void;
  /**
   * Current pressed state
   */
  isPressed: { value: boolean };
}

/**
 * useAnimatedPress Hook
 * 
 * Provides animated press handlers for creating Duolingo-style 3D button effects.
 * Can be used with any Pressable or TouchableOpacity component.
 * 
 * @example
 * const { animatedStyle, handlePressIn, handlePressOut } = useAnimatedPress({
 *   pressOffset: 4,
 *   enableHaptics: true,
 * });
 * 
 * <Animated.View style={animatedStyle}>
 *   <Pressable
 *     onPressIn={handlePressIn}
 *     onPressOut={handlePressOut}
 *   >
 *     <Text>Press Me</Text>
 *   </Pressable>
 * </Animated.View>
 */
export const useAnimatedPress = (
  options: UseAnimatedPressOptions = {}
): UseAnimatedPressReturn => {
  const {
    pressOffset = 4,
    enableHaptics = true,
    damping = 9,
    stiffness = 120,
    mass = 0.8,
  } = options;

  const translateY = useSharedValue(0);
  const isPressed = useSharedValue(false);

  const triggerHaptic = useCallback(() => {
    if (enableHaptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [enableHaptics]);

  const handlePressIn = useCallback(
    (e?: any) => {
      isPressed.value = true;
      translateY.value = withSpring(pressOffset, {
        damping,
        stiffness,
        mass,
      });
      runOnJS(triggerHaptic)();
    },
    [pressOffset, damping, stiffness, mass, triggerHaptic]
  );

  const handlePressOut = useCallback(
    (e?: any) => {
      isPressed.value = false;
      translateY.value = withSpring(0, {
        damping,
        stiffness,
        mass,
      });
    },
    [damping, stiffness, mass]
  );

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  return {
    animatedStyle,
    handlePressIn,
    handlePressOut,
    isPressed,
  };
};

