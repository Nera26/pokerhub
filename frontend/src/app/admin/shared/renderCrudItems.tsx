import type { Key, ReactNode } from 'react';

import type { AdminCrudItemsRenderProps } from '@/app/components/dashboard/common/AdminCrudPage';

type ItemContext<TIdentifier extends Key> = {
  submitting: boolean;
  deletingId: TIdentifier | null;
  identifier: TIdentifier;
  isDeleting: boolean;
};

export type CrudItemListProps<
  TItem,
  TIdentifier extends Key,
> = AdminCrudItemsRenderProps<TItem, TIdentifier> & {
  title: string;
  titleClassName?: string;
  loadingCopy: string;
  emptyCopy: string;
  getKey: (item: TItem) => TIdentifier;
  renderPrimary: (item: TItem) => ReactNode;
  description?: (item: TItem) => ReactNode;
  meta?: (item: TItem) => ReactNode;
  listClassName?: string;
  itemClassName?: string;
  contentClassName?: string;
  actionsClassName?: string;
  primaryClassName?: string;
  descriptionClassName?: string;
  metaClassName?: string;
  editButtonClassName?: string;
  deleteButtonClassName?: string;
  editLabel?: string;
  deleteLabel?: string;
  deletingLabel?: string;
  disableEdit?: (item: TItem, context: ItemContext<TIdentifier>) => boolean;
  disableDelete?: (item: TItem, context: ItemContext<TIdentifier>) => boolean;
  renderDeleteLabel?: (
    item: TItem,
    context: ItemContext<TIdentifier>,
  ) => ReactNode;
};

export function CrudItemList<TItem, TIdentifier extends Key>({
  title,
  titleClassName = 'text-lg font-semibold',
  loadingCopy,
  emptyCopy,
  getKey,
  renderPrimary,
  description,
  meta,
  items,
  loading,
  submitting,
  deletingId,
  startEdit,
  handleDelete,
  listClassName = 'space-y-2',
  itemClassName = 'flex items-center justify-between rounded border border-gray-300 px-3 py-2',
  contentClassName = 'flex flex-col',
  actionsClassName = 'flex items-center gap-3',
  primaryClassName = 'font-medium',
  descriptionClassName = 'text-sm text-gray-600',
  metaClassName = 'text-xs text-gray-500',
  editButtonClassName = 'text-blue-600 underline',
  deleteButtonClassName = 'text-red-600 underline',
  editLabel = 'Edit',
  deleteLabel = 'Delete',
  deletingLabel = 'Deleting…',
  disableEdit,
  disableDelete,
  renderDeleteLabel,
}: CrudItemListProps<TItem, TIdentifier>) {
  if (loading) {
    return (
      <section>
        <h2 className={titleClassName}>{title}</h2>
        <p>{loadingCopy}</p>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section>
        <h2 className={titleClassName}>{title}</h2>
        <p>{emptyCopy}</p>
      </section>
    );
  }

  return (
    <section>
      <h2 className={titleClassName}>{title}</h2>
      <ul className={listClassName}>
        {items.map((item) => {
          const identifier = getKey(item);
          const itemContext: ItemContext<TIdentifier> = {
            submitting,
            deletingId,
            identifier,
            isDeleting: deletingId === identifier,
          };
          const descriptionContent = description?.(item);
          const metaContent = meta?.(item);
          const isEditDisabled = disableEdit
            ? disableEdit(item, itemContext)
            : submitting;
          const isDeleteDisabled = disableDelete
            ? disableDelete(item, itemContext)
            : submitting || itemContext.isDeleting;
          const deleteContent =
            renderDeleteLabel?.(item, itemContext) ??
            (itemContext.isDeleting ? deletingLabel : deleteLabel);

          return (
            <li key={identifier} className={itemClassName}>
              <div className={contentClassName}>
                <span className={primaryClassName}>{renderPrimary(item)}</span>
                {descriptionContent !== null &&
                descriptionContent !== undefined &&
                descriptionContent !== false ? (
                  <span className={descriptionClassName}>
                    {descriptionContent}
                  </span>
                ) : null}
                {metaContent !== null &&
                metaContent !== undefined &&
                metaContent !== false ? (
                  <span className={metaClassName}>{metaContent}</span>
                ) : null}
              </div>
              <div className={actionsClassName}>
                <button
                  type="button"
                  className={editButtonClassName}
                  onClick={() => startEdit(item)}
                  disabled={isEditDisabled}
                >
                  {editLabel}
                </button>
                <button
                  type="button"
                  className={deleteButtonClassName}
                  onClick={() => {
                    void handleDelete(identifier);
                  }}
                  disabled={isDeleteDisabled}
                >
                  {deleteContent}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
