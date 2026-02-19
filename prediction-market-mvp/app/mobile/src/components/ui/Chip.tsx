import { Pressable, StyleSheet, Text } from 'react-native';
import { radius, spacing, typography } from '../../theme/tokens';
import { useThemePalette } from '../../theme/useThemePalette';

interface ChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
}

export function Chip({ label, active, onPress }: ChipProps) {
  const palette = useThemePalette();
  return (
    <Pressable
      style={[
        styles.base,
        { borderColor: palette.border, backgroundColor: palette.bgElevated },
        active ? [styles.active, { backgroundColor: palette.primary, borderColor: palette.primary }] : null,
      ]}
      onPress={onPress}
    >
      <Text style={[styles.text, { color: palette.textSecondary }, active ? styles.activeText : null]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
  },
  active: {
    backgroundColor: '#1f5a47',
  },
  text: {
    ...typography.meta,
    color: '#4e5f57',
  },
  activeText: {
    color: '#f8f6f2',
  },
});
