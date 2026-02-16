import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../state/wallet_app_state.dart';
import '../widgets/common.dart';

class HelloScreen extends StatefulWidget {
  const HelloScreen({super.key});

  @override
  State<HelloScreen> createState() => _HelloScreenState();
}

class _HelloScreenState extends State<HelloScreen> {
  bool changed = false;
  bool initialized = false;
  bool saving = false;
  final TextEditingController noteController = TextEditingController();

  @override
  void dispose() {
    noteController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<WalletAppState>();
    if (!initialized) {
      initialized = true;
      noteController.text = state.helloNote;
    }

    return ScreenShell(
      title: 'Hello 页面',
      body: SectionCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              changed
                  ? '你点击了按钮，页面状态已经变化。'
                  : '你好，Flutter！你已经成功新增了第一个页面。',
            ),
            const SizedBox(height: 12),
            FilledButton(
              onPressed: () {
                setState(() {
                  changed = !changed;
                });
              },
              child: Text(changed ? '恢复初始文案' : '点击改变文案'),
            ),
            const SizedBox(height: 20),
            const Text('练习 3：输入一句话并保存到本地'),
            const SizedBox(height: 8),
            TextField(
              controller: noteController,
              maxLines: 2,
              decoration: const InputDecoration(
                hintText: '例如：我要持续学习 Flutter',
              ),
            ),
            const SizedBox(height: 12),
            FilledButton.icon(
              onPressed: saving
                  ? null
                  : () async {
                      final appState = context.read<WalletAppState>();
                      final messenger = ScaffoldMessenger.of(context);
                      setState(() => saving = true);
                      await appState.setHelloNote(noteController.text.trim());
                      if (!mounted) return;
                      setState(() => saving = false);
                      messenger.showSnackBar(
                        const SnackBar(content: Text('已保存到本地，下次打开仍然存在')),
                      );
                    },
              icon: const Icon(Icons.save),
              label: Text(saving ? '保存中...' : '保存内容'),
            ),
            const SizedBox(height: 12),
            Text(
              state.helloNote.isEmpty ? '当前还没有已保存内容' : '当前已保存：${state.helloNote}',
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ],
        ),
      ),
    );
  }
}
