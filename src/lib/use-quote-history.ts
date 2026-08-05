"use client";

import { useEffect, useState } from "react";
import { Client } from "@stomp/stompjs";
import { Candle, getCandles, QuoteUpdate } from "@/lib/api";
import { todayDateString } from "@/lib/format";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL;
const BUCKET_SECONDS = 180; // 3분봉

// KIS 체결시간("HHmmss")을 오늘 날짜 기준 3분봉 버킷 시작 시각(UNIX 초)으로 변환한다.
//
// lightweight-charts는 시간축 라벨을 표시할 때 타임스탬프를 "UTC 기준"으로 읽어서
// 그대로 보여준다(브라우저 로컬 타임존으로 재변환하지 않음). 그래서 KST 시각을
// new Date(...).getTime()으로 진짜 UTC epoch로 바꿔버리면, 차트에는 9시간 밀린
// 시각(예: 09:30 → 00:30)이 표시된다. 타임존 변환 없이 "KIS가 준 시:분:초 그대로"
// 보여주려면, 그 값을 UTC 필드인 것처럼 그대로 타임스탬프에 박아 넣어야 한다.
// (백엔드도 동일하게 LocalDateTime.toEpochSecond(ZoneOffset.UTC)로 인코딩한다.)
function toBucketStart(hhmmss: string): number {
  const now = new Date();
  const hour = Number(hhmmss.slice(0, 2));
  const minute = Number(hhmmss.slice(2, 4));
  const second = Number(hhmmss.slice(4, 6));
  const seconds = Math.floor(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, second) / 1000
  );
  return Math.floor(seconds / BUCKET_SECONDS) * BUCKET_SECONDS;
}

// 체결이 속한 3분봉 버킷이 마지막 캔들과 같으면 그 캔들의 고가/저가/종가만 갱신하고,
// 새 버킷이면 캔들을 하나 추가한다.
function applyTick(candles: Candle[], time: number, price: number): Candle[] {
  const last = candles[candles.length - 1];
  if (last && last.time === time) {
    const updated: Candle = { ...last, high: Math.max(last.high, price), low: Math.min(last.low, price), close: price };
    return [...candles.slice(0, -1), updated];
  }
  return [...candles, { time, open: price, high: price, low: price, close: price }];
}

export function useQuoteHistory(symbol: string, date: string) {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [latest, setLatest] = useState<QuoteUpdate | null>(null);
  const isToday = date === todayDateString();

  useEffect(() => {
    let cancelled = false;
    let client: Client | null = null;

    // symbol/date가 바뀔 때 이전 종목/날짜의 누적 데이터를 지우고 새로 시작하는
    // 리셋이라 setState가 뒤따르는 게 정상 흐름이다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCandles([]);
    setLatest(null);

    // REST로 해당 날짜 캔들을 먼저 채운 뒤에만 WS를 연다. 병렬로 하면 REST 응답이
    // 늦게 도착했을 때 그 사이 들어온 실시간 틱을 되돌리는(overwrite) 레이스가
    // 생길 수 있다.
    getCandles(symbol, date)
      .then((data) => {
        if (cancelled) return;
        setCandles(data);
        if (!isToday) return; // 과거 날짜는 완결된 데이터라 실시간 갱신 불필요

        // 쿠키(ACCESS_TOKEN)는 WebSocket 핸드셰이크 요청에 브라우저가 자동으로
        // 실어 보내므로 별도 인증 헤더를 붙일 필요가 없다. (use-watchlist.ts와 동일)
        client = new Client({ brokerURL: WS_URL, reconnectDelay: 5000 });
        client.onConnect = () => {
          client!.subscribe(`/topic/quotes/${symbol}`, (message) => {
            const quote = JSON.parse(message.body) as QuoteUpdate;
            setLatest(quote);
            const price = Number(quote.price);
            if (Number.isNaN(price)) return;
            setCandles((prev) => applyTick(prev, toBucketStart(quote.time), price));
          });
        };
        client.activate();
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      client?.deactivate();
    };
  }, [symbol, date, isToday]);

  return { candles, latest, isToday };
}
