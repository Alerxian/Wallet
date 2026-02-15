/**
 * 设置界面（重设计）
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { MainScreenNavigationProp } from '@/types/navigation.types';
import { typography, spacing, ThemeColors } from '@/theme';
import { useTheme } from '@/theme/ThemeContext';
import { Card } from '@components/common/Card';
import { Atmosphere } from '@components/common/Atmosphere';
import { useSettingsStore } from '@store/settingsStore';
import { BiometricService } from '@/services/BiometricService';

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<MainScreenNavigationProp<'Settings'>>();
  const { theme: colors } = useTheme();
  const styles = createStyles(colors);
  const {
    theme,
    language,
    notificationsEnabled,
    biometricEnabled,
    autoLockMinutes,
    currency,
    setTheme,
    setLanguage,
    setNotificationsEnabled,
    setBiometricEnabled,
    setAutoLockMinutes,
    setCurrency,
  } = useSettingsStore();

  const handleThemeChange = () => {
    Alert.alert('选择主题', '切换应用视觉风格', [
      { text: 'Ocean Light', onPress: () => setTheme('light') },
      { text: 'Ink Night', onPress: () => setTheme('dark') },
      { text: '跟随系统', onPress: () => setTheme('auto') },
      { text: '取消', style: 'cancel' },
    ]);
  };

  const handleLanguageChange = () => {
    Alert.alert('选择语言', '', [
      { text: '中文', onPress: () => setLanguage('zh') },
      { text: 'English', onPress: () => setLanguage('en') },
      { text: '取消', style: 'cancel' },
    ]);
  };

  const handleBiometricToggle = async (value: boolean) => {
    if (value) {
      const isAvailable = await BiometricService.isAvailable();
      if (!isAvailable) {
        Alert.alert('提示', '设备不支持生物识别');
        return;
      }

      const success = await BiometricService.authenticate('启用生物识别');
      if (!success) {
        Alert.alert('错误', '生物识别验证失败');
        return;
      }
    }

    await setBiometricEnabled(value);
  };

  const handleAutoLockChange = () => {
    Alert.alert('自动锁定时间', '', [
      { text: '1 分钟', onPress: () => setAutoLockMinutes(1) },
      { text: '5 分钟', onPress: () => setAutoLockMinutes(5) },
      { text: '15 分钟', onPress: () => setAutoLockMinutes(15) },
      { text: '30 分钟', onPress: () => setAutoLockMinutes(30) },
      { text: '从不', onPress: () => setAutoLockMinutes(0) },
      { text: '取消', style: 'cancel' },
    ]);
  };

  const handleCurrencyChange = () => {
    Alert.alert('计价货币', '', [
      { text: 'USD', onPress: () => setCurrency('USD') },
      { text: 'CNY', onPress: () => setCurrency('CNY') },
      { text: 'EUR', onPress: () => setCurrency('EUR') },
      { text: 'GBP', onPress: () => setCurrency('GBP') },
      { text: '取消', style: 'cancel' },
    ]);
  };

  const themeLabel = theme === 'light' ? 'Ocean Light' : theme === 'dark' ? 'Ink Night' : '跟随系统';
  const languageLabel = language === 'zh' ? '中文' : 'English';
  const autoLockLabel = autoLockMinutes === 0 ? '从不' : `${autoLockMinutes} 分钟`;

  return (
    <SafeAreaView style={styles.container}>
      <Atmosphere />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>偏好与安全</Text>
          <Text style={styles.heroSubtitle}>定制视觉、连接和安全策略，让钱包更像你的工作台。</Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>外观与地区</Text>
        </View>
        <Card style={styles.card}>
          <SettingCell label="主题" value={themeLabel} onPress={handleThemeChange} styles={styles} />
          <SettingCell label="语言" value={languageLabel} onPress={handleLanguageChange} styles={styles} />
          <SettingCell label="货币" value={currency} onPress={handleCurrencyChange} styles={styles} noDivider />
        </Card>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>账户安全</Text>
        </View>
        <Card style={styles.card}>
          <View style={styles.settingItem}>
            <View>
              <Text style={styles.settingLabel}>生物识别</Text>
              <Text style={styles.settingHint}>打开后关键操作需系统级认证</Text>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={handleBiometricToggle}
              trackColor={{ false: colors.surfaceLight, true: colors.primary }}
              thumbColor={colors.text.inverse}
            />
          </View>
          <SettingCell label="自动锁定" value={autoLockLabel} onPress={handleAutoLockChange} styles={styles} noDivider />
        </Card>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>资产与网络</Text>
        </View>
        <Card style={styles.card}>
          <SettingCell label="网络管理" value="链与 RPC" onPress={() => navigation.navigate('Networks')} styles={styles} />
          <SettingCell label="代币管理" value="隐藏与自定义" onPress={() => navigation.navigate('Tokens')} styles={styles} />
          <SettingCell label="dApp 连接" value="会话与权限" onPress={() => navigation.navigate('DAppConnections')} styles={styles} noDivider />
        </Card>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>通知</Text>
        </View>
        <Card style={styles.card}>
          <View style={styles.settingItemNoDivider}>
            <View>
              <Text style={styles.settingLabel}>交易通知</Text>
              <Text style={styles.settingHint}>交易状态、连接事件与安全提醒</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: colors.surfaceLight, true: colors.primary }}
              thumbColor={colors.text.inverse}
            />
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

interface SettingCellProps {
  label: string;
  value: string;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
  noDivider?: boolean;
}

const SettingCell: React.FC<SettingCellProps> = ({ label, value, onPress, styles, noDivider }) => (
  <TouchableOpacity style={[styles.settingItem, noDivider && styles.settingItemNoDivider]} onPress={onPress}>
    <Text style={styles.settingLabel}>{label}</Text>
    <View style={styles.rowRight}>
      <Text style={styles.settingValue}>{value}</Text>
      <Text style={styles.arrow}>›</Text>
    </View>
  </TouchableOpacity>
);

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: spacing.md,
      paddingBottom: spacing.xxl,
    },
    hero: {
      marginBottom: spacing.lg,
      marginTop: spacing.xs,
    },
    heroTitle: {
      ...typography.h2,
      color: colors.text.primary,
      marginBottom: spacing.xs,
    },
    heroSubtitle: {
      ...typography.body,
      color: colors.text.secondary,
    },
    sectionHeader: {
      marginBottom: spacing.sm,
      marginTop: spacing.sm,
    },
    sectionTitle: {
      ...typography.overline,
      color: colors.text.secondary,
    },
    card: {
      padding: 0,
      marginBottom: spacing.md,
    },
    settingItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    settingItemNoDivider: {
      borderBottomWidth: 0,
    },
    settingLabel: {
      ...typography.bodyBold,
      color: colors.text.primary,
    },
    settingHint: {
      ...typography.caption,
      color: colors.text.secondary,
      marginTop: 2,
      maxWidth: 240,
    },
    rowRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    settingValue: {
      ...typography.captionMedium,
      color: colors.text.secondary,
    },
    arrow: {
      ...typography.h4,
      color: colors.text.secondary,
    },
  });
