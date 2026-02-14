/**
 * 加载动画组件
 */

import React from "react";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import { colors, typography, spacing } from "@theme";

interface LoadingProps {
  text?: string;
  size?: "small" | "large";
}

export const Loading: React.FC<LoadingProps> = ({ text, size = "large" }) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={colors.primary} />
      {text && <Text style={styles.text}>{text}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  text: {
    ...typography.body,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
});
