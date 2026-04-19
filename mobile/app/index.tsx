import React, { useEffect } from 'react';
import {
  View,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { Heading } from '../src/components/ui/Heading';
import { theme } from '../src/config/theme';

const { width } = Dimensions.get('window');

export default function SplashScreen() {
  const logoScale = useSharedValue(0);
  const logoOpacity = useSharedValue(0);

  useEffect(() => {
    // Simple logo entrance animation
    logoScale.value = withSpring(1, {
      damping: 8,
      stiffness: 100,
    });
    logoOpacity.value = withTiming(1, {
      duration: 600,
      easing: Easing.out(Easing.ease),
    });
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  return (
    <View
      className="flex-1 justify-center items-center"
      style={{ backgroundColor: theme.colors.primary[400] }}
    >
      <StatusBar barStyle="light-content" />

      {/* Logo */}
      <Animated.View
        className="justify-center items-center flex-1"
        style={[
          {
            width: width * 0.7,
            height: width * 0.7,
          },
          logoAnimatedStyle,
        ]}
      >
        <Image
          source={require('../assets/images/kidventure-logo.png')}
          className="w-full h-full"
          contentFit="contain"
          transition={300}
        />
      </Animated.View>

      {/* KidVenture Text */}
      <View className="pb-16">
        <Heading level="h1" style={{ color: '#ffffff' }}>
          KidVenture
        </Heading>
      </View>
    </View>
  );
}
