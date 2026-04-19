import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  Easing,
  SharedValue,
} from 'react-native-reanimated';
import { theme } from '../config/theme';

/**
 * Animation Utilities for KidVenture
 * Reusable animation configurations using react-native-reanimated
 */

// Animation durations from theme
export const ANIMATION_DURATION = {
  fast: theme.animations.duration.fast,
  base: theme.animations.duration.base,
  slow: theme.animations.duration.slow,
  slower: theme.animations.duration.slower,
} as const;

// Easing functions
export const EASING = {
  linear: Easing.linear,
  easeIn: Easing.in(Easing.ease),
  easeOut: Easing.out(Easing.ease),
  easeInOut: Easing.inOut(Easing.ease),
  bounce: Easing.bounce,
  elastic: Easing.elastic(1),
} as const;

/**
 * Fade animation - fade in/out
 */
export const useFadeAnimation = (initialOpacity: number = 0) => {
  const opacity = useSharedValue(initialOpacity);

  const fadeIn = (duration: number = ANIMATION_DURATION.base) => {
    opacity.value = withTiming(1, {
      duration,
      easing: EASING.easeOut,
    });
  };

  const fadeOut = (duration: number = ANIMATION_DURATION.base) => {
    opacity.value = withTiming(0, {
      duration,
      easing: EASING.easeIn,
    });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return { fadeIn, fadeOut, animatedStyle, opacity };
};

/**
 * Slide animation - slide in/out from direction
 */
export const useSlideAnimation = (
  initialPosition: number = -100,
  direction: 'up' | 'down' | 'left' | 'right' = 'up'
) => {
  const translateX = useSharedValue(direction === 'left' ? initialPosition : direction === 'right' ? -initialPosition : 0);
  const translateY = useSharedValue(direction === 'up' ? initialPosition : direction === 'down' ? -initialPosition : 0);

  const slideIn = (duration: number = ANIMATION_DURATION.base) => {
    translateX.value = withSpring(0, {
      damping: 15,
      stiffness: 150,
    });
    translateY.value = withSpring(0, {
      damping: 15,
      stiffness: 150,
    });
  };

  const slideOut = (duration: number = ANIMATION_DURATION.base) => {
    if (direction === 'left') {
      translateX.value = withTiming(initialPosition, { duration, easing: EASING.easeIn });
    } else if (direction === 'right') {
      translateX.value = withTiming(-initialPosition, { duration, easing: EASING.easeIn });
    } else if (direction === 'up') {
      translateY.value = withTiming(initialPosition, { duration, easing: EASING.easeIn });
    } else {
      translateY.value = withTiming(-initialPosition, { duration, easing: EASING.easeIn });
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  return { slideIn, slideOut, animatedStyle };
};

/**
 * Scale animation - scale in/out
 */
export const useScaleAnimation = (initialScale: number = 0) => {
  const scale = useSharedValue(initialScale);

  const scaleIn = (duration: number = ANIMATION_DURATION.base) => {
    scale.value = withSpring(1, {
      damping: 10,
      stiffness: 100,
    });
  };

  const scaleOut = (duration: number = ANIMATION_DURATION.base) => {
    scale.value = withTiming(initialScale, {
      duration,
      easing: EASING.easeIn,
    });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return { scaleIn, scaleOut, animatedStyle, scale };
};

/**
 * Bounce animation - playful bounce effect
 */
export const useBounceAnimation = () => {
  const scale = useSharedValue(1);

  const bounce = () => {
    scale.value = withSequence(
      withTiming(1.2, {
        duration: ANIMATION_DURATION.fast,
        easing: EASING.easeOut,
      }),
      withSpring(1, {
        damping: 5,
        stiffness: 300,
      })
    );
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return { bounce, animatedStyle };
};

/**
 * Pulse animation - continuous pulse effect
 */
export const usePulseAnimation = () => {
  const scale = useSharedValue(1);

  const startPulse = () => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.1, {
          duration: ANIMATION_DURATION.base,
          easing: EASING.easeInOut,
        }),
        withTiming(1, {
          duration: ANIMATION_DURATION.base,
          easing: EASING.easeInOut,
        })
      ),
      -1,
      false
    );
  };

  const stopPulse = () => {
    scale.value = withTiming(1, {
      duration: ANIMATION_DURATION.fast,
    });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return { startPulse, stopPulse, animatedStyle };
};

/**
 * Shake animation - error/shake effect
 */
export const useShakeAnimation = () => {
  const translateX = useSharedValue(0);

  const shake = () => {
    translateX.value = withSequence(
      withTiming(-10, { duration: ANIMATION_DURATION.fast }),
      withRepeat(
        withSequence(
          withTiming(10, { duration: ANIMATION_DURATION.fast }),
          withTiming(-10, { duration: ANIMATION_DURATION.fast })
        ),
        4,
        false
      ),
      withTiming(0, { duration: ANIMATION_DURATION.fast })
    );
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return { shake, animatedStyle };
};

/**
 * Success celebration animation - scale up with bounce
 */
export const useSuccessAnimation = () => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  const celebrate = () => {
    scale.value = withSequence(
      withTiming(1.3, {
        duration: ANIMATION_DURATION.base,
        easing: EASING.easeOut,
      }),
      withSpring(1, {
        damping: 8,
        stiffness: 200,
      })
    );
    opacity.value = withTiming(1, {
      duration: ANIMATION_DURATION.fast,
    });
  };

  const reset = () => {
    scale.value = withTiming(0, { duration: ANIMATION_DURATION.fast });
    opacity.value = withTiming(0, { duration: ANIMATION_DURATION.fast });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return { celebrate, reset, animatedStyle };
};

/**
 * Helper to create custom animated style from shared value
 */
export const createAnimatedStyle = (
  sharedValue: SharedValue<number>,
  transformType: 'scale' | 'translateX' | 'translateY' | 'rotate' = 'scale'
) => {
  return useAnimatedStyle(() => {
    const transform: any = {};
    switch (transformType) {
      case 'scale':
        transform.scale = sharedValue.value;
        break;
      case 'translateX':
        transform.translateX = sharedValue.value;
        break;
      case 'translateY':
        transform.translateY = sharedValue.value;
        break;
      case 'rotate':
        transform.rotate = `${sharedValue.value}deg`;
        break;
    }
    return { transform: [transform] };
  });
};
