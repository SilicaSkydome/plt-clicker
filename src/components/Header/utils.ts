// components/Header/utils.ts

/**
 * Форматирует баланс с разделителями и суффиксом валюты.
 */
export function formatBalance(balance: number): string {
  return balance.toLocaleString("en-US", { maximumFractionDigits: 0 }) + " 💰";
}
