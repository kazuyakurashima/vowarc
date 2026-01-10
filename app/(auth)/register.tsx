import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/auth';
import { Button, TextInput } from '@/components/ui';
import { colors, spacing, fontSizes, typography } from '@/constants/theme';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { signUp } = useAuth();

  const handleRegister = async () => {
    try {
      setLoading(true);
      setError('');

      if (password !== confirmPassword) {
        setError('パスワードが一致しません');
        return;
      }

      if (password.length < 6) {
        setError('パスワードは6文字以上である必要があります');
        return;
      }

      await signUp(email, password);
      // After successful registration, go to onboarding
      router.replace('/(onboarding)');
    } catch (err) {
      setError(err instanceof Error ? err.message : '登録に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title}>VowArk</Text>
        <Text style={styles.subtitle}>21日間のトライアル後、継続する場合は{'\n'}9週間一括¥19,800です</Text>

        <View style={styles.form}>
          <TextInput
            label="メールアドレス"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          <TextInput
            label="パスワード"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
          />

          <TextInput
            label="パスワード（確認）"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            title="アカウント登録"
            onPress={handleRegister}
            loading={loading}
            disabled={!email || !password || !confirmPassword}
            style={styles.button}
          />

          <Button
            title="ログイン画面へ戻る"
            variant="text"
            onPress={() => router.back()}
            style={styles.backButton}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  title: {
    fontFamily: typography.heading.fontFamily,
    fontSize: fontSizes.xxxl,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: fontSizes.sm * typography.body.lineHeight,
  },
  form: {
    marginTop: spacing.xl,
  },
  button: {
    marginTop: spacing.lg,
  },
  backButton: {
    marginTop: spacing.md,
  },
  error: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.sm,
    color: colors.error,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
});
