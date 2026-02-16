import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/models.dart';
import '../state/wallet_app_state.dart';
import '../widgets/common.dart';

class NetworksScreen extends StatefulWidget {
  const NetworksScreen({super.key});

  @override
  State<NetworksScreen> createState() => _NetworksScreenState();
}

class _NetworksScreenState extends State<NetworksScreen> {
  final nameController = TextEditingController();
  final chainController = TextEditingController();
  final symbolController = TextEditingController();
  final rpcController = TextEditingController();
  final explorerController = TextEditingController();

  @override
  void dispose() {
    nameController.dispose();
    chainController.dispose();
    symbolController.dispose();
    rpcController.dispose();
    explorerController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<WalletAppState>();

    return ScreenShell(
      title: '网络管理',
      body: Column(
        children: [
          for (final network in state.networks)
            Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: SectionCard(
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text(network.name, style: Theme.of(context).textTheme.titleMedium),
                              const SizedBox(width: 8),
                              if (state.currentNetwork?.chainId == network.chainId) const Chip(label: Text('当前')),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text('Chain ID: ${network.chainId} · ${network.symbol}'),
                          Text(
                            network.rpcUrl,
                            style: Theme.of(context).textTheme.bodySmall,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                    Switch(
                      value: network.enabled,
                      onChanged: (value) => context.read<WalletAppState>().toggleNetwork(network.chainId, value),
                    ),
                    IconButton(
                      onPressed: () => context.read<WalletAppState>().switchNetwork(network.chainId),
                      icon: const Icon(Icons.check_circle_outline),
                    ),
                  ],
                ),
              ),
            ),
          SectionCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('添加自定义网络', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 10),
                TextField(controller: nameController, decoration: const InputDecoration(labelText: '网络名称')),
                const SizedBox(height: 8),
                TextField(controller: chainController, decoration: const InputDecoration(labelText: 'Chain ID')),
                const SizedBox(height: 8),
                TextField(controller: symbolController, decoration: const InputDecoration(labelText: '主币符号')),
                const SizedBox(height: 8),
                TextField(controller: rpcController, decoration: const InputDecoration(labelText: 'RPC URL')),
                const SizedBox(height: 8),
                TextField(controller: explorerController, decoration: const InputDecoration(labelText: 'Explorer URL')),
                const SizedBox(height: 12),
                FilledButton(
                  onPressed: () async {
                    final chainId = int.tryParse(chainController.text.trim());
                    if (chainId == null || nameController.text.trim().isEmpty || rpcController.text.trim().isEmpty) {
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('请完整填写信息')));
                      return;
                    }
                    await context.read<WalletAppState>().addCustomNetwork(
                          NetworkConfig(
                            chainId: chainId,
                            name: nameController.text.trim(),
                            symbol: symbolController.text.trim().isEmpty ? 'ETH' : symbolController.text.trim(),
                            rpcUrl: rpcController.text.trim(),
                            explorer: explorerController.text.trim().isEmpty ? '-' : explorerController.text.trim(),
                            isCustom: true,
                          ),
                        );
                    if (!context.mounted) return;
                    nameController.clear();
                    chainController.clear();
                    symbolController.clear();
                    rpcController.clear();
                    explorerController.clear();
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('已添加网络')));
                  },
                  child: const Text('添加网络'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
