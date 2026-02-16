import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../state/wallet_app_state.dart';
import '../ui/routes.dart';

class RootScreen extends StatefulWidget {
  const RootScreen({super.key});

  @override
  State<RootScreen> createState() => _RootScreenState();
}

class _RootScreenState extends State<RootScreen> {
  bool redirected = false;

  @override
  Widget build(BuildContext context) {
    return Consumer<WalletAppState>(
      builder: (context, appState, _) {
        if (!redirected) {
          redirected = true;
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (!mounted) return;
            Navigator.pushReplacementNamed(
              context,
              appState.hasWallet ? Routes.home : Routes.welcome,
            );
          });
        }

        return const Scaffold(
          body: Center(
            child: CircularProgressIndicator(),
          ),
        );
      },
    );
  }
}
