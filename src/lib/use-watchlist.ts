"use client";

import { useCallback, useEffect, useState } from "react";
import { Client } from "@stomp/stompjs";
import {
  addWatchlist,
  getErrorMessage,
  getWatchlist,
  QuoteUpdate,
  removeWatchlist,
  UnauthorizedError,
  WatchlistItem,
} from "@/lib/api";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL;

export function useWatchlist(enabled: boolean) {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  function handleError(err: unknown, setError: (message: string | null) => void) {
    // UnauthorizedError는 전역 로그아웃 이벤트가 이미 처리했고 곧 로그인 페이지로 리다이렉트되므로 메시지를 띄우지 않는다.
    if (err instanceof UnauthorizedError) return;
    setError(getErrorMessage(err));
  }

  const reload = useCallback(async () => {
    if (!enabled) return;
    try {
      const data = await getWatchlist();
      setItems(data);
    } catch (err) {
      handleError(err, setLoadError);
    }
  }, [enabled]);

  useEffect(() => {
    // 인증이 준비되면 관심종목을 가져오는 데이터 패칭이라 setState가 뒤따르는 게 정상 흐름이다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reload();
  }, [reload]);

  const symbolsKey = items.map((item) => item.symbol).join(",");

  useEffect(() => {
    if (!enabled || !symbolsKey) return;

    // 쿠키(ACCESS_TOKEN)는 WebSocket 핸드셰이크 요청에 브라우저가 자동으로 실어 보내므로
    // 별도 인증 헤더를 붙일 필요가 없다.
    const client = new Client({
      brokerURL: WS_URL,
      reconnectDelay: 5000,
    });

    client.onConnect = () => {
      symbolsKey.split(",").forEach((symbol) => {
        client.subscribe(`/topic/quotes/${symbol}`, (message) => {
          const quote = JSON.parse(message.body) as QuoteUpdate;
          setItems((prev) =>
            prev.map((item) =>
              item.symbol === quote.symbol
                ? { ...item, price: quote.price, time: quote.time, changeRate: quote.changeRate }
                : item
            )
          );
        });
      });
    };

    client.activate();

    return () => {
      client.deactivate();
    };
  }, [enabled, symbolsKey]);

  async function addSymbol(symbol: string): Promise<boolean> {
    if (!enabled) return false;
    setActionError(null);
    try {
      await addWatchlist(symbol);
      await reload();
      return true;
    } catch (err) {
      handleError(err, setActionError);
      return false;
    }
  }

  async function removeSymbol(symbol: string) {
    if (!enabled) return;
    setActionError(null);
    try {
      await removeWatchlist(symbol);
      await reload();
    } catch (err) {
      handleError(err, setActionError);
    }
  }

  return { items, loadError, actionError, addSymbol, removeSymbol };
}
