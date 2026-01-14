/**
 * VowArc Configuration
 * Platform-specific API endpoints and configuration
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Get the API base URL based on the current platform
 * - Web: Use relative URLs (handled by Next.js/Expo Router)
 * - iOS/Android: Use absolute URLs pointing to the dev server
 */
function getApiBaseUrl(): string {
  if (Platform.OS === 'web') {
    // Web uses relative URLs
    return '';
  }

  // For iOS/Android, we need to point to the dev server
  // hostUri includes both host and port (e.g., "192.168.1.100:8081" or "exp://...")
  const hostUri = Constants.expoConfig?.hostUri;

  if (hostUri) {
    // Remove any protocol prefix (exp://, exps://)
    const cleanUri = hostUri.replace(/^(exp|exps):\/\//, '');
    // Use the complete host:port from hostUri
    return `http://${cleanUri}`;
  }

  // Fallback for production or if hostUri is not available
  // TODO: Replace with your production API URL when deploying
  return 'https://your-production-api.com';
}

export const config = {
  apiBaseUrl: getApiBaseUrl(),
} as const;

/**
 * Helper to construct full API URLs
 */
export function getApiUrl(path: string): string {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;

  if (config.apiBaseUrl) {
    return `${config.apiBaseUrl}/${cleanPath}`;
  }

  // Web: return relative path
  return `/${cleanPath}`;
}
