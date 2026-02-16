import 'package:test/test.dart';
import 'package:wallet_flutter/models/models.dart';

void main() {
  group('Pure model tests', () {
    test('encode/decode transactions', () {
      final txs = [
        WalletTransaction(
          hash: '0xhash',
          amount: 2.5,
          symbol: 'ETH',
          from: '0xfrom',
          to: '0xto',
          createdAt: DateTime.parse('2026-02-10T10:10:10Z'),
          status: TxStatus.success,
          isSend: true,
          network: 'Ethereum',
          gasFee: 0.001,
          nonce: 10,
          note: 'note',
        ),
      ];

      final raw = encodeTxList(txs);
      final decoded = decodeTxList(raw);

      expect(decoded, hasLength(1));
      expect(decoded.first.hash, '0xhash');
      expect(decoded.first.status, TxStatus.success);
      expect(decoded.first.note, 'note');
    });

    test('encode/decode dapp history', () {
      final list = [
        DappHistoryItem(
          title: 'Uniswap',
          url: 'https://app.uniswap.org',
          visitedAt: DateTime.parse('2026-02-10T10:10:10Z'),
        ),
      ];

      final raw = encodeHistory(list);
      final decoded = decodeHistory(raw);

      expect(decoded.first.title, 'Uniswap');
      expect(decoded.first.url, 'https://app.uniswap.org');
    });

    test('network copyWith updates enabled only', () {
      final net = NetworkConfig(
        chainId: 1,
        name: 'Ethereum',
        symbol: 'ETH',
        rpcUrl: 'https://rpc.ankr.com/eth',
        explorer: 'https://etherscan.io',
      );

      final disabled = net.copyWith(enabled: false);

      expect(disabled.enabled, isFalse);
      expect(disabled.chainId, 1);
      expect(disabled.name, 'Ethereum');
    });
  });
}
