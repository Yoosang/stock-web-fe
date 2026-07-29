import { NextRequest, NextResponse } from "next/server";

// ACCESS_TOKEN 쿠키 자체를 검증(서명/만료)하지는 않는다 — 그러려면 JWT_SECRET을 프론트에도
// 둬야 해서 백엔드(stock-market-service)와 시크릿이 중복된다. 여기서는 "쿠키가 아예 없는"
// 명백한 미로그인 상태만 걸러 렌더 전에 리다이렉트하고, 실제 서명/만료 검증은 항상 백엔드가
// 전담한다. 쿠키는 있지만 만료/무효인 경우는 클라이언트의 useRequireAuth(/auth/me 확인)가
// 이어서 처리한다.
const ACCESS_TOKEN_COOKIE = "ACCESS_TOKEN";

export function proxy(request: NextRequest) {
  if (!request.cookies.has(ACCESS_TOKEN_COOKIE)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/watchlist/:path*", "/stocks/:path*"],
};
