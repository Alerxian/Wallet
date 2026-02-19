import { StyleSheet, Text, View } from 'react-native';
import { radius, typography } from '../../theme/tokens';
import { useThemePalette } from '../../theme/useThemePalette';

interface PoolBarProps {
  yes: number;
  no: number;
}

export function PoolBar({ yes, no }: PoolBarProps) {
  const palette = useThemePalette();
  const total = yes + no;
  const yesPct = total === 0 ? 50 : Math.round((yes / total) * 100);
  const noPct = 100 - yesPct;

  return (
    <View style={styles.wrap}>
      <View style={[styles.track, { borderColor: palette.border }]}> 
        <View style={[styles.yes, { flex: yesPct }]} />
        <View style={[styles.no, { flex: noPct }]} />
      </View>
      <View style={styles.labels}>
        <Text style={[styles.yesLabel, { color: palette.primaryStrong }]}>YES {yesPct}%</Text>
        <Text style={[styles.noLabel, { color: palette.accent }]}>NO {noPct}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 6,
  },
  track: {
    height: 14,
    borderRadius: radius.full,
    overflow: 'hidden',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#d8ccb9',
  },
  yes: {
    backgroundColor: '#2f7a62',
  },
  no: {
    backgroundColor: '#b3702f',
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  yesLabel: {
    ...typography.meta,
    color: '#215746',
  },
  noLabel: {
    ...typography.meta,
    color: '#7a4a1d',
  },
});
