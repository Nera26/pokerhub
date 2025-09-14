import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  NavItemsResponseSchema,
  type NavItem as NavItemResponse,
  NavIconsResponseSchema,
  NavItemSchema,
  type NavItemRequest,
} from '@shared/types';
import { apiClient, type ApiError } from './client';
import { z } from 'zod';

export type NavItem = {
  flag: string;
  href: string;
  label: string;
  icon?: IconDefinition;
  badge?: number;
  avatar?: string;
};

function toIconDefinition(
  name: string,
  svg: string,
): IconDefinition | undefined {
  const viewBoxMatch = svg.match(/viewBox="0 0 (\d+) (\d+)"/);
  const pathMatch = svg.match(/<path[^>]*d="([^"]+)"/);
  if (!viewBoxMatch || !pathMatch) return undefined;
  const width = parseInt(viewBoxMatch[1], 10);
  const height = parseInt(viewBoxMatch[2], 10);
  const path = pathMatch[1];
  return {
    prefix: 'fac',
    iconName: name as any,
    icon: [width, height, [], '', path],
  };
}

export async function fetchNavItems({
  signal,
}: { signal?: AbortSignal } = {}): Promise<NavItem[]> {
  try {
    const [items, icons] = await Promise.all([
      apiClient('/api/nav-items', NavItemsResponseSchema, {
        signal,
      }) as Promise<NavItemResponse[]>,
      apiClient('/api/nav-icons', NavIconsResponseSchema, { signal }).catch(
        () => [],
      ),
    ]);
    const iconMap = new Map<string, IconDefinition>();
    for (const { name, svg } of icons) {
      const def = toIconDefinition(name, svg);
      if (def) iconMap.set(name, def);
    }
    return items.map(({ icon, ...rest }: NavItemResponse) => ({
      ...rest,
      ...(icon && iconMap.has(icon) ? { icon: iconMap.get(icon)! } : {}),
    }));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : (err as ApiError).message;
    throw { message: `Failed to fetch nav items: ${message}` } as ApiError;
  }
}

export async function createNavItem(
  body: NavItemRequest,
): Promise<NavItemResponse> {
  return apiClient('/api/nav-items', NavItemSchema, { method: 'POST', body });
}

export async function updateNavItem(
  flag: string,
  body: NavItemRequest,
): Promise<NavItemResponse> {
  return apiClient(`/api/nav-items/${flag}`, NavItemSchema, {
    method: 'PUT',
    body,
  });
}

export async function deleteNavItem(flag: string): Promise<void> {
  await apiClient(`/api/nav-items/${flag}`, z.void(), {
    method: 'DELETE',
  });
}

export type { ApiError } from './client';
