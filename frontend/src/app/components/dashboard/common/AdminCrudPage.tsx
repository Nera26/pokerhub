'use client';

import { type ComponentProps, type ReactNode } from 'react';
import { cn } from '@/app/lib/utils';
import Button from '../../ui/Button';
import {
  useAdminCrud,
  useAdminCrudTable,
  type AdminCrudConfig,
  type AdminCrudReturn,
  type AdminCrudTableConfig,
  type AdminCrudTableReturn,
} from '@/hooks/admin/useAdminCrud';

type CrudInstance<TItem, TCreate, TUpdate, TIdentifier> = AdminCrudReturn<
  TItem,
  TCreate,
  TUpdate,
  TIdentifier
> &
  AdminCrudTableReturn<TItem, TCreate, TUpdate, TIdentifier>;

interface AdminCrudRenderProps<TItem, TCreate, TUpdate, TIdentifier> {
  crud: CrudInstance<TItem, TCreate, TUpdate, TIdentifier>;
}

type AdminCrudRenderable<TItem, TCreate, TUpdate, TIdentifier> =
  | ReactNode
  | ((
      props: AdminCrudRenderProps<TItem, TCreate, TUpdate, TIdentifier>,
    ) => ReactNode);

type AdminCrudErrorRenderable<TItem, TCreate, TUpdate, TIdentifier> =
  | ReactNode
  | ((
      props: AdminCrudRenderProps<TItem, TCreate, TUpdate, TIdentifier> & {
        error: unknown;
      },
    ) => ReactNode);

interface PrimaryActionConfig<TItem, TCreate, TUpdate, TIdentifier> {
  label: string;
  icon?: ReactNode;
  buttonProps?: Omit<ComponentProps<typeof Button>, 'onClick'>;
  onClick?: (
    props: AdminCrudRenderProps<TItem, TCreate, TUpdate, TIdentifier>,
  ) => void;
}

type DashboardCrudConfig<TItem, TCreate, TUpdate, TIdentifier> =
  AdminCrudConfig<TItem, TCreate, TUpdate, TIdentifier> &
    AdminCrudTableConfig<TItem, TCreate, TUpdate, TIdentifier>;

interface AdminCrudPageProps<TItem, TCreate, TUpdate, TIdentifier> {
  crudConfig: DashboardCrudConfig<TItem, TCreate, TUpdate, TIdentifier>;
  className?: string;
  loadingState?: AdminCrudRenderable<TItem, TCreate, TUpdate, TIdentifier>;
  errorState?: AdminCrudErrorRenderable<TItem, TCreate, TUpdate, TIdentifier>;
  primaryAction?: PrimaryActionConfig<TItem, TCreate, TUpdate, TIdentifier>;
  renderHeader?: (
    props: AdminCrudRenderProps<TItem, TCreate, TUpdate, TIdentifier> & {
      PrimaryActionButton: ReactNode;
    },
  ) => ReactNode;
  renderFilters?: AdminCrudRenderable<TItem, TCreate, TUpdate, TIdentifier>;
  renderAfterTable?: AdminCrudRenderable<TItem, TCreate, TUpdate, TIdentifier>;
  renderModals?: AdminCrudRenderable<TItem, TCreate, TUpdate, TIdentifier>;
}

function resolveRenderable<TItem, TCreate, TUpdate, TIdentifier>(
  renderable:
    | AdminCrudRenderable<TItem, TCreate, TUpdate, TIdentifier>
    | undefined,
  props: AdminCrudRenderProps<TItem, TCreate, TUpdate, TIdentifier>,
): ReactNode | null {
  if (!renderable) return null;
  if (typeof renderable === 'function') {
    return renderable(props);
  }
  return renderable;
}

function resolveErrorRenderable<TItem, TCreate, TUpdate, TIdentifier>(
  renderable:
    | AdminCrudErrorRenderable<TItem, TCreate, TUpdate, TIdentifier>
    | undefined,
  props: AdminCrudRenderProps<TItem, TCreate, TUpdate, TIdentifier> & {
    error: unknown;
  },
): ReactNode | null {
  if (!renderable) return null;
  if (typeof renderable === 'function') {
    return renderable(props);
  }
  return renderable;
}

export default function AdminCrudPage<TItem, TCreate, TUpdate, TIdentifier>({
  crudConfig,
  className,
  loadingState,
  errorState,
  primaryAction,
  renderHeader,
  renderFilters,
  renderAfterTable,
  renderModals,
}: AdminCrudPageProps<TItem, TCreate, TUpdate, TIdentifier>) {
  const { table, translationKeys, errorMessages, ...adminCrudConfig } =
    crudConfig;

  const crudState = useAdminCrud<TItem, TCreate, TUpdate, TIdentifier>(
    adminCrudConfig,
  );

  const tableState = useAdminCrudTable<TItem, TCreate, TUpdate, TIdentifier>(
    crudState,
    {
      table,
      getItemId: crudConfig.getItemId,
      translationKeys,
      errorMessages,
    },
  );

  const crud: CrudInstance<TItem, TCreate, TUpdate, TIdentifier> = {
    ...crudState,
    ...tableState,
  };
  const context: AdminCrudRenderProps<TItem, TCreate, TUpdate, TIdentifier> = {
    crud,
  };

  if (crud.isLoading) {
    const loadingContent = resolveRenderable(loadingState, context);
    return loadingContent ? <>{loadingContent}</> : <div>Loading...</div>;
  }

  if (crud.error) {
    const errorContent = resolveErrorRenderable(errorState, {
      ...context,
      error: crud.error,
    });
    return errorContent ? <>{errorContent}</> : <div>Error loading data</div>;
  }

  const TableView = crud.table.View;

  const primaryActionButton = primaryAction
    ? (() => {
        const { label, icon, onClick, buttonProps } = primaryAction;
        const { className: buttonClassName, ...restButtonProps } =
          buttonProps ?? {};
        return (
          <Button
            {...restButtonProps}
            onClick={() => {
              crud.modals.openCreate();
              onClick?.(context);
            }}
            className={cn(
              icon ? 'flex items-center gap-2' : undefined,
              buttonClassName,
            )}
          >
            {icon}
            {label}
          </Button>
        );
      })()
    : null;

  const headerContent = renderHeader ? (
    renderHeader({ ...context, PrimaryActionButton: primaryActionButton })
  ) : primaryActionButton ? (
    <div className="flex justify-end">{primaryActionButton}</div>
  ) : null;

  const filtersContent = resolveRenderable(renderFilters, context);
  const afterTableContent = resolveRenderable(renderAfterTable, context);
  const modalsContent = resolveRenderable(renderModals, context);

  return (
    <div className={cn('space-y-6', className)}>
      {headerContent}
      {filtersContent}
      <TableView />
      {afterTableContent}
      {modalsContent}
    </div>
  );
}
