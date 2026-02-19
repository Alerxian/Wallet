import { validateTradeAmount } from '../trade';

describe('validateTradeAmount', () => {
  it('rejects empty input', () => {
    expect(validateTradeAmount('')).toEqual({
      valid: false,
      value: 0,
      message: 'Please input an amount.',
    });
  });

  it('rejects non-positive input', () => {
    expect(validateTradeAmount('0').valid).toBe(false);
    expect(validateTradeAmount('-2').valid).toBe(false);
  });

  it('accepts decimal amount', () => {
    expect(validateTradeAmount('12.5')).toEqual({ valid: true, value: 12.5 });
  });
});
