import 'package:http/http.dart';
import 'package:web3dart/web3dart.dart';

import '../models/models.dart';

class EvmService {
  static Web3Client _client(String rpcUrl) {
    return Web3Client(rpcUrl, Client());
  }

  static Future<double> getNativeBalance({required String rpcUrl, required String address}) async {
    final client = _client(rpcUrl);
    try {
      final etherAmount = await client.getBalance(EthereumAddress.fromHex(address));
      return etherAmount.getValueInUnit(EtherUnit.ether);
    } finally {
      client.dispose();
    }
  }

  static Future<String> sendNativeTransaction({
    required String rpcUrl,
    required int chainId,
    required String privateKeyHex,
    required String to,
    required double amount,
  }) async {
    final client = _client(rpcUrl);
    try {
      final credentials = EthPrivateKey.fromHex(privateKeyHex);
      final txHash = await client.sendTransaction(
        credentials,
        Transaction(
          to: EthereumAddress.fromHex(to),
          value: EtherAmount.fromBase10String(EtherUnit.ether, amount.toString()),
        ),
        chainId: chainId,
        fetchChainIdFromNetworkId: false,
      );

      return txHash;
    } finally {
      client.dispose();
    }
  }

  static Future<WalletTransaction?> fetchTxReceiptAsModel({
    required String rpcUrl,
    required WalletTransaction tx,
  }) async {
    final client = _client(rpcUrl);
    try {
      final receipt = await client.getTransactionReceipt(tx.hash);
      if (receipt == null) {
        return null;
      }
      return WalletTransaction(
        hash: tx.hash,
        amount: tx.amount,
        symbol: tx.symbol,
        from: tx.from,
        to: tx.to,
        createdAt: tx.createdAt,
        status: receipt.status ?? false ? TxStatus.success : TxStatus.failed,
        isSend: tx.isSend,
        network: tx.network,
        gasFee: tx.gasFee,
        nonce: tx.nonce,
        note: tx.note,
      );
    } finally {
      client.dispose();
    }
  }
}
