import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:local_auth/local_auth.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';

import '../models/models.dart';
import '../services/evm_service.dart';
import '../services/price_service.dart';
import '../services/wallet_crypto_service.dart';

class WalletAppState extends ChangeNotifier {
  WalletAppState();

  static const _secureCurrentAccountKey = 'secure_current_account';
  static const _secureAccountsKey = 'secure_accounts';

  static const _txKey = 'tx_history';
  static const _themeKey = 'theme_mode';
  static const _bannerKey = 'show_welcome_banner';
  static const _helloNoteKey = 'hello_note';
  static const _networksKey = 'networks';
  static const _bookmarksKey = 'dapp_bookmarks';
  static const _historyKey = 'dapp_history';
  static const _biometricEnabledKey = 'biometric_enabled';
  static const _autoLockKey = 'auto_lock_minutes';

  final _secureStorage = const FlutterSecureStorage();
  final _uuid = const Uuid();
  final _localAuth = LocalAuthentication();

  ThemeMode themeMode = ThemeMode.system;
  bool showWelcomeBanner = true;
  String helloNote = '';
  bool syncingPortfolio = false;
  String? lastSyncError;
  bool biometricEnabled = false;
  int autoLockMinutes = 5;

  // Wallet
  final List<WalletAccount> accounts = [];
  WalletAccount? currentAccount;

  // Network
  final List<NetworkConfig> networks = [];
  NetworkConfig? currentNetwork;

  // Assets (demo)
  final List<TokenBalance> tokens = [];

  // Transactions
  final List<WalletTransaction> transactions = [];

  // dApp
  final List<DappBookmark> bookmarks = [];
  final List<DappHistoryItem> history = [];
  final List<DappSession> dappSessions = [];

  // Demo data
  final List<NftAsset> nfts = [
    NftAsset(
      name: 'Neon Ape #2401',
      collection: 'Neon Apes',
      tokenId: '2401',
      image: 'https://picsum.photos/seed/nft1/300/300',
      contract: '0x0000000000000000000000000000000000000000',
      standard: 'ERC-721',
    ),
    NftAsset(
      name: 'Vault Pass #88',
      collection: 'Vault Genesis',
      tokenId: '88',
      image: 'https://picsum.photos/seed/nft2/300/300',
      contract: '0x0000000000000000000000000000000000000000',
      standard: 'ERC-721',
    ),
  ];

  final List<DefiPosition> defiPositions = [
    DefiPosition(protocol: 'Aave', type: 'Lending', valueUsd: 1220, apy: 3.4, chain: 'Ethereum', health: 1.78),
    DefiPosition(protocol: 'Uniswap', type: 'LP', valueUsd: 845, apy: 18.8, chain: 'Arbitrum', health: 0.0),
  ];

  final List<HardwareDevice> hardwareDevices = [
    HardwareDevice(id: 'ledger-1', name: 'Ledger Nano X', type: 'Ledger', connected: false),
    HardwareDevice(id: 'trezor-1', name: 'Trezor Model T', type: 'Trezor', connected: false),
  ];

  bool get hasWallet => currentAccount != null;

  double get totalAssetUsd => tokens.where((t) => !t.hidden).fold(0, (sum, token) => sum + token.valueUsd);

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();

    final savedTheme = prefs.getString(_themeKey);
    if (savedTheme == ThemeMode.light.name) {
      themeMode = ThemeMode.light;
    } else if (savedTheme == ThemeMode.dark.name) {
      themeMode = ThemeMode.dark;
    }

    showWelcomeBanner = prefs.getBool(_bannerKey) ?? true;
    helloNote = prefs.getString(_helloNoteKey) ?? '';
    biometricEnabled = prefs.getBool(_biometricEnabledKey) ?? false;
    autoLockMinutes = prefs.getInt(_autoLockKey) ?? 5;

    // Accounts (secure)
    final rawAccounts = await _secureStorage.read(key: _secureAccountsKey);
    if (rawAccounts != null && rawAccounts.isNotEmpty) {
      final decoded = jsonDecodeList(rawAccounts);
      accounts
        ..clear()
        ..addAll(decoded.map((m) => WalletAccount.fromMap(m)));
    }

