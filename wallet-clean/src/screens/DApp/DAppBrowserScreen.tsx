import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { spacing, typography } from '@/theme';
import { Card } from '@components/common/Card';
import { Button } from '@components/common/Button';
import { StorageService } from '@/services/StorageService';
import { SecurityService } from '@/services/SecurityService';
import { Atmosphere } from '@components/common/Atmosphere';

const RECENT_DAPP_KEY = 'recent_dapps';

interface DAppSite {
  id: string;
  name: string;
  url: string;
  category: string;
}

const RECOMMENDED_SITES: DAppSite[] = [
  { id: 'uniswap', name: 'Uniswap', url: 'https://app.uniswap.org', category: 'DEX' },
  { id: 'aave', name: 'Aave', url: 'https://app.aave.com', category: '借贷' },
  { id: 'opensea', name: 'OpenSea', url: 'https://opensea.io', category: 'NFT' },
  { id: 'lido', name: 'Lido', url: 'https://stake.lido.fi', category: '质押' },
  { id: 'pancake', name: 'PancakeSwap', url: 'https://pancakeswap.finance', category: 'DEX' },
];

export const DAppBrowserScreen: React.FC = () => {
  const { theme: colors } = useTheme();
  const [inputUrl, setInputUrl] = useState('');
  const [recentSites, setRecentSites] = useState<DAppSite[]>([]);

  React.useEffect(() => {
    StorageService.getSecure(RECENT_DAPP_KEY)
      .then((raw) => {
        if (raw) {
          setRecentSites(JSON.parse(raw));
        }
      })
      .catch(() => undefined);
  }, []);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        content: { padding: spacing.md, gap: spacing.md },
        title: { ...typography.h3, color: colors.text.primary, marginBottom: spacing.xs },
        subtitle: { ...typography.caption, color: colors.text.secondary },
        inputRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
        input: {
          flex: 1,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 12,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          color: colors.text.primary,
          backgroundColor: colors.surfaceLight,
        },
        siteRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: spacing.sm,
          borderBottomWidth: 1,
          borderBottomColor: colors.divider,
        },
        siteName: { ...typography.bodyBold, color: colors.text.primary },
        siteMeta: { ...typography.caption, color: colors.text.secondary },
        openText: { ...typography.body, color: colors.primary },
        riskBanner: {
          backgroundColor: colors.warning + '20',
          borderWidth: 1,
          borderColor: colors.warning + '40',
          borderRadius: 10,
          padding: spacing.sm,
          marginTop: spacing.sm,
        },
        riskText: { ...typography.caption, color: colors.warning },
      }),
    [colors]
  );

  const normalizeUrl = (raw: string): string => {
    const trimmed = raw.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) return trimmed;
    return `https://${trimmed}`;
  };

  const openUrl = async (url: string) => {
    try {
      const normalized = normalizeUrl(url);
      if (!normalized) {
        Alert.alert('提示', '请输入有效地址');
        return;
      }

      const risk = SecurityService.assessUrl(normalized);
      if (risk.level === 'high') {
        Alert.alert('风险拦截', risk.findings.map((f) => `- ${f.title}`).join('\n'));
        return;
      }

      if (risk.level === 'medium') {
        const text = risk.findings.map((f) => `- ${f.title}${f.detail ? `: ${f.detail}` : ''}`).join('\n');
        Alert.alert('安全提醒', text, [
          { text: '取消', style: 'cancel' },
          {
            text: '继续打开',
            style: 'destructive',
            onPress: async () => {
              const canOpenRisk = await Linking.canOpenURL(normalized);
              if (!canOpenRisk) {
                Alert.alert('无法打开', '该链接不受支持');
                return;
              }
              await Linking.openURL(normalized);
            },
          },
        ]);
        return;
      }

      const canOpen = await Linking.canOpenURL(normalized);
      if (!canOpen) {
        Alert.alert('无法打开', '该链接不受支持');
        return;
      }

      await Linking.openURL(normalized);

      const host = normalized.replace(/^https?:\/\//, '').split('/')[0].toLowerCase();
      const matched = RECOMMENDED_SITES.find((s) => s.url === normalized);
      const record: DAppSite = matched || {
        id: `${host}-${Date.now()}`,
        name: host,
        url: normalized,
        category: '最近访问',
      };
      setRecentSites((prev) => {
        const dedup = prev.filter((s) => s.url !== normalized);
        const next = [record, ...dedup].slice(0, 8);
        StorageService.setSecure(RECENT_DAPP_KEY, JSON.stringify(next)).catch(() => undefined);
        return next;
      });
    } catch (error) {
      Alert.alert('打开失败', '请检查链接格式后重试');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Atmosphere />
      <FlatList
        data={RECOMMENDED_SITES}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <>
            <Card>
              <Text style={styles.title}>dApp 浏览器</Text>
              <Text style={styles.subtitle}>
                Demo 阶段先提供常用 dApp 快速入口和 URL 直达能力
              </Text>
              <View style={styles.inputRow}>
                <TextInput
                  value={inputUrl}
                  onChangeText={setInputUrl}
                  placeholder="输入 dApp URL，例如 app.uniswap.org"
                  placeholderTextColor={colors.text.secondary}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={styles.input}
                />
                <Button title="打开" onPress={() => openUrl(inputUrl)} />
              </View>
            </Card>
            <Card>
              <Text style={styles.title}>推荐 dApp</Text>
            </Card>

            {recentSites.length > 0 && (
              <Card>
                <Text style={styles.title}>最近访问</Text>
                {recentSites.map((site) => (
                  <TouchableOpacity
                    key={site.id}
                    style={styles.siteRow}
                    onPress={() => openUrl(site.url)}
                  >
                    <View>
                      <Text style={styles.siteName}>{site.name}</Text>
                      <Text style={styles.siteMeta}>{site.url}</Text>
                    </View>
                    <Text style={styles.openText}>打开</Text>
                  </TouchableOpacity>
                ))}
              </Card>
            )}

            <Card>
              <View style={styles.riskBanner}>
                <Text style={styles.riskText}>
                  安全建议：仅连接可信 dApp；签名前核对域名、目标地址与金额。
                </Text>
              </View>
            </Card>
          </>
        }
        renderItem={({ item }) => (
          <Card>
            <TouchableOpacity style={styles.siteRow} onPress={() => openUrl(item.url)}>
              <View>
                <Text style={styles.siteName}>{item.name}</Text>
                <Text style={styles.siteMeta}>{item.category}</Text>
              </View>
              <Text style={styles.openText}>打开</Text>
            </TouchableOpacity>
          </Card>
        )}
      />
    </SafeAreaView>
  );
};
