'use client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBackwardStep } from '@fortawesome/free-solid-svg-icons/faBackwardStep';
import { faPlay } from '@fortawesome/free-solid-svg-icons/faPlay';
import { faForwardStep } from '@fortawesome/free-solid-svg-icons/faForwardStep';
import { useQuery } from '@tanstack/react-query';
import { fetchHandReplay } from '@/lib/api/replay';
import Modal from '../ui/Modal';

interface Props {
  isOpen: boolean;
  handId: string;
  onClose(): void;
}

export default function ReplayModal({ isOpen, onClose, handId }: Props) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['handReplay', handId],
    queryFn: () => fetchHandReplay(handId),
    enabled: isOpen,
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col space-y-4">
        <h3 className="text-xl font-bold">Game Replay</h3>
        <div className="bg-primary-bg rounded-xl p-4 h-64 overflow-auto flex items-center justify-center">
          {isLoading ? (
            <p className="text-text-secondary">Loading replay...</p>
          ) : error ? (
            <p className="text-red-500">Failed to load replay</p>
          ) : data && data.length ? (
            <ul className="w-full text-text-secondary text-sm space-y-1">
              {data.map((f, i) => (
                <li key={i}>{`Frame ${i + 1}: ${f.street}`}</li>
              ))}
            </ul>
          ) : (
            <p className="text-text-secondary">No replay data</p>
          )}
        </div>
        <div className="flex justify-between items-center">
          <div className="flex space-x-4">
            <button
              className="text-text-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-yellow rounded"
              aria-label="Previous hand"
              disabled
            >
              <FontAwesomeIcon icon={faBackwardStep} className="text-xl" />
            </button>
            <button
              className="text-accent-yellow focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-yellow rounded"
              aria-label="Play"
            >
              <FontAwesomeIcon icon={faPlay} className="text-xl" />
            </button>
            <button
              className="text-text-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-yellow rounded"
              aria-label="Next hand"
              disabled
            >
              <FontAwesomeIcon icon={faForwardStep} className="text-xl" />
            </button>
          </div>
          <div className="text-text-secondary text-sm">
            Hand: {data ? data.length : 0} / {data ? data.length : 0}
          </div>
        </div>
      </div>
    </Modal>
  );
}
