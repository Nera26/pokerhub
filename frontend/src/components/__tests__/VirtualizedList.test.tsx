import { render, screen } from '@testing-library/react';
import VirtualizedList from '@/components/VirtualizedList';

describe('VirtualizedList', () => {
  it('virtualizes when items reach threshold', () => {
    const items = Array.from({ length: 5 }, (_, i) => i);
    render(
      <VirtualizedList
        items={items}
        virtualizationThreshold={5}
        renderItem={(item, style) => (
          <li key={item} style={style}>
            Item {item}
          </li>
        )}
        testId="v-list"
      />,
    );
    expect(screen.getByTestId('v-list')).toHaveAttribute(
      'data-virtualized',
      'true',
    );
  });

  it('renders all items when below threshold', () => {
    const items = Array.from({ length: 3 }, (_, i) => i);
    render(
      <VirtualizedList
        items={items}
        virtualizationThreshold={5}
        renderItem={(item, style) => (
          <li key={item} style={style}>
            Item {item}
          </li>
        )}
        testId="v-list"
      />,
    );
    expect(screen.getByTestId('v-list')).toHaveAttribute(
      'data-virtualized',
      'false',
    );
    expect(screen.getAllByText(/Item/)).toHaveLength(3);
  });
});
