import { render } from '@testing-library/react';
import RouteSkeleton from '@/components/RouteSkeleton';

describe('RouteSkeleton', () => {
  it('renders wrapper, children, and grid', () => {
    const { container } = render(
      <RouteSkeleton rows={1} cardHeight="h-10">
        <div className="placeholder" />
      </RouteSkeleton>,
    );
    expect(container).toMatchSnapshot();
  });

  it('renders wrapper and grid without children', () => {
    const { container } = render(<RouteSkeleton rows={1} cardHeight="h-10" />);
    expect(container).toMatchSnapshot();
  });
});
