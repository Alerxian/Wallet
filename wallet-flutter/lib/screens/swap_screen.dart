import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../state/wallet_app_state.dart';
import '../widgets/common.dart';

class SwapScreen extends StatefulWidget {
  const SwapScreen({super.key});

  @override
  State<SwapScreen> createState() => _SwapScreenState();
}

class _SwapScreenState extends State<SwapScreen> {
  final amountController = TextEditingController(text: '1.0');
  double slippage = 0.5;
  String? from;
  String? to;

  @override
  void dispose() {
    amountController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<WalletAppState>();
    final symbols = state.tokens.map((t) => t.symbol).toList();
    from ??= symbols.isNotEmpty ? symbols.first : 'ETH';
    to ??= symbols.length > 1 ? symbols[1] : from;

    final amount = double.tryParse(amountController.text) ?? 0;
    final quote = amount * 3200;

    return ScreenShell(
      title: '代币兑换',
      body: Column(
        children: [
          SectionCard(
            child: Column(
              children: [
                DropdownButtonFormField<String>(
                  initialValue: from,
                  items: symbols.map((s) => DropdownMenuItem(value: s, child: Text(s))).toList(),
                  onChanged: (value) => setState(() => from = value),
                  decoration: const InputDecoration(labelText: '卖出'),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  initialValue: to,
                  items: symbols.map((s) => DropdownMenuItem(value: s, child: Text(s))).toList(),
                  onChanged: (value) => setState(() => to = value),
                  decoration: const InputDecoration(labelText: '买入'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: amountController,
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  decoration: const InputDecoration(labelText: '数量'),
                  onChanged: (_) => setState(() {}),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    const Text('滑点'),
                    Expanded(
                      child: Slider(
                        value: slippage,
                        min: 0.1,
                        max: 3,
                        divisions: 29,
                        label: '${slippage.toStringAsFixed(1)}%',
                        onChanged: (value) => setState(() => slippage = value),
                      ),
                    ),
                    Text('${slippage.toStringAsFixed(1)}%'),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          SectionCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('聚合报价（模拟）', style: Theme.of(context).textTheme.titleSmall),
                const SizedBox(height: 8),
                Text('预计可得: ${quote.toStringAsFixed(2)} $to'),
                const Text('Route: Uniswap v3 -> 1inch Router'),
                const Text('Price impact: 0.22%'),
                const Text('估算 Gas: 0.0038 ETH'),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('已提交兑换交易（模拟）')),
                      );
                    },
                    child: const Text('执行兑换'),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
