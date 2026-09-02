import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { userAgent } from "next/server";

export default async function Home() {
  const cookieStore = await cookies();
  if (!cookieStore.has("ACCESS_TOKEN")) redirect("/login");

  const { device } = userAgent({ headers: await headers() });
  const isMobile = device.type === "mobile" || device.type === "tablet";
  redirect(isMobile ? "/watchlist" : "/wts");
}
