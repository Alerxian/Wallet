import { Animated, StyleSheet, View, ViewStyle } from 'react-native';
import { useEffect, useMemo } from 'react';
import { radius } from '../../theme/tokens';
import { useThemePalette } from '../../theme/useThemePalette';

interface SkeletonProps {
  height?: number;
  width?: number | `${number}%` | 'auto';
  style?: ViewStyle;
}

export function Skeleton({ height = 14, width = '100%', style }: SkeletonProps) {
  const palette = useThemePalette();
  const opacity = useMemo(() => new Animated.Value(0.35), []);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.75,
          duration: 550,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.35,
          duration: 550,
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return <Animated.View style={[styles.block, { height, width, opacity, backgroundColor: palette.border }, style]} />;
}

const styles = StyleSheet.create({
  block: {
    borderRadius: radius.sm,
    backgroundColor: '#d8ccb9',
  },
});
