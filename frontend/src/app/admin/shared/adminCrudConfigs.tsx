import {
  type AdminCrudField,
  type AdminCrudFormViewConfig,
} from '@/app/components/dashboard/common/AdminCrudPage';
import { CrudItemList } from './renderCrudItems';
import {
  fetchNavItems,
  createNavItem,
  updateNavItem,
  deleteNavItem,
  type NavItem as UiNavItem,
} from '@/lib/api/nav';
import {
  fetchAdminTabs,
  createAdminTab,
  updateAdminTab,
  deleteAdminTab,
} from '@/lib/api/admin';
import type {
  AdminTab,
  CreateAdminTabRequest,
  NavItemRequest,
  UpdateAdminTabRequest,
} from '@shared/types';
import type { SubmitPreparation } from '@/hooks/admin/useAdminCrud';

type CrudAction = 'create' | 'update' | 'delete';

type ErrorFormatter = {
  formatListError: (error: unknown) => string;
  formatActionError: (
    action: CrudAction,
    error: unknown,
    context: unknown,
  ) => string;
};

type NavUpdateInput = { id: string; payload: NavItemRequest };
type AdminTabUpdateInput = { id: string; payload: UpdateAdminTabRequest };

type NavFormState = {
  flag: string;
  href: string;
  label: string;
  icon: string;
  order: string;
};

type AdminTabFormState = {
  id: string;
  title: string;
  component: string;
  icon: string;
};

type NavCrudConfigs = {
  crudConfig: {
    queryKey: ['admin', 'nav'];
    fetchItems: typeof fetchNavItems;
    create: { mutationFn: typeof createNavItem };
    update: {
      mutationFn: (input: NavUpdateInput) => ReturnType<typeof updateNavItem>;
    };
    remove: { mutationFn: typeof deleteNavItem };
    getItemId: (item: UiNavItem) => string;
    formatListError: ErrorFormatter['formatListError'];
    formatActionError: ErrorFormatter['formatActionError'];
  };
  formConfig: AdminCrudFormViewConfig<
    UiNavItem,
    NavFormState,
    NavItemRequest,
    NavUpdateInput,
    string
  >;
};

type AdminTabCrudConfigs = {
  crudConfig: {
    queryKey: ['admin', 'tabs'];
    fetchItems: typeof fetchAdminTabs;
    create: { mutationFn: typeof createAdminTab };
    update: {
      mutationFn: (
        input: AdminTabUpdateInput,
      ) => ReturnType<typeof updateAdminTab>;
    };
    remove: { mutationFn: typeof deleteAdminTab };
    getItemId: (item: AdminTab) => string;
    transformItems: (tabs: AdminTab[]) => AdminTab[];
    formatListError: ErrorFormatter['formatListError'];
    formatActionError: ErrorFormatter['formatActionError'];
  };
  formConfig: AdminCrudFormViewConfig<
    AdminTab,
    AdminTabFormState,
    CreateAdminTabRequest,
    AdminTabUpdateInput,
    string
  >;
};

function normalizeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unknown error';
}

function createErrorFormatter(
  resourceLabel: string,
  itemLabel: string,
): ErrorFormatter {
  return {
    formatListError: (error: unknown) =>
      `Failed to load ${resourceLabel}: ${normalizeError(error)}`,
    formatActionError: (action, error: unknown) => {
      const message = normalizeError(error);
      const verb =
        action === 'delete'
          ? 'delete'
          : action === 'update'
            ? 'update'
            : 'create';
      return `Failed to ${verb} ${itemLabel}: ${message}`;
    },
  };
}

const NAV_EMPTY_FORM: NavFormState = {
  flag: '',
  href: '',
  label: '',
  icon: '',
  order: '1',
};

const NAV_FIELDS: AdminCrudField<NavFormState>[] = [
  {
    name: 'flag',
    label: 'Flag',
    readOnlyWhenEditing: true,
    wrapperClassName: 'space-y-1',
    labelClassName: 'block text-sm font-medium',
    inputClassName: 'w-full rounded border border-gray-300 px-3 py-2',
  },
  {
    name: 'href',
    label: 'Href',
    wrapperClassName: 'space-y-1',
    labelClassName: 'block text-sm font-medium',
    inputClassName: 'w-full rounded border border-gray-300 px-3 py-2',
  },
  {
    name: 'label',
    label: 'Label',
    wrapperClassName: 'space-y-1',
    labelClassName: 'block text-sm font-medium',
    inputClassName: 'w-full rounded border border-gray-300 px-3 py-2',
  },
  {
    name: 'icon',
    label: 'Icon (optional)',
    placeholder: 'Icon name',
    wrapperClassName: 'space-y-1',
    labelClassName: 'block text-sm font-medium',
    inputClassName: 'w-full rounded border border-gray-300 px-3 py-2',
  },
  {
    name: 'order',
    label: 'Order',
    inputType: 'number',
    wrapperClassName: 'space-y-1',
    labelClassName: 'block text-sm font-medium',
    inputClassName: 'w-full rounded border border-gray-300 px-3 py-2',
  },
];

