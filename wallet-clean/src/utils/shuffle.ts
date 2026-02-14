/**
 * 数组打乱算法（Fisher-Yates Shuffle）
 * 用于助记词验证时打乱单词顺序
 */

/**
 * 打乱数组（不修改原数组）
 */
export const shuffle = <T>(array: T[]): T[] => {
  const shuffled = [...array];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
};

/**
 * 打乱数组（修改原数组）
 */
export const shuffleInPlace = <T>(array: T[]): T[] => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }

  return array;
};

/**
 * 生成随机索引数组
 * @param length 数组长度
 * @returns 打乱的索引数组
 */
export const generateRandomIndices = (length: number): number[] => {
  const indices = Array.from({ length }, (_, i) => i);
  return shuffle(indices);
};
