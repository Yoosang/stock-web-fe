import Link from "next/link";
import { WatchlistItem } from "@/lib/api";
import { changeRateColorClass, formatChangeRate, formatPrice } from "@/lib/format";

type Props = {
  item: WatchlistItem;
  onRemove: (symbol: string) => void;
};

export function WatchlistItemRow({ item, onRemove }: Props) {
  return (
    <li className="flex items-center justify-between py-3">
      <div>
        <p className="font-medium">
          {item.name} <span className="text-gray-400 text-sm">{item.symbol}</span>
        </p>
        <p className="text-sm text-gray-500">{item.market}</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className={`font-mono text-lg ${changeRateColorClass(item.changeRate)}`}>
            {formatPrice(item.price)}
          </p>
          <p className={`font-mono text-sm ${changeRateColorClass(item.changeRate)}`}>
            {formatChangeRate(item.changeRate)}
          </p>
        </div>
        <Link href={`/stocks/${item.symbol}/news`} className="text-sm text-blue-500 underline">
          뉴스
        </Link>
        <button onClick={() => onRemove(item.symbol)} className="text-sm text-red-500 underline">
          삭제
        </button>
      </div>
    </li>
  );
}