    final currentId = await _secureStorage.read(key: _secureCurrentAccountKey);
    if (currentId != null) {
      currentAccount = accounts.where((a) => a.id == currentId).cast<WalletAccount?>().firstOrNull;
    }

    // Networks
    final rawNetworks = prefs.getString(_networksKey);
    if (rawNetworks != null && rawNetworks.isNotEmpty) {
      networks
        ..clear()
        ..addAll(decodeNetworks(rawNetworks));
    } else {
      networks
        ..clear()
        ..addAll(_defaultNetworks());
      await _saveNetworks();
    }
    currentNetwork = networks.firstWhere((n) => n.enabled, orElse: () => networks.first);

    _seedDemoTokens();

    // Transactions
    final txRaw = prefs.getString(_txKey);
    if (txRaw != null && txRaw.isNotEmpty) {
      transactions
        ..clear()
        ..addAll(decodeTxList(txRaw));
    }

    // dApp data
    final rawBookmarks = prefs.getString(_bookmarksKey);
    if (rawBookmarks != null && rawBookmarks.isNotEmpty) {
      bookmarks
        ..clear()
        ..addAll(decodeBookmarks(rawBookmarks));
    } else {
      bookmarks
        ..clear()
        ..addAll(_defaultBookmarks());
      await _saveBookmarks();
    }

    final rawHistory = prefs.getString(_historyKey);
    if (rawHistory != null && rawHistory.isNotEmpty) {
      history
        ..clear()
        ..addAll(decodeHistory(rawHistory));
    }

    if (currentAccount != null) {
      await refreshPortfolio();
    }

