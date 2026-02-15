/**
 * NFT 列表界面
 * 展示用户拥有的所有 NFT
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { MainScreenNavigationProp } from '@/types/navigation.types';
import { colors, typography, spacing } from '@/theme';
import { Card } from '@components/common/Card';
import { useWalletStore } from '@store/walletStore';
import { useNetworkStore } from '@store/networkStore';
import { NFTService, NFT } from '@/services/NFTService';

export const NFTListScreen: React.FC = () => {
  const navigation = useNavigation<MainScreenNavigationProp<'NFTList'>>();
  const { currentWallet } = useWalletStore();
  const { currentNetwork } = useNetworkStore();

  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // 加载 NFT 列表
  const loadNFTs = async () => {
    if (!currentWallet) return;

    try {
      setLoading(true);

      // 检查网络是否支持
      if (!NFTService.isSupportedNetwork(currentNetwork.chainId as any)) {
        Alert.alert('提示', '当前网络不支持 NFT 功能');
        return;
      }

      const nftList = await NFTService.getNFTs(
        currentWallet.address,
        currentNetwork.chainId as any
      );

      setNfts(nftList);
    } catch (error: any) {
      console.error('加载 NFT 失败:', error);
      Alert.alert('错误', error.message || '加载 NFT 失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNFTs();
  }, [currentWallet, currentNetwork]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNFTs();
    setRefreshing(false);
  };

  const renderNFT = ({ item }: { item: NFT }) => (
    <TouchableOpacity
      style={styles.nftCard}
      onPress={() =>
        navigation.navigate('NFTDetail', {
          contract: item.contract,
          tokenId: item.tokenId,
        })
      }
    >
      <Image
        source={{ uri: item.image || 'https://via.placeholder.com/150' }}
        style={styles.nftImage}
        resizeMode="cover"
      />
      <View style={styles.nftInfo}>
        <Text style={styles.nftName} numberOfLines={1}>
          {NFTService.formatNFTName(item.name, item.tokenId)}
        </Text>
        <Text style={styles.nftCollection} numberOfLines={1}>
          {item.collectionName || 'Unknown Collection'}
        </Text>
        {item.tokenType === 'ERC1155' && item.balance && (
          <Text style={styles.nftBalance}>x{item.balance}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  if (!currentWallet) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>暂无钱包</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {nfts.length === 0 && !loading ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>暂无 NFT</Text>
          <Text style={styles.emptySubtext}>
            {NFTService.isSupportedNetwork(currentNetwork.chainId as any)
              ? '您还没有任何 NFT'
              : '当前网络不支持 NFT 功能'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={nfts}
          renderItem={renderNFT}
          keyExtractor={item => `${item.contract}-${item.tokenId}`}
          numColumns={2}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    padding: spacing.sm,
  },
  nftCard: {
    flex: 1,
    margin: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
  },
  nftImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: colors.surfaceLight,
  },
  nftInfo: {
    padding: spacing.sm,
  },
  nftName: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  nftCollection: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  nftBalance: {
    ...typography.caption,
    color: colors.primary,
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  emptyText: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
