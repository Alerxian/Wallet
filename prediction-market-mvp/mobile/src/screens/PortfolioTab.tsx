import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import type { PositionRow } from "../domain/types";
import { DESIGN } from "../theme/design";

type Props = {
  authed: boolean;
  loading: boolean;
  rows: PositionRow[];
  onRefresh: () => void;
};

export function PortfolioTab(props: Props) {
  return (
    <View style={styles.stack}>
      <View style={styles.rowBetween}>
        <Text style={styles.title}>Portfolio</Text>
        <Pressable style={styles.button} onPress={props.onRefresh}>
          <Text style={styles.buttonText}>Refresh</Text>
        </Pressable>
      </View>

      {!props.authed ? <Text style={styles.muted}>Connect wallet to view positions.</Text> : null}
      {props.loading ? <ActivityIndicator color={DESIGN.color.accent} /> : null}

      {props.authed
        ? props.rows.map((row) => (
            <View key={row.marketId} style={styles.card}>
              <Text style={styles.q}>{row.question || "Untitled market"}</Text>
              <Text style={styles.meta}>Status: {row.status}</Text>
              <Text style={styles.meta}>YES Shares: {row.yesShares}</Text>
              <Text style={styles.meta}>NO Shares: {row.noShares}</Text>
              <Text style={styles.meta}>Pools: {row.yesPool} / {row.noPool}</Text>
            </View>
          ))
        : null}
      {props.authed && !props.loading && !props.rows.length ? <Text style={styles.muted}>No open positions.</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 12 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { color: DESIGN.color.text, fontSize: 22, fontWeight: "900" },
  button: {
    minHeight: 38,
    borderRadius: DESIGN.radius.pill,
    borderWidth: 1,
    borderColor: DESIGN.color.border,
    paddingHorizontal: 14,
    justifyContent: "center",
    backgroundColor: DESIGN.color.soft,
  },
  buttonText: { color: DESIGN.color.text, fontWeight: "800", fontSize: 12 },
  muted: { color: DESIGN.color.muted, textAlign: "center", marginTop: 10 },
  card: {
    backgroundColor: DESIGN.color.surface,
    borderWidth: 1,
    borderColor: DESIGN.color.border,
    borderRadius: DESIGN.radius.md,
    padding: 14,
    gap: 6,
  },
  q: { color: DESIGN.color.text, fontSize: 15, lineHeight: 22, fontWeight: "800" },
  meta: { color: DESIGN.color.muted, fontSize: 12 },
});