const TAB_EMPTY_FORM: AdminTabFormState = {
  id: '',
  title: '',
  component: '',
  icon: '',
};

const TAB_FIELDS: AdminCrudField<AdminTabFormState>[] = [
  {
    name: 'id',
    label: 'ID',
    placeholder: 'analytics',
    readOnlyWhenEditing: true,
    wrapperClassName: 'flex flex-col text-sm font-medium',
    inputClassName: 'mt-1 rounded border border-gray-300 px-3 py-2',
  },
  {
    name: 'title',
    label: 'Title',
    placeholder: 'Analytics',
    wrapperClassName: 'flex flex-col text-sm font-medium',
    inputClassName: 'mt-1 rounded border border-gray-300 px-3 py-2',
  },
  {
    name: 'component',
    label: 'Component',
    placeholder: '@/app/components/dashboard/AdminAnalytics',
    wrapperClassName: 'flex flex-col text-sm font-medium',
    inputClassName: 'mt-1 rounded border border-gray-300 px-3 py-2',
  },
  {
    name: 'icon',
    label: 'Icon',
    placeholder: 'faChartLine',
    wrapperClassName: 'flex flex-col text-sm font-medium',
    inputClassName: 'mt-1 rounded border border-gray-300 px-3 py-2',
  },
];

function prepareNavSubmit(
  formState: NavFormState,
  { editingItem }: { editingItem: UiNavItem | null },
): SubmitPreparation<NavItemRequest, NavUpdateInput, UiNavItem> {
  const trimmedFlag = formState.flag.trim();
  const trimmedHref = formState.href.trim();
  const trimmedLabel = formState.label.trim();
  const trimmedIcon = formState.icon.trim();
  const parsedOrder = Number(formState.order);

  if (!Number.isInteger(parsedOrder)) {
    return { error: 'Order must be an integer' } as const;
  }

  if (!trimmedFlag || !trimmedHref || !trimmedLabel) {
    return { error: 'Flag, href, and label are required' } as const;
  }

  const payload: NavItemRequest = {
    flag: trimmedFlag,
    href: trimmedHref,
    label: trimmedLabel,
    order: parsedOrder,
    ...(trimmedIcon ? { icon: trimmedIcon } : {}),
  };

  if (editingItem) {
    return {
      type: 'update',
      payload: {
        id: editingItem.flag,
        payload,
      },
    } as const;
  }

  return { type: 'create', payload } as const;
}

function prepareAdminTabSubmit(
  formState: AdminTabFormState,
  { editingItem }: { editingItem: AdminTab | null },
): SubmitPreparation<CreateAdminTabRequest, AdminTabUpdateInput, AdminTab> {
  const trimmedId = formState.id.trim();
  const trimmedTitle = formState.title.trim();
  const trimmedComponent = formState.component.trim();
  const trimmedIcon = formState.icon.trim();

  if (!trimmedTitle || !trimmedComponent || (!editingItem && !trimmedId)) {
    return {
      error: 'ID, title, component, and icon are required',
    } as const;
  }

  if (!trimmedIcon) {
    return { error: 'Icon is required' } as const;
  }

  if (editingItem) {
    const payload: UpdateAdminTabRequest = {
      title: trimmedTitle,
      component: trimmedComponent,
      icon: trimmedIcon,
    };
    return {
      type: 'update',
      payload: {
        id: editingItem.id,
        payload,
      },
    } as const;
  }

  const payload: CreateAdminTabRequest = {
    id: trimmedId,
    title: trimmedTitle,
    component: trimmedComponent,
    icon: trimmedIcon,
  };

  return { type: 'create', payload } as const;
}

function computeNavDefaults(
  items: UiNavItem[],
): Partial<Pick<NavFormState, 'order'>> {
  if (!items.length) {
    return { order: '1' };
  }
  const last = items[items.length - 1];
  return { order: String(last.order + 1) };
}

