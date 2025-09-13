import { screen } from '@testing-library/react';
import { renderPage, setSearchParams, replace } from './adminNavTabs.test';

describe('dashboard tab navigation', () => {
  beforeEach(() => {
    replace.mockClear();
  });

  it('renders tournaments module when tab=tournaments', async () => {
    setSearchParams('tab=tournaments');
    renderPage();
    expect(await screen.findByText('Tournaments Module')).toBeInTheDocument();
  });
});
