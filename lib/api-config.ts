/**
 * API Configuration Helper
 * Provides validated API URLs with proper error handling
 */

/**
 * Get the API base URL with validation
 * @throws Error if EXPO_PUBLIC_API_URL is not configured
 */
export function getApiUrl(): string {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;

  if (!apiUrl) {
    throw new Error(
      'EXPO_PUBLIC_API_URL is not configured. ' +
      'Please set this environment variable in your .env file. ' +
      'Example: EXPO_PUBLIC_API_URL=http://localhost:8081'
    );
  }

  return apiUrl;
}

/**
 * Build a full API endpoint URL
 * @param path - API path (e.g., '/api/audio/transcribe')
 * @returns Full URL
 */
export function buildApiUrl(path: string): string {
  const baseUrl = getApiUrl();

  // Remove leading slash if present
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return `${baseUrl}${normalizedPath}`;
}
