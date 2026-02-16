import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../state/wallet_app_state.dart';
import '../widgets/common.dart';

class DefiScreen extends StatelessWidget {
  const DefiScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<WalletAppState>();
    final money = NumberFormat.currency(symbol: '\$');

    return ScreenShell(
      title: 'DeFi 仓位',
      body: Column(
        children: [
          for (final item in state.defiPositions)
            Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: SectionCard(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(item.protocol, style: Theme.of(context).textTheme.titleMedium),
                        Text(item.type, style: Theme.of(context).textTheme.bodySmall),
                      ],
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(money.format(item.valueUsd)),
                        Text('APY ${item.apy.toStringAsFixed(1)}%'),
                      ],
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
