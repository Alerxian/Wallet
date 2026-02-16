import 'package:flutter/material.dart';

import '../ui/routes.dart';

class WelcomeScreen extends StatelessWidget {
  const WelcomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFF113C30), Color(0xFF245947), Color(0xFF3D7D64)],
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Spacer(),
                Text(
                  'Wallet Flutter',
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                ),
                const SizedBox(height: 12),
                const Text(
                  '对齐 Rabby Wallet 核心能力：钱包管理、多链资产、交易、Swap、NFT、DeFi、dApp 浏览器与安全设置。',
                  style: TextStyle(color: Colors.white70, height: 1.5),
                ),
                const Spacer(),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: () => Navigator.pushNamed(context, Routes.createWallet),
                    child: const Text('创建钱包'),
                  ),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton(
                    onPressed: () => Navigator.pushNamed(context, Routes.importWallet),
                    style: OutlinedButton.styleFrom(foregroundColor: Colors.white),
                    child: const Text('导入钱包'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
