/**
 * 导入钱包页面 - 参考 Rabby Wallet 设计
 * 支持助记词和私钥导入
 */

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, typography, spacing } from "@/theme";
import { Button } from "@components/common/Button";
import { Input } from "@components/common/Input";
import { Card } from "@components/common/Card";
import { useWalletStore } from "@store/walletStore";
import { isValidMnemonic, isValidPrivateKey } from "@utils/validation";
import type { AuthScreenNavigationProp } from "@/types/navigation.types";

interface ImportWalletScreenProps {
  navigation: AuthScreenNavigationProp<"ImportWallet">;
}

type ImportType = "mnemonic" | "privateKey";

export const ImportWalletScreen: React.FC<ImportWalletScreenProps> = ({
  navigation,
}) => {
  const [importType, setImportType] = useState<ImportType>("mnemonic");
  const [walletName, setWalletName] = useState("");
  const [mnemonic, setMnemonic] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    mnemonic?: string;
    privateKey?: string;
  }>({});

  const { importWallet } = useWalletStore();

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!walletName.trim()) {
      newErrors.name = "请输入钱包名称";
    }

    if (importType === "mnemonic") {
      if (!mnemonic.trim()) {
        newErrors.mnemonic = "请输入助记词";
      } else if (!isValidMnemonic(mnemonic.trim())) {
        newErrors.mnemonic = "助记词格式不正确";
      }
    } else {
      if (!privateKey.trim()) {
        newErrors.privateKey = "请输入私钥";
      } else if (!isValidPrivateKey(privateKey.trim())) {
        newErrors.privateKey = "私钥格式不正确";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImport = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const wallet = await importWallet(
        walletName.trim(),
        importType === "mnemonic" ? mnemonic.trim() : undefined,
        importType === "privateKey" ? privateKey.trim() : undefined
      );

      Alert.alert("成功", "钱包导入成功！", [
        {
          text: "完成",
          onPress: () => {
            console.log("钱包导入成功:", wallet.address);
          },
        },
      ]);
    } catch (error) {
      Alert.alert("错误", `导入钱包失败: ${error}`);
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
          <Text style={styles.title}>导入钱包</Text>
          <Text style={styles.subtitle}>通过助记词或私钥导入现有钱包</Text>

          {/* 导入类型选择 */}
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                importType === "mnemonic" && styles.typeButtonActive,
              ]}
              onPress={() => setImportType("mnemonic")}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  importType === "mnemonic" && styles.typeButtonTextActive,
                ]}
              >
                助记词
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeButton,
                importType === "privateKey" && styles.typeButtonActive,
              ]}
              onPress={() => setImportType("privateKey")}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  importType === "privateKey" && styles.typeButtonTextActive,
                ]}
              >
                私钥
              </Text>
            </TouchableOpacity>
          </View>

          {/* 安全提示 */}
          <Card style={styles.warningCard} variant="outlined">
            <Text style={styles.warningTitle}>🔒 安全提示</Text>
            <Text style={styles.warningText}>
              • 请确保在安全的环境下导入钱包{"\n"}
              • 不要在公共场所或他人面前输入{"\n"}
              • 导入后请妥善保管您的助记词/私钥{"\n"}
              • 钱包数据使用系统级加密存储
            </Text>
          </Card>

          {/* 钱包名称 */}
          <Input
            label="钱包名称"
            placeholder="例如：我的钱包"
            value={walletName}
            onChangeText={(text) => {
              setWalletName(text);
              if (errors.name) {
                setErrors((prev) => ({ ...prev, name: undefined }));
              }
            }}
            error={errors.name}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* 助记词输入 */}
          {importType === "mnemonic" && (
            <Input
              label="助记词"
              placeholder="请输入 12 或 24 个单词，用空格分隔"
              value={mnemonic}
              onChangeText={(text) => {
                setMnemonic(text);
                if (errors.mnemonic) {
                  setErrors((prev) => ({ ...prev, mnemonic: undefined }));
                }
              }}
              error={errors.mnemonic}
              multiline
              numberOfLines={4}
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.multilineInput}
            />
          )}

          {/* 私钥输入 */}
          {importType === "privateKey" && (
            <Input
              label="私钥"
              placeholder="请输入私钥（以 0x 开头）"
              value={privateKey}
              onChangeText={(text) => {
                setPrivateKey(text);
                if (errors.privateKey) {
                  setErrors((prev) => ({ ...prev, privateKey: undefined }));
                }
              }}
              error={errors.privateKey}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          )}

          <Button
            title="导入钱包"
            onPress={handleImport}
            variant="primary"
            loading={loading}
            disabled={loading}
            style={styles.importButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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
  typeSelector: {
    flexDirection: "row",
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 4,
  },
  typeButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: "center",
    borderRadius: 8,
  },
  typeButtonActive: {
    backgroundColor: colors.primary,
  },
  typeButtonText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  typeButtonTextActive: {
    color: colors.text.primary,
    fontWeight: "600",
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
  multilineInput: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  importButton: {
    marginTop: spacing.lg,
  },
});
