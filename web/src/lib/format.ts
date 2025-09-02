export function formatGBP(amountPence: number): string {
  const pounds = amountPence / 100;
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(pounds);
}

export function formatPercent(rateBps: number): string {
  return `${(rateBps / 100).toFixed(2)}%`;
}

