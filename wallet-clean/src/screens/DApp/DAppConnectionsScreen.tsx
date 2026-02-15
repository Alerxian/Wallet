/**
 * dApp 连接管理界面
 * 显示已连接的 dApp 和管理连接
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { MainScreenNavigationProp } from '@/types/navigation.types';
import { colors, typography, spacing } from '@/theme';
import { Card } from '@components/common/Card';
import { Button } from '@components/common/Button';
import { WalletConnectService, WalletConnectSession } from '@/services/WalletConnectService';

export const DAppConnectionsScreen: React.FC = () => {
  const navigation = useNavigation<MainScreenNavigationProp<'DAppConnections'>>();

  const [sessions, setSessions] = useState<WalletConnectSession[]>([]);
  const [loading, setLoading] = useState(false);

  // 加载会话列表
  const loadSessions = async () => {
    try {
      setLoading(true);
      const activeSessions = await WalletConnectService.getActiveSessions();
      setSessions(activeSessions);
    } catch (error: any) {
      console.error('加载会话失败:', error);
      Alert.alert('错误', error.message || '加载会话失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  // 断开连接
  const handleDisconnect = (topic: string, dappName: string) => {
    Alert.alert(
      '断开连接',
      `确定要断开与 ${dappName} 的连接吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '断开',
          style: 'destructive',
          onPress: async () => {
            try {
              await WalletConnectService.disconnectSession(topic);
              await loadSessions();
              Alert.alert('成功', '已断开连接');
            } catch (error: any) {
              Alert.alert('错误', error.message || '断开连接失败');
            }
          },
        },
      ]
    );
  };

  // 扫描二维码连接
  const handleScanQR = () => {
    // TODO: 实现二维码扫描
    Alert.alert('提示', '二维码扫描功能待实现');
  };

  // 手动输入 URI
  const handleManualConnect = () => {
    Alert.prompt(
      '连接 dApp',
      '请输入 WalletConnect URI',
      async (uri: string) => {
        if (!uri) return;

        try {
          await WalletConnectService.pair(uri);
          Alert.alert('成功', '连接请求已发送');
        } catch (error: any) {
          Alert.alert('错误', error.message || '连接失败');
        }
      }
    );
  };

  const renderSession = ({ item }: { item: WalletConnectSession }) => {
    const dapp = item.peer.metadata;
    const expiryDate = new Date(item.expiry * 1000);
    const isExpired = expiryDate < new Date();

    return (
      <Card style={styles.sessionCard}>
        <View style={styles.sessionHeader}>
          <Image
            source={{ uri: dapp.icons[0] || 'https://via.placeholder.com/48' }}
            style={styles.dappIcon}
          />
          <View style={styles.dappInfo}>
            <Text style={styles.dappName}>{dapp.name}</Text>
            <Text style={styles.dappUrl} numberOfLines={1}>
              {dapp.url}
            </Text>
            <Text style={[styles.status, isExpired && styles.expired]}>
              {isExpired ? '已过期' : `过期时间: ${expiryDate.toLocaleDateString()}`}
            </Text>
          </View>
        </View>

        <View style={styles.sessionDetails}>
          <Text style={styles.detailLabel}>连接的链</Text>
          <Text style={styles.detailValue}>
            {Object.keys(item.namespaces).join(', ')}
          </Text>
        </View>

        <Button
          title="断开连接"
          onPress={() => handleDisconnect(item.topic, dapp.name)}
          variant="secondary"
          style={styles.disconnectButton}
        />
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Button
          title="扫描二维码"
          onPress={handleScanQR}
          style={styles.headerButton}
        />
        <Button
          title="手动连接"
          onPress={handleManualConnect}
          variant="secondary"
          style={styles.headerButton}
        />
      </View>

      {sessions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>暂无连接</Text>
          <Text style={styles.emptySubtext}>
            扫描 dApp 的 WalletConnect 二维码或输入 URI 来连接
          </Text>
        </View>
      ) : (
        <FlatList
          data={sessions}
          renderItem={renderSession}
          keyExtractor={item => item.topic}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
  },
  headerButton: {
    flex: 1,
  },
  list: {
    padding: spacing.md,
  },
  sessionCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  sessionHeader: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  dappIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: spacing.md,
  },
  dappInfo: {
    flex: 1,
  },
  dappName: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  dappUrl: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  status: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  expired: {
    color: colors.status.error,
  },
  sessionDetails: {
    marginBottom: spacing.md,
  },
  detailLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  detailValue: {
    ...typography.body,
    color: colors.text.primary,
  },
  disconnectButton: {
    marginTop: spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  emptyText: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
