"use client";

import { FormEvent, useState } from "react";

type Props = {
  onAdd: (symbol: string) => Promise<boolean>;
};

export function WatchlistAddForm({ onAdd }: Props) {
  const [symbolInput, setSymbolInput] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = symbolInput.trim();
    if (!trimmed) return;
    const added = await onAdd(trimmed);
    if (added) setSymbolInput("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        value={symbolInput}
        onChange={(e) => setSymbolInput(e.target.value)}
        placeholder="종목코드 (예: 005930)"
        className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
      />
      <button
        type="submit"
        className="rounded-lg bg-accent hover:bg-accent-hover text-accent-foreground text-sm font-medium px-4 py-2 transition-colors"
      >
        추가
      </button>
    </form>
  );
}
