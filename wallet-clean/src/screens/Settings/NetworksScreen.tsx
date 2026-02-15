/**
 * 网络管理界面
 * 显示所有网络，支持切换和添加自定义网络
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { MainScreenNavigationProp } from "@/types/navigation.types";
import { colors, typography, spacing } from "@/theme";
import { Card } from "@components/common/Card";
import { Button } from "@components/common/Button";
import { useNetworkStore } from "@store/networkStore";
import { Network } from "@/types/network.types";

export const NetworksScreen: React.FC = () => {
  const navigation = useNavigation<MainScreenNavigationProp<"Networks">>();
  const {
    currentChainId,
    networks,
    customNetworks,
    setCurrentNetwork,
    init,
  } = useNetworkStore();

  useEffect(() => {
    init();
  }, []);

  const allNetworks = [...networks, ...customNetworks];

  const handleSelectNetwork = async (network: Network) => {
    try {
      await setCurrentNetwork(network.chainId as any);
      Alert.alert("成功", `已切换到 ${network.name}`);
    } catch (error) {
      Alert.alert("错误", "切换网络失败");
    }
  };

  const renderNetwork = ({ item }: { item: Network }) => {
    const isActive = item.chainId === currentChainId;

    return (
      <TouchableOpacity
        style={styles.networkItem}
        onPress={() => handleSelectNetwork(item)}
        disabled={isActive}
      >
        <View style={styles.networkLeft}>
          <View
            style={[
              styles.networkIcon,
              isActive && styles.networkIconActive,
            ]}
          >
            <Text style={styles.networkIconText}>
              {item.symbol.substring(0, 1)}
            </Text>
          </View>
          <View style={styles.networkInfo}>
            <Text style={styles.networkName}>{item.name}</Text>
            <Text style={styles.networkSymbol}>{item.symbol}</Text>
            {item.isTestnet && (
              <Text style={styles.testnetBadge}>测试网</Text>
            )}
          </View>
        </View>
        {isActive && (
          <View style={styles.activeBadge}>
            <Text style={styles.activeBadgeText}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* 主网 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>主网</Text>
          <Card style={styles.networkList}>
            {allNetworks
              .filter(n => !n.isTestnet)
              .map(network => (
                <View key={network.chainId}>
                  {renderNetwork({ item: network })}
                </View>
              ))}
          </Card>
        </View>

        {/* 测试网 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>测试网</Text>
          <Card style={styles.networkList}>
            {allNetworks
              .filter(n => n.isTestnet)
              .map(network => (
                <View key={network.chainId}>
                  {renderNetwork({ item: network })}
                </View>
              ))}
          </Card>
        </View>

        {/* 添加自定义网络按钮 */}
        <Button
          title="添加自定义网络"
          onPress={() => navigation.navigate("AddNetwork")}
          variant="secondary"
          style={styles.addButton}
        />
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
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  networkList: {
    padding: 0,
    overflow: "hidden",
  },
  networkItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  networkLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  networkIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  networkIconActive: {
    backgroundColor: colors.primary + "20",
  },
  networkIconText: {
    ...typography.h4,
    color: colors.text.primary,
  },
  networkInfo: {
    flex: 1,
  },
  networkName: {
    ...typography.bodyBold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  networkSymbol: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  testnetBadge: {
    ...typography.caption,
    color: colors.warning,
    marginTop: 2,
  },
  activeBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.status.success,
    justifyContent: "center",
    alignItems: "center",
  },
  activeBadgeText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  addButton: {
    marginTop: spacing.md,
  },
});
