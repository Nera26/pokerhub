'use client';

import { useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faFilter } from '@fortawesome/free-solid-svg-icons';

import SearchBar from './SearchBar';
import QuickStats from './QuickStats';
import ActivityChart from './ActivityChart';
import ErrorChart from './ErrorChart';
import AuditTable from './AuditTable';
import AdvancedFilterModal from './AdvancedFilterModal';
import DetailModal from './DetailModal';
import { SAMPLE_LOGS, LogRow, LogType } from '../data/analyticsSample';

export default function Analytics() {
  const [search, setSearch] = useState('');
  const [type, setType] = useState<'all' | LogType>('all');

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showDetail, setShowDetail] = useState<LogRow | null>(null);

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [resultLimit, setResultLimit] = useState(25);

  const [page, setPage] = useState(1);
  const pageSize = 8;

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    let rows = SAMPLE_LOGS.filter((r) => {
      const textOk =
        !s ||
        `${r.date} ${r.type} ${r.description} ${r.user} ${r.ip}`
          .toLowerCase()
          .includes(s);
      const typeOk = type === 'all' || r.type === type;
      return textOk && typeOk;
    });

    if (userFilter.trim()) {
      rows = rows.filter((r) =>
        `${r.user}`.toLowerCase().includes(userFilter.trim().toLowerCase()),
      );
    }
    if (dateFrom) {
      rows = rows.filter((r) => new Date(r.date) >= new Date(dateFrom));
    }
    if (dateTo) {
      rows = rows.filter(
        (r) => new Date(r.date) <= new Date(dateTo + ' 23:59:59'),
      );
    }

    return rows.slice(0, resultLimit);
  }, [search, type, userFilter, dateFrom, dateTo, resultLimit]);

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const rows = filtered.slice(start, start + pageSize);

  const statTotal = filtered.length || 1247; // fallback demo figure
  const statErrors = filtered.filter((r) => r.type === 'Error').length || 23;
  const statLogins = filtered.filter((r) => r.type === 'Login').length || 892;

  const exportCSV = () => {
    const header = 'Date,Type,Description,User\n';
    const body = filtered
      .map((r) => `${r.date},${r.type},"${r.description}",${r.user}`)
      .join('\n');
    const csvContent = 'data:text/csv;charset=utf-8,' + header + body;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.href = encodedUri;
    link.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const applyAdvanced = () => {
    setShowAdvanced(false);
    setPage(1);
  };

  const clearAdvanced = () => {
    setDateFrom('');
    setDateTo('');
    setUserFilter('');
    setResultLimit(25);
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">System Audit Logs</h2>
          <p className="text-text-secondary">
            Track system events, errors, and user activities
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={exportCSV}
            className="bg-accent-blue hover:bg-blue-600 px-4 py-2 rounded-xl font-semibold text-white flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faDownload} />
            Export
          </button>
          <button
            onClick={() => setShowAdvanced(true)}
            className="border-2 border-accent-yellow text-accent-yellow hover:bg-accent-yellow hover:text-black px-4 py-2 rounded-xl font-semibold"
          >
            <FontAwesomeIcon icon={faFilter} className="mr-2" />
            Filter
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SearchBar
          search={search}
          setSearch={(v) => {
            setSearch(v);
            setPage(1);
          }}
          type={type}
          setType={(v) => {
            setType(v);
            setPage(1);
          }}
          onSubmit={() => setPage(1)}
        />
        <QuickStats total={statTotal} errors={statErrors} logins={statLogins} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityChart />
        <ErrorChart />
      </section>

      <AuditTable
        rows={rows}
        page={page}
        pageCount={pageCount}
        start={start}
        total={total}
        setPage={setPage}
        onView={setShowDetail}
      />

      <AdvancedFilterModal
        open={showAdvanced}
        onClose={() => setShowAdvanced(false)}
        dateFrom={dateFrom}
        setDateFrom={setDateFrom}
        dateTo={dateTo}
        setDateTo={setDateTo}
        userFilter={userFilter}
        setUserFilter={setUserFilter}
        resultLimit={resultLimit}
        setResultLimit={setResultLimit}
        onApply={applyAdvanced}
        onClear={clearAdvanced}
      />

      <DetailModal row={showDetail} onClose={() => setShowDetail(null)} />
    </div>
  );
}
