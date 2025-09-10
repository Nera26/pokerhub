import { z } from 'zod';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { NavIconsResponseSchema } from '@shared/types';
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
      apiClient('/api/nav-items', NavItemsSchema, { signal }),
      apiClient('/api/nav-icons', NavIconsResponseSchema, { signal }).catch(
        () => [],
      ),
    ]);
    const iconMap = new Map<string, IconDefinition>();
    for (const { name, svg } of icons) {
      const def = toIconDefinition(name, svg);
      if (def) iconMap.set(name, def);
    }
    return items.map(({ icon, ...rest }) => ({
      ...rest,
      ...(icon && iconMap.has(icon) ? { icon: iconMap.get(icon)! } : {}),
    }));
  } catch (err) {
    const message =
      err instanceof Error ? err.message : (err as ApiError).message;
    throw { message: `Failed to fetch nav items: ${message}` } as ApiError;
  }
}

export type { ApiError } from './client';
