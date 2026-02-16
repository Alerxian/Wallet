import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../state/wallet_app_state.dart';
import '../widgets/common.dart';

class PortfolioScreen extends StatelessWidget {
  const PortfolioScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<WalletAppState>();
    final money = NumberFormat.currency(symbol: '\$', decimalDigits: 2);

    return ScreenShell(
      title: '投资组合',
      body: Column(
        children: [
          SectionCard(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                StatTile(label: '总资产', value: money.format(state.totalAssetUsd)),
                const StatTile(label: '24h', value: '+2.36%', color: Colors.green),
                const StatTile(label: '收益率', value: '+12.8%', color: Colors.green),
              ],
            ),
          ),
          const SizedBox(height: 12),
          SectionCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('资产分布 Top 5', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 12),
                for (final token in state.tokens.where((t) => !t.hidden))
                  Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: Row(
                      children: [
                        Expanded(child: Text(token.symbol)),
                        Expanded(
                          flex: 3,
                          child: LinearProgressIndicator(
                            value: state.totalAssetUsd == 0 ? 0 : token.valueUsd / state.totalAssetUsd,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          state.totalAssetUsd == 0
                              ? '0.0%'
                              : '${(token.valueUsd / state.totalAssetUsd * 100).toStringAsFixed(1)}%',
                        ),
                      ],
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
