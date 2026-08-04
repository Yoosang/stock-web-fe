"use client";

import { useEffect, useRef } from "react";
import { CandlestickSeries, ColorType, createChart, IChartApi, ISeriesApi, UTCTimestamp } from "lightweight-charts";
import { Candle } from "@/lib/api";
import { getTickSize } from "@/lib/format";

type Props = {
  candles: Candle[];
  emptyMessage?: string;
};

export function PriceChart({ candles, emptyMessage = "시세 연결 중..." }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  // 최초 1회만 차트 인스턴스를 만든다. candles가 바뀔 때마다 재생성하지 않는다.
  // (컨테이너 div는 항상 렌더되어야 하므로, 빈 상태 메시지는 아래에서 오버레이로 처리한다.)
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#8a93a1",
      },
      grid: {
        vertLines: { color: "#232830" },
        horzLines: { color: "#232830" },
      },
      // 가격 축/툴팁에 천단위 콤마를 표시한다 (기본값은 콤마 없는 원시 숫자).
      localization: {
        priceFormatter: (price: number) => price.toLocaleString("ko-KR"),
      },
      width: containerRef.current.clientWidth,
      height: 256,
      timeScale: { timeVisible: true, secondsVisible: true },
    });
    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#f0384b",
      downColor: "#2e90fa",
      borderVisible: false,
      wickUpColor: "#f0384b",
      wickDownColor: "#2e90fa",
    });

    chartRef.current = chart;
    seriesRef.current = series;

    const handleResize = () => {
      if (containerRef.current) chart.applyOptions({ width: containerRef.current.clientWidth });
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, []);

  // 누적된 캔들이 바뀔 때마다 통째로 다시 그린다 (최대 200개로 캡되어 있어 비용이 작다)
  useEffect(() => {
    if (!seriesRef.current || !chartRef.current) return;
    seriesRef.current.setData(candles.map((candle) => ({ ...candle, time: candle.time as UTCTimestamp })));

    // 한국 주식은 소수점 없이 호가단위(틱) 단위로만 움직이므로, 현재가 구간에 맞는
    // 틱 크기를 축/캔들 정밀도에 반영한다 (가격이 구간을 넘나들면 그때그때 갱신됨).
    const lastPrice = candles[candles.length - 1]?.close;
    if (lastPrice !== undefined) {
      seriesRef.current.applyOptions({
        priceFormat: { type: "price", precision: 0, minMove: getTickSize(lastPrice) },
      });
    }

    // fitContent를 안 하면 기본 시간축 간격 기준으로 그려져서, 캔들 개수가 적을 때
    // 몇 개 안 되는 캔들이 왼쪽에 눌린 채 얇게 보인다. 매번 실제 데이터 범위에
    // 맞춰 다시 맞춘다.
    chartRef.current.timeScale().fitContent();
  }, [candles]);

  return (
    <div className="relative h-64 rounded-lg border border-border bg-surface">
      <div ref={containerRef} className="h-full w-full" />
      {candles.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-muted pointer-events-none">
          {emptyMessage}
        </div>
      )}
    </div>
  );
}
