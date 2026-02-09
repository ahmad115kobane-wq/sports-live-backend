/**
 * Format price in Iraqi Dinar (IQD)
 * Displays as: 75,000 د.ع
 */
export function formatPrice(amount: number): string {
  const formatted = Math.round(amount).toLocaleString('en-US');
  return `${formatted} د.ع`;
}
