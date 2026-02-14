/**
 * 助记词单词卡片组件
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, typography, spacing, shadows } from '@theme';

interface MnemonicWordProps {
  word: string;
  index: number;
  selected?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  showIndex?: boolean;
}

export const MnemonicWord: React.FC<MnemonicWordProps> = ({
  word,
  index,
  selected = false,
  disabled = false,
  onPress,
  style,
  showIndex = true,
}) => {
  const containerStyle = [
    styles.container,
    selected && styles.selected,
    disabled && styles.disabled,
    style,
  ];

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={onPress}
      disabled={disabled || !onPress}
      activeOpacity={0.7}
    >
      {showIndex && <Text style={styles.index}>{index + 1}</Text>}
      <Text style={styles.word}>{word}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    borderRadius: 12,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    minHeight: 44,
    ...shadows.small,
  },
  selected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  disabled: {
    opacity: 0.5,
  },
  index: {
    ...typography.caption,
    color: colors.text.secondary,
    marginRight: spacing.sm,
    minWidth: 20,
  },
  word: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    flex: 1,
  },
});