    notifyListeners();
  }

  Future<void> updateTheme(ThemeMode mode) async {
    themeMode = mode;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_themeKey, mode.name);
    notifyListeners();
  }

  Future<void> setShowWelcomeBanner(bool next) async {
    showWelcomeBanner = next;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_bannerKey, next);
    notifyListeners();
  }

  Future<void> setHelloNote(String note) async {
    helloNote = note;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_helloNoteKey, note);
    notifyListeners();
  }

  Future<void> setBiometricEnabled(bool enabled) async {
    biometricEnabled = enabled;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_biometricEnabledKey, enabled);
    notifyListeners();
  }

  Future<void> setAutoLockMinutes(int minutes) async {
    autoLockMinutes = minutes;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt(_autoLockKey, minutes);
    notifyListeners();
  }

  Future<bool> authenticate() async {
    final can = await _localAuth.canCheckBiometrics || await _localAuth.isDeviceSupported();
    if (!can) {
      return false;
    }
    return _localAuth.authenticate(
      localizedReason: '请验证身份以继续操作',
      options: const AuthenticationOptions(biometricOnly: false, stickyAuth: true),
    );
  }

  // Wallet management
  Future<void> createWallet({required int words, String name = 'Main Wallet'}) async {
    final created = await WalletCryptoService.createWallet(words: words);
    final account = WalletAccount(
      id: _uuid.v4(),
      name: name,
      address: created.address,
      secret: created.privateKeyHex,
      secretType: WalletSecretType.privateKey,
      createdAt: DateTime.now(),
      mnemonic: created.mnemonic,
    );
    accounts.add(account);
    currentAccount = account;
    await _saveAccounts();
    await _secureStorage.write(key: _secureCurrentAccountKey, value: account.id);
    await refreshPortfolio();
    notifyListeners();
  }

  Future<void> importWallet(String secret, {String name = 'Imported Wallet'}) async {
    final imported = await WalletCryptoService.importFromInput(secret);
    final account = WalletAccount(
      id: _uuid.v4(),
      name: name,
      address: imported.address,
      secret: imported.privateKeyHex,
      secretType: WalletSecretType.privateKey,
      createdAt: DateTime.now(),
      mnemonic: imported.mnemonic,
    );
    accounts.add(account);
    currentAccount = account;
    await _saveAccounts();
    await _secureStorage.write(key: _secureCurrentAccountKey, value: account.id);
    await refreshPortfolio();
    notifyListeners();
  }

  Future<void> switchAccount(String id) async {
    final found = accounts.where((a) => a.id == id).cast<WalletAccount?>().firstOrNull;
    if (found == null) return;
    currentAccount = found;
    await _secureStorage.write(key: _secureCurrentAccountKey, value: id);
    await refreshPortfolio();
    notifyListeners();
  }

  Future<void> deleteAccount(String id) async {
    accounts.removeWhere((a) => a.id == id);
    if (currentAccount?.id == id) {
      currentAccount = accounts.isNotEmpty ? accounts.first : null;
      await _secureStorage.write(key: _secureCurrentAccountKey, value: currentAccount?.id);
    }
    await _saveAccounts();
    notifyListeners();
  }

  // Network
  void switchNetwork(int chainId) {
    final found = networks.where((n) => n.chainId == chainId).cast<NetworkConfig?>().firstOrNull;
    if (found == null) return;
    currentNetwork = found;
    refreshPortfolio();
    notifyListeners();
  }

  Future<void> toggleNetwork(int chainId, bool enabled) async {
    final idx = networks.indexWhere((n) => n.chainId == chainId);
    if (idx < 0) return;
    networks[idx] = networks[idx].copyWith(enabled: enabled);
    if (currentNetwork?.chainId == chainId && !enabled) {
      currentNetwork = networks.firstWhere((n) => n.enabled, orElse: () => networks.first);
    }
    await _saveNetworks();
    notifyListeners();
  }

  Future<void> addCustomNetwork(NetworkConfig network) async {
    networks.add(network);
    await _saveNetworks();
    notifyListeners();
  }

  // Token
  void toggleTokenHidden(String symbol, bool hidden) {
    final idx = tokens.indexWhere((t) => t.symbol == symbol);
    if (idx < 0) return;
    tokens[idx] = tokens[idx].copyWith(hidden: hidden);
    notifyListeners();
  }

  // Transaction (demo)
  Future<void> send({
    required String to,
    required double amount,
    required String symbol,
    String? note,
  }) async {
    if (currentAccount == null) {
      throw Exception('钱包未初始化');
    }

    final network = currentNetwork;
    if (network == null) {
      throw Exception('网络未初始化');
    }

    final isNativeSymbol = symbol == network.symbol || (symbol == 'ETH' && network.symbol == 'ETH');
    if (!isNativeSymbol) {
      throw Exception('当前版本仅支持主币转账，ERC-20 发送将在下一阶段接入');
    }

    final txHash = await EvmService.sendNativeTransaction(
      rpcUrl: network.rpcUrl,
      chainId: network.chainId,
      privateKeyHex: currentAccount!.secret,
      to: to,
      amount: amount,
    );

    final tx = WalletTransaction(
      hash: txHash,
      amount: amount,
      symbol: symbol,
      from: currentAccount!.address,
      to: to,
      createdAt: DateTime.now(),
      status: TxStatus.pending,
      isSend: true,
      network: network.name,
      gasFee: 0.0017,
      nonce: transactions.length,
      note: note,
    );
    transactions.insert(0, tx);
    await _saveTransactions();
    await refreshPortfolio();
    notifyListeners();
  }

  Future<void> refreshPortfolio() async {
    if (currentAccount == null || currentNetwork == null) {
      return;
    }

    syncingPortfolio = true;
    lastSyncError = null;
    notifyListeners();

    try {
      final nativeBalance = await EvmService.getNativeBalance(
        rpcUrl: currentNetwork!.rpcUrl,
        address: currentAccount!.address,
      );

      final prices = await PriceService.fetchUsdPrices(tokens.map((e) => e.symbol).toList());

      for (var i = 0; i < tokens.length; i++) {
        final token = tokens[i];
        final price = prices[token.symbol] ?? token.priceUsd;
        if (token.symbol == currentNetwork!.symbol || (token.symbol == 'ETH' && currentNetwork!.symbol == 'ETH')) {
          tokens[i] = token.copyWith(balance: nativeBalance, priceUsd: price);
        } else {
          tokens[i] = token.copyWith(priceUsd: price);
        }
      }
    } catch (e) {
      lastSyncError = e.toString();
    } finally {
      syncingPortfolio = false;
      notifyListeners();
    }
  }

  // dApp
  Future<void> addBookmark(DappBookmark item) async {
    bookmarks.add(item);
    await _saveBookmarks();
    notifyListeners();
  }

  Future<void> removeBookmark(DappBookmark item) async {
    bookmarks.removeWhere((b) => b.url == item.url);
    await _saveBookmarks();
    notifyListeners();
  }

  Future<void> addHistory(DappHistoryItem item) async {
    history.removeWhere((h) => h.url == item.url);
    history.insert(0, item);
    if (history.length > 100) {
      history.removeRange(100, history.length);
    }
    await _saveHistory();
    notifyListeners();
  }

  Future<void> connectDappSession({required String name, required String url}) async {
    final session = DappSession(
      id: _uuid.v4(),
      name: name,
      url: url,
      chain: currentNetwork?.name ?? 'Ethereum',
      connectedAt: DateTime.now(),
    );
    dappSessions.add(session);
    notifyListeners();
  }

  void disconnectDappSession(String id) {
    dappSessions.removeWhere((s) => s.id == id);
    notifyListeners();
  }

  Future<void> clearAll() async {
    accounts.clear();
    currentAccount = null;
    transactions.clear();
    history.clear();
    dappSessions.clear();
    await _secureStorage.delete(key: _secureAccountsKey);
    await _secureStorage.delete(key: _secureCurrentAccountKey);
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_txKey);
    await prefs.remove(_historyKey);
    notifyListeners();
  }

  Future<void> _saveTransactions() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_txKey, encodeTxList(transactions));
  }

  Future<void> _saveAccounts() async {
    final raw = jsonEncode(accounts.map((a) => a.toMap()).toList());
    await _secureStorage.write(key: _secureAccountsKey, value: raw);
  }

  Future<void> _saveNetworks() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_networksKey, encodeNetworks(networks));
  }

  Future<void> _saveBookmarks() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_bookmarksKey, encodeBookmarks(bookmarks));
  }

  Future<void> _saveHistory() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_historyKey, encodeHistory(history));
  }

  void _seedDemoTokens() {
    tokens
      ..clear()
      ..addAll([
        TokenBalance(
          symbol: 'ETH',
          name: 'Ethereum',
          contract: 'native',
          balance: 1.2389,
          priceUsd: 3240,
          change24h: 2.7,
          decimals: 18,
        ),
        TokenBalance(
          symbol: 'USDC',
          name: 'USD Coin',
          contract: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          balance: 920.45,
          priceUsd: 1,
          change24h: 0,
          decimals: 6,
        ),
        TokenBalance(
          symbol: 'ARB',
          name: 'Arbitrum',
          contract: '0x912ce59144191c1204e64559fe8253a0e49e6548',
          balance: 240,
          priceUsd: 1.91,
          change24h: -1.4,
          decimals: 18,
        ),
      ]);
  }

  List<NetworkConfig> _defaultNetworks() {
    return [
      NetworkConfig(
        chainId: 1,
        name: 'Ethereum',
        symbol: 'ETH',
        rpcUrl: 'https://rpc.ankr.com/eth',
        explorer: 'https://etherscan.io',
      ),
      NetworkConfig(
        chainId: 42161,
        name: 'Arbitrum',
        symbol: 'ETH',
        rpcUrl: 'https://rpc.ankr.com/arbitrum',
        explorer: 'https://arbiscan.io',
      ),
      NetworkConfig(
        chainId: 137,
        name: 'Polygon',
        symbol: 'POL',
        rpcUrl: 'https://rpc.ankr.com/polygon',
        explorer: 'https://polygonscan.com',
      ),
    ];
  }

  List<DappBookmark> _defaultBookmarks() {
    return const [
      DappBookmark(name: 'Uniswap', url: 'https://app.uniswap.org', category: 'DEX'),
      DappBookmark(name: 'Aave', url: 'https://app.aave.com', category: 'Lending'),
      DappBookmark(name: 'OpenSea', url: 'https://opensea.io', category: 'NFT'),
    ];
  }

}

List<Map<String, dynamic>> jsonDecodeList(String raw) {
  final decoded = jsonDecode(raw) as List<dynamic>;
  return decoded.map((e) => e as Map<String, dynamic>).toList();
}

extension FirstOrNullExtension<T> on Iterable<T> {
  T? get firstOrNull => isEmpty ? null : first;
}
