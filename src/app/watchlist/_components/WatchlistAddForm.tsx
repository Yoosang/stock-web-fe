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
        className="border rounded px-3 py-2 flex-1"
      />
      <button type="submit" className="bg-black text-white rounded px-4 py-2">
        추가
      </button>
    </form>
  );
}
