/**
 * 卡片组件
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, shadows } from '@theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: keyof typeof spacing;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'default',
  padding = 'md',
}) => {
  const cardStyle = [
    styles.base,
    styles[variant],
    { padding: spacing[padding] },
    style,
  ];

  return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  default: {
    ...shadows.small,
  },
  elevated: {
    ...shadows.large,
  },
  outlined: {
    borderWidth: 1,
    borderColor: colors.border,
  },
});
