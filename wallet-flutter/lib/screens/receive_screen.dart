import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:qr_flutter/qr_flutter.dart';

import '../state/wallet_app_state.dart';
import '../widgets/common.dart';

class ReceiveScreen extends StatelessWidget {
  const ReceiveScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<WalletAppState>();
    final address = state.currentAccount?.address ?? '-';

    return ScreenShell(
      title: '接收资产',
      body: SectionCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            QrImageView(
              data: address,
              size: 220,
              backgroundColor: Colors.white,
            ),
            const SizedBox(height: 16),
            SelectableText(address, textAlign: TextAlign.center),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: FilledButton.icon(
                onPressed: () async {
                  await Clipboard.setData(ClipboardData(text: address));
                  if (!context.mounted) return;
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('地址已复制')));
                },
                icon: const Icon(Icons.copy),
                label: const Text('复制地址'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
