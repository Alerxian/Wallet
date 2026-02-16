import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../state/wallet_app_state.dart';
import '../widgets/common.dart';

class TokensScreen extends StatefulWidget {
  const TokensScreen({super.key});

  @override
  State<TokensScreen> createState() => _TokensScreenState();
}

class _TokensScreenState extends State<TokensScreen> {
  final queryController = TextEditingController();

  @override
  void dispose() {
    queryController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<WalletAppState>();
    final query = queryController.text.toLowerCase();
    final tokens = state.tokens
        .where((t) => t.symbol.toLowerCase().contains(query) || t.name.toLowerCase().contains(query))
        .toList();

    return ScreenShell(
      title: '代币管理',
      body: Column(
        children: [
          SectionCard(
            child: TextField(
              controller: queryController,
              decoration: const InputDecoration(prefixIcon: Icon(Icons.search), hintText: '搜索代币'),
              onChanged: (_) => setState(() {}),
            ),
          ),
          const SizedBox(height: 10),
          if (tokens.isEmpty)
            const EmptyHint(message: '没有匹配的代币')
          else
            for (final token in tokens)
              Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: SectionCard(
                  child: Row(
                    children: [
                      CircleAvatar(
                        backgroundColor: Theme.of(context).colorScheme.primary.withValues(alpha: 0.14),
                        child: Text(token.symbol.substring(0, 1)),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('${token.name} (${token.symbol})'),
                            Text(
                              token.contract,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: Theme.of(context).textTheme.bodySmall,
                            ),
                          ],
                        ),
                      ),
                      Switch(
                        value: !token.hidden,
                        onChanged: (value) => context.read<WalletAppState>().toggleTokenHidden(token.symbol, !value),
                      ),
                    ],
                  ),
                ),
              ),
        ],
      ),
    );
  }
}
