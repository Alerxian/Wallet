import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';

export const Atmosphere: React.FC = () => {
  const { theme: colors } = useTheme();

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      <View style={[styles.bubble, styles.bubbleTop, { backgroundColor: colors.primary + '22' }]} />
      <View style={[styles.bubble, styles.bubbleRight, { backgroundColor: colors.accent + '18' }]} />
      <View style={[styles.bubble, styles.bubbleBottom, { backgroundColor: colors.secondary + '20' }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  bubble: {
    position: 'absolute',
    borderRadius: 999,
  },
  bubbleTop: {
    width: 260,
    height: 260,
    top: -120,
    left: -70,
  },
  bubbleRight: {
    width: 220,
    height: 220,
    top: 140,
    right: -90,
  },
  bubbleBottom: {
    width: 300,
    height: 300,
    bottom: -150,
    left: 40,
  },
});
