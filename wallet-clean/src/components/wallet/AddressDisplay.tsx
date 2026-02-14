/**
 * 地址展示组件
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { colors, typography, spacing } from '@theme';
import { formatAddress } from '@utils/format';
import * as Clipboard from 'expo-clipboard';

interface AddressDisplayProps {
  address: string;
  label?: string;
  showCopy?: boolean;
  showFull?: boolean;
}

export const AddressDisplay: React.FC<AddressDisplayProps> = ({
  address,
  label,
  showCopy = true,
  showFull = false,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(address);
    setCopied(true);
    Alert.alert('已复制', '地址已复制到剪贴板');
    setTimeout(() => setCopied(false), 2000);
  };

  const displayAddress = showFull ? address : formatAddress(address);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={styles.addressContainer}>
        <Text style={styles.address}>{displayAddress}</Text>

        {showCopy && (
          <TouchableOpacity style={styles.copyButton} onPress={handleCopy}>
            <Text style={styles.copyIcon}>{copied ? '✓' : '📋'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.sm,
  },
  label: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    borderRadius: 12,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  address: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    flex: 1,
    fontFamily: 'monospace',
  },
  copyButton: {
    marginLeft: spacing.sm,
    padding: spacing.xs,
  },
  copyIcon: {
    fontSize: 20,
  },
});
