import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../state/wallet_app_state.dart';
import '../widgets/common.dart';

class WalletsScreen extends StatelessWidget {
  const WalletsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<WalletAppState>();

    return ScreenShell(
      title: '钱包管理',
      body: Column(
        children: [
          if (state.accounts.isEmpty)
            const EmptyHint(message: '还没有钱包，请先创建或导入。')
          else
            for (final account in state.accounts)
              Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: SectionCard(
                  child: Row(
                    children: [
                      CircleAvatar(
                        backgroundColor: Theme.of(context).colorScheme.primary.withValues(alpha: 0.15),
                        child: Icon(Icons.account_balance_wallet, color: Theme.of(context).colorScheme.primary),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    account.name,
                                    style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
                                  ),
                                ),
                                if (state.currentAccount?.id == account.id)
                                  const Chip(label: Text('当前')),
                              ],
                            ),
                            const SizedBox(height: 6),
                            Text(
                              account.address,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: Theme.of(context).textTheme.bodySmall,
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      IconButton(
                        onPressed: () async {
                          await context.read<WalletAppState>().switchAccount(account.id);
                          if (!context.mounted) return;
                          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('已切换钱包')));
                        },
                        icon: const Icon(Icons.swap_horiz),
                      ),
                      IconButton(
                        onPressed: () async {
                          await context.read<WalletAppState>().deleteAccount(account.id);
                          if (!context.mounted) return;
                          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('已删除钱包')));
                        },
                        icon: const Icon(Icons.delete_outline),
                      ),
                    ],
                  ),
                ),
              ),
        ],
      ),
    );
  }
}
