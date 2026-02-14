/**
 * 欢迎页面
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Image,
} from 'react-native';
import { colors, typography, spacing } from '@theme';
import { Button } from '@components/common/Button';
import type { AuthScreenNavigationProp } from '@types/navigation.types';

interface WelcomeScreenProps {
  navigation: AuthScreenNavigationProp<'Welcome'>;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ navigation }) => {
  const handleCreateWallet = () => {
    navigation.navigate('GenerateMnemonic', { mnemonicLength: 12 });
  };

  const handleImportWallet = () => {
    // TODO: 导航到导入页面
    console.log('导入钱包');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo 区域 */}
        <View style={styles.logoContainer}>
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>🔐</Text>
          </View>
          <Text style={styles.title}>加密钱包</Text>
          <Text style={styles.subtitle}>安全、简单、可靠</Text>
        </View>

        {/* 特性列表 */}
        <View style={styles.features}>
          <FeatureItem
            icon="🔒"
            title="安全可靠"
            description="助记词加密存储，永不离开设备"
          />
          <FeatureItem
            icon="⚡"
            title="快速便捷"
            description="支持多链资产管理，一键切换"
          />
          <FeatureItem
            icon="🌐"
            title="DApp 支持"
            description="无缝连接去中心化应用"
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

interface FeatureItemProps {
  icon: string;
  title: string;
  description: string;
}

const FeatureItem: React.FC<FeatureItemProps> = ({ icon, title, description }) => {
  return (
    <View style={styles.featureItem}>
      <Text style={styles.featureIcon}>{icon}</Text>
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
    justifyContent: 'space-between',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: spacing.xxxl,
  },
  logoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  logoText: {
    fontSize: 48,
  },
  title: {
    ...typography.h1,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
  },
  features: {
    gap: spacing.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  featureIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    ...typography.h4,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  featureDescription: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  actions: {
    gap: spacing.md,
  },
  button: {
    width: '100%',
  },
  disclaimer: {
    ...typography.caption,
    color: colors.text.disabled,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
