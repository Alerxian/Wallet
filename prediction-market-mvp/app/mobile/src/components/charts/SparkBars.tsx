import { StyleSheet, View } from 'react-native';
import { useThemePalette } from '../../theme/useThemePalette';

interface SparkBarsProps {
  values: number[];
  tone?: 'green' | 'amber';
}

export function SparkBars({ values, tone = 'green' }: SparkBarsProps) {
  const palette = useThemePalette();
  const max = Math.max(...values, 1);
  const color = tone === 'green' ? palette.primary : palette.accent;

  return (
    <View style={styles.row}>
      {values.map((value, index) => (
        <View key={`${value}-${index}`} style={[styles.bar, { height: 6 + Math.round((value / max) * 22), backgroundColor: color }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    height: 28,
  },
  bar: {
    width: 5,
    borderRadius: 3,
    opacity: 0.85,
  },
});
