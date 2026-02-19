import { focusManager, onlineManager } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';
import { useEffect } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';

export function useConfigureReactQueryNative(): void {
  useEffect(() => {
    if (Platform.OS === 'web') {
      return;
    }

    const appStateSubscription = AppState.addEventListener('change', (status: AppStateStatus) => {
      focusManager.setFocused(status === 'active');
    });

    return () => {
      appStateSubscription.remove();
    };
  }, []);

  useEffect(() => {
    onlineManager.setEventListener((setOnline) =>
      NetInfo.addEventListener((state) => {
        setOnline(Boolean(state.isConnected));
      }),
    );
  }, []);
}
