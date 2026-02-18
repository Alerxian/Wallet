import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import type { TradeState } from "../domain/types";
import { DESIGN } from "../theme/design";

type Row = {
  txHash: string;
  marketId: string;
  marketQuestion: string;
  action: string;
  side: string;
  amount: string;
  state: TradeState;
};

type Props = {
  authed: boolean;
  loading: boolean;
  rows: Row[];
  onRefresh: () => void;
};

export function ActivityTab(props: Props) {
  return (
    <View style={styles.stack}>
      <View style={styles.rowBetween}>
        <Text style={styles.title}>Activity</Text>
        <Pressable style={styles.button} onPress={props.onRefresh}>
          <Text style={styles.buttonText}>Refresh</Text>
        </Pressable>
      </View>

      {!props.authed ? <Text style={styles.muted}>Connect wallet to view activity.</Text> : null}
      {props.loading ? <ActivityIndicator color={DESIGN.color.accent} /> : null}

      {props.authed
        ? props.rows.map((row) => (
            <View key={row.txHash} style={styles.card}>
              <View style={styles.rowBetween}>
                <Text style={styles.id}>#{row.marketId}</Text>
                <View style={[styles.chip, stateStyle(row.state)]}>
                  <Text style={styles.chipText}>{row.state}</Text>
                </View>
              </View>
              <Text style={styles.q}>{row.marketQuestion || "Pending market sync"}</Text>
              <Text style={styles.meta}>
                {row.action} {row.side} {row.amount}
              </Text>
              <Text style={styles.meta}>Tx: {row.txHash}</Text>
            </View>
          ))
        : null}

      {props.authed && !props.loading && !props.rows.length ? <Text style={styles.muted}>No transactions yet.</Text> : null}
    </View>
  );
}

function stateStyle(state: TradeState) {
  if (state === "INDEXED") return { backgroundColor: "#1D4B38" };
  if (state === "FAILED") return { backgroundColor: "#5F2B27" };
  if (state === "CONFIRMED") return { backgroundColor: "#3B5032" };
  return { backgroundColor: "#3C3A32" };
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
  id: { color: DESIGN.color.accent, fontWeight: "900", fontSize: 12 },
  chip: {
    borderRadius: DESIGN.radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: DESIGN.color.border,
  },
  chipText: { color: DESIGN.color.text, fontWeight: "700", fontSize: 11 },
  q: { color: DESIGN.color.text, fontSize: 15, lineHeight: 22, fontWeight: "800" },
  meta: { color: DESIGN.color.muted, fontSize: 12 },
});
