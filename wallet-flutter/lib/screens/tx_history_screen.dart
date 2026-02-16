import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../models/models.dart';
import '../state/wallet_app_state.dart';
import '../widgets/common.dart';

class TxHistoryScreen extends StatelessWidget {
  const TxHistoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<WalletAppState>();
    final timeFmt = DateFormat('MM-dd HH:mm');

    return Scaffold(
      appBar: AppBar(title: const Text('交易历史')),
      body: state.transactions.isEmpty
          ? const Padding(
              padding: EdgeInsets.all(16),
              child: EmptyHint(message: '暂无交易记录'),
            )
          : ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: state.transactions.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (context, index) {
                final tx = state.transactions[index];
                final amount = tx.isSend ? '-${tx.amount}' : '+${tx.amount}';
                return Card(
                  child: ListTile(
                    title: Text('$amount ${tx.symbol}'),
                    subtitle: Text(
                      '${timeFmt.format(tx.createdAt)} · ${tx.network}\nGas ${tx.gasFee} · Nonce ${tx.nonce}\n${tx.hash}',
                    ),
                    isThreeLine: true,
                    trailing: _status(tx.status),
                  ),
                );
              },
            ),
    );
  }

  Widget _status(TxStatus status) {
    switch (status) {
      case TxStatus.pending:
        return const Icon(Icons.timelapse, color: Colors.orange);
      case TxStatus.success:
        return const Icon(Icons.check_circle, color: Colors.green);
      case TxStatus.failed:
        return const Icon(Icons.error, color: Colors.red);
    }
  }
}
