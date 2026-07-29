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
  if (changeRate === null) return "text-muted";
  const value = Number(changeRate);
  if (Number.isNaN(value) || value === 0) return "text-muted";
  return value > 0 ? "text-up" : "text-down";
}

export function formatPubDate(pubDate: string): string {
  const date = new Date(pubDate);
  if (Number.isNaN(date.getTime())) return pubDate;
  return date.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
