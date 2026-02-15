/**
 * 按钮组件
 */

import React from "react";
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from "react-native";
import { typography, spacing, shadows } from "@/theme";
import { useTheme } from "@/theme/ThemeContext";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "text";
  size?: "small" | "medium" | "large";
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  size = "medium",
  disabled = false,
  loading = false,
  style,
  textStyle,
}) => {
  const { theme: colors } = useTheme();
  const styles = createStyles(colors);

  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case "primary":
        return {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
        };
      case "secondary":
        return {
          backgroundColor: colors.surfaceLight,
          borderColor: colors.border,
        };
      case "outline":
        return {
          backgroundColor: "transparent",
          borderWidth: 1,
          borderColor: colors.primary,
        };
      case "text":
        return { backgroundColor: "transparent" };
    }
  };

  const getVariantTextStyle = (): TextStyle => {
    switch (variant) {
      case "outline":
      case "text":
        return { color: colors.primary };
      case "secondary":
        return { color: colors.text.primary };
      default:
        return { color: colors.text.inverse };
    }
  };

  const buttonStyle = [
    styles.base,
    getVariantStyle(),
    styles[`${size}Size`],
    disabled && { opacity: 0.5 },
    style,
  ];

  const textStyles = [
    styles.text,
    getVariantTextStyle(),
    styles[`${size}Text`],
    textStyle,
  ];

  return (
    <Pressable
      style={({ pressed }) => [
        buttonStyle,
        pressed && !disabled && !loading && styles.pressed,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" || variant === "secondary" ? colors.text.inverse : colors.primary}
        />
      ) : (
        <Text style={textStyles}>{title}</Text>
      )}
    </Pressable>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    base: {
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      borderWidth: 1,
      borderColor: "transparent",
      ...shadows.small,
    },
    pressed: {
      transform: [{ scale: 0.985 }],
      opacity: 0.92,
    },

    // 尺寸样式
    smallSize: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      minHeight: 38,
    },
    mediumSize: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      minHeight: 50,
    },
    largeSize: {
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.xl,
      minHeight: 58,
    },

    // 文字样式
    text: {
      ...typography.button,
    },

    // 文字尺寸
    smallText: {
      ...typography.buttonSmall,
    },
    mediumText: {
      ...typography.button,
    },
    largeText: {
      ...typography.button,
      fontSize: 16,
    },
  });
