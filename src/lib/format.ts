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

// KIS 체결시간은 "HHmmss" 형식 문자열로 내려온다 (예: "093015" → "09:30:15").
export function formatQuoteTime(time: string): string {
  if (time.length !== 6) return time;
  return `${time.slice(0, 2)}:${time.slice(2, 4)}:${time.slice(4, 6)}`;
}

// 한국 주식(코스피/코스닥 보통주) 호가단위 — 가격 구간별로 최소 변동폭이 다르다.
// KIS 시세 데이터에는 이 값이 별도로 오지 않아서(호가단위는 KRX 규정이지 시세
// 필드가 아니다), 현재가를 보고 직접 계산한다. ETF/ETN은 호가단위 규정이 달라서
// 다소 부정확할 수 있지만, 시연 목적상 보통주 기준으로 통일한다.
export function getTickSize(price: number): number {
  if (price < 2000) return 1;
  if (price < 5000) return 5;
  if (price < 20000) return 10;
  if (price < 50000) return 50;
  if (price < 200000) return 100;
  if (price < 500000) return 500;
  return 1000;
}

// 브라우저 로컬 타임존 기준 "오늘" 날짜 (yyyy-MM-dd). 이 앱은 한국 시간대에서
// 쓰는 걸 전제하는 개인/시연용이라 허용 가능한 단순화로 본다.
export function todayDateString(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
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
