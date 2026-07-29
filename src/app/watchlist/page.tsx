"use client";

import { useRequireAuth } from "@/lib/use-require-auth";
import { useWatchlist } from "@/lib/use-watchlist";
import { WatchlistAddForm } from "./_components/WatchlistAddForm";
import { WatchlistItemRow } from "./_components/WatchlistItemRow";

export default function WatchlistPage() {
  const { ready, logout } = useRequireAuth();
  const { items, error, addSymbol, removeSymbol } = useWatchlist(ready);

  if (!ready) return null;

  return (
    <div className="flex-1 max-w-2xl mx-auto w-full p-8 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">관심종목</h1>
        <button onClick={logout} className="text-sm text-gray-500 underline">
          로그아웃
        </button>
      </div>

      <WatchlistAddForm onAdd={addSymbol} />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <ul className="flex flex-col divide-y">
        {items.map((item) => (
          <WatchlistItemRow key={item.symbol} item={item} onRemove={removeSymbol} />
        ))}
        {items.length === 0 && <li className="py-6 text-center text-gray-400">관심종목이 없습니다.</li>}
      </ul>
    </div>
  );
}
