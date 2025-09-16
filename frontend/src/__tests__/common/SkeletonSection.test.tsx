import { render } from '@testing-library/react';
import SkeletonSection from '@/app/components/common/SkeletonSection';

describe('SkeletonSection horizontal lists', () => {
  it('renders list items based on count', () => {
    const { getAllByTestId } = render(
      <SkeletonSection
        fullPage={false}
        rows={0}
        horizontalList={{
          count: 3,
          containerClassName: 'gap-2',
          itemClassName: 'h-4 w-4',
          itemTestId: 'horizontal-item',
        }}
      />,
    );

    expect(getAllByTestId('horizontal-item')).toHaveLength(3);
  });

  it('renders nothing when count is zero', () => {
    const { queryByTestId, container } = render(
      <SkeletonSection
        fullPage={false}
        rows={0}
        horizontalList={{
          count: 0,
          itemClassName: 'h-4 w-4',
          itemTestId: 'horizontal-item',
        }}
      />,
    );

    expect(queryByTestId('horizontal-item')).toBeNull();
    expect(container).toBeEmptyDOMElement();
  });
});
