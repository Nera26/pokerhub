import {
  createAdminTabCrudConfig,
  createNavCrudConfig,
} from '../adminCrudConfigs';

const sampleNavItems = [
  { flag: 'home', href: '/', label: 'Home', order: 1 },
  { flag: 'support', href: '/support', label: 'Support', order: 2 },
];

describe('admin CRUD config factories', () => {
  it('creates nav config with expected fields and defaults', () => {
    const { crudConfig, formConfig } = createNavCrudConfig();

    expect(crudConfig.queryKey).toEqual(['admin', 'nav']);
    expect(formConfig.fields.map((field) => field.name)).toEqual([
      'flag',
      'href',
      'label',
      'icon',
      'order',
    ]);

    const defaults = formConfig.computeInitialForm?.(sampleNavItems as any);
    expect(defaults).toEqual({ order: '3' });

    const formState = formConfig.formFromItem(sampleNavItems[0] as any);
    expect(formState).toEqual({
      flag: 'home',
      href: '/',
      label: 'Home',
      icon: '',
      order: '1',
    });

    expect(crudConfig.formatListError?.(new Error('oops'))).toBe(
      'Failed to load navigation items: oops',
    );

    expect(
      crudConfig.formatActionError?.('delete', new Error('boom'), {
        identifier: 'home',
      }),
    ).toBe('Failed to delete nav item: boom');
  });

  it('returns admin tab config without filtering and formats errors', () => {
    const { crudConfig, formConfig } = createAdminTabCrudConfig();

    expect(crudConfig.queryKey).toEqual(['admin', 'tabs']);
    expect(formConfig.fields.map((field) => field.name)).toEqual([
      'id',
      'title',
      'component',
      'icon',
    ]);

    expect(crudConfig.transformItems).toBeUndefined();

    const listError = crudConfig.formatListError?.(new Error('boom'));
    expect(listError).toBe('Failed to load admin tabs: boom');

    const actionError = crudConfig.formatActionError?.(
      'update',
      new Error('boom'),
      { identifier: 'analytics' },
    );
    expect(actionError).toBe('Failed to update admin tab: boom');
  });
});
