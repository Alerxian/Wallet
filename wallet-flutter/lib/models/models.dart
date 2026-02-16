import 'dart:convert';

enum TxStatus { pending, success, failed }

enum WalletSecretType { mnemonic, privateKey }

class WalletAccount {
  WalletAccount({
    required this.id,
    required this.name,
    required this.address,
    required this.secret,
    required this.secretType,
    required this.createdAt,
    this.mnemonic,
  });

  final String id;
  final String name;
  final String address;
  final String secret;
  final WalletSecretType secretType;
  final DateTime createdAt;
  final String? mnemonic;

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'address': address,
      'secret': secret,
      'secretType': secretType.name,
      'createdAt': createdAt.toIso8601String(),
      'mnemonic': mnemonic,
    };
  }

  factory WalletAccount.fromMap(Map<String, dynamic> map) {
    return WalletAccount(
      id: map['id'] as String,
      name: map['name'] as String,
      address: map['address'] as String,
      secret: map['secret'] as String,
      secretType: WalletSecretType.values.byName(map['secretType'] as String),
      createdAt: DateTime.parse(map['createdAt'] as String),
      mnemonic: map['mnemonic'] as String?,
    );
  }
}

class NetworkConfig {
  NetworkConfig({
    required this.chainId,
    required this.name,
    required this.symbol,
    required this.rpcUrl,
    required this.explorer,
    this.isCustom = false,
    this.enabled = true,
  });

  final int chainId;
  final String name;
  final String symbol;
  final String rpcUrl;
  final String explorer;
  final bool isCustom;
  final bool enabled;

  NetworkConfig copyWith({bool? enabled}) {
    return NetworkConfig(
      chainId: chainId,
      name: name,
      symbol: symbol,
      rpcUrl: rpcUrl,
      explorer: explorer,
      isCustom: isCustom,
      enabled: enabled ?? this.enabled,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'chainId': chainId,
      'name': name,
      'symbol': symbol,
      'rpcUrl': rpcUrl,
      'explorer': explorer,
      'isCustom': isCustom,
      'enabled': enabled,
    };
  }

  factory NetworkConfig.fromMap(Map<String, dynamic> map) {
    return NetworkConfig(
      chainId: map['chainId'] as int,
      name: map['name'] as String,
      symbol: map['symbol'] as String,
      rpcUrl: map['rpcUrl'] as String,
      explorer: map['explorer'] as String,
      isCustom: map['isCustom'] as bool? ?? false,
      enabled: map['enabled'] as bool? ?? true,
    );
  }
}

class TokenBalance {
  TokenBalance({
    required this.symbol,
    required this.name,
    required this.contract,
    required this.balance,
    required this.priceUsd,
    required this.change24h,
    required this.decimals,
    this.hidden = false,
  });

  final String symbol;
  final String name;
  final String contract;
  final double balance;
  final double priceUsd;
  final double change24h;
  final int decimals;
  final bool hidden;

  double get valueUsd => balance * priceUsd;

  TokenBalance copyWith({
    String? symbol,
    String? name,
    String? contract,
    double? balance,
    double? priceUsd,
    double? change24h,
    int? decimals,
    bool? hidden,
  }) {
    return TokenBalance(
      symbol: symbol ?? this.symbol,
      name: name ?? this.name,
      contract: contract ?? this.contract,
      balance: balance ?? this.balance,
      priceUsd: priceUsd ?? this.priceUsd,
      change24h: change24h ?? this.change24h,
      decimals: decimals ?? this.decimals,
      hidden: hidden ?? this.hidden,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'symbol': symbol,
      'name': name,
      'contract': contract,
      'balance': balance,
      'priceUsd': priceUsd,
      'change24h': change24h,
      'decimals': decimals,
      'hidden': hidden,
    };
  }

  factory TokenBalance.fromMap(Map<String, dynamic> map) {
    return TokenBalance(
      symbol: map['symbol'] as String,
      name: map['name'] as String,
      contract: map['contract'] as String,
      balance: (map['balance'] as num).toDouble(),
      priceUsd: (map['priceUsd'] as num).toDouble(),
      change24h: (map['change24h'] as num).toDouble(),
      decimals: map['decimals'] as int,
      hidden: map['hidden'] as bool? ?? false,
    );
  }
}

class WalletTransaction {
  WalletTransaction({
    required this.hash,
    required this.amount,
    required this.symbol,
    required this.from,
    required this.to,
    required this.createdAt,
    required this.status,
    required this.isSend,
    required this.network,
    required this.gasFee,
    required this.nonce,
    this.note,
  });

  final String hash;
  final double amount;
  final String symbol;
  final String from;
  final String to;
  final DateTime createdAt;
  final TxStatus status;
  final bool isSend;
  final String network;
  final double gasFee;
  final int nonce;
  final String? note;

