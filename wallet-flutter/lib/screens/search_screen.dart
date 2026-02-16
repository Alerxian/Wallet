import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../state/wallet_app_state.dart';
import '../ui/routes.dart';
import '../widgets/common.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final controller = TextEditingController();

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<WalletAppState>();
    final keyword = controller.text.toLowerCase();

    final features = <MapEntry<String, String>>[
      const MapEntry('发送', Routes.send),
      const MapEntry('接收', Routes.receive),
      const MapEntry('交易历史', Routes.tx),
      const MapEntry('代币兑换', Routes.swap),
      const MapEntry('NFT', Routes.nft),
      const MapEntry('DeFi', Routes.defi),
      const MapEntry('dApp 连接', Routes.dapp),
      const MapEntry('dApp 浏览器', Routes.dappBrowser),
      const MapEntry('投资组合', Routes.portfolio),
      const MapEntry('硬件钱包', Routes.hardware),
      const MapEntry('钱包管理', Routes.wallets),
      const MapEntry('网络管理', Routes.networks),
      const MapEntry('代币管理', Routes.tokens),
    ];

    final result = features.where((item) => item.key.toLowerCase().contains(keyword)).toList();
    final tokenResult = state.tokens.where((t) => t.symbol.toLowerCase().contains(keyword)).toList();

    return ScreenShell(
      title: '全局搜索',
      body: Column(
        children: [
          TextField(
            controller: controller,
            decoration: const InputDecoration(prefixIcon: Icon(Icons.search), hintText: '搜索代币或功能'),
            onChanged: (_) => setState(() {}),
          ),
          const SizedBox(height: 12),
          SectionCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('功能', style: Theme.of(context).textTheme.titleSmall),
                const SizedBox(height: 8),
                for (final item in result)
                  ListTile(
                    dense: true,
                    contentPadding: EdgeInsets.zero,
                    title: Text(item.key),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () => Navigator.pushNamed(context, item.value),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          SectionCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('代币', style: Theme.of(context).textTheme.titleSmall),
                const SizedBox(height: 8),
                for (final token in tokenResult)
                  ListTile(
                    dense: true,
                    contentPadding: EdgeInsets.zero,
                    title: Text(token.symbol),
                    subtitle: Text(token.name),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
