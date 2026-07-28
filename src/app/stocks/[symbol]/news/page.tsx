"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getNews, NewsResponse, UnauthorizedError } from "@/lib/api";
import { formatPubDate } from "@/lib/format";

export default function StockNewsPage() {
  const { symbol } = useParams<{ symbol: string }>();
  const { token, isLoading } = useAuth();
  const router = useRouter();
  const [news, setNews] = useState<NewsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!token) return;
    try {
      const data = await getNews(token, symbol);
      setNews(data);
    } catch (err) {
      if (err instanceof UnauthorizedError) return;
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    }
  }, [token, symbol]);

  useEffect(() => {
    if (isLoading) return;
    if (!token) {
      router.replace("/login");
      return;
    }
    // 마운트 시 서버에서 뉴스를 가져오는 데이터 패칭이라 setState가 뒤따르는 게 정상 흐름이다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reload();
  }, [isLoading, token, router, reload]);

  if (isLoading || !token) return null;

  return (
    <div className="flex-1 max-w-2xl mx-auto w-full p-8 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          {news?.name ?? symbol} <span className="text-gray-400 text-lg">{symbol}</span> 뉴스
        </h1>
        <Link href="/watchlist" className="text-sm text-gray-500 underline">
          관심종목으로
        </Link>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <ul className="flex flex-col divide-y">
        {news?.items.map((item) => (
          <li key={item.url} className="py-4 flex flex-col gap-1">
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium hover:underline"
            >
              {item.title}
            </a>
            <p className="text-sm text-gray-600">{item.content}</p>
            <p className="text-xs text-gray-400">{formatPubDate(item.pubDate)}</p>
          </li>
        ))}
        {news && news.items.length === 0 && (
          <li className="py-6 text-center text-gray-400">관련 뉴스가 없습니다.</li>
        )}
      </ul>
    </div>
  );
}
