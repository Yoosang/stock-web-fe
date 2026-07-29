"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth();

  return (
    <div className="flex flex-col flex-1">
      <header className="border-b border-border bg-surface">
        <div className="max-w-4xl mx-auto w-full flex items-center justify-between px-6 py-4">
          <Link href="/watchlist" className="text-lg font-semibold tracking-tight">
            Stock<span className="text-accent">Market</span>
          </Link>
          <button onClick={logout} className="text-sm text-muted hover:text-foreground transition-colors">
            로그아웃
          </button>
        </div>
      </header>
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}
