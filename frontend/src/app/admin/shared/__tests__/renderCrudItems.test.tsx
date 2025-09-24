import { render } from '@testing-library/react';

import { CrudItemList } from '../renderCrudItems';

describe('CrudItemList', () => {
  it('renders navigation items list', () => {
    const startEdit = jest.fn();
    const handleDelete = jest.fn(async () => {});
    const { container } = render(
      <CrudItemList
        title="Existing items"
        titleClassName="text-lg font-semibold mb-2"
        loadingCopy="Loading navigation items…"
        emptyCopy="No navigation items found."
        items={[
          {
            flag: 'home',
            href: '/',
            label: 'Home',
            order: 1,
            iconName: 'homeIcon',
          },
          {
            flag: 'support',
            href: '/support',
            label: 'Support',
            order: 2,
          },
        ]}
        loading={false}
        submitting={false}
        deletingId={null}
        startEdit={startEdit}
        handleDelete={handleDelete}
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
      />,
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders admin tabs list with delete state', () => {
    const startEdit = jest.fn();
    const handleDelete = jest.fn(async () => {});
    const { container } = render(
      <CrudItemList
        title="Existing tabs"
        loadingCopy="Loading admin tabs…"
        emptyCopy="No runtime admin tabs found."
        items={[
          {
            id: 'reports',
            title: 'Reports',
            component: '@/reports',
            icon: 'faChart',
          },
          {
            id: 'audit',
            title: 'Audit',
            component: '@/audit',
            icon: undefined,
          },
        ]}
        loading={false}
        submitting={true}
        deletingId="audit"
        startEdit={startEdit}
        handleDelete={handleDelete}
        getKey={(item) => item.id}
        renderPrimary={(item) => item.title}
        primaryClassName="font-semibold"
        description={(item) => item.id}
        meta={(item) => (item.icon ? `Icon: ${item.icon}` : 'Missing icon')}
        itemClassName="flex items-center justify-between rounded border border-gray-200 px-3 py-2"
        disableEdit={(_, { submitting, isDeleting }) =>
          submitting || isDeleting
        }
        disableDelete={(_, { isDeleting }) => isDeleting}
      />,
    );

    expect(container.firstChild).toMatchSnapshot();
  });
});
