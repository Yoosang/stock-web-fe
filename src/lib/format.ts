export function formatPrice(price: string | null): string {
  if (price === null) return "-";
  const value = Number(price);
  if (Number.isNaN(value)) return "-";
  return value.toLocaleString("ko-KR");
}

export function formatChangeRate(changeRate: string | null): string {
  if (changeRate === null) return "-";
  const value = Number(changeRate);
  if (Number.isNaN(value)) return "-";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function changeRateColorClass(changeRate: string | null): string {
  if (changeRate === null) return "text-gray-500";
  const value = Number(changeRate);
  if (Number.isNaN(value) || value === 0) return "text-gray-500";
  return value > 0 ? "text-red-600" : "text-blue-600";
}
