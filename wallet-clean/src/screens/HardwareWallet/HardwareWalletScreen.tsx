/**
 * 硬件钱包界面
 * 连接和管理硬件钱包设备
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { MainScreenNavigationProp } from '@/types/navigation.types';
import { colors, typography, spacing } from '@/theme';
import { Card } from '@components/common/Card';
import { Button } from '@components/common/Button';
import {
  HardwareWalletService,
  HardwareDevice,
  HardwareAccount,
} from '@/services/HardwareWalletService';

export const HardwareWalletScreen: React.FC = () => {
  const navigation = useNavigation<MainScreenNavigationProp<'HardwareWallet'>>();

  const [devices, setDevices] = useState<HardwareDevice[]>([]);
  const [accounts, setAccounts] = useState<HardwareAccount[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<HardwareDevice | null>(null);
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);

  // 扫描设备
  const handleScan = async () => {
    try {
      setScanning(true);
      const foundDevices = await HardwareWalletService.scanDevices();
      setDevices(foundDevices);

      if (foundDevices.length === 0) {
        Alert.alert('提示', '未找到硬件钱包设备');
      }
    } catch (error: any) {
      console.error('扫描设备失败:', error);
      Alert.alert('错误', error.message || '扫描设备失败');
    } finally {
      setScanning(false);
    }
  };

  // 连接设备
  const handleConnect = async (device: HardwareDevice) => {
    try {
      setLoading(true);

      let connectedDevice: HardwareDevice;
      if (device.type === 'ledger') {
        connectedDevice = await HardwareWalletService.connectLedger(device.id);
      } else {
        connectedDevice = await HardwareWalletService.connectTrezor(device.id);
      }

      setSelectedDevice(connectedDevice);

      // 获取账户列表
      const deviceAccounts = await HardwareWalletService.getAccounts(device.id);
      setAccounts(deviceAccounts);

      Alert.alert('成功', '设备已连接');
    } catch (error: any) {
      console.error('连接设备失败:', error);
      Alert.alert('错误', error.message || '连接设备失败');
    } finally {
      setLoading(false);
    }
  };

  // 断开连接
  const handleDisconnect = async () => {
    if (!selectedDevice) return;

    try {
      await HardwareWalletService.disconnect(selectedDevice.id);
      setSelectedDevice(null);
      setAccounts([]);
      Alert.alert('成功', '设备已断开');
    } catch (error: any) {
      console.error('断开连接失败:', error);
      Alert.alert('错误', error.message || '断开连接失败');
    }
  };

  // 导入账户
  const handleImportAccount = (account: HardwareAccount) => {
    Alert.alert(
      '导入账户',
      `确定要导入账户 ${account.address.substring(0, 10)}... 吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '导入',
          onPress: () => {
            // TODO: 实现账户导入
            Alert.alert('提示', '账户导入功能待实现');
          },
        },
      ]
    );
  };

  const renderDevice = ({ item }: { item: HardwareDevice }) => (
    <Card style={styles.deviceCard}>
      <View style={styles.deviceHeader}>
        <View style={styles.deviceIcon}>
          <Text style={styles.deviceIconText}>
            {item.type === 'ledger' ? '🔷' : '🔶'}
          </Text>
        </View>
        <View style={styles.deviceInfo}>
          <Text style={styles.deviceName}>{item.name}</Text>
          <Text style={styles.deviceModel}>{item.model}</Text>
          {item.firmwareVersion && (
            <Text style={styles.deviceVersion}>
              固件版本: {item.firmwareVersion}
            </Text>
          )}
        </View>
      </View>
      <Button
        title={item.connected ? '已连接' : '连接'}
        onPress={() => handleConnect(item)}
        disabled={item.connected}
        style={styles.connectButton}
      />
    </Card>
  );

  const renderAccount = ({ item }: { item: HardwareAccount }) => (
    <TouchableOpacity
      style={styles.accountCard}
      onPress={() => handleImportAccount(item)}
    >
      <View style={styles.accountInfo}>
        <Text style={styles.accountAddress}>
          {item.address.substring(0, 10)}...{item.address.substring(item.address.length - 8)}
        </Text>
        <Text style={styles.accountPath}>{item.path}</Text>
        {item.balance && (
          <Text style={styles.accountBalance}>{item.balance} ETH</Text>
        )}
      </View>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* 扫描按钮 */}
        <View style={styles.header}>
          <Button
            title={scanning ? '扫描中...' : '扫描设备'}
            onPress={handleScan}
            disabled={scanning}
            style={styles.scanButton}
          />
          {selectedDevice && (
            <Button
              title="断开连接"
              onPress={handleDisconnect}
              variant="secondary"
              style={styles.disconnectButton}
            />
          )}
        </View>

        {/* 设备列表 */}
        {!selectedDevice && devices.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>可用设备</Text>
            <FlatList
              data={devices}
              renderItem={renderDevice}
              keyExtractor={item => item.id}
            />
          </View>
        )}

        {/* 账户列表 */}
        {selectedDevice && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {selectedDevice.name} - 账户列表
            </Text>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>加载账户中...</Text>
              </View>
            ) : accounts.length > 0 ? (
              <FlatList
                data={accounts}
                renderItem={renderAccount}
                keyExtractor={item => item.path}
              />
            ) : (
              <Card style={styles.emptyCard}>
                <Text style={styles.emptyText}>暂无账户</Text>
              </Card>
            )}
          </View>
        )}

        {/* 空状态 */}
        {!selectedDevice && devices.length === 0 && !scanning && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>连接硬件钱包</Text>
            <Text style={styles.emptySubtext}>
              支持 Ledger 和 Trezor 硬件钱包
            </Text>
            <Text style={styles.emptySubtext}>
              点击"扫描设备"开始连接
            </Text>
          </View>
        )}

        {/* 说明 */}
        <Card style={styles.infoCard}>
          <Text style={styles.infoTitle}>使用说明</Text>
          <Text style={styles.infoText}>
            1. 确保硬件钱包已解锁并打开以太坊应用
          </Text>
          <Text style={styles.infoText}>
            2. 点击"扫描设备"查找可用设备
          </Text>
          <Text style={styles.infoText}>
            3. 选择设备并连接
          </Text>
          <Text style={styles.infoText}>
            4. 选择要导入的账户
          </Text>
          <Text style={styles.infoWarning}>
            ⚠️ 注意：硬件钱包功能需要安装相应的 SDK
          </Text>
        </Card>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  scanButton: {
    flex: 1,
  },
  disconnectButton: {
    flex: 1,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  deviceCard: {
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  deviceHeader: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  deviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  deviceIconText: {
    fontSize: 24,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  deviceModel: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  deviceVersion: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  connectButton: {
    marginTop: spacing.sm,
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  accountInfo: {
    flex: 1,
  },
  accountAddress: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  accountPath: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  accountBalance: {
    ...typography.caption,
    color: colors.primary,
  },
  arrow: {
    ...typography.h3,
    color: colors.text.secondary,
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  emptyCard: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  infoCard: {
    padding: spacing.lg,
    marginTop: 'auto',
  },
  infoTitle: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  infoText: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  infoWarning: {
    ...typography.caption,
    color: colors.warning,
    marginTop: spacing.sm,
  },
});
