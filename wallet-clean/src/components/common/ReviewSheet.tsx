import React from 'react';
import { Modal, View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { typography, spacing, ThemeColors } from '@/theme';
import { Button } from './Button';

interface ReviewRow {
  label: string;
  value: string;
  tone?: 'default' | 'warning' | 'danger' | 'success';
}

interface ReviewSheetProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  rows: ReviewRow[];
  confirmText?: string;
  cancelText?: string;
  onCancel: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export const ReviewSheet: React.FC<ReviewSheetProps> = ({
  visible,
  title,
  subtitle,
  rows,
  confirmText = '确认',
  cancelText = '取消',
  onCancel,
  onConfirm,
  loading = false,
}) => {
  const { theme: colors } = useTheme();
  const styles = createStyles(colors);

  const toneStyle = (tone?: ReviewRow['tone']) => {
    if (tone === 'warning') return { color: colors.warning };
    if (tone === 'danger') return { color: colors.status.error };
    if (tone === 'success') return { color: colors.status.success };
    return { color: colors.text.primary };
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

          <View style={styles.rows}>
            {rows.map((row) => (
              <View style={styles.row} key={`${row.label}-${row.value}`}>
                <Text style={styles.rowLabel}>{row.label}</Text>
                <Text style={[styles.rowValue, toneStyle(row.tone)]}>{row.value}</Text>
              </View>
            ))}
          </View>

          <View style={styles.actions}>
            <Button title={cancelText} variant="secondary" onPress={onCancel} style={styles.action} />
            <Button title={confirmText} onPress={onConfirm} loading={loading} style={styles.action} />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: colors.overlay.medium,
      padding: spacing.md,
    },
    sheet: {
      borderRadius: 18,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      gap: spacing.sm,
    },
    title: {
      ...typography.h4,
      color: colors.text.primary,
    },
    subtitle: {
      ...typography.caption,
      color: colors.text.secondary,
    },
    rows: {
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: colors.divider,
      paddingVertical: spacing.sm,
      gap: spacing.sm,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    rowLabel: {
      ...typography.caption,
      color: colors.text.secondary,
    },
    rowValue: {
      ...typography.captionMedium,
      maxWidth: '62%',
      textAlign: 'right',
    },
    actions: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    action: {
      flex: 1,
    },
  });
