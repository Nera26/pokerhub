import { useState, useMemo, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { useTranslations } from '@/hooks/useTranslations';
import Card, { CardContent } from '../../ui/Card';
import {
  Table as UiTable,
  TableHeader,
  TableBody,
  TableCaption,
  TableRow,
  TableCell,
} from '../../ui/Table';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch,
  faChevronLeft,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons';

interface AdminTableManagerProps<T> {
  items: T[];
  header: React.ReactNode; // expects <TableRow> with <TableHead> children
  renderRow: (item: T) => React.ReactNode; // returns <TableRow>
  searchFilter: (item: T, query: string) => boolean;
  searchPlaceholder?: string;
  caption?: string;
  emptyMessage?: string;
  pageSize?: number;
}

export default function AdminTableManager<T>({
  items,
  header,
  renderRow,
  searchFilter,
  searchPlaceholder,
  caption,
  emptyMessage,
  pageSize = 5,
}: AdminTableManagerProps<T>) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const locale = useLocale();
  const { data: t } = useTranslations(locale);

  const searchPlaceholderText =
    searchPlaceholder ?? t?.searchPlaceholder ?? 'Search...';
  const emptyMessageText =
    emptyMessage ?? t?.noResultsFound ?? 'No results found.';

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => searchFilter(item, q));
  }, [items, search, searchFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [search, items]);

  return (
    <div className="space-y-4">
      <div className="relative max-w-xs ml-auto">
        <FontAwesomeIcon
          icon={faSearch}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={searchPlaceholderText}
          className="bg-card-bg border border-dark rounded-xl pl-10 pr-4 py-2 text-text-primary focus:border-accent-yellow focus:outline-none w-full"
        />
      </div>
      <Card>
        <CardContent>
          <UiTable className="w-full">
            <TableHeader>{header}</TableHeader>
            <TableBody>
              {pageItems.map(renderRow)}
              {pageItems.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={100}
                    className="py-10 text-center text-text-secondary"
                  >
                    {emptyMessageText}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            {caption && <TableCaption>{caption}</TableCaption>}
          </UiTable>
        </CardContent>
      </Card>
      <section className="flex justify-center">
        <div className="flex items-center gap-2">
          <button
            aria-label="Previous Page"
            className="bg-card-bg border border-dark text-text-secondary px-3 py-2 rounded-xl hover:bg-hover-bg hover:text-text-primary disabled:opacity-50"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
          <button className="bg-accent-yellow text-black px-4 py-2 rounded-xl font-semibold">
            {page}
          </button>
          {page < pageCount && (
            <button
              className="bg-card-bg border border-dark text-text-secondary px-4 py-2 rounded-xl hover:bg-hover-bg hover:text-text-primary"
              onClick={() => setPage((p) => p + 1)}
            >
              {page + 1}
            </button>
          )}
          <button
            aria-label="Next Page"
            className="bg-card-bg border border-dark text-text-secondary px-3 py-2 rounded-xl hover:bg-hover-bg hover:text-text-primary disabled:opacity-50"
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            disabled={page === pageCount}
          >
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>
      </section>
    </div>
  );
}
