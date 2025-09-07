import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/free-solid-svg-icons';

export type TimeFilter = 'today' | 'week' | 'month' | 'all';

interface MetricCardProps {
  title: string;
  value: React.ReactNode;
  icon: IconDefinition;
  iconClassName?: string;
  valueClassName?: string;
  subtext?: React.ReactNode;
  subtextClassName?: string;
  filter?: {
    value: TimeFilter;
    onChange: (v: TimeFilter) => void;
  };
  className?: string;
}

export default function MetricCard({
  title,
  value,
  icon,
  iconClassName = '',
  valueClassName = '',
  subtext,
  subtextClassName,
  filter,
  className = '',
}: MetricCardProps) {
  return (
    <div className={`bg-card-bg p-6 rounded-2xl card-shadow ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-text-secondary text-sm">{title}</p>
          <div className="flex items-center gap-2 mb-1">
            <p className={`text-2xl font-bold ${valueClassName}`}>{value}</p>
            {filter ? (
              <select
                value={filter.value}
                onChange={(e) => filter.onChange(e.target.value as TimeFilter)}
                className={`bg-primary-bg text-xs px-2 py-1 rounded border border-dark cursor-pointer ${valueClassName}`}
              >
                <option value="today">Today</option>
                <option value="week">7 Days</option>
                <option value="month">Month</option>
                <option value="all">All-Time</option>
              </select>
            ) : null}
          </div>
          {subtext ? (
            <p className={`text-xs ${subtextClassName ?? valueClassName}`}>{subtext}</p>
          ) : null}
        </div>
        <FontAwesomeIcon
          icon={icon}
          className={`text-3xl ${iconClassName || valueClassName}`}
        />
      </div>
    </div>
  );
}

