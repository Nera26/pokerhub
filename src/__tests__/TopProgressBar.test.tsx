import { render, act, waitFor } from '@testing-library/react';
import TopProgressBar from '@/app/components/ui/TopProgressBar';
import { useTopLoader } from 'nextjs-toploader';

let loader: ReturnType<typeof useTopLoader>;
function Capture() {
  loader = useTopLoader();
  return null;
}

describe('TopProgressBar', () => {
  it('renders and hides the top loader', async () => {
    render(
      <>
        <TopProgressBar />
        <Capture />
      </>,
    );

    act(() => {
      loader.start();
    });
    expect(document.getElementById('nprogress')).toBeInTheDocument();

    act(() => {
      loader.done();
    });
    await waitFor(() =>
      expect(document.getElementById('nprogress')).not.toBeInTheDocument(),
    );
  });
});
