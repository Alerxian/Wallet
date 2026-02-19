import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { radius, spacing, typography } from '../../theme/tokens';
import { useThemePalette } from '../../theme/useThemePalette';

interface EmptyStateProps {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, message, actionLabel, onAction }: EmptyStateProps) {
  const palette = useThemePalette();
  return (
    <View style={[styles.card, { borderColor: palette.border, backgroundColor: palette.card }]}> 
      <View style={[styles.iconWrap, { backgroundColor: palette.successBg }]}> 
        <Ionicons name="layers-outline" size={18} color={palette.primaryStrong} />
      </View>
      <Text style={[styles.title, { color: palette.textPrimary }]}>{title}</Text>
      <Text style={[styles.message, { color: palette.textSecondary }]}>{message}</Text>
      {actionLabel && onAction ? (
        <Pressable style={[styles.button, { backgroundColor: palette.primary }]} onPress={onAction}>
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e3f0e9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.section,
    fontSize: 18,
    color: '#162920',
  },
  message: {
    ...typography.body,
    color: '#4e5f57',
    textAlign: 'center',
  },
  button: {
    borderRadius: radius.full,
    backgroundColor: '#1f5a47',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  buttonText: {
    ...typography.meta,
    color: '#f8f7f2',
  },
});
