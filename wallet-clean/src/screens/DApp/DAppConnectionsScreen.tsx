/**
 * dApp 连接管理界面
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { MainScreenNavigationProp } from '@/types/navigation.types';
import { typography, spacing, ThemeColors } from '@/theme';
import { Card } from '@components/common/Card';
import { Button } from '@components/common/Button';
import { useTheme } from '@/theme/ThemeContext';
import { Atmosphere } from '@components/common/Atmosphere';
import {
  WalletConnectService,
  WalletConnectSession,
  SignRequest,
} from '@/services/WalletConnectService';
import { WALLETCONNECT_PROJECT_ID } from '@/config/walletconnect';
import { useWalletStore } from '@/store/walletStore';
import { useNetworkStore } from '@/store/networkStore';
import { SecurityService } from '@/services/SecurityService';

export const DAppConnectionsScreen: React.FC = () => {
  const navigation = useNavigation<MainScreenNavigationProp<'DAppConnections'>>();
  const { theme: colors } = useTheme();
  const styles = createStyles(colors);
  const { currentWallet } = useWalletStore();
  const { currentChainId } = useNetworkStore();

  const [sessions, setSessions] = useState<WalletConnectSession[]>([]);
  const [pendingRequests, setPendingRequests] = useState<SignRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [uriModalVisible, setUriModalVisible] = useState(false);
  const [wcUri, setWcUri] = useState('');

  const localMode = WalletConnectService.isLocalMode();

  const loadSessions = async () => {
    try {
      setLoading(true);
      await WalletConnectService.init(WALLETCONNECT_PROJECT_ID);
      const activeSessions = await WalletConnectService.getActiveSessions();
      setSessions(activeSessions.filter((s) => !WalletConnectService.isSessionExpired(s)));
      setPendingRequests(WalletConnectService.getPendingRequests());
    } catch (error: any) {
      console.error('加载会话失败:', error);
      Alert.alert('错误', error.message || '加载会话失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentWallet) {
      WalletConnectService.setWalletContext({
        walletId: currentWallet.id,
        address: currentWallet.address,
        chainIds: [currentChainId],
      });
    }
  }, [currentWallet?.id, currentWallet?.address, currentChainId]);

  useEffect(() => {
    loadSessions();

    const unsubscribe = WalletConnectService.subscribeRequests(() => {
      setPendingRequests(WalletConnectService.getPendingRequests());
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleDisconnect = (topic: string, dappName: string) => {
    Alert.alert('断开连接', `确定要断开与 ${dappName} 的连接吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '断开',
        style: 'destructive',
        onPress: async () => {
          try {
            await WalletConnectService.disconnectSession(topic);
            await loadSessions();
          } catch (error: any) {
            Alert.alert('错误', error.message || '断开连接失败');
          }
        },
      },
    ]);
  };

  const handleDisconnectAll = () => {
    Alert.alert('断开全部连接', '确定要断开全部 dApp 连接吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '断开全部',
        style: 'destructive',
        onPress: async () => {
          try {
            await WalletConnectService.disconnectAllSessions();
            await loadSessions();
          } catch (error: any) {
            Alert.alert('错误', error.message || '操作失败');
          }
        },
      },
    ]);
  };

  const handleManualConnect = async () => {
    const uri = wcUri.trim();
    if (!uri) {
      Alert.alert('提示', '请输入 WalletConnect URI');
      return;
    }

    if (!WalletConnectService.parseUri(uri)) {
      Alert.alert('错误', 'WalletConnect URI 格式无效');
      return;
    }

    if (!currentWallet) {
      Alert.alert('错误', '请先创建或导入钱包');
      return;
    }

    try {
      await WalletConnectService.pair(uri);
      setUriModalVisible(false);
      setWcUri('');
      await loadSessions();
      Alert.alert('成功', localMode ? '本地模式会话已添加' : '连接请求已发送');
    } catch (error: any) {
      Alert.alert('错误', error.message || '连接失败');
    }
  };

  const handleApproveRequest = async (request: SignRequest) => {
    const method = request.params.request.method;
    const summary = SecurityService.summarizeWalletConnectRequest({
      method,
      params: request.params.request.params || [],
      chainId: request.params.chainId,
    });
    const bodyLines = [
      ...summary.lines,
      ...summary.risk.findings.map((f) => `- ${f.title}`),
    ];

    Alert.alert('确认请求', bodyLines.join('\n'), [
      { text: '拒绝', style: 'destructive', onPress: () => handleRejectRequest(request.id) },
      {
        text: '批准',
        onPress: async () => {
          try {
            if (summary.risk.level === 'high') {
              Alert.alert('高风险请求', '该请求风险较高，请再次确认是否继续批准', [
                { text: '取消', style: 'cancel' },
                {
                  text: '仍然批准',
                  style: 'destructive',
                  onPress: async () => {
                    await WalletConnectService.approveRequest(request.id);
                    setPendingRequests(WalletConnectService.getPendingRequests());
                    Alert.alert('成功', '请求已批准');
                  },
                },
              ]);
              return;
            }

            await WalletConnectService.approveRequest(request.id);
            setPendingRequests(WalletConnectService.getPendingRequests());
            Alert.alert('成功', '请求已批准');
          } catch (error: any) {
            Alert.alert('错误', error.message || '批准失败');
          }
        },
      },
    ]);
  };

  const handleRejectRequest = async (id: number) => {
    try {
      await WalletConnectService.rejectRequest(id, '用户拒绝');
      setPendingRequests(WalletConnectService.getPendingRequests());
    } catch (error: any) {
      Alert.alert('错误', error.message || '拒绝失败');
    }
  };

  const renderSession = ({ item }: { item: WalletConnectSession }) => {
    const dapp = item.peer.metadata;
    const expiryDate = new Date(item.expiry * 1000);

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
            <Text style={styles.status}>过期时间: {expiryDate.toLocaleDateString()}</Text>
          </View>
        </View>

        <View style={styles.sessionDetails}>
          <Text style={styles.detailLabel}>连接命名空间</Text>
          <Text style={styles.detailValue}>{Object.keys(item.namespaces).join(', ') || '-'}</Text>
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

  const requestCards = useMemo(
    () =>
      pendingRequests.map((req) => {
        const method = req.params.request.method;
        const chain = req.params.chainId;
        const summary = SecurityService.summarizeWalletConnectRequest({
          method,
          params: req.params.request.params || [],
          chainId: chain,
        });
        const session = WalletConnectService.getSession(req.topic);
        const dappUrl = session?.peer?.metadata?.url || '-';
        const dappUrlRisk = dappUrl !== '-' ? SecurityService.assessUrl(dappUrl) : null;

        return (
          <Card style={styles.requestCard} key={req.id}>
            <Text style={styles.requestTitle}>待处理请求 #{req.id}</Text>
            <Text style={styles.requestLine}>方法: {method}</Text>
            <Text style={styles.requestLine}>链: {chain}</Text>
            <Text style={styles.requestLine}>来源: {dappUrl}</Text>
            <Text
              style={[
                styles.requestLine,
                summary.risk.level === 'high'
                  ? styles.riskHigh
                  : summary.risk.level === 'medium'
                  ? styles.riskMedium
                  : styles.riskLow,
              ]}
            >
              请求风险: {summary.risk.level.toUpperCase()}
            </Text>
            {dappUrlRisk && (
              <Text
                style={[
                  styles.requestLine,
                  dappUrlRisk.level === 'high'
                    ? styles.riskHigh
                    : dappUrlRisk.level === 'medium'
                    ? styles.riskMedium
                    : styles.riskLow,
                ]}
              >
                域名风险: {dappUrlRisk.level.toUpperCase()}
              </Text>
            )}
            {summary.risk.findings.map((finding, idx) => (
              <Text key={`${req.id}-risk-${idx}`} style={styles.requestHint}>
                - {finding.title}
              </Text>
            ))}
            <View style={styles.requestActions}>
              <Button title="拒绝" variant="secondary" onPress={() => handleRejectRequest(req.id)} />
              <Button title="批准" onPress={() => handleApproveRequest(req)} />
            </View>
          </Card>
        );
      }),
    [pendingRequests]
  );

  return (
    <SafeAreaView style={styles.container}>
      <Atmosphere />
      <View style={styles.header}>
        <Button title="手动连接" onPress={() => setUriModalVisible(true)} style={styles.headerButton} />
        <Button
          title="浏览 dApp"
          onPress={() => navigation.navigate('DAppBrowser')}
          variant="outline"
          style={styles.headerButton}
        />
      </View>

      <View style={styles.modeBanner}>
        <Text style={styles.modeText}>
          {localMode
            ? '当前为本地模式：未配置 WalletConnect Project ID，无法真实连接远端 dApp。'
            : 'WalletConnect 在线模式：可与外部 dApp 真实建立会话。'}
        </Text>
      </View>

      {pendingRequests.length > 0 && (
        <View style={styles.pendingSection}>
          <Text style={styles.pendingTitle}>签名与交易请求</Text>
          {requestCards}
        </View>
      )}

      {sessions.length > 0 && (
        <View style={styles.toolsRow}>
          <TouchableOpacity onPress={handleDisconnectAll}>
            <Text style={styles.dangerLink}>断开全部</Text>
          </TouchableOpacity>
        </View>
      )}

      {sessions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>暂无连接</Text>
          <Text style={styles.emptySubtext}>通过 WalletConnect URI 建立连接后会显示在这里</Text>
        </View>
      ) : (
        <FlatList
          data={sessions}
          renderItem={renderSession}
          keyExtractor={(item) => item.topic}
          contentContainerStyle={styles.list}
          refreshing={loading}
          onRefresh={loadSessions}
        />
      )}

      <Modal visible={uriModalVisible} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>连接 WalletConnect</Text>
            <TextInput
              value={wcUri}
              onChangeText={setWcUri}
              placeholder="粘贴 wc:... URI"
              placeholderTextColor={colors.text.secondary}
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.uriInput}
              multiline
            />
            <View style={styles.modalActions}>
              <Button title="取消" variant="secondary" onPress={() => setUriModalVisible(false)} />
              <Button title="连接" onPress={handleManualConnect} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
    modeBanner: {
      marginHorizontal: spacing.md,
      marginBottom: spacing.md,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.warning + '40',
      backgroundColor: colors.warning + '15',
      padding: spacing.sm,
    },
    modeText: {
      ...typography.caption,
      color: colors.warning,
    },
    pendingSection: {
      paddingHorizontal: spacing.md,
      marginBottom: spacing.sm,
    },
    pendingTitle: {
      ...typography.bodyBold,
      color: colors.text.primary,
      marginBottom: spacing.sm,
    },
    requestCard: {
      marginBottom: spacing.sm,
      padding: spacing.md,
    },
    requestTitle: {
      ...typography.bodyBold,
      color: colors.text.primary,
      marginBottom: spacing.xs,
    },
    requestLine: {
      ...typography.caption,
      color: colors.text.secondary,
      marginBottom: 4,
    },
    requestHint: {
      ...typography.overline,
      color: colors.text.secondary,
      marginBottom: 2,
    },
    riskLow: {
      color: colors.status.success,
    },
    riskMedium: {
      color: colors.warning,
    },
    riskHigh: {
      color: colors.status.error,
      fontWeight: '700',
    },
    requestActions: {
      marginTop: spacing.sm,
      flexDirection: 'row',
      gap: spacing.sm,
      justifyContent: 'flex-end',
    },
    toolsRow: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.md,
      alignItems: 'flex-end',
    },
    dangerLink: {
      ...typography.caption,
      color: colors.status.error,
      fontWeight: '600',
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
      backgroundColor: colors.surfaceLight,
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
    modalBackdrop: {
      flex: 1,
      backgroundColor: colors.overlay.medium,
      justifyContent: 'center',
      padding: spacing.lg,
    },
    modalSheet: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: spacing.lg,
    },
    modalTitle: {
      ...typography.h4,
      color: colors.text.primary,
      marginBottom: spacing.md,
    },
    uriInput: {
      minHeight: 120,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: spacing.md,
      color: colors.text.primary,
      backgroundColor: colors.surfaceLight,
      textAlignVertical: 'top',
    },
    modalActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: spacing.sm,
      marginTop: spacing.md,
    },
  });
