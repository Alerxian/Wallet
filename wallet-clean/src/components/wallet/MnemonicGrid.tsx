/**
 * 助记词网格组件
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { MnemonicWord } from './MnemonicWord';
import { spacing } from '@theme';
import { MnemonicWord as MnemonicWordType } from '@types/wallet.types';

interface MnemonicGridProps {
  words: MnemonicWordType[];
  onWordPress?: (word: MnemonicWordType, index: number) => void;
  columns?: number;
  showIndex?: boolean;
  style?: ViewStyle;
}

export const MnemonicGrid: React.FC<MnemonicGridProps> = ({
  words,
  onWordPress,
  columns = 2,
  showIndex = true,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {words.map((wordObj, index) => (
        <View
          key={`${wordObj.word}-${index}`}
          style={[styles.wordWrapper, { width: `${100 / columns}%` }]}
        >
          <MnemonicWord
            word={wordObj.word}
            index={wordObj.index}
            selected={wordObj.selected}
            onPress={onWordPress ? () => onWordPress(wordObj, index) : undefined}
            showIndex={showIndex}
          />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  wordWrapper: {
    padding: spacing.xs,
  },
});
