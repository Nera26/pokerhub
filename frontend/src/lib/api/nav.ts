import { z } from 'zod';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faHome } from '@fortawesome/free-solid-svg-icons/faHome';
import { faWallet } from '@fortawesome/free-solid-svg-icons/faWallet';
import { faTags } from '@fortawesome/free-solid-svg-icons/faTags';
import { faTrophy } from '@fortawesome/free-solid-svg-icons/faTrophy';
import { faBell } from '@fortawesome/free-solid-svg-icons/faBell';
import { apiClient, type ApiError } from './client';

export type NavItem = {
  flag: string;
  href: string;
  label: string;
  icon?: IconDefinition;
  badge?: number;
  avatar?: string;
};

const NavItemSchema = z.object({
  flag: z.string(),
  href: z.string(),
  label: z.string(),
  icon: z.string().optional(),
});

const NavItemsSchema = z.array(NavItemSchema);

const ICONS: Record<string, IconDefinition> = {
  home: faHome,
  wallet: faWallet,
  tags: faTags,
  trophy: faTrophy,
  bell: faBell,
};

export async function fetchNavItems({
  signal,
}: { signal?: AbortSignal } = {}): Promise<NavItem[]> {
  try {
    const items = await apiClient('/api/nav-items', NavItemsSchema, { signal });
    return items.map(({ icon, ...rest }) => ({
      ...rest,
      ...(icon ? { icon: ICONS[icon] } : {}),
    }));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : (err as ApiError).message;
    throw { message: `Failed to fetch nav items: ${message}` } as ApiError;
  }
}

export type { ApiError } from './client';
