import { useAppStore } from '../store/appStore';
import { getThemePalette } from './tokens';

export function useThemePalette() {
  const themeMode = useAppStore((state) => state.themeMode);
  return getThemePalette(themeMode);
}
