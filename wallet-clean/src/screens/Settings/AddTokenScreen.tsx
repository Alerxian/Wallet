/**
 * 添加自定义代币界面
 */

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { typography, spacing } from "@/theme";
import { useTheme } from "@/theme/ThemeContext";
import { Input } from "@components/common/Input";
import { Button } from "@components/common/Button";
import { Card } from "@components/common/Card";
import { useTokenStore } from "@store/tokenStore";
import { useNetworkStore } from "@store/networkStore";
import { TokenService } from "@/services/TokenService";
import { Token } from "@/types/token.types";

export const AddTokenScreen: React.FC = () => {
  const navigation = useNavigation();
  const { addCustomToken } = useTokenStore();
  const { currentNetwork } = useNetworkStore();
  const { theme: colors } = useTheme();

  const [contractAddress, setContractAddress] = useState("");
  const [tokenInfo, setTokenInfo] = useState<Token | null>(null);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  const styles = createStyles(colors);

  const handleSearchToken = async () => {
    if (!contractAddress) {
      Alert.alert("错误", "请输入代币合约地址");
      return;
    }

    try {
      setLoading(true);
      setTokenInfo(null);

      const info = await TokenService.getTokenInfo(
        contractAddress,
        currentNetwork.chainId as any
      );

      setTokenInfo({
        address: contractAddress,
        symbol: info.symbol,
        name: info.name,
        decimals: info.decimals,
        chainId: currentNetwork.chainId,
      });
    } catch (error: any) {
      Alert.alert("错误", error.message || "获取代币信息失败");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToken = async () => {
    if (!tokenInfo) return;

    try {
      setAdding(true);
      await addCustomToken(tokenInfo);

      Alert.alert("成功", "代币已添加", [
        {
          text: "确定",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      Alert.alert("错误", error.message || "添加代币失败");
    } finally {
      setAdding(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.description}>
          输入代币合约地址以添加自定义 ERC-20 代币
        </Text>

        <View style={styles.networkInfo}>
          <Text style={styles.networkLabel}>当前网络</Text>
          <Text style={styles.networkName}>{currentNetwork.name}</Text>
        </View>

        <Input
          label="代币合约地址"
          placeholder="0x..."
          value={contractAddress}
          onChangeText={setContractAddress}
          autoCapitalize="none"
        />

        <Button
          title="搜索代币"
          onPress={handleSearchToken}
          loading={loading}
          style={styles.searchButton}
        />

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>正在获取代币信息...</Text>
          </View>
        )}

        {tokenInfo && (
          <Card style={styles.tokenCard}>
            <Text style={styles.cardTitle}>代币信息</Text>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>名称</Text>
              <Text style={styles.infoValue}>{tokenInfo.name}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>符号</Text>
              <Text style={styles.infoValue}>{tokenInfo.symbol}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>精度</Text>
              <Text style={styles.infoValue}>{tokenInfo.decimals}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>合约地址</Text>
              <Text style={styles.infoValueSmall} numberOfLines={1}>
                {tokenInfo.address}
              </Text>
            </View>

            <Button
              title="添加代币"
              onPress={handleAddToken}
              loading={adding}
              style={styles.addButton}
            />
          </Card>
        )}

        <View style={styles.warning}>
          <Text style={styles.warningText}>
            ⚠️ 警告：请仅添加您信任的代币。恶意代币可能会导致资产损失。
          </Text>
        </View>
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
  networkInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.lg,
  },
  networkLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  networkName: {
    ...typography.bodyBold,
    color: colors.text.primary,
  },
  searchButton: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: spacing.xl,
  },
  loadingText: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  tokenCard: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  cardTitle: {
    ...typography.h4,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    ...typography.body,
    color: colors.text.secondary,
  },
  infoValue: {
    ...typography.bodyBold,
    color: colors.text.primary,
  },
  infoValueSmall: {
    ...typography.caption,
    color: colors.text.primary,
    maxWidth: "60%",
  },
  addButton: {
    marginTop: spacing.lg,
  },
  warning: {
    backgroundColor: colors.warning + "20",
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.xl,
  },
  warningText: {
    ...typography.caption,
    color: colors.warning,
  },
});