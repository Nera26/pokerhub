"use client";

import Modal from "../ui/Modal";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  userName: string;
  // optional: pass true to render "Unban" state
  mode?: "ban" | "unban";
};

export default function BanUserModal({ isOpen, onClose, onConfirm, userName, mode = "ban" }: Props) {
  const isUnban = mode === "unban";
  const confirmColor = isUnban ? "bg-accent-green hover:bg-green-600" : "bg-danger-red hover:bg-red-600";

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6 text-center">
        <div className="mb-4">
          <span className="inline-flex w-12 h-12 items-center justify-center rounded-full bg-hover-bg">
            <span className="text-2xl">⚠️</span>
          </span>
        </div>
        <h3 className="text-lg font-bold mb-2">Confirm Action</h3>
        <p className="text-text-secondary mb-6">
          Are you sure you want to {isUnban ? "unban" : "ban"} <span className="font-semibold text-text-primary">{userName}</span>?
        </p>

        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className={`flex-1 ${confirmColor} px-4 py-3 rounded-xl font-semibold transition`}
          >
            Confirm
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-card-bg hover:bg-hover-bg border border-dark px-4 py-3 rounded-xl font-semibold transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}
