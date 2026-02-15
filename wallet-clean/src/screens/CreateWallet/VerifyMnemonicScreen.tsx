/**
 * 验证助记词页面（核心功能）
 * 用户需要按正确顺序点击打乱的助记词
 */

import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, typography, spacing } from "@/theme";
import { Button } from "@components/common/Button";
import { Card } from "@components/common/Card";
import { MnemonicGrid } from "@components/wallet/MnemonicGrid";
import { shuffle } from "@utils/shuffle";
import { MnemonicWord as MnemonicWordType } from "@/types/wallet.types";
import type { AuthScreenNavigationProp } from "@/types/navigation.types";

interface VerifyMnemonicScreenProps {
  navigation: AuthScreenNavigationProp<"VerifyMnemonic">;
  route: { params: { mnemonic: string } };
}

export const VerifyMnemonicScreen: React.FC<VerifyMnemonicScreenProps> = ({
  navigation,
  route,
}) => {
  const { mnemonic } = route.params;

  const [originalWords, setOriginalWords] = useState<MnemonicWordType[]>([]);
  const [shuffledWords, setShuffledWords] = useState<MnemonicWordType[]>([]);
  const [selectedWords, setSelectedWords] = useState<MnemonicWordType[]>([]);

  useEffect(() => {
    initializeWords();
  }, []);

  const initializeWords = () => {
    const words = mnemonic.split(" ").map((word, index) => ({
      index,
      word,
      selected: false,
    }));

    setOriginalWords(words);

    // 打乱助记词顺序
    const shuffled = shuffle(words).map((w) => ({ ...w, selected: false }));
    setShuffledWords(shuffled);
  };

  const handleWordPress = (word: MnemonicWordType, arrayIndex: number) => {
    // 添加到已选择列表
    setSelectedWords((prev) => [...prev, word]);

    // 标记为已选择
    setShuffledWords((prev) =>
      prev.map((w, i) => (i === arrayIndex ? { ...w, selected: true } : w)),
    );
  };

  const handleRemoveWord = (word: MnemonicWordType, arrayIndex: number) => {
    // 从已选择列表移除
    setSelectedWords((prev) => prev.filter((_, i) => i !== arrayIndex));

    // 在打乱列表中取消选择
    setShuffledWords((prev) =>
      prev.map((w) =>
        w.word === word.word && w.index === word.index
          ? { ...w, selected: false }
          : w,
      ),
    );
  };

  const handleReset = () => {
    setSelectedWords([]);
    setShuffledWords((prev) => prev.map((w) => ({ ...w, selected: false })));
  };

  const handleVerify = () => {
    // 验证是否全部选择
    if (selectedWords.length !== originalWords.length) {
      Alert.alert("提示", "请选择所有助记词");
      return;
    }

    // 验证顺序是否正确
    const isCorrect = selectedWords.every(
      (word, index) => word.index === originalWords[index].index,
    );

    if (isCorrect) {
      Alert.alert("验证成功", "助记词顺序正确", [
        {
          text: "继续",
          onPress: () => navigation.navigate("SetPassword", { mnemonic }),
        },
      ]);
    } else {
      Alert.alert("验证失败", "助记词顺序不正确，请重新选择", [
        {
          text: "重试",
          onPress: handleReset,
        },
      ]);
    }
  };

  const progress = selectedWords.length / originalWords.length;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>验证助记词</Text>
        <Text style={styles.subtitle}>请按正确顺序点击下方的助记词</Text>

        {/* 进度条 */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[styles.progressFill, { width: `${progress * 100}%` }]}
            />
          </View>
          <Text style={styles.progressText}>
            {selectedWords.length} / {originalWords.length}
          </Text>
        </View>

        {/* 已选择的助记词 */}
        <Card style={styles.selectedCard}>
          <Text style={styles.sectionTitle}>已选择</Text>
          {selectedWords.length === 0 ? (
            <Text style={styles.emptyText}>请从下方选择助记词</Text>
          ) : (
            <MnemonicGrid
              words={selectedWords}
              columns={2}
              showIndex={true}
              onWordPress={handleRemoveWord}
            />
          )}
        </Card>

        {/* 打乱的助记词 */}
        <Card style={styles.shuffledCard}>
          <Text style={styles.sectionTitle}>请选择</Text>
          <MnemonicGrid
            words={shuffledWords}
            columns={3}
            showIndex={false}
            onWordPress={handleWordPress}
          />
        </Card>

        <View style={styles.actions}>
          <Button
            title="重置"
            onPress={handleReset}
            variant="outline"
            style={styles.actionButton}
          />
          <Button
            title="验证"
            onPress={handleVerify}
            variant="primary"
            style={styles.actionButton}
            disabled={selectedWords.length !== originalWords.length}
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
  progressContainer: {
    marginBottom: spacing.lg,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.surfaceLight,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.primary,
  },
  progressText: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: "center",
  },
  selectedCard: {
    marginBottom: spacing.lg,
    minHeight: 200,
  },
  shuffledCard: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  emptyText: {
    ...typography.body,
    color: colors.text.disabled,
    textAlign: "center",
    paddingVertical: spacing.xl,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
});
