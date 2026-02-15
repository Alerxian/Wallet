/**
 * 备份助记词页面
 */

import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, typography, spacing } from "@/theme";
import { Button } from "@components/common/Button";
import { Card } from "@components/common/Card";
import { MnemonicGrid } from "@components/wallet/MnemonicGrid";
import { MnemonicWord as MnemonicWordType } from "@/types/wallet.types";
import { useScreenProtection } from "@hooks/useScreenProtection";
import type { AuthScreenNavigationProp } from "@/types/navigation.types";

interface BackupMnemonicScreenProps {
  navigation: AuthScreenNavigationProp<"BackupMnemonic">;
  route: { params: { mnemonic: string } };
}

export const BackupMnemonicScreen: React.FC<BackupMnemonicScreenProps> = ({
  navigation,
  route,
}) => {
  const { mnemonic } = route.params;
  const [confirmed, setConfirmed] = useState(false);

  // 启用截屏保护
  useScreenProtection(true);

  const words: MnemonicWordType[] = mnemonic.split(" ").map((word, index) => ({
    index,
    word,
    selected: false,
  }));

  const handleConfirm = () => {
    if (!confirmed) {
      Alert.alert(
        "确认备份",
        "请确认您已经安全备份了助记词。如果丢失，您将无法恢复钱包。",
        [
          { text: "取消", style: "cancel" },
          {
            text: "已备份",
            onPress: () => {
              setConfirmed(true);
              navigation.navigate("SetPassword", { mnemonic });
            },
          },
        ],
      );
    } else {
      navigation.navigate("SetPassword", { mnemonic });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>备份助记词</Text>
        <Text style={styles.subtitle}>
          请将助记词按顺序抄写在纸上，并妥善保管
        </Text>

        <Card style={styles.warningCard} variant="outlined">
          <Text style={styles.warningTitle}>🔒 重要提示</Text>
          <Text style={styles.warningText}>
            • 请使用纸笔抄写，不要截屏{"\n"}• 请勿通过网络传输或存储{"\n"}•
            请保存在安全的地方{"\n"}• 任何人获得助记词都可以控制您的资产
          </Text>
        </Card>

        <Card style={styles.mnemonicCard}>
          <MnemonicGrid words={words} columns={2} showIndex={true} />
        </Card>

        <Button
          title="我已备份，继续验证"
          onPress={handleConfirm}
          variant="primary"
        />
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
  warningCard: {
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
  },
  warningTitle: {
    ...typography.h4,
    color: colors.status.warning,
    marginBottom: spacing.sm,
  },
  warningText: {
    ...typography.caption,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  mnemonicCard: {
    marginBottom: spacing.lg,
  },
});
