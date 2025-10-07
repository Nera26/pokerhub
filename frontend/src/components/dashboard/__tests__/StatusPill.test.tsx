import { render } from '@testing-library/react';
import StatusPill from '../common/status-pill';
import { bonusStyles } from '../bonus-manager';

describe('StatusPill mappings', () => {
  it.each(Object.entries(bonusStyles))(
    'renders bonus status %s with correct style',
    (status, className) => {
      const label = status.toUpperCase();
      const { getByText } = render(
        <StatusPill label={label} className={className} />,
      );
      const pill = getByText(label);
      className.split(' ').forEach((c) => expect(pill).toHaveClass(c));
    },
  );
});
