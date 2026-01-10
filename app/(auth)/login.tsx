import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/auth';
import { Button, TextInput } from '@/components/ui';
import { colors, spacing, fontSizes, typography } from '@/constants/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { signIn } = useAuth();

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      await signIn(email, password);
      router.replace('/(tabs)');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ログインに失敗しました');
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
        <Text style={styles.subtitle}>意志を、物語に変える</Text>

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

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            title="ログイン"
            onPress={handleLogin}
            loading={loading}
            disabled={!email || !password}
            style={styles.button}
          />

          <Button
            title="アカウント登録"
            variant="text"
            onPress={() => router.push('/(auth)/register')}
            style={styles.registerButton}
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
  registerButton: {
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
