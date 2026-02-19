import { ReactNode } from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';
import { colors } from '../../theme/tokens';

interface ScreenProps {
  children: ReactNode;
}

export function Screen({ children }: ScreenProps) {
  return (
    <View style={styles.root}>
      <ImageBackground source={require('../../../assets/splash-icon.png')} imageStyle={styles.image} style={styles.bg}>
        <View style={styles.overlay}>{children}</View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  bg: {
    flex: 1,
  },
  image: {
    opacity: 0.06,
    resizeMode: 'cover',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(239,231,220,0.95)',
  },
});
