"use client";

import ConfirmModal from "../ui/ConfirmModal";

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
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Confirm Action"
      message={`Are you sure you want to ${isUnban ? "unban" : "ban"} ${userName}?`}
      confirmButtonClassName={confirmColor}
    />
  );
}
