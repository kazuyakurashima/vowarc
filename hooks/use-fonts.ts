/**
 * VowArc Font Loading Hook
 *
 * Loads custom fonts for the design system:
 * - Noto Serif JP (Light) - for headings
 * - Noto Sans JP (Regular, Medium) - for body text
 * - Inter (Regular, Medium, SemiBold) - for numeric/English text
 */

import {
  useFonts,
  NotoSerifJP_300Light,
} from '@expo-google-fonts/noto-serif-jp';
import {
  NotoSansJP_400Regular,
  NotoSansJP_500Medium,
} from '@expo-google-fonts/noto-sans-jp';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';

export function useVowArcFonts() {
  const [fontsLoaded] = useFonts({
    // Noto Serif JP - for headings
    'NotoSerifJP-Light': NotoSerifJP_300Light,

    // Noto Sans JP - for body text
    'NotoSansJP-Regular': NotoSansJP_400Regular,
    'NotoSansJP-Medium': NotoSansJP_500Medium,

    // Inter - for numeric and English text
    'Inter': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
  });

  return fontsLoaded;
}
