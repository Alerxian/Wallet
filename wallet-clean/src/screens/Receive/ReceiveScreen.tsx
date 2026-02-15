/**
 * 接收界面（重设计）
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import { typography, spacing, ThemeColors } from '@/theme';
import { useTheme } from '@/theme/ThemeContext';
import { Card } from '@components/common/Card';
import { Button } from '@components/common/Button';
import { Atmosphere } from '@components/common/Atmosphere';
import { useWalletStore } from '@store/walletStore';

export const ReceiveScreen: React.FC = () => {
  const { theme: colors } = useTheme();
  const styles = createStyles(colors);
  const { currentWallet } = useWalletStore();
  const [copied, setCopied] = useState(false);

  if (!currentWallet) {
    return (
      <SafeAreaView style={styles.container}>
        <Atmosphere />
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>暂无钱包</Text>
          <Text style={styles.emptyHint}>请先创建钱包后再接收资产</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleCopyAddress = async () => {
    try {
      await Clipboard.setStringAsync(currentWallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
      Alert.alert('已复制', '钱包地址已复制到剪贴板');
    } catch {
      Alert.alert('错误', '复制地址失败');
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${currentWallet.name}\n${currentWallet.address}`,
      });
    } catch {
      Alert.alert('错误', '分享失败');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Atmosphere />

      <View style={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>接收资产</Text>
          <Text style={styles.heroSubtitle}>向发送方展示二维码，或直接复制你的链上地址。</Text>
        </View>

        <Card style={styles.qrCard}>
          <View style={styles.qrFrame}>
            <QRCode value={currentWallet.address} size={220} backgroundColor="#FFFFFF" color="#0F172A" />
          </View>

          <Text style={styles.walletName}>{currentWallet.name}</Text>

          <View style={styles.addressBlock}>
            <Text style={styles.label}>钱包地址</Text>
            <TouchableOpacity onPress={handleCopyAddress} style={styles.addressBox} activeOpacity={0.85}>
              <Text style={styles.addressText} numberOfLines={1}>
                {currentWallet.address}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.actionsRow}>
            <Button title={copied ? '已复制' : '复制地址'} onPress={handleCopyAddress} style={styles.actionBtn} />
            <Button title="分享" onPress={handleShare} variant="secondary" style={styles.actionBtn} />
          </View>
        </Card>

        <Card style={styles.tipCard}>
          <Text style={styles.tipTitle}>安全提醒</Text>
          <Text style={styles.tipLine}>- 只接收与当前网络匹配的资产</Text>
          <Text style={styles.tipLine}>- 大额转入前建议先小额测试</Text>
          <Text style={styles.tipLine}>- 链上交易不可逆，请谨慎核对</Text>
        </Card>
      </View>
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      padding: spacing.md,
      gap: spacing.md,
    },
    hero: {
      marginTop: spacing.xs,
    },
    heroTitle: {
      ...typography.h2,
      color: colors.text.primary,
      marginBottom: 2,
    },
    heroSubtitle: {
      ...typography.body,
      color: colors.text.secondary,
    },
    qrCard: {
      alignItems: 'center',
      padding: spacing.lg,
    },
    qrFrame: {
      backgroundColor: '#FFFFFF',
      borderRadius: 20,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    walletName: {
      ...typography.h4,
      color: colors.text.primary,
      marginBottom: spacing.md,
    },
    addressBlock: {
      width: '100%',
      marginBottom: spacing.md,
    },
    label: {
      ...typography.caption,
      color: colors.text.secondary,
      marginBottom: 6,
    },
    addressBox: {
      backgroundColor: colors.surfaceLight,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    addressText: {
      ...typography.body,
      color: colors.text.primary,
      fontFamily: 'monospace',
    },
    actionsRow: {
      width: '100%',
      flexDirection: 'row',
      gap: spacing.sm,
    },
    actionBtn: {
      flex: 1,
    },
    tipCard: {
      backgroundColor: colors.warning + '12',
      borderColor: colors.warning + '40',
      borderWidth: 1,
      padding: spacing.md,
    },
    tipTitle: {
      ...typography.bodyBold,
      color: colors.warning,
      marginBottom: spacing.xs,
    },
    tipLine: {
      ...typography.caption,
      color: colors.text.secondary,
      marginBottom: 4,
    },
    emptyWrap: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyTitle: {
      ...typography.h3,
      color: colors.text.primary,
      marginBottom: spacing.xs,
    },
    emptyHint: {
      ...typography.body,
      color: colors.text.secondary,
    },
  });
