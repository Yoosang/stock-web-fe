const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const UNAUTHORIZED_EVENT = "auth:unauthorized";

export class UnauthorizedError extends Error {
  constructor() {
    super("인증이 만료되었습니다. 다시 로그인해 주세요.");
    this.name = "UnauthorizedError";
  }
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

async function apiFetch(path: string, options: RequestInit = {}, token?: string): Promise<Response> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  // token을 실어 보낸 요청(=인증이 필요한 API)에서만 401/403을 세션 무효로 취급한다.
  // 로그인처럼 토큰 없이 호출하는 API의 401(비밀번호 오류 등)과 구분하기 위함.
  if (token && (res.status === 401 || res.status === 403)) {
    window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    throw new UnauthorizedError();
  }

  return res;
}

export async function login(email: string, password: string): Promise<string> {
  const res = await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    throw new Error(res.status === 401 ? "이메일 또는 비밀번호가 올바르지 않습니다." : "로그인에 실패했습니다.");
  }
  return res.text();
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

export async function getWatchlist(token: string): Promise<WatchlistItem[]> {
  const res = await apiFetch("/watchlist", { method: "GET" }, token);
  if (!res.ok) {
    throw new Error("관심종목을 불러오지 못했습니다.");
  }
  return res.json();
}

export async function addWatchlist(token: string, stockSymbol: string): Promise<void> {
  const res = await apiFetch(
    "/watchlist",
    { method: "POST", body: JSON.stringify({ stockSymbol }) },
    token
  );
  if (!res.ok) {
    throw new Error(res.status === 409 ? "이미 추가된 종목입니다." : "종목 추가에 실패했습니다.");
  }
}

export async function removeWatchlist(token: string, stockSymbol: string): Promise<void> {
  const res = await apiFetch(`/watchlist/${stockSymbol}`, { method: "DELETE" }, token);
  if (!res.ok) {
    throw new Error("종목 삭제에 실패했습니다.");
  }
}

export async function getNews(token: string, symbol: string): Promise<NewsResponse> {
  const res = await apiFetch(`/stocks/${symbol}/news`, { method: "GET" }, token);
  if (!res.ok) {
    throw new Error("뉴스를 불러오지 못했습니다.");
  }
  return res.json();
}
