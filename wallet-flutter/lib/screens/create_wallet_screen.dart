import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../state/wallet_app_state.dart';
import '../ui/routes.dart';
import '../widgets/common.dart';

class CreateWalletScreen extends StatefulWidget {
  const CreateWalletScreen({super.key});

  @override
  State<CreateWalletScreen> createState() => _CreateWalletScreenState();
}

class _CreateWalletScreenState extends State<CreateWalletScreen> {
  int words = 12;
  bool loading = false;

  @override
  Widget build(BuildContext context) {
    return ScreenShell(
      title: '创建钱包',
      body: SectionCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('助记词长度'),
            const SizedBox(height: 8),
            SegmentedButton<int>(
              segments: const [
                ButtonSegment(value: 12, label: Text('12 词')),
                ButtonSegment(value: 24, label: Text('24 词')),
              ],
              selected: {words},
              onSelectionChanged: (selected) {
                setState(() => words = selected.first);
              },
            ),
            const SizedBox(height: 16),
            const Text('说明：当前已使用 BIP39/BIP32 生成并派生 EVM 地址，请务必离线备份助记词。'),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: loading
                    ? null
                    : () async {
                        final navigator = Navigator.of(context);
                        final messenger = ScaffoldMessenger.of(context);
                        final appState = context.read<WalletAppState>();
                        setState(() => loading = true);
                        await appState.createWallet(words: words);
                        if (!mounted) return;
                        final mnemonic = appState.currentAccount?.mnemonic;
                        if (mnemonic != null && mnemonic.isNotEmpty) {
                          await showDialog<void>(
                            context: navigator.context,
                            builder: (context) {
                              return AlertDialog(
                                title: const Text('请立即备份助记词'),
                                content: SelectableText(mnemonic),
                                actions: [
                                  TextButton(onPressed: () => Navigator.pop(context), child: const Text('已备份')),
                                ],
                              );
                            },
                          );
                        } else {
                          messenger.showSnackBar(const SnackBar(content: Text('未生成助记词，请检查实现')));
                        }
                        navigator.pushNamedAndRemoveUntil(
                          Routes.home,
                          (route) => false,
                        );
                      },
                child: Text(loading ? '创建中...' : '继续'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
