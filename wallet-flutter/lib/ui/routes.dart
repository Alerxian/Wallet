import 'package:flutter/material.dart';

import '../screens/create_wallet_screen.dart';
import '../screens/dapp_browser_screen.dart';
import '../screens/dapp_screen.dart';
import '../screens/defi_screen.dart';
import '../screens/hardware_wallet_screen.dart';
import '../screens/hello_screen.dart';
import '../screens/home_screen.dart';
import '../screens/import_wallet_screen.dart';
import '../screens/networks_screen.dart';
import '../screens/nft_screen.dart';
import '../screens/portfolio_screen.dart';
import '../screens/receive_screen.dart';
import '../screens/root_screen.dart';
import '../screens/search_screen.dart';
import '../screens/send_screen.dart';
import '../screens/settings_screen.dart';
import '../screens/swap_screen.dart';
import '../screens/tokens_screen.dart';
import '../screens/tx_history_screen.dart';
import '../screens/wallets_screen.dart';
import '../screens/welcome_screen.dart';

class Routes {
  static const String root = '/';
  static const String welcome = '/welcome';
  static const String createWallet = '/create-wallet';
  static const String importWallet = '/import-wallet';
  static const String home = '/home';
  static const String send = '/send';
  static const String receive = '/receive';
  static const String tx = '/tx';
  static const String swap = '/swap';
  static const String nft = '/nft';
  static const String defi = '/defi';
  static const String dapp = '/dapp';
  static const String dappBrowser = '/dapp-browser';
  static const String portfolio = '/portfolio';
  static const String hardware = '/hardware';
  static const String settings = '/settings';
  static const String search = '/search';
  static const String hello = '/hello';
  static const String wallets = '/wallets';
  static const String networks = '/networks';
  static const String tokens = '/tokens';
}

Route<dynamic> buildRoute(RouteSettings settings) {
  switch (settings.name) {
    case Routes.root:
      return MaterialPageRoute(builder: (_) => const RootScreen());
    case Routes.welcome:
      return MaterialPageRoute(builder: (_) => const WelcomeScreen());
    case Routes.createWallet:
      return MaterialPageRoute(builder: (_) => const CreateWalletScreen());
    case Routes.importWallet:
      return MaterialPageRoute(builder: (_) => const ImportWalletScreen());
    case Routes.home:
      return MaterialPageRoute(builder: (_) => const HomeScreen());
    case Routes.send:
      return MaterialPageRoute(builder: (_) => const SendScreen());
    case Routes.receive:
      return MaterialPageRoute(builder: (_) => const ReceiveScreen());
    case Routes.tx:
      return MaterialPageRoute(builder: (_) => const TxHistoryScreen());
    case Routes.swap:
      return MaterialPageRoute(builder: (_) => const SwapScreen());
    case Routes.nft:
      return MaterialPageRoute(builder: (_) => const NftScreen());
    case Routes.defi:
      return MaterialPageRoute(builder: (_) => const DefiScreen());
    case Routes.dapp:
      return MaterialPageRoute(builder: (_) => const DappScreen());
    case Routes.dappBrowser:
      final url = settings.arguments is String ? settings.arguments as String : null;
      return MaterialPageRoute(builder: (_) => DappBrowserScreen(initialUrl: url));
    case Routes.portfolio:
      return MaterialPageRoute(builder: (_) => const PortfolioScreen());
    case Routes.hardware:
      return MaterialPageRoute(builder: (_) => const HardwareWalletScreen());
    case Routes.settings:
      return MaterialPageRoute(builder: (_) => const SettingsScreen());
    case Routes.search:
      return MaterialPageRoute(builder: (_) => const SearchScreen());
    case Routes.hello:
      return MaterialPageRoute(builder: (_) => const HelloScreen());
    case Routes.wallets:
      return MaterialPageRoute(builder: (_) => const WalletsScreen());
    case Routes.networks:
      return MaterialPageRoute(builder: (_) => const NetworksScreen());
    case Routes.tokens:
      return MaterialPageRoute(builder: (_) => const TokensScreen());
    default:
      return MaterialPageRoute(builder: (_) => const RootScreen());
  }
}
