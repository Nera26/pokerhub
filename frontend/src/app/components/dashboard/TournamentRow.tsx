'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEdit,
  faTrash,
  faPlay,
  faClock,
  faExclamationTriangle,
} from '@fortawesome/free-solid-svg-icons';
import type { AdminTournament as Tournament } from '@shared/types';
import { TableRow, TableCell } from '../ui/Table';
import Tooltip from '../ui/Tooltip';

function dollars(n: number) {
  return n.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  });
}

function dateLabel(iso: string) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
}

function timeLabel(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return (
    d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) +
    ' EST'
  );
}

function statusPill(s: Tournament['status']) {
  if (s === 'running')
    return (
      <span className="bg-accent-green px-3 py-1 rounded-full text-white text-sm font-semibold inline-flex items-center">
        <FontAwesomeIcon icon={faPlay} className="mr-1" /> Running
      </span>
    );
  if (s === 'scheduled' || s === 'auto-start')
    return (
      <span className="bg-accent-blue px-3 py-1 rounded-full text-white text-sm font-semibold inline-flex items-center">
        <FontAwesomeIcon icon={faClock} className="mr-1" /> Scheduled
      </span>
    );
  if (s === 'cancelled')
    return (
      <span className="bg-red-500 px-3 py-1 rounded-full text-white text-sm font-semibold inline-flex items-center">
        <FontAwesomeIcon icon={faExclamationTriangle} className="mr-1" />
        Cancelled
      </span>
    );
  return (
    <span className="bg-hover-bg px-3 py-1 rounded-full text-text-secondary text-sm font-semibold">
      Finished
    </span>
  );
}

interface TournamentRowProps {
  tournament: Tournament;
  onEdit: (t: Tournament) => void;
  onDelete: (t: Tournament) => void;
}

export default function TournamentRow({
  tournament,
  onEdit,
  onDelete,
}: TournamentRowProps) {
  const t = tournament;
  return (
    <TableRow>
      <TableCell>
        <div>
          <p className="font-bold">{t.name}</p>
          <p className="text-text-secondary text-sm">
            {t.gameType} • {t.format}
          </p>
        </div>
      </TableCell>
      <TableCell>
        <div>
          <p className="font-semibold">{dateLabel(t.date)}</p>
          <p className="text-text-secondary text-sm">{timeLabel(t.time)}</p>
        </div>
      </TableCell>
      <TableCell>
        <div>
          <p className="text-accent-yellow font-bold">{dollars(t.buyin)}</p>
          <p className="text-text-secondary text-sm">+{dollars(t.fee)} fee</p>
        </div>
      </TableCell>
      <TableCell>
        <div>
          <p className="text-accent-yellow font-bold text-lg">{dollars(t.prizePool)}</p>
          <p className="text-text-secondary text-sm">Guaranteed</p>
        </div>
      </TableCell>
      <TableCell>{statusPill(t.status)}</TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Tooltip text="Edit">
            <button
              onClick={() => onEdit(t)}
              className="bg-accent-yellow text-black px-3 py-2 rounded-xl"
              aria-label="Edit"
            >
              <FontAwesomeIcon icon={faEdit} />
            </button>
          </Tooltip>
          <Tooltip text="Delete">
            <button
              onClick={() => onDelete(t)}
              className="bg-danger-red text-white px-3 py-2 rounded-xl"
              aria-label="Delete"
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </Tooltip>
        </div>
      </TableCell>
    </TableRow>
  );
}

