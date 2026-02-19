import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { radius, spacing, typography } from '../../theme/tokens';
import { useThemePalette } from '../../theme/useThemePalette';

interface InputProps extends TextInputProps {
  invalid?: boolean;
}

export function Input({ invalid, style, ...props }: InputProps) {
  const palette = useThemePalette();
  return (
    <View
      style={[
        styles.container,
        { borderColor: palette.border, backgroundColor: palette.card },
        invalid ? [styles.invalid, { borderColor: palette.danger }] : null,
      ]}
    >
      <TextInput placeholderTextColor={palette.textMuted} style={[styles.input, { color: palette.textPrimary }, style]} {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
  },
  invalid: {
    borderColor: '#9f1239',
  },
  input: {
    ...typography.body,
    color: '#162920',
    paddingVertical: spacing.md,
  },
});
