import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { radius, spacing, typography } from '../../theme/tokens';
import { useThemePalette } from '../../theme/useThemePalette';

interface ButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({ label, onPress, disabled, style }: ButtonProps) {
  const palette = useThemePalette();
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.button,
        { backgroundColor: palette.primary },
        disabled ? styles.disabled : null,
        style,
      ]}
    >
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  disabled: {
    backgroundColor: '#a1a7a3',
  },
  text: {
    ...typography.body,
    fontWeight: '700',
    color: '#faf8f2',
  },
});
