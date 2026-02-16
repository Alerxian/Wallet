import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../state/wallet_app_state.dart';
import '../widgets/common.dart';

class HardwareWalletScreen extends StatelessWidget {
  const HardwareWalletScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<WalletAppState>();

    return ScreenShell(
      title: '硬件钱包',
      body: Column(
        children: [
          const SectionCard(
            child: Text('此处为框架/示例：实际需接入 Ledger/Trezor SDK 与蓝牙权限。'),
          ),
          const SizedBox(height: 12),
          for (final device in state.hardwareDevices)
            Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: SectionCard(
                child: Row(
                  children: [
                    Icon(device.type == 'Ledger' ? Icons.usb : Icons.shield),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(device.name, style: Theme.of(context).textTheme.titleSmall),
                          Text(device.connected ? '已连接' : '未连接'),
                        ],
                      ),
                    ),
                    FilledButton.tonal(
                      onPressed: () {
                        ScaffoldMessenger.of(context)
                            .showSnackBar(const SnackBar(content: Text('示例项目未实现硬件连接')));
                      },
                      child: const Text('连接'),
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
