'use client';

import {
  useId,
  useMemo,
  type HTMLInputTypeAttribute,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';
import type { QueryKey } from '@tanstack/react-query';
import clsx from 'clsx';
import {
  useAdminCrud,
  useAdminCrudForm,
  type SubmitPreparation,
  type CrudAction,
  type ActionErrorContext,
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

export interface AdminCrudPageProps<
  Item,
  FormState,
  CreateInput,
  UpdateInput = CreateInput,
  Identifier = string,
> {
  title: string;
  description?: ReactNode;
  queryKey?: QueryKey;
  emptyForm: FormState;
  fields: AdminCrudField<FormState>[];
  fetchItems: () => Promise<Item[]>;
  createItem: (payload: CreateInput) => Promise<unknown>;
  updateItem: (payload: UpdateInput) => Promise<unknown>;
  deleteItem: (identifier: Identifier) => Promise<void>;
  getItemId: (item: Item) => Identifier;
  formFromItem: (item: Item) => FormState;
  prepareSubmit: (
    form: FormState,
    context: { editingItem: Item | null },
  ) => SubmitPreparation<CreateInput, UpdateInput, Item>;
  mapItems?: (items: Item[]) => Item[];
  computeInitialForm?: (items: Item[]) => Partial<FormState>;
  formatListError?: (error: unknown) => string;
  formatActionError?: (
    action: CrudAction,
    error: unknown,
    context: ActionErrorContext<Item, Identifier>,
  ) => string;
  createButtonLabel: string;
  updateButtonLabel: string;
  cancelButtonLabel?: string;
  renderItems?: (
    props: AdminCrudItemsRenderProps<Item, Identifier>,
  ) => ReactNode;
  containerClassName?: string;
  formClassName?: string;
  fieldsWrapperClassName?: string;
  actionsWrapperClassName?: string;
  submitButtonClassName?: string;
  cancelButtonClassName?: string;
  listErrorClassName?: string;
  actionErrorClassName?: string;
}

export function AdminCrudPage<
  Item,
  FormState,
  CreateInput,
  UpdateInput = CreateInput,
  Identifier = string,
>(
  props: AdminCrudPageProps<
    Item,
    FormState,
    CreateInput,
    UpdateInput,
    Identifier
  >,
) {
  const {
    title,
    description,
    queryKey,
    emptyForm,
    fields,
    fetchItems,
    createItem,
    updateItem,
    deleteItem,
    getItemId,
    formFromItem,
    prepareSubmit,
    mapItems,
    computeInitialForm,
    formatListError,
    formatActionError,
    createButtonLabel,
    updateButtonLabel,
    cancelButtonLabel = 'Cancel',
    renderItems,
    containerClassName = 'space-y-6 p-4',
    formClassName = 'space-y-4',
    fieldsWrapperClassName = 'space-y-3',
    actionsWrapperClassName = 'flex items-center gap-3',
    submitButtonClassName = 'rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50',
    cancelButtonClassName = 'rounded border border-gray-300 px-4 py-2 text-sm font-semibold disabled:opacity-50',
    listErrorClassName = 'rounded-md border border-red-400 p-3 text-red-600',
    actionErrorClassName = 'rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700',
  } = props;

  const formId = useId();

  const resolvedQueryKey = useMemo(() => {
    if (queryKey) {
      return queryKey;
    }
    return [
      'admin',
      'crud',
      fetchItems.name || title.toLowerCase().replaceAll(' ', '-'),
    ] satisfies QueryKey;
  }, [fetchItems, queryKey, title]);

  const crud = useAdminCrud<Item, CreateInput, UpdateInput, Identifier>({
    queryKey: resolvedQueryKey,
    fetchItems,
    transformItems: mapItems,
    create: { mutationFn: createItem },
    update: { mutationFn: updateItem },
    remove: { mutationFn: deleteItem },
    formatListError,
    formatActionError,
    getItemId,
  });

  const {
    items,
    loading,
    listError,
    actionError,
    form,
    isEditing,
    submitting,
    deletingId,
    setFormValue,
    handleSubmit,
    handleDelete,
    startEdit,
    cancelEdit,
  } = useAdminCrudForm<Item, FormState, CreateInput, UpdateInput, Identifier>(
    crud,
    {
      emptyForm,
      formFromItem,
      prepareSubmit,
      getItemId,
      computeInitialForm,
    },
  );

  return (
    <div className={containerClassName}>
      <h1 className="text-xl font-bold">{title}</h1>
      {description}

      {listError && (
        <div role="alert" className={listErrorClassName}>
          {listError}
        </div>
      )}

      <form onSubmit={handleSubmit} className={formClassName}>
        <div className={fieldsWrapperClassName}>
          {fields.map((field) => {
            const value = form[field.name];
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
              className: clsx(field.inputClassName, baseInputProps.className),
              readOnly: field.readOnlyWhenEditing && isEditing,
              value: displayValue as string | number | readonly string[],
              onChange: (event) => {
                const nextValue = event.target.value;
                const resolved = field.transform
                  ? field.transform(nextValue, { isEditing })
                  : (nextValue as unknown as FormState[keyof FormState]);
                setFormValue(
                  field.name,
                  resolved as FormState[keyof FormState],
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
                    value: form[field.name],
                    isEditing,
                    submitting,
                    onChange: (next) =>
                      setFormValue(
                        field.name,
                        next as FormState[keyof FormState],
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
                {field.description && (
                  <p
                    className={
                      field.descriptionClassName ?? 'text-xs text-gray-500'
                    }
                  >
                    {field.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {actionError && (
          <div role="alert" className={actionErrorClassName}>
            {actionError}
          </div>
        )}

        <div className={actionsWrapperClassName}>
          <button
            type="submit"
            className={submitButtonClassName}
            disabled={submitting}
          >
            {isEditing ? updateButtonLabel : createButtonLabel}
          </button>
          {isEditing && (
            <button
              type="button"
              className={cancelButtonClassName}
              onClick={cancelEdit}
              disabled={submitting}
            >
              {cancelButtonLabel}
            </button>
          )}
        </div>
      </form>

      {renderItems?.({
        items,
        loading,
        submitting,
        deletingId,
        startEdit,
        handleDelete,
      })}
    </div>
  );
}