  Map<String, dynamic> toMap() {
    return {
      'hash': hash,
      'amount': amount,
      'symbol': symbol,
      'from': from,
      'to': to,
      'createdAt': createdAt.toIso8601String(),
      'status': status.name,
      'isSend': isSend,
      'network': network,
      'gasFee': gasFee,
      'nonce': nonce,
      'note': note,
    };
  }

  factory WalletTransaction.fromMap(Map<String, dynamic> map) {
    return WalletTransaction(
      hash: map['hash'] as String,
      amount: (map['amount'] as num).toDouble(),
      symbol: map['symbol'] as String,
      from: map['from'] as String,
      to: map['to'] as String,
      createdAt: DateTime.parse(map['createdAt'] as String),
      status: TxStatus.values.byName(map['status'] as String),
      isSend: map['isSend'] as bool,
      network: map['network'] as String,
      gasFee: (map['gasFee'] as num).toDouble(),
      nonce: map['nonce'] as int,
      note: map['note'] as String?,
    );
  }
}

class NftAsset {
  NftAsset({
    required this.name,
    required this.collection,
    required this.tokenId,
    required this.image,
    required this.contract,
    required this.standard,
  });

  final String name;
  final String collection;
  final String tokenId;
  final String image;
  final String contract;
  final String standard;
}

class DefiPosition {
  DefiPosition({
    required this.protocol,
    required this.type,
    required this.valueUsd,
    required this.apy,
    required this.chain,
    required this.health,
  });

  final String protocol;
  final String type;
  final double valueUsd;
  final double apy;
  final String chain;
  final double health;
}

class DappSession {
  DappSession({
    required this.id,
    required this.name,
    required this.url,
    required this.chain,
    required this.connectedAt,
  });

  final String id;
  final String name;
  final String url;
  final String chain;
  final DateTime connectedAt;
}

class DappBookmark {
  const DappBookmark({required this.name, required this.url, required this.category});

  final String name;
  final String url;
  final String category;

  Map<String, dynamic> toMap() {
    return {'name': name, 'url': url, 'category': category};
  }

  factory DappBookmark.fromMap(Map<String, dynamic> map) {
    return DappBookmark(
      name: map['name'] as String,
      url: map['url'] as String,
      category: map['category'] as String,
    );
  }
}

class DappHistoryItem {
  DappHistoryItem({required this.title, required this.url, required this.visitedAt});

  final String title;
  final String url;
  final DateTime visitedAt;

  Map<String, dynamic> toMap() {
    return {'title': title, 'url': url, 'visitedAt': visitedAt.toIso8601String()};
  }

  factory DappHistoryItem.fromMap(Map<String, dynamic> map) {
    return DappHistoryItem(
      title: map['title'] as String,
      url: map['url'] as String,
      visitedAt: DateTime.parse(map['visitedAt'] as String),
    );
  }
}

class HardwareDevice {
  HardwareDevice({
    required this.id,
    required this.name,
    required this.type,
    required this.connected,
  });

  final String id;
  final String name;
  final String type;
  final bool connected;
}

class SecurityCheck {
  SecurityCheck({required this.title, required this.level, required this.message});

  final String title;
  final String level;
  final String message;
}

class SwapQuote {
  SwapQuote({
    required this.fromSymbol,
    required this.toSymbol,
    required this.fromAmount,
    required this.toAmount,
    required this.route,
    required this.priceImpact,
    required this.estimatedGas,
  });

  final String fromSymbol;
  final String toSymbol;
  final double fromAmount;
  final double toAmount;
  final String route;
  final double priceImpact;
  final double estimatedGas;
}

String encodeTxList(List<WalletTransaction> list) {
  return jsonEncode(list.map((item) => item.toMap()).toList());
}

List<WalletTransaction> decodeTxList(String raw) {
  final decoded = jsonDecode(raw) as List<dynamic>;
  return decoded
      .map((item) => WalletTransaction.fromMap(item as Map<String, dynamic>))
      .toList();
}

String encodeBookmarks(List<DappBookmark> list) {
  return jsonEncode(list.map((item) => item.toMap()).toList());
}

List<DappBookmark> decodeBookmarks(String raw) {
  final decoded = jsonDecode(raw) as List<dynamic>;
  return decoded.map((item) => DappBookmark.fromMap(item as Map<String, dynamic>)).toList();
}

String encodeHistory(List<DappHistoryItem> list) {
  return jsonEncode(list.map((item) => item.toMap()).toList());
}

List<DappHistoryItem> decodeHistory(String raw) {
  final decoded = jsonDecode(raw) as List<dynamic>;
  return decoded.map((item) => DappHistoryItem.fromMap(item as Map<String, dynamic>)).toList();
}

String encodeNetworks(List<NetworkConfig> list) {
  return jsonEncode(list.map((item) => item.toMap()).toList());
}

List<NetworkConfig> decodeNetworks(String raw) {
  final decoded = jsonDecode(raw) as List<dynamic>;
  return decoded.map((item) => NetworkConfig.fromMap(item as Map<String, dynamic>)).toList();
}
