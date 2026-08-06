import { cookies } from "next/headers";
import { AlertSettings, NewsResponse, WatchlistItem } from "@/lib/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export type ServerFetchResult<T> =
  | { status: "ok"; data: T }
  | { status: "unauthorized" }
  | { status: "error" };

async function serverFetch<T>(path: string): Promise<ServerFetchResult<T>> {
  const cookieStore = await cookies();
  const token = cookieStore.get("ACCESS_TOKEN")?.value;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: token ? { Cookie: `ACCESS_TOKEN=${token}` } : {},
    cache: "no-store",
  });

  if (res.status === 401 || res.status === 403) return { status: "unauthorized" };
  if (!res.ok) return { status: "error" };
  return { status: "ok", data: await res.json() };
}

export function getWatchlistServer(): Promise<ServerFetchResult<WatchlistItem[]>> {
  return serverFetch("/watchlist");
}

export function getNewsServer(symbol: string): Promise<ServerFetchResult<NewsResponse>> {
  return serverFetch(`/stocks/${symbol}/news`);
}

export type AlertSettingsFetchResult =
  | { status: "ok"; data: AlertSettings }
  | { status: "unauthorized" }
  | { status: "not_in_watchlist" }
  | { status: "error" };

export async function getAlertSettingsServer(symbol: string): Promise<AlertSettingsFetchResult> {
  const cookieStore = await cookies();
  const token = cookieStore.get("ACCESS_TOKEN")?.value;

  const res = await fetch(`${API_BASE_URL}/watchlist/${symbol}/alert`, {
    headers: token ? { Cookie: `ACCESS_TOKEN=${token}` } : {},
    cache: "no-store",
  });

  if (res.status === 401 || res.status === 403) return { status: "unauthorized" };
  if (res.status === 404) return { status: "not_in_watchlist" };
  if (!res.ok) return { status: "error" };
  return { status: "ok", data: await res.json() };
}
