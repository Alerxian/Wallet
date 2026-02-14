/**
 * 打乱算法测试
 */

import { shuffle, generateRandomIndices } from '@utils/shuffle';

describe('Shuffle Utils', () => {
  describe('shuffle', () => {
    it('应该返回相同长度的数组', () => {
      const original = [1, 2, 3, 4, 5];
      const shuffled = shuffle(original);

      expect(shuffled.length).toBe(original.length);
    });

    it('应该包含所有原始元素', () => {
      const original = [1, 2, 3, 4, 5];
      const shuffled = shuffle(original);

      original.forEach(item => {
        expect(shuffled).toContain(item);
      });
    });

    it('不应该修改原数组', () => {
      const original = [1, 2, 3, 4, 5];
      const originalCopy = [...original];
      shuffle(original);

      expect(original).toEqual(originalCopy);
    });

    it('大概率会改变顺序', () => {
      const original = Array.from({ length: 12 }, (_, i) => i);
      const shuffled = shuffle(original);

      // 12 个元素完全相同顺序的概率是 1/12! ≈ 0
      expect(shuffled).not.toEqual(original);
    });
  });

  describe('generateRandomIndices', () => {
    it('应该生成正确长度的索引数组', () => {
      const indices = generateRandomIndices(12);
      expect(indices.length).toBe(12);
    });

    it('应该包含 0 到 n-1 的所有索引', () => {
      const indices = generateRandomIndices(12);

      for (let i = 0; i < 12; i++) {
        expect(indices).toContain(i);
      }
    });
  });
});
