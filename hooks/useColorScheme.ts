// Custom useColorScheme hook that respects the user's theme preference
// This replaces React Native's useColorScheme throughout the app
import { useTheme } from '@/contexts/ThemeContext';

export function useColorScheme(): 'light' | 'dark' {
  const { colorScheme } = useTheme();
  return colorScheme;
}

export default useColorScheme;
