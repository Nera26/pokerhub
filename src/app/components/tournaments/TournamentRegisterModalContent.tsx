'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons/faTimes';
import Button from '../ui/Button';

export type ModalTab = 'Overview' | 'Structure' | 'Prizes';

export interface TournamentDetails {
  name: string;
  buyin: number;
  overview: {
    title: string;
    description: string;
  }[];
  structure: {
    title: string;
    description: string;
  }[];
  prizes: {
    title: string;
    description: string;
  }[];
}

export interface TournamentRegisterModalContentProps {
  details: TournamentDetails;
  onClose: () => void;
  onConfirm: () => void;
}

export default function TournamentRegisterModalContent({
  details,
  onClose,
  onConfirm,
}: TournamentRegisterModalContentProps) {
  const tabs: ModalTab[] = ['Overview', 'Structure', 'Prizes'];
  const [activeTab, setActiveTab] = useState<ModalTab>('Overview');

  const renderPanel = () => {
    const items = details[
      activeTab.toLowerCase() as keyof TournamentDetails
    ] as { title: string; description: string }[];
    return (
      <div className="space-y-4">
        {items.map((item, idx) => (
          <div key={idx} className="bg-primary-bg rounded-xl p-4">
            <h4 className="font-semibold mb-2 text-text-primary">
              {item.title}
            </h4>
            <p className="text-text-secondary text-sm">{item.description}</p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="p-6 border-b border-border-dark flex justify-between items-center">
        <h2 className="text-2xl font-bold text-text-primary">{details.name}</h2>
        <button
          onClick={onClose}
          aria-label="Close"
          className="text-text-secondary hover:text-accent-yellow focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-yellow rounded"
        >
          <FontAwesomeIcon icon={faTimes} className="text-xl" />
        </button>
      </div>

      {/* Tabs */}
      <div className="p-6">
        <div className="flex space-x-6 border-b border-border-dark mb-6">
          {tabs.map((tab) => {
            const isActive = tab === activeTab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`modal-tab px-4 py-2 font-semibold border-b-2 transition-colors duration-200 ${
                  isActive
                    ? 'border-accent-yellow text-accent-yellow'
                    : 'border-transparent text-text-secondary hover:text-accent-yellow'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>
        {/* Panel Content */}
        {renderPanel()}
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-border-dark">
        <Button
          variant="primary"
          className="w-full uppercase"
          onClick={onConfirm}
        >
          CONFIRM REGISTRATION (${details.buyin})
        </Button>
      </div>
    </div>
  );
}
