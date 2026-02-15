/**
 * 设置界面
 * 应用设置和偏好管理
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
import { colors, typography, spacing } from '@/theme';
import { Card } from '@components/common/Card';
import { useSettingsStore } from '@store/settingsStore';
import { BiometricService } from '@/services/BiometricService';

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<MainScreenNavigationProp<'Settings'>>();
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

  // 切换主题
  const handleThemeChange = () => {
    Alert.alert(
      '选择主题',
      '',
      [
        {
          text: '浅色',
          onPress: () => setTheme('light'),
        },
        {
          text: '深色',
          onPress: () => setTheme('dark'),
        },
        {
          text: '跟随系统',
          onPress: () => setTheme('auto'),
        },
        { text: '取消', style: 'cancel' },
      ]
    );
  };

  // 切换语言
  const handleLanguageChange = () => {
    Alert.alert(
      '选择语言',
      '',
      [
        {
          text: '中文',
          onPress: () => setLanguage('zh'),
        },
        {
          text: 'English',
          onPress: () => setLanguage('en'),
        },
        { text: '取消', style: 'cancel' },
      ]
    );
  };

  // 切换生物识别
  const handleBiometricToggle = async (value: boolean) => {
    if (value) {
      // 检查是否支持
      const isAvailable = await BiometricService.isAvailable();
      if (!isAvailable) {
        Alert.alert('提示', '设备不支持生物识别');
        return;
      }

      // 验证生物识别
      const success = await BiometricService.authenticate('启用生物识别');
      if (success) {
        await setBiometricEnabled(true);
      } else {
        Alert.alert('错误', '验证失败');
      }
    } else {
      await setBiometricEnabled(false);
    }
  };

  // 设置自动锁定时间
  const handleAutoLockChange = () => {
    Alert.alert(
      '自动锁定时间',
      '',
      [
        { text: '1 分钟', onPress: () => setAutoLockMinutes(1) },
        { text: '5 分钟', onPress: () => setAutoLockMinutes(5) },
        { text: '15 分钟', onPress: () => setAutoLockMinutes(15) },
        { text: '30 分钟', onPress: () => setAutoLockMinutes(30) },
        { text: '从不', onPress: () => setAutoLockMinutes(0) },
        { text: '取消', style: 'cancel' },
      ]
    );
  };

  // 设置货币
  const handleCurrencyChange = () => {
    Alert.alert(
      '选择货币',
      '',
      [
        { text: 'USD', onPress: () => setCurrency('USD') },
        { text: 'CNY', onPress: () => setCurrency('CNY') },
        { text: 'EUR', onPress: () => setCurrency('EUR') },
        { text: 'GBP', onPress: () => setCurrency('GBP') },
        { text: '取消', style: 'cancel' },
      ]
    );
  };

  const getThemeLabel = () => {
    switch (theme) {
      case 'light':
        return '浅色';
      case 'dark':
        return '深色';
      case 'auto':
        return '跟随系统';
    }
  };

  const getLanguageLabel = () => {
    return language === 'zh' ? '中文' : 'English';
  };

  const getAutoLockLabel = () => {
    if (autoLockMinutes === 0) return '从不';
    return `${autoLockMinutes} 分钟`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* 外观 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>外观</Text>
          <Card style={styles.card}>
            <TouchableOpacity
              style={styles.settingItem}
              onPress={handleThemeChange}
            >
              <Text style={styles.settingLabel}>主题</Text>
              <View style={styles.settingValue}>
                <Text style={styles.settingValueText}>{getThemeLabel()}</Text>
                <Text style={styles.arrow}>›</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingItem}
              onPress={handleLanguageChange}
            >
              <Text style={styles.settingLabel}>语言</Text>
              <View style={styles.settingValue}>
                <Text style={styles.settingValueText}>{getLanguageLabel()}</Text>
                <Text style={styles.arrow}>›</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingItem}
              onPress={handleCurrencyChange}
            >
              <Text style={styles.settingLabel}>货币</Text>
              <View style={styles.settingValue}>
                <Text style={styles.settingValueText}>{currency}</Text>
                <Text style={styles.arrow}>›</Text>
              </View>
            </TouchableOpacity>
          </Card>
        </View>

        {/* 安全 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>安全</Text>
          <Card style={styles.card}>
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>生物识别</Text>
              <Switch
                value={biometricEnabled}
                onValueChange={handleBiometricToggle}
                trackColor={{
                  false: colors.surfaceLight,
                  true: colors.primary,
                }}
                thumbColor={colors.text.primary}
              />
            </View>

            <TouchableOpacity
              style={styles.settingItem}
              onPress={handleAutoLockChange}
            >
              <Text style={styles.settingLabel}>自动锁定</Text>
              <View style={styles.settingValue}>
                <Text style={styles.settingValueText}>{getAutoLockLabel()}</Text>
                <Text style={styles.arrow}>›</Text>
              </View>
            </TouchableOpacity>
          </Card>
        </View>

        {/* 通知 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>通知</Text>
          <Card style={styles.card}>
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>启用通知</Text>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{
                  false: colors.surfaceLight,
                  true: colors.primary,
                }}
                thumbColor={colors.text.primary}
              />
            </View>
          </Card>
        </View>

        {/* 网络和代币 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>管理</Text>
          <Card style={styles.card}>
            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => navigation.navigate('Networks')}
            >
              <Text style={styles.settingLabel}>网络管理</Text>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => navigation.navigate('Tokens')}
            >
              <Text style={styles.settingLabel}>代币管理</Text>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => navigation.navigate('DAppConnections')}
            >
              <Text style={styles.settingLabel}>dApp 连接</Text>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          </Card>
        </View>

        {/* 关于 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>关于</Text>
          <Card style={styles.card}>
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>版本</Text>
              <Text style={styles.settingValueText}>1.0.0</Text>
            </View>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  card: {
    padding: 0,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  settingLabel: {
    ...typography.body,
    color: colors.text.primary,
  },
  settingValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  settingValueText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  arrow: {
    ...typography.h4,
    color: colors.text.secondary,
  },
});
