import { isValidElement, type Key, type ReactNode } from 'react';

import type { AdminCrudItemsRenderProps } from '@/app/components/dashboard/common/AdminCrudPage';
import type { AdminTab } from '@shared/types';

import {
  createAdminTabCrudConfig,
  createNavCrudConfig,
} from './adminCrudConfigs';
import type { CrudItemListProps } from './renderCrudItems';
import type { NavItem as UiNavItem } from '@/lib/api/nav';

type RenderItemsFn<TItem, TIdentifier extends Key> = (
  props: AdminCrudItemsRenderProps<TItem, TIdentifier>,
) => ReactNode;

function extractCrudItemListProps<TItem, TIdentifier extends Key>(
  renderItems: RenderItemsFn<TItem, TIdentifier>,
  props: AdminCrudItemsRenderProps<TItem, TIdentifier>,
): CrudItemListProps<TItem, TIdentifier> {
  const element = renderItems(props);

  if (!isValidElement(element)) {
    throw new Error('renderItems must return a valid React element');
  }

  return element.props as CrudItemListProps<TItem, TIdentifier>;
}

export function getNavRenderProps(
  props: AdminCrudItemsRenderProps<UiNavItem, string>,
): CrudItemListProps<UiNavItem, string> {
  const { formConfig } = createNavCrudConfig();

  if (!formConfig.renderItems) {
    throw new Error('Nav config is missing renderItems definition');
  }

  return extractCrudItemListProps(formConfig.renderItems, props);
}

export function getAdminTabRenderProps(
  props: AdminCrudItemsRenderProps<AdminTab, string>,
): CrudItemListProps<AdminTab, string> {
  const { formConfig } = createAdminTabCrudConfig();

  if (!formConfig.renderItems) {
    throw new Error('Admin tab config is missing renderItems definition');
  }

  return extractCrudItemListProps(formConfig.renderItems, props);
}
