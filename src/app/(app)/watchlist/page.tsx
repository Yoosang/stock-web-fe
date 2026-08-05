import { redirect } from "next/navigation";
import { getWatchlistServer } from "@/lib/api-server";
import { WatchlistView } from "./_components/WatchlistView";

export default async function WatchlistPage() {
  const result = await getWatchlistServer();
  if (result.status === "unauthorized") redirect("/login");

  return (
    <WatchlistView
      initialItems={result.status === "ok" ? result.data : []}
      initialLoadError={result.status === "error" ? "관심종목을 불러오지 못했습니다." : null}
    />
  );
}
