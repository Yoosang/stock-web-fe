"use client";

import { WtsGrid } from "./WtsGrid";

// 각 패널이 실제 데이터를 갖게 되면 여기에 포커스 종목 Context 등 공유 상태를 추가한다.
export function WtsDashboard() {
  return <WtsGrid />;
}
