import { apiClient } from './client';
import {
  SidebarItemsResponseSchema,
  type SidebarItem,
} from '@shared/types';

export async function fetchSidebarItems({
  signal,
}: { signal?: AbortSignal } = {}): Promise<SidebarItem[]> {
  return apiClient('/api/sidebar', SidebarItemsResponseSchema, { signal });
}
