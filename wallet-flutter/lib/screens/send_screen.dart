import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../state/wallet_app_state.dart';
import '../widgets/common.dart';

class SendScreen extends StatefulWidget {
  const SendScreen({super.key});

  @override
  State<SendScreen> createState() => _SendScreenState();
}

class _SendScreenState extends State<SendScreen> {
  final toController = TextEditingController();
  final amountController = TextEditingController();
  final noteController = TextEditingController();

  String symbol = 'ETH';
  bool submitting = false;

  @override
  void dispose() {
    toController.dispose();
    amountController.dispose();
    noteController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<WalletAppState>();
    final networkSymbol = state.currentNetwork?.symbol ?? 'ETH';
    final symbols = state.tokens.map((t) => t.symbol).where((s) => s == networkSymbol || (s == 'ETH' && networkSymbol == 'ETH')).toList();
    if (!symbols.contains(symbol) && symbols.isNotEmpty) {
      symbol = symbols.first;
    }

    return ScreenShell(
      title: '发送交易',
      body: Column(
        children: [
          SectionCard(
            child: Column(
              children: [
                DropdownButtonFormField<String>(
                  initialValue: symbol,
                  items: symbols.map((s) => DropdownMenuItem(value: s, child: Text(s))).toList(),
                  onChanged: (value) => setState(() => symbol = value ?? symbol),
                  decoration: const InputDecoration(labelText: '资产'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: toController,
                  decoration: const InputDecoration(labelText: '接收地址 (0x...)'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: amountController,
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  decoration: const InputDecoration(labelText: '数量'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: noteController,
                  maxLines: 2,
                  decoration: const InputDecoration(labelText: '备注 (可选)'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 10),
          const SectionCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('交易预览（示例）'),
                SizedBox(height: 8),
                Text('Gas 估算: 0.0017 ETH'),
                Text('预计确认: 20-45 秒'),
                Text('风险提示: 请确保目标地址正确'),
              ],
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: submitting
                  ? null
                  : () async {
                      final messenger = ScaffoldMessenger.of(context);
                      final navigator = Navigator.of(context);
                      final appState = context.read<WalletAppState>();
                      final to = toController.text.trim();
                      final amount = double.tryParse(amountController.text.trim());

                      if (!RegExp(r'^0x[a-fA-F0-9]{40}$').hasMatch(to)) {
                        messenger.showSnackBar(const SnackBar(content: Text('地址格式不正确')));
                        return;
                      }
                      if (amount == null || amount <= 0) {
                        messenger.showSnackBar(const SnackBar(content: Text('请输入有效数量')));
                        return;
                      }

                      if (state.biometricEnabled) {
                        final pass = await appState.authenticate();
                        if (!pass) {
                          messenger.showSnackBar(const SnackBar(content: Text('生物识别未通过，交易已取消')));
                          return;
                        }
                      }

                      setState(() => submitting = true);
                      await appState.send(
                            to: to,
                            amount: amount,
                            symbol: symbol,
                            note: noteController.text.trim(),
                          );
                      if (!mounted) return;
                      setState(() => submitting = false);
                      messenger.showSnackBar(const SnackBar(content: Text('交易已提交（模拟广播）')));
                      navigator.pop();
                    },
              child: Text(submitting ? '提交中...' : '确认发送'),
            ),
          ),
        ],
      ),
    );
  }
}
