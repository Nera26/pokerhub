'use client';
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBackwardStep } from '@fortawesome/free-solid-svg-icons/faBackwardStep';
import { faPlay } from '@fortawesome/free-solid-svg-icons/faPlay';
import { faForwardStep } from '@fortawesome/free-solid-svg-icons/faForwardStep';
import Modal from '../ui/Modal';

interface Props {
  isOpen: boolean;
  onClose(): void;
}

export default function ReplayModal({ isOpen, onClose }: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col space-y-4">
        <h3 className="text-xl font-bold">Game Replay</h3>
        <div className="bg-primary-bg rounded-xl p-4 h-64 flex items-center justify-center">
          <p className="text-text-secondary">Replay will load here</p>
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
          <div className="text-text-secondary text-sm">Hand: 0 / 0</div>
        </div>
      </div>
    </Modal>
  );
}
