/**
 * NFT 详情界面
 * 显示 NFT 的详细信息和属性
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import type { MainStackParamList, MainScreenNavigationProp } from '@/types/navigation.types';
import { colors, typography, spacing } from '@/theme';
import { Card } from '@components/common/Card';
import { Button } from '@components/common/Button';
import { useWalletStore } from '@store/walletStore';
import { useNetworkStore } from '@store/networkStore';
import { NFTService, NFT } from '@/services/NFTService';

type NFTDetailRouteProp = RouteProp<MainStackParamList, 'NFTDetail'>;

export const NFTDetailScreen: React.FC = () => {
  const route = useRoute<NFTDetailRouteProp>();
  const navigation = useNavigation<MainScreenNavigationProp<'NFTDetail'>>();
  const { currentWallet } = useWalletStore();
  const { currentNetwork } = useNetworkStore();

  const { contract, tokenId } = route.params;

  const [nft, setNft] = useState<NFT | null>(null);
  const [loading, setLoading] = useState(false);

  // 加载 NFT 详情
  const loadNFTDetail = async () => {
    try {
      setLoading(true);
      const nftData = await NFTService.getNFTMetadata(
        contract,
        tokenId,
        currentNetwork.chainId as any
      );
      setNft(nftData);
    } catch (error: any) {
      console.error('加载 NFT 详情失败:', error);
      Alert.alert('错误', error.message || '加载 NFT 详情失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNFTDetail();
  }, [contract, tokenId, currentNetwork]);

  // 转移 NFT
  const handleTransfer = () => {
    if (!nft) return;

    Alert.alert(
      '转移 NFT',
      '此功能需要集成交易签名',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          onPress: () => {
            // TODO: 实现 NFT 转移功能
            Alert.alert('提示', 'NFT 转移功能待实现');
          },
        },
      ]
    );
  };

  // 在区块浏览器中查看
  const handleViewOnExplorer = () => {
    if (!nft) return;

    const explorerUrl = `${currentNetwork.explorerUrl}/token/${contract}?a=${tokenId}`;
    Linking.openURL(explorerUrl);
  };

  if (loading || !nft) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* NFT 图片 */}
        <Card style={styles.imageCard}>
          <Image
            source={{ uri: nft.image || 'https://via.placeholder.com/400' }}
            style={styles.nftImage}
            resizeMode="contain"
          />
        </Card>

        {/* NFT 信息 */}
        <Card style={styles.infoCard}>
          <Text style={styles.collectionName}>{nft.collectionName}</Text>
          <Text style={styles.nftName}>
            {NFTService.formatNFTName(nft.name, nft.tokenId)}
          </Text>
          {nft.description && (
            <Text style={styles.description}>{nft.description}</Text>
          )}

          {/* Token 信息 */}
          <View style={styles.tokenInfo}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>合约地址</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {contract.substring(0, 10)}...{contract.substring(contract.length - 8)}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Token ID</Text>
              <Text style={styles.infoValue}>{tokenId}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Token 标准</Text>
              <Text style={styles.infoValue}>{nft.tokenType}</Text>
            </View>
            {nft.tokenType === 'ERC1155' && nft.balance && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>数量</Text>
                <Text style={styles.infoValue}>{nft.balance}</Text>
              </View>
            )}
          </View>
        </Card>

        {/* 属性 */}
        {nft.metadata.attributes && nft.metadata.attributes.length > 0 && (
          <Card style={styles.attributesCard}>
            <Text style={styles.sectionTitle}>属性</Text>
            <View style={styles.attributesGrid}>
              {nft.metadata.attributes.map((attr, index) => (
                <View key={index} style={styles.attributeItem}>
                  <Text style={styles.attributeType}>{attr.trait_type}</Text>
                  <Text style={styles.attributeValue}>{attr.value}</Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* 操作按钮 */}
        <View style={styles.actions}>
          <Button
            title="转移"
            onPress={handleTransfer}
            style={styles.actionButton}
          />
          <Button
            title="在浏览器中查看"
            onPress={handleViewOnExplorer}
            variant="secondary"
            style={styles.actionButton}
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
    padding: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  imageCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  nftImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: colors.surfaceLight,
  },
  infoCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  collectionName: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  nftName: {
    ...typography.h2,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  description: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: spacing.md,
    lineHeight: 22,
  },
  tokenInfo: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  infoLabel: {
    ...typography.body,
    color: colors.text.secondary,
  },
  infoValue: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
    marginLeft: spacing.md,
  },
  attributesCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  attributesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  attributeItem: {
    width: '48%',
    backgroundColor: colors.surfaceLight,
    padding: spacing.md,
    borderRadius: 8,
    margin: spacing.xs,
  },
  attributeType: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  attributeValue: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
  },
  actions: {
    marginTop: spacing.md,
  },
  actionButton: {
    marginBottom: spacing.sm,
  },
});
