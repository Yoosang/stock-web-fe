import Link from "next/link";
import { WatchlistItem } from "@/lib/api";
import { changeRateColorClass, formatChangeRate, formatPrice } from "@/lib/format";

type Props = {
  item: WatchlistItem;
};

export function WatchlistItemRow({ item }: Props) {
  return (
    <li className="border-b border-border last:border-b-0">
      <Link
        href={`/stocks/${item.symbol}/news`}
        className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-surface-2 transition-colors"
      >
        <div className="min-w-0">
          <p className="font-medium truncate">
            {item.name} <span className="text-muted text-xs font-mono">{item.symbol}</span>
          </p>
          <p className="text-xs text-muted">{item.market}</p>
        </div>
        <div className="text-right shrink-0">
          <p className={`font-mono text-base tabular-nums ${changeRateColorClass(item.changeRate)}`}>
            {formatPrice(item.price)}
          </p>
          <p className={`font-mono text-xs tabular-nums ${changeRateColorClass(item.changeRate)}`}>
            {formatChangeRate(item.changeRate)}
          </p>
        </div>
      </Link>
    </li>
  );
}
