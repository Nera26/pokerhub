import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/free-solid-svg-icons';

interface MetricCardProps {
  icon: IconDefinition;
  label: string;
  value: React.ReactNode;
  loading?: boolean;
  error?: boolean;
}

export default function MetricCard({
  icon,
  label,
  value,
  loading = false,
  error = false,
}: MetricCardProps) {
  return (
    <div className="bg-card-bg p-6 rounded-2xl card-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-text-secondary text-sm">{label}</p>
          <p className="text-2xl font-bold">
            {loading ? '...' : error ? 'Error' : value}
          </p>
        </div>
        <FontAwesomeIcon icon={icon} className="text-3xl" />
      </div>
    </div>
  );
}
