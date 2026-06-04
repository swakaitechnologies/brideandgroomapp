import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, ViewStyle, useColorScheme, DimensionValue } from 'react-native';

interface SkeletonProps {
  width: DimensionValue;
  height: DimensionValue;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height,
  borderRadius = 8,
  style,
}) => {
  const isDark = useColorScheme() === 'dark';
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  // Use smooth dark-mode and light-mode background colors matching React Native themes
  const skeletonColor = isDark ? '#2C2C2E' : '#E5E5EA';

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          opacity,
          backgroundColor: skeletonColor,
        },
        style,
      ]}
    />
  );
};
