"use client";
import { Icon } from "./icons";

export default function HeaderBar() {
  return (
    <header className="bg-card-bg border-b border-dark px-6 py-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="font-semibold text-lg">Admin Dashboard</div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto sm:justify-end">
          {/* Online badge */}
          <div className="flex items-center gap-2 bg-primary-bg rounded-xl px-3 py-2">
            <span className="inline-block w-2 h-2 rounded-full bg-accent-green" />
            <span className="text-sm font-semibold">247 Online</span>
          </div>

          {/* Balance badge */}
          <div className="flex items-center gap-2 bg-primary-bg rounded-xl px-3 py-2">
            <Icon name="dollar" className="w-4 h-4 text-accent-yellow" />
            <span className="text-sm font-semibold">$45,892</span>
          </div>

          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-hover-bg border border-dark grid place-items-center">
            <Icon name="userCircle" className="w-6 h-6 text-text-secondary" />
          </div>
        </div>
      </div>
    </header>
  );
}
