"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Client } from "@stomp/stompjs";
import { useAuth } from "@/lib/auth-context";
import { addWatchlist, getWatchlist, removeWatchlist, UnauthorizedError, WatchlistItem } from "@/lib/api";
import { changeRateColorClass, formatChangeRate, formatPrice } from "@/lib/format";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL;

export default function WatchlistPage() {
  const { token, isLoading, logout } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [symbolInput, setSymbolInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleApiError(err: unknown) {
    // UnauthorizedError는 전역 로그아웃 이벤트가 이미 처리했고 곧 로그인 페이지로 리다이렉트되므로 메시지를 띄우지 않는다.
    if (err instanceof UnauthorizedError) return;
    setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
  }

  const reload = useCallback(async () => {
    if (!token) return;
    try {
      const data = await getWatchlist(token);
      setItems(data);
    } catch (err) {
      handleApiError(err);
    }
  }, [token]);

  useEffect(() => {
    if (isLoading) return;
    if (!token) {
      router.replace("/login");
      return;
    }
    // 마운트 시 서버에서 관심종목을 가져오는 데이터 패칭이라 setState가 뒤따르는 게 정상 흐름이다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reload();
  }, [isLoading, token, router, reload]);

  const symbolsKey = items.map((item) => item.symbol).join(",");

  useEffect(() => {
    if (!token || !symbolsKey) return;

    const client = new Client({
      brokerURL: WS_URL,
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
    });

    client.onConnect = () => {
      symbolsKey.split(",").forEach((symbol) => {
        client.subscribe(`/topic/quotes/${symbol}`, (message) => {
          const quote = JSON.parse(message.body) as {
            symbol: string;
            price: string;
            time: string;
            changeRate: string;
          };
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
  }, [token, symbolsKey]);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!token || !symbolInput.trim()) return;
    setError(null);
    try {
      await addWatchlist(token, symbolInput.trim());
      setSymbolInput("");
      await reload();
    } catch (err) {
      handleApiError(err);
    }
  }

  async function handleRemove(symbol: string) {
    if (!token) return;
    try {
      await removeWatchlist(token, symbol);
      await reload();
    } catch (err) {
      handleApiError(err);
    }
  }

  if (isLoading || !token) return null;

  return (
    <div className="flex-1 max-w-2xl mx-auto w-full p-8 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">관심종목</h1>
        <button onClick={logout} className="text-sm text-gray-500 underline">
          로그아웃
        </button>
      </div>

      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          value={symbolInput}
          onChange={(e) => setSymbolInput(e.target.value)}
          placeholder="종목코드 (예: 005930)"
          className="border rounded px-3 py-2 flex-1"
        />
        <button type="submit" className="bg-black text-white rounded px-4 py-2">
          추가
        </button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <ul className="flex flex-col divide-y">
        {items.map((item) => (
          <li key={item.symbol} className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium">
                {item.name} <span className="text-gray-400 text-sm">{item.symbol}</span>
              </p>
              <p className="text-sm text-gray-500">{item.market}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className={`font-mono text-lg ${changeRateColorClass(item.changeRate)}`}>
                  {formatPrice(item.price)}
                </p>
                <p className={`font-mono text-sm ${changeRateColorClass(item.changeRate)}`}>
                  {formatChangeRate(item.changeRate)}
                </p>
              </div>
              <button onClick={() => handleRemove(item.symbol)} className="text-sm text-red-500 underline">
                삭제
              </button>
            </div>
          </li>
        ))}
        {items.length === 0 && <li className="py-6 text-center text-gray-400">관심종목이 없습니다.</li>}
      </ul>
    </div>
  );
}
