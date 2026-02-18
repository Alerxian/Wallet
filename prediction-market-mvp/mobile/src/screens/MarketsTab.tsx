import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { MarketDetail, MarketSummary, TradeAction, TradeSide } from "../domain/types";
import { DESIGN } from "../theme/design";

type Props = {
  markets: MarketSummary[];
  loading: boolean;
  selectedId: string | null;
  detail: MarketDetail | null;
  detailLoading: boolean;
  amount: string;
  side: TradeSide;
  sending: boolean;
  onAmount: (value: string) => void;
  onSide: (side: TradeSide) => void;
  onSelect: (id: string | null) => void;
  onRefresh: () => void;
  onTrade: (action: TradeAction) => void;
};

export function MarketsTab(props: Props) {
  if (!props.selectedId) {
    return (
      <View style={styles.stack}>
        <View style={styles.hero}>
          <Text style={styles.heroKicker}>LIVE FLOOR</Text>
          <Text style={styles.heroTitle}>Prediction Books</Text>
          <Text style={styles.heroMeta}>Anvil {`(31337)`} · realtime from backend indexer</Text>
        </View>

        <View style={styles.rowBetween}>
          <Text style={styles.section}>Open Markets</Text>
          <Pressable style={styles.ghostButton} onPress={props.onRefresh}>
            <Text style={styles.ghostButtonText}>Refresh</Text>
          </Pressable>
        </View>

        {props.loading ? <ActivityIndicator color={DESIGN.color.accent} /> : null}

        {props.markets.map((m) => (
          <Pressable key={m.id} style={styles.marketCard} onPress={() => props.onSelect(m.id)}>
            <View style={styles.rowBetween}>
              <Text style={styles.marketId}>#{m.id}</Text>
              <View style={styles.chip}>
                <Text style={styles.chipText}>{m.status}</Text>
              </View>
            </View>
            <Text style={styles.marketQ}>{m.question || "Untitled market"}</Text>
            <Text style={styles.marketMeta}>Close: {new Date(m.closeTime * 1000).toLocaleString()}</Text>
            <Text style={styles.cta}>Open detail & place order</Text>
          </Pressable>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.stack}>
      <Pressable style={styles.ghostButton} onPress={() => props.onSelect(null)}>
        <Text style={styles.ghostButtonText}>Back to list</Text>
      </Pressable>

      {props.detailLoading || !props.detail ? (
        <ActivityIndicator color={DESIGN.color.accent} />
      ) : (
        <>
          <View style={styles.marketCard}>
            <Text style={styles.detailTitle}>{props.detail.question || "Untitled market"}</Text>
            <Text style={styles.marketMeta}>Market: {props.detail.marketAddress}</Text>
            <Text style={styles.marketMeta}>Status: {props.detail.status}</Text>
            <View style={styles.poolWrap}>
              <View style={styles.pool}>
                <Text style={styles.poolLabel}>YES Pool</Text>
                <Text style={styles.poolValue}>{props.detail.yesPool || "0"}</Text>
              </View>
              <View style={styles.pool}>
                <Text style={styles.poolLabel}>NO Pool</Text>
                <Text style={styles.poolValue}>{props.detail.noPool || "0"}</Text>
              </View>
            </View>
          </View>

          <View style={styles.tradeCard}>
            <Text style={styles.section}>Order Ticket</Text>
            <View style={styles.sideRow}>
              <Pressable style={[styles.sideButton, props.side === "YES" ? styles.sideButtonActive : null]} onPress={() => props.onSide("YES")}>
                <Text style={[styles.sideText, props.side === "YES" ? styles.sideTextActive : null]}>YES</Text>
              </Pressable>
              <Pressable style={[styles.sideButton, props.side === "NO" ? styles.sideButtonActive : null]} onPress={() => props.onSide("NO")}>
                <Text style={[styles.sideText, props.side === "NO" ? styles.sideTextActive : null]}>NO</Text>
              </Pressable>
            </View>

            <TextInput
              value={props.amount}
              onChangeText={props.onAmount}
              keyboardType="decimal-pad"
              placeholder="Amount (USDC)"
              placeholderTextColor={DESIGN.color.muted}
              style={styles.input}
            />

            <View style={styles.sideRow}>
              <Pressable style={[styles.buy, props.sending ? styles.disabled : null]} disabled={props.sending} onPress={() => props.onTrade("BUY")}>
                <Text style={styles.buyText}>{props.sending ? "Placing..." : "Buy"}</Text>
              </Pressable>
              <Pressable style={[styles.sell, props.sending ? styles.disabled : null]} disabled={props.sending} onPress={() => props.onTrade("SELL")}>
                <Text style={styles.sellText}>{props.sending ? "Placing..." : "Sell"}</Text>
              </Pressable>
            </View>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 12 },
  hero: {
    backgroundColor: DESIGN.color.surface,
    borderWidth: 1,
    borderColor: DESIGN.color.border,
    borderRadius: DESIGN.radius.lg,
    padding: 14,
    gap: 5,
  },
  heroKicker: {
    color: DESIGN.color.accent,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
  },
  heroTitle: {
    color: DESIGN.color.text,
    fontSize: 24,
    fontWeight: "900",
  },
  heroMeta: { color: DESIGN.color.muted, fontSize: 12 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  section: { color: DESIGN.color.text, fontSize: 20, fontWeight: "900" },
  ghostButton: {
    minHeight: 38,
    borderRadius: DESIGN.radius.pill,
    borderWidth: 1,
    borderColor: DESIGN.color.border,
    paddingHorizontal: 14,
    justifyContent: "center",
    backgroundColor: DESIGN.color.soft,
  },
  ghostButtonText: { color: DESIGN.color.text, fontWeight: "700", fontSize: 12 },
  marketCard: {
    backgroundColor: DESIGN.color.surface,
    borderWidth: 1,
    borderColor: DESIGN.color.border,
    borderRadius: DESIGN.radius.md,
    padding: 14,
    gap: 6,
  },
  marketId: { color: DESIGN.color.accent, fontWeight: "900", fontSize: 12 },
  chip: {
    borderRadius: DESIGN.radius.pill,
    borderWidth: 1,
    borderColor: DESIGN.color.border,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: DESIGN.color.soft,
  },
  chipText: { color: DESIGN.color.text, fontWeight: "700", fontSize: 11 },
  marketQ: { color: DESIGN.color.text, fontSize: 15, lineHeight: 22, fontWeight: "800" },
  marketMeta: { color: DESIGN.color.muted, fontSize: 12 },
  cta: { color: DESIGN.color.accent, fontSize: 12, fontWeight: "800" },
  detailTitle: { color: DESIGN.color.text, fontSize: 22, fontWeight: "900", lineHeight: 30 },
  poolWrap: { flexDirection: "row", gap: 8 },
  pool: {
    flex: 1,
    backgroundColor: DESIGN.color.soft,
    borderRadius: DESIGN.radius.sm,
    borderWidth: 1,
    borderColor: DESIGN.color.border,
    padding: 10,
  },
  poolLabel: { color: DESIGN.color.muted, fontSize: 11 },
  poolValue: { color: DESIGN.color.text, fontSize: 17, fontWeight: "900" },
  tradeCard: {
    backgroundColor: DESIGN.color.surface,
    borderWidth: 1,
    borderColor: DESIGN.color.border,
    borderRadius: DESIGN.radius.md,
    padding: 14,
    gap: 10,
  },
  sideRow: { flexDirection: "row", gap: 8 },
  sideButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: DESIGN.radius.sm,
    borderWidth: 1,
    borderColor: DESIGN.color.border,
    backgroundColor: DESIGN.color.soft,
    justifyContent: "center",
    alignItems: "center",
  },
  sideButtonActive: { backgroundColor: DESIGN.color.accent, borderColor: DESIGN.color.accentDeep },
  sideText: { color: DESIGN.color.text, fontWeight: "800" },
  sideTextActive: { color: "#2E2109" },
  input: {
    minHeight: 44,
    borderRadius: DESIGN.radius.sm,
    borderWidth: 1,
    borderColor: DESIGN.color.border,
    backgroundColor: DESIGN.color.soft,
    color: DESIGN.color.text,
    paddingHorizontal: 12,
  },
  buy: {
    flex: 1,
    minHeight: 48,
    borderRadius: DESIGN.radius.sm,
    backgroundColor: DESIGN.color.success,
    justifyContent: "center",
    alignItems: "center",
  },
  sell: {
    flex: 1,
    minHeight: 48,
    borderRadius: DESIGN.radius.sm,
    backgroundColor: DESIGN.color.accent,
    justifyContent: "center",
    alignItems: "center",
  },
  buyText: { color: "#0C3022", fontWeight: "900", fontSize: 15 },
  sellText: { color: "#2A1A00", fontWeight: "900", fontSize: 15 },
  disabled: { opacity: 0.65 },
});
