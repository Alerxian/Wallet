import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@/theme/ThemeContext';
import { spacing, typography } from '@/theme';
import { MainScreenNavigationProp } from '@/types/navigation.types';
import { useTokenStore } from '@/store/tokenStore';
import { useNetworkStore } from '@/store/networkStore';

type SearchItemType = 'token' | 'network' | 'action';

interface SearchItem {
  id: string;
  title: string;
  subtitle: string;
  type: SearchItemType;
  onPress: () => void;
}

export const GlobalSearchScreen: React.FC = () => {
  const navigation = useNavigation<MainScreenNavigationProp<'GlobalSearch'>>();
  const { theme: colors } = useTheme();
  const { tokens } = useTokenStore();
  const { networks, setCurrentNetwork } = useNetworkStore();
  const [query, setQuery] = useState('');

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
        searchInput: {
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 12,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          color: colors.text.primary,
          backgroundColor: colors.surfaceLight,
          marginBottom: spacing.md,
        },
        helperText: { ...typography.caption, color: colors.text.secondary, marginBottom: spacing.md },
        item: {
          paddingVertical: spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: colors.divider,
        },
        title: { ...typography.bodyBold, color: colors.text.primary },
        subtitle: { ...typography.caption, color: colors.text.secondary, marginTop: 2 },
        typeTag: {
          ...typography.caption,
          color: colors.primary,
          marginTop: spacing.xs,
        },
        empty: { ...typography.body, color: colors.text.secondary, textAlign: 'center', marginTop: spacing.xl },
      }),
    [colors]
  );

  const normalized = query.trim().toLowerCase();

  const actionItems: SearchItem[] = [
    {
      id: 'a-send',
      title: '发送资产',
      subtitle: '进入发送页面',
      type: 'action',
      onPress: () => navigation.navigate('Send', {}),
    },
    {
      id: 'a-receive',
      title: '接收资产',
      subtitle: '进入收款二维码页面',
      type: 'action',
      onPress: () => navigation.navigate('Receive'),
    },
    {
      id: 'a-swap',
      title: '代币兑换',
      subtitle: '进入 Swap 页面',
      type: 'action',
      onPress: () => navigation.navigate('Swap'),
    },
    {
      id: 'a-dapp',
      title: 'dApp 浏览器',
      subtitle: '打开 dApp 浏览页',
      type: 'action',
      onPress: () => navigation.navigate('DAppBrowser'),
    },
  ];

  const tokenItems: SearchItem[] = tokens.map((token) => ({
    id: `t-${token.chainId}-${token.address}`,
    title: token.symbol,
    subtitle: `${token.name} · ${token.address.slice(0, 8)}...${token.address.slice(-6)}`,
    type: 'token',
    onPress: () => navigation.navigate('Tokens'),
  }));

  const networkItems: SearchItem[] = networks.map((network) => ({
    id: `n-${network.chainId}`,
    title: network.name,
    subtitle: `${network.symbol} · Chain ID ${network.chainId}`,
    type: 'network',
    onPress: async () => {
      await setCurrentNetwork(network.chainId as any);
      navigation.navigate('Networks');
    },
  }));

  const results = [...actionItems, ...networkItems, ...tokenItems].filter((item) => {
    if (!normalized) return true;
    return (
      item.title.toLowerCase().includes(normalized) ||
      item.subtitle.toLowerCase().includes(normalized)
    );
  });

  return (
    <SafeAreaView style={styles.container}>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="搜索代币 / 网络 / 功能"
        placeholderTextColor={colors.text.secondary}
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.searchInput}
      />
      <Text style={styles.helperText}>支持快速跳转到发送、接收、网络、dApp 浏览等页面</Text>

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.item} onPress={item.onPress}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
            <Text style={styles.typeTag}>{item.type}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>未找到相关结果</Text>}
      />
    </SafeAreaView>
  );
};
