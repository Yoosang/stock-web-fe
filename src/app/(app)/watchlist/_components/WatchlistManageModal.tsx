"use client";

import { useEffect, useRef } from "react";
import { WatchlistItem } from "@/lib/api";
import { WatchlistAddForm } from "./WatchlistAddForm";

type Props = {
  open: boolean;
  onClose: () => void;
  items: WatchlistItem[];
  error: string | null;
  onAdd: (symbol: string) => Promise<boolean>;
  onRemove: (symbol: string) => void;
};

export function WatchlistManageModal({ open, onClose, items, error, onAdd, onRemove }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => {
        // 배경(backdrop) 클릭 시에만 닫는다 — 내부 컨텐츠 클릭은 target이 dialog 자신이 아니다.
        if (e.target === dialogRef.current) onClose();
      }}
      className="backdrop:bg-black/60 bg-surface text-foreground rounded-xl border border-border p-0 w-full max-w-md"
    >
      <div className="flex flex-col gap-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">관심종목 관리</h2>
          <button onClick={onClose} className="text-muted hover:text-foreground transition-colors">
            ✕
          </button>
        </div>

        <WatchlistAddForm onAdd={onAdd} />

        {error && <p className="text-sm text-up">{error}</p>}

        <ul className="flex flex-col rounded-lg border border-border overflow-y-auto max-h-80">
          {items.map((item) => (
            <li
              key={item.symbol}
              className="flex items-center justify-between gap-4 px-3 py-2 border-b border-border last:border-b-0"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{item.name}</p>
                <p className="text-xs text-muted font-mono">{item.symbol}</p>
              </div>
              <button
                onClick={() => onRemove(item.symbol)}
                className="text-xs text-muted hover:text-up transition-colors shrink-0"
              >
                삭제
              </button>
            </li>
          ))}
          {items.length === 0 && <li className="py-6 text-center text-sm text-muted">관심종목이 없습니다.</li>}
        </ul>
      </div>
    </dialog>
  );
}
