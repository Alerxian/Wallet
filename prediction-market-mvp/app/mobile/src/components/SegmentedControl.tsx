import { Pressable, StyleSheet, Text, View } from 'react-native';
import { radius, typography } from '../theme/tokens';
import { useThemePalette } from '../theme/useThemePalette';

interface SegmentedControlProps<T extends string> {
  options: T[];
  value: T;
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({ options, value, onChange }: SegmentedControlProps<T>) {
  const palette = useThemePalette();
  return (
    <View style={[styles.container, { borderColor: palette.border }]}> 
      {options.map((option) => {
        const active = option === value;
        return (
          <Pressable
            key={option}
            style={[styles.item, { backgroundColor: palette.card }, active ? [styles.activeItem, { backgroundColor: palette.primary }] : null]}
            onPress={() => onChange(option)}
          >
            <Text style={[styles.label, { color: palette.textSecondary }, active ? styles.activeLabel : null]}>{option}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#d8ccb9',
    overflow: 'hidden',
  },
  item: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#fdf8f1',
  },
  activeItem: {
    backgroundColor: '#1f5a47',
  },
  label: {
    ...typography.meta,
    color: '#4e5f57',
  },
  activeLabel: {
    color: '#f8fafc',
  },
});
