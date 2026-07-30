"use client";

import { useEffect, useRef, useState } from "react";
import { searchStocks, StockSearchResult } from "@/lib/api";

type Props = {
  onAdd: (symbol: string) => Promise<boolean>;
};

const DEBOUNCE_MS = 300;

export function WatchlistAddForm({ onAdd }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StockSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      // 입력이 비면 검색 결과를 비우는 것도 이 이펙트(query 변화에 반응)의 정상 흐름이다.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const data = await searchStocks(trimmed);
        setResults(data);
        setOpen(true);
      } catch {
        setResults([]);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSelect(symbol: string) {
    const added = await onAdd(symbol);
    if (added) {
      setQuery("");
      setResults([]);
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder="종목명 검색 (예: 삼성전자)"
        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
      />
      {open && results.length > 0 && (
        <div className="absolute z-10 mt-2 w-full rounded-lg border border-accent/40 bg-surface-2 shadow-xl overflow-hidden">
          <p className="px-3 py-1.5 text-xs font-medium text-muted border-b border-border">검색 결과</p>
          <ul className="max-h-60 overflow-y-auto">
            {results.map((stock) => (
              <li key={stock.symbol}>
                <button
                  type="button"
                  onClick={() => handleSelect(stock.symbol)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-accent/10 transition-colors"
                >
                  <span>
                    {stock.name} <span className="text-muted text-xs font-mono">{stock.symbol}</span>
                  </span>
                  <span className="text-xs text-muted">{stock.market}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
