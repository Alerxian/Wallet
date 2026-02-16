import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/models.dart';
import '../state/wallet_app_state.dart';
import '../ui/routes.dart';
import '../widgets/common.dart';

class DappScreen extends StatefulWidget {
  const DappScreen({super.key});

  @override
  State<DappScreen> createState() => _DappScreenState();
}

class _DappScreenState extends State<DappScreen> {
  final uriController = TextEditingController(text: 'https://app.uniswap.org');

  @override
  void dispose() {
    uriController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<WalletAppState>();

    return ScreenShell(
      title: 'dApp',
      body: Column(
        children: [
          SectionCard(
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    '内置 dApp 浏览器（WebView）支持输入 URL、书签、历史和连接会话（模拟）。',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ),
                const SizedBox(width: 10),
                FilledButton.tonalIcon(
                  onPressed: () => Navigator.pushNamed(context, Routes.dappBrowser),
                  icon: const Icon(Icons.public),
                  label: const Text('打开浏览器'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          SectionCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('WalletConnect URI / dApp URL'),
                const SizedBox(height: 8),
                TextField(controller: uriController),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: () async {
                      final url = uriController.text.trim();
                      final name = Uri.tryParse(url)?.host ?? 'Unknown dApp';
                      await context.read<WalletAppState>().connectDappSession(name: name, url: url);
                    },
                    child: const Text('连接'),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          if (state.dappSessions.isEmpty) const EmptyHint(message: '暂无连接会话') else ...[
            for (final session in state.dappSessions)
              Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: _sessionCard(context, session),
              ),
          ],
          const SizedBox(height: 12),
          SectionCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('书签', style: Theme.of(context).textTheme.titleSmall),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    for (final b in state.bookmarks)
                      ActionChip(
                        label: Text(b.name),
                        onPressed: () {
                          Navigator.pushNamed(context, Routes.dappBrowser, arguments: b.url);
                        },
                      ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _sessionCard(BuildContext context, DappSession session) {
    return SectionCard(
      child: Row(
        children: [
          const CircleAvatar(child: Icon(Icons.language)),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(session.name, style: Theme.of(context).textTheme.titleSmall),
                Text(session.url, maxLines: 1, overflow: TextOverflow.ellipsis),
              ],
            ),
          ),
          TextButton(
            onPressed: () => context.read<WalletAppState>().disconnectDappSession(session.id),
            child: const Text('断开'),
          ),
        ],
      ),
    );
  }
}
