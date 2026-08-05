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

export function useWatchlist(initialItems: WatchlistItem[], initialLoadError: string | null) {
  const [items, setItems] = useState<WatchlistItem[]>(initialItems);
  const [loadError, setLoadError] = useState<string | null>(initialLoadError);
  const [actionError, setActionError] = useState<string | null>(null);

  function handleError(err: unknown, setError: (message: string | null) => void) {
    // UnauthorizedError는 전역 로그아웃 이벤트가 이미 처리했고 곧 로그인 페이지로 리다이렉트되므로 메시지를 띄우지 않는다.
    if (err instanceof UnauthorizedError) return;
    setError(getErrorMessage(err));
  }

  const reload = useCallback(async () => {
    try {
      const data = await getWatchlist();
      setItems(data);
    } catch (err) {
      handleError(err, setLoadError);
    }
  }, []);

  const symbolsKey = items.map((item) => item.symbol).join(",");

  useEffect(() => {
    if (!symbolsKey) return;

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
  }, [symbolsKey]);

  async function addSymbol(symbol: string): Promise<boolean> {
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
