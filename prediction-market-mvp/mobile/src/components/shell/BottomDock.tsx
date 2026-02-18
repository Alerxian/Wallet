import { Pressable, StyleSheet, Text, View } from "react-native";
import type { TabKey } from "../../domain/types";
import { DESIGN } from "../../theme/design";

const TABS: TabKey[] = ["MARKETS", "PORTFOLIO", "ACTIVITY", "SETTINGS"];

type Props = {
  active: TabKey;
  onTab: (tab: TabKey) => void;
};

export function BottomDock({ active, onTab }: Props) {
  return (
    <View style={styles.dock}>
      {TABS.map((tab) => (
        <Pressable key={tab} onPress={() => onTab(tab)} style={[styles.item, active === tab ? styles.itemActive : null]}>
          <Text style={[styles.text, active === tab ? styles.textActive : null]}>{tab}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  dock: {
    backgroundColor: DESIGN.color.surface,
    borderTopWidth: 1,
    borderTopColor: DESIGN.color.border,
    paddingHorizontal: 10,
    paddingVertical: 10,
    flexDirection: "row",
    gap: 8,
  },
  item: {
    flex: 1,
    minHeight: 46,
    borderRadius: DESIGN.radius.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: DESIGN.color.soft,
    borderWidth: 1,
    borderColor: DESIGN.color.border,
  },
  itemActive: {
    backgroundColor: DESIGN.color.accent,
    borderColor: DESIGN.color.accentDeep,
  },
  text: {
    color: DESIGN.color.text,
    fontSize: 12,
    fontWeight: "800",
  },
  textActive: {
    color: "#291B02",
  },
});
