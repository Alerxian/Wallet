import { StyleSheet, Text, View } from 'react-native';
import { radius, typography } from '../theme/tokens';
import { useThemePalette } from '../theme/useThemePalette';

const palette: Record<string, { fg: string; bg: string }> = {
  OPEN: { fg: '#0f6d44', bg: '#d7f2e5' },
  CLOSED: { fg: '#8a5c1b', bg: '#f9eccf' },
  RESOLVED: { fg: '#1f4f8a', bg: '#dcecff' },
  PENDING: { fg: '#8a5c1b', bg: '#f9eccf' },
  CONFIRMED: { fg: '#0f6d44', bg: '#d7f2e5' },
  INDEXED: { fg: '#1f4f8a', bg: '#dcecff' },
  FAILED: { fg: '#7f1d1d', bg: '#fee2e2' },
};

export function StatusPill({ label }: { label: string }) {
  const paletteTheme = useThemePalette();
  const item = palette[label] ?? { fg: '#334155', bg: '#e2e8f0' };
  return (
    <View style={[styles.container, { backgroundColor: item.bg, borderColor: paletteTheme.border }]}> 
      <Text style={[styles.text, { color: item.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.full,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#d8ccb9',
  },
  text: {
    ...typography.meta,
    fontSize: 11,
  },
});
