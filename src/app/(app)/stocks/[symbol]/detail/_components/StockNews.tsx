import { NewsResponse } from "@/lib/api";
import { formatPubDate } from "@/lib/format";

type Props = {
  news: NewsResponse | null;
  error: string | null;
};

export function StockNews({ news, error }: Props) {
  return (
    <>
      {error && <p className="text-sm text-up">{error}</p>}

      <ul className="flex flex-col rounded-lg border border-border bg-surface overflow-hidden">
        {news?.items.map((item) => (
          <li
            key={item.url}
            className="px-4 py-4 flex flex-col gap-1 border-b border-border last:border-b-0 hover:bg-surface-2 transition-colors"
          >
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium hover:text-accent transition-colors"
            >
              {item.title}
            </a>
            <p className="text-sm text-muted">{item.content}</p>
            <p className="text-xs text-muted">{formatPubDate(item.pubDate)}</p>
          </li>
        ))}
        {news && news.items.length === 0 && (
          <li className="py-10 text-center text-sm text-muted">관련 뉴스가 없습니다.</li>
        )}
      </ul>
    </>
  );
}
