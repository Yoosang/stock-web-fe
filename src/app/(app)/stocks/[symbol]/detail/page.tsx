import { redirect } from "next/navigation";
import Link from "next/link";
import { getNewsServer } from "@/lib/api-server";
import { StockPriceSection } from "./_components/StockPriceSection";
import { StockNews } from "./_components/StockNews";

type Props = {
  params: Promise<{ symbol: string }>;
  searchParams: Promise<{ date?: string }>;
};

export default async function StockDetailPage({ params, searchParams }: Props) {
  const { symbol } = await params;
  const { date } = await searchParams;

  const result = await getNewsServer(symbol);
  if (result.status === "unauthorized") redirect("/login");

  const news = result.status === "ok" ? result.data : null;

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

      <StockNews news={news} error={result.status === "error" ? "뉴스를 불러오지 못했습니다." : null} />
    </div>
  );
}
