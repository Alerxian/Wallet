import { Ionicons } from '@expo/vector-icons';
import { useRef } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Chip } from '../components/ui/Chip';
import { useAppStore } from '../store/appStore';
import { getThemePalette, spacing, typography } from '../theme/tokens';

interface ToggleRowProps {
  title: string;
  hint: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  palette: ReturnType<typeof getThemePalette>;
}

function ToggleRow({ title, hint, value, onValueChange, palette }: ToggleRowProps) {
  return (
    <View style={[styles.toggleRow, { borderColor: palette.border, backgroundColor: palette.bgElevated }]}> 
      <View style={styles.toggleTextBlock}>
        <Text style={[styles.toggleTitle, { color: palette.textPrimary }]}>{title}</Text>
        <Text style={[styles.toggleHint, { color: palette.textMuted }]}>{hint}</Text>
      </View>
      <Switch value={value} onValueChange={onValueChange} thumbColor={value ? palette.primary : '#c4c9c6'} />
    </View>
  );
}

export function SettingsScreen() {
  const walletConnected = useAppStore((state) => state.walletConnected);
  const network = useAppStore((state) => state.network);
  const diagnostics = useAppStore((state) => state.diagnostics);
  const themeMode = useAppStore((state) => state.themeMode);
  const palette = getThemePalette(themeMode);
  const settings = useAppStore((state) => state.settings);
  const toggleWallet = useAppStore((state) => state.toggleWallet);
  const setNetwork = useAppStore((state) => state.setNetwork);
  const updateSettings = useAppStore((state) => state.updateSettings);
  const requestThemeTransition = useAppStore((state) => state.requestThemeTransition);

  const themeButtonRef = useRef<View | null>(null);

  const handleThemeSwitch = () => {
    themeButtonRef.current?.measureInWindow((x, y, width, height) => {
      requestThemeTransition(x + width / 2, y + height / 2);
    });
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: palette.textPrimary }]}>Settings</Text>
      <Text style={[styles.subtitle, { color: palette.textSecondary }]}>Personalize workspace, connection, and behavior.</Text>

      <Card style={[styles.walletCard, { backgroundColor: palette.bgElevated }]}> 
        <View style={styles.rowTop}>
          <View style={styles.rowLeft}>
            <Ionicons name="wallet-outline" size={18} color={palette.primaryStrong} />
            <Text style={[styles.section, { color: palette.textPrimary }]}>Wallet Session</Text>
          </View>
          <Image source={require('../../assets/icon.png')} style={styles.iconImage} />
        </View>
        <Text style={[styles.meta, { color: palette.textSecondary }]}>Status: {walletConnected ? 'Connected' : 'Disconnected'}</Text>
        <Button label={`${walletConnected ? 'Disconnect' : 'Connect'} Wallet`} onPress={toggleWallet} />
      </Card>

      <Card>
        <View style={styles.rowLeft}>
          <Ionicons name="color-palette-outline" size={18} color={palette.primaryStrong} />
          <Text style={[styles.section, { color: palette.textPrimary }]}>Theme</Text>
        </View>
        <Text style={[styles.meta, { color: palette.textSecondary }]}>Current palette: {themeMode === 'sand' ? 'Market Sand' : 'Night Terminal'}</Text>
        <Pressable ref={themeButtonRef} style={[styles.themeButton, { backgroundColor: palette.primary }]} onPress={handleThemeSwitch}>
          <Ionicons name="radio-button-on-outline" size={16} color="#f8f7f2" />
          <Text style={styles.themeButtonText}>Toggle Theme Ripple</Text>
        </Pressable>
      </Card>

      <Card>
        <View style={styles.rowLeft}>
          <Ionicons name="options-outline" size={18} color={palette.primaryStrong} />
          <Text style={[styles.section, { color: palette.textPrimary }]}>Preferences</Text>
        </View>
        <ToggleRow
          title="Push Notifications"
          hint="Receive market status and fill updates"
          value={settings.notifications}
          onValueChange={(value) => updateSettings({ notifications: value })}
          palette={palette}
        />
        <ToggleRow
          title="Biometric Unlock"
          hint="Require Face ID / fingerprint to access wallet actions"
          value={settings.biometric}
          onValueChange={(value) => updateSettings({ biometric: value })}
          palette={palette}
        />
        <ToggleRow
          title="Reduced Motion"
          hint="Use lighter page transitions and no ripple sequence"
          value={settings.reducedMotion}
          onValueChange={(value) => updateSettings({ reducedMotion: value })}
          palette={palette}
        />
        <ToggleRow
          title="Auto Refresh"
          hint="Keep lists synchronized while app is active"
          value={settings.autoRefresh}
          onValueChange={(value) => updateSettings({ autoRefresh: value })}
          palette={palette}
        />
      </Card>

      <Card>
        <View style={styles.rowLeft}>
          <Ionicons name="git-network-outline" size={18} color={palette.primaryStrong} />
          <Text style={[styles.section, { color: palette.textPrimary }]}>Network & Locale</Text>
        </View>
        <Text style={[styles.meta, { color: palette.textSecondary }]}>Current network id: {network}</Text>
        <View style={styles.chipRow}>
          <Chip label="31337 (local)" active={network === '31337'} onPress={() => setNetwork('31337')} />
          <Chip label="1 (mainnet)" active={network === '1'} onPress={() => setNetwork('1')} />
        </View>

        <Text style={[styles.metaLabel, { color: palette.textSecondary }]}>Currency</Text>
        <View style={styles.chipRow}>
          <Chip
            label="USDC"
            active={settings.currency === 'USDC'}
            onPress={() => updateSettings({ currency: 'USDC' })}
          />
          <Chip
            label="USD"
            active={settings.currency === 'USD'}
            onPress={() => updateSettings({ currency: 'USD' })}
          />
        </View>

        <Text style={[styles.metaLabel, { color: palette.textSecondary }]}>Language</Text>
        <View style={styles.chipRow}>
          <Chip label="English" active={settings.language === 'EN'} onPress={() => updateSettings({ language: 'EN' })} />
          <Chip label="中文" active={settings.language === 'ZH'} onPress={() => updateSettings({ language: 'ZH' })} />
        </View>
      </Card>

      <Card>
        <View style={styles.rowLeft}>
          <Ionicons name="hardware-chip-outline" size={18} color={palette.primaryStrong} />
          <Text style={[styles.section, { color: palette.textPrimary }]}>Diagnostics</Text>
        </View>
        {diagnostics.length === 0 ? <Text style={[styles.meta, { color: palette.textSecondary }]}>No recent logs.</Text> : null}
        {diagnostics.map((line) => (
          <Pressable key={line} style={[styles.logRow, { borderColor: palette.border, backgroundColor: palette.bgElevated }]}>
            <Ionicons name="document-text-outline" size={14} color={palette.textMuted} />
            <Text style={[styles.log, { color: palette.textMuted }]} numberOfLines={1}>{line}</Text>
          </Pressable>
        ))}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: 110,
  },
  title: {
    ...typography.display,
    color: '#162920',
    fontSize: 28,
  },
  subtitle: {
    ...typography.body,
    color: '#4e5f57',
  },
  walletCard: {
    backgroundColor: '#ecf1ea',
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  section: {
    ...typography.section,
    color: '#162920',
    fontSize: 18,
  },
  iconImage: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },
  meta: {
    ...typography.body,
    color: '#4e5f57',
  },
  themeButton: {
    borderRadius: 12,
    backgroundColor: '#1f5a47',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  themeButtonText: {
    ...typography.meta,
    color: '#f8f7f2',
  },
  toggleRow: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d8ccb9',
    backgroundColor: '#f8f4ec',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  toggleTextBlock: {
    flex: 1,
    gap: 2,
  },
  toggleTitle: {
    ...typography.body,
    color: '#162920',
    fontWeight: '600',
  },
  toggleHint: {
    ...typography.meta,
    color: '#7b847f',
  },
  chipRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  metaLabel: {
    ...typography.meta,
    color: '#4e5f57',
    marginTop: 4,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d8ccb9',
    backgroundColor: '#f8f4ec',
    paddingHorizontal: 8,
    paddingVertical: 7,
  },
  log: {
    ...typography.meta,
    color: '#7b847f',
    flex: 1,
  },
});
