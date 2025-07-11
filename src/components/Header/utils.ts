// components/Header/utils.ts

/**
 * Форматирует баланс с разделителями и суффиксом валюты.
 */
export const formatBalance = (balance: number | null): string => {
  if (balance === null) return "Загрузка...";

  const absBalance = Math.abs(balance);
  const sign = balance < 0 ? "-" : "";

  if (absBalance >= 1_000_000_000_000) {
    return `${sign}${(balance / 1_000_000_000_000).toFixed(2)}T`;
  } else if (absBalance >= 1_000_000_000) {
    return `${sign}${(balance / 1_000_000_000).toFixed(2)}B`;
  } else if (absBalance >= 1_000_000) {
    return `${sign}${(balance / 1_000_000).toFixed(2)}M`;
  } else if (absBalance >= 1_000) {
    return `${sign}${(balance / 1_000).toFixed(2)}k`;
  } else {
    return balance.toFixed(2);
  }
};
