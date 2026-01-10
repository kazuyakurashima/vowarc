import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, fontSizes, typography } from '@/constants/theme';
import { Button } from './Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <Text style={styles.title}>エラーが発生しました</Text>
          <Text style={styles.message}>
            アプリケーションで予期しないエラーが発生しました。
          </Text>
          {__DEV__ && this.state.error && (
            <Text style={styles.error}>{this.state.error.toString()}</Text>
          )}
          <Button
            title="再試行"
            onPress={this.handleReset}
            style={styles.button}
          />
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  title: {
    fontFamily: typography.heading.fontFamily,
    fontSize: fontSizes.xl,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  message: {
    fontFamily: typography.body.fontFamily,
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: fontSizes.base * typography.body.lineHeight,
  },
  error: {
    fontFamily: 'Courier',
    fontSize: fontSizes.xs,
    color: colors.error,
    backgroundColor: colors.surface,
    padding: spacing.md,
    marginBottom: spacing.xl,
    borderRadius: 8,
  },
  button: {
    minWidth: 200,
  },
});
