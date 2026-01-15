import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/auth';
import { Button, TextInput } from '@/components/ui';
import { colors, spacing, fontSizes, typography } from '@/constants/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetMode, setResetMode] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const { signIn, resetPassword } = useAuth();

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      await signIn(email, password);
      router.replace('/(tabs)');
    } catch (err) {
      // Supabaseエラーメッセージを日本語化
      const errorMessage = err instanceof Error ? err.message : 'ログインに失敗しました';

      if (errorMessage.includes('Email not confirmed')) {
        setError('メールアドレスが未確認です。\n開発中の場合はSupabase Dashboardで「Enable email confirmations」をオフにしてください。');
      } else if (errorMessage.includes('Invalid login credentials')) {
        setError('メールアドレスまたはパスワードが正しくありません');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('メールアドレスを入力してください');
      return;
    }

    try {
      setResetLoading(true);
      setError('');
      await resetPassword(email);
      Alert.alert(
        'メールを送信しました',
        'パスワードリセット用のリンクをメールで送信しました。メールをご確認ください。',
        [{ text: 'OK', onPress: () => setResetMode(false) }]
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'パスワードリセットに失敗しました';
      setError(errorMessage);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={styles.title}>VowArc</Text>
          <Text style={styles.subtitle}>
            {resetMode ? 'パスワードをリセット' : '意志を、物語に変える'}
          </Text>

          <View style={styles.form}>
            <TextInput
              label="メールアドレス"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            {!resetMode && (
              <TextInput
                label="パスワード"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="password"
              />
            )}

            {error ? <Text style={styles.error}>{error}</Text> : null}

            {resetMode ? (
              <>
                <Button
                  title="リセットメールを送信"
                  onPress={handleResetPassword}
                  loading={resetLoading}
                  disabled={!email}
                  style={styles.button}
                />
                <Button
                  title="ログインに戻る"
                  variant="text"
                  onPress={() => {
                    setResetMode(false);
                    setError('');
                  }}
                  style={styles.registerButton}
                />
              </>
            ) : (
              <>
                <Button
                  title="ログイン"
                  onPress={handleLogin}
                  loading={loading}
                  disabled={!email || !password}
                  style={styles.button}
                />

                <Button
                  title="パスワードを忘れた方"
                  variant="text"
                  onPress={() => {
                    setResetMode(true);
                    setError('');
                  }}
                  style={styles.forgotButton}
                />

                <Button
                  title="アカウント登録"
                  variant="text"
                  onPress={() => router.push('/(auth)/register')}
                  style={styles.registerButton}
                />
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
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
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  form: {
    marginTop: spacing.xl,
  },
  button: {
    marginTop: spacing.lg,
  },
  forgotButton: {
    marginTop: spacing.md,
  },
  registerButton: {
    marginTop: spacing.sm,
  },
  error: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.sm,
    color: colors.error,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
});
