'use client';
import Modal from '../ui/Modal';

interface Props { isOpen:boolean; title:string; onClose():void; }

export default function BracketModal({ isOpen, title, onClose }:Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col space-y-4">
        <h3 className="text-xl font-bold">{title} Bracket</h3>
        <div className="bg-primary-bg rounded-xl p-4 h-64 flex items-center justify-center">
          <p className="text-text-secondary">Bracket details here</p>
        </div>
      </div>
    </Modal>
  );
}
