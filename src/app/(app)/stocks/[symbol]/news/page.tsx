"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useRequireAuth } from "@/lib/use-require-auth";
import { getErrorMessage, getNews, NewsResponse, UnauthorizedError } from "@/lib/api";
import { formatPubDate } from "@/lib/format";

export default function StockNewsPage() {
  const { symbol } = useParams<{ symbol: string }>();
  const { ready } = useRequireAuth();
  const [news, setNews] = useState<NewsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!ready) return;
    try {
      const data = await getNews(symbol);
      setNews(data);
    } catch (err) {
      if (err instanceof UnauthorizedError) return;
      setError(getErrorMessage(err));
    }
  }, [ready, symbol]);

  useEffect(() => {
    // 토큰이 준비되면 뉴스를 가져오는 데이터 패칭이라 setState가 뒤따르는 게 정상 흐름이다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reload();
  }, [reload]);

  if (!ready) return null;

  return (
    <div className="flex-1 max-w-2xl mx-auto w-full px-6 py-8 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">
          {news?.name ?? symbol} <span className="text-muted text-sm font-mono">{symbol}</span> 뉴스
        </h1>
        <Link href="/watchlist" className="text-sm text-muted hover:text-foreground transition-colors">
          관심종목으로
        </Link>
      </div>

      {error && <p className="text-sm text-up">{error}</p>}

      <ul className="flex flex-col rounded-lg border border-border bg-surface overflow-hidden">
        {news?.items.map((item) => (
          <li
            key={item.url}
            className="px-4 py-4 flex flex-col gap-1 border-b border-border last:border-b-0 hover:bg-surface-2 transition-colors"
          >
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium hover:text-accent transition-colors"
            >
              {item.title}
            </a>
            <p className="text-sm text-muted">{item.content}</p>
            <p className="text-xs text-muted">{formatPubDate(item.pubDate)}</p>
          </li>
        ))}
        {news && news.items.length === 0 && (
          <li className="py-10 text-center text-sm text-muted">관련 뉴스가 없습니다.</li>
        )}
      </ul>
    </div>
  );
}
