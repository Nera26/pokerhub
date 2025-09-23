'use client';

import {
  useId,
  type ComponentProps,
  type HTMLInputTypeAttribute,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';
import { cn } from '@/app/lib/utils';
import Button from '../../ui/Button';
import {
  useAdminCrud,
  useAdminCrudForm,
  useAdminCrudTable,
  type AdminCrudConfig,
  type AdminCrudFormOptions,
  type AdminCrudFormReturn,
  type AdminCrudReturn,
  type AdminCrudTableConfig,
  type AdminCrudTableReturn,
} from '@/hooks/admin/useAdminCrud';

export type AdminCrudFieldRenderProps<
  FormState,
  K extends keyof FormState = keyof FormState,
> = {
  name: K;
  label: string;
  value: FormState[K];
  isEditing: boolean;
  submitting: boolean;
  onChange: (value: FormState[K]) => void;
  inputProps: InputHTMLAttributes<HTMLInputElement>;
};

export type AdminCrudField<FormState> = {
  name: keyof FormState;
  label: string;
  description?: ReactNode;
  descriptionClassName?: string;
  wrapperClassName?: string;
  labelClassName?: string;
  inputClassName?: string;
  inputType?: HTMLInputTypeAttribute;
  placeholder?: string;
  inputProps?: InputHTMLAttributes<HTMLInputElement>;
  readOnlyWhenEditing?: boolean;
  render?: (
    props: AdminCrudFieldRenderProps<FormState, keyof FormState>,
  ) => ReactNode;
  transform?: (
    value: string,
    context: { isEditing: boolean },
  ) => FormState[keyof FormState];
};

export type AdminCrudItemsRenderProps<Item, Identifier> = {
  items: Item[];
  loading: boolean;
  submitting: boolean;
  deletingId: Identifier | null;
  startEdit: (item: Item) => void;
  handleDelete: (identifier: Identifier) => Promise<void>;
};

type CrudInstance<TItem, TCreate, TUpdate, TIdentifier> = AdminCrudReturn<
  TItem,
  TCreate,
  TUpdate,
  TIdentifier
>;

type TableInstance<TItem, TCreate, TUpdate, TIdentifier> = AdminCrudTableReturn<
  TItem,
  TCreate,
  TUpdate,
  TIdentifier
>;

type FormInstance<TItem, TFormState, TIdentifier> = AdminCrudFormReturn<
  TItem,
  TFormState,
  TIdentifier
>;

interface AdminCrudRenderProps<
  TItem,
  TCreate,
  TUpdate,
  TIdentifier,
  TFormState,
> {
  crud: CrudInstance<TItem, TCreate, TUpdate, TIdentifier>;
  table: TableInstance<TItem, TCreate, TUpdate, TIdentifier> | null;
  form: FormInstance<TItem, TFormState, TIdentifier> | null;
}

type AdminCrudRenderable<TItem, TCreate, TUpdate, TIdentifier, TFormState> =
  | ReactNode
  | ((
      props: AdminCrudRenderProps<
        TItem,
        TCreate,
        TUpdate,
        TIdentifier,
        TFormState
      >,
    ) => ReactNode);

type AdminCrudErrorRenderable<
  TItem,
  TCreate,
  TUpdate,
  TIdentifier,
  TFormState,
> =
  | ReactNode
  | ((
      props: AdminCrudRenderProps<
        TItem,
        TCreate,
        TUpdate,
        TIdentifier,
        TFormState
      > & { error: unknown },
    ) => ReactNode);

interface PrimaryActionConfig<
  TItem,
  TCreate,
  TUpdate,
  TIdentifier,
  TFormState,
> {
  label: string;
  icon?: ReactNode;
  buttonProps?: Omit<ComponentProps<typeof Button>, 'onClick'>;
  onClick?: (
    props: AdminCrudRenderProps<
      TItem,
      TCreate,
      TUpdate,
      TIdentifier,
      TFormState
    >,
  ) => void;
}

type DashboardCrudConfig<TItem, TCreate, TUpdate, TIdentifier> =
  AdminCrudConfig<TItem, TCreate, TUpdate, TIdentifier> &
    Partial<AdminCrudTableConfig<TItem, TCreate, TUpdate, TIdentifier>> & {
      table?: AdminCrudTableConfig<TItem, TCreate, TUpdate, TIdentifier>;
    };

export interface AdminCrudFormViewConfig<
  TItem,
  TFormState,
  TCreate,
  TUpdate,
  TIdentifier,
> extends Omit<
    AdminCrudFormOptions<TItem, TFormState, TCreate, TUpdate, TIdentifier>,
    'getItemId'
  > {
  title?: string;
  description?: ReactNode;
  getItemId?: (item: TItem) => TIdentifier;
  fields: AdminCrudField<TFormState>[];
  createButtonLabel: string;
  updateButtonLabel: string;
  cancelButtonLabel?: string;
  containerClassName?: string;
  formClassName?: string;
  fieldsWrapperClassName?: string;
  actionsWrapperClassName?: string;
  submitButtonClassName?: string;
  cancelButtonClassName?: string;
  listErrorClassName?: string;
  actionErrorClassName?: string;
  renderItems?: (
    props: AdminCrudItemsRenderProps<TItem, TIdentifier>,
  ) => ReactNode;
}

interface AdminCrudPageProps<
  TItem,
  TCreate,
  TUpdate,
  TIdentifier,
  TFormState = never,
> {
  crudConfig: DashboardCrudConfig<TItem, TCreate, TUpdate, TIdentifier>;
  formConfig?: AdminCrudFormViewConfig<
    TItem,
    TFormState,
    TCreate,
    TUpdate,
    TIdentifier
  >;
  className?: string;
  loadingState?: AdminCrudRenderable<
    TItem,
    TCreate,
    TUpdate,
    TIdentifier,
    TFormState
  >;
  errorState?: AdminCrudErrorRenderable<
    TItem,
    TCreate,
    TUpdate,
    TIdentifier,
    TFormState
  >;
  primaryAction?: PrimaryActionConfig<
    TItem,
    TCreate,
    TUpdate,
    TIdentifier,
    TFormState
  >;
  renderHeader?: (
    props: AdminCrudRenderProps<
      TItem,
      TCreate,
      TUpdate,
      TIdentifier,
      TFormState
    > & { PrimaryActionButton: ReactNode },
  ) => ReactNode;
  renderFilters?: AdminCrudRenderable<
    TItem,
    TCreate,
    TUpdate,
    TIdentifier,
    TFormState
  >;
  renderAfterTable?: AdminCrudRenderable<
    TItem,
    TCreate,
    TUpdate,
    TIdentifier,
    TFormState
  >;
  renderModals?: AdminCrudRenderable<
    TItem,
    TCreate,
    TUpdate,
    TIdentifier,
    TFormState
  >;
}

function resolveRenderable<TItem, TCreate, TUpdate, TIdentifier, TFormState>(
  renderable:
    | AdminCrudRenderable<TItem, TCreate, TUpdate, TIdentifier, TFormState>
    | undefined,
  props: AdminCrudRenderProps<TItem, TCreate, TUpdate, TIdentifier, TFormState>,
): ReactNode | null {
  if (!renderable) return null;
  if (typeof renderable === 'function') {
    return renderable(props);
  }
  return renderable;
}

function resolveErrorRenderable<
  TItem,
  TCreate,
  TUpdate,
  TIdentifier,
  TFormState,
>(
  renderable:
    | AdminCrudErrorRenderable<TItem, TCreate, TUpdate, TIdentifier, TFormState>
    | undefined,
  props: AdminCrudRenderProps<
    TItem,
    TCreate,
    TUpdate,
    TIdentifier,
    TFormState
  > & { error: unknown },
): ReactNode | null {
  if (!renderable) return null;
  if (typeof renderable === 'function') {
    return renderable(props);
  }
  return renderable;
}

export default function AdminCrudPage<
  TItem,
  TCreate,
  TUpdate,
  TIdentifier,
  TFormState = never,
>({
  crudConfig,
  formConfig,
  className,
  loadingState,
  errorState,
  primaryAction,
  renderHeader,
  renderFilters,
  renderAfterTable,
  renderModals,
}: AdminCrudPageProps<TItem, TCreate, TUpdate, TIdentifier, TFormState>) {
  const { table, translationKeys, errorMessages, ...adminCrudConfig } =
    crudConfig;

  const crudState = useAdminCrud<TItem, TCreate, TUpdate, TIdentifier>(
    adminCrudConfig,
  );

  if (table && !crudConfig.getItemId) {
    throw new Error(
      'crudConfig.getItemId is required when using table configuration.',
    );
  }

  const tableState = table
    ? useAdminCrudTable<TItem, TCreate, TUpdate, TIdentifier>(crudState, {
        table,
        getItemId: crudConfig.getItemId!,
        translationKeys,
        errorMessages,
      })
    : null;

  let formState: FormInstance<TItem, TFormState, TIdentifier> | null = null;
  if (formConfig) {
    const getItemId = formConfig.getItemId ?? crudConfig.getItemId;
    if (!getItemId) {
      throw new Error(
        'formConfig requires a getItemId implementation either on crudConfig or formConfig.',
      );
    }

    formState = useAdminCrudForm<
      TItem,
      TFormState,
      TCreate,
      TUpdate,
      TIdentifier
    >(crudState, {
      ...formConfig,
      getItemId,
    });
  }

  const context: AdminCrudRenderProps<
    TItem,
    TCreate,
    TUpdate,
    TIdentifier,
    TFormState
  > = {
    crud: crudState,
    table: tableState,
    form: formState,
  };

  const formId = useId();

  if (crudState.isLoading) {
    const loadingContent = resolveRenderable(loadingState, context);
    return loadingContent ? <>{loadingContent}</> : <div>Loading...</div>;
  }

  if (crudState.error && !formConfig) {
    const errorContent = resolveErrorRenderable(errorState, {
      ...context,
      error: crudState.error,
    });
    return errorContent ? <>{errorContent}</> : <div>Error loading data</div>;
  }
  const TableView = tableState?.table.View;

  const primaryActionButton = primaryAction
    ? (() => {
        const { label, icon, onClick, buttonProps } = primaryAction;
        const { className: buttonClassName, ...restButtonProps } =
          buttonProps ?? {};
        return (
          <Button
            {...restButtonProps}
            onClick={() => {
              tableState?.modals.openCreate();
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

  const formContent =
    formConfig && formState
      ? renderFormSection({
          formConfig,
          formState,
          formId,
        })
      : null;

  return (
    <div className={cn('space-y-6', className)}>
      {headerContent}
      {filtersContent}
      {formContent}
      {TableView ? <TableView /> : null}
      {afterTableContent}
      {modalsContent}
    </div>
  );
}

function renderFormSection<TItem, TFormState, TCreate, TUpdate, TIdentifier>({
  formConfig,
  formState,
  formId,
}: {
  formConfig: AdminCrudFormViewConfig<
    TItem,
    TFormState,
    TCreate,
    TUpdate,
    TIdentifier
  >;
  formState: FormInstance<TItem, TFormState, TIdentifier>;
  formId: string;
}) {
  const {
    title,
    description,
    fields,
    createButtonLabel,
    updateButtonLabel,
    cancelButtonLabel = 'Cancel',
    containerClassName = 'space-y-6 p-4',
    formClassName = 'space-y-4',
    fieldsWrapperClassName = 'space-y-3',
    actionsWrapperClassName = 'flex items-center gap-3',
    submitButtonClassName = 'rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50',
    cancelButtonClassName = 'rounded border border-gray-300 px-4 py-2 text-sm font-semibold disabled:opacity-50',
    listErrorClassName = 'rounded-md border border-red-400 p-3 text-red-600',
    actionErrorClassName = 'rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700',
    renderItems,
  } = formConfig;

  const listError = formState.listError;
  const actionError = formState.actionError;

  const itemsContent = renderItems
    ? renderItems({
        items: formState.items,
        loading: formState.loading,
        submitting: formState.submitting,
        deletingId: formState.deletingId,
        startEdit: formState.startEdit,
        handleDelete: formState.handleDelete,
      })
    : null;

  return (
    <div className={containerClassName}>
      {title ? <h1 className="text-xl font-bold">{title}</h1> : null}
      {description}

      {listError ? (
        <div role="alert" className={listErrorClassName}>
          {listError}
        </div>
      ) : null}

      <form onSubmit={formState.handleSubmit} className={formClassName}>
        <div className={fieldsWrapperClassName}>
          {fields.map((field) => {
            const value = formState.form[field.name];
            const displayValue =
              value === undefined || value === null ? '' : (value as unknown);
            const inputId = `${formId}-${String(field.name)}`;

            const baseInputProps: InputHTMLAttributes<HTMLInputElement> = {
              type: field.inputType ?? 'text',
              placeholder: field.placeholder,
              ...field.inputProps,
            };

            const inputProps: InputHTMLAttributes<HTMLInputElement> = {
              ...baseInputProps,
              id: inputId,
              name: String(field.name),
              className: cn(field.inputClassName, baseInputProps.className),
              readOnly: field.readOnlyWhenEditing && formState.isEditing,
              value: displayValue as string | number | readonly string[],
              onChange: (event) => {
                const nextValue = event.target.value;
                const resolved = field.transform
                  ? field.transform(nextValue, {
                      isEditing: formState.isEditing,
                    })
                  : (nextValue as unknown as TFormState[keyof TFormState]);
                formState.setFormValue(
                  field.name,
                  resolved as TFormState[keyof TFormState],
                );
              },
            };

            if (field.render) {
              return (
                <div
                  key={String(field.name)}
                  className={field.wrapperClassName}
                >
                  {field.render({
                    name: field.name,
                    label: field.label,
                    value: formState.form[field.name],
                    isEditing: formState.isEditing,
                    submitting: formState.submitting,
                    onChange: (next) =>
                      formState.setFormValue(
                        field.name,
                        next as TFormState[keyof TFormState],
                      ),
                    inputProps,
                  })}
                </div>
              );
            }

            return (
              <div
                key={String(field.name)}
                className={field.wrapperClassName ?? 'flex flex-col gap-1'}
              >
                <label
                  htmlFor={inputId}
                  className={field.labelClassName ?? 'text-sm font-medium'}
                >
                  {field.label}
                </label>
                <input {...inputProps} />
                {field.description ? (
                  <p
                    className={
                      field.descriptionClassName ?? 'text-xs text-gray-500'
                    }
                  >
                    {field.description}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>

        {actionError ? (
          <div role="alert" className={actionErrorClassName}>
            {actionError}
          </div>
        ) : null}

        <div className={actionsWrapperClassName}>
          <button
            type="submit"
            className={submitButtonClassName}
            disabled={formState.submitting}
          >
            {formState.isEditing ? updateButtonLabel : createButtonLabel}
          </button>
          {formState.isEditing ? (
            <button
              type="button"
              className={cancelButtonClassName}
              onClick={formState.cancelEdit}
              disabled={formState.submitting}
            >
              {cancelButtonLabel}
            </button>
          ) : null}
        </div>
      </form>

      {itemsContent}
    </div>
  );
}
