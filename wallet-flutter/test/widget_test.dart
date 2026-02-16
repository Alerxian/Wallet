import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:wallet_flutter/widgets/common.dart';

void main() {
  testWidgets('ScreenShell renders title and content', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: ScreenShell(
          title: 'Test Page',
          body: SectionCard(child: Text('Body content')),
        ),
      ),
    );

    expect(find.text('Test Page'), findsOneWidget);
    expect(find.text('Body content'), findsOneWidget);
  });
}
