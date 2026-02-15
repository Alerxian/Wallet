/**
 * 接收界面
 * 显示钱包地址和二维码，支持复制地址
 */

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import QRCode from "react-native-qrcode-svg";
import * as Clipboard from "expo-clipboard";
import { colors, typography, spacing } from "@/theme";
import { Card } from "@components/common/Card";
import { Button } from "@components/common/Button";
import { useWalletStore } from "@store/walletStore";

export const ReceiveScreen: React.FC = () => {
  const { currentWallet } = useWalletStore();
  const [copied, setCopied] = useState(false);

  if (!currentWallet) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>暂无钱包</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleCopyAddress = async () => {
    try {
      await Clipboard.setStringAsync(currentWallet.address);
      setCopied(true);
      Alert.alert("成功", "地址已复制到剪贴板");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      Alert.alert("错误", "复制地址失败");
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `我的钱包地址：\n${currentWallet.address}`,
      });
    } catch (error) {
      console.error("分享失败:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* 标题 */}
        <View style={styles.header}>
          <Text style={styles.title}>接收</Text>
          <Text style={styles.subtitle}>扫描二维码或复制地址以接收资产</Text>
        </View>

        {/* 二维码卡片 */}
        <Card style={styles.qrCard}>
          <View style={styles.qrContainer}>
            {currentWallet.address ? (
              <QRCode
                value={currentWallet.address}
                size={240}
                backgroundColor="#FFFFFF"
                color="#000000"
              />
            ) : (
              <Text>加载中...</Text>
            )}
          </View>

          {/* 钱包名称 */}
          <Text style={styles.walletName}>{currentWallet.name}</Text>

          {/* 地址显示 */}
          <View style={styles.addressContainer}>
            <Text style={styles.addressLabel}>钱包地址</Text>
            <TouchableOpacity
              style={styles.addressBox}
              onPress={handleCopyAddress}
              activeOpacity={0.7}
            >
              <Text style={styles.addressText} numberOfLines={1}>
                {currentWallet.address}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 操作按钮 */}
          <View style={styles.actions}>
            <Button
              title={copied ? "已复制" : "复制地址"}
              onPress={handleCopyAddress}
              variant="primary"
              style={styles.actionButton}
            />
            <Button
              title="分享"
              onPress={handleShare}
              variant="secondary"
              style={styles.actionButton}
            />
          </View>
        </Card>

        {/* 提示信息 */}
        <Card style={styles.warningCard}>
          <Text style={styles.warningTitle}>⚠️ 重要提示</Text>
          <Text style={styles.warningText}>
            • 仅发送 Ethereum 网络上的资产到此地址
          </Text>
          <Text style={styles.warningText}>
            • 发送其他网络的资产可能导致永久丢失
          </Text>
          <Text style={styles.warningText}>
            • 请确认发送方使用正确的网络
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
    padding: spacing.lg,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    ...typography.h3,
    color: colors.text.secondary,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
  },
  qrCard: {
    padding: spacing.xl,
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  qrContainer: {
    padding: spacing.lg,
    backgroundColor: "white",
    borderRadius: 16,
    marginBottom: spacing.lg,
  },
  walletName: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  addressContainer: {
    width: "100%",
    marginBottom: spacing.lg,
  },
  addressLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  addressBox: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addressText: {
    ...typography.body,
    color: colors.text.primary,
    fontFamily: "monospace",
  },
  actions: {
    flexDirection: "row",
    width: "100%",
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  warningCard: {
    padding: spacing.lg,
    backgroundColor: colors.warning + "10",
    borderColor: colors.warning + "30",
    borderWidth: 1,
  },
  warningTitle: {
    ...typography.bodyBold,
    color: colors.warning,
    marginBottom: spacing.sm,
  },
  warningText: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
});
