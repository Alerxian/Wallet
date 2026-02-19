import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MainTab, useAppStore } from '../store/appStore';
import { getThemePalette, radius, spacing, typography } from '../theme/tokens';

const tabs: MainTab[] = ['MARKETS', 'PORTFOLIO', 'ACTIVITY', 'SETTINGS'];

const icons: Record<MainTab, keyof typeof Ionicons.glyphMap> = {
  MARKETS: 'compass-outline',
  PORTFOLIO: 'wallet-outline',
  ACTIVITY: 'pulse-outline',
  SETTINGS: 'settings-outline',
};

export function TabBar() {
  const insets = useSafeAreaInsets();
  const currentTab = useAppStore((state) => state.currentTab);
  const themeMode = useAppStore((state) => state.themeMode);
  const setCurrentTab = useAppStore((state) => state.setCurrentTab);
  const palette = getThemePalette(themeMode);

  return (
    <View style={[styles.container, { borderTopColor: palette.border, backgroundColor: palette.bgElevated, paddingBottom: Math.max(insets.bottom, 8) }]}>
      {tabs.map((tab) => {
        const active = tab === currentTab;
        return (
          <Pressable
            key={tab}
            style={[styles.item, active ? [styles.activeItem, { backgroundColor: palette.primary }] : null]}
            onPress={() => setCurrentTab(tab)}
          >
            <Ionicons
              name={icons[tab]}
              size={16}
              color={active ? '#fefaf5' : palette.textMuted}
              style={styles.icon}
            />
            <Text style={[styles.label, { color: active ? '#fefaf5' : palette.textMuted }]}>{tab}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
  },
  activeItem: {
    backgroundColor: '#1f5a47',
  },
  icon: {
    marginBottom: 2,
  },
  label: {
    ...typography.meta,
    fontSize: 11,
    color: '#7b847f',
  },
});
