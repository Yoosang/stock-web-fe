import { redirect } from "next/navigation";
import Link from "next/link";
import { getAlertSettingsServer, getNewsServer } from "@/lib/api-server";
import { StockPriceSection } from "./_components/StockPriceSection";
import { StockNews } from "./_components/StockNews";
import { AlertSettings } from "./_components/AlertSettings";

type Props = {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ date?: string }>;
};

export default async function StockDetailPage({ params, searchParams }: Props) {
  const { symbol } = await params;
  const { date } = await searchParams;

  const [newsResult, alertResult] = await Promise.all([getNewsServer(symbol), getAlertSettingsServer(symbol)]);
  if (newsResult.status === "unauthorized" || alertResult.status === "unauthorized") redirect("/login");

  const news = newsResult.status === "ok" ? newsResult.data : null;
  const alertSettings = alertResult.status === "ok" ? alertResult.data : null;
  const alertLoadError =
    alertResult.status === "not_in_watchlist"
      ? "관심종목에 먼저 추가해주세요."
      : alertResult.status === "error"
        ? "알림 설정을 불러오지 못했습니다."
        : null;

  return (
    <div className="flex-1 max-w-2xl mx-auto w-full px-6 py-8 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">
          {news?.name ?? symbol} <span className="text-muted text-sm font-mono">{symbol}</span>
        </h1>
        <Link href="/watchlist" className="text-sm text-muted hover:text-foreground transition-colors">
          관심종목으로
        </Link>
      </div>

      <StockPriceSection symbol={symbol} initialDate={date} />

      <AlertSettings symbol={symbol} initialSettings={alertSettings} initialLoadError={alertLoadError} />

      <StockNews news={news} error={newsResult.status === "error" ? "뉴스를 불러오지 못했습니다." : null} />
    </div>
  );
}
