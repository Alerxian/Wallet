/**
 * 确认创建钱包页面
 * 注意：已移除密码功能，直接使用 expo-secure-store 的系统级加密
 */

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { typography, spacing, ThemeColors } from "@/theme";
import { Button } from "@components/common/Button";
import { Card } from "@components/common/Card";
import { useWalletStore } from "@store/walletStore";
import type { AuthScreenNavigationProp } from "@/types/navigation.types";
import { useTheme } from "@/theme/ThemeContext";

interface SetPasswordScreenProps {
  navigation: AuthScreenNavigationProp<"SetPassword">;
  route: { params: { mnemonic: string } };
}

export const SetPasswordScreen: React.FC<SetPasswordScreenProps> = ({
  navigation,
  route,
}) => {
  const { theme: colors } = useTheme();
  const styles = createStyles(colors);

  const { mnemonic } = route.params;
  const [loading, setLoading] = useState(false);
  const { createWallet } = useWalletStore();

  const handleCreateWallet = async () => {
    setLoading(true);

    try {
      const wallet = await createWallet("钱包 1", mnemonic);

      Alert.alert("成功", "钱包创建成功！", [
        {
          text: "完成",
          onPress: () => {
            console.log("钱包创建成功:", wallet.address);
          },
        },
      ]);
    } catch (error) {
      Alert.alert("错误", `创建钱包失败: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>创建钱包</Text>
          <Text style={styles.subtitle}>确认创建您的钱包</Text>

          <Card style={styles.infoCard} variant="outlined">
            <Text style={styles.infoTitle}>🔒 安全说明</Text>
            <Text style={styles.infoText}>
              • 钱包数据使用系统级加密存储{"\n"}
              • iOS 使用 Keychain，Android 使用 EncryptedSharedPreferences{"\n"}
              • 请妥善保管您的助记词{"\n"}
              • 丢失助记词将无法恢复钱包
            </Text>
          </Card>

          <Button
            title="创建钱包"
            onPress={handleCreateWallet}
            variant="primary"
            loading={loading}
            style={styles.createButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
  infoCard: {
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
  },
  infoTitle: {
    ...typography.h4,
    color: colors.status.info,
    marginBottom: spacing.sm,
  },
  infoText: {
    ...typography.caption,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  createButton: {
    marginTop: spacing.lg,
  },
  });
