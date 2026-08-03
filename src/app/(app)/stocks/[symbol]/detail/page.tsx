"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useRequireAuth } from "@/lib/use-require-auth";
import { getErrorMessage, getNews, NewsResponse, UnauthorizedError } from "@/lib/api";
import { useQuoteHistory } from "@/lib/use-quote-history";
import { changeRateColorClass, formatChangeRate, formatPrice, formatPubDate, formatQuoteTime } from "@/lib/format";
import { PriceChart } from "./_components/PriceChart";

export default function StockDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 max-w-2xl mx-auto w-full px-6 py-8 text-sm text-muted">불러오는 중...</div>
      }
    >
      <StockDetailContent />
    </Suspense>
  );
}

function StockDetailContent() {
  const { symbol } = useParams<{ symbol: string }>();
  const searchParams = useSearchParams();
  const priceParam = searchParams.get("price");
  const seedPrice = priceParam !== null ? Number(priceParam) : null;
  const seedTime = searchParams.get("time");

  const { ready } = useRequireAuth();
  const [news, setNews] = useState<NewsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { candles, latest } = useQuoteHistory(symbol, ready, seedPrice, seedTime);

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

  const price = latest?.price ?? (seedPrice !== null ? String(seedPrice) : null);
  const changeRate = latest?.changeRate ?? null;
  const time = latest?.time ?? seedTime;

  return (
    <div className="flex-1 max-w-2xl mx-auto w-full px-6 py-8 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">
          {news?.name ?? symbol} <span className="text-muted text-sm font-mono">{symbol}</span>
        </h1>
        <Link href="/watchlist" className="text-sm text-muted hover:text-foreground transition-colors">
          관심종목으로
        </Link>
      </div>

      <div className="flex items-baseline gap-3">
        <p className={`text-2xl font-mono tabular-nums ${changeRateColorClass(changeRate)}`}>
          {formatPrice(price)}
        </p>
        {changeRate !== null && (
          <p className={`text-sm font-mono tabular-nums ${changeRateColorClass(changeRate)}`}>
            {formatChangeRate(changeRate)}
          </p>
        )}
        {time && <p className="text-xs text-muted">마지막 체결 {formatQuoteTime(time)}</p>}
      </div>

      <PriceChart candles={candles} />

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
