"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/lib/use-require-auth";
import { useQuoteHistory } from "@/lib/use-quote-history";
import { changeRateColorClass, formatChangeRate, formatPrice, formatQuoteTime, todayDateString } from "@/lib/format";
import { PriceChart } from "./PriceChart";

type Props = {
  symbol: string;
  initialDate: string | undefined;
};

export function StockPriceSection({ symbol, initialDate }: Props) {
  const router = useRouter();
  const today = todayDateString();
  const [date, setDate] = useState(initialDate ?? today);

  useRequireAuth();
  const { candles, latest, isToday } = useQuoteHistory(symbol, date);

  const lastCandle = candles[candles.length - 1];
  const price = isToday ? (latest?.price ?? null) : lastCandle ? String(lastCandle.close) : null;
  const changeRate = isToday ? (latest?.changeRate ?? null) : null;
  const time = isToday ? (latest?.time ?? null) : null;
  const priceColorClass = isToday ? changeRateColorClass(changeRate) : "text-muted";

  return (
    <>
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
    </>
  );
}
