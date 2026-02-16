import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:webview_flutter/webview_flutter.dart';

import '../models/models.dart';
import '../state/wallet_app_state.dart';

class DappBrowserScreen extends StatefulWidget {
  const DappBrowserScreen({super.key, this.initialUrl});

  final String? initialUrl;

  @override
  State<DappBrowserScreen> createState() => _DappBrowserScreenState();
}

class _DappBrowserScreenState extends State<DappBrowserScreen> {
  late final WebViewController controller;
  final addressController = TextEditingController(text: 'https://app.uniswap.org');
  double progress = 0;
  String currentTitle = 'dApp Browser';
  String currentUrl = 'https://app.uniswap.org';

  @override
  void initState() {
    super.initState();
    final initial = widget.initialUrl?.trim();
    if (initial != null && initial.isNotEmpty) {
      currentUrl = initial.startsWith('http') ? initial : 'https://$initial';
      addressController.text = currentUrl;
    }
    controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onProgress: (value) => setState(() => progress = value / 100),
          onPageStarted: (url) {
            setState(() => currentUrl = url);
          },
          onPageFinished: (url) async {
            setState(() => currentUrl = url);
            final title = await controller.getTitle();
            if (!mounted) return;
            setState(() => currentTitle = title ?? Uri.tryParse(url)?.host ?? 'dApp Browser');
            await context.read<WalletAppState>().addHistory(
                  DappHistoryItem(
                    title: currentTitle,
                    url: url,
                    visitedAt: DateTime.now(),
                  ),
                );
          },
        ),
      )
      ..loadRequest(Uri.parse(currentUrl));
  }

  @override
  void dispose() {
    addressController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<WalletAppState>();

    return Scaffold(
      appBar: AppBar(
        title: Text(currentTitle, maxLines: 1, overflow: TextOverflow.ellipsis),
        actions: [
          IconButton(
            onPressed: () async {
              await state.addBookmark(
                DappBookmark(
                  name: currentTitle,
                  url: currentUrl,
                  category: 'Custom',
                ),
              );
              if (!context.mounted) return;
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('已收藏到书签')));
            },
            icon: const Icon(Icons.bookmark_add_outlined),
          ),
        ],
      ),
      body: Column(
        children: [
          if (progress < 1)
            LinearProgressIndicator(value: progress)
          else
            const SizedBox(height: 2),
          Padding(
            padding: const EdgeInsets.all(10),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: addressController,
                    decoration: const InputDecoration(hintText: '输入 dApp URL'),
                    onSubmitted: (value) => _open(value),
                  ),
                ),
                const SizedBox(width: 8),
                FilledButton(
                  onPressed: () => _open(addressController.text),
                  child: const Text('打开'),
                ),
              ],
            ),
          ),
          Expanded(child: WebViewWidget(controller: controller)),
          SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(12, 8, 12, 12),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  IconButton(
                    onPressed: () async {
                      if (await controller.canGoBack()) {
                        await controller.goBack();
                      }
                    },
                    icon: const Icon(Icons.arrow_back_ios_new),
                  ),
                  IconButton(
                    onPressed: () async {
                      if (await controller.canGoForward()) {
                        await controller.goForward();
                      }
                    },
                    icon: const Icon(Icons.arrow_forward_ios),
                  ),
                  IconButton(
                    onPressed: () => controller.reload(),
                    icon: const Icon(Icons.refresh),
                  ),
                  FilledButton.tonalIcon(
                    onPressed: () async {
                      final host = Uri.tryParse(currentUrl)?.host ?? 'Unknown dApp';
                      await context.read<WalletAppState>().connectDappSession(name: host, url: currentUrl);
                      if (!context.mounted) return;
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('连接请求已批准（模拟）')));
                    },
                    icon: const Icon(Icons.link),
                    label: const Text('连接'),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _open(String input) {
    var value = input.trim();
    if (value.isEmpty) return;
    if (!value.startsWith('http://') && !value.startsWith('https://')) {
      value = 'https://$value';
    }
    addressController.text = value;
    controller.loadRequest(Uri.parse(value));
  }
}