export function createNavCrudConfig(): NavCrudConfigs {
  const getItemId = (item: UiNavItem) => item.flag;
  const { formatListError, formatActionError } = createErrorFormatter(
    'navigation items',
    'nav item',
  );

  return {
    crudConfig: {
      queryKey: ['admin', 'nav'],
      fetchItems: fetchNavItems,
      create: { mutationFn: createNavItem },
      update: {
        mutationFn: (input) => updateNavItem(input.id, input.payload),
      },
      remove: { mutationFn: deleteNavItem },
      getItemId,
      formatListError,
      formatActionError,
    },
    formConfig: {
      title: 'Navigation Items',
      emptyForm: NAV_EMPTY_FORM,
      fields: NAV_FIELDS,
      formFromItem: (item) => ({
        flag: item.flag,
        href: item.href,
        label: item.label,
        icon: item.iconName ?? '',
        order: String(item.order),
      }),
      prepareSubmit: (formState, context) =>
        prepareNavSubmit(formState, context),
      computeInitialForm: computeNavDefaults,
      getItemId,
      createButtonLabel: 'Create item',
      updateButtonLabel: 'Update item',
      cancelButtonLabel: 'Cancel',
      containerClassName: 'p-4 space-y-6',
      formClassName: 'space-y-3 max-w-md',
      fieldsWrapperClassName: 'space-y-3',
      submitButtonClassName: 'btn btn-primary',
      cancelButtonClassName: 'btn btn-secondary',
      listErrorClassName: 'rounded-md border border-red-400 p-2 text-red-600',
      actionErrorClassName: 'rounded-md border border-red-400 p-2 text-red-600',
      renderItems: (props) => (
        <CrudItemList
          title="Existing items"
          titleClassName="text-lg font-semibold mb-2"
          loadingCopy="Loading navigation items…"
          emptyCopy="No navigation items found."
          {...props}
          getKey={(item) => item.flag}
          renderPrimary={(item) => (
            <>
              {item.label}{' '}
              <span className="text-xs text-gray-500">({item.flag})</span>
            </>
          )}
          description={(item) => `${item.href} · Order ${item.order}`}
          meta={(item) => (item.iconName ? <>Icon: {item.iconName}</> : null)}
          renderDeleteLabel={() => 'Delete'}
        />
      ),
    },
  };
}

export function createAdminTabCrudConfig(): AdminTabCrudConfigs {
  const getItemId = (item: AdminTab) => item.id;
  const { formatListError, formatActionError } = createErrorFormatter(
    'admin tabs',
    'admin tab',
  );

  return {
    crudConfig: {
      queryKey: ['admin', 'tabs'],
      fetchItems: fetchAdminTabs,
      create: { mutationFn: createAdminTab },
      update: {
        mutationFn: (input) => updateAdminTab(input.id, input.payload),
      },
      remove: { mutationFn: deleteAdminTab },
      getItemId,
      transformItems: (tabs) => tabs.filter((tab) => tab.source !== 'config'),
      formatListError,
      formatActionError,
    },
    formConfig: {
      title: 'Admin Tabs',
      emptyForm: TAB_EMPTY_FORM,
      fields: TAB_FIELDS,
      formFromItem: (tab) => ({
        id: tab.id,
        title: tab.title ?? '',
        component: tab.component ?? '',
        icon: tab.icon ?? '',
      }),
      prepareSubmit: (formState, context) =>
        prepareAdminTabSubmit(formState, context),
      getItemId,
      createButtonLabel: 'Create tab',
      updateButtonLabel: 'Update tab',
      cancelButtonLabel: 'Cancel',
      formClassName: 'space-y-4 max-w-xl',
      fieldsWrapperClassName: 'grid gap-2 sm:grid-cols-2',
      submitButtonClassName:
        'rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50',
      cancelButtonClassName:
        'rounded border border-gray-300 px-4 py-2 text-sm font-semibold hover:bg-gray-100 disabled:opacity-50',
      listErrorClassName: 'rounded-md border border-red-400 p-3 text-red-600',
      actionErrorClassName:
        'rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700',
      renderItems: (props) => (
        <CrudItemList
          title="Existing tabs"
          loadingCopy="Loading admin tabs…"
          emptyCopy="No runtime admin tabs found."
          {...props}
          getKey={(tab) => tab.id}
          renderPrimary={(tab) => tab.title}
          primaryClassName="font-semibold"
          description={(tab) => tab.id}
          meta={(tab) => (tab.icon ? `Icon: ${tab.icon}` : 'Missing icon')}
          itemClassName="flex items-center justify-between rounded border border-gray-200 px-3 py-2"
          disableEdit={(_, { submitting, isDeleting }) =>
            submitting || isDeleting
          }
          disableDelete={(_, { isDeleting }) => isDeleting}
        />
      ),
    },
  };
}

export type {
  NavFormState,
  AdminTabFormState,
  NavUpdateInput,
  AdminTabUpdateInput,
};
