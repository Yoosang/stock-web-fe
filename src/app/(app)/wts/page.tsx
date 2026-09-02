import { redirect } from "next/navigation";
import { getWatchlistServer } from "@/lib/api-server";
import { WtsDashboard } from "./_components/WtsDashboard";

export default async function WtsPage() {
  // 아직 WTS 전용 데이터가 없어 관심종목 조회로 인증 여부만 확인한다(watchlist/page.tsx와 동일 패턴).
  const result = await getWatchlistServer();
  if (result.status === "unauthorized") redirect("/login");

  return <WtsDashboard />;
}
