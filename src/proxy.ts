import { NextResponse, userAgent } from "next/server";
import type { NextRequest } from "next/server";

// PC는 WTS 대시보드(/wts), 모바일은 기존 관심종목 화면(/watchlist)을 쓴다.
// 여기서는 User-Agent로 기기 종류만 보고 분기하며, 인증(ACCESS_TOKEN) 체크는 절대 하지 않는다
// — cross-site 배포에서 쿠키가 proxy까지 전달되지 않아 예전 middleware를 제거했던 문제(3ef95ba)를
// User-Agent는 겪지 않지만, 인증은 지금처럼 클라이언트/서버 fetch의 401 처리에 맡긴다.
const MOBILE_ENTRY = "/watchlist";
const DESKTOP_ENTRY = "/wts";

export function proxy(request: NextRequest) {
  const { device } = userAgent(request);
  const isMobile = device.type === "mobile" || device.type === "tablet";
  const { pathname } = request.nextUrl;

  if (isMobile && pathname === DESKTOP_ENTRY) {
    return NextResponse.redirect(new URL(MOBILE_ENTRY, request.url));
  }
  if (!isMobile && pathname === MOBILE_ENTRY) {
    return NextResponse.redirect(new URL(DESKTOP_ENTRY, request.url));
  }
  return NextResponse.next();
}

// matcher는 빌드 타임에 정적으로 분석되어야 해서 리터럴을 직접 써야 한다(상수 참조 불가).
export const config = {
  matcher: ["/watchlist", "/wts"],
};
