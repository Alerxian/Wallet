/**
 * 欢迎页面 - 参考 Rabby Wallet 设计
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, typography, spacing } from "@/theme";
import { Button } from "@components/common/Button";
import type { AuthScreenNavigationProp } from "@/types/navigation.types";

interface WelcomeScreenProps {
  navigation: AuthScreenNavigationProp<"Welcome">;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ navigation }) => {
  const handleCreateWallet = () => {
    navigation.navigate("GenerateMnemonic", { mnemonicLength: 12 });
  };

  const handleImportWallet = () => {
    navigation.navigate("ImportWallet");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo 和标题区域 */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>🦊</Text>
            </View>
          </View>
          <Text style={styles.title}>Crypto Wallet</Text>
          <Text style={styles.subtitle}>安全、简单、可靠的加密钱包</Text>
        </View>

        {/* 特性卡片 */}
        <View style={styles.features}>
          <FeatureCard
            icon="🔒"
            title="安全可靠"
            description="系统级加密存储，助记词永不离开设备"
            gradient={["#1E3A8A", "#3B82F6"]}
          />
          <FeatureCard
            icon="⚡"
            title="快速便捷"
            description="支持多链资产管理，自动网络切换"
            gradient={["#7C3AED", "#A78BFA"]}
          />
          <FeatureCard
            icon="🌐"
            title="DeFi 就绪"
            description="交易预览、安全扫描、智能合约交互"
            gradient={["#059669", "#10B981"]}
          />
        </View>

        {/* 操作按钮 */}
        <View style={styles.actions}>
          <Button
            title="创建新钱包"
            onPress={handleCreateWallet}
            variant="primary"
            size="large"
            style={styles.button}
          />
          <Button
            title="导入已有钱包"
            onPress={handleImportWallet}
            variant="outline"
            size="large"
            style={styles.button}
          />
        </View>

        {/* 底部提示 */}
        <Text style={styles.disclaimer}>
          使用本应用即表示您同意我们的服务条款和隐私政策
        </Text>
      </View>
    </SafeAreaView>
  );
};

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  gradient: string[];
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  gradient,
}) => {
  return (
    <View style={styles.featureCard}>
      <View style={[styles.featureIconContainer, { backgroundColor: gradient[0] }]}>
        <Text style={styles.featureIcon}>{icon}</Text>
      </View>
      <View style={styles.featureContent}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>
    </View>
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
    justifyContent: "space-between",
  },
  header: {
    alignItems: "center",
    marginTop: spacing.xxxl,
  },
  logoContainer: {
    marginBottom: spacing.lg,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  logoText: {
    fontSize: 48,
  },
  title: {
    ...typography.h1,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    fontWeight: "700",
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: "center",
  },
  features: {
    gap: spacing.md,
  },
  featureCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  featureIcon: {
    fontSize: 24,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    ...typography.h4,
    color: colors.text.primary,
    marginBottom: spacing.xs,
    fontWeight: "600",
  },
  featureDescription: {
    ...typography.caption,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  actions: {
    gap: spacing.md,
  },
  button: {
    width: "100%",
  },
  disclaimer: {
    ...typography.caption,
    color: colors.text.disabled,
    textAlign: "center",
    marginTop: spacing.md,
  },
});
