import { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { radius, spacing } from '../../theme/tokens';
import { useThemePalette } from '../../theme/useThemePalette';

interface CardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Card({ children, style }: CardProps) {
  const palette = useThemePalette();
  return <View style={[styles.card, { borderColor: palette.border, backgroundColor: palette.card }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
    shadowColor: '#59451f',
    shadowOpacity: 0.07,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
});
