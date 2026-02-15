/**
 * 卡片组件
 */

import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { spacing, shadows } from "@/theme";
import { useTheme } from "@/theme/ThemeContext";

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: "default" | "elevated" | "outlined";
  padding?: keyof typeof spacing;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = "default",
  padding = "md",
}) => {
  const { theme: colors } = useTheme();

  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case "elevated":
        return { ...shadows.medium, borderColor: colors.border, borderWidth: 1 };
      case "outlined":
        return {
          borderWidth: 1,
          borderColor: colors.border,
        };
      default:
        return { ...shadows.small, borderColor: colors.border, borderWidth: 1 };
    }
  };

  const cardStyle = [
    styles.base,
    { backgroundColor: colors.surface },
    getVariantStyle(),
    { padding: spacing[padding] },
    style,
  ];

  return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 20,
    overflow: "hidden",
  },
});
