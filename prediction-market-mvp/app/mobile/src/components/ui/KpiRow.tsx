import { StyleSheet, Text, View } from 'react-native';
import { radius, spacing, typography } from '../../theme/tokens';
import { useThemePalette } from '../../theme/useThemePalette';

interface KpiItem {
  label: string;
  value: string;
}

export function KpiRow({ items }: { items: KpiItem[] }) {
  const palette = useThemePalette();
  return (
    <View style={styles.row}>
      {items.map((item) => (
        <View style={[styles.box, { borderColor: palette.border, backgroundColor: palette.bgElevated }]} key={item.label}>
          <Text style={[styles.value, { color: palette.textPrimary }]}>{item.value}</Text>
          <Text style={[styles.label, { color: palette.textMuted }]}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  box: {
    flex: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  value: {
    ...typography.section,
    fontSize: 18,
    color: '#162920',
  },
  label: {
    ...typography.meta,
    color: '#7b847f',
  },
});
