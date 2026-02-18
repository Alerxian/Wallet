import { Pressable, StyleSheet, Text, View } from "react-native";
import type { RuntimeError } from "../domain/types";
import { DESIGN } from "../theme/design";

type Props = {
  apiBase: string;
  authed: boolean;
  authExpiresAt: number;
  connected: boolean;
  clientReady: boolean;
  phaseText: string;
  recovering: boolean;
  relay: string;
  walletError: string;
  errors: RuntimeError[];
  connecting: boolean;
  onConnect: () => void;
  onClear: () => void;
};

export function SettingsTab(props: Props) {
  return (
    <View style={styles.stack}>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Network</Text>
        <Text style={styles.meta}>Anvil local chain (31337)</Text>
        <Text style={styles.meta}>Backend: {props.apiBase}</Text>

        <Text style={styles.label}>Session</Text>
        <Text style={styles.meta}>{props.authed ? `Authenticated until ${new Date(props.authExpiresAt).toLocaleTimeString()}` : "Not authenticated"}</Text>

        <Text style={styles.label}>Wallet Transport</Text>
        <Text style={styles.meta}>{props.connected ? "Connected" : "Not connected"}</Text>
        <Text style={styles.meta}>{props.clientReady ? "Wallet client ready" : "Wallet client warming up"}</Text>
        <Text style={styles.meta}>Connect flow: {props.phaseText}</Text>
        {props.recovering ? <Text style={styles.meta}>Recovering wallet session...</Text> : null}
        <Text style={styles.meta}>Relay: {props.relay}</Text>
        {props.walletError ? <Text style={styles.error}>{props.walletError}</Text> : null}

        <View style={styles.row}>
          <Pressable style={styles.primary} disabled={props.connecting} onPress={props.onConnect}>
            <Text style={styles.primaryText}>{props.connecting ? "Connecting..." : "Reconnect / Switch"}</Text>
          </Pressable>
          <Pressable style={styles.secondary} onPress={props.onClear}>
            <Text style={styles.secondaryText}>Clear Session</Text>
          </Pressable>
        </View>

        <Text style={styles.label}>Recent Errors</Text>
        {!props.errors.length ? <Text style={styles.meta}>No runtime errors captured.</Text> : null}
        {props.errors.slice(0, 6).map((entry) => (
          <Text key={entry.id} style={styles.error}>
            [{new Date(entry.time).toLocaleTimeString()}] {entry.scope}: {entry.message}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 12 },
  title: { color: DESIGN.color.text, fontSize: 22, fontWeight: "900" },
  card: {
    backgroundColor: DESIGN.color.surface,
    borderWidth: 1,
    borderColor: DESIGN.color.border,
    borderRadius: DESIGN.radius.md,
    padding: 14,
    gap: 8,
  },
  label: { color: DESIGN.color.text, fontSize: 12, fontWeight: "800" },
  meta: { color: DESIGN.color.muted, fontSize: 12 },
  row: { flexDirection: "row", gap: 8 },
  primary: {
    minHeight: 40,
    borderRadius: DESIGN.radius.pill,
    backgroundColor: DESIGN.color.accent,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 14,
  },
  primaryText: { color: "#2A1A00", fontWeight: "900" },
  secondary: {
    minHeight: 40,
    borderRadius: DESIGN.radius.pill,
    borderWidth: 1,
    borderColor: DESIGN.color.border,
    backgroundColor: DESIGN.color.soft,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 14,
  },
  secondaryText: { color: DESIGN.color.text, fontWeight: "800" },
  error: { color: DESIGN.color.danger, fontSize: 12 },
});
