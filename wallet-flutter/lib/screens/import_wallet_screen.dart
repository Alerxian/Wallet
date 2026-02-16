import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../state/wallet_app_state.dart';
import '../ui/routes.dart';
import '../widgets/common.dart';

class ImportWalletScreen extends StatefulWidget {
  const ImportWalletScreen({super.key});

  @override
  State<ImportWalletScreen> createState() => _ImportWalletScreenState();
}

class _ImportWalletScreenState extends State<ImportWalletScreen> {
  final controller = TextEditingController();
  bool loading = false;

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ScreenShell(
      title: '导入钱包',
      body: SectionCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('助记词 / 私钥'),
            const SizedBox(height: 8),
            TextField(
              controller: controller,
              maxLines: 4,
              decoration: const InputDecoration(hintText: '输入助记词或私钥'),
            ),
            const SizedBox(height: 16),
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
                        try {
                          await appState.importWallet(controller.text);
                          if (!mounted) return;
                          navigator.pushNamedAndRemoveUntil(
                            Routes.home,
                            (route) => false,
                          );
                        } catch (e) {
                          setState(() => loading = false);
                          if (!mounted) return;
                          messenger.showSnackBar(
                            SnackBar(content: Text(e.toString())),
                          );
                        }
                      },
                child: Text(loading ? '导入中...' : '导入'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
