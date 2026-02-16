import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../state/wallet_app_state.dart';
import '../ui/routes.dart';
import '../widgets/common.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<WalletAppState>();

    return ScreenShell(
      title: '设置',
      body: Column(
        children: [
          SectionCard(
            child: Column(
              children: [
                DropdownButtonFormField<ThemeMode>(
                  initialValue: state.themeMode,
                  decoration: const InputDecoration(labelText: '主题'),
                  items: const [
                    DropdownMenuItem(value: ThemeMode.system, child: Text('跟随系统')),
                    DropdownMenuItem(value: ThemeMode.light, child: Text('浅色')),
                    DropdownMenuItem(value: ThemeMode.dark, child: Text('深色')),
                  ],
                  onChanged: (mode) {
                    if (mode != null) {
                      context.read<WalletAppState>().updateTheme(mode);
                    }
                  },
                ),
                const SizedBox(height: 10),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('首页显示安全提示'),
                  subtitle: const Text('关闭后首页不显示提示卡片'),
                  value: state.showWelcomeBanner,
                  onChanged: (value) => context.read<WalletAppState>().setShowWelcomeBanner(value),
                ),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('启用生物识别'),
                  subtitle: const Text('用于敏感操作二次验证'),
                  value: state.biometricEnabled,
                  onChanged: (value) => context.read<WalletAppState>().setBiometricEnabled(value),
                ),
                DropdownButtonFormField<int>(
                  initialValue: state.autoLockMinutes,
                  decoration: const InputDecoration(labelText: '自动锁定时间'),
                  items: const [
                    DropdownMenuItem(value: 1, child: Text('1 分钟')),
                    DropdownMenuItem(value: 5, child: Text('5 分钟')),
                    DropdownMenuItem(value: 15, child: Text('15 分钟')),
                    DropdownMenuItem(value: 30, child: Text('30 分钟')),
                  ],
                  onChanged: (value) {
                    if (value != null) {
                      context.read<WalletAppState>().setAutoLockMinutes(value);
                    }
                  },
                ),
                const SizedBox(height: 10),
                Align(
                  alignment: Alignment.centerLeft,
                  child: FilledButton.tonalIcon(
                    onPressed: () async {
                      final ok = await context.read<WalletAppState>().authenticate();
                      if (!context.mounted) return;
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text(ok ? '生物识别验证成功' : '生物识别验证失败或设备不支持')),
                      );
                    },
                    icon: const Icon(Icons.fingerprint),
                    label: const Text('立即验证生物识别'),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          SectionCard(
            child: Column(
              children: [
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('钱包管理'),
                  subtitle: Text(state.currentAccount?.name ?? '未选择'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => Navigator.pushNamed(context, Routes.wallets),
                ),
                const Divider(),
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('网络管理'),
                  subtitle: Text(state.currentNetwork?.name ?? '-'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => Navigator.pushNamed(context, Routes.networks),
                ),
                const Divider(),
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('代币管理'),
                  subtitle: const Text('隐藏/显示代币'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => Navigator.pushNamed(context, Routes.tokens),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          SectionCard(
            child: Column(
              children: [
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('全局搜索'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => Navigator.pushNamed(context, Routes.search),
                ),
                const Divider(),
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('清空本地数据'),
                  subtitle: const Text('删除所有钱包与历史（示例）'),
                  trailing: const Icon(Icons.delete_forever),
                  onTap: () async {
                    await context.read<WalletAppState>().clearAll();
                    if (!context.mounted) return;
                    Navigator.pushNamedAndRemoveUntil(context, Routes.welcome, (route) => false);
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
