const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const UNAUTHORIZED_EVENT = "auth:unauthorized";

export class UnauthorizedError extends Error {
  constructor() {
    super("인증이 만료되었습니다. 다시 로그인해 주세요.");
    this.name = "UnauthorizedError";
  }
}

export function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "오류가 발생했습니다.";
}

export type WatchlistItem = {
  symbol: string;
  name: string;
  market: string;
  price: string | null;
  time: string | null;
  changeRate: string | null;
};

export type NewsItem = {
  title: string;
  url: string;
  content: string;
  pubDate: string;
};

export type NewsResponse = {
  symbol: string;
  name: string;
  items: NewsItem[];
};

export type QuoteUpdate = {
  symbol: string;
  price: string;
  time: string;
  changeRate: string;
};

export type StockSearchResult = {
  symbol: string;
  name: string;
  market: string;
};

export type Candle = { time: number; open: number; high: number; low: number; close: number };

export type AlertSettings = {
  alertEnabled: boolean;
  targetPriceAbove: number | null;
  targetPriceBelow: number | null;
  changeRateThresholdAbove: number | null;
  changeRateThresholdBelow: number | null;
};

async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  return fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include", // httpOnly 쿠키(ACCESS_TOKEN)를 요청에 실어 보내고, 응답의 Set-Cookie를 받는다.
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });
}

// 로그인된 상태로 호출하는 API에서 401/403을 받으면 세션이 무효화된 것으로 보고 전역 로그아웃시킨다.
function assertAuthorized(res: Response): void {
  if (res.status === 401 || res.status === 403) {
    window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    throw new UnauthorizedError();
  }
}

export async function login(email: string, password: string): Promise<void> {
  const res = await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    throw new Error(res.status === 401 ? "이메일 또는 비밀번호가 올바르지 않습니다." : "로그인에 실패했습니다.");
  }
}

export async function signup(email: string, password: string): Promise<void> {
  const res = await apiFetch("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    throw new Error(res.status === 409 ? "이미 사용 중인 이메일입니다." : "회원가입에 실패했습니다.");
  }
}

export async function logout(): Promise<void> {
  await apiFetch("/auth/logout", { method: "POST" });
}

// httpOnly 쿠키는 JS가 읽을 수 없어서, 로그인 여부는 이 세션 확인 API로 판단한다.
export async function getMe(): Promise<boolean> {
  const res = await apiFetch("/auth/me", { method: "GET" });
  return res.ok;
}

export async function getWatchlist(): Promise<WatchlistItem[]> {
  const res = await apiFetch("/watchlist", { method: "GET" });
  assertAuthorized(res);
  if (!res.ok) {
    throw new Error("관심종목을 불러오지 못했습니다.");
  }
  return res.json();
}

export async function addWatchlist(stockSymbol: string): Promise<void> {
  const res = await apiFetch("/watchlist", { method: "POST", body: JSON.stringify({ stockSymbol }) });
  assertAuthorized(res);
  if (!res.ok) {
    if (res.status === 409) throw new Error("이미 추가된 종목입니다.");
    if (res.status === 400) throw new Error("관심종목은 최대 10개까지 등록할 수 있습니다.");
    if (res.status === 410) throw new Error("상장폐지된 종목입니다.");
    throw new Error("종목 추가에 실패했습니다.");
  }
}

export async function removeWatchlist(stockSymbol: string): Promise<void> {
  const res = await apiFetch(`/watchlist/${stockSymbol}`, { method: "DELETE" });
  assertAuthorized(res);
  if (!res.ok) {
    throw new Error("종목 삭제에 실패했습니다.");
  }
}

export async function searchStocks(query: string): Promise<StockSearchResult[]> {
  const res = await apiFetch(`/stocks?query=${encodeURIComponent(query)}`, { method: "GET" });
  assertAuthorized(res);
  if (!res.ok) {
    throw new Error("종목 검색에 실패했습니다.");
  }
  return res.json();
}

export async function getNews(symbol: string): Promise<NewsResponse> {
  const res = await apiFetch(`/stocks/${symbol}/news`, { method: "GET" });
  assertAuthorized(res);
  if (!res.ok) {
    throw new Error("뉴스를 불러오지 못했습니다.");
  }
  return res.json();
}

export async function getCandles(symbol: string, date: string): Promise<Candle[]> {
  const res = await apiFetch(`/stocks/${symbol}/candles?date=${date}`, { method: "GET" });
  assertAuthorized(res);
  if (!res.ok) {
    throw new Error("차트 데이터를 불러오지 못했습니다.");
  }
  return res.json();
}

export async function getAlertSettings(symbol: string): Promise<AlertSettings> {
  const res = await apiFetch(`/watchlist/${symbol}/alert`, { method: "GET" });
  assertAuthorized(res);
  if (!res.ok) {
    if (res.status === 404) throw new Error("관심종목에 먼저 추가해주세요.");
    throw new Error("알림 설정을 불러오지 못했습니다.");
  }
  return res.json();
}

export async function updateAlertSettings(symbol: string, settings: AlertSettings): Promise<void> {
  const res = await apiFetch(`/watchlist/${symbol}/alert`, {
    method: "PUT",
    body: JSON.stringify(settings),
  });
  assertAuthorized(res);
  if (!res.ok) {
    if (res.status === 404) throw new Error("관심종목에 먼저 추가해주세요.");
    throw new Error("알림 설정 저장에 실패했습니다.");
  }
}
