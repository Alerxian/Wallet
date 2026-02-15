/**
 * 生成助记词页面
 */

import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, typography, spacing } from "@/theme";
import { Button } from "@components/common/Button";
import { Card } from "@components/common/Card";
import { MnemonicGrid } from "@components/wallet/MnemonicGrid";
import { WalletService } from "@services/WalletService";
import {
  MnemonicLength,
  MnemonicWord as MnemonicWordType,
} from "@/types/wallet.types";
import { useScreenProtection } from "@hooks/useScreenProtection";
import type { AuthScreenNavigationProp } from "@/types/navigation.types";

interface GenerateMnemonicScreenProps {
  navigation: AuthScreenNavigationProp<"GenerateMnemonic">;
  route: { params: { mnemonicLength: 12 | 24 } };
}

export const GenerateMnemonicScreen: React.FC<GenerateMnemonicScreenProps> = ({
  navigation,
  route,
}) => {
  const [mnemonic, setMnemonic] = useState<string>("");
  const [words, setWords] = useState<MnemonicWordType[]>([]);
  const [isRevealed, setIsRevealed] = useState(false);

  // 启用截屏保护
  useScreenProtection(isRevealed);

  const mnemonicLength = route.params?.mnemonicLength || 12;

  useEffect(() => {
    generateMnemonic();
  }, []);

  const generateMnemonic = async () => {
    console.log("生成助记词，长度：", mnemonicLength);
    try {
      const newMnemonic = await WalletService.generateMnemonic(
        mnemonicLength as MnemonicLength,
      );
      console.log(newMnemonic, "newMnemonic");
      setMnemonic(newMnemonic);

      const wordArray = newMnemonic.split(" ").map((word, index) => ({
        index,
        word,
        selected: false,
      }));
      setWords(wordArray);
    } catch (error) {
      Alert.alert("错误", "生成助记词失败，请重试");
    }
  };

  const handleReveal = () => {
    setIsRevealed(true);
  };

  const handleNext = () => {
    if (!isRevealed) {
      Alert.alert("提示", "请先查看助记词");
      return;
    }

    navigation.navigate("BackupMnemonic", { mnemonic });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>生成助记词</Text>
        <Text style={styles.subtitle}>
          这是您钱包的唯一凭证，请务必妥善保管
        </Text>

        <Card style={styles.warningCard} variant="outlined">
          <Text style={styles.warningTitle}>⚠️ 安全提示</Text>
          <Text style={styles.warningText}>
            • 助记词是恢复钱包的唯一方式{"\n"}• 请勿截屏或拍照{"\n"}•
            请勿通过网络传输{"\n"}• 请勿告诉任何人{"\n"}•
            丢失助记词将无法找回资产
          </Text>
        </Card>

        {!isRevealed ? (
          <Card style={styles.revealCard}>
            <Text style={styles.revealText}>点击下方按钮查看您的助记词</Text>
            <Button
              title="查看助记词"
              onPress={handleReveal}
              variant="primary"
              style={styles.revealButton}
            />
          </Card>
        ) : (
          <Card style={styles.mnemonicCard}>
            <Text style={styles.mnemonicTitle}>
              您的 {mnemonicLength} 词助记词
            </Text>
            <MnemonicGrid words={words} columns={2} showIndex={true} />
          </Card>
        )}

        <View style={styles.actions}>
          <Button
            title="重新生成"
            onPress={generateMnemonic}
            variant="outline"
            style={styles.actionButton}
          />
          <Button
            title="下一步"
            onPress={handleNext}
            variant="primary"
            style={styles.actionButton}
            disabled={!isRevealed}
          />
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
  revealCard: {
    alignItems: "center",
    paddingVertical: spacing.xl,
    marginBottom: spacing.lg,
  },
  revealText: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
    textAlign: "center",
  },
  revealButton: {
    minWidth: 200,
  },
  mnemonicCard: {
    marginBottom: spacing.lg,
  },
  mnemonicTitle: {
    ...typography.h4,
    color: colors.text.primary,
    marginBottom: spacing.md,
    textAlign: "center",
  },
  actions: {
    flexDirection: "row",
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
});
