"use client";

import { useState } from "react";
import { useRequireAuth } from "@/lib/use-require-auth";
import { useWatchlist } from "@/lib/use-watchlist";
import { WatchlistItemRow } from "./_components/WatchlistItemRow";
import { WatchlistManageModal } from "./_components/WatchlistManageModal";

export default function WatchlistPage() {
  const { ready } = useRequireAuth();
  const { items, loadError, actionError, addSymbol, removeSymbol } = useWatchlist(ready);
  const [manageOpen, setManageOpen] = useState(false);

  if (!ready) return null;

  return (
    <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-8 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">관심종목</h1>
        <button
          onClick={() => setManageOpen(true)}
          className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted hover:text-foreground hover:border-accent transition-colors"
        >
          관리
        </button>
      </div>

      {loadError && <p className="text-sm text-up">{loadError}</p>}

      <ul className="flex flex-col rounded-lg border border-border bg-surface overflow-hidden">
        {items.map((item) => (
          <WatchlistItemRow key={item.symbol} item={item} />
        ))}
        {items.length === 0 && <li className="py-10 text-center text-sm text-muted">관심종목이 없습니다.</li>}
      </ul>

      <WatchlistManageModal
        open={manageOpen}
        onClose={() => setManageOpen(false)}
        items={items}
        error={actionError}
        onAdd={addSymbol}
        onRemove={removeSymbol}
      />
    </div>
  );
}
