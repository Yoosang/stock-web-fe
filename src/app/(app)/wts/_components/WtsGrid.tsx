const PANELS = [
  "거래대금 상위 20",
  "차트 (1분/3분/일봉)",
  "프로그램매매 실시간",
  "외국인/기관 매매",
  "외국계 창구 매매동향",
  "실시간 호가",
  "체결강도 상위",
  "관심종목",
] as const;

// 패널별 실제 구현은 이후 단계에서 이 자리를 하나씩 대체한다.
export function WtsGrid() {
  return (
    <div className="w-full px-4 py-4 grid grid-cols-4 gap-3">
      {PANELS.map((title) => (
        <section key={title} className="border border-border bg-surface rounded-lg p-4 min-h-40">
          <h2 className="text-sm font-semibold text-muted mb-2">{title}</h2>
          <p className="text-sm text-muted">준비 중</p>
        </section>
      ))}
    </div>
  );
}
