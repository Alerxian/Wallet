/**
 * 设置密码页面
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors, typography, spacing } from '@theme';
import { Button } from '@components/common/Button';
import { Input } from '@components/common/Input';
import { Card } from '@components/common/Card';
import { useWalletStore } from '@store/walletStore';
import { validatePassword, isPasswordMatch } from '@utils/validation';
import type { AuthScreenNavigationProp } from '@types/navigation.types';

interface SetPasswordScreenProps {
  navigation: AuthScreenNavigationProp<'SetPassword'>;
  route: { params: { mnemonic: string } };
}

export const SetPasswordScreen: React.FC<SetPasswordScreenProps> = ({
  navigation,
  route,
}) => {
  const { mnemonic } = route.params;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (errors.password) {
      setErrors(prev => ({ ...prev, password: undefined }));
    }
  };

  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text);
    if (errors.confirm) {
      setErrors(prev => ({ ...prev, confirm: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { password?: string; confirm?: string } = {};

    // 验证密码
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.errors[0];
    }

    // 验证确认密码
    if (!isPasswordMatch(password, confirmPassword)) {
      newErrors.confirm = '两次密码不一致';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const { createWallet } = useWalletStore();

  const handleCreateWallet = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const wallet = await createWallet('钱包 1', password, mnemonic);

      Alert.alert('成功', '钱包创建成功！', [
        {
          text: '完成',
          onPress: () => {
            // 状态管理会自动导航到主页面
            console.log('钱包创建成功:', wallet.address);
          },
        },
      ]);
    } catch (error) {
      Alert.alert('错误', `创建钱包失败: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>设置密码</Text>
          <Text style={styles.subtitle}>
            密码用于加密您的钱包，请务必记住
          </Text>

          <Card style={styles.infoCard} variant="outlined">
            <Text style={styles.infoTitle}>💡 密码要求</Text>
            <Text style={styles.infoText}>
              • 长度 6-20 位{'\n'}
              • 建议包含字母和数字{'\n'}
              • 密码不会上传到服务器{'\n'}
              • 忘记密码只能通过助记词恢复
            </Text>
          </Card>

          <Input
            label="设置密码"
            placeholder="请输入密码"
            value={password}
            onChangeText={handlePasswordChange}
            secureTextEntry
            error={errors.password}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Input
            label="确认密码"
            placeholder="请再次输入密码"
            value={confirmPassword}
            onChangeText={handleConfirmPasswordChange}
            secureTextEntry
            error={errors.confirm}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Button
            title="创建钱包"
            onPress={handleCreateWallet}
            variant="primary"
            loading={loading}
            disabled={!password || !confirmPassword}
            style={styles.createButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
  infoCard: {
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
  },
  infoTitle: {
    ...typography.h4,
    color: colors.status.info,
    marginBottom: spacing.sm,
  },
  infoText: {
    ...typography.caption,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  createButton: {
    marginTop: spacing.lg,
  },
});
