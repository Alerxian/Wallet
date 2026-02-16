import 'dart:math';

import 'package:bip32/bip32.dart' as bip32;
import 'package:bip39/bip39.dart' as bip39;
import 'package:web3dart/web3dart.dart';

class CreatedWallet {
  CreatedWallet({required this.address, required this.privateKeyHex, required this.mnemonic});

  final String address;
  final String privateKeyHex;
  final String mnemonic;
}

class ImportedWallet {
  ImportedWallet({required this.address, required this.privateKeyHex, this.mnemonic});

  final String address;
  final String privateKeyHex;
  final String? mnemonic;
}

class WalletCryptoService {
  static Future<CreatedWallet> createWallet({required int words}) async {
    final strength = words == 24 ? 256 : 128;
    final mnemonic = bip39.generateMnemonic(strength: strength);
    final seed = bip39.mnemonicToSeed(mnemonic);
    final root = bip32.BIP32.fromSeed(seed);
    final child = root.derivePath("m/44'/60'/0'/0/0");
    final keyBytes = child.privateKey;
    if (keyBytes == null) {
      throw Exception('无法生成私钥');
    }

    final credentials = EthPrivateKey(keyBytes);
    final address = credentials.address;

    return CreatedWallet(
      address: address.hexEip55,
      privateKeyHex: _bytesToHex(keyBytes),
      mnemonic: mnemonic,
    );
  }

  static Future<ImportedWallet> importFromInput(String input) async {
    final text = input.trim().replaceAll(RegExp(r'\s+'), ' ');
    if (text.isEmpty) {
      throw Exception('请输入助记词或私钥');
    }

    if (_isPrivateKey(text)) {
      final normalized = text.startsWith('0x') ? text : '0x$text';
    final credentials = EthPrivateKey.fromHex(normalized);
      final address = credentials.address;
      return ImportedWallet(address: address.hexEip55, privateKeyHex: normalized);
    }

    if (!bip39.validateMnemonic(text)) {
      throw Exception('助记词格式不正确');
    }

    final seed = bip39.mnemonicToSeed(text);
    final root = bip32.BIP32.fromSeed(seed);
    final child = root.derivePath("m/44'/60'/0'/0/0");
    final keyBytes = child.privateKey;
    if (keyBytes == null) {
      throw Exception('助记词派生失败');
    }
    final credentials = EthPrivateKey(keyBytes);
    final address = credentials.address;

    return ImportedWallet(
      address: address.hexEip55,
      privateKeyHex: _bytesToHex(keyBytes),
      mnemonic: text,
    );
  }

  static String generateFallbackPrivateKey() {
    final rnd = Random.secure();
    final bytes = List<int>.generate(32, (_) => rnd.nextInt(256));
    return _bytesToHex(bytes);
  }

  static bool _isPrivateKey(String value) {
    final noPrefix = value.startsWith('0x') ? value.substring(2) : value;
    return RegExp(r'^[0-9a-fA-F]{64}$').hasMatch(noPrefix);
  }

  static String _bytesToHex(List<int> bytes) {
    final buffer = StringBuffer('0x');
    for (final b in bytes) {
      buffer.write(b.toRadixString(16).padLeft(2, '0'));
    }
    return buffer.toString();
  }
}
