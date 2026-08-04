"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useRequireAuth } from "@/lib/use-require-auth";
import { getErrorMessage, getNews, NewsResponse, UnauthorizedError } from "@/lib/api";
import { useQuoteHistory } from "@/lib/use-quote-history";
import {
  changeRateColorClass,
  formatChangeRate,
  formatPrice,
  formatPubDate,
  formatQuoteTime,
  todayDateString,
} from "@/lib/format";
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const today = todayDateString();
  const [date, setDate] = useState(searchParams.get("date") ?? today);

  const { ready } = useRequireAuth();
  const [news, setNews] = useState<NewsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { candles, latest, isToday } = useQuoteHistory(symbol, ready, date);

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

  const lastCandle = candles[candles.length - 1];
  const price = isToday ? (latest?.price ?? null) : lastCandle ? String(lastCandle.close) : null;
  const changeRate = isToday ? (latest?.changeRate ?? null) : null;
  const time = isToday ? (latest?.time ?? null) : null;
  const priceColorClass = isToday ? changeRateColorClass(changeRate) : "text-muted";

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

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <p className={`text-2xl font-mono tabular-nums ${priceColorClass}`}>{formatPrice(price)}</p>
          {changeRate !== null && (
            <p className={`text-sm font-mono tabular-nums ${priceColorClass}`}>{formatChangeRate(changeRate)}</p>
          )}
          {isToday && time && <p className="text-xs text-muted">마지막 체결 {formatQuoteTime(time)}</p>}
          {!isToday && <p className="text-xs text-muted">종가</p>}
        </div>
        <input
          type="date"
          value={date}
          max={today}
          onChange={(e) => {
            setDate(e.target.value);
            router.replace(`?date=${e.target.value}`, { scroll: false });
          }}
          className="rounded-lg border border-border bg-surface-2 px-2 py-1 text-sm"
        />
      </div>

      <PriceChart candles={candles} emptyMessage={isToday ? "시세 연결 중..." : "해당 날짜의 시세 데이터가 없습니다"} />

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
