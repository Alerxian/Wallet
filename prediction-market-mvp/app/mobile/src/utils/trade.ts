export function validateTradeAmount(raw: string): { valid: boolean; value: number; message?: string } {
  const value = Number(raw);

  if (!raw.trim()) {
    return { valid: false, value: 0, message: 'Please input an amount.' };
  }

  if (!Number.isFinite(value)) {
    return { valid: false, value: 0, message: 'Amount must be a number.' };
  }

  if (value <= 0) {
    return { valid: false, value: 0, message: 'Amount must be greater than 0.' };
  }

  return { valid: true, value };
}
