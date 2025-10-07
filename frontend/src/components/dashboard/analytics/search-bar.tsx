'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { useLocale } from 'next-intl';
import SearchInput from '../common/search-input';
import type { AuditLogType } from '@shared/types';
import { useAuditLogTypes } from '@/hooks/lookups';
import { useTranslations } from '@/hooks/useTranslations';
import CenteredMessage from '@/components/centered-message';

interface Props {
  search: string;
  setSearch: (v: string) => void;
  type: 'all' | AuditLogType;
  setType: (v: 'all' | AuditLogType) => void;
  onSubmit: () => void;
}

export default function SearchBar({
  search,
  setSearch,
  type,
  setType,
  onSubmit,
}: Props) {
  const locale = useLocale();
  const { data: t } = useTranslations(locale);
  const { data, isLoading, isError } = useAuditLogTypes();
  const logTypes = data?.types ?? [];

  if (isLoading) return <CenteredMessage>Loading log types...</CenteredMessage>;
  if (isError)
    return <CenteredMessage>Failed to load log types</CenteredMessage>;
  if (logTypes.length === 0)
    return <CenteredMessage>No log types found</CenteredMessage>;

  return (
    <div className="bg-card-bg p-6 rounded-2xl shadow-[0_4px_8px_rgba(0,0,0,0.3)]">
      <h3 className="text-lg font-bold mb-4">Search Logs</h3>
      <div className="flex gap-3">
        <div className="flex-1">
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t?.auditSearchPlaceholder ?? 'Search…'}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSubmit();
            }}
            className="py-3"
          />
        </div>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as 'all' | AuditLogType)}
          className="bg-primary-bg border border-dark rounded-xl px-4 py-3 text-sm"
        >
          <option value="all">All Types</option>
          {logTypes.map((logType) => (
            <option key={logType} value={logType}>
              {logType}
            </option>
          ))}
        </select>
        <button
          onClick={onSubmit}
          className="bg-accent-green px-6 py-3 rounded-xl font-semibold hover:shadow-[0_0_20px_rgba(28,139,76,0.3)]"
          title="Search"
        >
          <FontAwesomeIcon icon={faSearch} />
        </button>
      </div>
    </div>
  );
}
