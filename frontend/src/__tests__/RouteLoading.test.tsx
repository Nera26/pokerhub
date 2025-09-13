import { render } from '@testing-library/react';
import RouteLoading from '@/components/RouteLoading';

describe('RouteLoading', () => {
  it('renders wrapper and children', () => {
    const { container } = render(
      <RouteLoading>
        <div className="placeholder" />
      </RouteLoading>,
    );
    expect(container).toMatchSnapshot();
  });

  it('renders wrapper without children', () => {
    const { container } = render(<RouteLoading />);
    expect(container).toMatchSnapshot();
  });
});
