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
  });

  it('filters config-sourced admin tabs from editable list', () => {
    const { crudConfig, formConfig } = createAdminTabCrudConfig();

    expect(crudConfig.queryKey).toEqual(['admin', 'tabs']);
    expect(formConfig.fields.map((field) => field.name)).toEqual([
      'id',
      'title',
      'component',
      'icon',
    ]);

    const filtered = crudConfig.transformItems?.([
      {
        id: 'analytics',
        title: 'Analytics',
        component: '@/analytics',
        icon: 'faChart',
        source: 'config',
      },
      {
        id: 'runtime',
        title: 'Runtime',
        component: '@/runtime',
        icon: 'faBolt',
        source: 'database',
      },
    ] as any);

    expect(filtered).toEqual([
      {
        id: 'runtime',
        title: 'Runtime',
        component: '@/runtime',
        icon: 'faBolt',
        source: 'database',
      },
    ]);
  });
});
