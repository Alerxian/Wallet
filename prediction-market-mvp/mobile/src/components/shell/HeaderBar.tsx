import { Pressable, StyleSheet, Text, View } from "react-native";
import { DESIGN } from "../../theme/design";

type Props = {
  walletTag: string;
  phase: string;
  connected: boolean;
  ready: boolean;
  connecting: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
};

export function HeaderBar(props: Props) {
  return (
    <View style={styles.wrap}>
      <View>
        <Text style={styles.brandTop}>MARKET OS</Text>
        <Text style={styles.brandBottom}>Signal Desk</Text>
      </View>

      <View style={styles.right}>
        <Text style={styles.wallet}>{props.walletTag}</Text>
        <Text style={styles.phase}>{props.phase}</Text>
        {!props.connected ? (
          <Pressable
            onPress={props.onConnect}
            style={[styles.action, !props.ready && !props.connecting ? styles.actionDisabled : null]}
            disabled={props.connecting || !props.ready}
          >
            <Text style={styles.actionText}>{props.connecting ? "Pairing..." : "Connect"}</Text>
          </Pressable>
        ) : (
          <Pressable onPress={props.onDisconnect} style={styles.actionAlt}>
            <Text style={styles.actionAltText}>Logout</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: DESIGN.color.surface,
    borderBottomColor: DESIGN.color.border,
    borderBottomWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brandTop: {
    color: DESIGN.color.accent,
    fontSize: 11,
    letterSpacing: 1.1,
    fontWeight: "800",
  },
  brandBottom: {
    color: DESIGN.color.text,
    fontSize: 20,
    fontWeight: "900",
    marginTop: 2,
  },
  right: {
    alignItems: "flex-end",
    gap: 2,
  },
  wallet: {
    color: DESIGN.color.text,
    fontSize: 12,
    fontWeight: "700",
  },
  phase: {
    color: DESIGN.color.muted,
    fontSize: 11,
  },
  action: {
    marginTop: 5,
    minHeight: 38,
    borderRadius: DESIGN.radius.pill,
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: DESIGN.color.accent,
  },
  actionDisabled: {
    opacity: 0.55,
  },
  actionText: {
    color: "#2A1A00",
    fontWeight: "900",
  },
  actionAlt: {
    marginTop: 5,
    minHeight: 38,
    borderRadius: DESIGN.radius.pill,
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: DESIGN.color.soft,
    borderWidth: 1,
    borderColor: DESIGN.color.border,
  },
  actionAltText: {
    color: DESIGN.color.text,
    fontWeight: "800",
  },
});
