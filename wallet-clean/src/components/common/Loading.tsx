/**
 * 加载动画组件
 */

import React from "react";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import { typography, spacing, ThemeColors } from "@/theme";
import { useTheme } from "@/theme/ThemeContext";

interface LoadingProps {
  text?: string;
  size?: "small" | "large";
}

export const Loading: React.FC<LoadingProps> = ({ text, size = "large" }) => {
  const { theme: colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={colors.primary} />
      {text && <Text style={styles.text}>{text}</Text>}
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
