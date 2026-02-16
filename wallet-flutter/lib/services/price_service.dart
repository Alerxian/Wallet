import 'dart:convert';

import 'package:http/http.dart' as http;

class PriceService {
  static const _base = 'https://api.coingecko.com/api/v3/simple/price';

  static Future<Map<String, double>> fetchUsdPrices(List<String> symbols) async {
    final ids = _toCoinGeckoIds(symbols);
    if (ids.isEmpty) {
      return {};
    }

    final uri = Uri.parse('$_base?ids=${ids.join(',')}&vs_currencies=usd');
    final response = await http.get(uri);
    if (response.statusCode != 200) {
      return {};
    }

    final parsed = jsonDecode(response.body) as Map<String, dynamic>;
    final result = <String, double>{};

    for (final entry in parsed.entries) {
      final usd = (entry.value as Map<String, dynamic>)['usd'];
      if (usd is num) {
        result[_symbolFromId(entry.key)] = usd.toDouble();
      }
    }

    return result;
  }

  static List<String> _toCoinGeckoIds(List<String> symbols) {
    final ids = <String>[];
    for (final s in symbols) {
      final id = switch (s.toUpperCase()) {
        'ETH' => 'ethereum',
        'USDC' => 'usd-coin',
        'ARB' => 'arbitrum',
        _ => null,
      };
      if (id != null) ids.add(id);
    }
    return ids;
  }

  static String _symbolFromId(String id) {
    return switch (id) {
      'ethereum' => 'ETH',
      'usd-coin' => 'USDC',
      'arbitrum' => 'ARB',
      _ => id.toUpperCase(),
    };
  }
}
