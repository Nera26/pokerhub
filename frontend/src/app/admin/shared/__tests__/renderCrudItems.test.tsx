import { render } from '@testing-library/react';

import { CrudItemList } from '../renderCrudItems';
import {
  getAdminTabRenderProps,
  getNavRenderProps,
} from '../adminCrudTestUtils';

describe('CrudItemList', () => {
  it('renders navigation items list', () => {
    const startEdit = jest.fn();
    const handleDelete = jest.fn(async () => {});

    const renderProps = getNavRenderProps({
      items: [
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
      ],
      loading: false,
      submitting: false,
      deletingId: null,
      startEdit,
      handleDelete,
    });

    const { container } = render(<CrudItemList {...renderProps} />);

    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders admin tabs list with delete state', () => {
    const startEdit = jest.fn();
    const handleDelete = jest.fn(async () => {});

    const renderProps = getAdminTabRenderProps({
      items: [
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
      ],
      loading: false,
      submitting: true,
      deletingId: 'audit',
      startEdit,
      handleDelete,
    });

    const { container } = render(<CrudItemList {...renderProps} />);

    expect(container.firstChild).toMatchSnapshot();
  });
});
