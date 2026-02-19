import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, ImageBackground, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { queryClient } from './src/api/queryClient';
import { useConfigureReactQueryNative } from './src/api/reactQueryNative';
import { MainTab, useAppStore } from './src/store/appStore';
import { TabBar } from './src/components/TabBar';
import { MarketsScreen } from './src/screens/MarketsScreen';
import { MarketDetailScreen } from './src/screens/MarketDetailScreen';
import { PortfolioScreen } from './src/screens/PortfolioScreen';
import { ActivityScreen } from './src/screens/ActivityScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { getThemePalette } from './src/theme/tokens';

const tabMap: Record<MainTab, ReactNode> = {
  MARKETS: <MarketsScreen />,
  PORTFOLIO: <PortfolioScreen />,
  ACTIVITY: <ActivityScreen />,
  SETTINGS: <SettingsScreen />,
};

export default function App() {
  useConfigureReactQueryNative();

  const currentTab = useAppStore((state) => state.currentTab);
  const selectedMarketId = useAppStore((state) => state.selectedMarketId);
  const themeMode = useAppStore((state) => state.themeMode);
  const themeTransition = useAppStore((state) => state.themeTransition);
  const settings = useAppStore((state) => state.settings);
  const applyThemeMode = useAppStore((state) => state.applyThemeMode);
  const hydratePersisted = useAppStore((state) => state.hydratePersisted);

  const [route, setRoute] = useState<string>('MARKETS');
  const routeAnim = useMemo(() => new Animated.Value(1), []);

  const ripple = useMemo(() => new Animated.Value(0), []);
  const rippleOpacity = useMemo(() => new Animated.Value(0), []);
  const [rippleColor, setRippleColor] = useState<string>(getThemePalette(themeMode).bg);
  const [rippleOrigin, setRippleOrigin] = useState({ x: 0, y: 0 });
  const handledTransitionId = useRef<number | null>(null);

  const palette = getThemePalette(themeMode);
  const routeKey = selectedMarketId ? `DETAIL-${selectedMarketId}` : currentTab;

  useEffect(() => {
    hydratePersisted();
  }, [hydratePersisted]);

  useEffect(() => {
    if (route === routeKey) {
      return;
    }

    routeAnim.setValue(0);
    setRoute(routeKey);
    Animated.timing(routeAnim, {
      toValue: 1,
      duration: settings.reducedMotion ? 80 : 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [route, routeKey, routeAnim, settings.reducedMotion]);

  useEffect(() => {
    if (!themeTransition || handledTransitionId.current === themeTransition.id) {
      return;
    }

    handledTransitionId.current = themeTransition.id;
    const nextMode = themeMode === 'sand' ? 'night' : 'sand';
    const nextPalette = getThemePalette(nextMode);
    const currentPalette = getThemePalette(themeMode);

    if (settings.reducedMotion) {
      applyThemeMode(nextMode);
      return;
    }

    const { width, height } = Dimensions.get('window');
    const maxRadius = Math.hypot(Math.max(themeTransition.x, width - themeTransition.x), Math.max(themeTransition.y, height - themeTransition.y));

    setRippleOrigin({ x: themeTransition.x, y: themeTransition.y });
    setRippleColor(nextPalette.bg);
    ripple.setValue(0);
    rippleOpacity.setValue(1);

    Animated.sequence([
      Animated.timing(ripple, {
        toValue: maxRadius,
        duration: 360,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(ripple, {
        toValue: 0,
        duration: 280,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        rippleOpacity.setValue(0);
      }
    });

    setTimeout(() => {
      applyThemeMode(nextMode);
      setRippleColor(currentPalette.bg);
    }, 360);
  }, [applyThemeMode, ripple, rippleOpacity, settings.reducedMotion, themeMode, themeTransition]);

  const activeScreen = selectedMarketId ? <MarketDetailScreen /> : tabMap[currentTab];

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <SafeAreaView style={[styles.safe, { backgroundColor: palette.bg }]} edges={['top', 'left', 'right']}>
          <StatusBar style={themeMode === 'night' ? 'light' : 'dark'} />
          <View style={styles.root}>
            <ImageBackground source={require('./assets/splash-icon.png')} imageStyle={styles.image} style={styles.bg}>
              <View style={[styles.overlay, { backgroundColor: palette.veil }]} />
            </ImageBackground>

            <Animated.View
              style={[
                styles.page,
                {
                  opacity: routeAnim,
                  transform: [
                    {
                      translateX: routeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [18, 0],
                      }),
                    },
                  ],
                },
              ]}
              key={route}
            >
              {activeScreen}
            </Animated.View>

            {!selectedMarketId ? <TabBar /> : null}

            <Animated.View
              pointerEvents="none"
              style={[
                styles.ripple,
                {
                  left: rippleOrigin.x - 6,
                  top: rippleOrigin.y - 6,
                  backgroundColor: rippleColor,
                  opacity: rippleOpacity,
                  transform: [{ scale: Animated.divide(ripple, 6) }],
                },
              ]}
            />
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  root: {
    flex: 1,
    overflow: 'hidden',
  },
  bg: {
    ...StyleSheet.absoluteFillObject,
  },
  image: {
    opacity: 0.05,
    resizeMode: 'cover',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  page: {
    flex: 1,
  },
  ripple: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 999,
  },
});
