import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../state/wallet_app_state.dart';
import '../ui/routes.dart';
import '../widgets/common.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<WalletAppState>();
    final money = NumberFormat.currency(symbol: '\$', decimalDigits: 2);
    final account = state.currentAccount;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Rabby Aligned Wallet'),
        actions: [
          IconButton(
            onPressed: () => Navigator.pushNamed(context, Routes.search),
            icon: const Icon(Icons.search),
          ),
          IconButton(
            onPressed: () => Navigator.pushNamed(context, Routes.settings),
            icon: const Icon(Icons.tune),
          ),
        ],
      ),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () => context.read<WalletAppState>().refreshPortfolio(),
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              if (state.syncingPortfolio) ...[
                const LinearProgressIndicator(),
                const SizedBox(height: 8),
              ],
              if (state.lastSyncError != null) ...[
                SectionCard(
                  child: Text(
                    '同步失败：${state.lastSyncError}',
                    style: TextStyle(color: Theme.of(context).colorScheme.error),
                  ),
                ),
                const SizedBox(height: 12),
              ],
              if (state.showWelcomeBanner) ...[
                SectionCard(
                  child: Row(
                    children: [
                      Icon(Icons.verified_user, color: Theme.of(context).colorScheme.primary),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          '安全中心已启用：交易前请核对地址、网络与授权风险。',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
              ],
              HeroBalanceCard(
                title: account?.name ?? '未初始化钱包',
                address: account?.address ?? '-',
                value: money.format(state.totalAssetUsd),
                children: [
                  FilledButton.tonalIcon(
                    onPressed: () => Navigator.pushNamed(context, Routes.send),
                    icon: const Icon(Icons.north_east),
                    label: const Text('发送'),
                  ),
                  FilledButton.tonalIcon(
                    onPressed: () => Navigator.pushNamed(context, Routes.receive),
                    icon: const Icon(Icons.south_west),
                    label: const Text('接收'),
                  ),
                  FilledButton.tonalIcon(
                    onPressed: () => Navigator.pushNamed(context, Routes.swap),
                    icon: const Icon(Icons.swap_horiz),
                    label: const Text('Swap'),
                  ),
                  FilledButton.tonalIcon(
                    onPressed: () => Navigator.pushNamed(context, Routes.tx),
                    icon: const Icon(Icons.receipt_long),
                    label: const Text('交易'),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              SectionCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text('资产', style: Theme.of(context).textTheme.titleMedium),
                        const Spacer(),
                        TextButton(
                          onPressed: () => Navigator.pushNamed(context, Routes.tokens),
                          child: const Text('管理代币'),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    for (final token in state.tokens.where((t) => !t.hidden))
                      ListTile(
                        dense: true,
                        contentPadding: EdgeInsets.zero,
                        title: Text('${token.symbol}  ${token.balance.toStringAsFixed(4)}'),
                        subtitle: Text('${token.name} · 24h ${token.change24h.toStringAsFixed(2)}%'),
                        trailing: Text(money.format(token.valueUsd)),
                      ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  _quickTile(context, '钱包管理', Icons.account_balance_wallet, Routes.wallets),
                  _quickTile(context, '网络管理', Icons.hub, Routes.networks),
                  _quickTile(context, 'NFT', Icons.image, Routes.nft),
                  _quickTile(context, 'DeFi', Icons.savings, Routes.defi),
                  _quickTile(context, 'dApp', Icons.public, Routes.dapp),
                  _quickTile(context, '投资组合', Icons.pie_chart, Routes.portfolio),
                  _quickTile(context, '硬件钱包', Icons.usb, Routes.hardware),
                  _quickTile(context, '学习区', Icons.school, Routes.hello),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _quickTile(BuildContext context, String label, IconData icon, String route) {
    return InkWell(
      onTap: () => Navigator.pushNamed(context, route),
      child: Container(
        width: (MediaQuery.of(context).size.width - 48) / 2,
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 16),
        decoration: BoxDecoration(
          color: Theme.of(context).cardColor,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Theme.of(context).dividerColor.withValues(alpha: 0.2)),
        ),
        child: Row(
          children: [
            Icon(icon),
            const SizedBox(width: 8),
            Expanded(child: Text(label)),
          ],
        ),
      ),
    );
  }
}
