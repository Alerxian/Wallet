/**
 * 添加自定义网络界面
 */

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { typography, spacing } from "@/theme";
import { useTheme } from "@/theme/ThemeContext";
import { Input } from "@components/common/Input";
import { Button } from "@components/common/Button";
import { useNetworkStore } from "@store/networkStore";
import { Network } from "@/types/network.types";

export const AddNetworkScreen: React.FC = () => {
  const navigation = useNavigation();
  const { addCustomNetwork } = useNetworkStore();
  const { theme: colors } = useTheme();

  const [chainId, setChainId] = useState("");
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [rpcUrl, setRpcUrl] = useState("");
  const [explorerUrl, setExplorerUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const styles = createStyles(colors);

  const validateInputs = (): boolean => {
    if (!chainId || !name || !symbol || !rpcUrl) {
      Alert.alert("错误", "请填写所有必填字段");
      return false;
    }

    const chainIdNum = parseInt(chainId);
    if (isNaN(chainIdNum) || chainIdNum <= 0) {
      Alert.alert("错误", "Chain ID 必须是正整数");
      return false;
    }

    if (!rpcUrl.startsWith("http://") && !rpcUrl.startsWith("https://")) {
      Alert.alert("错误", "RPC URL 必须以 http:// 或 https:// 开头");
      return false;
    }

    if (explorerUrl && !explorerUrl.startsWith("http://") && !explorerUrl.startsWith("https://")) {
      Alert.alert("错误", "区块浏览器 URL 必须以 http:// 或 https:// 开头");
      return false;
    }

    return true;
  };

  const handleAddNetwork = async () => {
    if (!validateInputs()) return;

    try {
      setLoading(true);

      const network: Network = {
        chainId: parseInt(chainId),
        name,
        symbol: symbol.toUpperCase(),
        rpcUrl,
        explorerUrl: explorerUrl || `https://etherscan.io`,
        isTestnet: false,
      };

      await addCustomNetwork(network);
      Alert.alert("成功", "自定义网络已添加", [
        {
          text: "确定",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      Alert.alert("错误", error.message || "添加网络失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.description}>
          添加自定义 EVM 兼容网络。请确保 RPC URL 可用且安全。
        </Text>

        <View style={styles.form}>
          <Input
            label="Chain ID *"
            placeholder="例如: 1"
            value={chainId}
            onChangeText={setChainId}
            keyboardType="numeric"
          />

          <Input
            label="网络名称 *"
            placeholder="例如: Ethereum Mainnet"
            value={name}
            onChangeText={setName}
          />

          <Input
            label="代币符号 *"
            placeholder="例如: ETH"
            value={symbol}
            onChangeText={setSymbol}
            autoCapitalize="characters"
          />

          <Input
            label="RPC URL *"
            placeholder="https://..."
            value={rpcUrl}
            onChangeText={setRpcUrl}
            autoCapitalize="none"
          />

          <Input
            label="区块浏览器 URL"
            placeholder="https://..."
            value={explorerUrl}
            onChangeText={setExplorerUrl}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.warning}>
          <Text style={styles.warningText}>
            ⚠️ 警告：请仅添加您信任的网络。恶意 RPC 节点可能会记录您的 IP 地址和交易信息。
          </Text>
        </View>

        <Button
          title="添加网络"
          onPress={handleAddNetwork}
          loading={loading}
          style={styles.addButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  description: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
  form: {
    gap: spacing.md,
  },
  warning: {
    backgroundColor: colors.warning + "20",
    padding: spacing.md,
    borderRadius: 8,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  warningText: {
    ...typography.caption,
    color: colors.warning,
  },
  addButton: {
    marginBottom: spacing.xl,
  },
});